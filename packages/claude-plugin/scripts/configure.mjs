import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawnSync } from 'node:child_process';
import {
  createSdk,
  summarizeWorkosCliAuth,
} from '@workos-inc/audit-core/workos-client';
import { clearFileConfig, getConfigFilePath, maskSecret, readFileConfig, trimToUndefined, writeFileConfig } from './config-file.mjs';

function usage() {
  console.log(`Usage: node scripts/configure.mjs [--show|--clear|--reconfigure]\n\nRuns an interactive wizard that writes:\n  ${getConfigFilePath()}\n\nDo not pass secrets as command-line arguments.`);
}

function showConfig() {
  const config = readFileConfig();
  console.log(JSON.stringify({
    configPath: getConfigFilePath(),
    configured: true,
    credentialSource: config.apiKey ? 'api-key' : 'workos-cli',
    organizationResolution: config.organizationId ? 'explicit' : 'auto-find-or-create Audit Log Harness',
    apiKey: maskSecret(config.apiKey),
    organizationId: config.organizationId || null,
    actionPrefix: config.actionPrefix || 'claude',
    actorId: config.actorId || null,
    actorType: config.actorType || 'user',
    actorName: config.actorName || null,
    location: config.location || 'claude-code',
    userAgent: config.userAgent || 'claude-code-workos-audit/1',
    recordingEnabled: config.recordingEnabled !== false,
  }, null, 2));
}

async function hiddenQuestion(rl, prompt, existingValue) {
  if (existingValue) {
    const keep = await rl.question(`${prompt} [currently ${maskSecret(existingValue)}; press Enter to keep]: `);
    if (!keep.trim()) return existingValue;
    return keep.trim();
  }

  output.write(prompt);
  const canDisableEcho = input.isTTY && output.isTTY;
  if (canDisableEcho) spawnSync('stty', ['-echo'], { stdio: 'inherit' });
  try {
    const answer = await rl.question('');
    output.write('\n');
    return answer.trim();
  } finally {
    if (canDisableEcho) spawnSync('stty', ['echo'], { stdio: 'inherit' });
  }
}

async function optionalQuestion(rl, prompt, existingValue, fallback) {
  const suffix = existingValue
    ? ` [currently ${existingValue}; press Enter to keep]`
    : fallback
      ? ` [default ${fallback}]`
      : ' [optional]';
  const answer = await rl.question(`${prompt}${suffix}: `);
  return trimToUndefined(answer) || existingValue || fallback;
}

async function booleanQuestion(rl, prompt, existingValue, defaultValue) {
  const current = existingValue === undefined ? defaultValue : existingValue;
  const hint = current ? 'Y/n' : 'y/N';
  const answer = (await rl.question(`${prompt} [${hint}]: `)).trim().toLowerCase();
  if (!answer) return current;
  if (['y', 'yes', '1', 'true', 'on'].includes(answer)) return true;
  if (['n', 'no', '0', 'false', 'off'].includes(answer)) return false;
  return current;
}

async function choiceQuestion(rl, prompt, choices, defaultIndex = 0) {
  while (true) {
    console.log(prompt);
    choices.forEach((choice, i) => {
      const marker = i === defaultIndex ? '*' : ' ';
      console.log(`  ${marker} [${i + 1}] ${choice.label}`);
    });
    const raw = (await rl.question(`Select [1-${choices.length}, default ${defaultIndex + 1}]: `)).trim();
    if (!raw) return choices[defaultIndex];
    const n = Number.parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) return choices[n - 1];
    console.log(`  ! Enter a number between 1 and ${choices.length}.`);
  }
}

async function pickOrganization(rl, apiKey, currentOrganizationId) {
  // Try to enumerate organizations using the user's chosen credential.
  // On failure, fall back to a free-form prompt so the wizard never blocks.
  let organizations = null;
  try {
    const sdk = createSdk({ apiKey });
    if (!sdk) throw new Error('No API key available for org listing.');
    const page = await sdk.organizations.listOrganizations({ limit: 100 });
    organizations = page.data || [];
  } catch (error) {
    const message = error?.message || String(error);
    console.log(`\nCould not list organizations (${message}).`);
    return await optionalQuestion(
      rl,
      'WorkOS organization ID (org_..., blank uses/creates Audit Log Harness)',
      currentOrganizationId,
    );
  }

  if (organizations.length === 0) {
    console.log('\nNo organizations found for this credential. Leaving blank will create "Audit Log Harness" on first event.');
    return await optionalQuestion(
      rl,
      'WorkOS organization ID (org_..., blank uses/creates Audit Log Harness)',
      currentOrganizationId,
    );
  }

  console.log('\nOrganizations available to this credential:');
  organizations.forEach((org, i) => {
    const marker = org.id === currentOrganizationId ? '*' : ' ';
    console.log(`  ${marker} [${i + 1}] ${org.name} (${org.id})`);
  });
  console.log('    [0] Leave blank (auto-find/create "Audit Log Harness")');
  console.log('    [m] Type an organization ID manually');

  while (true) {
    const defaultLabel = currentOrganizationId
      ? `default keep ${currentOrganizationId}`
      : 'default 0';
    const raw = (await rl.question(`Select organization [0-${organizations.length}, m, ${defaultLabel}]: `)).trim();
    if (!raw) return currentOrganizationId || undefined;
    if (raw === '0') return undefined;
    if (raw.toLowerCase() === 'm') {
      return await optionalQuestion(rl, 'WorkOS organization ID (org_...)', currentOrganizationId);
    }
    const n = Number.parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 1 && n <= organizations.length) {
      return organizations[n - 1].id;
    }
    console.log(`  ! Enter 0, m, or a number between 1 and ${organizations.length}.`);
  }
}

async function configure() {
  const current = readFileConfig();
  const cliAuth = summarizeWorkosCliAuth();
  const rl = readline.createInterface({ input, output });

  try {
    console.log('Configure WorkOS Audit for Claude Code');
    console.log(`Config file: ${getConfigFilePath()}`);
    console.log('');

    // 1. Credential mode.
    const choices = [];
    if (cliAuth.loggedIn) {
      choices.push({
        key: 'cli',
        label: `Use WorkOS CLI auth (active environment: ${cliAuth.activeEnvironment || 'unknown'})`,
      });
    }
    choices.push({
      key: 'apiKey',
      label: 'Enter an explicit WorkOS API key (production or staging)',
    });
    choices.push({
      key: 'env',
      label: 'Skip — use WORKOS_API_KEY at runtime',
    });

    // Default to the existing credential mode when reconfiguring.
    let defaultIndex = 0;
    if (current.apiKey) {
      defaultIndex = choices.findIndex((c) => c.key === 'apiKey');
    } else if (!cliAuth.loggedIn) {
      defaultIndex = choices.findIndex((c) => c.key === 'env');
    }
    if (defaultIndex < 0) defaultIndex = 0;

    const credentialChoice = await choiceQuestion(rl, '\nCredentials:', choices, defaultIndex);

    let apiKey = current.apiKey;
    if (credentialChoice.key === 'apiKey') {
      console.log('The API key prompt does not echo input.');
      apiKey = await hiddenQuestion(rl, 'WorkOS API key (sk_...): ', current.apiKey);
    } else if (credentialChoice.key === 'cli') {
      apiKey = undefined; // explicitly clear any stored key
    } // env: leave whatever was there

    // 2. Organization selection (interactive list when we have a usable key).
    const apiKeyForListing = credentialChoice.key === 'cli' ? undefined : apiKey;
    // createSdk falls back to the CLI active env when no apiKey is passed.
    const organizationId = await pickOrganization(rl, apiKeyForListing, current.organizationId);

    // 3. Recording. Land here last for visibility — query-only users only need to flip this.
    console.log('');
    const recordingEnabled = await booleanQuestion(
      rl,
      'Record audit events from this Claude Code install? (answer N for query-only)',
      current.recordingEnabled,
      true,
    );

    // 4. Identity / context — optional advanced fields.
    console.log('\nIdentity & context (press Enter to accept each default):');
    const actionPrefix = await optionalQuestion(rl, 'Action prefix', current.actionPrefix, 'claude');
    const actorId = await optionalQuestion(rl, 'Actor ID override', current.actorId);
    const actorType = await optionalQuestion(rl, 'Actor type', current.actorType, 'user');
    const actorName = await optionalQuestion(rl, 'Actor name override', current.actorName);
    const location = await optionalQuestion(rl, 'Location', current.location, 'claude-code');
    const userAgent = await optionalQuestion(rl, 'User agent', current.userAgent, 'claude-code-workos-audit/1');

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
  } finally {
    rl.close();
  }
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  usage();
} else if (args.includes('--show')) {
  showConfig();
} else if (args.includes('--clear')) {
  clearFileConfig();
  console.log(`Removed ${getConfigFilePath()}`);
} else {
  // --reconfigure is accepted but behaves the same as no args — every run is interactive.
  await configure();
}
