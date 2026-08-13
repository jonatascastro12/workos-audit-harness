// Per-agent schema definitions mirroring exactly what index.mjs emits per
// action (fields and targets), so seeded WorkOS schemas never drift from the
// wire events. Field names and types follow the generic harness catalogue
// (packages/audit-core/src/harness-audit-schemas.mjs) where they overlap.
export function getOpenCodeAuditSchemaDefinitions(prefix = 'opencode') {
  return [
    {
      action: `${prefix}.session.started`,
      note: 'OpenCode session created.',
      targets: [{ type: 'session' }],
      metadata: {
        parent_session_id: 'string',
        cwd: 'string',
        harness_version: 'string',
      },
    },
    {
      action: `${prefix}.session.ended`,
      note: 'OpenCode session deleted.',
      targets: [{ type: 'session' }],
      metadata: {
        parent_session_id: 'string',
        cwd: 'string',
      },
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: 'User chat message observed by OpenCode, with hashed prompt metadata.',
      targets: [{ type: 'session' }, { type: 'message', metadata: { role: 'string' } }],
      metadata: {
        prompt_length: 'number',
        prompt_sha256: 'string',
        prompt_preview: 'string',
        agent: 'string',
        provider: 'string',
        model_id: 'string',
      },
    },
    {
      action: `${prefix}.tool.called`,
      note: 'Before an OpenCode tool call executes.',
      targets: [{ type: 'session' }, { type: 'tool', metadata: { tool_name: 'string' } }],
      metadata: {
        tool_name: 'string',
        tool_call_id: 'string',
        tool_input_sha256: 'string',
        tool_input_bytes: 'number',
        command_preview: 'string',
        command_truncated: 'boolean',
        blocked: 'boolean',
      },
    },
    {
      action: `${prefix}.tool.completed`,
      note: 'After an OpenCode tool call finishes.',
      targets: [{ type: 'session' }, { type: 'tool', metadata: { tool_name: 'string' } }],
      metadata: {
        tool_name: 'string',
        tool_call_id: 'string',
        duration_ms: 'number',
        is_error: 'boolean',
        result_sha256: 'string',
        result_bytes: 'number',
        title: 'string',
      },
    },
    {
      action: `${prefix}.permission.requested`,
      note: 'OpenCode permission prompt shown to the user (observe-only).',
      targets: [{ type: 'session' }, { type: 'tool' }],
      metadata: {
        permission_type: 'string',
        permission_pattern: 'string',
        title: 'string',
        tool_call_id: 'string',
      },
    },
    {
      action: `${prefix}.turn.completed`,
      note: 'OpenCode session went idle after an assistant turn.',
      targets: [{ type: 'session' }],
      metadata: {
        cwd: 'string',
      },
    },
    {
      action: `${prefix}.turn.failed`,
      note: 'OpenCode session error during a turn.',
      targets: [{ type: 'session' }],
      metadata: {
        cwd: 'string',
        error_type: 'string',
        error_preview: 'string',
      },
    },
  ];
}
