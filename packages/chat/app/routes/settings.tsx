import { authkitLoader, withAuth } from "@workos-inc/authkit-react-router";
import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, useFetcher, useLoaderData } from "react-router";
import { z } from "zod";
import * as AlertDialog from "../vendor/design-system/components/alert-dialog";
import { Badge } from "../vendor/design-system/components/badge";
import { Button } from "../vendor/design-system/components/button";
import { Callout } from "../vendor/design-system/components/callout";
import { Card } from "../vendor/design-system/components/card";
import { Code } from "../vendor/design-system/components/code";
import { Flex } from "../vendor/design-system/components/flex";
import { Heading } from "../vendor/design-system/components/heading";
import * as Select from "../vendor/design-system/components/select";
import { Separator } from "../vendor/design-system/components/separator";
import { Spinner } from "../vendor/design-system/components/spinner";
import { Text } from "../vendor/design-system/components/text";
import * as TextField from "../vendor/design-system/components/text-field";
import type { WorkOSOrganization } from "../lib/audit-logs.server";
import { listOrganizations } from "../lib/audit-logs.server";
import type { AuditChatEnv } from "../lib/config.server";
import { configureAuthKit, emailAllowed, getTenantConfig } from "../lib/config.server";
import type { WriteResult } from "../lib/proxy-settings.server";
import {
  isValidDeviceSerial,
  listDeviceUsers,
  pauseIngest,
  purgeAllDeviceUsers,
  purgeDeviceUser,
  readSettingsDocument,
  resolveEffective,
  resumeIngest,
  saveSettings,
} from "../lib/proxy-settings.server";
import type { DeviceUserRow, EffectiveSettings, SettingSource } from "../lib/proxy-settings.shared";
import {
  DEFAULT_CACHE_TTL_SECONDS,
  ORG_ID_RE,
  TTL_MAX_SECONDS,
  TTL_MIN_SECONDS,
  UNASSIGNED_SENTINEL_TTL_SECONDS,
} from "../lib/proxy-settings.shared";

export async function loader(args: LoaderFunctionArgs) {
  const env = args.context.cloudflare.env as AuditChatEnv;
  configureAuthKit(env);
  const tenant = getTenantConfig(env);
  return authkitLoader(
    args,
    async ({ auth }) => {
      if (!emailAllowed(auth.user.email, tenant)) {
        throw new Response("This account is not allowed to use the audit console.", {
          status: 403,
        });
      }
      const envOrgId = env.AUDIT_HARNESS_WORKOS_ORG_ID ?? null;
      const [organizations, settings, devices] = await Promise.all([
        listOrganizations(tenant.apiKey),
        readSettingsDocument(env.PROXY_DB),
        listDeviceUsers(env.PROXY_DB),
      ]);
      return {
        effective: resolveEffective(settings, envOrgId),
        version: settings.version,
        storeAvailable: settings.storeAvailable,
        malformed: settings.malformed,
        organizations,
        devices,
        envOrgId,
        secretsPresence: {
          workosApiKey: Boolean(env.AUDIT_CHAT_WORKOS_API_KEY ?? env.AUDIT_HARNESS_WORKOS_API_KEY),
        },
        environmentLabel: tenant.environmentLabel,
      };
    },
    { ensureSignedIn: true },
  );
}

// Every action outcome is a plain object: fetchers render these directly, and
// a bare Response body (e.g. "Unauthorized") would crash the `"error" in data`
// checks client-side.
type ActionResult = { ok: string } | { error: string };

const CONFLICT_ERROR = "Settings changed in another session. Reload the page and try again.";
const STORE_UNAVAILABLE_ERROR =
  "The proxy settings store is not reachable from this app. In local dev the proxy database " +
  "is a separate empty copy — apply the proxy's migrations to the local PROXY_DB to test writes.";
const MALFORMED_ERROR =
  "The stored settings document is not valid JSON, so saving is disabled to avoid overwriting " +
  "it. Inspect and repair the app_state row 'proxy_settings' in the proxy database, or delete " +
  "the row to start fresh.";

const AUTO_RESUME_SECONDS: Record<string, number | null> = {
  "1h": 3_600,
  "4h": 14_400,
  "24h": 86_400,
  manual: null,
};

function writeError(result: Extract<WriteResult, { ok: false }>): ActionResult {
  if (result.reason === "conflict") return { error: CONFLICT_ERROR };
  if (result.reason === "malformed") return { error: MALFORMED_ERROR };
  return { error: STORE_UNAVAILABLE_ERROR };
}

export async function action(args: ActionFunctionArgs): Promise<ActionResult> {
  const env = args.context.cloudflare.env as AuditChatEnv;
  configureAuthKit(env);
  const tenant = getTenantConfig(env);

  // Re-run the full gate per request — never inherited from the loader.
  const auth = await withAuth(args as unknown as LoaderFunctionArgs);
  if (!auth.user) return { error: "Your session has expired. Reload the page and sign in again." };
  if (!emailAllowed(auth.user.email, tenant)) {
    return { error: "This account is not allowed to change the proxy settings." };
  }

  // Belt-and-braces same-origin check on top of the SameSite session cookie.
  const origin = args.request.headers.get("Origin");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      // Malformed Origin header — treat as cross-origin.
    }
    if (originHost !== new URL(args.request.url).host) {
      return { error: "Cross-origin requests are not allowed." };
    }
  }

  const formData = await args.request.formData();
  const intent = formData.get("intent");
  const editor = auth.user.email ?? auth.user.id;

  if (intent === "purge-device") {
    const serial = String(formData.get("serial") ?? "");
    if (!isValidDeviceSerial(serial)) {
      return { error: "That device serial is not valid." };
    }
    try {
      await purgeDeviceUser(env.PROXY_DB, serial);
    } catch (error) {
      console.error("purge device failed", String(error));
      return { error: STORE_UNAVAILABLE_ERROR };
    }
    return { ok: `Purged the cached mapping for ${serial}.` };
  }

  if (intent === "purge-all-devices") {
    let count: number;
    try {
      count = await purgeAllDeviceUsers(env.PROXY_DB);
    } catch (error) {
      console.error("purge all devices failed", String(error));
      return { error: STORE_UNAVAILABLE_ERROR };
    }
    return { ok: `Purged all ${count} cached device mappings.` };
  }

  // Everything below is a settings-document mutation: read fresh, CAS-write.
  const current = await readSettingsDocument(env.PROXY_DB);
  if (!current.storeAvailable) return { error: STORE_UNAVAILABLE_ERROR };
  if (current.malformed) return { error: MALFORMED_ERROR };

  if (intent === "save-settings") {
    // The client edited against the version it loaded; a newer stored version
    // means someone else saved in between.
    const clientVersion = Number(formData.get("version"));
    if (!Number.isInteger(clientVersion) || clientVersion !== current.version) {
      return { error: CONFLICT_ERROR };
    }

    const patch: {
      workosOrgId?: string;
      deviceCacheTtlSeconds?: string;
      unassignedDevicePolicy?: "reject" | "placeholder";
    } = {};

    if (formData.has("workos_org_id")) {
      const orgId = String(formData.get("workos_org_id"));
      if (orgId !== "") {
        if (!ORG_ID_RE.test(orgId)) {
          return { error: "The organization id must look like org_… ." };
        }
        // listOrganizations throws on WorkOS API failures; keep the
        // object-only action contract instead of hitting the error boundary.
        let organizations: WorkOSOrganization[];
        try {
          organizations = await listOrganizations(tenant.apiKey);
        } catch (error) {
          console.error("organization validation failed", String(error));
          return {
            error: "Could not verify the organization against WorkOS right now. Try saving again.",
          };
        }
        if (!organizations.some((org) => org.id === orgId)) {
          return {
            error: "This organization id does not exist in the current WorkOS environment.",
          };
        }
      }
      patch.workosOrgId = orgId;
    }

    if (formData.has("unassigned_device_policy")) {
      const policy = String(formData.get("unassigned_device_policy"));
      if (policy !== "reject" && policy !== "placeholder") {
        return { error: "The unassigned-device policy must be reject or placeholder." };
      }
      patch.unassignedDevicePolicy = policy;
    }

    if (formData.has("device_cache_ttl_seconds")) {
      const raw = String(formData.get("device_cache_ttl_seconds")).trim();
      if (raw !== "") {
        const ttl = z.coerce
          .number()
          .int()
          .min(TTL_MIN_SECONDS)
          .max(TTL_MAX_SECONDS)
          .safeParse(raw);
        if (!ttl.success) {
          return {
            error: `The cache TTL must be a whole number between ${TTL_MIN_SECONDS} and ${TTL_MAX_SECONDS} seconds.`,
          };
        }
      }
      patch.deviceCacheTtlSeconds = raw;
    }

    const result = await saveSettings(env.PROXY_DB, current, patch, editor);
    if (!result.ok) return writeError(result);
    return { ok: "Settings saved. The proxy applies them to the next ingested event." };
  }

  if (intent === "pause-ingest") {
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason || reason.length > 200) {
      return { error: "A reason (at most 200 characters) is required to pause ingestion." };
    }
    const autoResumeChoice = String(formData.get("auto_resume") ?? "");
    // Object.hasOwn, not `in`: inherited keys like "constructor" must not pass.
    if (!Object.hasOwn(AUTO_RESUME_SECONDS, autoResumeChoice)) {
      return { error: "Pick when ingestion should resume automatically." };
    }
    const seconds = AUTO_RESUME_SECONDS[autoResumeChoice];
    const autoResumeAt =
      seconds === null ? null : new Date(Date.now() + seconds * 1000).toISOString();
    const result = await pauseIngest(env.PROXY_DB, current, reason, autoResumeAt, editor);
    if (!result.ok) return writeError(result);
    return { ok: "Ingestion paused." };
  }

  if (intent === "resume-ingest") {
    const result = await resumeIngest(env.PROXY_DB, current, editor);
    if (!result.ok) return writeError(result);
    return { ok: "Ingestion resumed." };
  }

  return { error: "Unknown action." };
}

function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  return iso
    .replace("T", " ")
    .replace(/\.\d+Z?$/, "")
    .slice(0, 16);
}

/** device_user.updated is epoch SECONDS (not ms, not ISO). */
function relativeAge(epochSeconds: number): string {
  const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000 - epochSeconds));
  if (diffSeconds < 60) return "just now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function actionError(data: ActionResult | undefined): string | undefined {
  if (data && typeof data === "object" && "error" in data) return data.error;
  return undefined;
}

function actionOk(data: ActionResult | undefined): string | undefined {
  if (data && typeof data === "object" && "ok" in data) return data.ok;
  return undefined;
}

function SourceBadge({ source }: { source: SettingSource }) {
  if (source === "override") {
    return (
      <Badge color="purple" size="1">
        Override
      </Badge>
    );
  }
  return (
    <Badge color="gray" size="1">
      {source === "env" ? "Env default" : "Built-in default"}
    </Badge>
  );
}

function FetcherCallouts({ data }: { data: ActionResult | undefined }) {
  const error = actionError(data);
  if (error) {
    return (
      <Callout.Root color="red" size="1">
        <Callout.Text>{error}</Callout.Text>
      </Callout.Root>
    );
  }
  const ok = actionOk(data);
  if (ok) {
    return (
      <Callout.Root color="green" size="1">
        <Callout.Text>{ok}</Callout.Text>
      </Callout.Root>
    );
  }
  return null;
}

const ENV_ORG_SENTINEL = "__env__";

function DeviceRow({ row, ttlSeconds }: { row: DeviceUserRow; ttlSeconds: number }) {
  const fetcher = useFetcher<ActionResult>({ key: `purge-device-${row.serial}` });
  // Sentinel rows (unassigned devices) expire on the proxy's shorter cap, so
  // the stale badge must use the same effective TTL the proxy applies.
  const effectiveTtl =
    row.email === "" ? Math.min(ttlSeconds, UNASSIGNED_SENTINEL_TTL_SECONDS) : ttlSeconds;
  const stale = Date.now() / 1000 - row.updated > effectiveTtl;
  const purging = fetcher.state !== "idle";
  const error = actionError(fetcher.data);
  return (
    <Flex direction="column" gap="1" className="device-row">
      <Flex align="center" justify="between" gap="3">
        <Flex align="center" gap="3" className="min-w-0">
          <Code size="1" color="gray" variant="soft">
            {row.serial}
          </Code>
          <Text size="2" truncate color={row.email ? undefined : "gray"}>
            {row.email || "(unassigned)"}
          </Text>
          {row.name ? (
            <Text size="1" color="gray" truncate>
              {row.name}
            </Text>
          ) : null}
        </Flex>
        <Flex align="center" gap="3">
          {stale ? (
            <Badge color="yellow" size="1">
              stale
            </Badge>
          ) : null}
          <Text size="1" color="gray" className="font-mono">
            refreshed {relativeAge(row.updated)}
          </Text>
          <fetcher.Form method="post">
            <Button
              size="1"
              variant="ghost"
              color="red"
              type="submit"
              name="intent"
              value="purge-device"
              disabled={purging}
            >
              {purging ? <Spinner size="1" /> : null}
              Purge
            </Button>
            <input type="hidden" name="serial" value={row.serial} />
          </fetcher.Form>
        </Flex>
      </Flex>
      {error ? (
        <Text size="1" color="red">
          {error}
        </Text>
      ) : null}
    </Flex>
  );
}

interface AttributionCardProps {
  effective: EffectiveSettings;
  organizations: WorkOSOrganization[];
  envOrgId: string | null;
  version: number;
  canWrite: boolean;
}

/**
 * Rendered with key={version} by the parent: whenever the stored document
 * changes (own save, another admin's save picked up by revalidation), this
 * remounts and re-initializes its selects from fresh loader data — so the CAS
 * version submitted always matches the values the admin actually edited
 * against, and a concurrent change can never be silently clobbered.
 */
function AttributionCard({
  effective,
  organizations,
  envOrgId,
  version,
  canWrite,
}: AttributionCardProps) {
  // Stable key: the component remounts on key={version} changes, and a keyless
  // fetcher would be torn down with it — destroying the very success/conflict
  // message a version-bumping save just produced.
  const fetcher = useFetcher<ActionResult>({ key: "proxy-settings-attribution" });
  const overrideOrgId =
    effective.workosOrgId.source === "override" ? effective.workosOrgId.value : null;
  const [orgChoice, setOrgChoice] = useState(overrideOrgId ?? ENV_ORG_SENTINEL);
  const [policyChoice, setPolicyChoice] = useState(effective.unassignedDevicePolicy.value);
  const overrideOrgMissing =
    overrideOrgId !== null && !organizations.some((org) => org.id === overrideOrgId);

  return (
    <Card size="3">
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="save-settings" />
        <input type="hidden" name="version" value={version} />
        <input
          type="hidden"
          name="workos_org_id"
          value={orgChoice === ENV_ORG_SENTINEL ? "" : orgChoice}
        />
        <input type="hidden" name="unassigned_device_policy" value={policyChoice} />
        <Flex direction="column" gap="4">
          <Heading as="h3" size="3">
            Attribution
          </Heading>
          <FetcherCallouts data={fetcher.data} />
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Text size="1" weight="medium">
                WorkOS organization
              </Text>
              <SourceBadge source={effective.workosOrgId.source} />
            </Flex>
            <Select.Root value={orgChoice} onValueChange={setOrgChoice}>
              <Select.Trigger aria-label="WorkOS organization" />
              <Select.Content>
                <Select.Item value={ENV_ORG_SENTINEL}>
                  Use env default ({envOrgId ?? "not set"})
                </Select.Item>
                {overrideOrgMissing && overrideOrgId ? (
                  <Select.Item value={overrideOrgId}>
                    {overrideOrgId} (no longer exists in this environment)
                  </Select.Item>
                ) : null}
                {organizations.map((org) => (
                  <Select.Item key={org.id} value={org.id}>
                    {org.name || org.id} ({org.id})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            {overrideOrgMissing ? (
              <Callout.Root color="yellow" size="1">
                <Callout.Text>
                  The overridden organization {overrideOrgId} no longer exists in this WorkOS
                  environment. Pick a valid organization or reset to the env default.
                </Callout.Text>
              </Callout.Root>
            ) : null}
            <Text size="1" color="gray">
              Every ingested event is attributed to this organization. Effective:{" "}
              <Code size="1">{effective.workosOrgId.value ?? "not configured"}</Code> (
              {effective.workosOrgId.source}). The env default shown is this admin app&apos;s copy
              of AUDIT_HARNESS_WORKOS_ORG_ID; the proxy reads its own copy from the shared Doppler
              config.
            </Text>
          </Flex>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Text size="1" weight="medium">
                Unassigned devices
              </Text>
              <SourceBadge source={effective.unassignedDevicePolicy.source} />
            </Flex>
            <Select.Root
              value={policyChoice}
              onValueChange={(value) => setPolicyChoice(value as "reject" | "placeholder")}
            >
              <Select.Trigger aria-label="Unassigned device policy" />
              <Select.Content>
                <Select.Item value="reject">Reject events (403) — default</Select.Item>
                <Select.Item value="placeholder">Attribute to a placeholder actor</Select.Item>
              </Select.Content>
            </Select.Root>
            <Text size="1" color="gray">
              Applies when Kandji reports no assigned user for a device (loaner or conference
              laptops). Reject keeps strict attribution; placeholder never loses audit signal.
            </Text>
          </Flex>
          <Flex align="center" justify="between" gap="3">
            <Text size="1" color="gray">
              {effective.updatedBy
                ? `Last saved by ${effective.updatedBy} · ${formatStamp(effective.updatedAt)}`
                : "Never saved — all values are environment defaults."}
            </Text>
            <Button size="2" type="submit" disabled={!canWrite || fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? <Spinner size="1" /> : null}
              Save changes
            </Button>
          </Flex>
        </Flex>
      </fetcher.Form>
    </Card>
  );
}

interface CacheTtlFormProps {
  effective: EffectiveSettings;
  version: number;
  canWrite: boolean;
}

/** Rendered with key={version} for the same CAS-freshness reason as AttributionCard. */
function CacheTtlForm({ effective, version, canWrite }: CacheTtlFormProps) {
  // Stable key so the result message survives the key={version} remount.
  const fetcher = useFetcher<ActionResult>({ key: "proxy-settings-cache-ttl" });
  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="save-settings" />
      <input type="hidden" name="version" value={version} />
      <Flex direction="column" gap="4">
        <Heading as="h3" size="3">
          Kandji device cache
        </Heading>
        <FetcherCallouts data={fetcher.data} />
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Text size="1" weight="medium">
              Cache TTL (seconds)
            </Text>
            <SourceBadge source={effective.deviceCacheTtlSeconds.source} />
          </Flex>
          <TextField.Root
            name="device_cache_ttl_seconds"
            type="number"
            min={TTL_MIN_SECONDS}
            max={TTL_MAX_SECONDS}
            defaultValue={
              effective.deviceCacheTtlSeconds.source === "override"
                ? String(effective.deviceCacheTtlSeconds.value)
                : ""
            }
            placeholder={`${DEFAULT_CACHE_TTL_SECONDS} (default — 24 hours)`}
          />
          <Text size="1" color="gray">
            How long a device-to-user mapping is trusted before re-asking Kandji. {TTL_MIN_SECONDS}–
            {TTL_MAX_SECONDS} seconds; leave empty for the default. To refresh one laptop
            immediately, purge its row below instead of lowering the TTL.
          </Text>
        </Flex>
        <Flex justify="end">
          <Button size="2" type="submit" disabled={!canWrite || fetcher.state !== "idle"}>
            {fetcher.state !== "idle" ? <Spinner size="1" /> : null}
            Save changes
          </Button>
        </Flex>
      </Flex>
    </fetcher.Form>
  );
}

export default function Settings() {
  const {
    user,
    effective,
    version,
    storeAvailable,
    malformed,
    organizations,
    devices,
    envOrgId,
    secretsPresence,
    environmentLabel,
  } = useLoaderData<typeof loader>();

  const pauseFetcher = useFetcher<ActionResult>({ key: "proxy-settings-pause" });
  const purgeAllFetcher = useFetcher<ActionResult>({ key: "proxy-settings-purge-all" });

  const [pauseOpen, setPauseOpen] = useState(false);
  const [purgeAllOpen, setPurgeAllOpen] = useState(false);
  const [autoResumeChoice, setAutoResumeChoice] = useState("4h");

  useEffect(() => {
    if (pauseFetcher.state === "idle" && actionOk(pauseFetcher.data)) setPauseOpen(false);
  }, [pauseFetcher.state, pauseFetcher.data]);

  useEffect(() => {
    if (purgeAllFetcher.state === "idle" && actionOk(purgeAllFetcher.data)) setPurgeAllOpen(false);
  }, [purgeAllFetcher.state, purgeAllFetcher.data]);

  const canWrite = storeAvailable && !malformed;
  const ttlSeconds = effective.deviceCacheTtlSeconds.value;

  return (
    <Flex direction="column" className="console-root">
      <header className="console-header">
        <Flex align="center" justify="between" px="5" py="3" gap="4">
          <Flex align="center" gap="3">
            <span className="console-glyph" aria-hidden />
            <Heading as="h1" size="3" className="console-title">
              Audit Chat
            </Heading>
            <Badge color={environmentLabel === "production" ? "purple" : "yellow"} size="1">
              {environmentLabel}
            </Badge>
          </Flex>
          <Flex align="center" gap="3">
            <Button asChild size="1" variant="ghost" color="gray">
              <Link to="/">Back to console</Link>
            </Button>
            <Text size="1" color="gray">
              {user.email}
            </Text>
            <Form method="post" action="/logout">
              <Button size="1" variant="ghost" color="gray" type="submit">
                Sign out
              </Button>
            </Form>
          </Flex>
        </Flex>
      </header>

      <div className="console-scroll">
        <Flex direction="column" gap="5" className="settings-column">
          <Flex direction="column" gap="2">
            <Heading as="h2" size="6">
              Proxy settings
            </Heading>
            <Text size="2" color="gray">
              Runtime configuration for <Code size="1">cd26-workos-audit-proxy</Code>, the harness
              audit ingestion proxy. Changes apply to the next ingested event — no redeploy.
            </Text>
          </Flex>

          {!storeAvailable ? (
            <Callout.Root color="yellow" size="1">
              <Callout.Text>
                Showing environment defaults read-only — the proxy settings store is not reachable
                from this app. In local dev the proxy database is a separate empty copy; apply the
                proxy&apos;s migrations to the local PROXY_DB to test writes.
              </Callout.Text>
            </Callout.Root>
          ) : null}

          {malformed ? (
            <Callout.Root color="yellow" size="1">
              <Callout.Text>{MALFORMED_ERROR}</Callout.Text>
            </Callout.Root>
          ) : null}

          {effective.paused && effective.pause ? (
            <Callout.Root color="red" size="1">
              <Callout.Text>
                Ingestion is paused — the proxy answers 503 to every agent, and events from clients
                that do not retry are being lost. Paused by {effective.pause.pausedBy ?? "unknown"}{" "}
                at {formatStamp(effective.pause.pausedAt)}
                {effective.pause.reason ? `: “${effective.pause.reason}”` : ""}.
                {effective.pause.autoResumeAt
                  ? ` Resumes automatically at ${formatStamp(effective.pause.autoResumeAt)}.`
                  : " It stays paused until resumed manually."}{" "}
                The pause is best-effort: during a proxy database outage the proxy keeps ingesting.
              </Callout.Text>
            </Callout.Root>
          ) : null}

          {/* Ingestion status */}
          <Card size="3">
            <Flex direction="column" gap="4">
              <Flex align="center" justify="between" gap="3">
                <Flex direction="column" gap="1">
                  <Heading as="h3" size="3">
                    Ingestion
                  </Heading>
                  <Text size="1" color="gray">
                    The proxy accepts events from device-attested laptops and forwards them to
                    WorkOS Audit Logs.
                  </Text>
                </Flex>
                {effective.paused ? (
                  <Badge color="red" size="2">
                    Paused
                  </Badge>
                ) : (
                  <Badge color="green" size="2">
                    Ingesting
                  </Badge>
                )}
              </Flex>
              <FetcherCallouts data={pauseFetcher.data} />
              {effective.paused ? (
                <pauseFetcher.Form method="post">
                  <Flex justify="end">
                    <Button
                      size="2"
                      type="submit"
                      name="intent"
                      value="resume-ingest"
                      disabled={!canWrite || pauseFetcher.state !== "idle"}
                    >
                      {pauseFetcher.state !== "idle" ? <Spinner size="1" /> : null}
                      Resume ingestion
                    </Button>
                  </Flex>
                </pauseFetcher.Form>
              ) : (
                <Flex justify="end">
                  <AlertDialog.Root open={pauseOpen} onOpenChange={setPauseOpen}>
                    <AlertDialog.Trigger>
                      <Button size="2" color="red" variant="soft" disabled={!canWrite}>
                        Pause ingestion
                      </Button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Content size="2">
                      <pauseFetcher.Form method="post">
                        <Flex direction="column" gap="4">
                          <AlertDialog.Header
                            title="Pause audit ingestion?"
                            description="Devices receive 503 until resumed. Events from clients that do not retry will be lost."
                            error={actionError(pauseFetcher.data)}
                          />
                          <Flex direction="column" gap="2">
                            <Text as="label" size="1" weight="medium" htmlFor="pause-reason">
                              Reason
                            </Text>
                            <TextField.Root
                              id="pause-reason"
                              name="reason"
                              placeholder="e.g. Rotating the WorkOS API key"
                              required
                              maxLength={200}
                            />
                          </Flex>
                          <Flex direction="column" gap="2">
                            <Text size="1" weight="medium">
                              Resume automatically
                            </Text>
                            <Select.Root
                              value={autoResumeChoice}
                              onValueChange={setAutoResumeChoice}
                            >
                              <Select.Trigger aria-label="Resume automatically" />
                              <Select.Content>
                                <Select.Item value="1h">In 1 hour</Select.Item>
                                <Select.Item value="4h">In 4 hours</Select.Item>
                                <Select.Item value="24h">In 24 hours</Select.Item>
                                <Select.Item value="manual">Only when resumed manually</Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </Flex>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel>
                              <Button variant="soft" color="gray" type="button">
                                Keep ingesting
                              </Button>
                            </AlertDialog.Cancel>
                            <Button
                              color="red"
                              type="submit"
                              disabled={pauseFetcher.state !== "idle"}
                            >
                              {pauseFetcher.state !== "idle" ? <Spinner size="1" /> : null}
                              Pause ingestion
                            </Button>
                          </AlertDialog.Footer>
                          {/* Hidden inputs stay below the visible fields: the dialog
                              autofocuses its first <input>, which must be the reason. */}
                          <input type="hidden" name="intent" value="pause-ingest" />
                          <input type="hidden" name="auto_resume" value={autoResumeChoice} />
                        </Flex>
                      </pauseFetcher.Form>
                    </AlertDialog.Content>
                  </AlertDialog.Root>
                </Flex>
              )}
            </Flex>
          </Card>

          <AttributionCard
            key={`attribution-${version}`}
            effective={effective}
            organizations={organizations}
            envOrgId={envOrgId}
            version={version}
            canWrite={canWrite}
          />

          {/* Kandji device cache */}
          <Card size="3">
            <Flex direction="column" gap="4">
              <CacheTtlForm
                key={`ttl-${version}`}
                effective={effective}
                version={version}
                canWrite={canWrite}
              />

              <Separator size="4" />

              <Flex align="center" justify="between" gap="3">
                <Flex align="center" gap="2">
                  <Heading as="h3" size="3">
                    Cached mappings
                  </Heading>
                  <Badge color="gray" size="1">
                    {devices.total} device{devices.total === 1 ? "" : "s"}
                  </Badge>
                </Flex>
                <AlertDialog.Root open={purgeAllOpen} onOpenChange={setPurgeAllOpen}>
                  <AlertDialog.Trigger>
                    <Button
                      size="1"
                      color="red"
                      variant="soft"
                      disabled={!devices.available || devices.total === 0}
                    >
                      Purge all cached mappings
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Content>
                    <purgeAllFetcher.Form method="post">
                      <Flex direction="column" gap="4">
                        <AlertDialog.Header
                          title="Purge all cached device mappings?"
                          description="The next event from every device triggers a fresh Kandji lookup. No audit events are lost, but ingestion is briefly slower and Kandji load spikes."
                          error={actionError(purgeAllFetcher.data)}
                        />
                        <AlertDialog.Footer>
                          <AlertDialog.Cancel>
                            <Button variant="soft" color="gray" type="button">
                              Keep cache
                            </Button>
                          </AlertDialog.Cancel>
                          <Button
                            color="red"
                            type="submit"
                            name="intent"
                            value="purge-all-devices"
                            disabled={purgeAllFetcher.state !== "idle"}
                          >
                            {purgeAllFetcher.state !== "idle" ? <Spinner size="1" /> : null}
                            Purge all mappings
                          </Button>
                        </AlertDialog.Footer>
                      </Flex>
                    </purgeAllFetcher.Form>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </Flex>
              <FetcherCallouts data={purgeAllFetcher.data} />
              {!devices.available ? (
                <Callout.Root color="yellow" size="1">
                  <Callout.Text>The device cache table could not be read.</Callout.Text>
                </Callout.Root>
              ) : devices.rows.length === 0 ? (
                <Text size="2" color="gray">
                  No cached device mappings yet. Entries appear after the proxy ingests an event
                  from a device.
                </Text>
              ) : (
                <Flex direction="column" gap="3">
                  {devices.rows.map((row) => (
                    <DeviceRow key={row.serial} row={row} ttlSeconds={ttlSeconds} />
                  ))}
                  {devices.total > devices.rows.length ? (
                    <Text size="1" color="gray">
                      Showing the {devices.rows.length} most recently refreshed of {devices.total}{" "}
                      mappings.
                    </Text>
                  ) : null}
                </Flex>
              )}
            </Flex>
          </Card>

          {/* Secrets */}
          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading as="h3" size="3">
                Secrets
              </Heading>
              <Flex align="center" justify="between" gap="3">
                <Code size="1">AUDIT_HARNESS_WORKOS_API_KEY</Code>
                {secretsPresence.workosApiKey ? (
                  <Badge color="green" size="1">
                    Set via Doppler
                  </Badge>
                ) : (
                  <Badge color="red" size="1">
                    Missing
                  </Badge>
                )}
              </Flex>
              <Flex align="center" justify="between" gap="3">
                <Code size="1">AUDIT_HARNESS_KANDJI_API_TOKEN</Code>
                <Badge color="gray" size="1">
                  Managed in the proxy Doppler config
                </Badge>
              </Flex>
              <Text size="1" color="gray">
                Secrets are managed in the claude-day Doppler project and synced by CI. They are
                never stored in this database and cannot be viewed or changed here.
              </Text>
            </Flex>
          </Card>
        </Flex>
      </div>
    </Flex>
  );
}
