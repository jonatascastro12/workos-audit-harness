/**
 * Generic Audit Log Harness schema definitions.
 *
 * These schemas intentionally use a shared set of generic action names and a
 * broad optional metadata surface so Pi extensions and coding-agent plugins can
 * emit lifecycle events without needing a product-specific schema fork.
 */
const TOKEN_METADATA = {
  turn_input_tokens: 'number',
  turn_output_tokens: 'number',
  turn_cache_creation_input_tokens: 'number',
  turn_cache_read_input_tokens: 'number',
  turn_total_tokens: 'number',
  turn_model_calls: 'number',
  session_input_tokens: 'number',
  session_output_tokens: 'number',
  session_cache_creation_input_tokens: 'number',
  session_cache_read_input_tokens: 'number',
  session_total_tokens: 'number',
  session_model_calls: 'number',
};

const COMMON_METADATA = {
  harness: 'string',
  harness_version: 'string',
  agent: 'string',
  source: 'string',
  cwd: 'string',
  transcript_path: 'string',
  permission_mode: 'string',
  model: 'string',
  turn_id: 'string',
  reason: 'string',
  error_type: 'string',
  session_file: 'string',
  previous_session_file: 'string',
  target_session_file: 'string',
  message_role: 'string',
  role: 'string',
  message_length: 'number',
  message_sha256: 'string',
  message_preview: 'string',
  text_length: 'number',
  text_sha256: 'string',
  text_preview: 'string',
  text_truncated: 'boolean',
  content_length: 'number',
  content_sha256: 'string',
  has_images: 'boolean',
  image_count: 'number',
  tool_call_count: 'number',
  custom_type: 'string',
  system_prompt_sha256: 'string',
  turn_count: 'number',
  assistant_message_count: 'number',
  tool_result_count: 'number',
  status: 'string',
};

const PROMPT_METADATA = {
  prompt_length: 'number',
  prompt_sha256: 'string',
  prompt_preview: 'string',
};

const TOOL_METADATA = {
  tool_name: 'string',
  tool_use_id: 'string',
  tool_call_id: 'string',
  tool_input_sha256: 'string',
  tool_input_bytes: 'number',
  input_sha256: 'string',
  input_bytes: 'number',
  command_preview: 'string',
  command_truncated: 'boolean',
  blocked: 'boolean',
  duration_ms: 'number',
  is_error: 'boolean',
  result_sha256: 'string',
  result_bytes: 'number',
  error_preview: 'string',
  error_sha256: 'string',
};

const TURN_METADATA = {
  last_assistant_message_length: 'number',
  last_assistant_message_sha256: 'string',
  stop_hook_active: 'boolean',
  input_tokens: 'number',
  output_tokens: 'number',
  total_tokens: 'number',
  ...TOKEN_METADATA,
};

const SESSION_TARGET = { type: 'session' };
const MESSAGE_TARGET = { type: 'message', metadata: { role: 'string' } };
const TOOL_TARGET = { type: 'tool', metadata: { tool_name: 'string' } };
const MODEL_TARGET = { type: 'model', metadata: { model: 'string', provider: 'string', model_id: 'string' } };
const COMMAND_TARGET = { type: 'command' };

export function getHarnessAuditSchemaDefinitions(prefix = 'harness') {
  return [
    {
      action: `${prefix}.session.started`,
      note: 'Generic coding-agent session start/resume event.',
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA },
    },
    {
      action: `${prefix}.session.ended`,
      note: 'Generic coding-agent session end event.',
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA },
    },
    {
      action: `${prefix}.session.shutdown`,
      note: 'Generic coding-agent session shutdown event.',
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA },
    },
    {
      action: `${prefix}.input.received`,
      note: 'Generic user/input event accepted by a harness.',
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA, ...PROMPT_METADATA },
    },
    {
      action: `${prefix}.agent.started`,
      note: 'Generic agent/model turn start event.',
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA },
    },
    {
      action: `${prefix}.agent.completed`,
      note: 'Generic agent/model turn completion event.',
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA },
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: 'Generic user prompt submission event.',
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA, ...PROMPT_METADATA },
    },
    {
      action: `${prefix}.message.sent`,
      note: 'Generic message lifecycle event.',
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA },
    },
    {
      action: `${prefix}.message.finalized`,
      note: 'Generic message finalized event.',
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA },
    },
    {
      action: `${prefix}.tool.called`,
      note: 'Generic tool-call start event.',
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA },
    },
    {
      action: `${prefix}.permission.requested`,
      note: 'Generic permission/escalation request event.',
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA },
    },
    {
      action: `${prefix}.tool.completed`,
      note: 'Generic successful tool-call result event.',
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA },
    },
    {
      action: `${prefix}.tool.failed`,
      note: 'Generic failed/error tool-call result event.',
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA },
    },
    {
      action: `${prefix}.turn.completed`,
      note: 'Generic assistant response turn completion event.',
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA },
    },
    {
      action: `${prefix}.turn.failed`,
      note: 'Generic assistant response turn failure event.',
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA },
    },
    {
      action: `${prefix}.user_bash.executed`,
      note: 'Generic user-initiated shell command event.',
      targets: [SESSION_TARGET, COMMAND_TARGET],
      metadata: {
        ...COMMON_METADATA,
        exclude_from_context: 'boolean',
        command_sha256: 'string',
        command_length: 'number',
        command_preview: 'string',
        command_truncated: 'boolean',
        exit_code: 'number',
        duration_ms: 'number',
      },
    },
    {
      action: `${prefix}.model.selected`,
      note: 'Generic model selection/change event.',
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: {
        ...COMMON_METADATA,
        provider: 'string',
        model_id: 'string',
        previous_provider: 'string',
        previous_model: 'string',
        previous_model_id: 'string',
        thinking_level: 'string',
      },
    },
  ];
}
