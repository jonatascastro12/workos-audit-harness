import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { Entry } from '@napi-rs/keyring';
import { WorkOS } from '@workos-inc/node';
import { trimToUndefined } from './util.mjs';

export const DEFAULT_API_BASE_URL = 'https://api.workos.com';
export const DEFAULT_ORGANIZATION_NAME = 'Audit Log Harness';
export const USER_AGENT = 'workos-audit-harness/1';

export function parseJson(text, fallback = {}) {
  if (!text || !text.trim()) return fallback;
  return JSON.parse(text);
}

export function getWorkosCommandPrefix() {
  const configured = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_BIN);
  if (configured) return [configured];
  try {
    const found = execFileSync('bash', ['-lc', 'command -v workos'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (found) return [found];
  } catch {
    // Fall through to npx. npx installs/downloads the WorkOS CLI package when absent.
  }
  return ['npx', '--yes', 'workos@latest'];
}

export function runWorkos(args, options = {}) {
  const [bin, ...prefixArgs] = getWorkosCommandPrefix();
  return execFileSync(bin, [...prefixArgs, ...args], {
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    input: options.input,
    env: { ...process.env, NO_COLOR: '1' },
  });
}

export function readWorkosCliConfig() {
  try {
    const raw = new Entry('workos-cli', 'config').getPassword();
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall back to the WorkOS CLI insecure-storage file when keyring is unavailable.
  }
  try {
    const filePath = path.join(os.homedir(), '.workos', 'config.json');
    if (existsSync(filePath)) return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    // No usable WorkOS CLI config.
  }
  return null;
}

export function getWorkosCliActiveEnvironment() {
  const cliConfig = readWorkosCliConfig();
  if (!cliConfig?.activeEnvironment) return undefined;
  return cliConfig.environments?.[cliConfig.activeEnvironment];
}

export function getEffectiveApiKey(config) {
  return config.apiKey || getWorkosCliActiveEnvironment()?.apiKey;
}

export function createSdk(config) {
  const apiKey = getEffectiveApiKey(config);
  if (!apiKey) return undefined;
  const url = new URL(config.apiBaseUrl || DEFAULT_API_BASE_URL);
  return new WorkOS(apiKey, {
    apiHostname: url.hostname,
    ...(url.port ? { port: Number(url.port) } : {}),
    ...(url.protocol === 'http:' ? { https: false } : {}),
  });
}

export function apiUrl(config, pathname) {
  return new URL(pathname, config.apiBaseUrl || DEFAULT_API_BASE_URL).toString();
}

export function pickOrganizationId(value) {
  return value?.id || value?.data?.id || value?.organization?.id;
}

export async function retry(operation, label, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const message = error.stderr?.toString?.().trim() || error.message || String(error);
      process.stderr.write(`Retrying ${label} after failure (${attempt}/${attempts}): ${message}\n`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

export async function ensureOrganization(config) {
  if (config.organizationId) return config.organizationId;
  const name = config.organizationName || DEFAULT_ORGANIZATION_NAME;
  const workos = createSdk(config);

  if (workos) {
    const page = await retry(
      () => workos.organizations.listOrganizations({ limit: 100 }),
      'organization list',
    );
    const existing = page.data?.find((organization) => organization.name === name);
    if (existing?.id) return existing.id;
    const created = await retry(
      () => workos.organizations.createOrganization({ name }),
      `organization create ${name}`,
    );
    return created.id;
  }

  const list = await retry(
    () => parseJson(runWorkos(['organization', 'list', '--json', '--mode', 'agent'])),
    'organization list',
  );
  const existing = list.data?.find((organization) => organization.name === name);
  if (existing?.id) return existing.id;

  const created = await retry(
    () => parseJson(runWorkos(['organization', 'create', name, '--json', '--mode', 'agent'])),
    `organization create ${name}`,
  );
  const id = pickOrganizationId(created);
  if (!id) throw new Error(`Created organization ${name}, but could not find its id in WorkOS CLI output.`);
  return id;
}
