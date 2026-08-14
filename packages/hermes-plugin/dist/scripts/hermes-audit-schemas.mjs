// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
// importing externalized native deps (e.g. @napi-rs/keyring). The marketplace
// install copies files only; this is the cheapest place to bootstrap deps so
// hooks can run on a fresh install.
import { existsSync as __preflightExists } from 'node:fs';
import { execFileSync as __preflightExec } from 'node:child_process';
import { fileURLToPath as __preflightFileURL } from 'node:url';
import { createRequire as __preflightRequire } from 'node:module';
import __preflightPath from 'node:path';
(function __ensurePluginDeps() {
  try {
    const here = __preflightPath.dirname(__preflightFileURL(import.meta.url));
    let pluginRoot = here;
    for (let i = 0; i < 4; i += 1) {
      if (__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) break;
      pluginRoot = __preflightPath.resolve(pluginRoot, '..');
    }
    const __pkg = __preflightPath.join(pluginRoot, 'package.json');
    if (!__preflightExists(__pkg)) return;
    // Ask Node whether the dep RESOLVES, rather than testing one hardcoded path.
    // The old check was existsSync(pluginRoot/node_modules/@napi-rs/keyring),
    // which npm workspace hoisting makes permanently false — the package lands in
    // the ROOT node_modules. Every hook therefore re-ran `npm install` (~620ms
    // measured) before doing any work, on every single event.
    try {
      __preflightRequire(__pkg).resolve('@napi-rs/keyring');
      return;
    } catch {
      // Genuinely absent — fall through and install it once.
    }
    __preflightExec('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
      cwd: pluginRoot,
      stdio: 'ignore',
      timeout: 90_000,
    });
  } catch {
    // Best-effort: callers fall back to no-keyring mode if install fails.
  }
})();

// scripts/hermes-audit-schemas.mjs
function getHermesAuditSchemaDefinitions(prefix = "hermes") {
  const commonMetadata = {
    cwd: "string",
    model: "string",
    platform: "string",
    task_id: "string",
    turn_id: "string"
  };
  return [
    {
      action: `${prefix}.session.started`,
      note: "Hermes session start events.",
      targets: [{ type: "session" }],
      metadata: { ...commonMetadata }
    },
    {
      action: `${prefix}.session.ended`,
      note: "Hermes session finalize/teardown events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        old_session_id: "string",
        new_session_id: "string",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "User message observed before a Hermes LLM call, with hashed prompt metadata.",
      targets: [{ type: "session" }, { type: "message", metadata: { role: "string" } }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        prompt_preview: "string",
        history_message_count: "number",
        is_first_turn: "boolean",
        parent_session_id: "string",
        sender_id: "string",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before a Hermes tool call executes.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        api_request_id: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After a Hermes tool call succeeds.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        api_request_id: "string",
        status: "string",
        duration_ms: "number",
        is_error: "boolean",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        result_sha256: "string",
        result_bytes: "number",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "After a Hermes tool call fails.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        api_request_id: "string",
        status: "string",
        duration_ms: "number",
        is_error: "boolean",
        error_type: "string",
        error_preview: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        result_sha256: "string",
        result_bytes: "number",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.permission.requested`,
      note: "Hermes approval prompt shown to the user.",
      targets: [{ type: "session" }, { type: "tool", metadata: { pattern_key: "string" } }],
      metadata: {
        surface: "string",
        pattern_key: "string",
        pattern_key_count: "number",
        session_key: "string",
        tool_call_id: "string",
        description_preview: "string",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.permission.resolved`,
      note: "Hermes approval prompt answered (or timed out).",
      targets: [{ type: "session" }, { type: "tool", metadata: { pattern_key: "string" } }],
      metadata: {
        surface: "string",
        pattern_key: "string",
        pattern_key_count: "number",
        session_key: "string",
        tool_call_id: "string",
        description_preview: "string",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean",
        choice: "string",
        decided_by: "string",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.agent.started`,
      note: "Hermes subagent started under a parent session.",
      targets: [{ type: "session" }, { type: "agent", metadata: { child_role: "string" } }],
      metadata: {
        parent_turn_id: "string",
        parent_subagent_id: "string",
        child_session_id: "string",
        child_subagent_id: "string",
        child_role: "string",
        goal_length: "number",
        goal_sha256: "string",
        goal_preview: "string",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.agent.completed`,
      note: "Hermes subagent finished, with tool-call counts and byte totals only.",
      targets: [{ type: "session" }, { type: "agent", metadata: { child_role: "string" } }],
      metadata: {
        child_role: "string",
        child_status: "string",
        duration_ms: "number",
        summary_length: "number",
        summary_sha256: "string",
        tool_call_count: "number",
        tool_input_bytes_total: "number",
        tool_output_bytes_total: "number",
        tool_failed_count: "number",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Hermes conversation turn completed.",
      targets: [{ type: "session" }],
      metadata: {
        completed: "boolean",
        interrupted: "boolean",
        turn_exit_reason: "string",
        ...commonMetadata
      }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "Hermes conversation turn failed or was interrupted.",
      targets: [{ type: "session" }],
      metadata: {
        completed: "boolean",
        interrupted: "boolean",
        turn_exit_reason: "string",
        ...commonMetadata
      }
    }
  ];
}
export {
  getHermesAuditSchemaDefinitions
};
