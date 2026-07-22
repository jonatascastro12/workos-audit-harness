// Worker environment. Secrets are set with `wrangler secret put`; vars live in
// wrangler.toml `[vars]` (or a `.dev.vars` file during local dev).
export interface Env {
  DB: D1Database;

  // --- Secrets (never in wrangler.toml or the repo) ---
  // Full-access WorkOS `sk_` key. The whole point of this proxy is that this
  // key exists only here, server-side — never on a laptop.
  WORKOS_API_KEY: string;
  // Optional: MDM API token (Kandji), scoped to read devices. Resolves a
  // device serial to its assigned user. If unset, the D1 `device_user` table
  // is the authoritative mapping instead (populate it yourself).
  KANDJI_API_TOKEN?: string;

  // --- Vars ---
  // WorkOS organization the audit events are attributed to.
  WORKOS_ORG_ID: string;
  // Override for self-hosted/staging WorkOS API endpoints.
  WORKOS_AUDIT_LOGS_URL?: string;
  // Regex (with one capture group) that extracts the device identifier from
  // the client certificate's common name. Defaults to the Okta
  // device-attestation cert shape: "OktaManagementAttestation for <SERIAL>".
  DEVICE_CERT_CN_PATTERN?: string;
  // Cloudflare Access team domain that signs the `Cf-Access-Jwt-Assertion`
  // header, e.g. "yourteam.cloudflareaccess.com" (or just "yourteam"). Both
  // ACCESS_TEAM_DOMAIN and ACCESS_AUD must be set for the Access (Mode 1)
  // ingress path to be trusted; without them the header is ignored and only
  // genuine mTLS (`request.cf.tlsClientAuth`, Mode 2) is honored.
  ACCESS_TEAM_DOMAIN?: string;
  // AUD tag of the Access application in front of `/api/events`. The signed
  // assertion's `aud` claim must contain this value.
  ACCESS_AUD?: string;
  // Kandji tenant API base, e.g. "https://yourtenant.api.kandji.io".
  // Both KANDJI_API_BASE and KANDJI_API_TOKEN must be set to enable MDM lookups.
  KANDJI_API_BASE?: string;
  // Read-through cache freshness for MDM lookups, in seconds. Default: 1 day.
  DEVICE_CACHE_TTL_SECONDS?: string;
  // LOCAL DEV ONLY (.dev.vars): treat unauthenticated requests as coming from
  // this device serial, so you can exercise the pipeline without a cert or a
  // Cloudflare Access edge in front. NEVER set this on a deployed Worker.
  DEV_UNAUTHENTICATED_SERIAL?: string;
}
