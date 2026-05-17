---
description: Configure or troubleshoot the WorkOS audit plugin
allowed-tools: Bash(node:*), mcp__workos-audit__workos_audit_status
---

You are helping configure the local WorkOS Audit Claude Code plugin.

Current plugin configuration visible to this command:

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/print-config-status.mjs"`

Follow these rules:

1. Do **not** ask the user to paste a WorkOS API key into Claude chat.
2. If `configured` is false, explain these setup paths:
   - Preferred WorkOS CLI auth (uses staging credentials provisioned by `workos auth login`; if no organization id is set, the harness finds or creates `Audit Log Harness` automatically):
     ```bash
     npm --prefix /Users/jonatas/.pi/agent/extensions/workos-audit-logs run workos-auth-login
     ```
   - Recommended installed-plugin fallback when Claude did not show the userConfig prompt:
     ```bash
     npm --prefix "${CLAUDE_PLUGIN_ROOT}" run configure
     ```
     This prompts in the terminal and writes `~/.claude/workos-audit/config.json` with mode `0600`; the API key can be left blank when WorkOS CLI auth is configured.
   - Local development with explicit API key:
     ```bash
     export WORKOS_API_KEY="sk_..."
     export WORKOS_ORGANIZATION_ID="org_..."
     claude --plugin-dir ./claude-plugin
     ```
   - Installed/enabled plugin userConfig, if Claude prompts for it: `organization_id` and `api_key` are optional when `workos auth login` has been run; blank `organization_id` uses/creates `Audit Log Harness`.
3. Tell the user to restart Claude after changing plugin configuration. Hooks and MCP servers are loaded at startup.
4. If the plugin appears configured, call the `workos_audit_status` MCP tool if available and summarize whether audit reads/writes should work.
5. If MCP tools are unavailable, tell the user the MCP server did not load and recommend starting Claude with debug enabled.
