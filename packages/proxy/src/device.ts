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

// A cached device_user row, pre-fetched by the caller (batched with the
// runtime-settings read so the hot path stays at one D1 round trip).
export interface CachedDeviceUser {
  email: string;
  name: string;
  updated: number;
}

// How long a negative-cache sentinel (an authoritatively unassigned device,
// stored with email = "") is trusted before re-asking the MDM. Capped well
// below the regular TTL so a reassigned loaner laptop is picked up promptly.
const SENTINEL_TTL_CAP_SECONDS = 60 * 60;

// Resolve a device serial to its assigned user.
//
// With an MDM configured (KANDJI_API_BASE + KANDJI_API_TOKEN), the MDM owns the
// device→user assignment and the D1 `device_user` table is a read-through
// cache. Without one, the table is the authoritative mapping: rows never go
// stale, and unknown serials are rejected until an admin inserts them.
//
// `ttlOverride` comes from the runtime settings document (null = not
// overridden); the env var and built-in default remain the fallbacks.
export async function resolveDeviceUser(
  env: Env,
  serial: string,
  cached: CachedDeviceUser | null,
  ttlOverride: number | null,
): Promise<DeviceUser | null> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = ttlOverride ?? (Number(env.DEVICE_CACHE_TTL_SECONDS) || DEFAULT_CACHE_TTL_SECONDS);

  // A sentinel row (email === "") is a NEGATIVE cache entry: the MDM has
  // authoritatively reported this serial as unassigned/unknown, so events
  // under the "placeholder" policy don't trigger a live MDM call every time.
  // It is never a real actor — no path below may serve it as a user.
  const isSentinel = (row: { email: string } | null): boolean => !!row && row.email === "";

  const mdmConfigured = Boolean(env.KANDJI_API_BASE && env.KANDJI_API_TOKEN);
  if (!mdmConfigured) {
    // Static mode: the table is authoritative; TTLs and sentinels don't apply
    // (a leftover sentinel from a previous MDM-mode deployment is not a user).
    return cached && !isSentinel(cached) ? { email: cached.email, name: cached.name } : null;
  }

  // Serve a stale cache entry rather than drop the event when the MDM is
  // unreachable or its response is unusable — but never serve the sentinel.
  const staleServe = (): DeviceUser | null =>
    cached && !isSentinel(cached) ? { email: cached.email, name: cached.name } : null;

  // Persist the resolution (a real user, or a sentinel with empty email/name).
  // The cache write is an optimization, never load-bearing: a D1 failure here
  // must not lose an event we could otherwise forward.
  const writeBack = async (email: string, name: string): Promise<void> => {
    try {
      await env.DB.prepare(
        "INSERT INTO device_user (serial, email, name, updated) VALUES (?, ?, ?, ?) " +
          "ON CONFLICT(serial) DO UPDATE SET email = excluded.email, name = excluded.name, updated = excluded.updated",
      )
        .bind(serial, email, name, now)
        .run();
    } catch (err) {
      console.error("device_user write-back failed", { serial, error: String(err) });
    }
  };

  if (cached) {
    const effectiveTtl = isSentinel(cached) ? Math.min(ttl, SENTINEL_TTL_CAP_SECONDS) : ttl;
    if (now - cached.updated < effectiveTtl) {
      return isSentinel(cached) ? null : { email: cached.email, name: cached.name };
    }
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
    return staleServe();
  }

  if (!res.ok) {
    console.error("mdm lookup rejected", { serial, status: res.status });
    return staleServe();
  }

  const body = await res.json().catch(() => null);
  // A well-formed response is an ARRAY of devices. Anything else (an HTML
  // maintenance page behind a proxy, a foreign JSON object, a parse failure)
  // is not authoritative evidence that the device is unassigned — treat it
  // like an error and stale-serve rather than discarding a valid cache row.
  if (!Array.isArray(body)) {
    console.error("mdm returned unusable body", { serial });
    return staleServe();
  }

  const user = (body[0] as { user?: { email?: string; name?: string } | null } | undefined)?.user;
  // An empty array or a first device with no user is a genuine
  // unassigned/unknown device (conference/loaner). Record the sentinel so the
  // next events skip the MDM call, and return null so the caller applies its
  // unassigned-device policy.
  if (!user?.email) {
    await writeBack("", "");
    return null;
  }

  const resolved: DeviceUser = { email: user.email, name: user.name ?? user.email };
  await writeBack(resolved.email, resolved.name);
  return resolved;
}
