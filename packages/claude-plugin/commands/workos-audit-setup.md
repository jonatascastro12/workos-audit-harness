---
description: Configure or troubleshoot the WorkOS audit plugin
allowed-tools: Bash(node:*), mcp__workos-audit__workos_audit_status
---

You are helping configure the local WorkOS Audit Claude Code plugin.

Current plugin configuration visible to this command:

!`node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/print-config-status.mjs"`

Follow these rules:

1. Do **not** ask the user to paste a WorkOS API key into Claude chat.
2. **Lead with credential status.** Read `credentialSource` and `workosCli` from the JSON above and tell the user in one line which case applies:
   - `credentialSource: "api-key"` → "Using an explicit WorkOS API key from `<sources.apiKey>`." Audit reads/writes should work.
   - `credentialSource: "workos-cli"` and `workosCli.loggedIn: true` → "Signed into the WorkOS CLI (active environment: `<workosCli.activeEnvironment>`). Audit reads/writes should work." No further action is needed unless they want to override.
   - `credentialSource: "none"` (i.e. `configured: false`) → Tell them they are **not signed in** and quote `workosCli.remediation` verbatim. Then explain the setup paths below.
3. If `configured` is false, explain these setup paths:
   - Preferred WorkOS CLI auth (uses staging credentials provisioned by `workos auth login`; if no organization id is set, the harness finds or creates `Audit Log Harness` automatically):
     ```bash
     npx -y workos@latest auth login
     ```
     Users can verify CLI auth from any shell with `npx -y workos@latest auth status --mode agent`.
   - Recommended installed-plugin fallback when Claude did not show the userConfig prompt:
     ```bash
     npm --prefix "${CLAUDE_PLUGIN_ROOT}" run configure
     ```
     This prompts in the terminal and writes `~/.claude/workos-audit/config.json` with mode `0600`; the API key can be left blank when WorkOS CLI auth is configured.
   - Local development with explicit API key:
     ```bash
     export WORKOS_API_KEY="sk_..."
     export WORKOS_ORGANIZATION_ID="org_..."
     claude --plugin-dir ./packages/claude-plugin
     ```
   - Installed/enabled plugin userConfig, if Claude prompts for it: `organization_id` and `api_key` are optional when `workos auth login` has been run; blank `organization_id` uses/creates `Audit Log Harness`.
4. Tell the user to restart Claude after changing plugin configuration. Hooks and MCP servers are loaded at startup.
5. If the plugin appears configured, call the `workos_audit_status` MCP tool if available and confirm that the MCP server sees the same credential state as the JSON above.
6. If MCP tools are unavailable, tell the user the MCP server did not load and recommend starting Claude with debug enabled.
