import type { Env } from "./types";

// Device identity: extract the device serial from the mTLS client certificate,
// then resolve it to a real person.
//
// Two ingress modes are supported, checked in order:
//
// 1. Cloudflare Access (Zero Trust) mTLS — Access terminates and chain-verifies
//    the cert at the edge, then forwards the verified identity in the
//    `Cf-Access-Jwt-Assertion` header; its `common_name` claim is the cert
//    subject CN. This is the only mode that works inside a
//    Workers-for-Platforms dispatch namespace (request.cf.tlsClientAuth does
//    not survive the dispatcher hop — verified empirically).
//
//    The header is only trusted after its signature is verified against the
//    Access team's public keys and its `aud`/`iss` claims are checked (see
//    `verifyAccessAssertion`). "Cloudflare strips inbound Cf-Access-* headers"
//    only holds for requests that actually traverse the Access-protected
//    hostname; on the `workers.dev` URL (or any origin-exposed path) a client
//    can supply the header verbatim, so signature verification is what makes
//    it trustworthy. Mode 1 is therefore opt-in: it requires ACCESS_TEAM_DOMAIN
//    and ACCESS_AUD to be configured. When they are absent the header is
//    ignored entirely and only genuine mTLS (Mode 2) is honored.
//
// 2. Direct mTLS (API Shield / "Client Certificates") — for a plain Worker on
//    your own zone, Cloudflare populates `request.cf.tlsClientAuth` with the
//    verification result and subject DN. Simpler to set up: no Zero Trust
//    account needed, just upload your CA and enable mTLS on the hostname.

// Default matches the Okta device-attestation cert present on Okta-managed
// machines: "CN=OktaManagementAttestation for KXVJ32DH30". The serial stops at
// the first comma/space so a full DN string can't bleed in.
const DEFAULT_CN_PATTERN = "OktaManagementAttestation for ([^,\\s]+)";
const DEFAULT_CACHE_TTL_SECONDS = 24 * 60 * 60;

// How long fetched Access signing keys are cached in the isolate.
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
// Floor between forced key refetches triggered by an unknown `kid`, so an
// attacker-supplied kid can't thrash the cache into a subrequest amplifier.
const JWKS_REFRESH_MIN_MS = 5 * 60 * 1000;

export interface DeviceUser {
  email: string;
  name: string;
}

function serialFromCommonName(env: Env, commonName: string): string | null {
  const pattern = new RegExp(env.DEVICE_CERT_CN_PATTERN ?? DEFAULT_CN_PATTERN);
  return pattern.exec(commonName)?.[1] ?? null;
}

// Normalize a configured team value ("yourteam" or "yourteam.cloudflareaccess.com")
// to the canonical Access issuer origin. Rejects anything that isn't a
// cloudflareaccess.com host so a misconfigured ACCESS_TEAM_DOMAIN can't point
// the JWKS fetch (and the trusted `iss`) at an attacker-controlled domain.
//
// Parsed with `new URL`, not string matching: a raw endsWith() check is
// defeated by URL metacharacters — "evil.example#.cloudflareaccess.com" ends
// with the trusted suffix as a string but resolves to host evil.example. The
// issuer is rebuilt from url.origin so only the parsed host can ever be used.
// Returns null (never throws) so callers can fail closed with a logged reason.
function accessIssuer(teamDomain: string): string | null {
  const host = teamDomain.includes(".") ? teamDomain : `${teamDomain}.cloudflareaccess.com`;
  let url: URL;
  try {
    url = new URL(`https://${host}`);
  } catch {
    return null;
  }
  const bare = url.hostname;
  if (bare !== "cloudflareaccess.com" && !bare.endsWith(".cloudflareaccess.com")) return null;
  // Anything beyond a bare host (path, query, fragment, credentials, port)
  // means the value was crafted or mistyped — refuse rather than normalize.
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password || url.port) {
    return null;
  }
  return url.origin;
}

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToJson<T>(input: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(input))) as T;
}

interface Jwk extends JsonWebKey {
  kid?: string;
}

// In-isolate cache of the Access team's signing keys, keyed by issuer.
const jwksCache = new Map<string, { keys: Jwk[]; fetchedAt: number }>();

async function fetchAccessKeys(issuer: string): Promise<Jwk[]> {
  const cached = jwksCache.get(issuer);
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL_MS) {
    return cached.keys;
  }
  const res = await fetch(`${issuer}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`access certs fetch failed: ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  // Don't cache an empty/malformed response: doing so would fail every Mode 1
  // request with 403 until the TTL expires. Let the caller retry next time.
  if (keys.length === 0) throw new Error("access certs response contained no keys");
  jwksCache.set(issuer, { keys, fetchedAt: Date.now() });
  return keys;
}

// Verify the Cf-Access-Jwt-Assertion: RS256 signature against the team's
// published keys, plus `iss`/`aud`/`exp` claims. Returns the decoded payload
// on success, or null on any failure (unknown alg, bad signature, wrong
// audience, expired, malformed). Never trusts an unverified assertion.
// Every rejection is console.error'd with a reason so a misconfiguration or
// an attack shows up in `wrangler tail` — but never the assertion itself.
async function verifyAccessAssertion(
  assertion: string,
  env: Env,
): Promise<{ common_name?: string } | null> {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!teamDomain || !aud) return null;

  // Rejection helper: log the reason (metadata only — never the token or any
  // key material) and refuse.
  const reject = (reason: string): null => {
    console.error("access assertion rejected", { reason });
    return null;
  };

  const parts = assertion.split(".");
  if (parts.length !== 3) return reject("not a three-part JWT");
  const [rawHeader, rawPayload, rawSig] = parts;

  let header: { alg?: string; kid?: string };
  let payload: { common_name?: string; iss?: string; aud?: unknown; exp?: unknown; nbf?: unknown };
  try {
    header = base64UrlToJson(rawHeader);
    payload = base64UrlToJson(rawPayload);
  } catch {
    return reject("malformed header/payload encoding");
  }

  // Only RS256 (what Cloudflare Access signs with). Reject "none", HS*, etc.
  if (header.alg !== "RS256" || !header.kid) return reject(`unsupported alg ${header.alg}`);

  const issuer = accessIssuer(teamDomain);
  if (!issuer) return reject("ACCESS_TEAM_DOMAIN is not a valid cloudflareaccess.com host");
  if (payload.iss !== issuer) return reject("issuer mismatch");

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(aud)) return reject("audience mismatch");

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) return reject("expired");
  if (typeof payload.nbf === "number" && payload.nbf > now + 60) return reject("not yet valid");

  let keys: Jwk[];
  try {
    keys = await fetchAccessKeys(issuer);
  } catch (err) {
    console.error("access keys fetch failed", { error: String(err) });
    return null;
  }

  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // Unknown kid: Access may have rotated keys within the cache window. Drop
    // the cache and try one fresh fetch before giving up — but rate-limit the
    // bust. The kid is attacker-controlled and checked BEFORE the signature,
    // so an unthrottled refetch lets one client with otherwise-valid claims
    // (e.g. a compromised laptop) amplify a subrequest per event for everyone.
    // Real Access rotations are rare, so a floor costs nothing.
    const cachedAt = jwksCache.get(issuer)?.fetchedAt ?? 0;
    if (Date.now() - cachedAt < JWKS_REFRESH_MIN_MS) return reject("unknown signing key (kid)");
    jwksCache.delete(issuer);
    try {
      jwk = (await fetchAccessKeys(issuer)).find((k) => k.kid === header.kid);
    } catch (err) {
      console.error("access keys refresh failed", { error: String(err) });
    }
    if (!jwk) return reject("unknown signing key (kid)");
  }

  let ok = false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
    ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(rawSig),
      data,
    );
  } catch (err) {
    console.error("access assertion verify error", { error: String(err) });
    return null;
  }

  return ok ? payload : reject("signature verification failed");
}

// Returns the device serial on success, or a Response describing the rejection.
export async function serialFromRequest(request: Request, env: Env): Promise<string | Response> {
  // Mode 1: Cloudflare Access mTLS. Only honored when Access verification is
  // configured; the signed assertion is verified before it is trusted.
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (assertion && (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD)) {
    // Make this failure mode loud: on a deployment that receives real traffic
    // through Access (e.g. a dispatch-namespace deployment where Mode 2 can
    // never work), forgetting to set these vars rejects ALL ingest.
    console.error(
      "Cf-Access-Jwt-Assertion present but ignored: ACCESS_TEAM_DOMAIN/ACCESS_AUD not configured (Mode 1 is opt-in; falling through to mTLS)",
    );
  }
  if (assertion && env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    const payload = await verifyAccessAssertion(assertion, env);
    if (!payload) {
      return new Response("invalid access assertion", { status: 403 });
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
// The MDM call below is Kandji/Iru-shaped: it assumes
// `GET {base}/api/v1/devices?serial_number=<serial>` returning an ARRAY whose
// first element carries `user.email` / `user.name`. That is the only adapter
// here. Jamf, Intune and others differ in both route and response shape, so they
// need either the static table (supported, no code change) or a new branch in
// this function — pointing KANDJI_API_BASE at them fails the Array.isArray check
// below and stale-serves, which looks like an outage rather than a config error.
//
// The KANDJI_ env prefix is retained after Kandji's rename to Iru so existing
// deployments do not have to rotate a secret to upgrade.
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
