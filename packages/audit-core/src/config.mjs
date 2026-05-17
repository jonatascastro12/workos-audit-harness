import os from 'node:os';
import path from 'node:path';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { trimToUndefined } from './util.mjs';

const CONFIG_KEYS = [
  'apiKey',
  'organizationId',
  'actionPrefix',
  'actorId',
  'actorType',
  'actorName',
  'location',
  'userAgent',
];

const BOOLEAN_CONFIG_KEYS = new Set(['recordingEnabled']);

const QUERY_CONFIG_KEYS = ['apiKey', 'organizationId'];

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return undefined;
}

export function createConfigLoader({
  configFilePathEnvs,
  defaultConfigDir,
  envKeyOrder,
  defaults,
}) {
  function getConfigFilePath() {
    for (const name of configFilePathEnvs) {
      const value = trimToUndefined(process.env[name]);
      if (value) return value;
    }
    return path.join(os.homedir(), defaultConfigDir, 'workos-audit', 'config.json');
  }

  function readFileConfig() {
    const filePath = getConfigFilePath();
    if (!existsSync(filePath)) return {};

    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf8'));
      if (!raw || typeof raw !== 'object') return {};

      const config = {};
      for (const key of CONFIG_KEYS) {
        const value = trimToUndefined(raw[key]);
        if (value) config[key] = value;
      }
      for (const key of BOOLEAN_CONFIG_KEYS) {
        if (raw[key] !== undefined) {
          const parsed = parseBoolean(raw[key]);
          if (parsed !== undefined) config[key] = parsed;
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
      if (value) sanitized[key] = value;
    }
    for (const key of BOOLEAN_CONFIG_KEYS) {
      if (config[key] !== undefined) {
        const parsed = parseBoolean(config[key]);
        if (parsed !== undefined) sanitized[key] = parsed;
      }
    }
    mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
    writeFileSync(filePath, `${JSON.stringify(sanitized, null, 2)}\n`, { mode: 0o600 });
    chmodSync(filePath, 0o600);
    return filePath;
  }

  function clearFileConfig() {
    rmSync(getConfigFilePath(), { force: true });
  }

  function lookupEnv(key) {
    const candidates = envKeyOrder[key] || [];
    for (const name of candidates) {
      const value = trimToUndefined(process.env[name]);
      if (value) return { value, source: name };
    }
    return { value: undefined, source: null };
  }

  function resolveKey(key, fileConfig, fallback) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value) return { value: fromEnv.value, source: fromEnv.source };
    if (fileConfig[key] !== undefined) return { value: fileConfig[key], source: 'config_file' };
    if (fallback) {
      const fb = fallback();
      if (fb !== undefined) return { value: fb.value, source: fb.source || 'default' };
    }
    return { value: undefined, source: null };
  }

  function resolveBooleanKey(key, fileConfig, defaultValue) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value !== undefined) {
      const parsed = parseBoolean(fromEnv.value);
      if (parsed !== undefined) return { value: parsed, source: fromEnv.source };
    }
    if (fileConfig[key] !== undefined) {
      return { value: fileConfig[key], source: 'config_file' };
    }
    return { value: defaultValue, source: 'default' };
  }

  function loadConfig() {
    const fileConfig = readFileConfig();

    const apiKey = resolveKey('apiKey', fileConfig);
    const organizationId = resolveKey('organizationId', fileConfig);
    const actionPrefix = resolveKey('actionPrefix', fileConfig, () => ({ value: defaults.actionPrefix, source: 'default' }));
    const actorType = resolveKey('actorType', fileConfig, () => ({ value: defaults.actorType, source: 'default' }));
    const actorId = resolveKey('actorId', fileConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      if (user) return { value: user, source: 'os_user' };
      return { value: os.hostname(), source: 'hostname' };
    });
    const actorName = resolveKey('actorName', fileConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      return user ? { value: user, source: 'os_user' } : undefined;
    });
    const location = resolveKey('location', fileConfig, () => ({ value: defaults.location, source: 'default' }));
    const userAgent = resolveKey('userAgent', fileConfig, () => ({ value: defaults.userAgent, source: 'default' }));
    const recordingEnabled = resolveBooleanKey('recordingEnabled', fileConfig, defaults.recordingEnabled ?? true);

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
        recordingEnabled: recordingEnabled.source,
      },
    };
  }

  function loadQueryConfig() {
    const fileConfig = readFileConfig();
    const apiKey = resolveKey('apiKey', fileConfig);
    const organizationId = resolveKey('organizationId', fileConfig);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source,
      },
    };
  }

  return {
    getConfigFilePath,
    readFileConfig,
    writeFileConfig,
    clearFileConfig,
    loadConfig,
    loadQueryConfig,
  };
}

export { QUERY_CONFIG_KEYS, BOOLEAN_CONFIG_KEYS };
