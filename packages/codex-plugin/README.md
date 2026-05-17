# workos-audit Codex plugin

Local Codex plugin that:
- exposes `workos_audit_query` and `workos_audit_status` over MCP
- optionally emits Codex lifecycle events to WorkOS via plugin hooks

## Included audit actions

- `codex.session.started`
- `codex.prompt.submitted`
- `codex.tool.called`
- `codex.permission.requested`
- `codex.tool.completed`
- `codex.tool.failed`
- `codex.turn.completed`

## Install from the local marketplace

This repo has a Codex marketplace manifest at `.agents/plugins/marketplace.json`.

From this repo root:

```bash
codex plugin marketplace add .
```

Then restart Codex, open the plugin directory, and install/enable `workos-audit` from the `WorkOS Audit Plugins` marketplace.

Codex caches local plugin installs. After changing this plugin, refresh/reinstall from the marketplace (or bump the plugin version) and restart Codex.

## Configure WorkOS credentials

Codex plugins do not currently expose Claude-style `userConfig` prompts, so use WorkOS CLI auth plus an organization ID, environment variables, or a config file.

Preferred WorkOS CLI auth. If no organization ID is set, the harness finds or creates an organization named `Audit Log Harness` and uses it automatically:

```bash
npm run workos-auth-login
# Optional:
export CODEX_WORKOS_AUDIT_ACTION_PREFIX="codex"
codex
```

Explicit API key:

```bash
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
# Optional:
export CODEX_WORKOS_AUDIT_ACTION_PREFIX="codex"
codex
```

Config file:

```bash
mkdir -p ~/.codex/workos-audit
cat > ~/.codex/workos-audit/config.json <<'JSON'
{
  "apiKey": "sk_...",
  "organizationId": "org_...",
  "actionPrefix": "codex",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "codex",
  "userAgent": "codex-workos-audit/1"
}
JSON
chmod 600 ~/.codex/workos-audit/config.json
```

Override the config path with `WORKOS_AUDIT_CONFIG_PATH` or `CODEX_WORKOS_AUDIT_CONFIG_PATH`.

After starting Codex, call `workos_audit_status` to verify the MCP server sees the config.

## Enable lifecycle hooks

Plugin-bundled hooks are opt-in in Codex. Add this to `~/.codex/config.toml`:

```toml
[features]
plugin_hooks = true
```

Restart Codex, run `/hooks`, review the `workos-audit` plugin hooks, and trust them. Hooks use `PLUGIN_ROOT`/`PLUGIN_DATA` and also work with Codex's Claude compatibility env vars.

## Local MCP development

From this folder:

```bash
npm install
node server/index.mjs
```

The MCP server communicates over stdio. For normal Codex use, let the plugin `.mcp.json` start it.

## Schema scripts

From the repo root. The generic harness schemas work with any coding-agent integration and can use either `WORKOS_API_KEY` or the active `workos` CLI environment created by `npm run workos-auth-login`:

```bash
npm run create:harness-schemas -- --prefix=codex --dry-run
npm run create:harness-schemas -- --prefix=codex
```

Legacy Codex-specific schemas are still available:

```bash
npm run create:codex-schemas -- --prefix=codex --dry-run
npm run remove:codex-schemas -- --prefix=codex --dry-run
```
