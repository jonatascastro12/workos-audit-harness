import { sha256, byteLength, truncateMetadataString } from '@workos-inc/audit-core/util';
import { compactMetadata, readStdin, parseJson } from '@workos-inc/audit-core/hook-runtime';
import { emitEvent } from '@workos-inc/audit-core/emit-event';
import { configLoader } from './config-file.mjs';

const EVENT_NAMES = new Set([
  'session-started',
  'session-ended',
  'turn-finished',
  'turn-completed',
  'turn-failed',
  'prompt-submitted',
  'tool-called',
  'tool-finished',
  'tool-completed',
  'tool-failed',
  'permission-requested',
  'permission-resolved',
  'agent-started',
  'agent-completed',
]);

const SHELL_TOOL_NAMES = new Set(['terminal', 'bash', 'shell']);
const FAILURE_STATUSES = new Set(['error', 'failed', 'failure', 'timeout', 'denied']);
const PREVIEW_MAX_LENGTH = 500;

// The Python plugin sends pre-derived fields; Hermes shell hooks send the
// Claude-Code-compatible shape {hook_event_name, tool_name, tool_input,
// session_id, cwd, extra}. Flatten the latter so both shapes resolve the same.
function normalizePayload(raw) {
  if (!raw || typeof raw !== 'object') return {};
  if (!('hook_event_name' in raw)) return raw;
  const extra = raw.extra && typeof raw.extra === 'object' ? raw.extra : {};
  return compactMetadata({
    ...extra,
    session_id: raw.session_id ?? extra.session_id ?? undefined,
    cwd: raw.cwd ?? extra.cwd ?? undefined,
    tool_name: raw.tool_name ?? extra.tool_name ?? undefined,
    args: raw.tool_input ?? extra.args ?? undefined,
  });
}

function isToolFailure(payload) {
  if (typeof payload.error_type === 'string' && payload.error_type) return true;
  if (typeof payload.status === 'string' && FAILURE_STATUSES.has(payload.status.toLowerCase())) return true;
  return payload.is_error === true;
}

function resolveKind(kind, payload) {
  if (kind === 'tool-finished') return isToolFailure(payload) ? 'tool-failed' : 'tool-completed';
  if (kind === 'turn-finished') return payload.failed === true || payload.interrupted === true ? 'turn-failed' : 'turn-completed';
  return kind;
}

function getSessionId(kind, payload) {
  if (kind === 'agent-started' || kind === 'agent-completed') return payload.parent_session_id || payload.session_id;
  if (kind === 'permission-requested' || kind === 'permission-resolved') return payload.session_key || payload.session_id;
  return payload.session_id || payload.old_session_id;
}

function promptFields(payload) {
  if (typeof payload.prompt_sha256 === 'string') {
    return compactMetadata({
      prompt_length: payload.prompt_length,
      prompt_sha256: payload.prompt_sha256,
      prompt_preview: truncateMetadataString(payload.prompt_preview),
    });
  }
  if (typeof payload.user_message !== 'string') return {};
  return {
    prompt_length: payload.user_message.length,
    prompt_sha256: sha256(payload.user_message),
    prompt_preview: truncateMetadataString(payload.user_message),
  };
}

function historyMessageCount(payload) {
  if (typeof payload.history_message_count === 'number') return payload.history_message_count;
  return Array.isArray(payload.conversation_history) ? payload.conversation_history.length : undefined;
}

function toolInputFields(payload) {
  if (typeof payload.tool_input_sha256 === 'string') {
    return compactMetadata({
      tool_input_sha256: payload.tool_input_sha256,
      tool_input_bytes: payload.tool_input_bytes,
    });
  }
  if (payload.args === undefined) return {};
  return {
    tool_input_sha256: sha256(payload.args),
    tool_input_bytes: byteLength(payload.args),
  };
}

function commandFields(payload) {
  if (typeof payload.command_preview === 'string') {
    return compactMetadata({
      command_preview: truncateMetadataString(payload.command_preview),
      command_truncated: payload.command_truncated,
    });
  }
  if (!SHELL_TOOL_NAMES.has(payload.tool_name)) return {};
  const command = payload.args && typeof payload.args === 'object' && typeof payload.args.command === 'string'
    ? payload.args.command
    : undefined;
  if (command === undefined) return {};
  return {
    command_preview: truncateMetadataString(command),
    command_truncated: command.length > PREVIEW_MAX_LENGTH,
  };
}

function resultFields(payload) {
  if (typeof payload.result_sha256 === 'string') {
    return compactMetadata({
      result_sha256: payload.result_sha256,
      result_bytes: payload.result_bytes,
    });
  }
  if (typeof payload.result !== 'string') return {};
  return {
    result_sha256: sha256(payload.result),
    result_bytes: byteLength(payload.result),
  };
}

function approvalCommandFields(payload) {
  if (typeof payload.command_sha256 === 'string') {
    return compactMetadata({
      command_sha256: payload.command_sha256,
      command_length: payload.command_length,
      command_preview: truncateMetadataString(payload.command_preview),
      command_truncated: payload.command_truncated,
    });
  }
  if (typeof payload.command !== 'string') return {};
  return {
    command_sha256: sha256(payload.command),
    command_length: payload.command.length,
    command_preview: truncateMetadataString(payload.command),
    command_truncated: payload.command.length > PREVIEW_MAX_LENGTH,
  };
}

function goalFields(payload) {
  if (typeof payload.goal_sha256 === 'string') {
    return compactMetadata({
      goal_length: payload.goal_length,
      goal_sha256: payload.goal_sha256,
      goal_preview: truncateMetadataString(payload.goal_preview),
    });
  }
  if (typeof payload.child_goal !== 'string') return {};
  return {
    goal_length: payload.child_goal.length,
    goal_sha256: sha256(payload.child_goal),
    goal_preview: truncateMetadataString(payload.child_goal),
  };
}

function summaryFields(payload) {
  if (typeof payload.summary_sha256 === 'string') {
    return compactMetadata({
      summary_length: payload.summary_length,
      summary_sha256: payload.summary_sha256,
    });
  }
  if (typeof payload.child_summary !== 'string') return {};
  return {
    summary_length: payload.child_summary.length,
    summary_sha256: sha256(payload.child_summary),
  };
}

function toolCallHistoryFields(payload) {
  if (typeof payload.tool_call_count === 'number') {
    return compactMetadata({
      tool_call_count: payload.tool_call_count,
      tool_input_bytes_total: payload.tool_input_bytes_total,
      tool_output_bytes_total: payload.tool_output_bytes_total,
      tool_failed_count: payload.tool_failed_count,
    });
  }
  if (!Array.isArray(payload.tool_call_history)) return {};
  const entries = payload.tool_call_history.filter((entry) => entry && typeof entry === 'object');
  const sumField = (field) => entries.reduce((sum, entry) => sum + (typeof entry[field] === 'number' ? entry[field] : 0), 0);
  return {
    tool_call_count: payload.tool_call_history.length,
    tool_input_bytes_total: sumField('input_bytes'),
    tool_output_bytes_total: sumField('output_bytes'),
    tool_failed_count: entries.filter((entry) => typeof entry.status === 'string' && FAILURE_STATUSES.has(entry.status.toLowerCase())).length,
  };
}

function commonMetadata(payload) {
  return compactMetadata({
    cwd: payload.cwd,
    model: payload.model,
    platform: payload.platform,
    task_id: payload.task_id,
    turn_id: payload.turn_id,
  });
}

function buildMetadata(kind, payload) {
  if (kind === 'session-started') {
    return commonMetadata(payload);
  }
  if (kind === 'session-ended') {
    return compactMetadata({
      reason: payload.reason,
      old_session_id: payload.old_session_id,
      new_session_id: payload.new_session_id,
      ...commonMetadata(payload),
    });
  }
  if (kind === 'turn-completed' || kind === 'turn-failed') {
    return compactMetadata({
      completed: payload.completed,
      interrupted: payload.interrupted,
      turn_exit_reason: payload.turn_exit_reason,
      ...commonMetadata(payload),
    });
  }
  if (kind === 'prompt-submitted') {
    return compactMetadata({
      ...promptFields(payload),
      history_message_count: historyMessageCount(payload),
      is_first_turn: payload.is_first_turn,
      parent_session_id: payload.parent_session_id,
      sender_id: payload.sender_id,
      ...commonMetadata(payload),
    });
  }
  if (kind === 'tool-called') {
    return compactMetadata({
      tool_name: payload.tool_name,
      tool_call_id: payload.tool_call_id,
      api_request_id: payload.api_request_id,
      ...toolInputFields(payload),
      ...commandFields(payload),
      blocked: false,
      ...commonMetadata(payload),
    });
  }
  if (kind === 'tool-completed') {
    return compactMetadata({
      tool_name: payload.tool_name,
      tool_call_id: payload.tool_call_id,
      api_request_id: payload.api_request_id,
      status: payload.status,
      duration_ms: payload.duration_ms,
      is_error: false,
      ...toolInputFields(payload),
      ...resultFields(payload),
      ...commonMetadata(payload),
    });
  }
  if (kind === 'tool-failed') {
    return compactMetadata({
      tool_name: payload.tool_name,
      tool_call_id: payload.tool_call_id,
      api_request_id: payload.api_request_id,
      status: payload.status,
      duration_ms: payload.duration_ms,
      is_error: true,
      error_type: payload.error_type,
      error_preview: truncateMetadataString(payload.error_preview ?? payload.error_message),
      ...toolInputFields(payload),
      ...resultFields(payload),
      ...commonMetadata(payload),
    });
  }
  if (kind === 'permission-requested' || kind === 'permission-resolved') {
    return compactMetadata({
      surface: payload.surface,
      pattern_key: payload.pattern_key,
      pattern_key_count: payload.pattern_key_count,
      session_key: payload.session_key,
      tool_call_id: payload.tool_call_id,
      description_preview: truncateMetadataString(payload.description_preview ?? payload.description),
      ...approvalCommandFields(payload),
      ...(kind === 'permission-resolved'
        ? { choice: payload.choice, decided_by: payload.decided_by }
        : {}),
      ...commonMetadata(payload),
    });
  }
  if (kind === 'agent-started') {
    return compactMetadata({
      parent_turn_id: payload.parent_turn_id,
      parent_subagent_id: payload.parent_subagent_id,
      child_session_id: payload.child_session_id,
      child_subagent_id: payload.child_subagent_id,
      child_role: payload.child_role,
      ...goalFields(payload),
      ...commonMetadata(payload),
    });
  }
  if (kind === 'agent-completed') {
    return compactMetadata({
      child_role: payload.child_role,
      child_status: payload.child_status,
      duration_ms: payload.duration_ms,
      ...summaryFields(payload),
      ...toolCallHistoryFields(payload),
      ...commonMetadata(payload),
    });
  }
  return {};
}

function buildTargets(kind, payload, metadata) {
  const sessionId = getSessionId(kind, payload);
  const sessionTarget = sessionId ? { id: sessionId, type: 'session' } : undefined;

  if (kind === 'prompt-submitted') {
    const messageTarget = {
      id: `msg_${sha256({ session_id: sessionId, turn_id: payload.turn_id, prompt_sha256: metadata.prompt_sha256 }).slice(0, 24)}`,
      type: 'message',
      metadata: { role: 'user' },
    };
    return [sessionTarget, messageTarget].filter(Boolean);
  }

  if (kind.startsWith('tool-')) {
    const toolTarget = {
      id: payload.tool_call_id || `tool_${sha256({ tool_name: payload.tool_name, tool_input_sha256: metadata.tool_input_sha256, turn_id: payload.turn_id }).slice(0, 24)}`,
      type: 'tool',
      metadata: compactMetadata({ tool_name: payload.tool_name }),
    };
    return [sessionTarget, toolTarget].filter(Boolean);
  }

  if (kind === 'permission-requested' || kind === 'permission-resolved') {
    const toolTarget = {
      id: payload.tool_call_id || `tool_${sha256({ pattern_key: payload.pattern_key, command_sha256: metadata.command_sha256, turn_id: payload.turn_id }).slice(0, 24)}`,
      type: 'tool',
      metadata: compactMetadata({ pattern_key: payload.pattern_key }),
    };
    return [sessionTarget, toolTarget].filter(Boolean);
  }

  if (kind === 'agent-started' || kind === 'agent-completed') {
    const agentTarget = {
      id: payload.child_session_id || payload.child_subagent_id || `agent_${sha256({ parent_session_id: payload.parent_session_id, child_role: payload.child_role, turn_id: payload.parent_turn_id }).slice(0, 24)}`,
      type: 'agent',
      metadata: compactMetadata({ child_role: payload.child_role }),
    };
    return [sessionTarget, agentTarget].filter(Boolean);
  }

  return sessionTarget ? [sessionTarget] : [];
}

function buildEvent(inputKind, rawPayload, config) {
  const payload = normalizePayload(rawPayload);
  const kind = resolveKind(inputKind, payload);
  const action = {
    'session-started': `${config.actionPrefix}.session.started`,
    'session-ended': `${config.actionPrefix}.session.ended`,
    'turn-completed': `${config.actionPrefix}.turn.completed`,
    'turn-failed': `${config.actionPrefix}.turn.failed`,
    'prompt-submitted': `${config.actionPrefix}.prompt.submitted`,
    'tool-called': `${config.actionPrefix}.tool.called`,
    'tool-completed': `${config.actionPrefix}.tool.completed`,
    'tool-failed': `${config.actionPrefix}.tool.failed`,
    'permission-requested': `${config.actionPrefix}.permission.requested`,
    'permission-resolved': `${config.actionPrefix}.permission.resolved`,
    'agent-started': `${config.actionPrefix}.agent.started`,
    'agent-completed': `${config.actionPrefix}.agent.completed`,
  }[kind];

  const metadata = buildMetadata(kind, payload);

  return {
    action,
    occurred_at: new Date().toISOString(),
    actor: {
      id: config.actorId,
      type: config.actorType,
      ...(config.actorName ? { name: config.actorName } : {}),
      metadata: {},
    },
    targets: buildTargets(kind, payload, metadata),
    context: {
      location: config.location,
      user_agent: config.userAgent,
    },
    metadata,
  };
}

async function main() {
  const kind = process.argv[2];
  if (!EVENT_NAMES.has(kind)) {
    console.error(`Unknown event kind: ${kind || '(missing)'}`);
    process.exit(0);
  }

  const config = configLoader.loadConfig();

  if (config.recordingEnabled === false) {
    process.exit(0);
  }

  try {
    const stdin = await readStdin();
    const payload = parseJson(stdin);
    const event = buildEvent(kind, payload, config);
    await emitEvent(event, config);
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(0);
  }
}

await main();
