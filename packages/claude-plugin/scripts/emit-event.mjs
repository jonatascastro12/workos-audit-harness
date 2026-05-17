import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFileConfig, trimToUndefined } from './config-file.mjs';

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

function stableSerialize(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value));
}

function sha256(value) {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function byteLength(value) {
  return Buffer.byteLength(stableSerialize(value), 'utf8');
}

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

function truncateMetadataString(value, maxLength = 500) {
  if (typeof value !== 'string') return undefined;
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}

function compactMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function parseJson(text) {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function getEnvOption(name) {
  return trimToUndefined(process.env[`CLAUDE_PLUGIN_OPTION_${name}`])
    || trimToUndefined(process.env[`CLAUDE_PLUGIN_OPTION_${name.toLowerCase()}`])
    || trimToUndefined(process.env[`CLAUDE_PLUGIN_OPTION_${name.toUpperCase()}`]);
}

function getConfig() {
  const fileConfig = readFileConfig();
  const apiKey = trimToUndefined(process.env.WORKOS_API_KEY) || getEnvOption('API_KEY') || fileConfig.apiKey;
  const organizationId = trimToUndefined(process.env.WORKOS_ORGANIZATION_ID) || getEnvOption('ORGANIZATION_ID') || fileConfig.organizationId;
  const actionPrefix = trimToUndefined(process.env.WORKOS_ACTION_PREFIX) || getEnvOption('ACTION_PREFIX') || fileConfig.actionPrefix || 'claude';
  const actorType = trimToUndefined(process.env.WORKOS_ACTOR_TYPE) || getEnvOption('ACTOR_TYPE') || fileConfig.actorType || 'user';
  const actorId = trimToUndefined(process.env.WORKOS_ACTOR_ID)
    || getEnvOption('ACTOR_ID')
    || fileConfig.actorId
    || trimToUndefined(process.env.USER)
    || trimToUndefined(process.env.USERNAME)
    || os.hostname();
  const actorName = trimToUndefined(process.env.WORKOS_ACTOR_NAME)
    || getEnvOption('ACTOR_NAME')
    || fileConfig.actorName
    || trimToUndefined(process.env.USER)
    || trimToUndefined(process.env.USERNAME);
  const location = trimToUndefined(process.env.WORKOS_LOCATION) || getEnvOption('LOCATION') || fileConfig.location || 'claude-code';
  const userAgent = trimToUndefined(process.env.WORKOS_USER_AGENT) || getEnvOption('USER_AGENT') || fileConfig.userAgent || 'claude-code-workos-audit/1';

  return {
    enabled: true,
    apiKey,
    organizationId,
    actionPrefix,
    actorId,
    actorType,
    actorName,
    location,
    userAgent,
  };
}

function getStateDir() {
  const base = trimToUndefined(process.env.CLAUDE_PLUGIN_DATA)
    || path.join(os.tmpdir(), 'claude-workos-audit');
  const dir = path.join(base, 'hook-state', 'tool-timings');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getTimingPath(payload) {
  const toolUseId = payload.tool_use_id || sha256({
    session_id: payload.session_id,
    tool_name: payload.tool_name,
    tool_input: payload.tool_input,
  });
  return path.join(getStateDir(), `${toolUseId}.json`);
}

function storeToolTiming(payload) {
  const timingPath = getTimingPath(payload);
  writeFileSync(timingPath, JSON.stringify({ startedAt: Date.now() }), 'utf8');
}

function consumeToolTiming(payload) {
  const timingPath = getTimingPath(payload);
  if (!existsSync(timingPath)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(timingPath, 'utf8'));
    rmSync(timingPath, { force: true });
    return typeof raw.startedAt === 'number' ? Date.now() - raw.startedAt : undefined;
  } catch {
    rmSync(timingPath, { force: true });
    return undefined;
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

function getHarnessPath() {
  return trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_PATH)
    || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../pi-extension/scripts/audit-log-harness.mjs');
}

async function sendEvent(event, config) {
  const args = [getHarnessPath(), 'emit-event'];
  if (config.organizationId) args.push('--org', config.organizationId);
  if (config.apiKey) args.push('--api-key', config.apiKey);
  execFileSync(process.execPath, args, {
    input: JSON.stringify(event),
    encoding: 'utf8',
    stdio: ['pipe', 'ignore', 'pipe'],
  });
}

async function main() {
  const kind = process.argv[2];
  if (!EVENT_NAMES.has(kind)) {
    console.error(`Unknown event kind: ${kind || '(missing)'}`);
    process.exit(0);
  }

  const config = getConfig();
  if (!config.enabled) process.exit(0);

  try {
    const stdin = await readStdin();
    const payload = parseJson(stdin);
    const event = buildEvent(kind, payload, config);
    await sendEvent(event, config);
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(0);
  }
}

await main();
