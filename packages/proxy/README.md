# @workos-inc/audit-proxy

A small Cloudflare Worker that lets a fleet of laptops append [WorkOS Audit Logs](https://workos.com/docs/audit-logs) events **without shipping an API key to any laptop**.

## Why

WorkOS API keys are full-access — there is no "audit-append-only" scope. Putting an `sk_` key on a machine the user controls means a leaked laptop key is a full environment compromise. This proxy inverts that:

- The laptop authenticates with a **device certificate that's already on it** (by default, the Okta device-attestation cert on Okta-managed Macs) over **mTLS**, verified by Cloudflare at the edge.
- The proxy maps the cert's device serial to a **real person** server-side (via your MDM or a static table), so a laptop can't spoof who it is.
- The proxy holds the real `sk_` key and forwards the event with the actor, organization, and connecting IP set **authoritatively** — any client-supplied identity is dropped.

A compromised laptop can do exactly one thing: append rate-limited audit events as itself.

```
┌──────────────────────┐   mTLS (device cert)    ┌─────────────────────────┐
│ Laptop               │ ──────────────────────▶ │ Cloudflare edge (mTLS)  │
│ coding-agent plugin  │   POST /api/events      │ verifies cert → CA      │
└──────────────────────┘                         └───────────┬─────────────┘
                                                             ▼
                                                 ┌─────────────────────────┐
                                                 │ This Worker             │
                                                 │ serial → user (D1/MDM)  │
                                                 │ stamp actor + org + IP  │
                                                 └───────────┬─────────────┘
                                                             │ Bearer sk_ (Worker secret)
                                                             ▼
                                                 api.workos.com/audit_logs/events
```

The clients in this repo ([claude-plugin](../claude-plugin), [codex-plugin](../codex-plugin), [openclaw-plugin](../openclaw-plugin), [pi-extension](../pi-extension)) already speak this protocol: they discover the device cert in the macOS keychain and POST through it via `curl --cert <label>` on the Secure Transport backend.

> **macOS only (client side).** The mTLS emission path depends on the macOS keychain and Apple's Secure Transport curl backend — there is no Linux/Windows client support yet. The proxy itself is platform-agnostic; on non-Mac machines the plugins detect that no device cert is available and fall back to the API-key or WorkOS-CLI transport (or skip emission, logging locally).

## Deploy to your own Cloudflare account

One-click — Cloudflare clones the repo, provisions the D1 database, and deploys the Worker:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fworkos%2Fworkos-audit-harness%2Ftree%2Fmain%2Fpackages%2Fproxy)

Afterwards you still need steps 2–3 below (migrations, secrets, vars) and the [mTLS setup](#put-mtls-in-front-of-apievents).

Or manually. Prerequisites: a Cloudflare account with a zone (your domain), `wrangler` logged in (`npx wrangler login`), and a WorkOS API key + organization ID.

```bash
cd packages/proxy
npm install

# 1. Create the D1 database, then paste the printed database_id into wrangler.toml
npm run db:create

# 2. Apply the schema
npm run db:migrate:remote

# 3. Configure
#    - wrangler.toml [vars]: set WORKOS_ORG_ID (and optionally KANDJI_API_BASE)
npx wrangler secret put WORKOS_API_KEY
npx wrangler secret put KANDJI_API_TOKEN   # only if using Kandji

# 4. Deploy
npm run deploy
```

Then attach the Worker to a hostname on your zone (Workers → your worker → Settings → Domains & Routes), e.g. `audit-proxy.yourcompany.com`. mTLS requires your own hostname — the default `workers.dev` URL is fine for a first smoke test (`curl https://.../healthz`), but can't sit behind your CA.

### Put mTLS in front of `/api/events`

The Worker refuses requests that don't carry a verified client certificate, but the *verification* happens at the Cloudflare edge. Two options:

**Option A — Cloudflare Access (Zero Trust).** What WorkOS runs. Survives Workers-for-Platforms dispatch namespaces; gives you Access logs and policy tooling.

1. Zero Trust → Settings → Authentication → **Mutual TLS Certificates**: upload the CA that issues your device certs (for the Okta attestation cert, that's your Okta org's `Organization Intermediate Authority`), associated with your proxy hostname.
2. Access → Applications → add a **self-hosted app scoped to the path** `audit-proxy.yourcompany.com/api/events`.
3. Give it a single policy with action **Service Auth** (non-interactive — headless `curl` gets a clean 403 instead of an SSO redirect) and the rule **Valid Certificate** (or Common Name matching your cert pattern).
4. Set the `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` vars in `wrangler.toml` (or via `wrangler`), so the Worker can **verify the assertion's signature** before trusting it:
   - `ACCESS_TEAM_DOMAIN` — your Zero Trust team domain, e.g. `yourteam.cloudflareaccess.com` (or just `yourteam`).
   - `ACCESS_AUD` — the Access application's **Application Audience (AUD) tag** (Access → Applications → your app → Overview).

Access then forwards the verified cert's CN to the Worker in the signed `Cf-Access-Jwt-Assertion` header. The Worker verifies that JWT's RS256 signature against your team's public keys (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`) and checks its `iss`/`aud`/`exp` before reading the CN. **The header is only honored when `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are set** — without them the Worker ignores the header entirely and requires direct mTLS (Option B), so a client-supplied `Cf-Access-Jwt-Assertion` on the `workers.dev` URL cannot be used to bypass authentication.

**Option B — direct mTLS on the zone.** No Zero Trust needed. Upload your CA under SSL/TLS → Client Certificates (mTLS), enable mTLS for the proxy hostname, and add a WAF rule requiring a verified cert on `/api/events`. The Worker reads `request.cf.tlsClientAuth` directly.

### Hardening checklist

- **Disable the `workers.dev` route** once you've attached your custom hostname (`workers_dev = false` in `wrangler.toml`, already set). The `workers.dev` URL has no Access/WAF in front of it, so leaving it enabled exposes an ingress on which no edge cert verification happens.
- **Rate-limit** `/api/events` per device (Cloudflare rate-limiting rule) to cap the blast radius of a compromised laptop.
- The Worker already **drops client-supplied `actor` / `organization_id` / `context`** and stamps the real connecting IP.
- The Worker **verifies the `Cf-Access-Jwt-Assertion` signature** (Option A) and only honors it when `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` are configured — a forged/unsigned header is rejected.
- The `sk_` key exists only as a Worker secret — never in the repo, `wrangler.toml`, or on a laptop.

## Device → user mapping

The cert identifies the **device** (serial in the CN), not the user. The Worker resolves the person two ways:

- **Kandji MDM** (set `KANDJI_API_BASE` var + `KANDJI_API_TOKEN` secret): the device record's assigned user is looked up live and cached in D1 for `DEVICE_CACHE_TTL_SECONDS` (default 24 h). If Kandji is unreachable, stale cache entries are served rather than dropping events.
- **Static table** (default): the D1 `device_user` table is authoritative. Populate it yourself:

  ```bash
  npx wrangler d1 execute workos-audit-proxy-db --remote --command \
    "INSERT INTO device_user (serial, email, name, updated) VALUES ('KXVJ32DH30', 'jane@yourcompany.com', 'Jane Doe', unixepoch())"
  ```

  Sync it from whatever owns your device inventory (Okta, Jamf, Intune, a CSV) on your own schedule.

Unknown or unassigned devices get a 403 by default — events from them are never attributed to anyone. If loaner/conference machines should still land in the log, opt into the `placeholder` policy via [runtime settings](#runtime-settings): their events are attributed to a fixed synthetic actor (`unassigned-device`) with the serial preserved in metadata.

## Runtime settings

Operational settings can be changed **without a redeploy** by writing one JSON document into the Worker's D1 database — `app_state` key `proxy_settings` (table created by migration `0002`). The proxy reads it per ingested event (batched with the device lookup, so no extra D1 round trip) and applies it on the next event. Anything that can write the D1 database can manage it: `wrangler d1 execute`, a CLI, or a companion admin app with a direct D1 binding.

```jsonc
{
  "version": 3,                        // integer, bump on every write (for CAS writers)
  "updated_at": "2026-07-18T17:03:00Z",
  "updated_by": "admin@yourcompany.com",
  "workos_org_id": "org_01ABC...",     // optional: overrides the WORKOS_ORG_ID var
  "device_cache_ttl_seconds": 3600,    // optional: overrides DEVICE_CACHE_TTL_SECONDS (clamped 300–604800; MDM mode only)
  "unassigned_device_policy": "reject",// optional: "reject" (default) | "placeholder"
  "pause": {                           // optional: kill switch — proxy answers 503 + Retry-After while paused
    "paused": true,
    "reason": "Rotating the WorkOS key",
    "paused_by": "admin@yourcompany.com",
    "paused_at": "2026-07-18T14:02:11Z",
    "auto_resume_at": "2026-07-18T18:02:11Z"  // ISO time or null (= until removed)
  }
}
```

Example — pause ingestion for four hours:

```bash
npx wrangler d1 execute workos-audit-proxy-db --remote --command \
  "INSERT INTO app_state (key, value) VALUES ('proxy_settings', '{\"version\":1,\"pause\":{\"paused\":true,\"reason\":\"maintenance\",\"auto_resume_at\":\"2026-07-18T18:00:00Z\"}}') ON CONFLICT(key) DO UPDATE SET value = excluded.value"
```

Semantics, all deliberate (see `src/settings.ts`):

- **Absence means default.** A missing row/field falls back to the env var or built-in default, so this is a no-op until you write it, and deleting a field un-overrides it.
- **Per-field tolerance.** Every field is validated independently on read; a malformed field degrades to its default rather than breaking ingest. Unknown fields are ignored.
- **The kill switch fails open.** If D1 is unreachable the proxy cannot see `paused: true` and keeps ingesting — a control-plane outage must never silently drop the fleet's audit events. The hard stop remains removing the mTLS/Access policy in front of `/api/events`.
- **Pausing loses events from clients that don't retry.** The proxy answers 503 with `Retry-After: 300`; whether events are lost depends on the harness client's retry behavior.
- `app_state` and `device_user` are a **write interface**: renaming their columns or the `proxy_settings` fields breaks external writers (e.g. the WorkOS-internal audit-chat admin app manages these over a direct D1 binding).

## Using a different device certificate

The default CN pattern matches the Okta device-attestation cert (`OktaManagementAttestation for <SERIAL>`), which exists on Okta-managed Macs with zero provisioning. If your fleet has a different client cert (Jamf/Kandji SCEP, your own CA), set the `DEVICE_CERT_CN_PATTERN` var to a regex whose **first capture group** extracts the device identifier from the CN, and upload your CA as the mTLS trust anchor instead.

## Point the plugins at your proxy

The proxy URL is deliberately **not** hardcoded anywhere in the plugins — it's company-specific config. Three ways to set it, highest precedence first:

1. **Env var** — `WORKOS_AUDIT_PROXY_URL="https://audit-proxy.yourcompany.com/api/events"`
2. **Per-user config file** — `proxyUrl` in `~/.claude/workos-audit/config.json` (or the Codex/pi equivalent)
3. **MDM-managed machine config** — the right layer for a fleet rollout. The plugins read a machine-wide JSON that your MDM (Kandji, Jamf, Intune) deploys once per device:

   | OS | Path |
   |---|---|
   | macOS | `/Library/Application Support/workos-audit/config.json` |
   | Linux | `/etc/workos-audit/config.json` |
   | Windows | `%ProgramData%\workos-audit\config.json` |

   ```json
   { "proxyUrl": "https://audit-proxy.yourcompany.com/api/events" }
   ```

   (`organizationId`, `actionPrefix`, etc. are also honored here.) Example Kandji custom script:

   ```bash
   #!/bin/zsh
   dir="/Library/Application Support/workos-audit"
   mkdir -p "$dir"
   cat > "$dir/config.json" <<'EOF'
   { "proxyUrl": "https://audit-proxy.yourcompany.com/api/events" }
   EOF
   chmod 644 "$dir/config.json"
   ```

   The file is root-owned and world-readable — it contains no secrets, only the hostname. Users can still override it per-machine via env or their own config file.

With no proxy URL configured from any layer, the plugins fall back to direct-API transports (API key or WorkOS CLI), and they always degrade gracefully (log-and-continue) when no device cert is present — a misconfigured machine never blocks the coding agent.

## Local development

```bash
cp .dev.vars.example .dev.vars   # fill in your test sk_ key + org
npm run dev                      # applies local D1 migrations, then wrangler dev
```

There's no Cloudflare edge locally, so set `DEV_UNAUTHENTICATED_SERIAL` in `.dev.vars` and insert a matching `device_user` row in the local DB:

```bash
npx wrangler d1 execute workos-audit-proxy-db --local --command \
  "INSERT INTO device_user (serial, email, name, updated) VALUES ('DEVSERIAL01', 'you@yourcompany.com', 'You', unixepoch())"

curl -s http://localhost:8787/api/events -X POST -H 'Content-Type: application/json' \
  -d '{"action": "smoke.test", "targets": [{"type": "repository", "id": "demo"}]}'
```

## Endpoints

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/events` | mTLS device cert | Ingest one audit event; returns `202` on success. |
| `GET /healthz` (or `/`) | none | Liveness probe used by the plugins' setup preflight. |

## Design notes

The original internal spec — including the empirical findings about the Okta attestation cert, macOS keychain/`curl` behavior, and the Access JWT vs. `cf.tlsClientAuth` trade-off — lives in [docs/spec.md](docs/spec.md).
