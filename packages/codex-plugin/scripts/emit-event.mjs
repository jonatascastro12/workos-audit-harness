import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFileConfig, trimToUndefined } from './config-file.mjs';

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

function getEnv(name) {
  return trimToUndefined(process.env[`CODEX_WORKOS_AUDIT_${name}`])
    || trimToUndefined(process.env[`WORKOS_${name}`]);
}

function getConfig() {
  const fileConfig = readFileConfig();
  const apiKey = getEnv('API_KEY') || fileConfig.apiKey;
  const organizationId = getEnv('ORGANIZATION_ID') || fileConfig.organizationId;
  const actionPrefix = getEnv('ACTION_PREFIX') || fileConfig.actionPrefix || 'codex';
  const actorType = getEnv('ACTOR_TYPE') || fileConfig.actorType || 'user';
  const actorId = getEnv('ACTOR_ID')
    || fileConfig.actorId
    || trimToUndefined(process.env.USER)
    || trimToUndefined(process.env.USERNAME)
    || os.hostname();
  const actorName = getEnv('ACTOR_NAME')
    || fileConfig.actorName
    || trimToUndefined(process.env.USER)
    || trimToUndefined(process.env.USERNAME);
  const location = getEnv('LOCATION') || fileConfig.location || 'codex';
  const userAgent = getEnv('USER_AGENT') || fileConfig.userAgent || 'codex-workos-audit/1';

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
  const base = trimToUndefined(process.env.PLUGIN_DATA)
    || trimToUndefined(process.env.CLAUDE_PLUGIN_DATA)
    || path.join(os.tmpdir(), 'codex-workos-audit');
  const dir = path.join(base, 'hook-state', 'tool-timings');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getTimingPath(payload) {
  const toolUseId = payload.tool_use_id || sha256({
    session_id: payload.session_id,
    turn_id: payload.turn_id,
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
