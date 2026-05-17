// scripts/emit-event.mjs
import { existsSync as existsSync4, readFileSync as readFileSync4 } from "node:fs";

// ../audit-core/src/util.mjs
import { createHash } from "node:crypto";
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function stableSerialize(value) {
  if (value === null || value === undefined)
    return "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableSerialize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}
function sha256(value) {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}
function byteLength(value) {
  return Buffer.byteLength(stableSerialize(value), "utf8");
}
function truncateMetadataString(value, maxLength = 500) {
  if (typeof value !== "string")
    return;
  if (value.length <= maxLength)
    return value;
  if (maxLength <= 3)
    return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}

// ../audit-core/src/hook-runtime.mjs
import os from "node:os";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}
function parseJson(text) {
  if (!text.trim())
    return {};
  return JSON.parse(text);
}
function compactMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}
function createToolTimingStore({ baseEnvNames, fallbackDirName, timingKeyExtras = {} }) {
  function getStateDir() {
    let base;
    for (const name of baseEnvNames) {
      base = trimToUndefined(process.env[name]);
      if (base)
        break;
    }
    if (!base)
      base = path.join(os.tmpdir(), fallbackDirName);
    const dir = path.join(base, "hook-state", "tool-timings");
    mkdirSync(dir, { recursive: true });
    return dir;
  }
  function getTimingPath(payload) {
    const toolUseId = payload.tool_use_id || sha256({
      session_id: payload.session_id,
      tool_name: payload.tool_name,
      tool_input: payload.tool_input,
      ...Object.fromEntries(Object.entries(timingKeyExtras).map(([k, field]) => [k, payload[field]]))
    });
    return path.join(getStateDir(), `${toolUseId}.json`);
  }
  function storeToolTiming(payload) {
    writeFileSync(getTimingPath(payload), JSON.stringify({ startedAt: Date.now() }), "utf8");
  }
  function consumeToolTiming(payload) {
    const timingPath = getTimingPath(payload);
    if (!existsSync(timingPath))
      return;
    try {
      const raw = JSON.parse(readFileSync(timingPath, "utf8"));
      rmSync(timingPath, { force: true });
      return typeof raw.startedAt === "number" ? Date.now() - raw.startedAt : undefined;
    } catch {
      rmSync(timingPath, { force: true });
      return;
    }
  }
  return { storeToolTiming, consumeToolTiming };
}

// ../audit-core/src/cli/emit-event.mjs
import { randomUUID } from "node:crypto";

// ../audit-core/src/workos-client.mjs
import os2 from "node:os";
import path2 from "node:path";
import { execFileSync } from "node:child_process";
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { Entry } from "@napi-rs/keyring";
import { WorkOS } from "@workos-inc/node";
var DEFAULT_API_BASE_URL = "https://api.workos.com";
var DEFAULT_ORGANIZATION_NAME = "Audit Log Harness";
var USER_AGENT = "workos-audit-harness/1";
function parseJson2(text, fallback = {}) {
  if (!text || !text.trim())
    return fallback;
  return JSON.parse(text);
}
function getWorkosCommandPrefix() {
  const configured = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_BIN);
  if (configured)
    return [configured];
  try {
    const found = execFileSync("bash", ["-lc", "command -v workos"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (found)
      return [found];
  } catch {}
  return ["npx", "--yes", "workos@latest"];
}
function runWorkos(args, options = {}) {
  const [bin, ...prefixArgs] = getWorkosCommandPrefix();
  return execFileSync(bin, [...prefixArgs, ...args], {
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
    input: options.input,
    env: { ...process.env, NO_COLOR: "1" }
  });
}
function readWorkosCliConfig() {
  try {
    const raw = new Entry("workos-cli", "config").getPassword();
    if (raw)
      return JSON.parse(raw);
  } catch {}
  try {
    const filePath = path2.join(os2.homedir(), ".workos", "config.json");
    if (existsSync2(filePath))
      return JSON.parse(readFileSync2(filePath, "utf8"));
  } catch {}
  return null;
}
function getWorkosCliActiveEnvironment() {
  const cliConfig = readWorkosCliConfig();
  if (!cliConfig?.activeEnvironment)
    return;
  return cliConfig.environments?.[cliConfig.activeEnvironment];
}
function getEffectiveApiKey(config) {
  return config.apiKey || getWorkosCliActiveEnvironment()?.apiKey;
}
function createSdk(config) {
  const apiKey = getEffectiveApiKey(config);
  if (!apiKey)
    return;
  const url = new URL(config.apiBaseUrl || DEFAULT_API_BASE_URL);
  return new WorkOS(apiKey, {
    apiHostname: url.hostname,
    ...url.port ? { port: Number(url.port) } : {},
    ...url.protocol === "http:" ? { https: false } : {}
  });
}
function apiUrl(config, pathname) {
  return new URL(pathname, config.apiBaseUrl || DEFAULT_API_BASE_URL).toString();
}
function pickOrganizationId(value) {
  return value?.id || value?.data?.id || value?.organization?.id;
}
async function retry(operation, label, attempts = 3) {
  let lastError;
  for (let attempt = 1;attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts)
        break;
      const message = error.stderr?.toString?.().trim() || error.message || String(error);
      process.stderr.write(`Retrying ${label} after failure (${attempt}/${attempts}): ${message}
`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}
async function ensureOrganization(config) {
  if (config.organizationId)
    return config.organizationId;
  const name = config.organizationName || DEFAULT_ORGANIZATION_NAME;
  const workos = createSdk(config);
  if (workos) {
    const page = await retry(() => workos.organizations.listOrganizations({ limit: 100 }), "organization list");
    const existing2 = page.data?.find((organization) => organization.name === name);
    if (existing2?.id)
      return existing2.id;
    const created2 = await retry(() => workos.organizations.createOrganization({ name }), `organization create ${name}`);
    return created2.id;
  }
  const list = await retry(() => parseJson2(runWorkos(["organization", "list", "--json", "--mode", "agent"])), "organization list");
  const existing = list.data?.find((organization) => organization.name === name);
  if (existing?.id)
    return existing.id;
  const created = await retry(() => parseJson2(runWorkos(["organization", "create", name, "--json", "--mode", "agent"])), `organization create ${name}`);
  const id = pickOrganizationId(created);
  if (!id)
    throw new Error(`Created organization ${name}, but could not find its id in WorkOS CLI output.`);
  return id;
}

// ../audit-core/src/cli/emit-event.mjs
function toRestEvent(event) {
  const { occurredAt, occurred_at, context, actor, targets, ...rest } = event;
  const normalizedContext = context ? {
    location: context.location,
    user_agent: context.user_agent || context.userAgent
  } : undefined;
  return {
    ...rest,
    actor: actor ? { ...actor, metadata: actor.metadata || {} } : actor,
    targets: (targets || []).map((target) => ({ ...target, metadata: target.metadata || {} })),
    occurred_at: occurred_at || occurredAt || new Date().toISOString(),
    ...normalizedContext ? { context: normalizedContext } : {}
  };
}
async function emitEvent(event, config) {
  const orgId = await ensureOrganization(config);
  const effectiveApiKey = getEffectiveApiKey(config);
  if (effectiveApiKey) {
    const response = await fetch(apiUrl(config, "/audit_logs/events"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
        "User-Agent": USER_AGENT
      },
      body: JSON.stringify({ organization_id: orgId, event: toRestEvent(event) })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`WorkOS audit event failed: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ""}`);
    }
    return { ok: true, transport: "api-key", organizationId: orgId, action: event.action };
  }
  const occurredAt = event.occurredAt || event.occurred_at || new Date().toISOString();
  const context = event.context ? { location: event.context.location, user_agent: event.context.user_agent || event.context.userAgent } : { location: "unknown" };
  const args = [
    "audit-log",
    "create-event",
    orgId,
    "--action",
    event.action,
    "--actor-type",
    event.actor?.type || "user",
    "--actor-id",
    event.actor?.id || "unknown"
  ];
  if (event.actor?.name)
    args.push("--actor-name", event.actor.name);
  args.push("--occurred-at", new Date(occurredAt).toISOString(), "--targets", JSON.stringify(event.targets || []), "--context", JSON.stringify(context), "--metadata", JSON.stringify(event.metadata || {}), "--json", "--mode", "agent");
  runWorkos(args);
  return { ok: true, transport: "workos-cli", organizationId: orgId, action: event.action };
}

// ../audit-core/src/config.mjs
import os3 from "node:os";
import path3 from "node:path";
import { chmodSync, existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync3, rmSync as rmSync2, writeFileSync as writeFileSync2 } from "node:fs";
var CONFIG_KEYS = [
  "apiKey",
  "organizationId",
  "actionPrefix",
  "actorId",
  "actorType",
  "actorName",
  "location",
  "userAgent"
];
var BOOLEAN_CONFIG_KEYS = new Set(["recordingEnabled"]);
function parseBoolean(value) {
  if (typeof value === "boolean")
    return value;
  if (typeof value !== "string")
    return;
  const normalized = value.trim().toLowerCase();
  if (!normalized)
    return;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized))
    return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized))
    return false;
  return;
}
function createConfigLoader({
  configFilePathEnvs,
  defaultConfigDir,
  envKeyOrder,
  defaults
}) {
  function getConfigFilePath() {
    for (const name of configFilePathEnvs) {
      const value = trimToUndefined(process.env[name]);
      if (value)
        return value;
    }
    return path3.join(os3.homedir(), defaultConfigDir, "workos-audit", "config.json");
  }
  function readFileConfig() {
    const filePath = getConfigFilePath();
    if (!existsSync3(filePath))
      return {};
    try {
      const raw = JSON.parse(readFileSync3(filePath, "utf8"));
      if (!raw || typeof raw !== "object")
        return {};
      const config = {};
      for (const key of CONFIG_KEYS) {
        const value = trimToUndefined(raw[key]);
        if (value)
          config[key] = value;
      }
      for (const key of BOOLEAN_CONFIG_KEYS) {
        if (raw[key] !== undefined) {
          const parsed = parseBoolean(raw[key]);
          if (parsed !== undefined)
            config[key] = parsed;
        }
      }
      return config;
    } catch {
      return {};
    }
  }
  function writeFileConfig(config) {
    const filePath = getConfigFilePath();
    const sanitized = {};
    for (const key of CONFIG_KEYS) {
      const value = trimToUndefined(config[key]);
      if (value)
        sanitized[key] = value;
    }
    for (const key of BOOLEAN_CONFIG_KEYS) {
      if (config[key] !== undefined) {
        const parsed = parseBoolean(config[key]);
        if (parsed !== undefined)
          sanitized[key] = parsed;
      }
    }
    mkdirSync2(path3.dirname(filePath), { recursive: true, mode: 448 });
    writeFileSync2(filePath, `${JSON.stringify(sanitized, null, 2)}
`, { mode: 384 });
    chmodSync(filePath, 384);
    return filePath;
  }
  function clearFileConfig() {
    rmSync2(getConfigFilePath(), { force: true });
  }
  function lookupEnv(key) {
    const candidates = envKeyOrder[key] || [];
    for (const name of candidates) {
      const value = trimToUndefined(process.env[name]);
      if (value)
        return { value, source: name };
    }
    return { value: undefined, source: null };
  }
  function resolveKey(key, fileConfig, fallback) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value)
      return { value: fromEnv.value, source: fromEnv.source };
    if (fileConfig[key] !== undefined)
      return { value: fileConfig[key], source: "config_file" };
    if (fallback) {
      const fb = fallback();
      if (fb !== undefined)
        return { value: fb.value, source: fb.source || "default" };
    }
    return { value: undefined, source: null };
  }
  function resolveBooleanKey(key, fileConfig, defaultValue) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value !== undefined) {
      const parsed = parseBoolean(fromEnv.value);
      if (parsed !== undefined)
        return { value: parsed, source: fromEnv.source };
    }
    if (fileConfig[key] !== undefined) {
      return { value: fileConfig[key], source: "config_file" };
    }
    return { value: defaultValue, source: "default" };
  }
  function loadConfig() {
    const fileConfig = readFileConfig();
    const apiKey = resolveKey("apiKey", fileConfig);
    const organizationId = resolveKey("organizationId", fileConfig);
    const actionPrefix = resolveKey("actionPrefix", fileConfig, () => ({ value: defaults.actionPrefix, source: "default" }));
    const actorType = resolveKey("actorType", fileConfig, () => ({ value: defaults.actorType, source: "default" }));
    const actorId = resolveKey("actorId", fileConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      if (user)
        return { value: user, source: "os_user" };
      return { value: os3.hostname(), source: "hostname" };
    });
    const actorName = resolveKey("actorName", fileConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      return user ? { value: user, source: "os_user" } : undefined;
    });
    const location = resolveKey("location", fileConfig, () => ({ value: defaults.location, source: "default" }));
    const userAgent = resolveKey("userAgent", fileConfig, () => ({ value: defaults.userAgent, source: "default" }));
    const recordingEnabled = resolveBooleanKey("recordingEnabled", fileConfig, defaults.recordingEnabled ?? true);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      actionPrefix: actionPrefix.value,
      actorId: actorId.value,
      actorType: actorType.value,
      actorName: actorName.value,
      location: location.value,
      userAgent: userAgent.value,
      recordingEnabled: recordingEnabled.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source,
        actionPrefix: actionPrefix.source,
        actorId: actorId.source,
        actorType: actorType.source,
        actorName: actorName.source,
        location: location.source,
        userAgent: userAgent.source,
        recordingEnabled: recordingEnabled.source
      }
    };
  }
  function loadQueryConfig() {
    const fileConfig = readFileConfig();
    const apiKey = resolveKey("apiKey", fileConfig);
    const organizationId = resolveKey("organizationId", fileConfig);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source
      }
    };
  }
  return {
    getConfigFilePath,
    readFileConfig,
    writeFileConfig,
    clearFileConfig,
    loadConfig,
    loadQueryConfig
  };
}

// scripts/config-file.mjs
function claudePluginOptionEnvs(name) {
  return [
    `CLAUDE_PLUGIN_OPTION_${name}`,
    `CLAUDE_PLUGIN_OPTION_${name.toLowerCase()}`,
    `CLAUDE_PLUGIN_OPTION_${name.toUpperCase()}`
  ];
}
var configLoader = createConfigLoader({
  configFilePathEnvs: ["WORKOS_AUDIT_CONFIG_PATH", "CLAUDE_WORKOS_AUDIT_CONFIG_PATH"],
  defaultConfigDir: ".claude",
  envKeyOrder: {
    apiKey: ["WORKOS_API_KEY", ...claudePluginOptionEnvs("API_KEY")],
    organizationId: ["WORKOS_ORGANIZATION_ID", ...claudePluginOptionEnvs("ORGANIZATION_ID")],
    actionPrefix: ["WORKOS_ACTION_PREFIX", ...claudePluginOptionEnvs("ACTION_PREFIX")],
    actorId: ["WORKOS_ACTOR_ID", ...claudePluginOptionEnvs("ACTOR_ID")],
    actorType: ["WORKOS_ACTOR_TYPE", ...claudePluginOptionEnvs("ACTOR_TYPE")],
    actorName: ["WORKOS_ACTOR_NAME", ...claudePluginOptionEnvs("ACTOR_NAME")],
    location: ["WORKOS_LOCATION", ...claudePluginOptionEnvs("LOCATION")],
    userAgent: ["WORKOS_USER_AGENT", ...claudePluginOptionEnvs("USER_AGENT")],
    recordingEnabled: ["CLAUDE_WORKOS_AUDIT_RECORDING", "WORKOS_AUDIT_RECORDING", ...claudePluginOptionEnvs("RECORDING_ENABLED")]
  },
  defaults: {
    actionPrefix: "claude",
    actorType: "user",
    location: "claude-code",
    userAgent: "claude-code-workos-audit/1",
    recordingEnabled: true
  }
});

// scripts/emit-event.mjs
var EVENT_NAMES = new Set([
  "session-started",
  "session-ended",
  "prompt-submitted",
  "tool-called",
  "tool-completed",
  "tool-failed",
  "turn-completed",
  "turn-failed"
]);
var { storeToolTiming, consumeToolTiming } = createToolTimingStore({
  baseEnvNames: ["CLAUDE_PLUGIN_DATA"],
  fallbackDirName: "claude-workos-audit"
});
function emptyTokenUsage() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    totalTokens: 0,
    messageCount: 0
  };
}
function addTokenUsage(total, usage) {
  if (!usage || typeof usage !== "object")
    return;
  const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
  const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
  const cacheCreationInputTokens = typeof usage.cache_creation_input_tokens === "number" ? usage.cache_creation_input_tokens : 0;
  const cacheReadInputTokens = typeof usage.cache_read_input_tokens === "number" ? usage.cache_read_input_tokens : 0;
  total.inputTokens += inputTokens;
  total.outputTokens += outputTokens;
  total.cacheCreationInputTokens += cacheCreationInputTokens;
  total.cacheReadInputTokens += cacheReadInputTokens;
  total.totalTokens += inputTokens + outputTokens + cacheCreationInputTokens + cacheReadInputTokens;
  total.messageCount += 1;
}
function isHumanPromptEntry(entry) {
  if (!entry || entry.type !== "user" || entry.isMeta || entry.toolUseResult)
    return false;
  return typeof entry.message?.content === "string";
}
function getTranscriptTokenUsage(transcriptPath) {
  if (!transcriptPath || typeof transcriptPath !== "string" || !existsSync4(transcriptPath))
    return {};
  try {
    const session = emptyTokenUsage();
    let turn = emptyTokenUsage();
    const lines = readFileSync4(transcriptPath, "utf8").split(`
`);
    for (const line of lines) {
      if (!line.trim())
        continue;
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
      if (entry.type !== "assistant")
        continue;
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
      session_model_calls: session.messageCount > 0 ? session.messageCount : undefined
    });
  } catch {
    return {};
  }
}
function getCommandPreview(payload) {
  if (payload.tool_name !== "Bash")
    return;
  return truncateMetadataString(payload.tool_input?.command);
}
function isCommandTruncated(payload, maxLength = 500) {
  const command = payload.tool_name === "Bash" ? payload.tool_input?.command : undefined;
  return typeof command === "string" ? command.length > maxLength : undefined;
}
function buildTargets(kind, payload) {
  const sessionTarget = payload.session_id ? { id: payload.session_id, type: "session" } : undefined;
  if (!kind.startsWith("tool-"))
    return sessionTarget ? [sessionTarget] : [];
  const toolTarget = {
    id: payload.tool_use_id || `tool_${sha256({ tool_name: payload.tool_name, tool_input: payload.tool_input }).slice(0, 24)}`,
    type: "tool",
    metadata: compactMetadata({ tool_name: payload.tool_name })
  };
  return [sessionTarget, toolTarget].filter(Boolean);
}
function buildEvent(kind, payload, config) {
  const action = {
    "session-started": `${config.actionPrefix}.session.started`,
    "session-ended": `${config.actionPrefix}.session.ended`,
    "prompt-submitted": `${config.actionPrefix}.prompt.submitted`,
    "tool-called": `${config.actionPrefix}.tool.called`,
    "tool-completed": `${config.actionPrefix}.tool.completed`,
    "tool-failed": `${config.actionPrefix}.tool.failed`,
    "turn-completed": `${config.actionPrefix}.turn.completed`,
    "turn-failed": `${config.actionPrefix}.turn.failed`
  }[kind];
  let metadata = {};
  if (kind === "session-started") {
    metadata = compactMetadata({
      source: payload.source,
      cwd: payload.cwd,
      transcript_path: payload.transcript_path,
      permission_mode: payload.permission_mode
    });
  } else if (kind === "session-ended") {
    metadata = compactMetadata({
      reason: payload.reason,
      cwd: payload.cwd,
      transcript_path: payload.transcript_path,
      permission_mode: payload.permission_mode,
      ...getTranscriptTokenUsage(payload.transcript_path)
    });
  } else if (kind === "prompt-submitted") {
    metadata = compactMetadata({
      prompt_length: typeof payload.prompt === "string" ? payload.prompt.length : undefined,
      prompt_sha256: typeof payload.prompt === "string" ? sha256(payload.prompt) : undefined,
      prompt_preview: typeof payload.prompt === "string" ? truncateMetadataString(payload.prompt) : undefined,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode
    });
  } else if (kind === "tool-called") {
    storeToolTiming(payload);
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      tool_input_sha256: sha256(payload.tool_input),
      tool_input_bytes: byteLength(payload.tool_input),
      command_preview: getCommandPreview(payload),
      command_truncated: isCommandTruncated(payload),
      blocked: false,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode
    });
  } else if (kind === "tool-completed") {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      duration_ms: consumeToolTiming(payload),
      is_error: false,
      result_sha256: sha256(payload.tool_response),
      result_bytes: byteLength(payload.tool_response),
      cwd: payload.cwd,
      permission_mode: payload.permission_mode
    });
  } else if (kind === "tool-failed") {
    metadata = compactMetadata({
      tool_name: payload.tool_name,
      duration_ms: consumeToolTiming(payload),
      is_error: true,
      error_preview: truncateMetadataString(payload.error),
      error_sha256: typeof payload.error === "string" ? sha256(payload.error) : undefined,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode
    });
  } else if (kind === "turn-completed") {
    metadata = compactMetadata({
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
      ...getTranscriptTokenUsage(payload.transcript_path)
    });
  } else if (kind === "turn-failed") {
    metadata = compactMetadata({
      error_type: payload.error_type || payload.reason,
      cwd: payload.cwd,
      permission_mode: payload.permission_mode,
      ...getTranscriptTokenUsage(payload.transcript_path)
    });
  }
  return {
    action,
    occurred_at: new Date().toISOString(),
    actor: {
      id: config.actorId,
      type: config.actorType,
      ...config.actorName ? { name: config.actorName } : {},
      metadata: {}
    },
    targets: buildTargets(kind, payload),
    context: {
      location: config.location,
      user_agent: config.userAgent
    },
    metadata
  };
}
async function main() {
  const kind = process.argv[2];
  if (!EVENT_NAMES.has(kind)) {
    console.error(`Unknown event kind: ${kind || "(missing)"}`);
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
