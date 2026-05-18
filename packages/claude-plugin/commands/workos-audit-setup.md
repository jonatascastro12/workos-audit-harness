---
description: Configure or troubleshoot the WorkOS audit plugin
allowed-tools: Bash(node:*), mcp__workos-audit__workos_audit_status
---

You are launching the local WorkOS Audit Claude Code plugin wizard.

Current plugin configuration:

!`node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/print-config-status.mjs"`

Follow these rules. Do not improvise an option menu — the wizard is the source of truth.

1. **Lead with one line** that summarizes credential state from the JSON above:
   - `credentialSource: "api-key"` → "Using an explicit WorkOS API key. Audit reads/writes should work."
   - `credentialSource: "workos-cli"` and `workosCli.loggedIn: true` → "Signed into the WorkOS CLI (active environment: `<workosCli.activeEnvironment>`). Audit reads/writes should work."
   - `credentialSource: "none"` (`configured: false`) → "Not signed in. Run the wizard below to configure."
2. **Always show this one launch line** verbatim, in a single fenced code block. Do not add option menus, alternatives, or commentary around it:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/configure.mjs"
   ```

   The wizard runs in the user's terminal. It walks through credential mode → organization selection (lists orgs available to the chosen credential) → recording on/off → identity. It writes `~/.claude/workos-audit/config.json` with mode `0600`.
3. **Surface the recording state on a separate line** from the JSON above: `recordingEnabled: true|false` (source: `<sources.recordingEnabled>`). If the user has not asked anything else, this is enough — stop here. Recording is toggled by re-running the wizard and answering N at the recording prompt.
4. **Do not ask the user to paste a WorkOS API key into Claude chat.** The wizard prompts for it locally with echo off.
5. **Do not narrate other setup paths** (env vars, plugin userConfig) unless the user explicitly asks how to configure without the wizard. Those exist as fallbacks; surfacing them by default defeats the deterministic flow.
6. Tell the user to restart Claude Code after the wizard exits so hooks and MCP servers reload.
7. If `configured` is true and the user wants to verify the running MCP server agrees with the file, call `workos_audit_status`. If MCP tools are unavailable, the MCP server did not load — recommend starting Claude with debug enabled.
