import { sha256, byteLength, stableSerialize, truncateMetadataString } from '@workos-inc/audit-core/util';
import { compactMetadata, readStdin, parseJson, createToolTimingStore } from '@workos-inc/audit-core/hook-runtime';
import { emitEvent } from '@workos-inc/audit-core/emit-event';
import { configLoader } from './config-file.mjs';

const EVENT_NAMES = new Set([
  'session-started',
  'prompt-submitted',
  'tool-called',
  'permission-requested',
  'tool-finished',
  'tool-completed',
  'tool-failed',
  'turn-completed',
]);

const { storeToolTiming, consumeToolTiming } = createToolTimingStore({
  baseEnvNames: ['PLUGIN_DATA', 'CLAUDE_PLUGIN_DATA'],
  fallbackDirName: 'codex-workos-audit',
  timingKeyExtras: { turn_id: 'turn_id' },
});

function getCommand(payload) {
  if (payload.tool_name !== 'Bash' && payload.tool_name !== 'apply_patch') return undefined;
  return typeof payload.tool_input?.command === 'string' ? payload.tool_input.command : undefined;
}

function getCommandPreview(payload) {
  return truncateMetadataString(getCommand(payload));
}

function isCommandTruncated(payload, maxLength = 500) {
  const command = getCommand(payload);
  return typeof command === 'string' ? command.length > maxLength : undefined;
}

function getToolResponseError(payload) {
  const response = payload.tool_response;
  if (!response || typeof response !== 'object') return false;

  if (response.is_error === true || response.isError === true || response.error === true) return true;
  if (typeof response.exit_code === 'number') return response.exit_code !== 0;
  if (typeof response.exitCode === 'number') return response.exitCode !== 0;
  if (typeof response.status === 'string' && ['error', 'failed', 'failure'].includes(response.status.toLowerCase())) return true;
  if (typeof response.code === 'number' && 'stderr' in response) return response.code !== 0;
  return false;
}

function buildTargets(kind, payload) {
  const sessionTarget = payload.session_id
    ? { id: payload.session_id, type: 'session' }
    : undefined;

  if (kind === 'prompt-submitted') {
    const messageTarget = {
      id: payload.message_id || `msg_${sha256({ session_id: payload.session_id, prompt: payload.prompt }).slice(0, 24)}`,
      type: 'message',
      metadata: { role: 'user' },
    };
    return [sessionTarget, messageTarget].filter(Boolean);
  }

  if (!kind.startsWith('tool-') && kind !== 'permission-requested') return sessionTarget ? [sessionTarget] : [];

  const toolTarget = {
    id: payload.tool_use_id || `tool_${sha256({ tool_name: payload.tool_name, tool_input: payload.tool_input }).slice(0, 24)}`,
    type: 'tool',
    metadata: compactMetadata({ tool_name: payload.tool_name }),
  };

  return [sessionTarget, toolTarget].filter(Boolean);
}

function resolveKind(kind, payload) {
  if (kind !== 'tool-finished') return kind;
  return getToolResponseError(payload) ? 'tool-failed' : 'tool-completed';
}

function commonMetadata(payload) {
  return compactMetadata({
    cwd: payload.cwd,
    permission_mode: payload.permission_mode,
    model: payload.model,
    turn_id: payload.turn_id,
  });
}

function buildEvent(inputKind, payload, config) {
  const kind = resolveKind(inputKind, payload);
  const action = {
    'session-started': `${config.actionPrefix}.session.started`,
    'prompt-submitted': `${config.actionPrefix}.prompt.submitted`,
    'tool-called': `${config.actionPrefix}.tool.called`,
    'permission-requested': `${config.actionPrefix}.permission.requested`,
    'tool-completed': `${config.actionPrefix}.tool.completed`,
    'tool-failed': `${config.actionPrefix}.tool.failed`,
    'turn-completed': `${config.actionPrefix}.turn.completed`,
  }[kind];

  let metadata = {};

  if (kind === 'session-started') {
    metadata = compactMetadata({
      source: payload.source,
      cwd: payload.cwd,
      transcript_path: payload.transcript_path,
      permission_mode: payload.permission_mode,
      model: payload.model,
    });
  } else if (kind === 'prompt-submitted') {
    metadata = compactMetadata({
      prompt_length: typeof payload.prompt === 'string' ? payload.prompt.length : undefined,
      prompt_sha256: typeof payload.prompt === 'string' ? sha256(payload.prompt) : undefined,
      prompt_preview: typeof payload.prompt === 'string' ? truncateMetadataString(payload.prompt) : undefined,
      ...commonMetadata(payload),
    });
  } else if (kind === 'tool-called') {
    storeToolTiming(payload);
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      tool_use_id: payload.tool_use_id,
      tool_input_sha256: sha256(payload.tool_input),
      tool_input_bytes: byteLength(payload.tool_input),
      command_preview: getCommandPreview(payload),
      command_truncated: isCommandTruncated(payload),
      blocked: false,
      ...commonMetadata(payload),
    });
  } else if (kind === 'permission-requested') {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      tool_input_sha256: sha256(payload.tool_input),
      tool_input_bytes: byteLength(payload.tool_input),
      command_preview: getCommandPreview(payload),
      command_truncated: isCommandTruncated(payload),
      ...commonMetadata(payload),
    });
  } else if (kind === 'tool-completed') {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      tool_use_id: payload.tool_use_id,
      duration_ms: consumeToolTiming(payload),
      is_error: false,
      result_sha256: sha256(payload.tool_response),
      result_bytes: byteLength(payload.tool_response),
      ...commonMetadata(payload),
    });
  } else if (kind === 'tool-failed') {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      tool_use_id: payload.tool_use_id,
      duration_ms: consumeToolTiming(payload),
      is_error: true,
      result_sha256: sha256(payload.tool_response),
      result_bytes: byteLength(payload.tool_response),
      error_preview: truncateMetadataString(stableSerialize(payload.tool_response)),
      ...commonMetadata(payload),
    });
  } else if (kind === 'turn-completed') {
    metadata = compactMetadata({
      last_assistant_message_length: typeof payload.last_assistant_message === 'string' ? payload.last_assistant_message.length : undefined,
      last_assistant_message_sha256: typeof payload.last_assistant_message === 'string' ? sha256(payload.last_assistant_message) : undefined,
      stop_hook_active: payload.stop_hook_active,
      ...commonMetadata(payload),
    });
  }

  return {
    action,
    occurred_at: new Date().toISOString(),
    actor: {
      id: config.actorId,
      type: config.actorType,
      ...(config.actorName ? { name: config.actorName } : {}),
      metadata: {},
    },
    targets: buildTargets(kind, payload),
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
