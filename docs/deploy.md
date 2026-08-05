# Self-hosting the audit harness

End-to-end deployment guide for running this harness on **your own** Cloudflare
account and **your own** WorkOS environment: the ingestion proxy, the mTLS
ingress in front of it, the audit schemas, the fleet rollout, and the chat
console.

The deployable configs (`wrangler.toml`) are vendor-neutral: no account id, no
zone, placeholders where an id belongs. WorkOS's own deployment values live in
the sibling `wrangler.internal.toml` files, kept in-tree so the customer-facing
config stays honest — you never need to read or edit those.

## 1. What you get, and one limitation up front

A pipeline that records what your AI coding agents did, into WorkOS Audit Logs,
**without putting a WorkOS API key on any laptop**:

```
laptop (plugin)  --mTLS device cert-->  Cloudflare edge  -->  proxy Worker  --sk_ key-->  WorkOS Audit Logs
                                        (verifies cert)        (serial -> person,              |
                                                                stamps actor/org/IP)           v
                                                                                        chat console (read-only)
```

- **[`packages/proxy`](../packages/proxy)** — Cloudflare Worker + D1. Holds the
  `sk_` key, authenticates each laptop by its device certificate, maps the
  certificate's device serial to a real person, and forwards the event with
  actor, organization, and connecting IP set server-side. Any client-supplied
  identity is dropped.
- **The plugins** — [claude](../packages/claude-plugin),
  [codex](../packages/codex-plugin), [openclaw](../packages/openclaw-plugin),
  [pi](../packages/pi-extension). They emit session/prompt/tool/turn events and
  expose an audit-query tool.
- **[`packages/chat`](../packages/chat)** — optional AuthKit-gated console that
  answers natural-language questions over the resulting audit trail.

### The limitation: the mTLS client path is macOS-only

The keyless transport works by finding a device certificate in the **macOS
keychain** and POSTing through it with Apple's **Secure Transport** `curl`
backend. There is no Linux or Windows client equivalent today.

The proxy itself is platform-agnostic. On non-Mac machines the plugins detect
that no device certificate is available and fall back to the **API-key** or
**WorkOS CLI** transport — which means a key on that machine — or, if neither is
configured, they log locally and continue. A misconfigured machine never blocks
the coding agent, and it also never silently pretends to be recording: check
`writeTransport` (see [§7](#7-troubleshooting)).

If your fleet is mixed, plan for it explicitly: Macs on the proxy, everything
else either on a scoped key or not recording.

A second, narrower constraint sits on the same path: the client finds its
certificate by **keychain label**, and that lookup matches the Okta
device-attestation shape `OktaManagementAttestation for <SERIAL>`
(`packages/audit-core/src/device-cert.mjs`). The *proxy* accepts any CN shape via
`DEVICE_CERT_CN_PATTERN`, so a Jamf/Kandji SCEP or in-house CA works
server-side — but the plugins' discovery is still Okta-shaped, so a fleet with a
different client certificate has to change that regex on the client too. Worth
knowing before you plan around a non-Okta certificate.

## 2. Deploy the ingestion proxy

Prerequisites: a Cloudflare account with a **zone you control** (mTLS needs your
own hostname), `wrangler` logged in, and a WorkOS API key plus an organization
id for the environment you want events in.

```bash
git clone https://github.com/workos/workos-audit-harness.git
cd workos-audit-harness/packages/proxy
npm install
```

`packages/proxy/wrangler.toml` ships vendor-neutral: no `account_id` (wrangler
uses your logged-in account), a placeholder `database_id`, and
`workers_dev = false`.

### 2.1 Create the D1 database

```bash
npm run db:create        # wrangler d1 create workos-audit-proxy-db
```

Copy the printed `database_id` into the `[[d1_databases]]` block of
`wrangler.toml`, replacing the `00000000-0000-0000-0000-000000000000`
placeholder.

### 2.2 Apply the migrations

```bash
npm run db:migrate:remote        # applies migrations/ against the real D1 database
```

That creates `device_user` (`0001`) and `app_state` (`0002`). `app_state` backs
the runtime-settings document — the pause kill switch, the unassigned-device
policy, and the org override — so don't skip it even if you only care about
ingestion. `npm run db:migrate:local` does the same against the local miniflare
copy for `npm run dev`.

### 2.3 Set the secrets, by name

Secrets are set with `wrangler secret put` and never live in `wrangler.toml`:

| Secret | Required | What it is |
|---|---|---|
| `WORKOS_API_KEY` | yes | The `sk_` key for the WorkOS environment events land in. The entire point of the proxy is that this exists only here. |
| `KANDJI_API_TOKEN` | only for MDM mode | Kandji token, scoped to read devices. Pair with the `KANDJI_API_BASE` var. |
| `ACCESS_AUD` | see [§3.1](#31-route-a--cloudflare-access-zero-trust) | Can be a var instead; a secret is safer if CI redeploys `wrangler.toml`. |

```bash
npx wrangler secret put WORKOS_API_KEY
npx wrangler secret put KANDJI_API_TOKEN   # only if using Kandji
```

### 2.4 Set the vars

In `wrangler.toml` under `[vars]` (all non-secret):

| Var | Required | Notes |
|---|---|---|
| `WORKOS_ORG_ID` | yes | Organization the events are attributed to (`org_…`). Get or create one with `npm run audit-harness -- ensure-organization` from the repo root; it prints the id. Can be overridden at runtime without a redeploy (see [runtime settings](../packages/proxy/README.md#runtime-settings)). |
| `ACCESS_TEAM_DOMAIN` | Access route only | e.g. `yourteam.cloudflareaccess.com`, or just `yourteam`. |
| `ACCESS_AUD` | Access route only | AUD tag of the Access application in front of `/api/events`. |
| `DEVICE_CERT_CN_PATTERN` | no | Regex whose **first capture group** extracts the device id from the certificate CN. Defaults to the Okta device-attestation shape. |
| `KANDJI_API_BASE` | no | e.g. `https://yourtenant.api.kandji.io`. Enables MDM mode together with the token secret. |
| `DEVICE_CACHE_TTL_SECONDS` | no | MDM read-through cache freshness. Default 24 h. |
| `WORKOS_AUDIT_LOGS_URL` | no | Override for a non-default WorkOS API endpoint. |

Never set `DEV_UNAUTHENTICATED_SERIAL` on a deployed Worker — it is a local-dev
escape hatch that accepts unauthenticated events as a fixed serial.

### 2.5 Deploy and attach a hostname

```bash
npm run deploy
```

Then attach the Worker to a hostname on your zone (Workers → your worker →
Settings → Domains & Routes), e.g. `audit-proxy.yourcompany.com`, and verify:

```bash
curl -s https://audit-proxy.yourcompany.com/healthz
# {"service":"workos-audit-proxy","ok":true}
```

`GET /` and `GET /healthz` are deliberately unauthenticated liveness probes (the
plugins' setup preflight hits them) and reveal nothing about configuration.
`POST /api/events` is the only ingest route.

**Leave `workers_dev = false`.** The `*.workers.dev` URL has no Access or WAF in
front of it, so with it enabled you are running an ingress on which no
certificate verification happens at all. If you flip it on for a first smoke
test, flip it back before you point any real device at the proxy.

### 2.6 Map devices to people

The certificate identifies the **device**, not the user. Two options:

- **Static D1 table** (default). `device_user` is authoritative; populate it from
  whatever owns your device inventory:

  ```bash
  npx wrangler d1 execute workos-audit-proxy-db --remote --command \
    "INSERT INTO device_user (serial, email, name, updated) VALUES ('KXVJ32DH30', 'jane@yourcompany.com', 'Jane Doe', unixepoch())"
  ```

- **Kandji MDM** (`KANDJI_API_BASE` + `KANDJI_API_TOKEN`). The assigned user is
  looked up live and cached in `device_user`. If Kandji is unreachable, stale
  cache entries are served rather than dropping events.

Unknown or unassigned devices get a **403** and are never attributed to anyone.
If loaner or conference machines should still land in the log, opt into the
`placeholder` unassigned-device policy in the runtime settings — their events go
to a synthetic actor with the serial preserved in metadata.

## 3. Put mTLS in front of `/api/events`

This is the step deployments get wrong, and the failure mode is silence, so treat
it as part of the deploy rather than hardening you do later.

The Worker refuses any request that does not carry a verified client
certificate, but the **verification happens at the Cloudflare edge**. The Worker
supports exactly two ingress modes, checked in that order:

1. **Cloudflare Access** — Access terminates and chain-verifies the certificate,
   then forwards a signed `Cf-Access-Jwt-Assertion` whose `common_name` claim is
   the certificate subject CN. The Worker verifies that JWT's RS256 signature
   against your team's published keys and checks `iss`/`aud`/`exp` before
   trusting it.
2. **Direct mTLS** — the Worker reads `request.cf.tlsClientAuth` directly.

Which one you need is decided by how the Worker is deployed:

| Deployment | Working mode |
|---|---|
| Plain Worker on your own zone (what §2 produces) | Either. Direct mTLS is simpler; Access gives you policy tooling and logs. |
| Workers for Platforms **dispatch namespace** | **Access only.** `request.cf.tlsClientAuth` does not survive the dispatcher hop — verified empirically, not a configuration problem you can fix. |

Mode 1 is **opt-in**: the assertion header is honored only when *both*
`ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are set. That is deliberate — without
signature verification a client could supply the header itself on any
origin-exposed path. The consequence is that on an Access-only deployment,
forgetting either var rejects 100% of ingest. The Worker logs
`Cf-Access-Jwt-Assertion present but ignored: ACCESS_TEAM_DOMAIN/ACCESS_AUD not
configured` when that happens; `npm run logs` (`wrangler tail`) shows it.

### 3.1 Route A — Cloudflare Access (Zero Trust)

1. **Zero Trust → Settings → Authentication → Mutual TLS Certificates**: upload
   the CA that issues your device certificates and associate it with your proxy
   hostname. For the Okta device-attestation certificate that is your Okta org's
   *Organization Intermediate Authority*.
2. **Access → Applications → self-hosted app**, scoped to the **path**:
   `audit-proxy.yourcompany.com/api/events`. Not the bare hostname.
3. Give it **one policy** with action **Service Auth** and a **certificate rule**
   (*Valid Certificate*, or Common Name matching your certificate pattern).
4. Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` on the Worker (§2.4). The AUD tag is
   on Access → Applications → your app → **Overview**.

**What goes wrong if the policy is an ordinary interactive-login application:**
the device certificate authenticates fine at the edge — Access's own logs show
it succeeding — and Access then answers **302 to its login page**. A headless `curl` has no
browser to complete a login, so ingestion stops. There is no error in the Worker
logs (the request never reaches the Worker), nothing in WorkOS, and nothing in
the harness UI. The only reason a client notices at all is that the emit path
refuses to follow redirects and asserts a 2xx instead of trusting `curl`'s exit
code; otherwise a 302 would have looked like healthy ingestion on every machine
at once. A **Service Auth** policy gives a headless client a clean 403 instead —
loud, and diagnosable.

**The AUD trap.** `ACCESS_AUD` must be the AUD of the application that guards
`/api/events`. If you have several Access applications on that hostname — a
common shape is a broad app on `/` plus a path-scoped one on `/api/events` — the
app answering a probe to `/` or `/healthz` may be a *different* application with
a *different* AUD. Comparing the assertion against the wrong app's AUD produces
`audience mismatch` in `wrangler tail`, which reads exactly like a
misconfiguration of the right app. Copy the AUD from the application whose path
is `/api/events`, and confirm you are reading the right app's Overview page.

Related trap: if CI redeploys `wrangler.toml` on every push, a placeholder
`ACCESS_AUD` in `[vars]` **is** the outage. Deliver the value as a Worker secret
instead — secrets persist across script uploads, so stage it once before the
first deploy and there is no gap. (This is why our own
`wrangler.internal.toml` deliberately omits it.)

### 3.2 Route B — direct mTLS on your zone (API Shield / Client Certificates)

Fine for a plain Worker on your own zone; no Zero Trust needed.

1. **SSL/TLS → Client Certificates (mTLS)**: upload your CA.
2. Enable mTLS for the proxy hostname.
3. Add a WAF rule requiring a **verified** client certificate on `/api/events`.
   Cloudflare will happily pass `certPresented=1, certVerified=FAILED` to the
   origin otherwise; the Worker rejects that with a 403, but the WAF rule keeps
   the traffic off the Worker entirely.
4. Leave `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` **unset**, so the assertion header is
   ignored and only genuine mTLS is honored.

Do not mix routes casually: setting the Access vars on a zone-mTLS deployment
means a request carrying an assertion is evaluated as mode 1 first.

### 3.3 Smoke-test the ingress from a real device

Do this from one managed Mac before you touch the fleet. It is the same call the
plugins make, so it exercises the edge policy end to end:

```bash
CURL_SSL_BACKEND=secure-transport /usr/bin/curl -i -X POST \
  --cert "OktaManagementAttestation for <SERIAL>" \
  -H 'Content-Type: application/json' \
  --data '{"action":"claude.session.started","targets":[{"type":"session","id":"ingress-smoke-test"}]}' \
  https://audit-proxy.yourcompany.com/api/events
```

The certificate label is the keychain identity's label, which
`/workos-audit-setup` prints as `deviceCertificate` (or
`security find-identity`). Read the status line, not `curl`'s exit code:

- **202** — the whole path works. Note this wrote a real audit event.
- **502** — auth and attribution worked; WorkOS rejected the event, so go to
  [§4](#4-seed-the-audit-schemas-per-environment).
- **403 / 401** — edge or device-mapping problem; see
  [§7](#7-troubleshooting).
- **Any 3xx** — the Access policy is not Service Auth. This is the failure this
  whole section exists to prevent, and `-i` is how you see it.

### 3.4 Also do this

- **Rate-limit** `/api/events` per device, to cap the blast radius of a
  compromised laptop.
- Remember the pause kill switch **fails open** by design: if D1 is unreachable
  the proxy cannot see `paused: true` and keeps ingesting, because a control-plane
  outage must not silently drop the fleet's audit trail. The hard stop is removing
  the Access/mTLS policy in front of `/api/events`.

## 4. Seed the audit schemas, per environment

WorkOS rejects an event whose `action` has no registered schema, and schemas are
**per WorkOS environment**. Seed every environment you will ingest into
(staging and production are separate registries).

From the repo root, against the environment you want:

```bash
# Generic harness schemas — covers the Claude, Codex and pi event sets.
npm run create:harness-schemas -- --prefix=claude
npm run create:harness-schemas -- --prefix=codex
npm run create:harness-schemas -- --prefix=pi

# OpenClaw emits a richer native set (llm.input/output, agent.run.started,
# model.call.*) that the generic set does not cover — use its own script:
npm run create:openclaw-schemas
```

The prefix must match the plugin's `actionPrefix`: `claude`, `codex`, `openclaw`,
and `pi` respectively (each plugin's default; overridable via config, in which
case seed the prefix you configured).

The two scripts resolve credentials **differently** — worth knowing, because
"which environment did that just write to?" is the question you will be asking:

- `create:harness-schemas` (the audit-core CLI) takes `--api-key` and `--org`,
  and otherwise falls back to the active `workos` CLI environment. Passing
  `--api-key` explicitly is the reliable way to target a second environment from
  the same shell.
- `create:openclaw-schemas` (and the other per-plugin `create:*-schemas`
  scripts) read `WORKOS_API_KEY` from the environment, or `apiKey` from that
  plugin's own config file — no flag, no CLI fallback. Prefix that command with
  `WORKOS_API_KEY=sk_…` to be sure.

Both accept `--dry-run` to print what would be created without creating it; the
audit-core CLI also takes `--json`.

### The two rejection modes

Schema problems surface at the *WorkOS* boundary, not the proxy's. The proxy
answers **502** with a per-event report and logs the upstream detail:

```json
{"accepted":0,"rejected":[{"index":0,"reason":"upstream <status>"}]}
```

(`reason` is literally `upstream ` plus the status WorkOS returned; a network
failure reaching WorkOS reads `upstream request failed` instead, which is a
different problem.)

`npm run logs` in `packages/proxy` shows the matching
`workos rejected event { action, status, detail }` line — the `detail` is the
upstream explanation, and it is the fastest way to tell the two modes apart.

The 502 only happens when **every** event in the request was rejected. A batch
where one action lacks a schema and the rest are fine comes back **202** with
that event listed in `rejected`, and the client warns
`proxy rejected 1/12 event(s)`. So a single un-seeded action does not look like
an outage — which is exactly why it can sit there for weeks.

1. **No schema for the action.** Emitting `claude.tool.called` before that schema
   exists in this environment is rejected. Usually means you seeded a different
   environment, or you changed `actionPrefix` on the fleet without re-seeding.
2. **A missing required target.** The targets a schema declares are **required**,
   not advisory. `claude.tool.called` declares both a `session` target and a
   `tool` target — an event carrying only one of them is rejected, not
   accepted-with-a-warning. This mostly bites when you hand-roll events with
   `workos-audit-harness emit-event`. The plugins build both targets, but the
   session target is omitted when the harness payload carries no session id, so
   a tool event with a missing `session_id` upstream shows up here as a schema
   rejection rather than as a missing field.

**Undeclared metadata keys are accepted.** Metadata is the forgiving surface:
sending a key the schema does not declare does not fail the event. So if
ingestion breaks after a plugin upgrade, suspect actions and targets, not
metadata.

## 5. Roll the plugins out via MDM

Two independent things to deliver: the plugin itself, and the proxy URL.

### 5.1 The proxy URL — a machine-wide config file

The proxy URL is deliberately not hardcoded anywhere in the plugins; it is
company-specific. For a fleet, deliver it as a machine-wide JSON file:

| OS | Path |
|---|---|
| macOS | `/Library/Application Support/workos-audit/config.json` |
| Linux | `/etc/workos-audit/config.json` |
| Windows | `%ProgramData%\workos-audit\config.json` |

```json
{ "proxyUrl": "https://audit-proxy.yourcompany.com/api/events" }
```

Note the URL includes the `/api/events` path — it is the full endpoint, not the
hostname. **The file contains no key.** It is root-owned and world-readable
because there is nothing secret in it: the whole design is that the credential
lives in the Worker. Never put `apiKey` in this file.

Example Kandji custom script (Jamf/Intune equivalents are the same three lines):

```bash
#!/bin/zsh
dir="/Library/Application Support/workos-audit"
mkdir -p "$dir"
cat > "$dir/config.json" <<'EOF'
{ "proxyUrl": "https://audit-proxy.yourcompany.com/api/events" }
EOF
chmod 644 "$dir/config.json"
```

### 5.2 Precedence — exactly

From `packages/audit-core/src/config.mjs`, highest first:

1. **Environment variable** — `WORKOS_AUDIT_PROXY_URL` (plus per-harness aliases:
   `CODEX_WORKOS_AUDIT_PROXY_URL`, `OPENCLAW_WORKOS_AUDIT_PROXY_URL`, and the
   `CLAUDE_PLUGIN_OPTION_PROXY_URL` forms).
2. **Per-user config file** — `~/.claude/workos-audit/config.json`, or the Codex
   (`~/.codex/…`) / OpenClaw (`~/.openclaw/…`) equivalent. Overridable with
   `WORKOS_AUDIT_CONFIG_PATH`.
3. **MDM-managed machine config** — the file in §5.1. Overridable with
   `WORKOS_AUDIT_MANAGED_CONFIG_PATH`, which is the clean way to test your MDM
   payload without writing to `/Library`.
4. **Built-in default** — there is no default proxy URL, by design.

So a user can override an MDM-set value, and the MDM value applies to everyone
who hasn't. The same precedence governs `organizationId`, `actionPrefix`,
`actorId`/`actorType`/`actorName`, `location`, `userAgent`, and
`recordingEnabled`, all of which the managed file also honors — though under the
proxy, actor and organization are stamped server-side, so setting them locally
changes nothing about what lands in the log.

### 5.3 The per-machine opt-out

```json
{ "proxyUrl": null }
```

An explicit `null` is preserved rather than treated as absent, which is what
makes it an opt-out rather than a no-op. Put it in the **per-user** config file
to exempt one user from an MDM-set proxy, or in the **managed** file to exempt a
single device.

Be clear about what it means: with no proxy URL, the plugin falls back to a local
credential. If the machine has an API key or a logged-in WorkOS CLI, it keeps
recording *through that key*; if it has neither, `writeTransport` becomes `none`
and nothing is recorded. To stop recording entirely and unambiguously, set
`"recordingEnabled": false` (or export `WORKOS_AUDIT_RECORDING=0`) — the query
and status tools keep working.

### 5.4 Force-installing the plugin itself

For Claude Code, that is a *different* delivery channel (managed settings via the
Claude.ai admin console, MDM preferences, or a managed-settings file) with its
own precedence rules — including the sharp edge that the three sources **do not
merge**. See
[Enforce the plugin fleet-wide](../packages/claude-plugin/README.md#enforce-the-plugin-fleet-wide-managed-settings).

### 5.5 Verify on one device before the fleet

On a managed Mac, in Claude Code, run `/workos-audit-setup` and read
`writeTransport`. You want `proxy`. Then run a real prompt and confirm the events
arrive (the plugin's `workos_audit_query` tool, or the chat console).

## 6. Deploy the chat console (optional)

[`packages/chat`](../packages/chat) is an AuthKit-gated console over the same
audit trail. It is optional — the pipeline in §2–§5 is complete without it.

**[`packages/chat/README.md`](../packages/chat/README.md) is the source of truth**
for its deployment — secrets, models, AuthKit setup. It is being reworked for
self-hosting in the same pass as this guide, so follow it rather than anything
you remember from here. What follows is orientation only.

The shape of the work (all of it inside `packages/chat` — it is deliberately
**not** an npm workspace member and keeps its own `package-lock.json`, so run
`npm` there, not from the repo root):

- `npm run db:create` → paste the `database_id` into `wrangler.toml` →
  `npm run db:migrate:remote`; `npm run bucket:create` for the R2 bucket;
  `npm run deploy`.
- An AuthKit client in the **same WorkOS environment** the proxy writes into,
  with your redirect URI registered, plus an API key that can read the Audit Logs
  Export API. Set `AUDIT_CHAT_PUBLIC_HOSTNAME` to the hostname you actually serve
  from — the shipped value is a placeholder, and leaving it means AuthKit
  redirects to a hostname you do not own.
- Optionally bind the **proxy's** D1 database as `PROXY_DB`. That is how
  `/settings` manages the proxy's runtime settings (pause/resume, attribution
  org, device-cache TTL, cached device→user rows) — the proxy has no HTTP admin
  API. Without the binding the console still works and `/settings` renders a
  "no proxy database bound" state.
- Models go through a Cloudflare AI Gateway in your account (so provider keys
  live in the gateway, not the Worker), or direct provider keys as a fallback.

**Reachability is the thing to get right.** A Worker with no `workers.dev` URL,
no route and no custom domain deploys successfully and is then unreachable
forever — which is precisely how this app was served internally (through a
Workers for Platforms dispatch namespace). The shipped `wrangler.toml` therefore
keeps `workers_dev = true` and documents a commented `[[routes]]` block for your
own hostname; keep exactly one of the two.

Note the deliberate asymmetry with the proxy, and do not "fix" it: the proxy sets
`workers_dev = false` because it is an unauthenticated ingest endpoint that must
sit behind mTLS, while every chat route is AuthKit-gated, so its `workers.dev`
URL exposes a login page rather than audit data.

## 7. Troubleshooting

Start here: **what transport is this machine actually using?**

```text
/workos-audit-setup          # inside Claude Code — prints the status JSON
```

or, from a checkout:

```bash
node packages/claude-plugin/dist/scripts/print-config-status.mjs
# same script exists under packages/codex-plugin and packages/openclaw-plugin,
# each reading that harness's own config file
```

The headline field is `writeTransport`, which mirrors the emit path's branch
order exactly, so it cannot disagree with what a hook will really do:

| `writeTransport` | Meaning |
|---|---|
| `proxy` | Proxy URL configured **and** a device certificate found. The intended fleet state. |
| `proxy-no-device-certificate` | Proxy URL configured, no usable certificate (non-Mac, or the cert isn't in the keychain). Events are **skipped**, not sent another way. |
| `api-key` | No proxy URL; emitting directly with a local `sk_` key. |
| `workos-cli` | No proxy URL; emitting via the logged-in WorkOS CLI. |
| `none` | Nothing configured — events are logged locally and dropped. |

Also useful in that output: `proxySource` (which layer supplied the URL — env,
`config_file`, `managed_config`) tells you whether your MDM payload is actually
being read, and `deviceCertificate` names the keychain label in use.

`npm run audit-harness -- status` is **not** the same check — it reports
credential state only, which is actively misleading on a proxy-managed machine
(it will say `configured: false` on a machine whose ingestion is perfect).

Client-side failures print to stderr as
`workos-audit: proxy emit failed (…)`, and the proxy's own explanation is
included in that text. Server side, run `npm run logs` in `packages/proxy`
(`wrangler tail`).

| Symptom | Cause | Fix / where to look |
|---|---|---|
| **302** from `/api/events` (redirect to an Access login page) | The Access application on that path is an ordinary interactive-login app, not Service Auth. The certificate authenticates at the edge and Access redirects anyway; the request never reaches the Worker, so **nothing is logged anywhere** and ingestion stops silently. | Make the app **path-scoped to `/api/events`** with a single **Service Auth** policy and a certificate rule ([§3.1](#31-route-a--cloudflare-access-zero-trust)). Confirm with the smoke test in [§3.3](#33-smoke-test-the-ingress-from-a-real-device): any 3xx is this bug. |
| **401** `client certificate required` | No verified identity reached the Worker: no assertion *and* no `cf.tlsClientAuth`. Either nothing enforces mTLS on the path, or the client sent no cert, or (Access route) `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` are unset so the header was ignored, or you are on a dispatch namespace where direct mTLS can never work. | `wrangler tail` for `Cf-Access-Jwt-Assertion present but ignored…` — that message means the vars are missing. Otherwise re-check the edge config in [§3](#3-put-mtls-in-front-of-apievents). |
| **403** `invalid access assertion` | The signed assertion failed verification. | `wrangler tail` prints the exact reason: `audience mismatch` (wrong `ACCESS_AUD` — see the AUD trap in §3.1), `issuer mismatch` (wrong `ACCESS_TEAM_DOMAIN`), `expired`, `unknown signing key (kid)`. |
| **403** `unknown or unassigned device` | The certificate verified, but the serial maps to nobody: no `device_user` row (static mode), or the MDM reports no assigned user. | Insert the row ([§2.6](#26-map-devices-to-people)) or fix the MDM assignment. For loaners, switch `unassigned_device_policy` to `placeholder`. |
| **403** `no device serial in client certificate` | The certificate CN doesn't match `DEVICE_CERT_CN_PATTERN`. | Print the real CN and set the var to a regex whose first capture group is the device id. |
| **503** `audit ingestion is paused` + `Retry-After: 300` | The runtime-settings kill switch is on (possibly with an `auto_resume_at` that hasn't arrived). | The response body carries the pause reason. Clear it in the `proxy_settings` document (or the chat console's `/settings`). Note that clients which don't retry lose those events. |
| **502** with `{"accepted":0,"rejected":[{…,"reason":"upstream …"}]}` | WorkOS rejected every event: the action has **no schema in this environment**, or a **required target is missing**. | `wrangler tail` → `workos rejected event { action, status, detail }`. Re-seed the right environment / right prefix ([§4](#4-seed-the-audit-schemas-per-environment)), or add the missing target. Undeclared *metadata* keys are never the cause. |
| **413** `batch too large` / **422** `invalid audit event payload` | Client/proxy version skew: a proxy predating batch support answers 422 to `{events:[…]}`, one with a smaller cap answers 413. | Expected during a rollout — the client automatically resends the chunk one event at a time. If it persists, deploy the current proxy. |
| Deploy succeeded, nothing is reachable | The Worker has no hostname attached (and `workers_dev = false`). | Attach a route or custom domain ([§2.5](#25-deploy-and-attach-a-hostname)). Do not "fix" this by enabling `workers.dev` — that ingress has no certificate verification in front of it. |
| No errors, no events | `writeTransport` is `proxy-no-device-certificate` or `none`, or `recordingEnabled` is false. | See the transport table above. On a non-Mac this is the expected state ([§1](#the-limitation-the-mtls-client-path-is-macos-only)). |

### Known gaps in this guide

- The exact upstream HTTP status WorkOS returns for a schema rejection is not
  pinned down here; read it from the `workos rejected event` log line rather
  than matching on a number.
- Cloudflare's dashboard labels for Access policies and client-certificate
  settings move around. The requirement is what matters: a **path-scoped**
  application on `/api/events` whose only policy is **non-interactive service
  auth gated on a certificate**.
- The chat console's deployment steps are intentionally not duplicated here
  ([§6](#6-deploy-the-chat-console-optional)); `packages/chat/README.md` is
  authoritative.
