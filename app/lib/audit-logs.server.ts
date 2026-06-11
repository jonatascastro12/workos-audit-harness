/**
 * WorkOS Audit Logs Export API client for the Workers runtime.
 *
 * Ported from packages/audit-core/src/audit-query.mjs in workos/workos-audit-harness:
 * create an export, poll until ready, download the CSV, and reshape rows into
 * structured events the model can reason over.
 */

const WORKOS_API = "https://api.workos.com";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;

export const DEFAULT_MAX_ROWS = 50;
export const MAX_MAX_ROWS = 200;

export const HARNESS_PREFIXES = ["claude", "codex", "openclaw", "pi"] as const;

export const KNOWN_ACTION_SUFFIXES = [
  "session.started",
  "session.ended",
  "session.shutdown",
  "input.received",
  "agent.started",
  "agent.completed",
  "prompt.submitted",
  "message.sent",
  "message.finalized",
  "tool.called",
  "tool.completed",
  "tool.failed",
  "permission.requested",
  "turn.completed",
  "turn.failed",
  "user_bash.executed",
  "model.selected",
] as const;

export interface AuditLogTarget {
  id?: string;
  type?: string;
  name?: string;
  metadata?: unknown;
}

export interface AuditLogRow {
  occurredAt?: string;
  action: string;
  actor: { id?: string; type?: string; name?: string; metadata?: unknown };
  context: { location?: string; userAgent?: string };
  targets: AuditLogTarget[];
  metadata?: unknown;
}

export interface AuditQueryFilters {
  rangeStart: string;
  rangeEnd: string;
  actions?: string[];
  actorIds?: string[];
  actorNames?: string[];
  targets?: string[];
}

export interface AuditQueryResult {
  filters: AuditQueryFilters;
  rowCount: number;
  sampledRowCount: number;
  counts: { actions: string; actors: string; targetTypes: string };
  rows: AuditLogRow[];
}

interface AuditExport {
  id: string | null;
  state: "pending" | "ready" | "error" | "empty";
  url: string | null;
}

export function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ""));
}

function parseJsonValue(value: string | undefined): unknown {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export function parseAuditLogRows(csv: string): AuditLogRow[] {
  const parsed = parseCsv(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow?.length) return [];
  const targetIndices = [
    ...new Set(
      headerRow.flatMap((header) => {
        const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
        return match ? [Number(match[1])] : [];
      }),
    ),
  ].sort((a, b) => a - b);
  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(
      headerRow.map((header, index) => [header, dataRow[index] || ""]),
    );
    const targets = targetIndices
      .map((index) => ({
        id: raw[`target_id_${index}`] || undefined,
        type: raw[`target_type_${index}`] || undefined,
        name: raw[`target_name_${index}`] || undefined,
        metadata: parseJsonValue(raw[`target_metadata_${index}`]),
      }))
      .filter((target) => target.id || target.type || target.name || target.metadata !== undefined);
    return {
      action: raw.action || "",
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
    };
  });
}

function summarizeCounts(values: string[]): string {
  if (values.length === 0) return "none";
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => `${value}=${count}`)
    .join(", ");
}

function truncateMetadata(value: unknown, maxLength = 400): unknown {
  if (value === undefined || value === null) return undefined;
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  if (raw.length <= maxLength) return value;
  return `${raw.slice(0, maxLength - 3)}...`;
}

async function workosFetch(apiKey: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${WORKOS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

async function createExport(
  apiKey: string,
  organizationId: string,
  filters: AuditQueryFilters,
): Promise<AuditExport> {
  const response = await workosFetch(apiKey, "/audit_logs/exports", {
    method: "POST",
    body: JSON.stringify({
      organization_id: organizationId,
      range_start: filters.rangeStart,
      range_end: filters.rangeEnd,
      ...(filters.actions?.length ? { actions: filters.actions } : {}),
      ...(filters.actorNames?.length ? { actor_names: filters.actorNames } : {}),
      ...(filters.actorIds?.length ? { actor_ids: filters.actorIds } : {}),
      ...(filters.targets?.length ? { targets: filters.targets } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    if (/no audit log events found/i.test(body)) return { id: null, state: "empty", url: null };
    throw new Error(`Audit export create failed (${response.status}): ${body.slice(0, 500)}`);
  }
  let auditExport = (await response.json()) as AuditExport;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (auditExport.state === "pending") {
    if (Date.now() > deadline)
      throw new Error(`Timed out waiting for audit export ${auditExport.id}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const poll = await workosFetch(apiKey, `/audit_logs/exports/${auditExport.id}`);
    if (!poll.ok) throw new Error(`Audit export poll failed (${poll.status})`);
    auditExport = (await poll.json()) as AuditExport;
  }
  return auditExport;
}

export async function queryAuditLogs(
  apiKey: string,
  organizationId: string,
  params: {
    rangeStart?: string;
    rangeEnd?: string;
    actions?: string[];
    actorIds?: string[];
    actorNames?: string[];
    targets?: string[];
    maxRows?: number;
  },
): Promise<AuditQueryResult> {
  const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date();
  if (Number.isNaN(rangeEnd.getTime())) throw new Error(`Invalid range_end: ${params.rangeEnd}`);
  const rangeStart = params.rangeStart
    ? new Date(params.rangeStart)
    : new Date(rangeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(rangeStart.getTime()))
    throw new Error(`Invalid range_start: ${params.rangeStart}`);
  if (rangeStart.getTime() > rangeEnd.getTime())
    throw new Error("range_start must be before range_end");

  const filters: AuditQueryFilters = {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    actions: params.actions,
    actorIds: params.actorIds,
    actorNames: params.actorNames,
    targets: params.targets,
  };
  const maxRows = Math.max(1, Math.min(MAX_MAX_ROWS, params.maxRows || DEFAULT_MAX_ROWS));

  const auditExport = await createExport(apiKey, organizationId, filters);
  let csv = "";
  if (auditExport.state !== "empty") {
    if (auditExport.state !== "ready" || !auditExport.url) {
      throw new Error(
        `Audit export ${auditExport.id} finished in unexpected state: ${auditExport.state}`,
      );
    }
    const download = await fetch(auditExport.url);
    if (!download.ok) throw new Error(`Audit export download failed (${download.status})`);
    csv = await download.text();
  }

  const rows = parseAuditLogRows(csv).sort((a, b) =>
    (b.occurredAt || "").localeCompare(a.occurredAt || ""),
  );
  const sampleRows = rows.slice(0, maxRows).map((row) => ({
    ...row,
    metadata: truncateMetadata(row.metadata),
    actor: { ...row.actor, metadata: truncateMetadata(row.actor.metadata, 200) },
    targets: row.targets.map((target) => ({
      ...target,
      metadata: truncateMetadata(target.metadata, 200),
    })),
  }));

  return {
    filters,
    rowCount: rows.length,
    sampledRowCount: sampleRows.length,
    counts: {
      actions: summarizeCounts(rows.map((row) => row.action).filter(Boolean)),
      actors: summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || "unknown")),
      targetTypes: summarizeCounts(
        rows.flatMap((row) => row.targets.map((target) => target.type || "unknown")),
      ),
    },
    rows: sampleRows,
  };
}
