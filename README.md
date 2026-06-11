# workos-audit-chat

**Live:** [https://cd26-workos-audit-chat.workos.tools](https://cd26-workos-audit-chat.workos.tools)

An AI chat console for the [workos-audit-harness](https://github.com/workos/workos-audit-harness) audit trail. Admins sign in with [AuthKit](https://workos.com/docs/user-management) and ask natural-language questions about what the AI coding-agent fleet did — "who ran bash commands yesterday?", "when was that file deleted, and by whom?" — and the model answers by querying the tenant's [WorkOS Audit Logs Export API](https://workos.com/docs/audit-logs/exporting-events), citing concrete events.

The app represents the same WorkOS tenant/environment the audit ingestion proxy ([cd26-workos-audit-proxy](https://github.com/workos/workos-audit-proxy)) writes into: it reuses the proxy's `AUDIT_HARNESS_WORKOS_API_KEY` / `AUDIT_HARNESS_WORKOS_ORG_ID` secrets unless overridden.

## How it works

- **React Router 7** on Cloudflare Workers (standard `scaffold app create` internal-app stack, WorkOS design system, dispatch namespace + `workos.tools` route).
- **AuthKit** (`@workos-inc/authkit-react-router`) gates every route; the chat API additionally re-checks the session and the optional allowed-email-domain.
- **AI SDK v6** (`ai` + `@ai-sdk/react`) streams the chat. The model runs tools server-side:
  - `query_audit_logs` — creates an Audit Logs export (range + action/actor/target filters), polls it, downloads and parses the CSV, and returns events plus action/actor/target-type counts.
  - `list_known_actions` — the harness action catalog (`claude.tool.called`, `codex.session.started`, …).
- **Models** route through the Cloudflare AI Gateway binding (`internal-app-gateway`, stored provider keys — no model API keys in this app). Default model: `anthropic/claude-sonnet-4-6`. Set `AUDIT_CHAT_MODEL` to any `anthropic/...` or `openai/...` model; set `AUDIT_CHAT_ANTHROPIC_API_KEY` / `AUDIT_CHAT_OPENAI_API_KEY` to bypass the gateway with direct keys.

## Configuration

Secrets live in the shared `claude-day` Doppler project (`dev` for local, `prd` synced to Cloudflare by CI on push to `main`).

| Variable | Required | Notes |
| --- | --- | --- |
| `AUDIT_CHAT_WORKOS_CLIENT_ID` | yes | AuthKit client for the **same WorkOS environment** as the API key below. |
| `AUDIT_CHAT_WORKOS_COOKIE_PASSWORD` | yes | 32+ chars (already set in dev + prd). |
| `AUDIT_CHAT_WORKOS_API_KEY` | no | Falls back to the proxy's `AUDIT_HARNESS_WORKOS_API_KEY`. |
| `AUDIT_CHAT_WORKOS_ORG_ID` | no | Falls back to `AUDIT_HARNESS_WORKOS_ORG_ID`. |
| `AUDIT_CHAT_WORKOS_REDIRECT_URI` | dev only | `http://localhost:5173/callback` in dev; production defaults to `https://<AUDIT_CHAT_PUBLIC_HOSTNAME>/callback`. |
| `AUDIT_CHAT_ALLOWED_EMAIL_DOMAIN` | no | e.g. `workos.com` to restrict who may use the console. |
| `AUDIT_CHAT_MODEL` | no | Default `anthropic/claude-sonnet-4-6`. |
| `AUDIT_CHAT_AI_GATEWAY` | no | Default `internal-app-gateway`. |

### One-time WorkOS dashboard setup

In the WorkOS environment the proxy ingests into:

1. Enable AuthKit (User Management) and copy the **Client ID** → set `AUDIT_CHAT_WORKOS_CLIENT_ID` in Doppler `claude-day/dev` and `claude-day/prd`.
2. Add redirect URIs: `https://cd26-workos-audit-chat.workos.tools/callback` and `http://localhost:5173/callback`.
3. Ensure the admins who should use the console can sign in (AuthKit users or SSO).

CI syncs Doppler `prd` secrets to Cloudflare only on pushes to `main` — after adding the client ID, trigger a deploy (push or re-run the workflow).

## Local development

```bash
npm install
npm run dev   # doppler mounts claude-day/dev as .dev.vars
```

Open http://localhost:5173 — you'll be redirected to AuthKit, then land on the console.

## Deploying

Merges to `main` build, migrate, deploy into the `workos-tools-apps` dispatch namespace, sync Doppler secrets, and register the `ROUTES` KV entry (GitHub Actions). Manual deploy: `npm run deploy`.

## Validation

```bash
npm run lint
npm run format:check
npm run verify   # tsc --noEmit && build
```
