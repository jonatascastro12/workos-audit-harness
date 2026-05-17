#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { Entry } from '@napi-rs/keyring';
import { WorkOS } from '@workos-inc/node';
import { getHarnessAuditSchemaDefinitions } from './harness-audit-schemas.mjs';

const DEFAULT_QUERY_RANGE_DAYS = 7;
const DEFAULT_QUERY_MAX_ROWS = 50;
const MAX_QUERY_MAX_ROWS = 200;
const EXPORT_POLL_INTERVAL_MS = 1500;
const EXPORT_POLL_TIMEOUT_MS = 60_000;
const DEFAULT_API_BASE_URL = 'https://api.workos.com';
const DEFAULT_ORGANIZATION_NAME = 'Audit Log Harness';
const USER_AGENT = 'workos-audit-harness/1';

function trimToUndefined(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { command: positional[0], positional: positional.slice(1), flags };
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function readOptionalStdin(file) {
  if (file && file !== '-') return '';
  if (process.stdin.isTTY) return '';
  return await readStdin();
}

function parseJson(text, fallback = {}) {
  if (!text || !text.trim()) return fallback;
  return JSON.parse(text);
}

function maskSecret(value) {
  if (!value) return undefined;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function getConfig(flags = {}) {
  const apiKey = trimToUndefined(flags.apiKey)
    || trimToUndefined(flags['api-key'])
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_API_KEY)
    || trimToUndefined(process.env.WORKOS_API_KEY);
  const organizationId = trimToUndefined(flags.organizationId)
    || trimToUndefined(flags['organization-id'])
    || trimToUndefined(flags.org)
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_ORGANIZATION_ID)
    || trimToUndefined(process.env.WORKOS_ORGANIZATION_ID);
  const apiBaseUrl = trimToUndefined(flags.apiBaseUrl)
    || trimToUndefined(flags['api-base-url'])
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_API_BASE_URL)
    || DEFAULT_API_BASE_URL;
  const organizationName = trimToUndefined(flags.organizationName)
    || trimToUndefined(flags['organization-name'])
    || trimToUndefined(flags['org-name'])
    || trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_ORGANIZATION_NAME)
    || DEFAULT_ORGANIZATION_NAME;
  return { apiKey, organizationId, organizationName, apiBaseUrl };
}

function getWorkosCommandPrefix() {
  const configured = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_BIN);
  if (configured) return [configured];
  try {
    const found = execFileSync('bash', ['-lc', 'command -v workos'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (found) return [found];
  } catch {
    // Fall through to npx. npx installs/downloads the WorkOS CLI package when absent.
  }
  return ['npx', '--yes', 'workos@latest'];
}

function runWorkos(args, options = {}) {
  const [bin, ...prefixArgs] = getWorkosCommandPrefix();
  return execFileSync(bin, [...prefixArgs, ...args], {
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    input: options.input,
    env: { ...process.env, NO_COLOR: '1' },
  });
}

function readWorkosCliConfig() {
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

function getWorkosCliActiveEnvironment() {
  const cliConfig = readWorkosCliConfig();
  if (!cliConfig?.activeEnvironment) return undefined;
  return cliConfig.environments?.[cliConfig.activeEnvironment];
}

function getEffectiveApiKey(config) {
  return config.apiKey || getWorkosCliActiveEnvironment()?.apiKey;
}

function createSdk(config) {
  const apiKey = getEffectiveApiKey(config);
  if (!apiKey) return undefined;
  const url = new URL(config.apiBaseUrl || DEFAULT_API_BASE_URL);
  return new WorkOS(apiKey, {
    apiHostname: url.hostname,
    ...(url.port ? { port: Number(url.port) } : {}),
    ...(url.protocol === 'http:' ? { https: false } : {}),
  });
}

function apiUrl(config, pathname) {
  return new URL(pathname, config.apiBaseUrl || DEFAULT_API_BASE_URL).toString();
}

function pickOrganizationId(value) {
  return value?.id || value?.data?.id || value?.organization?.id;
}

async function ensureOrganization(config) {
  if (config.organizationId) return config.organizationId;
  const name = config.organizationName || DEFAULT_ORGANIZATION_NAME;
  const workos = createSdk(config);

  if (workos) {
    const page = await retry(() => workos.organizations.listOrganizations({ limit: 100 }), 'organization list');
    const existing = page.data?.find((organization) => organization.name === name);
    if (existing?.id) return existing.id;
    const created = await retry(() => workos.organizations.createOrganization({ name }), `organization create ${name}`);
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

function toSdkEvent(event) {
  const { occurred_at, occurredAt, context, ...rest } = event;
  const normalizedContext = context
    ? {
        location: context.location,
        userAgent: context.userAgent || context.user_agent,
      }
    : undefined;
  return {
    ...rest,
    occurredAt: occurredAt || occurred_at ? new Date(occurredAt || occurred_at) : new Date(),
    ...(normalizedContext ? { context: normalizedContext } : {}),
  };
}

function toRestEvent(event) {
  const { occurredAt, occurred_at, context, actor, targets, ...rest } = event;
  const normalizedContext = context
    ? {
        location: context.location,
        user_agent: context.user_agent || context.userAgent,
      }
    : undefined;
  return {
    ...rest,
    actor: actor ? { ...actor, metadata: actor.metadata || {} } : actor,
    targets: (targets || []).map((target) => ({ ...target, metadata: target.metadata || {} })),
    occurred_at: occurred_at || occurredAt || new Date().toISOString(),
    ...(normalizedContext ? { context: normalizedContext } : {}),
  };
}

async function emitEvent(event, config) {
  const orgId = await ensureOrganization(config);

  const effectiveApiKey = getEffectiveApiKey(config);
  if (effectiveApiKey) {
    const response = await fetch(apiUrl(config, '/audit_logs/events'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({ organization_id: orgId, event: toRestEvent(event) }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`WorkOS audit event failed: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ''}`);
    }
    return { ok: true, transport: 'api-key', organizationId: orgId, action: event.action };
  }

  const occurredAt = event.occurredAt || event.occurred_at || new Date().toISOString();
  const context = event.context
    ? { location: event.context.location, user_agent: event.context.user_agent || event.context.userAgent }
    : { location: 'unknown' };
  const args = [
    'audit-log', 'create-event', orgId,
    '--action', event.action,
    '--actor-type', event.actor?.type || 'user',
    '--actor-id', event.actor?.id || 'unknown',
  ];
  if (event.actor?.name) args.push('--actor-name', event.actor.name);
  args.push(
    '--occurred-at', new Date(occurredAt).toISOString(),
    '--targets', JSON.stringify(event.targets || []),
    '--context', JSON.stringify(context),
    '--metadata', JSON.stringify(event.metadata || {}),
    '--json', '--mode', 'agent',
  );
  runWorkos(args);
  return { ok: true, transport: 'workos-cli', organizationId: orgId, action: event.action };
}

function parseJsonValue(value) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try { return JSON.parse(trimmed); } catch { return trimmed; }
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === ',') { row.push(field); field = ''; continue; }
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (char !== '\r') field += char;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ''));
}

function parseAuditLogRows(csv) {
  const parsed = parseCsv(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow?.length) return [];
  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);
  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || '']));
    const targets = targetIndices.map((index) => ({
      id: raw[`target_id_${index}`] || undefined,
      type: raw[`target_type_${index}`] || undefined,
      name: raw[`target_name_${index}`] || undefined,
      metadata: parseJsonValue(raw[`target_metadata_${index}`]),
    })).filter((target) => target.id || target.type || target.name || target.metadata !== undefined);
    return {
      action: raw.action || '',
      occurredAt: raw.occurred_at || undefined,
      actor: {
        id: raw.actor_id || undefined,
        type: raw.actor_type || undefined,
        name: raw.actor_name || undefined,
        metadata: parseJsonValue(raw.actor_metadata),
      },
      context: {
        location: raw.context_location || undefined,
        userAgent: raw.context_user_agent || undefined,
      },
      metadata: parseJsonValue(raw.metadata),
      targets,
      raw,
    };
  });
}

function stableSerialize(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`).join(',')}}`;
  return JSON.stringify(String(value));
}

function truncate(value, maxLength = 280) {
  if (value === undefined || value === null) return undefined;
  const raw = typeof value === 'string' ? value : stableSerialize(value);
  if (raw.length <= maxLength) return raw;
  return `${raw.slice(0, maxLength - 3)}...`;
}

function summarizeCounts(values) {
  if (values.length === 0) return 'none';
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([value, count]) => `${value}=${count}`).join(', ');
}

function formatAuditLogRow(row, index) {
  const targets = row.targets.length > 0
    ? row.targets.map((target) => `${target.type || 'unknown'}:${target.id || target.name || 'unknown'}`).join(', ')
    : 'none';
  const metadata = truncate(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || 'unknown time'} | action=${row.action}`,
    `   actor=${row.actor.type || 'unknown'}:${row.actor.id || row.actor.name || 'unknown'}`,
    `   targets=${targets}`,
    metadata ? `   metadata=${metadata}` : undefined,
  ].filter(Boolean).join('\n');
}

async function createExport(config, filters) {
  const workos = createSdk(config);
  if (workos) {
    let auditExport = await workos.auditLogs.createExport({
      organizationId: filters.organizationId,
      rangeStart: new Date(filters.rangeStart),
      rangeEnd: new Date(filters.rangeEnd),
      ...(filters.actions?.length ? { actions: filters.actions } : {}),
      ...(filters.actorNames?.length ? { actorNames: filters.actorNames } : {}),
      ...(filters.actorIds?.length ? { actorIds: filters.actorIds } : {}),
      ...(filters.targets?.length ? { targets: filters.targets } : {}),
    });
    const deadline = Date.now() + EXPORT_POLL_TIMEOUT_MS;
    while (auditExport.state === 'pending') {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for audit export ${auditExport.id}`);
      await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_INTERVAL_MS));
      auditExport = await workos.auditLogs.getExport(auditExport.id);
    }
    return auditExport;
  }

  const args = [
    'audit-log', 'export',
    '--org', filters.organizationId,
    '--range-start', filters.rangeStart,
    '--range-end', filters.rangeEnd,
    '--json', '--mode', 'agent',
  ];
  if (filters.actions?.length) args.push('--actions', filters.actions.join(','));
  if (filters.actorNames?.length) args.push('--actor-names', filters.actorNames.join(','));
  if (filters.actorIds?.length) args.push('--actor-ids', filters.actorIds.join(','));
  if (filters.targets?.length) args.push('--targets', filters.targets.join(','));
  return parseJson(runWorkos(args));
}

async function queryAuditLogs(config, params) {
  const organizationId = await ensureOrganization(config);
  const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date();
  if (Number.isNaN(rangeEnd.getTime())) throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);
  const rangeStart = params.rangeStart ? new Date(params.rangeStart) : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000);
  if (Number.isNaN(rangeStart.getTime())) throw new Error(`Invalid rangeStart: ${params.rangeStart}`);
  if (rangeStart.getTime() > rangeEnd.getTime()) throw new Error('rangeStart must be before rangeEnd');
  const maxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS, params.maxRows || DEFAULT_QUERY_MAX_ROWS));
  const filters = {
    organizationId,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    actions: params.actions || [],
    actorIds: params.actorIds || [],
    actorNames: params.actorNames || [],
    targets: params.targets || [],
  };
  const auditExport = await createExport(config, filters);
  if (auditExport.state !== 'ready' || !auditExport.url) throw new Error(`Audit export ${auditExport.id || '(unknown)'} finished in unexpected state: ${auditExport.state}`);
  const response = await fetch(auditExport.url);
  if (!response.ok) throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
  const csv = await response.text();
  const csvPath = path.join(os.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
  writeFileSync(csvPath, csv, 'utf8');
  const rows = parseAuditLogRows(csv).sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''));
  const sampleRows = rows.slice(0, maxRows);
  const actionSummary = summarizeCounts(rows.map((row) => row.action).filter(Boolean));
  const actorSummary = summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || 'unknown'));
  const targetSummary = summarizeCounts(rows.flatMap((row) => row.targets.map((target) => target.type || 'unknown')));
  const text = [
    `Question: ${params.question || '(not provided)'}`,
    `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
    `Export ID: ${auditExport.id}`,
    `Rows: ${rows.length}`,
    `Action counts: ${actionSummary}`,
    `Actor counts: ${actorSummary}`,
    `Target type counts: ${targetSummary}`,
    `Full CSV saved to: ${csvPath}`,
    rows.length === 0 ? 'No matching audit log rows found.' : `Sample rows (newest first, up to ${maxRows}):`,
    ...sampleRows.map((row, index) => formatAuditLogRow(row, index)),
  ].join('\n\n');
  return {
    text,
    details: {
      question: params.question,
      exportId: auditExport.id,
      exportUrl: auditExport.url,
      csvPath,
      filters,
      rowCount: rows.length,
      sampledRowCount: sampleRows.length,
      counts: { actions: actionSummary, actors: actorSummary, targetTypes: targetSummary },
      rows: sampleRows,
    },
  };
}

async function retry(operation, label, attempts = 3) {
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

async function createSchema(config, schema) {
  if (!schema?.action) throw new Error('Schema must include action.');
  const body = { actor: schema.actor, targets: schema.targets, metadata: schema.metadata };
  const workos = createSdk(config);
  if (workos) {
    return await retry(() => workos.auditLogs.createSchema({ action: schema.action, ...body }), `schema ${schema.action}`);
  }
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'workos-audit-harness-'));
  const schemaPath = path.join(tmpDir, 'schema.json');
  try {
    writeFileSync(schemaPath, JSON.stringify(body, null, 2), 'utf8');
    return await retry(
      () => parseJson(runWorkos(['audit-log', 'create-schema', schema.action, '--file', schemaPath, '--json', '--mode', 'agent'])),
      `schema ${schema.action}`,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function readJsonFileOrStdin(file, stdinText) {
  if (file && file !== '-') return parseJson(readFileSync(file, 'utf8'));
  return parseJson(stdinText);
}

function print(value, json) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (typeof value === 'string') console.log(value);
  else console.log(JSON.stringify(value, null, 2));
}

function usage() {
  return `Usage: audit-log-harness <command> [options]\n\nCommands:\n  auth-login                 Run \`workos auth login\` (uses npx workos@latest when missing)\n  status                     Show API key / WorkOS CLI credential status\n  ensure-organization        Find or create the harness organization and print its id\n  emit-event                 Read an audit event JSON from stdin/--file and emit it\n  query                      Export, parse, and summarize audit logs\n  create-schema              Read one schema JSON from stdin/--file and create it\n  seed-generic-schemas       Create broad generic harness schemas\n\nCommon options:\n  --org, --organization-id   WorkOS organization id. If omitted, the harness finds or creates \"Audit Log Harness\"\n  --organization-name        Organization name to auto-find/create (default: Audit Log Harness)\n  --api-key                  Optional WorkOS API key; if omitted, active \`workos\` CLI env is used\n  --json                     Print JSON output\n`;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true || flags.json === 'true';
  if (!command || command === 'help' || command === '--help') {
    console.log(usage());
    return;
  }

  if (command === 'auth-login') {
    runWorkos(['auth', 'login'], { stdio: 'inherit' });
    return;
  }

  const config = getConfig(flags);

  if (command === 'ensure-organization') {
    const organizationId = await ensureOrganization(config);
    print({ organizationId, organizationName: config.organizationName }, json);
    return;
  }

  if (command === 'status') {
    let cliStatus;
    try { cliStatus = parseJson(runWorkos(['auth', 'status', '--json', '--mode', 'agent'])); }
    catch (error) { cliStatus = { available: false, error: error.stderr?.toString?.() || error.message }; }
    let envList;
    try { envList = parseJson(runWorkos(['env', 'list', '--json', '--mode', 'agent'])); }
    catch { envList = undefined; }
    const activeCliEnvironment = getWorkosCliActiveEnvironment();
    print({
      configured: Boolean(config.apiKey || activeCliEnvironment?.apiKey || cliStatus?.authenticated || envList),
      organizationId: config.organizationId || null,
      organizationName: config.organizationName,
      organizationResolution: config.organizationId ? 'explicit' : 'auto-find-or-create',
      apiKey: maskSecret(config.apiKey),
      apiBaseUrl: config.apiBaseUrl,
      credentialSource: config.apiKey ? 'api-key' : (activeCliEnvironment?.apiKey ? 'workos-cli-active-environment' : 'workos-cli'),
      workosCli: { command: getWorkosCommandPrefix().join(' '), auth: cliStatus, environments: envList },
    }, json);
    return;
  }

  if (command === 'emit-event') {
    const stdinText = await readOptionalStdin(flags.file);
    const payload = readJsonFileOrStdin(flags.file, stdinText);
    const event = payload.event || payload;
    print(await emitEvent(event, config), json);
    return;
  }

  if (command === 'query') {
    const stdinText = await readOptionalStdin(flags.file);
    const params = { ...parseJson(stdinText), ...Object.fromEntries(Object.entries(flags).filter(([key]) => !['json', 'api-key', 'apiKey', 'org', 'organization-id', 'organizationId', 'api-base-url', 'apiBaseUrl'].includes(key))) };
    for (const key of ['actions', 'actorIds', 'actorNames', 'targets']) {
      if (typeof params[key] === 'string') params[key] = params[key].split(',').map((item) => item.trim()).filter(Boolean);
    }
    const result = await queryAuditLogs(config, params);
    print(json ? result : result.text, json);
    return;
  }

  if (command === 'create-schema') {
    const stdinText = await readOptionalStdin(flags.file);
    const schema = readJsonFileOrStdin(flags.file, stdinText);
    print(await createSchema(config, schema), json);
    return;
  }

  if (command === 'seed-generic-schemas') {
    const prefix = trimToUndefined(flags.prefix) || 'harness';
    const schemas = getHarnessAuditSchemaDefinitions(prefix);
    if (flags['dry-run'] || flags.dryRun) {
      print({ prefix, schemaCount: schemas.length, schemas }, json);
      return;
    }
    const created = [];
    for (const [index, schema] of schemas.entries()) {
      process.stderr.write(`Creating schema ${index + 1}/${schemas.length}: ${schema.action}\n`);
      const result = await createSchema(config, schema);
      created.push({ action: schema.action, result });
    }
    print({ prefix, schemaCount: created.length, created }, json);
    return;
  }

  throw new Error(`Unknown command: ${command}\n${usage()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
