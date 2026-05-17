#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawnSync } from 'node:child_process';
import { clearFileConfig, getConfigFilePath, maskSecret, readFileConfig, trimToUndefined, writeFileConfig } from './config-file.mjs';

function usage() {
  console.log(`Usage: node scripts/configure.mjs [--show|--clear]\n\nPrompts for WorkOS Audit plugin configuration and writes it to:\n  ${getConfigFilePath()}\n\nDo not pass secrets as command-line arguments.`);
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

async function configure() {
  const current = readFileConfig();
  const rl = readline.createInterface({ input, output });

  try {
    console.log('Configure WorkOS Audit for Claude Code');
    console.log(`Config file: ${getConfigFilePath()}`);
    console.log('The API key prompt does not echo input. Leave it blank to use `workos auth login` / the active WorkOS CLI environment.');
    console.log('');

    const apiKey = await hiddenQuestion(rl, 'WorkOS API key (sk_..., optional): ', current.apiKey);
    const organizationId = await optionalQuestion(rl, 'WorkOS organization ID (org_..., optional; blank uses/creates Audit Log Harness)', current.organizationId);
    const recordingEnabled = await booleanQuestion(rl, 'Record audit events from this Claude Code install? (turn off for query-only)', current.recordingEnabled, true);
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
  await configure();
}
