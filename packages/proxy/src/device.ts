import type { Env } from "./types";

// Device identity: extract the device serial from the mTLS client certificate,
// then resolve it to a real person.
//
// Two ingress modes are supported, checked in order:
//
// 1. Cloudflare Access (Zero Trust) mTLS — Access terminates and chain-verifies
//    the cert at the edge, then forwards the verified identity in the
//    `Cf-Access-Jwt-Assertion` header; its `common_name` claim is the cert
//    subject CN. Cloudflare strips any client-supplied `Cf-Access-*` header on
//    ingress, so the Worker can trust it. This is the only mode that works
//    inside a Workers-for-Platforms dispatch namespace (request.cf.tlsClientAuth
//    does not survive the dispatcher hop — verified empirically).
//
// 2. Direct mTLS (API Shield / "Client Certificates") — for a plain Worker on
//    your own zone, Cloudflare populates `request.cf.tlsClientAuth` with the
//    verification result and subject DN. Simpler to set up: no Zero Trust
//    account needed, just upload your CA and enable mTLS on the hostname.
//
// TODO(hardening): verify the Cf-Access-Jwt-Assertion signature against the
// Access team's certs endpoint for full defense in depth (Access already
// validates it upstream; this would protect against a future origin-exposure).

// Default matches the Okta device-attestation cert present on Okta-managed
// machines: "CN=OktaManagementAttestation for KXVJ32DH30". The serial stops at
// the first comma/space so a full DN string can't bleed in.
const DEFAULT_CN_PATTERN = "OktaManagementAttestation for ([^,\\s]+)";
const DEFAULT_CACHE_TTL_SECONDS = 24 * 60 * 60;

export interface DeviceUser {
  email: string;
  name: string;
}

function serialFromCommonName(env: Env, commonName: string): string | null {
  const pattern = new RegExp(env.DEVICE_CERT_CN_PATTERN ?? DEFAULT_CN_PATTERN);
  return pattern.exec(commonName)?.[1] ?? null;
}

// Returns the device serial on success, or a Response describing the rejection.
export function serialFromRequest(request: Request, env: Env): string | Response {
  // Mode 1: Cloudflare Access mTLS.
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (assertion) {
    // Decode the JWT payload (base64url). Trusted because Access strips
    // inbound Cf-Access-* headers and signs this one. See TODO(hardening).
    let payload: { common_name?: string };
    try {
      const part = assertion.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      payload = JSON.parse(atob(part + "=".repeat((4 - (part.length % 4)) % 4)));
    } catch {
      return new Response("malformed access assertion", { status: 400 });
    }
    const serial = serialFromCommonName(env, payload.common_name ?? "");
    if (!serial) {
      return new Response("no device serial in client certificate", { status: 403 });
    }
    return serial;
  }

  // Mode 2: direct mTLS on the zone.
  const tls = (request.cf as IncomingRequestCfProperties | undefined)?.tlsClientAuth;
  if (tls && tls.certPresented === "1") {
    if (tls.certVerified !== "SUCCESS") {
      return new Response("client certificate failed verification", { status: 403 });
    }
    const serial = serialFromCommonName(env, tls.certSubjectDN ?? "");
    if (!serial) {
      return new Response("no device serial in client certificate", { status: 403 });
    }
    return serial;
  }

  // Local-dev escape hatch only — see types.ts. Never set on a deployed Worker.
  if (env.DEV_UNAUTHENTICATED_SERIAL) {
    return env.DEV_UNAUTHENTICATED_SERIAL;
  }

  return new Response("client certificate required", { status: 401 });
}

// Resolve a device serial to its assigned user.
//
// With an MDM configured (KANDJI_API_BASE + KANDJI_API_TOKEN), the MDM owns the
// device→user assignment and the D1 `device_user` table is a read-through
// cache. Without one, the table is the authoritative mapping: rows never go
// stale, and unknown serials are rejected until an admin inserts them.
export async function resolveDeviceUser(env: Env, serial: string): Promise<DeviceUser | null> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Number(env.DEVICE_CACHE_TTL_SECONDS) || DEFAULT_CACHE_TTL_SECONDS;

  const cached = await env.DB.prepare(
    "SELECT email, name, updated FROM device_user WHERE serial = ?",
  )
    .bind(serial)
    .first<{ email: string; name: string; updated: number }>();

  const mdmConfigured = Boolean(env.KANDJI_API_BASE && env.KANDJI_API_TOKEN);
  if (!mdmConfigured) {
    return cached ? { email: cached.email, name: cached.name } : null;
  }

  if (cached && now - cached.updated < ttl) {
    return { email: cached.email, name: cached.name };
  }

  // Cache miss or stale — ask the MDM.
  let res: Response;
  try {
    res = await fetch(
      `${env.KANDJI_API_BASE}/api/v1/devices?serial_number=${encodeURIComponent(serial)}`,
      { headers: { Authorization: `Bearer ${env.KANDJI_API_TOKEN}` } },
    );
  } catch (err) {
    console.error("mdm request failed", { serial, error: String(err) });
    // Serve a stale entry rather than drop the event if the MDM is unreachable.
    return cached ? { email: cached.email, name: cached.name } : null;
  }

  if (!res.ok) {
    console.error("mdm lookup rejected", { serial, status: res.status });
    return cached ? { email: cached.email, name: cached.name } : null;
  }

  const devices = (await res.json().catch(() => null)) as Array<{
    user?: { email?: string; name?: string } | null;
  }> | null;
  const user = devices?.[0]?.user;
  // Some laptops are unassigned (conference/loaner), so user can be null.
  if (!user?.email) {
    return null;
  }

  const resolved: DeviceUser = { email: user.email, name: user.name ?? user.email };

  await env.DB.prepare(
    "INSERT INTO device_user (serial, email, name, updated) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(serial) DO UPDATE SET email = excluded.email, name = excluded.name, updated = excluded.updated",
  )
    .bind(serial, resolved.email, resolved.name, now)
    .run();

  return resolved;
}
