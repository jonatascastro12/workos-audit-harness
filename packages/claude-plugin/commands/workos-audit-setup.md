---
description: Configure or troubleshoot the WorkOS audit plugin
allowed-tools: Bash(node:*), mcp__workos-audit__workos_audit_status
---

You are reporting on / launching the local WorkOS Audit Claude Code plugin.

Current plugin configuration:

!`node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/print-config-status.mjs"`

Rules. Do not improvise an option menu — the wizard is the source of truth. Branch on `configured`.

## When `configured: false`

1. Lead with: "Not signed in. Run the wizard below to configure."
2. Show this launch line verbatim, in a single fenced code block, no commentary:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/configure.mjs"
   ```

   The wizard walks through credential mode → organization (lists orgs live from the chosen credential) → recording on/off → identity. It writes `~/.claude/workos-audit/config.json` with mode `0600`.
3. Tell the user to restart Claude Code after the wizard exits so hooks and MCP servers reload.
4. Stop. Do not narrate env-var / userConfig fallbacks unless the user explicitly asks for them.

## When `configured: true`

1. Lead with one line summarizing credential state:
   - `credentialSource: "api-key"` → "Using an explicit WorkOS API key. Audit reads/writes should work."
   - `credentialSource: "workos-cli"` and `workosCli.loggedIn: true` → "Signed into the WorkOS CLI (active environment: `<workosCli.activeEnvironment>`). Audit reads/writes should work."
2. Show the resolved settings on short lines: `organizationId`, `recordingEnabled` (with its `sources.recordingEnabled`), `actorName`. Skip fields that are just default values.
3. Add **one** trailing line offering reconfiguration, only if useful — and only mention the wizard, not env-var alternatives:

   > To reconfigure (switch org, toggle recording, swap credentials), run `node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/configure.mjs"` and restart Claude Code.

4. Stop. Do not tell the user to restart Claude Code unless they actually need to run the wizard.

## Other rules (both branches)

- Do not ask the user to paste a WorkOS API key into Claude chat. The wizard prompts for it locally with echo off.
- If the user wants to verify the running MCP server agrees with the file, call `workos_audit_status`. If MCP tools are unavailable, the MCP server did not load — recommend starting Claude with debug enabled.
