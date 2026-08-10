# workos-audit-chat

An AI chat console for the [workos-audit-harness](https://github.com/workos/workos-audit-harness) audit trail. Admins sign in with [AuthKit](https://workos.com/docs/user-management) and ask natural-language questions about what their fleet of AI coding agents did — "who ran bash commands yesterday?", "when was that file deleted, and by whom?" — and the model answers by querying the tenant's [WorkOS Audit Logs Export API](https://workos.com/docs/audit-logs/exporting-events), citing concrete events.

It is a React Router 7 app on Cloudflare Workers. **Everything below is the self-hosting path: your Cloudflare account, your WorkOS environment.** The WorkOS-internal deployment is a separate config, documented in the last section.

> Deliberately **not** an npm workspace member — it keeps its own `package-lock.json` (vendored WorkOS design system + React Router toolchain). Run every `npm` command from `packages/chat`, not the repo root.

## How it works

- **AuthKit** (`@workos-inc/authkit-react-router`) gates every UI route (`ensureSignedIn`); the chat and settings endpoints re-check the session server-side per request, plus the optional allowed-email-domain.
- **Organization picker** — the app lists the environment's organizations (`GET /organizations`) and the admin picks whose audit logs to investigate (persisted per browser). Each request's org is validated server-side against the live list.
- **AI SDK v6** streams the chat. The model runs tools server-side: `query_audit_logs` (creates an Audit Logs export with range + action/actor/target filters, polls it, downloads and parses the CSV, returns events plus action/actor/target-type counts) and `list_known_actions` (the harness action catalog: `claude.tool.called`, `codex.session.started`, …).
- **Chat threads** live in this app's own D1 database (`DB`); nothing else is stored.
- **`/settings`** manages the ingestion proxy's runtime settings, and is the only feature that needs a second binding — see [Optional: manage the ingestion proxy](#optional-manage-the-ingestion-proxy-from-settings).

## Self-hosting

### Prerequisites

- **A Cloudflare account** with Workers, D1 and Workers AI available (`npx wrangler login`). Workers AI is used through an AI Gateway — see [AI Gateway](#ai-gateway) below.
- **A WorkOS environment** with AuthKit enabled and Audit Logs already receiving harness events (via [`packages/proxy`](../proxy) or the plugin's API-key transport). The console only reads; it never writes events.
- **Node 22** and npm.
- **A model** — either a [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) in your account holding an Anthropic or OpenAI key, or the provider key itself as a Worker secret.

### 1. Install

```bash
cd packages/chat
npm install
```

### 2. Create the database and bucket

```bash
npm run db:create        # prints a database_id
```

Paste the `database_id` into **`wrangler.toml`** (the `DB` block, replacing the `00000000-…` placeholder). Then apply the migrations:

```bash
npm run db:migrate:remote
```

### 3. Deploy once to learn your URL

```bash
npm run deploy
```

`wrangler.toml` ships with `workers_dev = true`, so the deploy prints a reachable URL:
`https://workos-audit-chat.<your-workers-subdomain>.workers.dev`. The app will answer with an error until step 4 — that is expected.

> **Why `workers_dev = true` here but `false` in [`packages/proxy`](../proxy)?** The proxy is an unauthenticated ingest endpoint that must sit behind mTLS, so a `workers.dev` URL would be an open door. This console is the opposite: every route is AuthKit-gated, so the public URL exposes a login page, not audit data. Prefer your own hostname? `wrangler.toml` has a commented `[[routes]]` block with `custom_domain = true`; enable it and set `workers_dev = false`.

### 4. Set the public hostname

Put the hostname from step 3 (no scheme) into `AUDIT_CHAT_PUBLIC_HOSTNAME` in `wrangler.toml`, replacing the `<your-subdomain>` placeholder. It is shown in the UI and is what builds the default AuthKit redirect URI (`https://<hostname>/callback`), so leaving the placeholder means AuthKit redirects to a hostname you do not own.

### 5. Set the secrets

Each one with `npx wrangler secret put <NAME>`:

| Secret | Required | Where the value comes from |
| --- | --- | --- |
| `AUDIT_CHAT_WORKOS_CLIENT_ID` | yes | WorkOS Dashboard → **AuthKit / API keys** → Client ID (`client_…`). Must be the same environment as the API key below. |
| `AUDIT_CHAT_WORKOS_API_KEY` | yes | WorkOS Dashboard → **API keys** → secret key (`sk_…`). Used to list organizations and to create Audit Logs exports. `sk_test_…` labels the console "sandbox" in the header. |
| `AUDIT_CHAT_WORKOS_COOKIE_PASSWORD` | yes | Generate one: `openssl rand -base64 32` (32+ characters). Rotating it signs everyone out. |
| `AUDIT_CHAT_ALLOWED_EMAIL_DOMAIN` | recommended | Your own domain, e.g. `example.com` — restricts the console to users with that email domain. Unset means any user who can sign in through your AuthKit instance may read your audit trail. |
| `AUDIT_CHAT_WORKOS_ORG_ID` | no | WorkOS Dashboard → **Organizations** (`org_…`). Only pre-selects the default in the picker; unset means "first organization in the list". |
| `AUDIT_CHAT_WORKOS_REDIRECT_URI` | no | Overrides the default `https://<AUDIT_CHAT_PUBLIC_HOSTNAME>/callback`. Required for local dev (`http://localhost:5173/callback`). |
| `AUDIT_CHAT_MODEL` | no | `provider/model`, default `anthropic/claude-sonnet-4-6`. Any `anthropic/…` or `openai/…` model. |
| `AUDIT_CHAT_AI_GATEWAY` | no | Name of an AI Gateway **in your account** that holds a stored provider key. The built-in default (`internal-app-gateway`) only exists in the WorkOS account, so set this or a direct key below. |
| `AUDIT_CHAT_ANTHROPIC_API_KEY` | no | An Anthropic key — bypasses the AI Gateway entirely (simplest path). |
| `AUDIT_CHAT_OPENAI_API_KEY` | no | Same for OpenAI, when `AUDIT_CHAT_MODEL` is an `openai/…` model. |

`AUDIT_HARNESS_WORKOS_API_KEY` and `AUDIT_HARNESS_WORKOS_ORG_ID` are accepted as fallbacks for the two WorkOS values, so a deployment that shares one secret store with the proxy does not need to duplicate them.

### 6. Register the redirect URI in WorkOS, then deploy again

In the WorkOS Dashboard, add `https://<your-hostname>/callback` to the AuthKit **Redirects** list (add `http://localhost:5173/callback` too if you plan to develop locally). Then:

```bash
npm run deploy
```

Open the URL, sign in through AuthKit, and ask the console a question. Secrets take effect immediately; changes to `wrangler.toml` vars need this redeploy.

### Optional: manage the ingestion proxy from `/settings`

If you also deployed [`packages/proxy`](../proxy) **in the same Cloudflare account**, uncomment the `PROXY_DB` block in `wrangler.toml`, paste the proxy's `database_id`, and redeploy. `/settings` then lets admins pause/resume ingestion (with a reason and optional auto-resume), choose the organization events are attributed to, set the Kandji device-cache TTL and the unassigned-device policy, and view/purge the cached device→user mappings.

Settings are written as one JSON document (`app_state` key `proxy_settings`) straight into the proxy's D1 database — the proxy has no HTTP admin API. It re-reads that document per ingested event and falls back to its own env vars for absent or malformed fields, so changes apply without a redeploy and a missing row never breaks ingest. The write contract lives in `app/lib/proxy-settings.server.ts`; the proxy's tolerant reader is `packages/proxy/src/settings.ts`. Note the kill switch fails **open** during a proxy-database outage, by design.

**Without the binding the console is fully functional** — `/settings` renders a "no proxy database bound — settings unavailable" state instead of failing, and nothing else in the app touches that database.

## Local development

Create `.dev.vars` (git-ignored) next to `wrangler.toml`:

```ini
AUDIT_CHAT_WORKOS_CLIENT_ID=client_...
AUDIT_CHAT_WORKOS_API_KEY=sk_test_...
AUDIT_CHAT_WORKOS_COOKIE_PASSWORD=<32+ random characters>
AUDIT_CHAT_WORKOS_REDIRECT_URI=http://localhost:5173/callback
AUDIT_CHAT_ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev   # `predev` applies the migrations to the local D1 copy first
```

Open http://localhost:5173 — you are redirected to AuthKit, then land on the console. `PROXY_DB` is not bound locally, so `/settings` shows the "no proxy database bound" state; to exercise it, bind the block in `wrangler.toml` and apply the proxy's migrations to the local copy:

```bash
npx wrangler d1 execute workos-audit-proxy-db --local --file ../proxy/migrations/0001_create_device_user.sql
npx wrangler d1 execute workos-audit-proxy-db --local --file ../proxy/migrations/0002_create_app_state.sql
```

## Validation

```bash
npm run lint
npm run format:check
npm run verify   # tsc --noEmit && build
```

## WorkOS-internal deployment

WorkOS's own deployment of this console lives in the private
`workos/workos-audit-harness-deploy` repository: it builds this package from a
pinned commit of this repo with an internal wrangler config overlaid, so
nothing WorkOS-specific (account ids, resource names, secret stores) needs to
exist here. External adopters deploy the vendor-neutral `wrangler.toml` — see
[Deploy to your own Cloudflare account](#deploy-to-your-own-cloudflare-account).

One consequence matters for contributors: **which wrangler config ships is
decided at BUILD time, not deploy time.** The Cloudflare vite plugin resolves
the config named by `WRANGLER_CONFIG_PATH` during `react-router build`, bakes
it into `build/server/wrangler.json`, and writes `.wrangler/deploy/config.json`
for `wrangler deploy` to follow — passing `--config` at deploy time bypasses
that redirect and fails outright. And if you **add or rename a binding or var
in `wrangler.toml`**, flag it in your PR: the internal overlay config must be
updated in step, or the internal deploy's config-proof step will fail.
