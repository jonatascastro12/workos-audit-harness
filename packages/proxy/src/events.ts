import type { CachedDeviceUser } from "./device";
import { resolveDeviceUser, serialFromRequest } from "./device";
import { PLACEHOLDER_ACTOR_ID, PROXY_SETTINGS_KEY, parseProxySettings } from "./settings";
import type { Env } from "./types";

// WorkOS Audit Logs ingestion: authenticate the device, attribute the event to
// a real person, forward to WorkOS with the server-held `sk_` key.
//
// The client never supplies its own identity — actor, organization_id, and
// context are all set here, so a compromised laptop can only append audit
// events as itself, rate-limited at the edge.

const DEFAULT_WORKOS_AUDIT_LOGS_URL = "https://api.workos.com/audit_logs/events";

// Shape the inbound event into the WorkOS REST event, overwriting any
// client-supplied identity. Returns null if the payload isn't a usable event.
function toRestEvent(
  body: unknown,
  actor: { type: "user"; id: string; name: string; metadata: Record<string, unknown> },
  context: { location: string; user_agent?: string },
): (Record<string, unknown> & { action: string }) | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

  // Drop client-supplied actor/organization_id/context — we set those
  // authoritatively (context.location is the real connecting IP, not claimed).
  const {
    actor: _droppedActor,
    organization_id: _droppedOrg,
    context: _droppedContext,
    ...event
  } = body as Record<string, unknown>;

  const action = event.action;
  if (typeof action !== "string" || action.length === 0) return null;

  const occurredAt =
    typeof event.occurred_at === "string" ? event.occurred_at : new Date().toISOString();
  const targets = Array.isArray(event.targets) ? event.targets : [];

  return {
    ...event,
    action,
    occurred_at: occurredAt,
    actor,
    context,
    targets: targets.map((t) => ({
      ...(t as Record<string, unknown>),
      metadata: (t as { metadata?: unknown })?.metadata ?? {},
    })),
  };
}

export async function handleEvents(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  // 1. Read the device serial from the mTLS-verified client certificate.
  //    Auth-first: unauthenticated traffic never touches D1.
  const serialOrError = await serialFromRequest(request, env);
  if (serialOrError instanceof Response) return serialOrError;
  const serial = serialOrError;

  // 2. One batched D1 round trip: the optional runtime-settings row (see
  //    src/settings.ts) + the device_user row. Batching keeps the hot path at
  //    exactly one D1 round trip. If D1 is down we fail OPEN (env defaults +
  //    a live MDM lookup) rather than drop the event just because the control
  //    plane is unreachable.
  let settingsRaw: string | null = null;
  let cached: CachedDeviceUser | null = null;
  try {
    const [settingsRow, deviceRow] = await env.DB.batch([
      env.DB.prepare("SELECT value FROM app_state WHERE key = ?").bind(PROXY_SETTINGS_KEY),
      env.DB.prepare("SELECT email, name, updated FROM device_user WHERE serial = ?").bind(serial),
    ]);
    settingsRaw = (settingsRow.results[0] as { value?: string } | undefined)?.value ?? null;
    cached = (deviceRow.results[0] as CachedDeviceUser | undefined) ?? null;
  } catch (err) {
    console.error("settings/cache read failed", { serial, error: String(err) });
  }
  const settings = parseProxySettings(settingsRaw);

  // 2a. Kill switch. When paused we reject with a 503 + Retry-After so clients
  //     back off; the pause reason (if any) is surfaced to the caller.
  if (settings.paused) {
    return new Response(
      `audit ingestion is paused${settings.pauseReason ? ": " + settings.pauseReason : ""}`,
      { status: 503, headers: { "Retry-After": "300" } },
    );
  }

  // 3. Resolve serial -> assigned user (MDM-backed cache, or static D1 table).
  const user = await resolveDeviceUser(env, serial, cached, settings.deviceCacheTtlSeconds);
  // An unassigned/unknown device is rejected by default. Under the
  // "placeholder" policy the event is instead attributed to a synthetic actor
  // so loaner/conference laptops still land in the audit log.
  let actor: { type: "user"; id: string; name: string; metadata: Record<string, unknown> };
  if (user) {
    actor = { type: "user", id: user.email, name: user.name, metadata: { device_serial: serial } };
  } else if (settings.unassignedDevicePolicy === "placeholder") {
    console.log("unassigned device attributed to placeholder", { serial });
    actor = {
      type: "user",
      id: PLACEHOLDER_ACTOR_ID,
      name: `Unassigned device ${serial}`,
      metadata: { device_serial: serial, unassigned: true },
    };
  } else {
    return new Response("unknown or unassigned device", { status: 403 });
  }

  // 4. Parse + validate the body, stamping the authoritative actor + device serial.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }

  const event = toRestEvent(body, actor, {
    // Authoritative source — the real connecting IP, not a client claim.
    location: request.headers.get("CF-Connecting-IP") ?? "0.0.0.0",
    user_agent: request.headers.get("User-Agent") ?? undefined,
  });
  if (!event) {
    return new Response("invalid audit event payload", { status: 422 });
  }

  // 5. Resolve the WorkOS organization: the runtime setting overrides the env
  //    default. If neither is configured we cannot attribute the event.
  const organizationId = settings.workosOrgId ?? env.WORKOS_ORG_ID;
  if (!organizationId) {
    console.error("organization not configured", { serial });
    return new Response("organization not configured", { status: 500 });
  }

  // 6. Forward to WorkOS with the real key + server-set organization_id.
  let upstream: Response;
  try {
    upstream = await fetch(env.WORKOS_AUDIT_LOGS_URL ?? DEFAULT_WORKOS_AUDIT_LOGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WORKOS_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ organization_id: organizationId, event }),
    });
  } catch (err) {
    console.error("audit forward failed", { serial, action: event.action, error: String(err) });
    return new Response("upstream request failed", { status: 502 });
  }

  // 7. Log the ingest (serial + resolved actor) — the audit trail of the audit trail.
  console.log("audit ingest", {
    serial,
    user: actor.id,
    action: event.action,
    upstreamStatus: upstream.status,
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("workos rejected event", {
      status: upstream.status,
      detail: detail.slice(0, 500),
    });
    return new Response("upstream error", { status: 502 });
  }

  return new Response("ok", { status: 202 });
}
