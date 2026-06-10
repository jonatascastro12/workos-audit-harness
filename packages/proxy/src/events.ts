import { resolveDeviceUser, serialFromRequest } from "./device";
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
  const serialOrError = serialFromRequest(request, env);
  if (serialOrError instanceof Response) return serialOrError;
  const serial = serialOrError;

  // 2. Resolve serial -> assigned user (MDM-backed cache, or static D1 table).
  const user = await resolveDeviceUser(env, serial);
  if (!user) {
    return new Response("unknown or unassigned device", { status: 403 });
  }

  // 3. Parse + validate the body, stamping the authoritative actor + device serial.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }

  const event = toRestEvent(
    body,
    {
      type: "user",
      id: user.email,
      name: user.name,
      metadata: { device_serial: serial },
    },
    {
      // Authoritative source — the real connecting IP, not a client claim.
      location: request.headers.get("CF-Connecting-IP") ?? "0.0.0.0",
      user_agent: request.headers.get("User-Agent") ?? undefined,
    },
  );
  if (!event) {
    return new Response("invalid audit event payload", { status: 422 });
  }

  // 4. Forward to WorkOS with the real key + server-set organization_id.
  let upstream: Response;
  try {
    upstream = await fetch(env.WORKOS_AUDIT_LOGS_URL ?? DEFAULT_WORKOS_AUDIT_LOGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WORKOS_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ organization_id: env.WORKOS_ORG_ID, event }),
    });
  } catch (err) {
    console.error("audit forward failed", { serial, action: event.action, error: String(err) });
    return new Response("upstream request failed", { status: 502 });
  }

  // 5. Log the ingest (serial + resolved user) — the audit trail of the audit trail.
  console.log("audit ingest", {
    serial,
    user: user.email,
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
