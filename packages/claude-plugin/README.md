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

## Enforce the plugin fleet-wide (managed settings)

To install and force-enable the plugin for a whole fleet, deliver this through Claude Code [managed settings](https://code.claude.com/docs/en/settings#settings-files). `extraKnownMarketplaces` registers the marketplace automatically and `enabledPlugins` force-installs the plugin so users cannot disable it:

```json
{
  "extraKnownMarketplaces": {
    "workos-audit-plugins": {
      "source": { "source": "github", "repo": "workos/workos-audit-harness" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": { "workos-audit@workos-audit-plugins": true },
  "env": { "CLAUDE_WORKOS_AUDIT_RECORDING": "1" }
}
```

Optionally add `strictKnownMarketplaces` with the same source to also block users from adding any other marketplace.

### Pick one delivery mechanism

Claude Code reads managed settings from three sources, and **they do not merge — the first source that delivers any keys wins and the rest are ignored entirely**, in this order:

1. **Server-managed settings** — [Claude.ai](https://claude.ai) → Admin Settings → Claude Code → Managed settings. Applies to every user signed into the org (no per-group targeting), including unmanaged devices.
2. **MDM/OS policies** — macOS `com.anthropic.claudecode` managed preferences domain or the Windows `HKLM\SOFTWARE\Policies\ClaudeCode` registry key.
3. **File-based** — `/Library/Application Support/ClaudeCode/managed-settings.json` on macOS, `/etc/claude-code/` on Linux, `C:\Program Files\ClaudeCode\` on Windows.

The practical consequence: if your org sets *anything* in the Claude.ai admin console — even a single unrelated key — an MDM-deployed `managed-settings.json` is silently ignored on every machine. So either put the JSON above in the server-managed settings (merged with whatever is already there), or keep the admin console config completely empty and deploy via MDM. Use MDM when you need per-device targeting (for example, only enrolled smart groups), since server-managed settings are org-wide only. See [settings precedence](https://code.claude.com/docs/en/settings#settings-precedence).

### Caveats

- This repo is private: auto-install only succeeds on machines whose git credentials can clone `workos/workos-audit-harness`.
- Server-managed settings only bind accounts signed into the org. The file-based config still works as a backstop for users on other accounts, but it is not a substitute on org accounts.
- For device-scoped *recording* with an org-wide install, leave recording controlled by the MDM-delivered `/Library/Application Support/workos-audit/config.json` (see [Fleet rollout](../../README.md#fleet-rollout-no-key-on-laptops)) — the hooks no-op on devices without it.

### Verify on a device

- `/status` inside Claude Code shows which managed source is active.
- `claude plugin list` should show `workos-audit@workos-audit-plugins`.
- A fresh shell inside Claude Code should show `CLAUDE_WORKOS_AUDIT_RECORDING=1`.

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

## Onboarding wizard

Once the plugin is installed, run `/workos-audit:workos-audit-setup` from inside Claude Code. The slash command prints the current credential state and a single launch line:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/configure.mjs"
```

Run that in your terminal. The wizard is fully deterministic — no LLM in the loop — and walks through:

1. **Credentials** — pick WorkOS CLI auth (default when `workos auth login` has been run), enter an explicit API key (production or staging), or skip and use `WORKOS_API_KEY` at runtime.
2. **Organization** — the wizard calls `GET /organizations` with the chosen credential and lets you pick from the list, leave blank (auto-find/create `Audit Log Harness`), or type an id manually.
3. **Recording on/off** — answer N for a query-only install. The hooks short-circuit when off; the `workos_audit_query` MCP tool stays active either way.
4. **Identity & context** — actor / location / user-agent overrides, all optional.

The wizard writes `~/.claude/workos-audit/config.json` with mode `0600`. Restart Claude Code after it exits so hooks and MCP servers reload.

To verify what the running MCP server sees, ask Claude to call `workos_audit_status`. To self-check outside Claude, run `npx -y workos@latest auth status --mode agent`. From a clone of this repo, `npm run audit-harness -- status` shows the same view plus harness-config fields.

### Cloud Claude (no terminal)

When the plugin is enabled in Claude on the web, Claude Code prompts for plugin `userConfig` values directly. All wizard fields are exposed there, including `recording_enabled` (set to `false` for query-only). The org-listing step is terminal-only — paste an `org_…` id manually if needed, or leave blank to auto-find/create `Audit Log Harness`.

### Other entry points

These are fallbacks, not the recommended path. Use them when the wizard is not an option:

- `npm run configure -w @workos-inc/claude-audit-plugin` — same wizard, when running from this repo.
- Set `recordingEnabled: false` directly in `~/.claude/workos-audit/config.json`, or export `CLAUDE_WORKOS_AUDIT_RECORDING=0` / `WORKOS_AUDIT_RECORDING=0` before launching Claude.

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
