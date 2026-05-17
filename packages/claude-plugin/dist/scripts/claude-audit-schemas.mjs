// scripts/claude-audit-schemas.mjs
var TOKEN_METADATA = {
  turn_input_tokens: "number",
  turn_output_tokens: "number",
  turn_cache_creation_input_tokens: "number",
  turn_cache_read_input_tokens: "number",
  turn_total_tokens: "number",
  turn_model_calls: "number",
  session_input_tokens: "number",
  session_output_tokens: "number",
  session_cache_creation_input_tokens: "number",
  session_cache_read_input_tokens: "number",
  session_total_tokens: "number",
  session_model_calls: "number"
};
function getClaudeAuditSchemaDefinitions(prefix = "claude") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Claude Code session start / resume events.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        cwd: "string",
        transcript_path: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.session.ended`,
      note: "Claude Code session termination events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        cwd: "string",
        transcript_path: "string",
        permission_mode: "string",
        ...TOKEN_METADATA
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "User prompt submission before Claude processes it.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        prompt_preview: "string",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before a Claude tool call executes.",
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
        blocked: "boolean",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After a Claude tool call succeeds.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "After a Claude tool call fails.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        duration_ms: "number",
        is_error: "boolean",
        error_preview: "string",
        error_sha256: "string",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Claude finished a response turn.",
      targets: [{ type: "session" }],
      metadata: {
        cwd: "string",
        permission_mode: "string",
        ...TOKEN_METADATA
      }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "Claude turn ended with an API/runtime failure.",
      targets: [{ type: "session" }],
      metadata: {
        error_type: "string",
        cwd: "string",
        permission_mode: "string",
        ...TOKEN_METADATA
      }
    }
  ];
}
export {
  getClaudeAuditSchemaDefinitions
};
