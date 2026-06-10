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

// scripts/openclaw-audit-schemas.mjs
function getOpenClawAuditSchemaDefinitions(prefix = "openclaw") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "OpenClaw session start or resume events.",
      targets: [{ type: "session" }],
      metadata: {
        resumed_from: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.session.ended`,
      note: "OpenClaw session termination events.",
      targets: [{ type: "session" }],
      metadata: {
        message_count: "number",
        duration_ms: "number",
        reason: "string",
        session_file: "string",
        transcript_archived: "boolean",
        next_session_id: "string",
        next_session_key: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "Inbound message observed before an OpenClaw agent turn.",
      targets: [{ type: "session" }, { type: "message" }],
      metadata: {
        from: "string",
        content_length: "number",
        content_sha256: "string",
        timestamp: "number",
        thread_id: "string",
        reply_to_id: "string",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.message.sent`,
      note: "Outbound message delivery result from OpenClaw.",
      targets: [{ type: "session" }, { type: "message" }],
      metadata: {
        to: "string",
        success: "boolean",
        content_length: "number",
        content_sha256: "string",
        error_preview: "string",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.agent.run.started`,
      note: "OpenClaw accepted an inbound prompt and is about to run the agent.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        system_prompt_sha256: "string",
        history_message_count: "number",
        sender_id: "string",
        sender_is_owner: "boolean",
        run_id: "string",
        agent_id: "string",
        account_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string",
        workspace_dir: "string"
      }
    },
    {
      action: `${prefix}.llm.input`,
      note: "OpenClaw model input telemetry with hashed prompt and prompt-shape metadata.",
      targets: [{ type: "session" }],
      metadata: {
        provider: "string",
        model: "string",
        prompt_length: "number",
        prompt_sha256: "string",
        system_prompt_sha256: "string",
        history_message_count: "number",
        images_count: "number",
        tools_count: "number",
        run_id: "string",
        agent_id: "string",
        account_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string",
        workspace_dir: "string"
      }
    },
    {
      action: `${prefix}.llm.output`,
      note: "OpenClaw model output telemetry with token usage and assistant-text size metadata.",
      targets: [{ type: "session" }],
      metadata: {
        provider: "string",
        model: "string",
        resolved_ref: "string",
        harness_id: "string",
        assistant_text_count: "number",
        assistant_text_bytes: "number",
        usage_input_tokens: "number",
        usage_output_tokens: "number",
        usage_cache_read_tokens: "number",
        usage_cache_write_tokens: "number",
        usage_total_tokens: "number",
        context_token_budget: "number",
        context_window_source: "string",
        context_window_reference_tokens: "number",
        run_id: "string",
        agent_id: "string",
        account_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string",
        workspace_dir: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before an OpenClaw tool call executes.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        tool_kind: "string",
        tool_input_kind: "string",
        params_sha256: "string",
        params_bytes: "number",
        derived_paths: "string",
        blocked: "boolean",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After an OpenClaw tool call succeeds.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "After an OpenClaw tool call fails.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        error_preview: "string",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.model.call.started`,
      note: "OpenClaw provider/model call start telemetry.",
      targets: [{ type: "session" }, { type: "model_call" }],
      metadata: {
        provider: "string",
        model: "string",
        api: "string",
        transport: "string",
        context_token_budget: "number",
        context_window_source: "string",
        context_window_reference_tokens: "number",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.model.call.completed`,
      note: "OpenClaw provider/model call success telemetry.",
      targets: [{ type: "session" }, { type: "model_call" }],
      metadata: {
        provider: "string",
        model: "string",
        api: "string",
        transport: "string",
        duration_ms: "number",
        outcome: "string",
        request_payload_bytes: "number",
        response_stream_bytes: "number",
        time_to_first_byte_ms: "number",
        upstream_request_id_hash: "string",
        context_token_budget: "number",
        context_window_source: "string",
        context_window_reference_tokens: "number",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.model.call.failed`,
      note: "OpenClaw provider/model call failure telemetry.",
      targets: [{ type: "session" }, { type: "model_call" }],
      metadata: {
        provider: "string",
        model: "string",
        api: "string",
        transport: "string",
        duration_ms: "number",
        outcome: "string",
        error_category: "string",
        failure_kind: "string",
        request_payload_bytes: "number",
        response_stream_bytes: "number",
        time_to_first_byte_ms: "number",
        upstream_request_id_hash: "string",
        context_token_budget: "number",
        context_window_source: "string",
        context_window_reference_tokens: "number",
        run_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "OpenClaw agent turn completed successfully.",
      targets: [{ type: "session" }],
      metadata: {
        success: "boolean",
        duration_ms: "number",
        message_count: "number",
        run_id: "string",
        job_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "OpenClaw agent turn failed.",
      targets: [{ type: "session" }],
      metadata: {
        success: "boolean",
        duration_ms: "number",
        message_count: "number",
        error_preview: "string",
        run_id: "string",
        job_id: "string",
        agent_id: "string",
        channel_id: "string",
        session_key: "string",
        session_id: "string"
      }
    }
  ];
}
export {
  getOpenClawAuditSchemaDefinitions
};
