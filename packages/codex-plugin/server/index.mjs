import os from 'node:os';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { WorkOS } from '@workos-inc/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getConfigFilePath, maskSecret, readFileConfig, trimToUndefined } from '../scripts/config-file.mjs';

const DEFAULT_QUERY_RANGE_DAYS = 7;
const DEFAULT_QUERY_MAX_ROWS = 50;
const MAX_QUERY_MAX_ROWS = 200;
const EXPORT_POLL_INTERVAL_MS = 1500;
const EXPORT_POLL_TIMEOUT_MS = 60_000;

function stableSerialize(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value));
}

function truncateMetadataString(value, maxLength = 500) {
  if (typeof value !== 'string') return undefined;
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}

function parseJsonValue(value) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
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
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char !== '\r') field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ''));
}

function parseAuditLogRows(csv) {
  const parsed = parseCsv(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow || headerRow.length === 0) return [];

  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);

  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || '']));
    const targets = targetIndices
      .map((index) => ({
        id: raw[`target_id_${index}`] || undefined,
        type: raw[`target_type_${index}`] || undefined,
        name: raw[`target_name_${index}`] || undefined,
        metadata: parseJsonValue(raw[`target_metadata_${index}`]),
      }))
      .filter((target) => target.id || target.type || target.name || target.metadata !== undefined);

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

function formatUnknown(value, maxLength = 280) {
  if (value === undefined || value === null) return undefined;
  const raw = typeof value === 'string' ? value : stableSerialize(value);
  return truncateMetadataString(raw, maxLength);
}

function summarizeCounts(values) {
  if (values.length === 0) return 'none';
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([value, count]) => `${value}=${count}`)
    .join(', ');
}

function formatAuditLogRow(row, index) {
  const targetSummary = row.targets.length > 0
    ? row.targets.map((target) => `${target.type || 'unknown'}:${target.id || target.name || 'unknown'}`).join(', ')
    : 'none';
  const metadataSummary = formatUnknown(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || 'unknown time'} | action=${row.action}`,
    `   actor=${row.actor.type || 'unknown'}:${row.actor.id || row.actor.name || 'unknown'}`,
    `   targets=${targetSummary}`,
    metadataSummary ? `   metadata=${metadataSummary}` : undefined,
  ].filter(Boolean).join('\n');
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getEnv(name) {
  return trimToUndefined(process.env[`CODEX_WORKOS_AUDIT_${name}`])
    || trimToUndefined(process.env[`WORKOS_${name}`]);
}

function getConfig() {
  const fileConfig = readFileConfig();
  const apiKey = getEnv('API_KEY') || fileConfig.apiKey;
  const organizationId = getEnv('ORGANIZATION_ID') || fileConfig.organizationId;
  const actionPrefix = getEnv('ACTION_PREFIX') || fileConfig.actionPrefix || 'codex';
  const actorType = getEnv('ACTOR_TYPE') || fileConfig.actorType || 'user';
  const actorId = getEnv('ACTOR_ID')
    || fileConfig.actorId
    || trimToUndefined(process.env.USER)
    || trimToUndefined(process.env.USERNAME)
    || os.hostname();
  const actorName = getEnv('ACTOR_NAME')
    || fileConfig.actorName
    || trimToUndefined(process.env.USER)
    || trimToUndefined(process.env.USERNAME);
  const location = getEnv('LOCATION') || fileConfig.location || 'codex';
  const userAgent = getEnv('USER_AGENT') || fileConfig.userAgent || 'codex-workos-audit/1';

  return {
    enabled: true,
    apiKey,
    organizationId,
    actionPrefix,
    actorId,
    actorType,
    actorName,
    location,
    userAgent,
  };
}

function getHarnessPath() {
  return trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_PATH)
    || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../scripts/audit-log-harness.mjs');
}

function runHarnessJson(command, payload = {}, extraArgs = []) {
  const args = [getHarnessPath(), command, '--json', ...extraArgs];
  if (config.organizationId) args.push('--org', config.organizationId);
  if (config.apiKey) args.push('--api-key', config.apiKey);
  const output = execFileSync(process.execPath, args, {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

const config = getConfig();
const workos = config.apiKey ? new WorkOS(config.apiKey) : undefined;

const server = new McpServer({
  name: 'workos-audit',
  version: '0.1.0',
});

server.registerTool(
  'workos_audit_status',
  {
    title: 'WorkOS Audit Status',
    description: 'Show WorkOS audit plugin configuration status.',
    inputSchema: z.object({}).strict(),
  },
  async () => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          enabled: config.enabled,
          configPath: getConfigFilePath(),
          credentialSource: config.apiKey ? 'api-key' : 'workos-cli',
          apiKey: maskSecret(config.apiKey),
          organizationId: config.organizationId || null,
          organizationResolution: config.organizationId ? 'explicit' : 'auto-find-or-create Audit Log Harness',
          actionPrefix: config.actionPrefix,
          actorId: config.actorId,
          actorType: config.actorType,
          actorName: config.actorName,
          location: config.location,
          userAgent: config.userAgent,
        }, null, 2),
      },
    ],
  }),
);

server.registerTool(
  'workos_audit_query',
  {
    title: 'WorkOS Audit Query',
    description: 'Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows.',
    inputSchema: z.object({
      question: z.string(),
      rangeStart: z.string().optional(),
      rangeEnd: z.string().optional(),
      actions: z.array(z.string()).optional(),
      actorIds: z.array(z.string()).optional(),
      actorNames: z.array(z.string()).optional(),
      targets: z.array(z.string()).optional(),
      maxRows: z.number().int().min(1).max(MAX_QUERY_MAX_ROWS).optional(),
    }),
  },
  async ({ question, rangeStart, rangeEnd, actions, actorIds, actorNames, targets, maxRows }) => {
    try {
      const result = runHarnessJson('query', { question, rangeStart, rangeEnd, actions, actorIds, actorNames, targets, maxRows });
      return {
        content: [{ type: 'text', text: result.text }],
        structuredContent: result.details,
      };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: error.stderr?.toString?.() || error.message || String(error) }] };
    }

    const resolvedRangeEnd = rangeEnd ? new Date(rangeEnd) : new Date();
    if (Number.isNaN(resolvedRangeEnd.getTime())) {
      return { isError: true, content: [{ type: 'text', text: `Invalid rangeEnd: ${rangeEnd}` }] };
    }

    const resolvedRangeStart = rangeStart
      ? new Date(rangeStart)
      : new Date(resolvedRangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000);
    if (Number.isNaN(resolvedRangeStart.getTime())) {
      return { isError: true, content: [{ type: 'text', text: `Invalid rangeStart: ${rangeStart}` }] };
    }
    if (resolvedRangeStart.getTime() > resolvedRangeEnd.getTime()) {
      return { isError: true, content: [{ type: 'text', text: 'rangeStart must be before rangeEnd' }] };
    }

    const resolvedMaxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS, maxRows || DEFAULT_QUERY_MAX_ROWS));
    const filters = {
      organizationId: config.organizationId,
      rangeStart: resolvedRangeStart,
      rangeEnd: resolvedRangeEnd,
      ...(actions?.length ? { actions } : {}),
      ...(actorIds?.length ? { actorIds } : {}),
      ...(actorNames?.length ? { actorNames } : {}),
      ...(targets?.length ? { targets } : {}),
    };

    let auditExport = await workos.auditLogs.createExport(filters);
    const pollDeadline = Date.now() + EXPORT_POLL_TIMEOUT_MS;

    while (auditExport.state === 'pending') {
      if (Date.now() > pollDeadline) {
        return { isError: true, content: [{ type: 'text', text: `Timed out waiting for audit export ${auditExport.id}` }] };
      }
      await sleep(EXPORT_POLL_INTERVAL_MS);
      auditExport = await workos.auditLogs.getExport(auditExport.id);
    }

    if (auditExport.state !== 'ready' || !auditExport.url) {
      return { isError: true, content: [{ type: 'text', text: `Audit export ${auditExport.id} finished in unexpected state: ${auditExport.state}` }] };
    }

    const response = await fetch(auditExport.url);
    if (!response.ok) {
      return { isError: true, content: [{ type: 'text', text: `Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}` }] };
    }

    const csv = await response.text();
    const csvPath = path.join(os.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
    writeFileSync(csvPath, csv, 'utf8');

    const rows = parseAuditLogRows(csv)
      .sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''));
    const sampleRows = rows.slice(0, resolvedMaxRows);
    const actionSummary = summarizeCounts(rows.map((row) => row.action).filter(Boolean));
    const actorSummary = summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || 'unknown'));
    const targetSummary = summarizeCounts(rows.flatMap((row) => row.targets.map((target) => target.type || 'unknown')));

    const text = [
      `Question: ${question}`,
      `Range: ${resolvedRangeStart.toISOString()} → ${resolvedRangeEnd.toISOString()}`,
      `Export ID: ${auditExport.id}`,
      `Rows: ${rows.length}`,
      `Action counts: ${actionSummary}`,
      `Actor counts: ${actorSummary}`,
      `Target type counts: ${targetSummary}`,
      `Full CSV saved to: ${csvPath}`,
      rows.length === 0 ? 'No matching audit log rows found.' : `Sample rows (newest first, up to ${resolvedMaxRows}):`,
      ...sampleRows.map((row, index) => formatAuditLogRow(row, index)),
    ].join('\n\n');

    return {
      content: [{ type: 'text', text }],
      structuredContent: {
        question,
        exportId: auditExport.id,
        csvPath,
        rowCount: rows.length,
        sampledRowCount: sampleRows.length,
        counts: {
          actions: actionSummary,
          actors: actorSummary,
          targetTypes: targetSummary,
        },
        rows: sampleRows,
      },
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
