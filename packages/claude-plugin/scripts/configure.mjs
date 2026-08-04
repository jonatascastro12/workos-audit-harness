import { confirm, input, password, select } from '@inquirer/prompts';
import {
  DEFAULT_API_BASE_URL,
  createSdk,
  getEffectiveApiKey,
  summarizeWorkosCliAuth,
} from '@workos-inc/audit-core/workos-client';
import { getDeviceCertLabel } from '@workos-inc/audit-core/device-cert';
import { printConfigStatus } from '@workos-inc/audit-core/print-config-status';
import { clearFileConfig, configLoader, getConfigFilePath, loadConfig, maskSecret, readFileConfig, trimToUndefined, writeFileConfig } from './config-file.mjs';
import { getClaudeAuditSchemaDefinitions } from './claude-audit-schemas.mjs';

function usage() {
  console.log(`Usage: node scripts/configure.mjs [--show|--clear|--reconfigure]\n\nRuns an interactive wizard that writes:\n  ${getConfigFilePath()}\n\nDo not pass secrets as command-line arguments.`);
}

// One source of truth for "what is my state?" — the same resolved view hooks
// use, rather than a second hand-rolled summary that can drift from it (the
// previous one hardcoded `configured: true` and never mentioned the proxy).
function showConfig() {
  printConfigStatus({ configLoader });
}

async function promptApiKey(existingValue) {
  if (existingValue) {
    const keep = await confirm({
      message: `Keep stored API key (${maskSecret(existingValue)})?`,
      default: true,
    });
    if (keep) return existingValue;
  }
  const value = await password({
    message: 'WorkOS API key (sk_...)',
    mask: '*',
    validate: (v) => (v && v.trim() ? true : 'API key is required.'),
  });
  return value.trim();
}

async function promptOptional(message, existingValue, fallback) {
  const defaultValue = existingValue || fallback || '';
  const value = await input({ message, default: defaultValue });
  return trimToUndefined(value) || existingValue || fallback;
}

async function checkSchemasSeeded(apiKey, action) {
  if (!apiKey) return { status: 'unknown', reason: 'no-credential' };
  try {
    const url = new URL(`${DEFAULT_API_BASE_URL}/audit_logs/actions/${encodeURIComponent(action)}/schemas`);
    url.searchParams.set('limit', '1');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (response.status === 404) return { status: 'missing' };
    if (!response.ok) {
      return { status: 'unknown', reason: `${response.status} ${response.statusText}` };
    }
    const page = await response.json();
    return { status: (page.data?.length ?? 0) > 0 ? 'seeded' : 'missing' };
  } catch (error) {
    return { status: 'unknown', reason: error?.message || String(error) };
  }
}

async function seedClaudeSchemas(apiKey, prefix) {
  const sdk = createSdk({ apiKey });
  if (!sdk) throw new Error('No WorkOS credential available to seed schemas.');
  const schemas = getClaudeAuditSchemaDefinitions(prefix);
  for (const [index, schema] of schemas.entries()) {
    process.stdout.write(`  [${index + 1}/${schemas.length}] ${schema.action}\n`);
    await sdk.auditLogs.createSchema({
      action: schema.action,
      actor: schema.actor,
      targets: schema.targets,
      metadata: schema.metadata,
    });
  }
  console.log(`Seeded ${schemas.length} schema(s) for prefix "${prefix}".`);
}

async function maybeSeedSchemas(apiKey, actionPrefix) {
  const probeAction = `${actionPrefix}.session.started`;
  console.log('\nChecking whether audit log schemas are seeded for this prefix…');
  const result = await checkSchemasSeeded(apiKey, probeAction);

  if (result.status === 'seeded') {
    console.log(`Schemas already exist for "${actionPrefix}.*" — nothing to seed.`);
    return;
  }

  if (result.status === 'unknown') {
    console.log(`Could not determine schema status (${result.reason}). You can seed manually with: npm run create:schemas`);
    return;
  }

  console.log(`No schemas found for "${probeAction}". Without schemas, recorded events may be rejected by WorkOS.`);
  const shouldSeed = await confirm({
    message: 'Seed Claude audit log schemas now?',
    default: true,
  });
  if (!shouldSeed) {
    console.log('Skipping schema seeding. Run `npm run create:schemas` later when you are ready.');
    return;
  }
  try {
    await seedClaudeSchemas(apiKey, actionPrefix);
  } catch (error) {
    const message = error?.message || String(error);
    console.log(`Failed to seed schemas: ${message}`);
    console.log('You can retry later with: npm run create:schemas');
  }
}

async function pickOrganization(apiKey, currentOrganizationId) {
  let organizations = null;
  try {
    const sdk = createSdk({ apiKey });
    if (!sdk) throw new Error('No API key available for org listing.');
    const page = await sdk.organizations.listOrganizations({ limit: 100 });
    organizations = page.data || [];
  } catch (error) {
    const message = error?.message || String(error);
    console.log(`\nCould not list organizations (${message}).`);
    return await promptOptional(
      'WorkOS organization ID (org_..., blank uses/creates Audit Log Harness)',
      currentOrganizationId,
    );
  }

  if (organizations.length === 0) {
    console.log('\nNo organizations found for this credential. Leaving blank will create "Audit Log Harness" on first event.');
    return await promptOptional(
      'WorkOS organization ID (org_..., blank uses/creates Audit Log Harness)',
      currentOrganizationId,
    );
  }

  const choices = [
    { name: 'Leave blank (auto-find/create "Audit Log Harness")', value: '__blank__' },
    ...organizations.map((org) => ({ name: `${org.name} (${org.id})`, value: org.id })),
    { name: 'Type an organization ID manually', value: '__manual__' },
  ];
  const defaultValue = currentOrganizationId
    && organizations.some((org) => org.id === currentOrganizationId)
    ? currentOrganizationId
    : '__blank__';

  const selection = await select({
    message: 'Organization',
    choices,
    default: defaultValue,
  });

  if (selection === '__blank__') return undefined;
  if (selection === '__manual__') {
    return await promptOptional('WorkOS organization ID (org_...)', currentOrganizationId);
  }
  return selection;
}

// Proxy-managed machines take a much shorter path through the wizard.
//
// When an ingestion proxy is configured (normally by MDM), the proxy holds the
// `sk_` key, resolves the device to a person, and picks the organization — so
// asking for a credential, an organization, or offering to seed schemas is
// asking for things this machine must not have and will never use. Only the
// two settings the client still controls are worth prompting for: whether to
// record at all, and the action prefix (the proxy forwards `action` verbatim).
async function configureViaProxy(current, resolved) {
  console.log('Configure WorkOS Audit for Claude Code');
  console.log(`Config file: ${getConfigFilePath()}`);
  console.log(`\nIngestion proxy: ${resolved.proxyUrl}`);
  console.log(`  source: ${resolved.sources.proxyUrl}`);
  console.log(
    '  Events are sent to the proxy over mTLS with this machine\'s device certificate.\n'
    + '  The proxy holds the WorkOS API key and stamps the actor, organization, and\n'
    + '  IP itself, so no API key or organization is needed (or used) here.',
  );

  const certLabel = getDeviceCertLabel();
  if (certLabel) {
    console.log(`  device certificate: ${certLabel}`);
  } else {
    console.log(
      '  WARNING: no device certificate found in the keychain. Recording will be\n'
      + '  skipped until this machine has its MDM-issued certificate.',
    );
  }

  const recordingEnabled = await confirm({
    message: 'Record audit events from this Claude Code install? (answer No for query-only)',
    default: current.recordingEnabled !== false,
  });

  let actionPrefix = current.actionPrefix;
  if (recordingEnabled) {
    actionPrefix = await promptOptional('Action prefix', current.actionPrefix, 'claude');
  }

  // Preserve everything else untouched: the identity fields are overwritten by
  // the proxy, but a machine can move between proxy and direct modes and we
  // must not silently discard values it would need again.
  const filePath = writeFileConfig({ ...current, actionPrefix, recordingEnabled });
  console.log(`\nSaved WorkOS Audit config to ${filePath}`);
  if (!recordingEnabled) {
    console.log('Recording is OFF — hooks will short-circuit; only the query MCP tool will be active.');
  }
  console.log('Restart Claude Code so hooks and MCP servers reload the configuration.');
}

async function configure() {
  const current = readFileConfig();
  const resolved = loadConfig();

  // Branch before any credential prompt — see configureViaProxy.
  if (resolved.proxyUrl) {
    return configureViaProxy(current, resolved);
  }

  const cliAuth = summarizeWorkosCliAuth();

  console.log('Configure WorkOS Audit for Claude Code');
  console.log(`Config file: ${getConfigFilePath()}`);

  // 1. Credential mode.
  const credentialChoices = [];
  if (cliAuth.loggedIn) {
    credentialChoices.push({
      name: `Use WorkOS CLI auth (active environment: ${cliAuth.activeEnvironment || 'unknown'})`,
      value: 'cli',
    });
  }
  credentialChoices.push({
    name: 'Enter an explicit WorkOS API key (production or staging)',
    value: 'apiKey',
  });
  credentialChoices.push({
    name: 'Skip — use WORKOS_API_KEY at runtime',
    value: 'env',
  });

  let defaultCredential = credentialChoices[0].value;
  if (current.apiKey) defaultCredential = 'apiKey';
  else if (!cliAuth.loggedIn) defaultCredential = 'env';

  const credentialKey = await select({
    message: 'Credentials',
    choices: credentialChoices,
    default: defaultCredential,
  });

  let apiKey = current.apiKey;
  if (credentialKey === 'apiKey') {
    apiKey = await promptApiKey(current.apiKey);
  } else if (credentialKey === 'cli') {
    apiKey = undefined;
  }

  // 2. Organization.
  const apiKeyForListing = credentialKey === 'cli' ? undefined : apiKey;
  const organizationId = await pickOrganization(apiKeyForListing, current.organizationId);

  // 3. Recording.
  const recordingEnabled = await confirm({
    message: 'Record audit events from this Claude Code install? (answer No for query-only)',
    default: current.recordingEnabled !== false,
  });

  // 4. Identity / context — only relevant when recording. Query-only users keep their stored values.
  let actionPrefix = current.actionPrefix;
  let actorId = current.actorId;
  let actorType = current.actorType;
  let actorName = current.actorName;
  let location = current.location;
  let userAgent = current.userAgent;
  if (recordingEnabled) {
    console.log('\nIdentity & context:');
    actionPrefix = await promptOptional('Action prefix', current.actionPrefix, 'claude');
    actorId = await promptOptional('Actor ID override', current.actorId);
    actorType = await promptOptional('Actor type', current.actorType, 'user');
    actorName = await promptOptional('Actor name override', current.actorName);
    location = await promptOptional('Location', current.location, 'claude-code');
    userAgent = await promptOptional('User agent', current.userAgent, 'claude-code-workos-audit/1');
  }

  // 5. Schema seeding — only meaningful when recording is on.
  if (recordingEnabled) {
    const effectiveApiKey = getEffectiveApiKey({ apiKey }) || trimToUndefined(process.env.WORKOS_API_KEY);
    await maybeSeedSchemas(effectiveApiKey, actionPrefix || 'claude');
  }

  const filePath = writeFileConfig({
    ...(apiKey ? { apiKey } : {}),
    ...(organizationId ? { organizationId } : {}),
    actionPrefix,
    actorId,
    actorType,
    actorName,
    location,
    userAgent,
    recordingEnabled,
  });

  console.log(`\nSaved WorkOS Audit config to ${filePath}`);
  if (!recordingEnabled) {
    console.log('Recording is OFF — hooks will short-circuit; only the query MCP tool will be active.');
  }
  console.log('Restart Claude Code so hooks and MCP servers reload the configuration.');
}

const args = process.argv.slice(2);
try {
  if (args.includes('--help') || args.includes('-h')) {
    usage();
  } else if (args.includes('--show')) {
    showConfig();
  } else if (args.includes('--clear')) {
    clearFileConfig();
    console.log(`Removed ${getConfigFilePath()}`);
  } else {
    await configure();
  }
} catch (error) {
  if (error?.name === 'ExitPromptError') {
    console.log('\nCancelled.');
    process.exit(130);
  }
  throw error;
}
