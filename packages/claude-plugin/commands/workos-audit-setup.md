---
description: Configure or troubleshoot the WorkOS audit plugin
allowed-tools: Bash(node:*), mcp__workos-audit__workos_audit_status
---

You are reporting on / launching the local WorkOS Audit Claude Code plugin.

Current plugin configuration:

!`node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/print-config-status.mjs"`

Rules. Do not improvise an option menu — the wizard is the source of truth.

**Branch on `writeTransport` first — it is the answer to "where do my events go?".** Never describe a credential as the thing that makes recording work without checking it: under the proxy, `credentialSource` and `workosCli` apply only to *querying* audit logs, and saying "reads/writes should work" because of a CLI login would be wrong.

## When `writeTransport: "proxy"`

1. Lead with: "Recording via the ingestion proxy at `<proxyUrl>` (`<proxySource>`)."
2. Add one line: "Events are sent over mTLS with this machine's device certificate; the proxy holds the WorkOS API key and stamps your identity, organization, and IP server-side. No API key is needed here."
3. Show `recordingEnabled` with its `sources.recordingEnabled`. **If `recordingEnabled` is false, say so first and prominently** — nothing is being recorded — and name the source so the user knows which layer to change.
4. Do not report `organizationId`, `actorId`, `actorName`, `location`, or `userAgent` as effective: the proxy overwrites all of them (`identitySource` says so). Mention `actionPrefix` only if it is not `claude`.
5. Stop. Do not offer the wizard unless the user wants to toggle recording or change the action prefix, and never suggest obtaining an API key.

## When `writeTransport: "proxy-no-device-certificate"`

1. Lead with: "A proxy is configured (`<proxyUrl>`) but this machine has no device certificate, so every event is being skipped."
2. Say this is a device-enrollment problem, not a plugin one — the MDM-issued certificate is missing from the keychain. Recommend contacting IT. Do not suggest an API key as a workaround; that would bypass the control the proxy exists to provide.
3. Stop.

## When `writeTransport` is `"api-key"` or `"workos-cli"`

Direct-to-WorkOS mode (no proxy). Follow the `configured: true` section below.

## When `configured: false`

1. Lead with: "Not signed in. Run the wizard below to configure."
2. Show this launch line verbatim, in a single fenced code block, no commentary:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/configure.mjs"
   ```

   The wizard walks through credential mode → organization (lists orgs live from the chosen credential) → recording on/off → identity. It writes `~/.claude/workos-audit/config.json` with mode `0600`.
3. Tell the user to restart Claude Code after the wizard exits so hooks and MCP servers reload.
4. Stop. Do not narrate env-var / userConfig fallbacks unless the user explicitly asks for them.

## When `configured: true` (direct mode — reached only when `proxyUrl` is null)

1. Lead with one line summarizing credential state:
   - `credentialSource: "api-key"` → "Using an explicit WorkOS API key. Audit reads/writes should work."
   - `credentialSource: "workos-cli"` and `workosCli.loggedIn: true` → "Signed into the WorkOS CLI (active environment: `<workosCli.activeEnvironment>`). Audit reads/writes should work."
2. Show the resolved settings on short lines: `organizationId`, `recordingEnabled` (with its `sources.recordingEnabled`), `actorName`. Skip fields that are just default values.
3. Add **one** trailing line offering reconfiguration, only if useful — and only mention the wizard, not env-var alternatives:

   > To reconfigure (switch org, toggle recording, swap credentials), run `node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/configure.mjs"` and restart Claude Code.

4. Stop. Do not tell the user to restart Claude Code unless they actually need to run the wizard.

## Other rules (all branches)

- Do not ask the user to paste a WorkOS API key into Claude chat. The wizard prompts for it locally with echo off.
- `recordingEnabled: false` is the single most common reason "nothing is being recorded". Always surface it with its `sources.recordingEnabled`, whichever branch you are in — `CLAUDE_PLUGIN_OPTION_RECORDING_ENABLED` means a plugin option in `settings.json`, `config_file` means the wizard, `managed_config` means MDM.
- If the user wants to verify the running MCP server agrees with the file, call `workos_audit_status`. If MCP tools are unavailable, the MCP server did not load — recommend starting Claude with debug enabled.
