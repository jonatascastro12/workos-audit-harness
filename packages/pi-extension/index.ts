import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { WorkOS } from "@workos-inc/node";
import type { AgentMessage, ImageContent } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { emitEvent as auditCoreEmitEvent, emitEvents } from "@workos-inc/audit-core/emit-event";
import { createEventBatcher } from "@workos-inc/audit-core/event-batcher";
import { queryAuditLogs as auditCoreQuery } from "@workos-inc/audit-core/audit-query";
import { ensureOrganization as auditCoreEnsureOrg } from "@workos-inc/audit-core/workos-client";
import { createSchema as auditCoreCreateSchema } from "@workos-inc/audit-core/schema";
import { getHarnessAuditSchemaDefinitions } from "@workos-inc/audit-core/harness-schemas";
import { readManagedConfig } from "@workos-inc/audit-core/config";
import { getDeviceCertLabel } from "@workos-inc/audit-core/device-cert";

type MetadataValue = string | number | boolean;
type Metadata = Record<string, MetadataValue>;

type AuditLogTarget = {
  id?: string;
  type?: string;
  name?: string;
  metadata?: unknown;
};

type AuditLogRow = {
  action: string;
  occurredAt?: string;
  actor: {
    id?: string;
    type?: string;
    name?: string;
    metadata?: unknown;
  };
  context: {
    location?: string;
    userAgent?: string;
  };
  metadata?: unknown;
  targets: AuditLogTarget[];
  raw: Record<string, string>;
};

type Config = {
  enabled: boolean;
  loggingEnabled: boolean;
  configured: boolean;
  apiKey?: string;
  organizationId?: string;
  actorId: string;
  actorType: string;
  actorName?: string;
  location: string;
  userAgent: string;
  // null means "explicitly opted out of the proxy" and outranks an MDM-managed
  // value; undefined means "not configured". See audit-core's config loader,
  // which defines the same contract.
  proxyUrl?: string | null;
};

type AuditSchemaPrimitive = "string" | "number" | "boolean";
type AuditSchemaMetadata = Record<string, AuditSchemaPrimitive>;
type AuditSchemaTarget = {
  type: string;
  metadata?: AuditSchemaMetadata;
};
type AuditSchemaDefinition = {
  action: string;
  actor?: {
    metadata?: AuditSchemaMetadata;
  };
  targets: AuditSchemaTarget[];
  metadata?: AuditSchemaMetadata;
  note: string;
};

const CONFIG_KEYS = ["apiKey", "organizationId", "actorId", "actorType", "actorName", "location", "userAgent", "proxyUrl"] as const;
type StoredConfigKey = (typeof CONFIG_KEYS)[number];
type StoredConfig = Partial<Pick<Config, StoredConfigKey>> & {
  enabled?: boolean;
};

const EXTENSION_STATUS_KEY = "workos-audit";
const USER_AGENT = "pi-workos-audit-logs/1";
const DEFAULT_QUERY_RANGE_DAYS = 7;
const DEFAULT_QUERY_MAX_ROWS = 50;
const MAX_QUERY_MAX_ROWS = 200;
const EXPORT_POLL_INTERVAL_MS = 1500;
const EXPORT_POLL_TIMEOUT_MS = 60_000;

type DetectedActor = {
  actorId?: string;
  actorType: string;
  actorName?: string;
};

let detectedActorCache: DetectedActor | undefined;

function getConfigFilePath(): string {
  return process.env.PI_WORKOS_AUDIT_LOGS_CONFIG_PATH
    || path.join(os.homedir(), ".pi", "agent", "extensions", "workos-audit-logs", "config.json");
}

function sanitizeStoredConfig(raw: unknown): StoredConfig {
  if (!raw || typeof raw !== "object") return {};
  const config: StoredConfig = {};
  for (const key of CONFIG_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    // An explicit `"proxyUrl": null` is preserved, not dropped: it is how a
    // single machine opts out of an MDM-managed proxy. Dropping it let the
    // managed value win and made the opt-out silently ineffective.
    if (key === "proxyUrl" && value === null) {
      config.proxyUrl = null;
      continue;
    }
    if (typeof value === "string" && value.trim()) config[key] = value;
  }
  const enabled = parseBooleanValue((raw as Record<string, unknown>).enabled);
  if (enabled !== undefined) config.enabled = enabled;
  return config;
}

function readStoredConfig(): StoredConfig {
  const filePath = getConfigFilePath();
  if (!existsSync(filePath)) return {};
  try {
    return sanitizeStoredConfig(JSON.parse(readFileSync(filePath, "utf8")));
  } catch {
    return {};
  }
}

function writeStoredConfig(config: StoredConfig): void {
  const filePath = getConfigFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  chmodSync(filePath, 0o600);
}

function clearStoredConfig(): void {
  rmSync(getConfigFilePath(), { force: true });
}

function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function parseConfigKey(value: string): StoredConfigKey | undefined {
  const normalized = value.trim();
  return CONFIG_KEYS.find((key) => key === normalized);
}

function summarizeStoredConfig(config: Config, stored: StoredConfig): string {
  const detectedActor = getDetectedActor();
  return JSON.stringify(
    {
      configPath: getConfigFilePath(),
      runtimeEnabled: config.enabled,
      loggingEnabled: config.loggingEnabled,
      configured: config.configured,
      apiKey: maskSecret(config.apiKey),
      organizationId: config.organizationId,
      actorId: config.actorId,
      actorType: config.actorType,
      actorName: config.actorName,
      location: config.location,
      userAgent: config.userAgent,
      sources: {
        loggingEnabled: process.env.PI_WORKOS_AUDIT_LOGS_ENABLED ? "env" : stored.enabled !== undefined ? "file" : "default",
        apiKey: process.env.PI_WORKOS_AUDIT_LOGS_API_KEY || process.env.WORKOS_API_KEY ? "env" : stored.apiKey ? "file" : undefined,
        organizationId: process.env.PI_WORKOS_AUDIT_LOGS_ORGANIZATION_ID ? "env" : stored.organizationId ? "file" : undefined,
        actorId: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_ID ? "env" : stored.actorId ? "file" : detectedActor.actorId ? "machine" : "default",
        actorType: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_TYPE ? "env" : stored.actorType ? "file" : "machine",
        actorName: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_NAME ? "env" : stored.actorName ? "file" : detectedActor.actorName ? "machine" : undefined,
        location: process.env.PI_WORKOS_AUDIT_LOGS_LOCATION ? "env" : stored.location ? "file" : "default",
        userAgent: process.env.PI_WORKOS_AUDIT_LOGS_USER_AGENT ? "env" : stored.userAgent ? "file" : "default",
      },
    },
    null,
    2,
  );
}

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

function byteLength(value: unknown): number {
  return Buffer.byteLength(stableSerialize(value), "utf8");
}

function truncateMetadataString(value: string, maxLength = 500): string {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}

function compactMetadata(metadata: Record<string, MetadataValue | undefined>): Metadata {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined)) as Metadata;
}

function trimToUndefined(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function getOsUsername(): string | undefined {
  try {
    return trimToUndefined(process.env.USER || process.env.USERNAME || os.userInfo().username);
  } catch {
    return trimToUndefined(process.env.USER || process.env.USERNAME);
  }
}

function runCommand(command: string, args: string[]): string | undefined {
  try {
    return trimToUndefined(execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }));
  } catch {
    return undefined;
  }
}

function getGitConfigValue(key: string): string | undefined {
  return runCommand("git", ["config", "--get", key]) || runCommand("git", ["config", "--global", "--get", key]);
}

function getMacFullName(): string | undefined {
  return process.platform === "darwin" ? runCommand("id", ["-F"]) : undefined;
}

function getDetectedActor(): DetectedActor {
  if (detectedActorCache) return detectedActorCache;

  const username = getOsUsername();
  const actorType = process.env.CI ? "system" : "user";
  const actorId = trimToUndefined(
    actorType === "user"
      ? getGitConfigValue("user.email") || process.env.EMAIL || username || os.hostname()
      : process.env.GITHUB_ACTOR || process.env.BUILDKITE_BUILD_CREATOR || process.env.CI_ACTOR || username || os.hostname(),
  );
  const actorName = trimToUndefined(
    actorType === "user"
      ? getGitConfigValue("user.name") || process.env.GIT_AUTHOR_NAME || process.env.GIT_COMMITTER_NAME || process.env.NAME || process.env.FULLNAME || getMacFullName() || username
      : os.hostname(),
  );

  detectedActorCache = {
    actorId,
    actorType,
    actorName,
  };

  return detectedActorCache;
}

function getConfig(): Config {
  const stored = readStoredConfig();
  const detectedActor = getDetectedActor();
  const apiKey = process.env.PI_WORKOS_AUDIT_LOGS_API_KEY || process.env.WORKOS_API_KEY || stored.apiKey;
  const organizationId = process.env.PI_WORKOS_AUDIT_LOGS_ORGANIZATION_ID || stored.organizationId;
  const loggingEnabled = parseBooleanValue(process.env.PI_WORKOS_AUDIT_LOGS_ENABLED) ?? stored.enabled ?? true;
  const actorId = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_ID || stored.actorId || detectedActor.actorId || "unknown";
  const actorType = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_TYPE || stored.actorType || detectedActor.actorType;
  const actorName = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_NAME || stored.actorName || detectedActor.actorName;
  const location = process.env.PI_WORKOS_AUDIT_LOGS_LOCATION || stored.location || "local";
  const userAgent = process.env.PI_WORKOS_AUDIT_LOGS_USER_AGENT || stored.userAgent || USER_AGENT;
  // Lowest layer is the MDM-managed machine config — how a fleet rollout sets
  // the proxy URL without baking a company hostname into the source.
  // `??`-style resolution, not `||`: a stored `null` is a deliberate opt-out and
  // must stop the chain rather than fall through to the managed value.
  const proxyUrl =
    trimToUndefined(process.env.PI_WORKOS_AUDIT_LOGS_PROXY_URL) ??
    trimToUndefined(process.env.WORKOS_AUDIT_PROXY_URL) ??
    (Object.hasOwn(stored, "proxyUrl")
      ? stored.proxyUrl
      : (readManagedConfig() as { proxyUrl?: string }).proxyUrl);
  const configured = true;

  return {
    enabled: configured && loggingEnabled,
    loggingEnabled,
    configured,
    apiKey,
    organizationId,
    actorId,
    actorType,
    actorName,
    location,
    userAgent,
    proxyUrl,
  };
}

/**
 * The persistent footer indicator. Deliberately says whether recording is
 * happening and nothing else — no endpoint, no organization, no actor. It sits
 * on screen for the whole session, often while someone is screen-sharing or
 * recording, and none of that detail is actionable at a glance. Anyone who
 * wants it can run `/workos-audit-status`, which prints `describeConfig`.
 *
 * The one thing worth a distinct state is "configured but not actually
 * recording": without a device certificate the proxy transport skips every
 * event rather than falling back, so showing "on" there would be a lie of
 * exactly the kind this whole harness exists to prevent.
 */
function statusLine(config: Config): string {
  if (!config.loggingEnabled) return "audit: off";
  if (config.proxyUrl && !getDeviceCertLabel()) return "audit: not recording";
  return "audit: on";
}

/**
 * The full picture, for `/workos-audit-status` — an explicit request, so detail
 * is what the caller wants: which transport, and where events actually go.
 */
function describeConfig(config: Config): string {
  if (!config.loggingEnabled) return "audit: off (disabled)";
  if (config.proxyUrl) {
    if (!getDeviceCertLabel()) {
      return `audit: NOT recording — proxy ${config.proxyUrl} configured but no device certificate found`;
    }
    // Under the proxy the actor and organization are stamped server-side, so
    // naming the locally-detected actor here would misreport what is recorded.
    return `audit: on via proxy (mTLS) ${config.proxyUrl}, identity from device certificate`;
  }
  const credentialSource = config.apiKey ? "api key" : "workos cli";
  const orgSource = config.organizationId ? config.organizationId : "auto org: Audit Log Harness";
  return `audit: on via ${credentialSource}, ${orgSource} (${config.actorType}:${config.actorId})`;
}

function createClient(config: Config): WorkOS | undefined {
  if (!config.apiKey) return undefined;
  return new WorkOS(config.apiKey);
}

function auditCoreConfig(config: Config) {
  return {
    apiKey: config.apiKey,
    organizationId: config.organizationId,
    organizationName: undefined,
    apiBaseUrl: undefined,
    // Load-bearing: emitEvent branches on `proxyUrl` FIRST and falls through to
    // the direct api-key path when it is absent. Omitting it here meant this
    // extension resolved the MDM proxy URL, reported "on via proxy (mTLS)", and
    // then emitted straight to WorkOS with a local key — the exact thing the
    // proxy exists to prevent.
    proxyUrl: config.proxyUrl ?? undefined,
  };
}

async function runAuditHarness(config: Config, command: string, payload: any, extraArgs: string[] = []): Promise<unknown> {
  const ac = auditCoreConfig(config);
  switch (command) {
    case "emit-event":
      return await auditCoreEmitEvent(payload, ac);
    case "query":
      return await auditCoreQuery(ac, payload || {});
    case "ensure-organization": {
      const organizationId = await auditCoreEnsureOrg(ac);
      return { organizationId, organizationName: payload?.organizationName };
    }
    case "create-schema":
      return await auditCoreCreateSchema(ac, payload);
    case "seed-generic-schemas": {
      const prefix = (payload && payload.prefix) || "harness";
      const schemas = getHarnessAuditSchemaDefinitions(prefix);
      const created: { action: string }[] = [];
      for (const schema of schemas) {
        await auditCoreCreateSchema(ac, schema);
        created.push({ action: schema.action });
      }
      return { prefix, schemaCount: created.length, created };
    }
    default:
      throw new Error(`Unknown audit-harness command: ${command}`);
  }
}

function getSessionTarget(ctx: ExtensionContext) {
  return {
    id: ctx.sessionManager.getSessionId(),
    type: "session",
  };
}

function getMessageRole(message: AgentMessage): string {
  const role = (message as { role?: string }).role;
  if (role === "toolResult") return "tool";
  return role || "unknown";
}

function getMessageContent(message: AgentMessage): unknown {
  return (message as { content?: unknown }).content;
}

function asContentArray(content: unknown): Array<{ type?: string; text?: string }> {
  if (!Array.isArray(content)) return [];
  return content as Array<{ type?: string; text?: string }>;
}

function getTextSummary(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const block = item as { type?: string; text?: string };
          if (block.type === "text" && typeof block.text === "string") return block.text;
          if (block.type === "image") return "[image]";
        }
        return stableSerialize(item);
      })
      .join("\n");
  }
  return stableSerialize(content);
}

function getImageCount(content: unknown): number {
  return asContentArray(content).filter((item) => item?.type === "image").length;
}

function getToolCallCount(content: unknown): number {
  return asContentArray(content).filter((item) => item?.type === "toolCall").length;
}

function hasImages(images?: ImageContent[]): boolean {
  return Boolean(images && images.length > 0);
}

function getCommandPreview(command: unknown): string | undefined {
  if (typeof command !== "string" || !command.trim()) return undefined;
  return truncateMetadataString(command);
}

function isCommandTruncated(command: unknown, maxLength = 500): boolean | undefined {
  if (typeof command !== "string" || !command.trim()) return undefined;
  return command.length > maxLength;
}

function getBashToolCommand(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  const command = (input as { command?: unknown }).command;
  return typeof command === "string" ? command : undefined;
}

function parseJsonValue(value?: string): unknown {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function getPiAuditSchemaDefinitions(prefix = "pi"): AuditSchemaDefinition[] {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Pi session start events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        cwd: "string",
        session_file: "string",
        previous_session_file: "string",
      },
    },
    {
      action: `${prefix}.session.shutdown`,
      note: "Pi session shutdown events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        target_session_file: "string",
      },
    },
    {
      action: `${prefix}.input.received`,
      note: "User input received by pi.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        text_length: "number",
        text_sha256: "string",
        text_preview: "string",
        text_truncated: "boolean",
        has_images: "boolean",
        image_count: "number",
      },
    },
    {
      action: `${prefix}.agent.started`,
      note: "Pi agent invocation started.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        system_prompt_sha256: "string",
        has_images: "boolean",
      },
    },
    {
      action: `${prefix}.agent.completed`,
      note: "Pi agent invocation completed.",
      targets: [{ type: "session" }],
      metadata: {
        duration_ms: "number",
        turn_count: "number",
        assistant_message_count: "number",
        tool_result_count: "number",
        status: "string",
      },
    },
    {
      action: `${prefix}.message.finalized`,
      note: "Pi finalized a message in the transcript.",
      targets: [
        { type: "session" },
        { type: "message", metadata: { role: "string" } },
      ],
      metadata: {
        role: "string",
        content_length: "number",
        content_sha256: "string",
        has_images: "boolean",
        image_count: "number",
        tool_call_count: "number",
        custom_type: "string",
      },
    },
    {
      action: `${prefix}.tool.called`,
      note: "Pi tool call started.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } },
      ],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        input_sha256: "string",
        input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean",
      },
    },
    {
      action: `${prefix}.tool.completed`,
      note: "Pi tool call completed.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } },
      ],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        is_error: "boolean",
        duration_ms: "number",
        result_sha256: "string",
        result_bytes: "number",
      },
    },
    {
      action: `${prefix}.user_bash.executed`,
      note: "User-triggered bash command execution from pi.",
      targets: [
        { type: "session" },
        { type: "command" },
      ],
      metadata: {
        exclude_from_context: "boolean",
        cwd: "string",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean",
      },
    },
    {
      action: `${prefix}.model.selected`,
      note: "Pi model selection changed.",
      targets: [
        { type: "session" },
        { type: "model", metadata: { provider: "string", model_id: "string" } },
      ],
      metadata: {
        source: "string",
        provider: "string",
        model_id: "string",
        previous_provider: "string",
        previous_model_id: "string",
        thinking_level: "string",
      },
    },
  ];
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];

    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = "";
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char !== '\r') field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ""));
}

function parseAuditLogRows(csv: string): AuditLogRow[] {
  const parsed = parseCsv(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow || headerRow.length === 0) return [];

  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);

  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || ""]));
    const targets = targetIndices
      .map((index) => ({
        id: raw[`target_id_${index}`] || undefined,
        type: raw[`target_type_${index}`] || undefined,
        name: raw[`target_name_${index}`] || undefined,
        metadata: parseJsonValue(raw[`target_metadata_${index}`]),
      }))
      .filter((target) => target.id || target.type || target.name || target.metadata !== undefined);

    return {
      action: raw.action || "",
      occurredAt: raw.occurred_at || undefined,
      actor: {
        id: raw.actor_id || undefined,
        type: raw.actor_type || undefined,
        name: raw.actor_name || undefined,
        metadata: parseJsonValue(raw.actor_metadata),
      },
      context: {
        location: raw.context_location || undefined,
        userAgent: raw.context_user_agent || undefined,
      },
      metadata: parseJsonValue(raw.metadata),
      targets,
      raw,
    };
  });
}

function formatUnknown(value: unknown, maxLength = 280): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = typeof value === "string" ? value : stableSerialize(value);
  return truncateMetadataString(raw, maxLength);
}

function summarizeCounts(values: string[]): string {
  if (values.length === 0) return "none";
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => `${value}=${count}`)
    .join(", ");
}

function formatAuditLogRow(row: AuditLogRow, index: number): string {
  const targetSummary = row.targets.length > 0
    ? row.targets.map((target) => `${target.type || "unknown"}:${target.id || target.name || "unknown"}`).join(", ")
    : "none";
  const metadataSummary = formatUnknown(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || "unknown time"} | action=${row.action}`,
    `   actor=${row.actor.type || "unknown"}:${row.actor.id || row.actor.name || "unknown"}`,
    `   targets=${targetSummary}`,
    metadataSummary ? `   metadata=${metadataSummary}` : undefined,
  ].filter(Boolean).join("\n");
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      reject(new Error("Aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export default function workosAuditLogsExtension(pi: ExtensionAPI): void {
  let config = getConfig();
  let client = createClient(config);
  let warned = false;
  let queue: Promise<void> = Promise.resolve();
  let agentStartedAt: number | null = null;
  let turnCount = 0;
  let toolStartedAt = new Map<string, number>();

  function refreshStatus(ctx?: ExtensionContext): void {
    config = getConfig();
    client = createClient(config);
    if (ctx?.hasUI) ctx.ui.setStatus(EXTENSION_STATUS_KEY, statusLine(config));
  }

  // Coalesce lifecycle events into batched requests. A turn emits input,
  // agent start, one pair per tool call, message end and agent end — each of
  // which used to cost its own process and mTLS handshake (~600ms). Batching a
  // burst takes that to a single request. `send` reads the config at send time
  // rather than closing over it, because refreshStatus() can replace it.
  const batcher = createEventBatcher({
    send: (events) => emitEvents(events, auditCoreConfig(config)),
    onError: (detail) => {
      if (!warned) {
        warned = true;
        console.warn("[workos-audit-logs]", detail);
      }
    },
  });

  function enqueue(task: () => Promise<void>): Promise<void> {
    queue = queue
      .catch(() => undefined)
      .then(task)
      .catch((error) => {
        if (!warned) {
          warned = true;
          console.warn("[workos-audit-logs]", error);
        }
      });
    return queue;
  }

  async function emitEvent(
    action: string,
    ctx: ExtensionContext,
    metadata: Metadata,
    targets: Array<{ id: string; type: string; name?: string; metadata?: Metadata }>,
    occurredAt?: Date,
  ): Promise<void> {
    refreshStatus(ctx);
    if (!config.enabled) return;

    const event = {
      action,
      occurredAt: occurredAt || new Date(),
      actor: {
        id: config.actorId,
        type: config.actorType,
        ...(config.actorName ? { name: config.actorName } : {}),
        metadata: {},
      },
      targets,
      context: {
        location: config.location,
        userAgent: config.userAgent,
      },
      metadata,
    };

    // Buffered, not sent: returns immediately so no lifecycle hook waits on the
    // network. session_shutdown flushes, so an ordinary exit loses nothing.
    batcher.add(event);
  }

  pi.registerCommand("workos-audit-status", {
    description: "Show WorkOS audit log extension configuration status",
    handler: async (_args, ctx) => {
      refreshStatus(ctx);
      const summary = describeConfig(config);
      if (ctx.hasUI) ctx.ui.notify(summary, config.enabled ? "info" : "warning");
      else console.log(summary);
    },
  });

  pi.registerCommand("workos-audit-disable", {
    description: "Disable WorkOS audit event emission without clearing the saved config",
    handler: async (_args, ctx) => {
      const stored = readStoredConfig();
      stored.enabled = false;
      writeStoredConfig(stored);
      refreshStatus(ctx);

      const message = "WorkOS audit event emission disabled. Run /workos-audit-enable to turn it back on.";
      if (ctx.hasUI) ctx.ui.notify(message, "info");
      console.log(message);
    },
  });

  pi.registerCommand("workos-audit-enable", {
    description: "Enable WorkOS audit event emission using the saved config",
    handler: async (_args, ctx) => {
      const stored = readStoredConfig();
      stored.enabled = true;
      writeStoredConfig(stored);
      refreshStatus(ctx);

      const message = config.configured
        ? "WorkOS audit event emission enabled."
        : "WorkOS audit event emission enabled. Run workos auth login (or set apiKey) for credentials; organization defaults to auto-created Audit Log Harness.";
      if (ctx.hasUI) ctx.ui.notify(message, config.configured ? "info" : "warning");
      console.log(message);
    },
  });

  pi.registerCommand("workos-audit-login", {
    description: "Authenticate the WorkOS CLI with browser login for staging Audit Logs API access",
    handler: async (_args, ctx) => {
      const message = "Starting WorkOS browser auth. If the browser does not open, follow the URL/code printed in the terminal.";
      if (ctx.hasUI) ctx.ui.notify(message, "info");
      console.log(message);
      execFileSync("npx", ["--yes", "workos@latest", "auth", "login"], { stdio: "inherit" });
      refreshStatus(ctx);
    },
  });

  pi.registerCommand("workos-audit-ensure-organization", {
    description: "Find or create the default WorkOS Audit Log Harness organization and print its organization ID",
    handler: async (_args, ctx) => {
      refreshStatus(ctx);
      const result = await runAuditHarness(config, "ensure-organization", {}) as { organizationId?: string; organizationName?: string };
      const message = `WorkOS audit organization: ${result.organizationName || "Audit Log Harness"} (${result.organizationId})`;
      if (ctx.hasUI) ctx.ui.notify(message, "info");
      console.log(message);
    },
  });

  pi.registerCommand("workos-audit-config", {
    description: "Configure WorkOS audit logging (/workos-audit-config show|path|edit|set|unset|clear)",
    handler: async (args, ctx) => {
      const [subcommand = "show", ...rest] = args.trim() ? args.trim().split(/\s+/) : [];

      if (subcommand === "path") {
        const filePath = getConfigFilePath();
        const message = `WorkOS audit config path: ${filePath}`;
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        console.log(message);
        return;
      }

      if (subcommand === "show" || !subcommand) {
        refreshStatus(ctx);
        const summary = summarizeStoredConfig(config, readStoredConfig());
        if (ctx.hasUI) ctx.ui.notify(describeConfig(config), config.enabled ? "info" : "warning");
        console.log(summary);
        return;
      }

      if (subcommand === "clear") {
        if (ctx.hasUI) {
          const ok = await ctx.ui.confirm("Clear WorkOS audit config", `Delete ${getConfigFilePath()}?`);
          if (!ok) return;
        }
        clearStoredConfig();
        refreshStatus(ctx);
        const message = "WorkOS audit config cleared";
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        console.log(message);
        return;
      }

      if (subcommand === "unset") {
        const key = parseConfigKey(rest[0] || "");
        if (!key) {
          const message = `Unknown key. Use one of: ${CONFIG_KEYS.join(", ")}`;
          if (ctx.hasUI) ctx.ui.notify(message, "warning");
          console.log(message);
          return;
        }
        const stored = readStoredConfig();
        delete stored[key];
        writeStoredConfig(stored);
        refreshStatus(ctx);
        const message = `Unset ${key} in ${getConfigFilePath()}`;
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        console.log(message);
        return;
      }

      if (subcommand === "set") {
        const key = parseConfigKey(rest[0] || "");
        const value = rest.slice(1).join(" ").trim();
        if (!key) {
          const message = `Unknown key. Use one of: ${CONFIG_KEYS.join(", ")}`;
          if (ctx.hasUI) ctx.ui.notify(message, "warning");
          console.log(message);
          return;
        }
        if (!value) {
          const message = `Usage: /workos-audit-config set ${key} <value>`;
          if (ctx.hasUI) ctx.ui.notify(message, "warning");
          console.log(message);
          return;
        }
        const stored = readStoredConfig();
        stored[key] = value;
        writeStoredConfig(stored);
        refreshStatus(ctx);
        const displayValue = key === "apiKey" ? maskSecret(value) : value;
        const message = `Set ${key}=${displayValue}`;
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        console.log(message);
        return;
      }

      if (subcommand === "edit") {
        if (!ctx.hasUI) {
          const message = "Interactive edit requires UI. Use /workos-audit-config set <key> <value> instead.";
          console.log(message);
          return;
        }

        const stored = readStoredConfig();
        const current = getConfig();
        const next: StoredConfig = { ...stored };

        const apiKey = await ctx.ui.input(
          "WorkOS API key",
          current.apiKey ? `${maskSecret(current.apiKey)} (leave blank to keep current)` : "optional; leave blank to use workos auth login",
        );
        if (apiKey === undefined) return;
        if (apiKey.trim()) next.apiKey = apiKey.trim();

        const organizationId = await ctx.ui.input(
          "WorkOS organization ID",
          current.organizationId || "org_...",
        );
        if (organizationId === undefined) return;
        if (organizationId.trim()) next.organizationId = organizationId.trim();

        const actorId = await ctx.ui.input("Actor ID", current.actorId);
        if (actorId === undefined) return;
        if (actorId.trim()) next.actorId = actorId.trim();

        const actorType = await ctx.ui.input("Actor type", current.actorType);
        if (actorType === undefined) return;
        if (actorType.trim()) next.actorType = actorType.trim();

        const actorName = await ctx.ui.input("Actor name (optional)", current.actorName || "leave blank to keep current");
        if (actorName === undefined) return;
        if (actorName.trim()) next.actorName = actorName.trim();

        const location = await ctx.ui.input("Location", current.location);
        if (location === undefined) return;
        if (location.trim()) next.location = location.trim();

        const userAgent = await ctx.ui.input("User agent", current.userAgent);
        if (userAgent === undefined) return;
        if (userAgent.trim()) next.userAgent = userAgent.trim();

        writeStoredConfig(next);
        refreshStatus(ctx);
        ctx.ui.notify(`Saved WorkOS audit config to ${getConfigFilePath()}`, "info");
        console.log(summarizeStoredConfig(getConfig(), next));
        return;
      }

      const message = "Usage: /workos-audit-config show|path|edit|set|unset|clear";
      if (ctx.hasUI) ctx.ui.notify(message, "warning");
      console.log(message);
    },
  });

  pi.registerCommand("workos-audit-seed-schemas", {
    description: "Create WorkOS audit schemas for pi events (/workos-audit-seed-schemas [--prefix=pi] [--dry-run])",
    handler: async (args, ctx) => {
      const tokens = args.trim() ? args.trim().split(/\s+/) : [];
      let prefix = "pi";
      let dryRun = false;
      const unknownArgs: string[] = [];

      for (const token of tokens) {
        if (token === "--dry-run") {
          dryRun = true;
          continue;
        }
        if (token.startsWith("--prefix=")) {
          const value = token.slice("--prefix=".length).trim();
          if (value) prefix = value;
          else unknownArgs.push(token);
          continue;
        }
        unknownArgs.push(token);
      }

      if (unknownArgs.length > 0) {
        const message = "Usage: /workos-audit-seed-schemas [--prefix=pi] [--dry-run]";
        if (ctx.hasUI) ctx.ui.notify(message, "warning");
        console.log(message);
        return;
      }

      refreshStatus(ctx);

      const schemas = getPiAuditSchemaDefinitions(prefix);

      if (dryRun) {
        const preview = JSON.stringify({ prefix, schemaCount: schemas.length, schemas }, null, 2);
        if (ctx.hasUI) ctx.ui.notify(`Prepared ${schemas.length} pi audit schemas for prefix \"${prefix}\"`, "info");
        console.log(preview);
        return;
      }

      if (ctx.hasUI) {
        const ok = await ctx.ui.confirm(
          "Seed WorkOS pi audit schemas",
          `Create ${schemas.length} schema(s) with prefix \"${prefix}\"? Existing actions may get a new schema version.`,
        );
        if (!ok) return;
      }

      const schemaClient = config.apiKey ? new WorkOS(config.apiKey) : undefined;
      const createdSchemas: string[] = [];

      for (const schema of schemas) {
        if (schemaClient) {
          const created = await schemaClient.auditLogs.createSchema({
            action: schema.action,
            actor: schema.actor,
            targets: schema.targets,
            metadata: schema.metadata,
          });
          createdSchemas.push(`${schema.action} -> schema v${created.version}`);
        } else {
          await runAuditHarness(config, "create-schema", schema);
          createdSchemas.push(`${schema.action} -> schema created via workos cli`);
        }
      }

      const message = `Created ${createdSchemas.length} pi audit schema(s) with prefix \"${prefix}\"`;
      if (ctx.hasUI) ctx.ui.notify(message, "info");
      console.log([message, ...createdSchemas].join("\n"));
    },
  });

  pi.registerCommand("workos-audit-seed-harness-schemas", {
    description: "Create generic WorkOS audit schemas for harness events (/workos-audit-seed-harness-schemas [--prefix=pi] [--dry-run])",
    handler: async (args, ctx) => {
      const tokens = args.trim() ? args.trim().split(/\s+/) : [];
      let prefix = "pi";
      let dryRun = false;
      for (const token of tokens) {
        if (token === "--dry-run") dryRun = true;
        else if (token.startsWith("--prefix=")) prefix = token.slice("--prefix=".length) || prefix;
      }
      const result = dryRun
        ? { prefix, schemas: getHarnessAuditSchemaDefinitions(prefix), schemaCount: getHarnessAuditSchemaDefinitions(prefix).length, dryRun: true }
        : await runAuditHarness(config, "seed-generic-schemas", { prefix });
      const message = JSON.stringify(result, null, 2);
      if (ctx.hasUI) ctx.ui.notify(dryRun ? "Prepared generic harness schemas" : "Created generic harness schemas", "info");
      console.log(message);
    },
  });

  pi.registerTool({
    name: "workos_audit_query",
    label: "WorkOS Audit Query",
    description: "Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows for answering questions about audit activity.",
    promptSnippet: "Query WorkOS audit logs by exporting filtered events and returning aggregate summaries plus sample rows.",
    promptGuidelines: [
      "Use workos_audit_query when the user asks questions about WorkOS audit logs or past pi audit activity.",
      "When using workos_audit_query, derive rangeStart and rangeEnd from the user's timeframe if specified; otherwise prefer the tool's bounded recent default window.",
      "When using workos_audit_query, pass action, actor, and target filters whenever the question clearly implies them to reduce export size and improve answer quality.",
    ],
    parameters: Type.Object({
      question: Type.String({ description: "The user's audit-log question." }),
      rangeStart: Type.Optional(Type.String({ description: "ISO-8601 start time. If omitted, defaults to 7 days before rangeEnd." })),
      rangeEnd: Type.Optional(Type.String({ description: "ISO-8601 end time. If omitted, defaults to now." })),
      actions: Type.Optional(Type.Array(Type.String({ description: "Audit action filter, e.g. pi.tool.called" }))),
      actorIds: Type.Optional(Type.Array(Type.String({ description: "Actor ID filter." }))),
      actorNames: Type.Optional(Type.Array(Type.String({ description: "Actor name filter." }))),
      targets: Type.Optional(Type.Array(Type.String({ description: "Target type filter, e.g. session, tool, message, model" }))),
      maxRows: Type.Optional(Type.Integer({ description: "Maximum number of parsed rows to return in the sample output (1-200, default 50)." })),
    }),
    async execute(_toolCallId, params, signal, onUpdate) {
      refreshStatus();
      onUpdate?.({ content: [{ type: "text", text: `Creating WorkOS audit export via the Audit Log Harness for: ${params.question}` }] });
      const harnessResult = await runAuditHarness(config, "query", params) as { text?: string; details?: unknown };
      return {
        content: [{ type: "text", text: harnessResult.text || JSON.stringify(harnessResult, null, 2) }],
        details: harnessResult.details,
      };

      const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date();
      if (Number.isNaN(rangeEnd.getTime())) throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);

      const rangeStart = params.rangeStart
        ? new Date(params.rangeStart)
        : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000);
      if (Number.isNaN(rangeStart.getTime())) throw new Error(`Invalid rangeStart: ${params.rangeStart}`);
      if (rangeStart.getTime() > rangeEnd.getTime()) throw new Error("rangeStart must be before rangeEnd");

      const maxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS, params.maxRows || DEFAULT_QUERY_MAX_ROWS));
      const filters = {
        organizationId: config.organizationId,
        rangeStart,
        rangeEnd,
        ...(params.actions?.length ? { actions: params.actions } : {}),
        ...(params.actorIds?.length ? { actorIds: params.actorIds } : {}),
        ...(params.actorNames?.length ? { actorNames: params.actorNames } : {}),
        ...(params.targets?.length ? { targets: params.targets } : {}),
      };

      onUpdate?.({
        content: [{ type: "text", text: `Creating WorkOS audit export for: ${params.question}` }],
        details: { filters: { ...filters, rangeStart: rangeStart.toISOString(), rangeEnd: rangeEnd.toISOString() } },
      });

      let auditExport = await client.auditLogs.createExport(filters);
      const pollDeadline = Date.now() + EXPORT_POLL_TIMEOUT_MS;

      while (auditExport.state === "pending") {
        if (signal?.aborted) throw new Error("Aborted");
        if (Date.now() > pollDeadline) throw new Error(`Timed out waiting for audit export ${auditExport.id}`);

        onUpdate?.({
          content: [{ type: "text", text: `Waiting for WorkOS audit export ${auditExport.id}...` }],
          details: { exportId: auditExport.id, state: auditExport.state },
        });
        await sleep(EXPORT_POLL_INTERVAL_MS, signal);
        auditExport = await client.auditLogs.getExport(auditExport.id);
      }

      if (auditExport.state !== "ready" || !auditExport.url) {
        throw new Error(`Audit export ${auditExport.id} finished in unexpected state: ${auditExport.state}`);
      }

      const response = await fetch(auditExport.url, { signal });
      if (!response.ok) throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
      const csv = await response.text();
      const csvPath = path.join(os.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
      writeFileSync(csvPath, csv, "utf8");

      const rows = parseAuditLogRows(csv)
        .sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
      const sampleRows = rows.slice(0, maxRows);
      const actionSummary = summarizeCounts(rows.map((row) => row.action).filter(Boolean));
      const actorSummary = summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || "unknown"));
      const targetSummary = summarizeCounts(rows.flatMap((row) => row.targets.map((target) => target.type || "unknown")));

      const content = [
        `Question: ${params.question}`,
        `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
        `Export ID: ${auditExport.id}`,
        `Rows: ${rows.length}`,
        `Action counts: ${actionSummary}`,
        `Actor counts: ${actorSummary}`,
        `Target type counts: ${targetSummary}`,
        `Full CSV saved to: ${csvPath}`,
        rows.length === 0 ? "No matching audit log rows found." : `Sample rows (newest first, up to ${maxRows}):`,
        ...sampleRows.map((row, index) => formatAuditLogRow(row, index)),
      ].join("\n\n");

      return {
        content: [{ type: "text", text: content }],
        details: {
          question: params.question,
          exportId: auditExport.id,
          exportUrl: auditExport.url,
          csvPath,
          filters: {
            ...filters,
            rangeStart: rangeStart.toISOString(),
            rangeEnd: rangeEnd.toISOString(),
          },
          rowCount: rows.length,
          sampledRowCount: sampleRows.length,
          counts: {
            actions: actionSummary,
            actors: actorSummary,
            targetTypes: targetSummary,
          },
          rows: sampleRows,
        },
      };
    },
  });

  pi.on("session_start", async (event, ctx) => {
    refreshStatus(ctx);
    await enqueue(() =>
      emitEvent(
        "pi.session.started",
        ctx,
        compactMetadata({
          reason: event.reason,
          cwd: ctx.cwd,
          session_file: ctx.sessionManager.getSessionFile(),
          previous_session_file: event.previousSessionFile,
        }),
        [getSessionTarget(ctx)],
      ),
    );
  });

  pi.on("session_shutdown", async (event, ctx) => {
    refreshStatus(ctx);
    await enqueue(() =>
      emitEvent(
        "pi.session.shutdown",
        ctx,
        compactMetadata({
          reason: event.reason,
          target_session_file: event.targetSessionFile,
        }),
        [getSessionTarget(ctx)],
      ),
    );
    // Buffered events are in memory, so this is the one point where waiting
    // matters: without it a normal exit would drop the whole tail of the session.
    await batcher.flush();
  });

  pi.on("input", async (event, ctx) => {
    void enqueue(() =>
      emitEvent(
        "pi.input.received",
        ctx,
        compactMetadata({
          source: event.source,
          text_length: event.text.length,
          text_sha256: sha256(event.text),
          text_preview: truncateMetadataString(event.text),
          text_truncated: event.text.length > 500,
          has_images: hasImages(event.images),
          image_count: event.images?.length,
        }),
        [getSessionTarget(ctx)],
      ),
    );
  });

  pi.on("before_agent_start", async (event, ctx) => {
    agentStartedAt = Date.now();
    turnCount = 0;
    void enqueue(() =>
      emitEvent(
        "pi.agent.started",
        ctx,
        compactMetadata({
          prompt_length: event.prompt.length,
          prompt_sha256: sha256(event.prompt),
          system_prompt_sha256: sha256(event.systemPrompt),
          has_images: hasImages(event.images),
        }),
        [getSessionTarget(ctx)],
      ),
    );
  });

  pi.on("turn_start", async () => {
    turnCount += 1;
  });

  pi.on("agent_end", async (event, ctx) => {
    const duration = agentStartedAt ? Date.now() - agentStartedAt : undefined;
    const messages = event.messages || [];
    const assistantCount = messages.filter((message) => getMessageRole(message) === "assistant").length;
    const toolResultCount = messages.filter((message) => getMessageRole(message) === "tool").length;
    const lastAssistant = [...messages].reverse().find((message) => getMessageRole(message) === "assistant") as
      | { stopReason?: string }
      | undefined;
    const status = lastAssistant?.stopReason === "aborted"
      ? "aborted"
      : lastAssistant?.stopReason === "error"
        ? "errored"
        : "completed";

    void enqueue(() =>
      emitEvent(
        "pi.agent.completed",
        ctx,
        compactMetadata({
          duration_ms: duration,
          turn_count: turnCount,
          assistant_message_count: assistantCount,
          tool_result_count: toolResultCount,
          status,
        }),
        [getSessionTarget(ctx)],
      ),
    );
  });

  pi.on("message_end", async (event, ctx) => {
    const content = getMessageContent(event.message);
    const role = getMessageRole(event.message);
    const summary = getTextSummary(content);
    const messageId = `msg_${sha256({ role, content }).slice(0, 24)}`;

    void enqueue(() =>
      emitEvent(
        "pi.message.finalized",
        ctx,
        compactMetadata({
          role,
          content_length: summary.length,
          content_sha256: sha256(content),
          has_images: getImageCount(content) > 0,
          image_count: getImageCount(content),
          tool_call_count: getToolCallCount(content),
          custom_type: (event.message as { customType?: string }).customType,
        }),
        [
          getSessionTarget(ctx),
          {
            id: messageId,
            type: "message",
            metadata: compactMetadata({ role }),
          },
        ],
      ),
    );
  });

  pi.on("tool_call", async (event, ctx) => {
    toolStartedAt.set(event.toolCallId, Date.now());

    void enqueue(() =>
      emitEvent(
        "pi.tool.called",
        ctx,
        compactMetadata({
          tool_name: event.toolName,
          tool_call_id: event.toolCallId,
          input_sha256: sha256(event.input),
          input_bytes: byteLength(event.input),
          command_preview: getCommandPreview(event.toolName === "bash" ? getBashToolCommand(event.input) : undefined),
          command_truncated: isCommandTruncated(event.toolName === "bash" ? getBashToolCommand(event.input) : undefined),
          blocked: false,
        }),
        [
          getSessionTarget(ctx),
          {
            id: event.toolCallId,
            type: "tool",
            metadata: compactMetadata({ tool_name: event.toolName }),
          },
        ],
      ),
    );
  });

  pi.on("tool_result", async (event, ctx) => {
    const startedAt = toolStartedAt.get(event.toolCallId);
    toolStartedAt.delete(event.toolCallId);

    void enqueue(() =>
      emitEvent(
        "pi.tool.completed",
        ctx,
        compactMetadata({
          tool_name: event.toolName,
          tool_call_id: event.toolCallId,
          is_error: event.isError,
          duration_ms: startedAt ? Date.now() - startedAt : undefined,
          result_sha256: sha256({ content: event.content, details: event.details, isError: event.isError }),
          result_bytes: byteLength({ content: event.content, details: event.details, isError: event.isError }),
        }),
        [
          getSessionTarget(ctx),
          {
            id: event.toolCallId,
            type: "tool",
            metadata: compactMetadata({ tool_name: event.toolName }),
          },
        ],
      ),
    );
  });

  pi.on("user_bash", async (event, ctx) => {
    const commandId = `cmd_${sha256({ command: event.command, cwd: event.cwd }).slice(0, 24)}`;

    void enqueue(() =>
      emitEvent(
        "pi.user_bash.executed",
        ctx,
        compactMetadata({
          exclude_from_context: event.excludeFromContext,
          cwd: event.cwd,
          command_sha256: sha256(event.command),
          command_length: event.command.length,
          command_preview: getCommandPreview(event.command),
          command_truncated: isCommandTruncated(event.command),
        }),
        [
          getSessionTarget(ctx),
          {
            id: commandId,
            type: "command",
          },
        ],
      ),
    );
  });

  pi.on("model_select", async (event, ctx) => {
    const modelTargetId = `${event.model.provider}/${event.model.id}`;

    void enqueue(() =>
      emitEvent(
        "pi.model.selected",
        ctx,
        compactMetadata({
          source: event.source,
          provider: event.model.provider,
          model_id: event.model.id,
          previous_provider: event.previousModel?.provider,
          previous_model_id: event.previousModel?.id,
          thinking_level: pi.getThinkingLevel(),
        }),
        [
          getSessionTarget(ctx),
          {
            id: modelTargetId,
            type: "model",
            metadata: compactMetadata({
              provider: event.model.provider,
              model_id: event.model.id,
            }),
          },
        ],
      ),
    );
  });
}
