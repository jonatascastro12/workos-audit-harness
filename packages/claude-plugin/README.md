# workos-audit Claude plugin

Local Claude Code plugin that:
- exposes `workos_audit_query` over MCP
- emits Claude Code lifecycle events to WorkOS via hooks

## Included audit actions

- `claude.session.started`
- `claude.session.ended`
- `claude.prompt.submitted`
- `claude.tool.called`
- `claude.tool.completed`
- `claude.tool.failed`
- `claude.turn.completed`
- `claude.turn.failed`

These match the default schemas created by `scripts/create-claude-schemas.mjs`. Token usage metadata is included on `claude.turn.completed`, `claude.turn.failed`, and `claude.session.ended` events when Claude's transcript contains usage data.

## Install from the local marketplace

This repo has a local Claude Code marketplace manifest at `.claude-plugin/marketplace.json`.

From this repo root:

```bash
claude plugin marketplace add . --scope user
claude plugin install workos-audit@workos-audit-plugins --scope user
```

The marketplace is already added on this machine. If you already have the plugin installed or you make local changes, update it with:

```bash
claude plugin update workos-audit@workos-audit-plugins
```

After installing or updating, restart Claude Code.

## Load locally without installing

From this repo:

```bash
claude --plugin-dir ./packages/claude-plugin
```

For local development, the preferred configuration is WorkOS CLI auth. If no organization ID is set, the harness finds or creates an organization named `Audit Log Harness` and uses it automatically:

```bash
npm run workos-auth-login
claude --plugin-dir ./packages/claude-plugin
```

You can still use an explicit API key if needed:

```bash
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
claude --plugin-dir ./packages/claude-plugin
```

When installed/enabled as a Claude Code plugin, Claude may prompt for plugin `userConfig` values. `organization_id` and `api_key` are optional when `workos auth login` has configured an active WorkOS CLI environment; leaving `organization_id` blank uses/creates `Audit Log Harness`. The other values are optional and can be left blank to use defaults.

If Claude does not show a plugin config prompt, use the terminal configurator instead. It prompts outside chat, hides the API key input, and writes `~/.claude/workos-audit/config.json` with mode `0600`:

```bash
npm run configure -w @workos-inc/claude-audit-plugin
```

After Claude starts, run `/workos-audit-setup` or ask Claude to call `workos_audit_status` to verify the MCP server sees the config.

## Query-only install (recording disabled)

You can install the plugin purely to query audit logs without emitting any events:

- Run `npm run configure -w @workos-inc/claude-audit-plugin` and answer `n` at the "Record audit events…" prompt, or
- Set `recordingEnabled: false` in `~/.claude/workos-audit/config.json`, or
- Export `CLAUDE_WORKOS_AUDIT_RECORDING=0` (or `WORKOS_AUDIT_RECORDING=0`) before launching Claude.

With recording disabled, the `emit-event` hooks short-circuit, but the `workos_audit_query` MCP tool stays available.

## Schema scripts

From the repo root. The generic harness schemas work with any coding-agent integration and can use either `WORKOS_API_KEY` or the active `workos` CLI environment created by `npm run workos-auth-login`:

```bash
npm run create:harness-schemas -- --prefix=claude --dry-run
npm run create:harness-schemas -- --prefix=claude
```

Legacy Claude-specific schemas are still available:

```bash
npm run create:claude-schemas -- --prefix=claude --dry-run
npm run remove:claude-schemas -- --prefix=claude --dry-run
```

`remove:claude-schemas` lists matching schema versions and explains that WorkOS currently documents create/list endpoints, but no public schema delete endpoint.

## Notes

- Configure the plugin with your WorkOS API key and organization ID when Claude prompts for plugin settings.
- This repo currently provides the runtime dependencies from the repo root `node_modules`, which is enough for local development with `--plugin-dir`.
- Before publishing this plugin externally, bundle the MCP server or ship plugin-local dependencies.
