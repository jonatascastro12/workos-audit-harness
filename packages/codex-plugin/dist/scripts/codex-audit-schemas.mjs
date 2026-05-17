// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
// importing externalized native deps (e.g. @napi-rs/keyring). The marketplace
// install copies files only; this is the cheapest place to bootstrap deps so
// hooks can run on a fresh install.
import { existsSync as __preflightExists } from 'node:fs';
import { execFileSync as __preflightExec } from 'node:child_process';
import { fileURLToPath as __preflightFileURL } from 'node:url';
import __preflightPath from 'node:path';
(function __ensurePluginDeps() {
  try {
    const here = __preflightPath.dirname(__preflightFileURL(import.meta.url));
    let pluginRoot = here;
    for (let i = 0; i < 4; i += 1) {
      if (__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) break;
      pluginRoot = __preflightPath.resolve(pluginRoot, '..');
    }
    if (!__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) return;
    if (__preflightExists(__preflightPath.join(pluginRoot, 'node_modules', '@napi-rs', 'keyring'))) return;
    __preflightExec('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
      cwd: pluginRoot,
      stdio: 'ignore',
      timeout: 90_000,
    });
  } catch {
    // Best-effort: callers fall back to no-keyring mode if install fails.
  }
})();

// scripts/codex-audit-schemas.mjs
function getCodexAuditSchemaDefinitions(prefix = "codex") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Codex session start / resume / clear events.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        cwd: "string",
        transcript_path: "string",
        permission_mode: "string",
        model: "string"
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "User prompt submission before Codex processes it.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        prompt_preview: "string",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before a Codex tool call executes.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_use_id: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.permission.requested`,
      note: "Codex requested permission for a tool call.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After a Codex tool call succeeds.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_use_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "After a Codex tool call returns an error-like result.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_use_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        error_preview: "string",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Codex finished a response turn.",
      targets: [{ type: "session" }],
      metadata: {
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string",
        last_assistant_message_length: "number",
        last_assistant_message_sha256: "string",
        stop_hook_active: "boolean"
      }
    }
  ];
}
export {
  getCodexAuditSchemaDefinitions
};
