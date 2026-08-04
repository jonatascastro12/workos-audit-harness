// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
// importing externalized native deps (e.g. @napi-rs/keyring). The marketplace
// install copies files only; this is the cheapest place to bootstrap deps so
// hooks can run on a fresh install.
import { existsSync as __preflightExists } from 'node:fs';
import { execFileSync as __preflightExec } from 'node:child_process';
import { fileURLToPath as __preflightFileURL } from 'node:url';
import { createRequire as __preflightRequire } from 'node:module';
import __preflightPath from 'node:path';
(function __ensurePluginDeps() {
  try {
    const here = __preflightPath.dirname(__preflightFileURL(import.meta.url));
    let pluginRoot = here;
    for (let i = 0; i < 4; i += 1) {
      if (__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) break;
      pluginRoot = __preflightPath.resolve(pluginRoot, '..');
    }
    const __pkg = __preflightPath.join(pluginRoot, 'package.json');
    if (!__preflightExists(__pkg)) return;
    // Ask Node whether the dep RESOLVES, rather than testing one hardcoded path.
    // The old check was existsSync(pluginRoot/node_modules/@napi-rs/keyring),
    // which npm workspace hoisting makes permanently false — the package lands in
    // the ROOT node_modules. Every hook therefore re-ran `npm install` (~620ms
    // measured) before doing any work, on every single event.
    try {
      __preflightRequire(__pkg).resolve('@napi-rs/keyring');
      return;
    } catch {
      // Genuinely absent — fall through and install it once.
    }
    __preflightExec('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
      cwd: pluginRoot,
      stdio: 'ignore',
      timeout: 90_000,
    });
  } catch {
    // Best-effort: callers fall back to no-keyring mode if install fails.
  }
})();

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
  "userAgent",
  "proxyUrl"
];
var BOOLEAN_CONFIG_KEYS = new Set(["recordingEnabled"]);
function getManagedConfigPath() {
  const override = trimToUndefined(process.env.WORKOS_AUDIT_MANAGED_CONFIG_PATH);
  if (override)
    return override;
  if (process.platform === "win32") {
    return path.join(process.env.PROGRAMDATA || "C:\\ProgramData", "workos-audit", "config.json");
  }
  if (process.platform === "darwin") {
    return "/Library/Application Support/workos-audit/config.json";
  }
  return "/etc/workos-audit/config.json";
}
function sanitizeRawConfig(raw) {
  if (!raw || typeof raw !== "object")
    return {};
  const config = {};
  for (const key of CONFIG_KEYS) {
    if (key === "proxyUrl" && Object.hasOwn(raw, key) && raw[key] === null) {
      config[key] = null;
      continue;
    }
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
}
function readManagedConfig() {
  const filePath = getManagedConfigPath();
  if (!existsSync(filePath))
    return {};
  try {
    return sanitizeRawConfig(JSON.parse(readFileSync(filePath, "utf8")));
  } catch {
    return {};
  }
}
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
      return sanitizeRawConfig(JSON.parse(readFileSync(filePath, "utf8")));
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
  function resolveKey(key, fileConfig, managedConfig, fallback) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value)
      return { value: fromEnv.value, source: fromEnv.source };
    if (fileConfig[key] !== undefined)
      return { value: fileConfig[key], source: "config_file" };
    if (managedConfig[key] !== undefined)
      return { value: managedConfig[key], source: "managed_config" };
    if (fallback) {
      const fb = fallback();
      if (fb !== undefined)
        return { value: fb.value, source: fb.source || "default" };
    }
    return { value: undefined, source: null };
  }
  function resolveBooleanKey(key, fileConfig, managedConfig, defaultValue) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value !== undefined) {
      const parsed = parseBoolean(fromEnv.value);
      if (parsed !== undefined)
        return { value: parsed, source: fromEnv.source };
    }
    if (fileConfig[key] !== undefined) {
      return { value: fileConfig[key], source: "config_file" };
    }
    if (managedConfig[key] !== undefined) {
      return { value: managedConfig[key], source: "managed_config" };
    }
    return { value: defaultValue, source: "default" };
  }
  function loadConfig() {
    const fileConfig = readFileConfig();
    const managedConfig = readManagedConfig();
    const apiKey = resolveKey("apiKey", fileConfig, managedConfig);
    const organizationId = resolveKey("organizationId", fileConfig, managedConfig);
    const actionPrefix = resolveKey("actionPrefix", fileConfig, managedConfig, () => ({ value: defaults.actionPrefix, source: "default" }));
    const actorType = resolveKey("actorType", fileConfig, managedConfig, () => ({ value: defaults.actorType, source: "default" }));
    const actorId = resolveKey("actorId", fileConfig, managedConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      if (user)
        return { value: user, source: "os_user" };
      return { value: os.hostname(), source: "hostname" };
    });
    const actorName = resolveKey("actorName", fileConfig, managedConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      return user ? { value: user, source: "os_user" } : undefined;
    });
    const location = resolveKey("location", fileConfig, managedConfig, () => ({ value: defaults.location, source: "default" }));
    const userAgent = resolveKey("userAgent", fileConfig, managedConfig, () => ({ value: defaults.userAgent, source: "default" }));
    const proxyUrl = resolveKey("proxyUrl", fileConfig, managedConfig, () => defaults.proxyUrl ? { value: defaults.proxyUrl, source: "default" } : undefined);
    const recordingEnabled = resolveBooleanKey("recordingEnabled", fileConfig, managedConfig, defaults.recordingEnabled ?? true);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      actionPrefix: actionPrefix.value,
      actorId: actorId.value,
      actorType: actorType.value,
      actorName: actorName.value,
      location: location.value,
      userAgent: userAgent.value,
      proxyUrl: proxyUrl.value,
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
        proxyUrl: proxyUrl.source,
        recordingEnabled: recordingEnabled.source
      }
    };
  }
  function loadQueryConfig() {
    const fileConfig = readFileConfig();
    const managedConfig = readManagedConfig();
    const apiKey = resolveKey("apiKey", fileConfig, managedConfig);
    const organizationId = resolveKey("organizationId", fileConfig, managedConfig);
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
var configLoader = createConfigLoader({
  configFilePathEnvs: ["WORKOS_AUDIT_CONFIG_PATH", "OPENCLAW_WORKOS_AUDIT_CONFIG_PATH"],
  defaultConfigDir: ".openclaw",
  envKeyOrder: {
    apiKey: ["OPENCLAW_WORKOS_AUDIT_API_KEY", "WORKOS_API_KEY"],
    organizationId: ["OPENCLAW_WORKOS_AUDIT_ORGANIZATION_ID", "WORKOS_ORGANIZATION_ID"],
    actionPrefix: ["OPENCLAW_WORKOS_AUDIT_ACTION_PREFIX", "WORKOS_ACTION_PREFIX"],
    actorId: ["OPENCLAW_WORKOS_AUDIT_ACTOR_ID", "WORKOS_ACTOR_ID"],
    actorType: ["OPENCLAW_WORKOS_AUDIT_ACTOR_TYPE", "WORKOS_ACTOR_TYPE"],
    actorName: ["OPENCLAW_WORKOS_AUDIT_ACTOR_NAME", "WORKOS_ACTOR_NAME"],
    location: ["OPENCLAW_WORKOS_AUDIT_LOCATION", "WORKOS_LOCATION"],
    userAgent: ["OPENCLAW_WORKOS_AUDIT_USER_AGENT", "WORKOS_USER_AGENT"],
    proxyUrl: ["OPENCLAW_WORKOS_AUDIT_PROXY_URL", "WORKOS_AUDIT_PROXY_URL"],
    recordingEnabled: ["OPENCLAW_WORKOS_AUDIT_RECORDING", "WORKOS_AUDIT_RECORDING"]
  },
  defaults: {
    actionPrefix: "openclaw",
    actorType: "user",
    location: "openclaw",
    userAgent: "openclaw-workos-audit/1",
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
export {
  writeFileConfig,
  trimToUndefined,
  readFileConfig,
  maskSecret,
  loadConfig,
  getConfigFilePath,
  configLoader,
  clearFileConfig
};
