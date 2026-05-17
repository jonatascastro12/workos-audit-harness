import os from 'node:os';
import path from 'node:path';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

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

export function trimToUndefined(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function maskSecret(value) {
  if (!value) return undefined;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function getConfigFilePath() {
  return trimToUndefined(process.env.WORKOS_AUDIT_CONFIG_PATH)
    || trimToUndefined(process.env.CLAUDE_WORKOS_AUDIT_CONFIG_PATH)
    || path.join(os.homedir(), '.claude', 'workos-audit', 'config.json');
}

export function readFileConfig() {
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
    return config;
  } catch {
    return {};
  }
}

export function writeFileConfig(config) {
  const filePath = getConfigFilePath();
  const sanitized = {};

  for (const key of CONFIG_KEYS) {
    const value = trimToUndefined(config[key]);
    if (value) sanitized[key] = value;
  }

  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  writeFileSync(filePath, `${JSON.stringify(sanitized, null, 2)}\n`, { mode: 0o600 });
  chmodSync(filePath, 0o600);
  return filePath;
}

export function clearFileConfig() {
  rmSync(getConfigFilePath(), { force: true });
}
