import { existsSync, readFileSync } from 'node:fs';
import { sha256, byteLength, truncateMetadataString } from '@workos-inc/audit-core/util';
import { compactMetadata, readStdin, parseJson, createToolTimingStore } from '@workos-inc/audit-core/hook-runtime';
import { emitEvent } from '@workos-inc/audit-core/emit-event';
import { configLoader } from './config-file.mjs';

const EVENT_NAMES = new Set([
  'session-started',
  'session-ended',
  'prompt-submitted',
  'tool-called',
  'tool-completed',
  'tool-failed',
  'turn-completed',
  'turn-failed',
]);

const { storeToolTiming, consumeToolTiming } = createToolTimingStore({
  baseEnvNames: ['CLAUDE_PLUGIN_DATA'],
  fallbackDirName: 'claude-workos-audit',
});

function emptyTokenUsage() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    totalTokens: 0,
    messageCount: 0,
  };
}

function addTokenUsage(total, usage) {
  if (!usage || typeof usage !== 'object') return;
  const inputTokens = typeof usage.input_tokens === 'number' ? usage.input_tokens : 0;
  const outputTokens = typeof usage.output_tokens === 'number' ? usage.output_tokens : 0;
  const cacheCreationInputTokens = typeof usage.cache_creation_input_tokens === 'number'
    ? usage.cache_creation_input_tokens
    : 0;
  const cacheReadInputTokens = typeof usage.cache_read_input_tokens === 'number'
    ? usage.cache_read_input_tokens
    : 0;

  total.inputTokens += inputTokens;
  total.outputTokens += outputTokens;
  total.cacheCreationInputTokens += cacheCreationInputTokens;
  total.cacheReadInputTokens += cacheReadInputTokens;
  total.totalTokens += inputTokens + outputTokens + cacheCreationInputTokens + cacheReadInputTokens;
  total.messageCount += 1;
}

function isHumanPromptEntry(entry) {
  if (!entry || entry.type !== 'user' || entry.isMeta || entry.toolUseResult) return false;
  return typeof entry.message?.content === 'string';
}

function getTranscriptTokenUsage(transcriptPath) {
  if (!transcriptPath || typeof transcriptPath !== 'string' || !existsSync(transcriptPath)) return {};

  try {
    const session = emptyTokenUsage();
    let turn = emptyTokenUsage();
    const lines = readFileSync(transcriptPath, 'utf8').split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      if (isHumanPromptEntry(entry)) {
        turn = emptyTokenUsage();
        continue;
      }

      if (entry.type !== 'assistant') continue;
      const usage = entry.message?.usage;
      addTokenUsage(session, usage);
      addTokenUsage(turn, usage);
    }

    return compactMetadata({
      turn_input_tokens: turn.messageCount > 0 ? turn.inputTokens : undefined,
      turn_output_tokens: turn.messageCount > 0 ? turn.outputTokens : undefined,
      turn_cache_creation_input_tokens: turn.messageCount > 0 ? turn.cacheCreationInputTokens : undefined,
      turn_cache_read_input_tokens: turn.messageCount > 0 ? turn.cacheReadInputTokens : undefined,
      turn_total_tokens: turn.messageCount > 0 ? turn.totalTokens : undefined,
      turn_model_calls: turn.messageCount > 0 ? turn.messageCount : undefined,
      session_input_tokens: session.messageCount > 0 ? session.inputTokens : undefined,
      session_output_tokens: session.messageCount > 0 ? session.outputTokens : undefined,
      session_cache_creation_input_tokens: session.messageCount > 0 ? session.cacheCreationInputTokens : undefined,
      session_cache_read_input_tokens: session.messageCount > 0 ? session.cacheReadInputTokens : undefined,
      session_total_tokens: session.messageCount > 0 ? session.totalTokens : undefined,
      session_model_calls: session.messageCount > 0 ? session.messageCount : undefined,
    });
  } catch {
    return {};
  }
}

function getCommandPreview(payload) {
  if (payload.tool_name !== 'Bash') return undefined;
  return truncateMetadataString(payload.tool_input?.command);
}

function isCommandTruncated(payload, maxLength = 500) {
  const command = payload.tool_name === 'Bash' ? payload.tool_input?.command : undefined;
  return typeof command === 'string' ? command.length > maxLength : undefined;
}

function buildTargets(kind, payload) {
  const sessionTarget = payload.session_id
    ? { id: payload.session_id, type: 'session' }
    : undefined;

  if (!kind.startsWith('tool-')) return sessionTarget ? [sessionTarget] : [];

  const toolTarget = {
    id: payload.tool_use_id || `tool_${sha256({ tool_name: payload.tool_name, tool_input: payload.tool_input }).slice(0, 24)}`,
    type: 'tool',
    metadata: compactMetadata({ tool_name: payload.tool_name }),
  };

  return [sessionTarget, toolTarget].filter(Boolean);
}

function buildEvent(kind, payload, config) {
  const action = {
    'session-started': `${config.actionPrefix}.session.started`,
    'session-ended': `${config.actionPrefix}.session.ended`,
    'prompt-submitted': `${config.actionPrefix}.prompt.submitted`,
    'tool-called': `${config.actionPrefix}.tool.called`,
    'tool-completed': `${config.actionPrefix}.tool.completed`,
    'tool-failed': `${config.actionPrefix}.tool.failed`,
    'turn-completed': `${config.actionPrefix}.turn.completed`,
    'turn-failed': `${config.actionPrefix}.turn.failed`,
  }[kind];

  let metadata = {};

  if (kind === 'session-started') {
    metadata = compactMetadata({
      source: payload.source,
      cwd: payload.cwd,
      transcript_path: payload.transcript_path,
      permission_mode: payload.permission_mode,
    });
  } else if (kind === 'session-ended') {
    metadata = compactMetadata({
      reason: payload.reason,
      cwd: payload.cwd,
      transcript_path: payload.transcript_path,
      permission_mode: payload.permission_mode,
      ...getTranscriptTokenUsage(payload.transcript_path),
    });
  } else if (kind === 'prompt-submitted') {
    metadata = compactMetadata({
      prompt_length: typeof payload.prompt === 'string' ? payload.prompt.length : undefined,
      prompt_sha256: typeof payload.prompt === 'string' ? sha256(payload.prompt) : undefined,
      prompt_preview: typeof payload.prompt === 'string' ? truncateMetadataString(payload.prompt) : undefined,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
    });
  } else if (kind === 'tool-called') {
    storeToolTiming(payload);
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      tool_input_sha256: sha256(payload.tool_input),
      tool_input_bytes: byteLength(payload.tool_input),
      command_preview: getCommandPreview(payload),
      command_truncated: isCommandTruncated(payload),
      blocked: false,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
    });
  } else if (kind === 'tool-completed') {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      duration_ms: consumeToolTiming(payload),
      is_error: false,
      result_sha256: sha256(payload.tool_response),
      result_bytes: byteLength(payload.tool_response),
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
    });
  } else if (kind === 'tool-failed') {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      duration_ms: consumeToolTiming(payload),
      is_error: true,
      error_preview: truncateMetadataString(payload.error),
      error_sha256: typeof payload.error === 'string' ? sha256(payload.error) : undefined,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
    });
  } else if (kind === 'turn-completed') {
    metadata = compactMetadata({
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
      ...getTranscriptTokenUsage(payload.transcript_path),
    });
  } else if (kind === 'turn-failed') {
    metadata = compactMetadata({
      error_type: payload.error_type || payload.reason,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
      ...getTranscriptTokenUsage(payload.transcript_path),
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
