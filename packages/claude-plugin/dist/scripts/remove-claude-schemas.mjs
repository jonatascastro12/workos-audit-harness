// ../audit-core/src/schema-cli.mjs
import { WorkOS } from "@workos-inc/node";

// ../audit-core/src/util.mjs
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}

// ../audit-core/src/schema-cli.mjs
function parsePrefixArg(defaultPrefix) {
  const arg = process.argv.find((a) => a.startsWith("--prefix="));
  return arg ? arg.slice("--prefix=".length) : defaultPrefix;
}
function resolveApiKey(configLoader) {
  const fileConfig = configLoader?.readFileConfig?.() || {};
  return trimToUndefined(process.env.WORKOS_API_KEY) || fileConfig.apiKey;
}
async function listSchemaVersions(apiKey, action) {
  if (!apiKey)
    return;
  const versions = [];
  let after;
  do {
    const url = new URL(`https://api.workos.com/audit_logs/actions/${encodeURIComponent(action)}/schemas`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("order", "desc");
    if (after)
      url.searchParams.set("after", after);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (response.status === 404)
      return [];
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Failed to list schemas for ${action}: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ""}`);
    }
    const page = await response.json();
    versions.push(...(page.data || []).map((schema) => schema.version));
    after = page.list_metadata?.after || page.listMetadata?.after;
  } while (after);
  return versions;
}
async function runRemoveSchemas({ getSchemas, defaultPrefix, configLoader, label }) {
  const apiKey = resolveApiKey(configLoader);
  const dryRun = process.argv.includes("--dry-run");
  const prefix = parsePrefixArg(defaultPrefix);
  const schemas = getSchemas(prefix);
  const actions = schemas.map((schema) => schema.action);
  console.log(`${label || defaultPrefix} WorkOS audit schema removal plan for prefix "${prefix}":`);
  let foundCount = 0;
  for (const action of actions) {
    const versions = await listSchemaVersions(apiKey, action);
    if (!versions) {
      console.log(`- ${action}`);
      continue;
    }
    foundCount += versions.length;
    const versionText = versions.length > 0 ? `schema version(s): ${versions.join(", ")}` : "no schemas found";
    console.log(`- ${action}: ${versionText}`);
  }
  if (!apiKey) {
    console.error(`
Missing WORKOS_API_KEY and no apiKey found in the plugin config file. Set one to inspect existing schema versions.`);
    process.exit(dryRun ? 0 : 1);
  }
  console.error([
    "",
    "No schemas were removed.",
    "WorkOS currently documents create/list endpoints for Audit Log schemas, but not a public delete endpoint.",
    "The known public DELETE candidates return 404, so this script refuses to pretend removal succeeded.",
    foundCount > 0 ? "Remove these schemas/actions manually in the WorkOS Dashboard, or update this script if WorkOS adds a supported delete endpoint." : "No matching schemas were found for this prefix."
  ].join(`
`));
  process.exit(dryRun || foundCount === 0 ? 0 : 1);
}

// ../audit-core/src/config.mjs
import os from "node:os";
import path from "node:path";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    return path.join(os.homedir(), defaultConfigDir, "workos-audit", "config.json");
  }
  function readFileConfig() {
    const filePath = getConfigFilePath();
    if (!existsSync(filePath))
      return {};
    try {
      const raw = JSON.parse(readFileSync(filePath, "utf8"));
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
    mkdirSync(path.dirname(filePath), { recursive: true, mode: 448 });
    writeFileSync(filePath, `${JSON.stringify(sanitized, null, 2)}
`, { mode: 384 });
    chmodSync(filePath, 384);
    return filePath;
  }
  function clearFileConfig() {
    rmSync(getConfigFilePath(), { force: true });
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
      return { value: os.hostname(), source: "hostname" };
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

// scripts/claude-audit-schemas.mjs
var TOKEN_METADATA = {
  turn_input_tokens: "number",
  turn_output_tokens: "number",
  turn_cache_creation_input_tokens: "number",
  turn_cache_read_input_tokens: "number",
  turn_total_tokens: "number",
  turn_model_calls: "number",
  session_input_tokens: "number",
  session_output_tokens: "number",
  session_cache_creation_input_tokens: "number",
  session_cache_read_input_tokens: "number",
  session_total_tokens: "number",
  session_model_calls: "number"
};
function getClaudeAuditSchemaDefinitions(prefix = "claude") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Claude Code session start / resume events.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        cwd: "string",
        transcript_path: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.session.ended`,
      note: "Claude Code session termination events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        cwd: "string",
        transcript_path: "string",
        permission_mode: "string",
        ...TOKEN_METADATA
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "User prompt submission before Claude processes it.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        prompt_preview: "string",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before a Claude tool call executes.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After a Claude tool call succeeds.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "After a Claude tool call fails.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        duration_ms: "number",
        is_error: "boolean",
        error_preview: "string",
        error_sha256: "string",
        cwd: "string",
        permission_mode: "string"
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Claude finished a response turn.",
      targets: [{ type: "session" }],
      metadata: {
        cwd: "string",
        permission_mode: "string",
        ...TOKEN_METADATA
      }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "Claude turn ended with an API/runtime failure.",
      targets: [{ type: "session" }],
      metadata: {
        error_type: "string",
        cwd: "string",
        permission_mode: "string",
        ...TOKEN_METADATA
      }
    }
  ];
}

// scripts/remove-claude-schemas.mjs
await runRemoveSchemas({
  getSchemas: getClaudeAuditSchemaDefinitions,
  defaultPrefix: "claude",
  configLoader,
  label: "Claude"
});
