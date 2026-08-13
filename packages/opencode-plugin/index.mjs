import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { queryAuditLogs, MAX_QUERY_MAX_ROWS } from '@workos-inc/audit-core/audit-query';
import { createEventBatcher } from '@workos-inc/audit-core/event-batcher';
import { emitEvents } from '@workos-inc/audit-core/emit-event';
import { summarizeWorkosCliAuth } from '@workos-inc/audit-core/workos-client';
import { getDeviceCertLabel } from '@workos-inc/audit-core/device-cert';
import {
  byteLength,
  maskSecret,
  sha256,
  truncateMetadataString,
} from '@workos-inc/audit-core/util';
import { compactMetadata } from '@workos-inc/audit-core/hook-runtime';
import { configLoader, findRunnerBin } from './scripts/config-file.mjs';

const PLUGIN_ID = 'workos-audit';
const COMMAND_TOOLS = new Set(['bash']);
const MAX_TRACKED_TOOL_TIMINGS = 1000;

// Both tool.execute hooks run in this same long-lived server process, so a Map
// keyed by sessionID+callID is enough for duration_ms — no on-disk store.
const toolTimings = new Map();

function storeToolTiming(sessionID, callID) {
  if (!callID) return;
  if (toolTimings.size >= MAX_TRACKED_TOOL_TIMINGS) {
    toolTimings.delete(toolTimings.keys().next().value);
  }
  toolTimings.set(`${sessionID}:${callID}`, Date.now());
}

function consumeToolTiming(sessionID, callID) {
  if (!callID) return undefined;
  const key = `${sessionID}:${callID}`;
  const startedAt = toolTimings.get(key);
  if (startedAt === undefined) return undefined;
  toolTimings.delete(key);
  return Date.now() - startedAt;
}

function sessionTarget(sessionID) {
  return sessionID ? { id: sessionID, type: 'session' } : undefined;
}

function toolTarget(callID, toolName, args) {
  return {
    id: callID || `tool_${sha256({ tool_name: toolName, tool_input: args }).slice(0, 24)}`,
    type: 'tool',
    metadata: compactMetadata({ tool_name: toolName }),
  };
}

function getCommand(toolName, args) {
  if (!COMMAND_TOOLS.has(toolName)) return undefined;
  return typeof args?.command === 'string' ? args.command : undefined;
}

function getCommandPreview(toolName, args) {
  return truncateMetadataString(getCommand(toolName, args));
}

function isCommandTruncated(toolName, args, maxLength = 500) {
  const command = getCommand(toolName, args);
  return typeof command === 'string' ? command.length > maxLength : undefined;
}

function promptText(parts) {
  const texts = (Array.isArray(parts) ? parts : [])
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text);
  return texts.length ? texts.join('\n') : undefined;
}

function buildEvent(kind, targets, metadata, config) {
  return {
    action: `${config.actionPrefix}.${kind}`,
    occurred_at: new Date().toISOString(),
    actor: {
      id: config.actorId,
      type: config.actorType,
      ...(config.actorName ? { name: config.actorName } : {}),
      metadata: {},
    },
    targets: targets.filter(Boolean),
    context: {
      location: config.location,
      user_agent: config.userAgent,
    },
    metadata: compactMetadata(metadata),
  };
}

// One batcher per hook config, keyed by the resolved proxy/credential target so a
// config change starts a fresh buffer rather than sending events somewhere they
// were not meant to go.
const batchers = new Map();

// OpenCode hard-exits (`process.exit`) as soon as a one-shot `opencode run`
// finishes: in-flight fetches, spawned-but-unwritten stdin, ref'd timers — all
// abandoned. The only emission that survives is a detached child process whose
// payload is already on disk. Each batch is written to a 0600 temp file and
// handed to dist/scripts/emit-batch.mjs, which deletes it and emits through the
// normal transport chain in its own process. Without a node/bun on PATH this
// falls back to in-process emission, which is fine everywhere except the tail
// of a one-shot run.
function sendDetached(events, config) {
  const debug = process.env.OPENCODE_WORKOS_AUDIT_DEBUG;
  const trace = (line) => {
    if (!debug) return;
    try { appendFileSync(debug, `${Date.now()} ${line}\n`); } catch {}
  };
  const runner = findRunnerBin();
  trace(`sendDetached events=${events.length} runner=${runner ?? 'none'}`);
  if (!runner) return emitEvents(events, config);
  const script = fileURLToPath(new URL('./scripts/emit-batch.mjs', import.meta.url));
  const path = join(tmpdir(), `workos-audit-batch-${randomUUID()}.json`);
  writeFileSync(path, JSON.stringify({ events }), { mode: 0o600 });
  trace(`wrote ${path}`);
  const child = spawn(runner, [script, path], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
  child.on('error', (error) => trace(`spawn error ${String(error?.message || error)}`));
  child.unref();
  trace(`spawned pid=${child.pid ?? 'none'}`);
  return Promise.resolve({ ok: true, transport: 'detached', total: events.length });
}

function batcherFor(config) {
  const key = config.proxyUrl ?? `direct:${config.organizationId ?? ''}`;
  let batcher = batchers.get(key);
  if (!batcher) {
    batcher = createEventBatcher({
      config,
      send: sendDetached,
      onError: (detail) => console.error(`[${PLUGIN_ID}] ${detail}`),
    });
    batchers.set(key, batcher);
  }
  return batcher;
}

async function flushRecorded() {
  await Promise.all([...batchers.values()].map((b) => b.flush()));
}

function record(kind, targets, metadata) {
  try {
    const config = configLoader.loadConfig();
    if (config.recordingEnabled === false) return;
    // Buffered, not sent: nothing in a hook awaits network except the explicit
    // flush on session-end events.
    batcherFor(config).add(buildEvent(kind, targets, metadata, config));
  } catch (error) {
    console.error(`[${PLUGIN_ID}] ${kind} audit event failed: ${String(error?.message || error)}`);
  }
}

function statusPayload() {
  const config = configLoader.loadConfig();
  const workosCli = summarizeWorkosCliAuth();
  const credentialSource = config.apiKey
    ? 'api-key'
    : (workosCli.loggedIn ? 'workos-cli' : 'none');
  // A proxy without the on-device certificate is not a working transport:
  // emitViaProxy skips the event rather than falling back, so report it as its
  // own state instead of an unqualified 'proxy'.
  const deviceCertLabel = config.proxyUrl ? getDeviceCertLabel() : null;
  const recordingTransport = config.proxyUrl
    ? (deviceCertLabel ? 'proxy' : 'proxy-no-device-certificate')
    : credentialSource;
  return {
    enabled: true,
    configured: Boolean((config.proxyUrl && deviceCertLabel) || credentialSource !== 'none'),
    deviceCertificate: config.proxyUrl ? (deviceCertLabel ?? null) : null,
    // Under the proxy, actor and context below are overwritten server-side.
    identitySource: config.proxyUrl ? 'proxy (device certificate -> MDM assignment)' : 'local config',
    configPath: configLoader.getConfigFilePath(),
    credentialSource,
    recordingTransport,
    workosCli,
    apiKey: maskSecret(config.apiKey),
    proxyUrl: config.proxyUrl || null,
    organizationId: config.organizationId || null,
    organizationResolution: config.organizationId
      ? 'explicit'
      : config.proxyUrl
        ? 'proxy-resolved'
        : 'auto-find-or-create Audit Log Harness',
    recordingEnabled: config.recordingEnabled !== false,
    actionPrefix: config.actionPrefix,
    actorId: config.actorId,
    actorType: config.actorType,
    actorName: config.actorName,
    location: config.location,
    userAgent: config.userAgent,
    sources: config.sources,
  };
}

export const WorkosAuditPlugin = async ({ directory }) => {
  // `opencode run` creates the session before plugins subscribe to the bus, so
  // session.created never reaches this hook in one-shot mode. Track which
  // sessions have a session.started event and synthesize one from the first
  // chat.message instead. Bounded so abandoned ids cannot grow without limit.
  const startedSessions = new Set();
  const noteSessionStarted = (sessionId) => {
    if (!sessionId || startedSessions.has(sessionId)) return false;
    if (startedSessions.size >= 1000) {
      startedSessions.delete(startedSessions.values().next().value);
    }
    startedSessions.add(sessionId);
    return true;
  };

  return {
    event: async ({ event }) => {
      try {
        if (event.type === 'session.created') {
          const info = event.properties.info;
          if (noteSessionStarted(info?.id)) {
            record('session.started', [sessionTarget(info?.id)], {
              parent_session_id: info?.parentID,
              cwd: info?.directory,
              harness_version: info?.version,
            });
          }
        } else if (event.type === 'session.deleted') {
          const info = event.properties.info;
          record('session.ended', [sessionTarget(info?.id)], {
            parent_session_id: info?.parentID,
            cwd: info?.directory,
          });
          await flushRecorded();
        } else if (event.type === 'session.idle') {
          record('turn.completed', [sessionTarget(event.properties.sessionID)], {
            cwd: directory,
          });
          await flushRecorded();
        } else if (event.type === 'session.error') {
          const error = event.properties.error;
          record('turn.failed', [sessionTarget(event.properties.sessionID)], {
            cwd: directory,
            error_type: error?.name,
            error_preview: typeof error?.data?.message === 'string'
              ? truncateMetadataString(error.data.message)
              : undefined,
          });
          // Failure tails are the events most worth keeping: the user often
          // quits right after a fatal error, before the batcher's unref'd
          // 200ms timer would have fired.
          await flushRecorded();
        } else if (event.type === 'server.instance.disposed') {
          // Closest thing OpenCode has to a host shutdown hook — flush every
          // batcher so buffered events are not dropped with the process.
          await flushRecorded();
        }
      } catch (error) {
        console.error(`[${PLUGIN_ID}] event hook failed: ${String(error?.message || error)}`);
      }
    },

    'chat.message': async (input, output) => {
      try {
        const message = output?.message || {};
        const text = promptText(output?.parts);
        const model = input?.model || message.model;
        const messageId = input?.messageID || message.id;
        const sessionId = input?.sessionID || message.sessionID;
        if (noteSessionStarted(sessionId)) {
          record('session.started', [sessionTarget(sessionId)], { cwd: directory });
        }
        record('prompt.submitted', [
          sessionTarget(sessionId),
          {
            id: messageId || `msg_${sha256({ session_id: input?.sessionID, text }).slice(0, 24)}`,
            type: 'message',
            metadata: { role: 'user' },
          },
        ], {
          prompt_length: typeof text === 'string' ? text.length : undefined,
          prompt_sha256: typeof text === 'string' ? sha256(text) : undefined,
          prompt_preview: typeof text === 'string' ? truncateMetadataString(text) : undefined,
          agent: input?.agent || message.agent,
          provider: model?.providerID,
          model_id: model?.modelID,
        });
      } catch (error) {
        console.error(`[${PLUGIN_ID}] chat.message hook failed: ${String(error?.message || error)}`);
      }
    },

    'tool.execute.before': async (input, output) => {
      try {
        storeToolTiming(input.sessionID, input.callID);
        record('tool.called', [
          sessionTarget(input.sessionID),
          toolTarget(input.callID, input.tool, output?.args),
        ], {
          tool_name: input.tool,
          tool_call_id: input.callID,
          tool_input_sha256: sha256(output?.args),
          tool_input_bytes: byteLength(output?.args),
          command_preview: getCommandPreview(input.tool, output?.args),
          command_truncated: isCommandTruncated(input.tool, output?.args),
          blocked: false,
        });
      } catch (error) {
        console.error(`[${PLUGIN_ID}] tool.execute.before hook failed: ${String(error?.message || error)}`);
      }
    },

    'tool.execute.after': async (input, output) => {
      try {
        record('tool.completed', [
          sessionTarget(input.sessionID),
          toolTarget(input.callID, input.tool, input.args),
        ], {
          tool_name: input.tool,
          tool_call_id: input.callID,
          duration_ms: consumeToolTiming(input.sessionID, input.callID),
          is_error: false,
          result_sha256: output?.output === undefined ? undefined : sha256(output.output),
          result_bytes: output?.output === undefined ? undefined : byteLength(output.output),
          title: truncateMetadataString(output?.title),
        });
      } catch (error) {
        console.error(`[${PLUGIN_ID}] tool.execute.after hook failed: ${String(error?.message || error)}`);
      }
    },

    'permission.ask': async (input) => {
      // Observe only: output.status stays whatever the host resolved.
      try {
        record('permission.requested', [
          sessionTarget(input?.sessionID),
          input?.callID ? { id: input.callID, type: 'tool' } : undefined,
        ], {
          permission_type: input?.type,
          permission_pattern: Array.isArray(input?.pattern) ? input.pattern.join(',') : input?.pattern,
          title: truncateMetadataString(input?.title),
          tool_call_id: input?.callID,
        });
      } catch (error) {
        console.error(`[${PLUGIN_ID}] permission.ask hook failed: ${String(error?.message || error)}`);
      }
    },

    tool: {
      workos_audit_status: {
        description: 'Show WorkOS audit plugin configuration status.',
        args: {},
        async execute() {
          return JSON.stringify(statusPayload(), null, 2);
        },
      },
      workos_audit_query: {
        description: 'Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows.',
        args: {
          question: z.string(),
          rangeStart: z.string().optional(),
          rangeEnd: z.string().optional(),
          actions: z.array(z.string()).optional(),
          actorIds: z.array(z.string()).optional(),
          actorNames: z.array(z.string()).optional(),
          targets: z.array(z.string()).optional(),
          maxRows: z.number().min(1).max(MAX_QUERY_MAX_ROWS).optional(),
        },
        async execute(params) {
          try {
            const result = await queryAuditLogs(configLoader.loadQueryConfig(), params);
            return result.text;
          } catch (error) {
            return error.stderr?.toString?.() || error.message || String(error);
          }
        },
      },
    },
  };
};
