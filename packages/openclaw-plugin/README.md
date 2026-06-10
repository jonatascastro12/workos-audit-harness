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

## Configure WorkOS credentials

Preferred WorkOS CLI auth. If no organization ID is set, the harness finds or creates an organization named `Audit Log Harness` and uses it automatically:

```bash
npm run workos-auth-login
```

Explicit API key:

```bash
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
```

OpenClaw-specific environment variables take precedence over generic WorkOS values:

```bash
export OPENCLAW_WORKOS_AUDIT_ACTION_PREFIX="openclaw"
export OPENCLAW_WORKOS_AUDIT_RECORDING="1"
```

Config file:

```bash
mkdir -p ~/.openclaw/workos-audit
cat > ~/.openclaw/workos-audit/config.json <<'JSON'
{
  "apiKey": "sk_...",
  "organizationId": "org_...",
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
