import os from 'node:os';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { stableSerialize } from './util.mjs';
import {
  createSdk,
  ensureOrganization,
  parseJson,
  runWorkos,
} from './workos-client.mjs';

export const DEFAULT_QUERY_RANGE_DAYS = 7;
export const DEFAULT_QUERY_MAX_ROWS = 50;
export const MAX_QUERY_MAX_ROWS = 200;
const EXPORT_POLL_INTERVAL_MS = 1500;
const EXPORT_POLL_TIMEOUT_MS = 60_000;

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

export function parseCsv(csv) {
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

export function parseAuditLogRows(csv) {
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
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([value, count]) => `${value}=${count}`)
    .join(', ');
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

function isNoEventsError(error) {
  const message = (error?.message || '').toLowerCase();
  return message.includes('no audit log events found');
}

async function createExport(config, filters) {
  const workos = createSdk(config);
  if (workos) {
    let auditExport;
    try {
      auditExport = await workos.auditLogs.createExport({
        organizationId: filters.organizationId,
        rangeStart: new Date(filters.rangeStart),
        rangeEnd: new Date(filters.rangeEnd),
        ...(filters.actions?.length ? { actions: filters.actions } : {}),
        ...(filters.actorNames?.length ? { actorNames: filters.actorNames } : {}),
        ...(filters.actorIds?.length ? { actorIds: filters.actorIds } : {}),
        ...(filters.targets?.length ? { targets: filters.targets } : {}),
      });
    } catch (error) {
      if (isNoEventsError(error)) return { id: null, state: 'empty', url: null };
      throw error;
    }
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

export async function queryAuditLogs(config, params = {}) {
  const organizationId = await ensureOrganization(config);
  const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date();
  if (Number.isNaN(rangeEnd.getTime())) throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);
  const rangeStart = params.rangeStart
    ? new Date(params.rangeStart)
    : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000);
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
  let csv = '';
  let csvPath = null;
  if (auditExport.state === 'empty') {
    csvPath = path.join(os.tmpdir(), `workos-audit-export-empty-${Date.now()}.csv`);
    writeFileSync(csvPath, csv, 'utf8');
  } else {
    if (auditExport.state !== 'ready' || !auditExport.url) {
      throw new Error(`Audit export ${auditExport.id || '(unknown)'} finished in unexpected state: ${auditExport.state}`);
    }
    const response = await fetch(auditExport.url);
    if (!response.ok) throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
    csv = await response.text();
    csvPath = path.join(os.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
    writeFileSync(csvPath, csv, 'utf8');
  }
  const rows = parseAuditLogRows(csv).sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''));
  const sampleRows = rows.slice(0, maxRows);
  const actionSummary = summarizeCounts(rows.map((row) => row.action).filter(Boolean));
  const actorSummary = summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || 'unknown'));
  const targetSummary = summarizeCounts(rows.flatMap((row) => row.targets.map((target) => target.type || 'unknown')));
  const text = [
    `Question: ${params.question || '(not provided)'}`,
    `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
    `Export ID: ${auditExport.id || '(none - no matching events)'}`,
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
