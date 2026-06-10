import { Type } from 'typebox';
import { queryAuditLogs, MAX_QUERY_MAX_ROWS } from '@workos-inc/audit-core/audit-query';
import { emitEvent } from '@workos-inc/audit-core/emit-event';
import { summarizeWorkosCliAuth } from '@workos-inc/audit-core/workos-client';
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

const { storeToolTiming, consumeToolTiming } = createToolTimingStore({
  baseEnvNames: ['OPENCLAW_WORKOS_AUDIT_DATA', 'OPENCLAW_DATA_DIR', 'OPENCLAW_HOME'],
  fallbackDirName: 'openclaw-workos-audit',
  timingKeyExtras: { run_id: 'run_id' },
});

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

function commonContext(event = {}, context = {}) {
  return compactMetadata({
    agent_id: context.agentId,
    channel_id: context.channelId,
    message_provider: context.messageProvider,
    run_id: event.runId || context.runId,
    job_id: context.jobId,
    session_key: event.sessionKey || context.sessionKey,
    session_id: event.sessionId || context.sessionId,
    model_provider_id: context.modelProviderId,
    model_id: context.modelId,
    trigger: context.trigger,
    trace_id: event.traceId || context.traceId,
    span_id: event.spanId || context.spanId,
    parent_span_id: event.parentSpanId || context.parentSpanId,
  });
}

function sessionTarget(event = {}, context = {}) {
  const id = event.sessionId || context.sessionId || event.sessionKey || context.sessionKey;
  return id ? { id, type: 'session' } : undefined;
}

function toolTarget(event = {}) {
  if (!event.toolName && !event.toolCallId) return undefined;
  return {
    id: event.toolCallId || `tool_${sha256({ toolName: event.toolName, params: event.params }).slice(0, 24)}`,
    type: 'tool',
    metadata: compactMetadata({ tool_name: event.toolName }),
  };
}

function messageTarget(event = {}) {
  const id = event.messageId || `msg_${sha256({
    from: event.from,
    to: event.to,
    content: event.content,
    timestamp: event.timestamp,
  }).slice(0, 24)}`;
  return {
    id,
    type: 'message',
    metadata: compactMetadata({
      sender_id: event.senderId,
      thread_id: event.threadId === undefined ? undefined : String(event.threadId),
    }),
  };
}

function modelCallTarget(event = {}) {
  return event.callId ? {
    id: event.callId,
    type: 'model_call',
    metadata: compactMetadata({
      provider: event.provider,
      model: event.model,
    }),
  } : undefined;
}

function buildEvent(kind, payload, context, config) {
  let metadata = {};
  let targets = [sessionTarget(payload, context)].filter(Boolean);

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
      from: payload.from,
      content_length: typeof payload.content === 'string' ? payload.content.length : undefined,
      content_sha256: typeof payload.content === 'string' ? sha256(payload.content) : undefined,
      timestamp: payload.timestamp,
      thread_id: payload.threadId === undefined ? undefined : String(payload.threadId),
      reply_to_id: payload.replyToId,
      ...commonContext(payload, context),
    });
  } else if (kind === 'message.sent') {
    targets = [sessionTarget(payload, context), messageTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      to: payload.to,
      success: payload.success,
      content_length: typeof payload.content === 'string' ? payload.content.length : undefined,
      content_sha256: typeof payload.content === 'string' ? sha256(payload.content) : undefined,
      error_preview: payload.error ? truncateMetadataString(payload.error) : undefined,
      ...commonContext(payload, context),
    });
  } else if (kind === 'tool.called') {
    const timingPayload = { ...payload, run_id: payload.runId || context.runId };
    storeToolTiming(timingPayload);
    targets = [sessionTarget(payload, context), toolTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      tool_name: payload.toolName,
      tool_call_id: payload.toolCallId,
      tool_kind: payload.toolKind,
      tool_input_kind: payload.toolInputKind,
      params_sha256: sha256(payload.params),
      params_bytes: byteLength(payload.params),
      derived_paths: payload.derivedPaths?.join(','),
      blocked: false,
      ...commonContext(payload, context),
    });
  } else if (kind === 'tool.completed' || kind === 'tool.failed') {
    const timingPayload = { ...payload, run_id: payload.runId || context.runId };
    targets = [sessionTarget(payload, context), toolTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      tool_name: payload.toolName,
      tool_call_id: payload.toolCallId,
      duration_ms: payload.durationMs ?? consumeToolTiming(timingPayload),
      is_error: kind === 'tool.failed',
      result_sha256: payload.result === undefined ? undefined : sha256(payload.result),
      result_bytes: payload.result === undefined ? undefined : byteLength(payload.result),
      error_preview: payload.error ? truncateMetadataString(payload.error) : undefined,
      ...commonContext(payload, context),
    });
  } else if (kind === 'model.call.started') {
    targets = [sessionTarget(payload, context), modelCallTarget(payload)].filter(Boolean);
    metadata = compactMetadata({
      provider: payload.provider,
      model: payload.model,
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
      provider: payload.provider,
      model: payload.model,
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

  return {
    action: `${config.actionPrefix}.${kind}`,
    occurred_at: new Date().toISOString(),
    actor: {
      id: config.actorId,
      type: config.actorType,
      ...(config.actorName ? { name: config.actorName } : {}),
      metadata: {},
    },
    targets,
    context: {
      location: config.location,
      user_agent: config.userAgent,
    },
    metadata,
  };
}

async function record(kind, payload, context) {
  const config = loadHookConfig(context);
  if (config.recordingEnabled === false) return;
  try {
    await emitEvent(buildEvent(kind, payload, context, config), config);
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
  return {
    enabled: true,
    configured: credentialSource !== 'none',
    configPath: configLoader.getConfigFilePath(),
    credentialSource,
    workosCli,
    apiKey: maskSecret(config.apiKey),
    organizationId: config.organizationId || null,
    organizationResolution: config.organizationId
      ? 'explicit'
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

export default {
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

    api.on('session_start', (event, context) => record('session.started', event, context), { timeoutMs: 15_000 });
    api.on('session_end', (event, context) => record('session.ended', event, context), { timeoutMs: 15_000 });
    api.on('message_received', (event, context) => record('prompt.submitted', event, context), { timeoutMs: 15_000 });
    api.on('message_sent', (event, context) => record('message.sent', event, context), { timeoutMs: 15_000 });
    api.on('before_tool_call', (event, context) => record('tool.called', event, context), { timeoutMs: 15_000 });
    api.on('after_tool_call', (event, context) => record(event.error ? 'tool.failed' : 'tool.completed', event, context), { timeoutMs: 15_000 });
    api.on('model_call_started', (event, context) => record('model.call.started', event, context), { timeoutMs: 15_000 });
    api.on('model_call_ended', (event, context) => record(event.outcome === 'error' ? 'model.call.failed' : 'model.call.completed', event, context), { timeoutMs: 15_000 });
    api.on('agent_end', (event, context) => record(event.success ? 'turn.completed' : 'turn.failed', event, context), { timeoutMs: 15_000 });
  },
};
