import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { WorkOS } from '@workos-inc/node';
import { trimToUndefined } from './util.mjs';

const requireFromHere = createRequire(import.meta.url);
let cachedKeyringEntry = null;
function loadKeyringEntry() {
  if (cachedKeyringEntry !== null) return cachedKeyringEntry;
  try {
    cachedKeyringEntry = requireFromHere('@napi-rs/keyring').Entry;
  } catch {
    cachedKeyringEntry = undefined;
  }
  return cachedKeyringEntry;
}

export const DEFAULT_API_BASE_URL = 'https://api.workos.com';
export const DEFAULT_ORGANIZATION_NAME = 'Audit Log Harness';
export const USER_AGENT = 'workos-audit-harness/1';

// Pinned WorkOS CLI version. The harness leans on the CLI for auth and for
// unclaimed-environment provisioning, whose `/x/` backend contract carries no
// compatibility promise — `@latest` would let that contract drift under us at
// a stranger's first run. Keep in sync with WORKOS_CLI_SPEC in
// packages/installer/bin.mjs.
export const WORKOS_CLI_VERSION = '0.21.0';

export function getWorkosCliSpec() {
  const override = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_VERSION);
  return `workos@${override || WORKOS_CLI_VERSION}`;
}

// The invocation shown to humans in remediation messages.
export function workosCliInvocation() {
  return `npx -y ${getWorkosCliSpec()}`;
}

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
  return ['npx', '--yes', getWorkosCliSpec()];
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
  const Entry = loadKeyringEntry();
  if (Entry) {
    try {
      const raw = new Entry('workos-cli', 'config').getPassword();
      if (raw) return JSON.parse(raw);
    } catch {
      // Fall back to the WorkOS CLI insecure-storage file when keyring is unavailable.
    }
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
  if (!cliConfig) return undefined;
  if (cliConfig.activeEnvironment && cliConfig.environments?.[cliConfig.activeEnvironment]) {
    return cliConfig.environments[cliConfig.activeEnvironment];
  }
  // Bootstrap key written by older `workos auth login` flows lives at the top level.
  // Treat it as the active env so callers without keyring access can still emit events.
  if (cliConfig.workosApiKey) return { apiKey: cliConfig.workosApiKey };
  return undefined;
}

// An unclaimed environment was minted without an account (`workos env
// provision`) and has no owner until `workos env claim` links it to one.
// Surfacing this everywhere credentials are reported is what keeps an
// anonymous environment from quietly becoming someone's production audit log
// destination.
export function isUnclaimedEnvironment(env) {
  return Boolean(env && (env.type === 'unclaimed' || env.claimToken));
}

export function summarizeWorkosCliAuth() {
  const cliConfig = readWorkosCliConfig();
  if (!cliConfig) {
    return {
      loggedIn: false,
      activeEnvironment: null,
      remediation: `Run \`${workosCliInvocation()} auth login\` to sign in to the WorkOS CLI.`,
    };
  }
  const activeName = cliConfig.activeEnvironment || null;
  const activeEnv = activeName ? cliConfig.environments?.[activeName] : undefined;
  const hasApiKey = Boolean(activeEnv?.apiKey || cliConfig.workosApiKey);
  if (!hasApiKey) {
    return {
      loggedIn: false,
      activeEnvironment: activeName,
      remediation: `A WorkOS CLI config exists but no active environment has an API key. Run \`${workosCliInvocation()} auth login\`.`,
    };
  }
  const unclaimed = isUnclaimedEnvironment(activeEnv);
  return {
    loggedIn: true,
    activeEnvironment: activeName,
    environments: Object.keys(cliConfig.environments || {}),
    activeEnvironmentUnclaimed: unclaimed,
    ...(unclaimed && {
      remediation: `The active WorkOS environment is unclaimed (no owner). Run \`${workosCliInvocation()} env claim\` to link it to your account and keep its data.`,
    }),
  };
}

export function getEffectiveApiKey(config) {
  return config.apiKey || getWorkosCliActiveEnvironment()?.apiKey;
}

// Parse the `workos env provision --json` success envelope:
//   {"status":"ok","message":"Environment provisioned","data":{name,type,
//    active,apiKey,clientId,claimToken,authkitDomain}}
// Returns ONLY non-secret metadata. The claim token — a bearer credential
// that can take over the environment — and the API key stay out of the
// return value on purpose: the CLI has already persisted both in its own
// config store (keyring), and the key is picked up through the normal
// resolution path (getWorkosCliActiveEnvironment). Errors never echo the
// output for the same reason.
export function parseProvisionOutput(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error('Unexpected output from `workos env provision --json`.');
  }
  const data = parsed?.data;
  if (parsed?.status !== 'ok' || !data?.apiKey || !data?.clientId) {
    throw new Error('`workos env provision` did not return credentials.');
  }
  return {
    name: data.name,
    clientId: data.clientId,
    authkitDomain: data.authkitDomain,
  };
}

// Provision a brand-new unclaimed WorkOS environment — the zero-account path.
// Shells out to the pinned WorkOS CLI so the CLI stays the single owner of
// the experimental /x/one-shot-environments contract; the harness never
// speaks to that endpoint itself. Only ever call this from an explicit,
// user-initiated flow (setup wizard choice, `provision` command): it creates
// a real environment server-side, so it must never run implicitly from
// hooks, event emission, or CI.
export function provisionUnclaimedEnvironment() {
  let stdout;
  try {
    stdout = runWorkos(['env', 'provision', '--json', '--mode', 'agent']);
  } catch (error) {
    const stderr = error.stderr?.toString?.() || '';
    let code = 'provision_failed';
    try {
      code = JSON.parse(stderr).code || code;
    } catch {
      // Non-JSON stderr (old CLI without `env provision`, npx failure).
    }
    const failure = new Error(code === 'rate_limited'
      ? 'WorkOS rate-limited environment provisioning. Try again later, or sign in with an existing account instead.'
      : `Could not provision a WorkOS environment (requires WorkOS CLI >= ${WORKOS_CLI_VERSION}). Sign in instead with \`${workosCliInvocation()} auth login\`.`);
    failure.code = code;
    throw failure;
  }
  return parseProvisionOutput(stdout);
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
