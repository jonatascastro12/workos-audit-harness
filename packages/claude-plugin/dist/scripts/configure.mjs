#!/usr/bin/env node

// scripts/configure.mjs
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

// ../audit-core/src/config.mjs
import os from "node:os";
import path from "node:path";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

// ../audit-core/src/util.mjs
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function maskSecret(value) {
  if (!value)
    return;
  if (value.length <= 8)
    return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

// ../audit-core/src/config.mjs
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
var {
  getConfigFilePath,
  readFileConfig,
  writeFileConfig,
  clearFileConfig,
  loadConfig
} = configLoader;

// scripts/configure.mjs
function usage() {
  console.log(`Usage: node scripts/configure.mjs [--show|--clear]

Prompts for WorkOS Audit plugin configuration and writes it to:
  ${getConfigFilePath()}

Do not pass secrets as command-line arguments.`);
}
function showConfig() {
  const config = readFileConfig();
  console.log(JSON.stringify({
    configPath: getConfigFilePath(),
    configured: true,
    credentialSource: config.apiKey ? "api-key" : "workos-cli",
    organizationResolution: config.organizationId ? "explicit" : "auto-find-or-create Audit Log Harness",
    apiKey: maskSecret(config.apiKey),
    organizationId: config.organizationId || null,
    actionPrefix: config.actionPrefix || "claude",
    actorId: config.actorId || null,
    actorType: config.actorType || "user",
    actorName: config.actorName || null,
    location: config.location || "claude-code",
    userAgent: config.userAgent || "claude-code-workos-audit/1",
    recordingEnabled: config.recordingEnabled !== false
  }, null, 2));
}
async function hiddenQuestion(rl, prompt, existingValue) {
  if (existingValue) {
    const keep = await rl.question(`${prompt} [currently ${maskSecret(existingValue)}; press Enter to keep]: `);
    if (!keep.trim())
      return existingValue;
    return keep.trim();
  }
  output.write(prompt);
  const canDisableEcho = input.isTTY && output.isTTY;
  if (canDisableEcho)
    spawnSync("stty", ["-echo"], { stdio: "inherit" });
  try {
    const answer = await rl.question("");
    output.write(`
`);
    return answer.trim();
  } finally {
    if (canDisableEcho)
      spawnSync("stty", ["echo"], { stdio: "inherit" });
  }
}
async function optionalQuestion(rl, prompt, existingValue, fallback) {
  const suffix = existingValue ? ` [currently ${existingValue}; press Enter to keep]` : fallback ? ` [default ${fallback}]` : " [optional]";
  const answer = await rl.question(`${prompt}${suffix}: `);
  return trimToUndefined(answer) || existingValue || fallback;
}
async function booleanQuestion(rl, prompt, existingValue, defaultValue) {
  const current = existingValue === undefined ? defaultValue : existingValue;
  const hint = current ? "Y/n" : "y/N";
  const answer = (await rl.question(`${prompt} [${hint}]: `)).trim().toLowerCase();
  if (!answer)
    return current;
  if (["y", "yes", "1", "true", "on"].includes(answer))
    return true;
  if (["n", "no", "0", "false", "off"].includes(answer))
    return false;
  return current;
}
async function configure() {
  const current = readFileConfig();
  const rl = readline.createInterface({ input, output });
  try {
    console.log("Configure WorkOS Audit for Claude Code");
    console.log(`Config file: ${getConfigFilePath()}`);
    console.log("The API key prompt does not echo input. Leave it blank to use `workos auth login` / the active WorkOS CLI environment.");
    console.log("");
    const apiKey = await hiddenQuestion(rl, "WorkOS API key (sk_..., optional): ", current.apiKey);
    const organizationId = await optionalQuestion(rl, "WorkOS organization ID (org_..., optional; blank uses/creates Audit Log Harness)", current.organizationId);
    const recordingEnabled = await booleanQuestion(rl, "Record audit events from this Claude Code install? (turn off for query-only)", current.recordingEnabled, true);
    const actionPrefix = await optionalQuestion(rl, "Action prefix", current.actionPrefix, "claude");
    const actorId = await optionalQuestion(rl, "Actor ID override", current.actorId);
    const actorType = await optionalQuestion(rl, "Actor type", current.actorType, "user");
    const actorName = await optionalQuestion(rl, "Actor name override", current.actorName);
    const location = await optionalQuestion(rl, "Location", current.location, "claude-code");
    const userAgent = await optionalQuestion(rl, "User agent", current.userAgent, "claude-code-workos-audit/1");
    const filePath = writeFileConfig({
      ...apiKey ? { apiKey } : {},
      ...organizationId ? { organizationId } : {},
      actionPrefix,
      actorId,
      actorType,
      actorName,
      location,
      userAgent,
      recordingEnabled
    });
    console.log(`
Saved WorkOS Audit config to ${filePath}`);
    console.log("Restart Claude Code so hooks and MCP servers reload the configuration.");
  } finally {
    rl.close();
  }
}
var args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
} else if (args.includes("--show")) {
  showConfig();
} else if (args.includes("--clear")) {
  clearFileConfig();
  console.log(`Removed ${getConfigFilePath()}`);
} else {
  await configure();
}
