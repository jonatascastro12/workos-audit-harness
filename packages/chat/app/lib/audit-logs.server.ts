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
  /** True when the export exceeded the scan cap, so counts are partial. */
  truncated?: boolean;
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

/**
 * Streaming scan of an export CSV.
 *
 * An unfiltered week of a busy fleet is tens of megabytes and ~70k rows — read
 * with response.text() and parsed into an array that exceeds the Worker's
 * 128 MB limit, which killed the request mid-stream and left the UI spinning.
 * So the body is consumed a chunk at a time and nothing unbounded is retained:
 * only the newest `maxRows` events (the sample the model is given) plus the
 * per-value tallies, which are bounded by the number of distinct values.
 */
const MAX_SCANNED_ROWS = 200_000;

interface ScanResult {
  rowCount: number;
  rows: AuditLogRow[];
  actions: Map<string, number>;
  actors: Map<string, number>;
  targetTypes: Map<string, number>;
  /** True when the export was larger than MAX_SCANNED_ROWS and counts are partial. */
  truncated: boolean;
}

function tally(counts: Map<string, number>, value: string): void {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

/** Keep the sample bounded to the newest `limit` rows, without holding the rest. */
function keepNewest(rows: AuditLogRow[], row: AuditLogRow, limit: number): void {
  const stamp = row.occurredAt || "";
  if (rows.length >= limit && stamp <= (rows[rows.length - 1].occurredAt || "")) return;
  let low = 0;
  let high = rows.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if ((rows[mid].occurredAt || "") > stamp) low = mid + 1;
    else high = mid;
  }
  rows.splice(low, 0, row);
  if (rows.length > limit) rows.pop();
}

export async function scanAuditLogCsv(
  body: ReadableStream<Uint8Array>,
  maxRows: number,
): Promise<ScanResult> {
  const result: ScanResult = {
    rowCount: 0,
    rows: [],
    actions: new Map(),
    actors: new Map(),
    targetTypes: new Map(),
    truncated: false,
  };

  let header: string[] | null = null;
  let targetIndices: number[] = [];
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  // Carry-over for a record split across chunks. A record can span newlines
  // inside a quoted field, so completeness is tracked by quote parity.
  let pending = "";
  let quotes = 0;

  const handleRecord = (record: string): void => {
    if (!record.trim()) return;
    const fields = parseCsvRecord(record);
    if (!header) {
      header = fields;
      targetIndices = targetColumnIndices(header);
      return;
    }
    if (result.rowCount >= MAX_SCANNED_ROWS) {
      result.truncated = true;
      return;
    }
    const row = rowFromFields(header, fields, targetIndices);
    result.rowCount += 1;
    if (row.action) tally(result.actions, row.action);
    tally(result.actors, row.actor.id || row.actor.name || "unknown");
    for (const target of row.targets) tally(result.targetTypes, target.type || "unknown");
    keepNewest(result.rows, row, maxRows);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    let start = 0;
    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
      if (char === '"') quotes += 1;
      else if (char === "\n" && quotes % 2 === 0) {
        handleRecord(pending + value.slice(start, i));
        pending = "";
        start = i + 1;
      }
    }
    pending += value.slice(start);
    // Guard against a pathological unterminated quote growing without bound.
    if (pending.length > 5_000_000) {
      result.truncated = true;
      pending = "";
      quotes = 0;
    }
  }
  handleRecord(pending);

  return result;
}

/** Split one CSV record into fields, honouring quotes and escaped quotes. */
function parseCsvRecord(record: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < record.length; i += 1) {
    const char = record[i];
    if (inQuotes) {
      if (char === '"') {
        if (record[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") {
      fields.push(field);
      field = "";
    } else if (char !== "\r") field += char;
  }
  fields.push(field);
  return fields;
}

function targetColumnIndices(header: string[]): number[] {
  return [
    ...new Set(
      header.flatMap((column) => {
        const match = column.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
        return match ? [Number(match[1])] : [];
      }),
    ),
  ].sort((a, b) => a - b);
}

function rowFromFields(header: string[], fields: string[], targetIndices: number[]): AuditLogRow {
  const raw: Record<string, string> = {};
  for (let i = 0; i < header.length; i += 1) raw[header[i]] = fields[i] || "";
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
}

function formatCounts(counts: Map<string, number>): string {
  if (counts.size === 0) return "none";
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 40)
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

export interface WorkOSOrganization {
  id: string;
  name: string;
}

/**
 * List every organization in the API key's environment (paginated). The user
 * picks which org's audit logs to investigate.
 */
export async function listOrganizations(apiKey: string): Promise<WorkOSOrganization[]> {
  const organizations: WorkOSOrganization[] = [];
  let after: string | undefined;
  do {
    const params = new URLSearchParams({ limit: "100", order: "asc" });
    if (after) params.set("after", after);
    const response = await workosFetch(apiKey, `/organizations?${params.toString()}`);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`List organizations failed (${response.status}): ${body.slice(0, 500)}`);
    }
    const page = (await response.json()) as {
      data: { id: string; name: string }[];
      list_metadata?: { after?: string | null };
    };
    for (const org of page.data) organizations.push({ id: org.id, name: org.name });
    after = page.list_metadata?.after ?? undefined;
  } while (after);
  return organizations;
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

  let scan: ScanResult = {
    rowCount: 0,
    rows: [],
    actions: new Map(),
    actors: new Map(),
    targetTypes: new Map(),
    truncated: false,
  };
  if (auditExport.state !== "empty") {
    if (auditExport.state !== "ready" || !auditExport.url) {
      throw new Error(
        `Audit export ${auditExport.id} finished in unexpected state: ${auditExport.state}`,
      );
    }
    const download = await fetch(auditExport.url);
    if (!download.ok) throw new Error(`Audit export download failed (${download.status})`);
    if (!download.body) throw new Error("Audit export download returned no body");
    scan = await scanAuditLogCsv(download.body, maxRows);
  }

  const sampleRows = scan.rows.map((row) => ({
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
    rowCount: scan.rowCount,
    sampledRowCount: sampleRows.length,
    truncated: scan.truncated,
    counts: {
      actions: formatCounts(scan.actions),
      actors: formatCounts(scan.actors),
      targetTypes: formatCounts(scan.targetTypes),
    },
    rows: sampleRows,
  };
}
