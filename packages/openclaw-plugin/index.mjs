import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { definePluginEntry } from 'openclaw/plugin-sdk/core';
import { Type } from 'typebox';
import { queryAuditLogs, MAX_QUERY_MAX_ROWS } from '@workos-inc/audit-core/audit-query';
import { createEventBatcher } from '@workos-inc/audit-core/event-batcher';
import { summarizeWorkosCliAuth } from '@workos-inc/audit-core/workos-client';
import { getDeviceCertLabel } from '@workos-inc/audit-core/device-cert';
import {
  byteLength,
  maskSecret,
  sha256,
  truncateMetadataString,
} from '@workos-inc/audit-core/util';
import { compactMetadata, createToolTimingStore } from '@workos-inc/audit-core/hook-runtime';
import { configLoader } from './scripts/config-file.mjs';

const PLUGIN_ID = 'workos-audit';
const PLUGIN_NAME = 'WorkOS Audit';
const HOOK_TIMEOUT_MS = 15_000;
const workspaceIdentityCache = { loaded: false, value: {} };

const { storeToolTiming, consumeToolTiming } = createToolTimingStore({
  baseEnvNames: ['OPENCLAW_WORKOS_AUDIT_DATA', 'OPENCLAW_DATA_DIR', 'OPENCLAW_HOME'],
  fallbackDirName: 'openclaw-workos-audit',
  timingKeyExtras: { run_id: 'run_id' },
});

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function slug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readMarkdownField(filePath, label) {
  if (!existsSync(filePath)) return undefined;
  const content = readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.+)$`, 'mi'));
  const value = match?.[1]?.trim();
  return value && !value.startsWith('_(') ? value : undefined;
}

function workspaceIdentity() {
  if (workspaceIdentityCache.loaded) return workspaceIdentityCache.value;
  workspaceIdentityCache.loaded = true;

  const workspaceDir = pick(
    process.env.OPENCLAW_WORKSPACE_DIR,
    process.env.OPENCLAW_WORKSPACE,
    path.join(os.homedir(), '.openclaw', 'workspace'),
  );

  try {
    workspaceIdentityCache.value = {
      assistantName: readMarkdownField(path.join(workspaceDir, 'IDENTITY.md'), 'Name'),
      userName: readMarkdownField(path.join(workspaceDir, 'USER.md'), 'Name'),
    };
  } catch {
    workspaceIdentityCache.value = {};
  }

  return workspaceIdentityCache.value;
}

function pluginConfigFrom(context) {
  return context?.pluginConfig || context?.context?.pluginConfig || {};
}

function loadHookConfig(context) {
  const config = configLoader.loadConfig();
  const pluginConfig = pluginConfigFrom(context);
  if (typeof pluginConfig.recordingEnabled === 'boolean') {
    return { ...config, recordingEnabled: pluginConfig.recordingEnabled };
  }
  return config;
}

function actorFrom(payload = {}, context = {}, config = {}) {
  const identity = workspaceIdentity();
  const explicitActorId = !['os_user', 'hostname', 'default'].includes(config.sources?.actorId)
    ? config.actorId
    : undefined;
  const explicitActorType = !['default'].includes(config.sources?.actorType)
    ? config.actorType
    : undefined;
  const explicitActorName = !['os_user', 'hostname', 'default'].includes(config.sources?.actorName)
    ? config.actorName
    : undefined;
  const agentId = pick(payload.agentId, payload.agent_id, context.agentId, context.agent_id);
  const assistantName = pick(
    payload.agentName,
    payload.agent_name,
    context.agentName,
    context.agent_name,
    identity.assistantName,
    agentId,
    'OpenClaw',
  );
  const userName = pick(
    payload.senderName,
    payload.sender_name,
    payload.fromName,
    payload.from_name,
    context.senderName,
    context.sender_name,
    identity.userName,
  );
  const userId = pick(
    payload.senderId,
    payload.sender_id,
    payload.from,
    context.senderId,
    context.sender_id,
  );
  const idParts = [slug(assistantName), slug(userName || userId)].filter(Boolean);
  const metadata = compactMetadata({
    machine_user: pick(process.env.USER, process.env.USERNAME),
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    node_version: process.version,
  });

  return {
    id: explicitActorId || `openclaw:${idParts.join(':') || slug(agentId) || 'agent'}`,
    type: explicitActorType || 'user',
    name: explicitActorName || [assistantName, userName].filter(Boolean).join(' / '),
    metadata,
  };
}

function commonContext(event = {}, context = {}) {
  const trace = context.trace || event.trace || {};
  return compactMetadata({
    agent_id: pick(event.agentId, event.agent_id, context.agentId, context.agent_id),
    account_id: pick(event.accountId, event.account_id, context.accountId, context.account_id),
    channel_id: pick(event.channelId, event.channel_id, context.channelId, context.channel_id),
    message_provider: pick(event.messageProvider, event.message_provider, context.messageProvider, context.message_provider),
    run_id: pick(event.runId, event.run_id, context.runId, context.run_id),
    job_id: pick(event.jobId, event.job_id, context.jobId, context.job_id),
    session_key: pick(event.sessionKey, event.session_key, context.sessionKey, context.session_key),
    session_id: pick(event.sessionId, event.session_id, context.sessionId, context.session_id),
    workspace_dir: pick(event.workspaceDir, event.workspace_dir, context.workspaceDir, context.workspace_dir),
    model_provider_id: pick(event.modelProviderId, event.model_provider_id, context.modelProviderId, context.model_provider_id),
    model_id: pick(event.modelId, event.model_id, context.modelId, context.model_id),
    trigger: pick(event.trigger, context.trigger),
    trace_id: pick(event.traceId, event.trace_id, context.traceId, context.trace_id, trace.traceId, trace.trace_id),
    span_id: pick(event.spanId, event.span_id, context.spanId, context.span_id, trace.spanId, trace.span_id),
    parent_span_id: pick(event.parentSpanId, event.parent_span_id, context.parentSpanId, context.parent_span_id, trace.parentSpanId, trace.parent_span_id),
  });
}

function sessionTarget(event = {}, context = {}) {
  const id = pick(event.sessionId, event.session_id, context.sessionId, context.session_id, event.sessionKey, event.session_key, context.sessionKey, context.session_key);
  if (id) return { id, type: 'session' };

  const fallback = compactMetadata({
    run_id: pick(event.runId, event.run_id, context.runId, context.run_id),
    job_id: pick(event.jobId, event.job_id, context.jobId, context.job_id),
    account_id: pick(event.accountId, event.account_id, context.accountId, context.account_id),
    channel_id: pick(event.channelId, event.channel_id, context.channelId, context.channel_id, event.chatId, event.chat_id, context.chatId, context.chat_id),
    thread_id: pick(event.threadId, event.thread_id, context.threadId, context.thread_id),
    provider: pick(event.messageProvider, event.message_provider, context.messageProvider, context.message_provider),
    agent_id: pick(event.agentId, event.agent_id, context.agentId, context.agent_id),
  });

  if (!Object.keys(fallback).length) return undefined;
  return { id: `session_${sha256(fallback).slice(0, 24)}`, type: 'session' };
}

function toolNameFrom(event = {}, context = {}) {
  return pick(event.toolName, event.tool_name, context.toolName, context.tool_name);
}

function toolCallIdFrom(event = {}, context = {}) {
  return pick(event.toolCallId, event.tool_call_id, event.toolUseId, event.tool_use_id, context.toolCallId, context.tool_call_id);
}

function toolTimingPayload(payload = {}, context = {}) {
  return {
    ...payload,
    session_id: pick(payload.sessionId, payload.session_id, context.sessionId, context.session_id),
    tool_name: toolNameFrom(payload, context),
    tool_use_id: toolCallIdFrom(payload, context),
    tool_input: payload.params,
    run_id: pick(payload.runId, payload.run_id, context.runId, context.run_id),
  };
}

function toolTarget(event = {}, context = {}) {
  const toolName = toolNameFrom(event, context);
  const toolCallId = toolCallIdFrom(event, context);
  if (!toolName && !toolCallId) return undefined;
  return {
    id: toolCallId || `tool_${sha256({ toolName, params: event.params }).slice(0, 24)}`,
    type: 'tool',
    metadata: compactMetadata({ tool_name: toolName }),
  };
}

function messageTarget(event = {}) {
  const id = pick(event.messageId, event.message_id, event.id) || `msg_${sha256({
    from: event.from,
    to: event.to,
    content: pick(event.content, event.body, event.text, event.prompt),
    timestamp: event.timestamp,
  }).slice(0, 24)}`;
  return {
    id,
    type: 'message',
    metadata: compactMetadata({
      sender_id: pick(event.senderId, event.sender_id, event.from),
      thread_id: pick(event.threadId, event.thread_id) === undefined ? undefined : String(pick(event.threadId, event.thread_id)),
    }),
  };
}

function modelCallTarget(event = {}) {
  const callId = pick(event.callId, event.call_id);
  return callId ? {
    id: callId,
    type: 'model_call',
    metadata: compactMetadata({
      provider: pick(event.provider, event.providerId, event.provider_id),
      model: pick(event.model, event.modelId, event.model_id),
    }),
  } : undefined;
}

function buildEvent(kind, payload, context, config) {
  let metadata = {};
  let targets = [sessionTarget(payload, context)].filter(Boolean);
  const content = pick(payload.content, payload.body, payload.text, payload.prompt);
  const provider = pick(payload.provider, payload.providerId, payload.provider_id, context.modelProviderId, context.model_provider_id);
  const model = pick(payload.model, payload.modelId, payload.model_id, context.modelId, context.model_id);

  if (kind === 'session.started') {
    metadata = compactMetadata({
      resumed_from: payload.resumedFrom,
      ...commonContext(payload, context),
    });
  } else if (kind === 'session.ended') {
    metadata = compactMetadata({
      message_count: payload.messageCount,
      duration_ms: payload.durationMs,
      reason: payload.reason,
      session_file: payload.sessionFile,
      transcript_archived: payload.transcriptArchived,
      next_session_id: payload.nextSessionId,
      next_session_key: payload.nextSessionKey,
      ...commonContext(payload, context),
    });
  } else if (kind === 'prompt.submitted') {
    targets = [sessionTarget(payload, context), messageTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      from: pick(payload.from, payload.senderId, payload.sender_id),
      message_preview: typeof content === 'string' ? truncateMetadataString(content) : undefined,
      content_length: typeof content === 'string' ? content.length : undefined,
      content_sha256: typeof content === 'string' ? sha256(content) : undefined,
      timestamp: payload.timestamp,
      thread_id: pick(payload.threadId, payload.thread_id) === undefined ? undefined : String(pick(payload.threadId, payload.thread_id)),
      reply_to_id: pick(payload.replyToId, payload.reply_to_id),
      sender_is_owner: payload.senderIsOwner,
      ...commonContext(payload, context),
    });
  } else if (kind === 'message.sent') {
    targets = [sessionTarget(payload, context), messageTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      to: payload.to,
      success: payload.success,
      message_preview: typeof content === 'string' ? truncateMetadataString(content) : undefined,
      content_length: typeof content === 'string' ? content.length : undefined,
      content_sha256: typeof content === 'string' ? sha256(content) : undefined,
      error_preview: payload.error ? truncateMetadataString(payload.error) : undefined,
      ...commonContext(payload, context),
    });
  } else if (kind === 'agent.run.started') {
    metadata = compactMetadata({
      prompt_length: typeof payload.prompt === 'string' ? payload.prompt.length : undefined,
      prompt_sha256: typeof payload.prompt === 'string' ? sha256(payload.prompt) : undefined,
      system_prompt_sha256: typeof payload.systemPrompt === 'string' ? sha256(payload.systemPrompt) : undefined,
      history_message_count: Array.isArray(payload.messages) ? payload.messages.length : undefined,
      sender_id: pick(payload.senderId, payload.sender_id),
      sender_is_owner: payload.senderIsOwner,
      ...commonContext(payload, context),
    });
  } else if (kind === 'llm.input') {
    metadata = compactMetadata({
      provider,
      model,
      prompt_length: typeof payload.prompt === 'string' ? payload.prompt.length : undefined,
      prompt_sha256: typeof payload.prompt === 'string' ? sha256(payload.prompt) : undefined,
      system_prompt_sha256: typeof payload.systemPrompt === 'string' ? sha256(payload.systemPrompt) : undefined,
      history_message_count: Array.isArray(payload.historyMessages) ? payload.historyMessages.length : undefined,
      images_count: payload.imagesCount,
      tools_count: Array.isArray(payload.tools) ? payload.tools.length : undefined,
      ...commonContext(payload, context),
    });
  } else if (kind === 'llm.output') {
    metadata = compactMetadata({
      provider,
      model,
      resolved_ref: payload.resolvedRef,
      harness_id: payload.harnessId,
      assistant_text_count: Array.isArray(payload.assistantTexts) ? payload.assistantTexts.length : undefined,
      assistant_text_bytes: Array.isArray(payload.assistantTexts) ? byteLength(payload.assistantTexts.join('\n')) : undefined,
      usage_input_tokens: payload.usage?.input,
      usage_output_tokens: payload.usage?.output,
      usage_cache_read_tokens: payload.usage?.cacheRead,
      usage_cache_write_tokens: payload.usage?.cacheWrite,
      usage_total_tokens: payload.usage?.total,
      context_token_budget: payload.contextTokenBudget,
      context_window_source: payload.contextWindowSource,
      context_window_reference_tokens: payload.contextWindowReferenceTokens,
      ...commonContext(payload, context),
    });
  } else if (kind === 'tool.called') {
    const toolName = toolNameFrom(payload, context);
    const toolCallId = toolCallIdFrom(payload, context);
    storeToolTiming(toolTimingPayload(payload, context));
    targets = [sessionTarget(payload, context), toolTarget(payload, context)].filter(Boolean);
    metadata = compactMetadata({
      tool_name: toolName,
      tool_call_id: toolCallId,
      tool_kind: payload.toolKind,
      tool_input_kind: payload.toolInputKind,
      params_sha256: sha256(payload.params),
      params_bytes: byteLength(payload.params),
      derived_paths: payload.derivedPaths?.join(','),
      blocked: false,
      ...commonContext(payload, context),
    });
  } else if (kind === 'tool.completed' || kind === 'tool.failed') {
    const toolName = toolNameFrom(payload, context);
    const toolCallId = toolCallIdFrom(payload, context);
    targets = [sessionTarget(payload, context), toolTarget(payload, context)].filter(Boolean);
    metadata = compactMetadata({
      tool_name: toolName,
      tool_call_id: toolCallId,
      duration_ms: payload.durationMs ?? consumeToolTiming(toolTimingPayload(payload, context)),
      is_error: kind === 'tool.failed',
      result_sha256: payload.result === undefined ? undefined : sha256(payload.result),
      result_bytes: payload.result === undefined ? undefined : byteLength(payload.result),
      error_preview: payload.error ? truncateMetadataString(payload.error) : undefined,
      ...commonContext(payload, context),
    });
  } else if (kind === 'model.call.started') {
    targets = [sessionTarget(payload, context), modelCallTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      provider,
      model,
      api: payload.api,
      transport: payload.transport,
      context_token_budget: payload.contextTokenBudget,
      context_window_source: payload.contextWindowSource,
      context_window_reference_tokens: payload.contextWindowReferenceTokens,
      ...commonContext(payload, context),
    });
  } else if (kind === 'model.call.completed' || kind === 'model.call.failed') {
    targets = [sessionTarget(payload, context), modelCallTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      provider,
      model,
      api: payload.api,
      transport: payload.transport,
      duration_ms: payload.durationMs,
      outcome: payload.outcome,
      error_category: payload.errorCategory,
      failure_kind: payload.failureKind,
      request_payload_bytes: payload.requestPayloadBytes,
      response_stream_bytes: payload.responseStreamBytes,
      time_to_first_byte_ms: payload.timeToFirstByteMs,
      upstream_request_id_hash: payload.upstreamRequestIdHash,
      context_token_budget: payload.contextTokenBudget,
      context_window_source: payload.contextWindowSource,
      context_window_reference_tokens: payload.contextWindowReferenceTokens,
      ...commonContext(payload, context),
    });
  } else if (kind === 'turn.completed' || kind === 'turn.failed') {
    metadata = compactMetadata({
      success: payload.success,
      duration_ms: payload.durationMs,
      message_count: Array.isArray(payload.messages) ? payload.messages.length : undefined,
      error_preview: payload.error ? truncateMetadataString(payload.error) : undefined,
      ...commonContext(payload, context),
    });
  }

  const actor = actorFrom(payload, context, config);

  return {
    action: `${config.actionPrefix}.${kind}`,
    occurred_at: new Date().toISOString(),
    actor: {
      id: actor.id,
      type: actor.type,
      ...(actor.name ? { name: actor.name } : {}),
      metadata: actor.metadata,
    },
    targets,
    context: {
      location: config.location,
      user_agent: config.userAgent,
    },
    metadata,
  };
}

// One batcher per hook config, keyed by the resolved proxy/credential target so a
// config change starts a fresh buffer rather than sending events somewhere they
// were not meant to go. Keyed rather than recreated per event, because a batcher
// that is rebuilt each call can never accumulate anything to batch.
const batchers = new Map();

function batcherFor(config) {
  const key = config.proxyUrl ?? `direct:${config.organizationId ?? ''}`;
  let batcher = batchers.get(key);
  if (!batcher) {
    batcher = createEventBatcher({
      config,
      onError: (detail) => console.error(`[${PLUGIN_ID}] ${detail}`),
    });
    batchers.set(key, batcher);
  }
  return batcher;
}

// Drain every buffer. openclaw awaits its hooks, so session_end waiting here is
// what stops an ordinary exit from dropping the tail of the session.
async function flushRecorded() {
  await Promise.all([...batchers.values()].map((b) => b.flush()));
}

function record(kind, payload, context) {
  const config = loadHookConfig(context);
  if (config.recordingEnabled === false) return;
  try {
    // Buffered, not sent. Previously this awaited the emit inside the hook, so
    // every lifecycle event cost a full mTLS handshake on openclaw's critical
    // path; now a burst leaves as one request.
    batcherFor(config).add(buildEvent(kind, payload, context, config));
  } catch (error) {
    console.error(`[${PLUGIN_ID}] ${kind} audit event failed: ${String(error?.message || error)}`);
  }
}

function statusPayload() {
  const config = configLoader.loadConfig();
  const actor = actorFrom({}, {}, config);
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
    actorId: actor.id,
    actorType: actor.type,
    actorName: actor.name,
    location: config.location,
    userAgent: config.userAgent,
    sources: config.sources,
  };
}

export default definePluginEntry({
  id: PLUGIN_ID,
  name: PLUGIN_NAME,
  description: 'Emit OpenClaw lifecycle events to WorkOS and query audit logs.',
  configSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      recordingEnabled: { type: 'boolean' },
    },
  },
  register(api) {
    api.registerTool({
      name: 'workos_audit_status',
      label: 'WorkOS Audit Status',
      description: 'Show WorkOS audit plugin configuration status.',
      parameters: Type.Object({}),
      async execute() {
        return {
          content: [{ type: 'text', text: JSON.stringify(statusPayload(), null, 2) }],
          structuredContent: statusPayload(),
        };
      },
    });

    api.registerTool({
      name: 'workos_audit_query',
      label: 'WorkOS Audit Query',
      description: 'Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows.',
      parameters: Type.Object({
        question: Type.String(),
        rangeStart: Type.Optional(Type.String()),
        rangeEnd: Type.Optional(Type.String()),
        actions: Type.Optional(Type.Array(Type.String())),
        actorIds: Type.Optional(Type.Array(Type.String())),
        actorNames: Type.Optional(Type.Array(Type.String())),
        targets: Type.Optional(Type.Array(Type.String())),
        maxRows: Type.Optional(Type.Number({ minimum: 1, maximum: MAX_QUERY_MAX_ROWS })),
      }),
      async execute(_id, params) {
        try {
          const result = await queryAuditLogs(configLoader.loadQueryConfig(), params);
          return {
            content: [{ type: 'text', text: result.text }],
            structuredContent: result.details,
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: 'text', text: error.stderr?.toString?.() || error.message || String(error) }],
          };
        }
      },
    });

    api.on('session_start', (event, context) => record('session.started', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('session_end', async (event, context) => {
      record('session.ended', event, context);
      await flushRecorded();
    }, { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('message_received', (event, context) => record('prompt.submitted', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('message_sent', (event, context) => record('message.sent', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('before_agent_run', (event, context) => record('agent.run.started', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('llm_input', (event, context) => record('llm.input', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('llm_output', (event, context) => record('llm.output', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('before_tool_call', (event, context) => record('tool.called', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('after_tool_call', (event, context) => record(event.error ? 'tool.failed' : 'tool.completed', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('model_call_started', (event, context) => record('model.call.started', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('model_call_ended', (event, context) => record(event.outcome === 'error' ? 'model.call.failed' : 'model.call.completed', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
    api.on('agent_end', (event, context) => record(event.success ? 'turn.completed' : 'turn.failed', event, context), { timeoutMs: HOOK_TIMEOUT_MS });
  },
});
