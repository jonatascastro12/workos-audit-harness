# workos-audit OpenClaw plugin

Native OpenClaw plugin that:

- exposes `workos_audit_query` and `workos_audit_status` as OpenClaw agent tools
- emits OpenClaw lifecycle events to WorkOS via plugin hooks

## Included audit actions

- `openclaw.session.started`
- `openclaw.session.ended`
- `openclaw.prompt.submitted`
- `openclaw.message.sent`
- `openclaw.agent.run.started`
- `openclaw.llm.input`
- `openclaw.llm.output`
- `openclaw.tool.called`
- `openclaw.tool.completed`
- `openclaw.tool.failed`
- `openclaw.model.call.started`
- `openclaw.model.call.completed`
- `openclaw.model.call.failed`
- `openclaw.turn.completed`
- `openclaw.turn.failed`

## Install locally

From this folder:

```bash
npm install
npm run bundle
openclaw plugins install .
openclaw plugins enable workos-audit
```

Restart the OpenClaw gateway after installing or updating the plugin so startup hook registration is refreshed.

## Configure recording

Recording is proxy-first. The plugin should send lifecycle audit events to the shared WorkOS audit proxy over device mTLS, so the OpenClaw plugin client does not need a `sk_...` API key for event emission. In a managed deployment this proxy URL can be shipped by MDM; for local testing, set it manually before starting OpenClaw:

```bash
export OPENCLAW_WORKOS_AUDIT_PROXY_URL="https://cd26-workos-audit-proxy.workos.tools/api/events"
export OPENCLAW_WORKOS_AUDIT_ACTION_PREFIX="openclaw"
export OPENCLAW_WORKOS_AUDIT_RECORDING="1"
```

Direct WorkOS credentials are still supported when someone explicitly wants that mode, and are also useful for development, non-mTLS environments, schema creation, and querying existing audit logs:

```bash
npm run workos-auth-login
# or:
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
```

OpenClaw-specific environment variables take precedence over generic WorkOS values:

```bash
export OPENCLAW_WORKOS_AUDIT_API_KEY="sk_..."
export OPENCLAW_WORKOS_AUDIT_ORGANIZATION_ID="org_..."
```

Config file:

```bash
mkdir -p ~/.openclaw/workos-audit
cat > ~/.openclaw/workos-audit/config.json <<'JSON'
{
  "proxyUrl": "https://cd26-workos-audit-proxy.workos.tools/api/events",
  "actionPrefix": "openclaw",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "openclaw",
  "userAgent": "openclaw-workos-audit/1"
}
JSON
chmod 600 ~/.openclaw/workos-audit/config.json
```

Override the config path with `WORKOS_AUDIT_CONFIG_PATH` or `OPENCLAW_WORKOS_AUDIT_CONFIG_PATH`.

## Query-only install

Set `recordingEnabled` to `false` in `~/.openclaw/workos-audit/config.json`, disable it in plugin config, or export `OPENCLAW_WORKOS_AUDIT_RECORDING=0`. The query/status tools remain available.

## Schema scripts

From the repo root:

```bash
npm run create:openclaw-schemas -- -- --prefix=openclaw --dry-run
npm run create:openclaw-schemas -- -- --prefix=openclaw
```
