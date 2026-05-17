// index.ts
import os4 from "node:os";
import path4 from "node:path";
import { execFileSync as execFileSync2 } from "node:child_process";
import { chmodSync, existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, rmSync as rmSync2, writeFileSync as writeFileSync3 } from "node:fs";
import { createHash } from "node:crypto";
import { WorkOS as WorkOS2 } from "@workos-inc/node";
import { Type } from "typebox";

// ../audit-core/src/cli/emit-event.mjs
import { randomUUID } from "node:crypto";

// ../audit-core/src/workos-client.mjs
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { Entry } from "@napi-rs/keyring";
import { WorkOS } from "@workos-inc/node";

// ../audit-core/src/util.mjs
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function stableSerialize(value) {
  if (value === null || value === undefined)
    return "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableSerialize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

// ../audit-core/src/workos-client.mjs
var DEFAULT_API_BASE_URL = "https://api.workos.com";
var DEFAULT_ORGANIZATION_NAME = "Audit Log Harness";
var USER_AGENT = "workos-audit-harness/1";
function parseJson(text, fallback = {}) {
  if (!text || !text.trim())
    return fallback;
  return JSON.parse(text);
}
function getWorkosCommandPrefix() {
  const configured = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_BIN);
  if (configured)
    return [configured];
  try {
    const found = execFileSync("bash", ["-lc", "command -v workos"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (found)
      return [found];
  } catch {}
  return ["npx", "--yes", "workos@latest"];
}
function runWorkos(args, options = {}) {
  const [bin, ...prefixArgs] = getWorkosCommandPrefix();
  return execFileSync(bin, [...prefixArgs, ...args], {
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
    input: options.input,
    env: { ...process.env, NO_COLOR: "1" }
  });
}
function readWorkosCliConfig() {
  try {
    const raw = new Entry("workos-cli", "config").getPassword();
    if (raw)
      return JSON.parse(raw);
  } catch {}
  try {
    const filePath = path.join(os.homedir(), ".workos", "config.json");
    if (existsSync(filePath))
      return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {}
  return null;
}
function getWorkosCliActiveEnvironment() {
  const cliConfig = readWorkosCliConfig();
  if (!cliConfig?.activeEnvironment)
    return;
  return cliConfig.environments?.[cliConfig.activeEnvironment];
}
function getEffectiveApiKey(config) {
  return config.apiKey || getWorkosCliActiveEnvironment()?.apiKey;
}
function createSdk(config) {
  const apiKey = getEffectiveApiKey(config);
  if (!apiKey)
    return;
  const url = new URL(config.apiBaseUrl || DEFAULT_API_BASE_URL);
  return new WorkOS(apiKey, {
    apiHostname: url.hostname,
    ...url.port ? { port: Number(url.port) } : {},
    ...url.protocol === "http:" ? { https: false } : {}
  });
}
function apiUrl(config, pathname) {
  return new URL(pathname, config.apiBaseUrl || DEFAULT_API_BASE_URL).toString();
}
function pickOrganizationId(value) {
  return value?.id || value?.data?.id || value?.organization?.id;
}
async function retry(operation, label, attempts = 3) {
  let lastError;
  for (let attempt = 1;attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts)
        break;
      const message = error.stderr?.toString?.().trim() || error.message || String(error);
      process.stderr.write(`Retrying ${label} after failure (${attempt}/${attempts}): ${message}
`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}
async function ensureOrganization(config) {
  if (config.organizationId)
    return config.organizationId;
  const name = config.organizationName || DEFAULT_ORGANIZATION_NAME;
  const workos = createSdk(config);
  if (workos) {
    const page = await retry(() => workos.organizations.listOrganizations({ limit: 100 }), "organization list");
    const existing2 = page.data?.find((organization) => organization.name === name);
    if (existing2?.id)
      return existing2.id;
    const created2 = await retry(() => workos.organizations.createOrganization({ name }), `organization create ${name}`);
    return created2.id;
  }
  const list = await retry(() => parseJson(runWorkos(["organization", "list", "--json", "--mode", "agent"])), "organization list");
  const existing = list.data?.find((organization) => organization.name === name);
  if (existing?.id)
    return existing.id;
  const created = await retry(() => parseJson(runWorkos(["organization", "create", name, "--json", "--mode", "agent"])), `organization create ${name}`);
  const id = pickOrganizationId(created);
  if (!id)
    throw new Error(`Created organization ${name}, but could not find its id in WorkOS CLI output.`);
  return id;
}

// ../audit-core/src/cli/emit-event.mjs
function toRestEvent(event) {
  const { occurredAt, occurred_at, context, actor, targets, ...rest } = event;
  const normalizedContext = context ? {
    location: context.location,
    user_agent: context.user_agent || context.userAgent
  } : undefined;
  return {
    ...rest,
    actor: actor ? { ...actor, metadata: actor.metadata || {} } : actor,
    targets: (targets || []).map((target) => ({ ...target, metadata: target.metadata || {} })),
    occurred_at: occurred_at || occurredAt || new Date().toISOString(),
    ...normalizedContext ? { context: normalizedContext } : {}
  };
}
async function emitEvent(event, config) {
  const orgId = await ensureOrganization(config);
  const effectiveApiKey = getEffectiveApiKey(config);
  if (effectiveApiKey) {
    const response = await fetch(apiUrl(config, "/audit_logs/events"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
        "User-Agent": USER_AGENT
      },
      body: JSON.stringify({ organization_id: orgId, event: toRestEvent(event) })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`WorkOS audit event failed: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ""}`);
    }
    return { ok: true, transport: "api-key", organizationId: orgId, action: event.action };
  }
  const occurredAt = event.occurredAt || event.occurred_at || new Date().toISOString();
  const context = event.context ? { location: event.context.location, user_agent: event.context.user_agent || event.context.userAgent } : { location: "unknown" };
  const args = [
    "audit-log",
    "create-event",
    orgId,
    "--action",
    event.action,
    "--actor-type",
    event.actor?.type || "user",
    "--actor-id",
    event.actor?.id || "unknown"
  ];
  if (event.actor?.name)
    args.push("--actor-name", event.actor.name);
  args.push("--occurred-at", new Date(occurredAt).toISOString(), "--targets", JSON.stringify(event.targets || []), "--context", JSON.stringify(context), "--metadata", JSON.stringify(event.metadata || {}), "--json", "--mode", "agent");
  runWorkos(args);
  return { ok: true, transport: "workos-cli", organizationId: orgId, action: event.action };
}

// ../audit-core/src/audit-query.mjs
import os2 from "node:os";
import path2 from "node:path";
import { writeFileSync } from "node:fs";
var DEFAULT_QUERY_RANGE_DAYS = 7;
var DEFAULT_QUERY_MAX_ROWS = 50;
var MAX_QUERY_MAX_ROWS = 200;
var EXPORT_POLL_INTERVAL_MS = 1500;
var EXPORT_POLL_TIMEOUT_MS = 60000;
function parseJsonValue(value) {
  if (!value)
    return;
  const trimmed = value.trim();
  if (!trimmed)
    return;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}
function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0;i < csv.length; i += 1) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else
          inQuotes = false;
      } else
        field += char;
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
    if (char === `
`) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r")
      field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ""));
}
function parseAuditLogRows(csv) {
  const parsed = parseCsv(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow?.length)
    return [];
  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);
  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || ""]));
    const targets = targetIndices.map((index) => ({
      id: raw[`target_id_${index}`] || undefined,
      type: raw[`target_type_${index}`] || undefined,
      name: raw[`target_name_${index}`] || undefined,
      metadata: parseJsonValue(raw[`target_metadata_${index}`])
    })).filter((target) => target.id || target.type || target.name || target.metadata !== undefined);
    return {
      action: raw.action || "",
      occurredAt: raw.occurred_at || undefined,
      actor: {
        id: raw.actor_id || undefined,
        type: raw.actor_type || undefined,
        name: raw.actor_name || undefined,
        metadata: parseJsonValue(raw.actor_metadata)
      },
      context: {
        location: raw.context_location || undefined,
        userAgent: raw.context_user_agent || undefined
      },
      metadata: parseJsonValue(raw.metadata),
      targets,
      raw
    };
  });
}
function truncate(value, maxLength = 280) {
  if (value === undefined || value === null)
    return;
  const raw = typeof value === "string" ? value : stableSerialize(value);
  if (raw.length <= maxLength)
    return raw;
  return `${raw.slice(0, maxLength - 3)}...`;
}
function summarizeCounts(values) {
  if (values.length === 0)
    return "none";
  const counts = new Map;
  for (const value of values)
    counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([value, count]) => `${value}=${count}`).join(", ");
}
function formatAuditLogRow(row, index) {
  const targets = row.targets.length > 0 ? row.targets.map((target) => `${target.type || "unknown"}:${target.id || target.name || "unknown"}`).join(", ") : "none";
  const metadata = truncate(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || "unknown time"} | action=${row.action}`,
    `   actor=${row.actor.type || "unknown"}:${row.actor.id || row.actor.name || "unknown"}`,
    `   targets=${targets}`,
    metadata ? `   metadata=${metadata}` : undefined
  ].filter(Boolean).join(`
`);
}
function isNoEventsError(error) {
  const message = (error?.message || "").toLowerCase();
  return message.includes("no audit log events found");
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
        ...filters.actions?.length ? { actions: filters.actions } : {},
        ...filters.actorNames?.length ? { actorNames: filters.actorNames } : {},
        ...filters.actorIds?.length ? { actorIds: filters.actorIds } : {},
        ...filters.targets?.length ? { targets: filters.targets } : {}
      });
    } catch (error) {
      if (isNoEventsError(error))
        return { id: null, state: "empty", url: null };
      throw error;
    }
    const deadline = Date.now() + EXPORT_POLL_TIMEOUT_MS;
    while (auditExport.state === "pending") {
      if (Date.now() > deadline)
        throw new Error(`Timed out waiting for audit export ${auditExport.id}`);
      await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_INTERVAL_MS));
      auditExport = await workos.auditLogs.getExport(auditExport.id);
    }
    return auditExport;
  }
  const args = [
    "audit-log",
    "export",
    "--org",
    filters.organizationId,
    "--range-start",
    filters.rangeStart,
    "--range-end",
    filters.rangeEnd,
    "--json",
    "--mode",
    "agent"
  ];
  if (filters.actions?.length)
    args.push("--actions", filters.actions.join(","));
  if (filters.actorNames?.length)
    args.push("--actor-names", filters.actorNames.join(","));
  if (filters.actorIds?.length)
    args.push("--actor-ids", filters.actorIds.join(","));
  if (filters.targets?.length)
    args.push("--targets", filters.targets.join(","));
  return parseJson(runWorkos(args));
}
async function queryAuditLogs(config, params = {}) {
  const organizationId = await ensureOrganization(config);
  const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date;
  if (Number.isNaN(rangeEnd.getTime()))
    throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);
  const rangeStart = params.rangeStart ? new Date(params.rangeStart) : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000);
  if (Number.isNaN(rangeStart.getTime()))
    throw new Error(`Invalid rangeStart: ${params.rangeStart}`);
  if (rangeStart.getTime() > rangeEnd.getTime())
    throw new Error("rangeStart must be before rangeEnd");
  const maxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS, params.maxRows || DEFAULT_QUERY_MAX_ROWS));
  const filters = {
    organizationId,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    actions: params.actions || [],
    actorIds: params.actorIds || [],
    actorNames: params.actorNames || [],
    targets: params.targets || []
  };
  const auditExport = await createExport(config, filters);
  let csv = "";
  let csvPath = null;
  if (auditExport.state === "empty") {
    csvPath = path2.join(os2.tmpdir(), `workos-audit-export-empty-${Date.now()}.csv`);
    writeFileSync(csvPath, csv, "utf8");
  } else {
    if (auditExport.state !== "ready" || !auditExport.url) {
      throw new Error(`Audit export ${auditExport.id || "(unknown)"} finished in unexpected state: ${auditExport.state}`);
    }
    const response = await fetch(auditExport.url);
    if (!response.ok)
      throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
    csv = await response.text();
    csvPath = path2.join(os2.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
    writeFileSync(csvPath, csv, "utf8");
  }
  const rows = parseAuditLogRows(csv).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
  const sampleRows = rows.slice(0, maxRows);
  const actionSummary = summarizeCounts(rows.map((row) => row.action).filter(Boolean));
  const actorSummary = summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || "unknown"));
  const targetSummary = summarizeCounts(rows.flatMap((row) => row.targets.map((target) => target.type || "unknown")));
  const text = [
    `Question: ${params.question || "(not provided)"}`,
    `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
    `Export ID: ${auditExport.id || "(none - no matching events)"}`,
    `Rows: ${rows.length}`,
    `Action counts: ${actionSummary}`,
    `Actor counts: ${actorSummary}`,
    `Target type counts: ${targetSummary}`,
    `Full CSV saved to: ${csvPath}`,
    rows.length === 0 ? "No matching audit log rows found." : `Sample rows (newest first, up to ${maxRows}):`,
    ...sampleRows.map((row, index) => formatAuditLogRow(row, index))
  ].join(`

`);
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
      rows: sampleRows
    }
  };
}

// ../audit-core/src/cli/schema.mjs
import os3 from "node:os";
import path3 from "node:path";
import { mkdtempSync, rmSync, writeFileSync as writeFileSync2 } from "node:fs";
async function createSchema(config, schema) {
  if (!schema?.action)
    throw new Error("Schema must include action.");
  const body = { actor: schema.actor, targets: schema.targets, metadata: schema.metadata };
  const workos = createSdk(config);
  if (workos) {
    return await retry(() => workos.auditLogs.createSchema({ action: schema.action, ...body }), `schema ${schema.action}`);
  }
  const tmpDir = mkdtempSync(path3.join(os3.tmpdir(), "workos-audit-harness-"));
  const schemaPath = path3.join(tmpDir, "schema.json");
  try {
    writeFileSync2(schemaPath, JSON.stringify(body, null, 2), "utf8");
    return await retry(() => parseJson(runWorkos(["audit-log", "create-schema", schema.action, "--file", schemaPath, "--json", "--mode", "agent"])), `schema ${schema.action}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ../audit-core/src/harness-audit-schemas.mjs
var TOKEN_METADATA = {
  turn_input_tokens: "number",
  turn_output_tokens: "number",
  turn_cache_creation_input_tokens: "number",
  turn_cache_read_input_tokens: "number",
  turn_total_tokens: "number",
  turn_model_calls: "number",
  session_input_tokens: "number",
  session_output_tokens: "number",
  session_cache_creation_input_tokens: "number",
  session_cache_read_input_tokens: "number",
  session_total_tokens: "number",
  session_model_calls: "number"
};
var COMMON_METADATA = {
  harness: "string",
  harness_version: "string",
  agent: "string",
  source: "string",
  cwd: "string",
  transcript_path: "string",
  permission_mode: "string",
  model: "string",
  turn_id: "string",
  reason: "string",
  error_type: "string",
  session_file: "string",
  previous_session_file: "string",
  target_session_file: "string",
  message_role: "string",
  role: "string",
  message_length: "number",
  message_sha256: "string",
  message_preview: "string",
  text_length: "number",
  text_sha256: "string",
  text_preview: "string",
  text_truncated: "boolean",
  content_length: "number",
  content_sha256: "string",
  has_images: "boolean",
  image_count: "number",
  tool_call_count: "number",
  custom_type: "string",
  system_prompt_sha256: "string",
  turn_count: "number",
  assistant_message_count: "number",
  tool_result_count: "number",
  status: "string"
};
var PROMPT_METADATA = {
  prompt_length: "number",
  prompt_sha256: "string",
  prompt_preview: "string"
};
var TOOL_METADATA = {
  tool_name: "string",
  tool_use_id: "string",
  tool_call_id: "string",
  tool_input_sha256: "string",
  tool_input_bytes: "number",
  input_sha256: "string",
  input_bytes: "number",
  command_preview: "string",
  command_truncated: "boolean",
  blocked: "boolean",
  duration_ms: "number",
  is_error: "boolean",
  result_sha256: "string",
  result_bytes: "number",
  error_preview: "string",
  error_sha256: "string"
};
var TURN_METADATA = {
  last_assistant_message_length: "number",
  last_assistant_message_sha256: "string",
  stop_hook_active: "boolean",
  input_tokens: "number",
  output_tokens: "number",
  total_tokens: "number",
  ...TOKEN_METADATA
};
var SESSION_TARGET = { type: "session" };
var MESSAGE_TARGET = { type: "message", metadata: { role: "string" } };
var TOOL_TARGET = { type: "tool", metadata: { tool_name: "string" } };
var MODEL_TARGET = { type: "model", metadata: { model: "string", provider: "string", model_id: "string" } };
var COMMAND_TARGET = { type: "command" };
function getHarnessAuditSchemaDefinitions(prefix = "harness") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Generic coding-agent session start/resume event.",
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA }
    },
    {
      action: `${prefix}.session.ended`,
      note: "Generic coding-agent session end event.",
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.session.shutdown`,
      note: "Generic coding-agent session shutdown event.",
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.input.received`,
      note: "Generic user/input event accepted by a harness.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA, ...PROMPT_METADATA }
    },
    {
      action: `${prefix}.agent.started`,
      note: "Generic agent/model turn start event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.agent.completed`,
      note: "Generic agent/model turn completion event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "Generic user prompt submission event.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA, ...PROMPT_METADATA }
    },
    {
      action: `${prefix}.message.sent`,
      note: "Generic message lifecycle event.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA }
    },
    {
      action: `${prefix}.message.finalized`,
      note: "Generic message finalized event.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Generic tool-call start event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.permission.requested`,
      note: "Generic permission/escalation request event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "Generic successful tool-call result event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "Generic failed/error tool-call result event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Generic assistant response turn completion event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "Generic assistant response turn failure event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.user_bash.executed`,
      note: "Generic user-initiated shell command event.",
      targets: [SESSION_TARGET, COMMAND_TARGET],
      metadata: {
        ...COMMON_METADATA,
        exclude_from_context: "boolean",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean",
        exit_code: "number",
        duration_ms: "number"
      }
    },
    {
      action: `${prefix}.model.selected`,
      note: "Generic model selection/change event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: {
        ...COMMON_METADATA,
        provider: "string",
        model_id: "string",
        previous_provider: "string",
        previous_model: "string",
        previous_model_id: "string",
        thinking_level: "string"
      }
    }
  ];
}

// index.ts
var CONFIG_KEYS = ["apiKey", "organizationId", "actorId", "actorType", "actorName", "location", "userAgent"];
var EXTENSION_STATUS_KEY = "workos-audit";
var USER_AGENT2 = "pi-workos-audit-logs/1";
var DEFAULT_QUERY_RANGE_DAYS2 = 7;
var DEFAULT_QUERY_MAX_ROWS2 = 50;
var MAX_QUERY_MAX_ROWS2 = 200;
var EXPORT_POLL_INTERVAL_MS2 = 1500;
var EXPORT_POLL_TIMEOUT_MS2 = 60000;
var detectedActorCache;
function getConfigFilePath() {
  return process.env.PI_WORKOS_AUDIT_LOGS_CONFIG_PATH || path4.join(os4.homedir(), ".pi", "agent", "extensions", "workos-audit-logs", "config.json");
}
function sanitizeStoredConfig(raw) {
  if (!raw || typeof raw !== "object")
    return {};
  const config = {};
  for (const key of CONFIG_KEYS) {
    const value = raw[key];
    if (typeof value === "string" && value.trim())
      config[key] = value;
  }
  const enabled = parseBooleanValue(raw.enabled);
  if (enabled !== undefined)
    config.enabled = enabled;
  return config;
}
function readStoredConfig() {
  const filePath = getConfigFilePath();
  if (!existsSync2(filePath))
    return {};
  try {
    return sanitizeStoredConfig(JSON.parse(readFileSync2(filePath, "utf8")));
  } catch {
    return {};
  }
}
function writeStoredConfig(config) {
  const filePath = getConfigFilePath();
  mkdirSync(path4.dirname(filePath), { recursive: true, mode: 448 });
  writeFileSync3(filePath, `${JSON.stringify(config, null, 2)}
`, { mode: 384 });
  chmodSync(filePath, 384);
}
function clearStoredConfig() {
  rmSync2(getConfigFilePath(), { force: true });
}
function maskSecret(value) {
  if (!value)
    return;
  if (value.length <= 8)
    return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
function parseConfigKey(value) {
  const normalized = value.trim();
  return CONFIG_KEYS.find((key) => key === normalized);
}
function summarizeStoredConfig(config, stored) {
  const detectedActor = getDetectedActor();
  return JSON.stringify({
    configPath: getConfigFilePath(),
    runtimeEnabled: config.enabled,
    loggingEnabled: config.loggingEnabled,
    configured: config.configured,
    apiKey: maskSecret(config.apiKey),
    organizationId: config.organizationId,
    actorId: config.actorId,
    actorType: config.actorType,
    actorName: config.actorName,
    location: config.location,
    userAgent: config.userAgent,
    sources: {
      loggingEnabled: process.env.PI_WORKOS_AUDIT_LOGS_ENABLED ? "env" : stored.enabled !== undefined ? "file" : "default",
      apiKey: process.env.PI_WORKOS_AUDIT_LOGS_API_KEY || process.env.WORKOS_API_KEY ? "env" : stored.apiKey ? "file" : undefined,
      organizationId: process.env.PI_WORKOS_AUDIT_LOGS_ORGANIZATION_ID ? "env" : stored.organizationId ? "file" : undefined,
      actorId: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_ID ? "env" : stored.actorId ? "file" : detectedActor.actorId ? "machine" : "default",
      actorType: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_TYPE ? "env" : stored.actorType ? "file" : "machine",
      actorName: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_NAME ? "env" : stored.actorName ? "file" : detectedActor.actorName ? "machine" : undefined,
      location: process.env.PI_WORKOS_AUDIT_LOGS_LOCATION ? "env" : stored.location ? "file" : "default",
      userAgent: process.env.PI_WORKOS_AUDIT_LOGS_USER_AGENT ? "env" : stored.userAgent ? "file" : "default"
    }
  }, null, 2);
}
function stableSerialize2(value) {
  if (value === null || value === undefined)
    return "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableSerialize2).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize2(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}
function sha256(value) {
  return createHash("sha256").update(stableSerialize2(value)).digest("hex");
}
function byteLength(value) {
  return Buffer.byteLength(stableSerialize2(value), "utf8");
}
function truncateMetadataString(value, maxLength = 500) {
  if (value.length <= maxLength)
    return value;
  if (maxLength <= 3)
    return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}
function compactMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}
function trimToUndefined2(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function parseBooleanValue(value) {
  if (typeof value === "boolean")
    return value;
  if (typeof value !== "string")
    return;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized))
    return true;
  if (["0", "false", "no", "off"].includes(normalized))
    return false;
  return;
}
function getOsUsername() {
  try {
    return trimToUndefined2(process.env.USER || process.env.USERNAME || os4.userInfo().username);
  } catch {
    return trimToUndefined2(process.env.USER || process.env.USERNAME);
  }
}
function runCommand(command, args) {
  try {
    return trimToUndefined2(execFileSync2(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }));
  } catch {
    return;
  }
}
function getGitConfigValue(key) {
  return runCommand("git", ["config", "--get", key]) || runCommand("git", ["config", "--global", "--get", key]);
}
function getMacFullName() {
  return process.platform === "darwin" ? runCommand("id", ["-F"]) : undefined;
}
function getDetectedActor() {
  if (detectedActorCache)
    return detectedActorCache;
  const username = getOsUsername();
  const actorType = process.env.CI ? "system" : "user";
  const actorId = trimToUndefined2(actorType === "user" ? getGitConfigValue("user.email") || process.env.EMAIL || username || os4.hostname() : process.env.GITHUB_ACTOR || process.env.BUILDKITE_BUILD_CREATOR || process.env.CI_ACTOR || username || os4.hostname());
  const actorName = trimToUndefined2(actorType === "user" ? getGitConfigValue("user.name") || process.env.GIT_AUTHOR_NAME || process.env.GIT_COMMITTER_NAME || process.env.NAME || process.env.FULLNAME || getMacFullName() || username : os4.hostname());
  detectedActorCache = {
    actorId,
    actorType,
    actorName
  };
  return detectedActorCache;
}
function getConfig() {
  const stored = readStoredConfig();
  const detectedActor = getDetectedActor();
  const apiKey = process.env.PI_WORKOS_AUDIT_LOGS_API_KEY || process.env.WORKOS_API_KEY || stored.apiKey;
  const organizationId = process.env.PI_WORKOS_AUDIT_LOGS_ORGANIZATION_ID || stored.organizationId;
  const loggingEnabled = parseBooleanValue(process.env.PI_WORKOS_AUDIT_LOGS_ENABLED) ?? stored.enabled ?? true;
  const actorId = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_ID || stored.actorId || detectedActor.actorId || "unknown";
  const actorType = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_TYPE || stored.actorType || detectedActor.actorType;
  const actorName = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_NAME || stored.actorName || detectedActor.actorName;
  const location = process.env.PI_WORKOS_AUDIT_LOGS_LOCATION || stored.location || "local";
  const userAgent = process.env.PI_WORKOS_AUDIT_LOGS_USER_AGENT || stored.userAgent || USER_AGENT2;
  const configured = true;
  return {
    enabled: configured && loggingEnabled,
    loggingEnabled,
    configured,
    apiKey,
    organizationId,
    actorId,
    actorType,
    actorName,
    location,
    userAgent
  };
}
function summarizeConfig(config) {
  if (!config.loggingEnabled)
    return "audit: off (disabled)";
  const credentialSource = config.apiKey ? "api key" : "workos cli";
  const orgSource = config.organizationId ? config.organizationId : "auto org: Audit Log Harness";
  return `audit: on via ${credentialSource}, ${orgSource} (${config.actorType}:${config.actorId})`;
}
function createClient(config) {
  if (!config.apiKey)
    return;
  return new WorkOS2(config.apiKey);
}
function auditCoreConfig(config) {
  return {
    apiKey: config.apiKey,
    organizationId: config.organizationId,
    organizationName: undefined,
    apiBaseUrl: undefined
  };
}
async function runAuditHarness(config, command, payload, extraArgs = []) {
  const ac = auditCoreConfig(config);
  switch (command) {
    case "emit-event":
      return await emitEvent(payload, ac);
    case "query":
      return await queryAuditLogs(ac, payload || {});
    case "ensure-organization": {
      const organizationId = await ensureOrganization(ac);
      return { organizationId, organizationName: payload?.organizationName };
    }
    case "create-schema":
      return await createSchema(ac, payload);
    case "seed-generic-schemas": {
      const prefix = payload && payload.prefix || "harness";
      const schemas = getHarnessAuditSchemaDefinitions(prefix);
      const created = [];
      for (const schema of schemas) {
        await createSchema(ac, schema);
        created.push({ action: schema.action });
      }
      return { prefix, schemaCount: created.length, created };
    }
    default:
      throw new Error(`Unknown audit-harness command: ${command}`);
  }
}
function getSessionTarget(ctx) {
  return {
    id: ctx.sessionManager.getSessionId(),
    type: "session"
  };
}
function getMessageRole(message) {
  const role = message.role;
  if (role === "toolResult")
    return "tool";
  return role || "unknown";
}
function getMessageContent(message) {
  return message.content;
}
function asContentArray(content) {
  if (!Array.isArray(content))
    return [];
  return content;
}
function getTextSummary(content) {
  if (typeof content === "string")
    return content;
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === "string")
        return item;
      if (item && typeof item === "object") {
        const block = item;
        if (block.type === "text" && typeof block.text === "string")
          return block.text;
        if (block.type === "image")
          return "[image]";
      }
      return stableSerialize2(item);
    }).join(`
`);
  }
  return stableSerialize2(content);
}
function getImageCount(content) {
  return asContentArray(content).filter((item) => item?.type === "image").length;
}
function getToolCallCount(content) {
  return asContentArray(content).filter((item) => item?.type === "toolCall").length;
}
function hasImages(images) {
  return Boolean(images && images.length > 0);
}
function getCommandPreview(command) {
  if (typeof command !== "string" || !command.trim())
    return;
  return truncateMetadataString(command);
}
function isCommandTruncated(command, maxLength = 500) {
  if (typeof command !== "string" || !command.trim())
    return;
  return command.length > maxLength;
}
function getBashToolCommand(input) {
  if (!input || typeof input !== "object")
    return;
  const command = input.command;
  return typeof command === "string" ? command : undefined;
}
function parseJsonValue2(value) {
  if (!value)
    return;
  const trimmed = value.trim();
  if (!trimmed)
    return;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}
function getPiAuditSchemaDefinitions(prefix = "pi") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Pi session start events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        cwd: "string",
        session_file: "string",
        previous_session_file: "string"
      }
    },
    {
      action: `${prefix}.session.shutdown`,
      note: "Pi session shutdown events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        target_session_file: "string"
      }
    },
    {
      action: `${prefix}.input.received`,
      note: "User input received by pi.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        text_length: "number",
        text_sha256: "string",
        text_preview: "string",
        text_truncated: "boolean",
        has_images: "boolean",
        image_count: "number"
      }
    },
    {
      action: `${prefix}.agent.started`,
      note: "Pi agent invocation started.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        system_prompt_sha256: "string",
        has_images: "boolean"
      }
    },
    {
      action: `${prefix}.agent.completed`,
      note: "Pi agent invocation completed.",
      targets: [{ type: "session" }],
      metadata: {
        duration_ms: "number",
        turn_count: "number",
        assistant_message_count: "number",
        tool_result_count: "number",
        status: "string"
      }
    },
    {
      action: `${prefix}.message.finalized`,
      note: "Pi finalized a message in the transcript.",
      targets: [
        { type: "session" },
        { type: "message", metadata: { role: "string" } }
      ],
      metadata: {
        role: "string",
        content_length: "number",
        content_sha256: "string",
        has_images: "boolean",
        image_count: "number",
        tool_call_count: "number",
        custom_type: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Pi tool call started.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        input_sha256: "string",
        input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "Pi tool call completed.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        is_error: "boolean",
        duration_ms: "number",
        result_sha256: "string",
        result_bytes: "number"
      }
    },
    {
      action: `${prefix}.user_bash.executed`,
      note: "User-triggered bash command execution from pi.",
      targets: [
        { type: "session" },
        { type: "command" }
      ],
      metadata: {
        exclude_from_context: "boolean",
        cwd: "string",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean"
      }
    },
    {
      action: `${prefix}.model.selected`,
      note: "Pi model selection changed.",
      targets: [
        { type: "session" },
        { type: "model", metadata: { provider: "string", model_id: "string" } }
      ],
      metadata: {
        source: "string",
        provider: "string",
        model_id: "string",
        previous_provider: "string",
        previous_model_id: "string",
        thinking_level: "string"
      }
    }
  ];
}
function parseCsv2(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0;i < csv.length; i += 1) {
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
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === `
`) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r")
      field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ""));
}
function parseAuditLogRows2(csv) {
  const parsed = parseCsv2(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow || headerRow.length === 0)
    return [];
  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);
  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || ""]));
    const targets = targetIndices.map((index) => ({
      id: raw[`target_id_${index}`] || undefined,
      type: raw[`target_type_${index}`] || undefined,
      name: raw[`target_name_${index}`] || undefined,
      metadata: parseJsonValue2(raw[`target_metadata_${index}`])
    })).filter((target) => target.id || target.type || target.name || target.metadata !== undefined);
    return {
      action: raw.action || "",
      occurredAt: raw.occurred_at || undefined,
      actor: {
        id: raw.actor_id || undefined,
        type: raw.actor_type || undefined,
        name: raw.actor_name || undefined,
        metadata: parseJsonValue2(raw.actor_metadata)
      },
      context: {
        location: raw.context_location || undefined,
        userAgent: raw.context_user_agent || undefined
      },
      metadata: parseJsonValue2(raw.metadata),
      targets,
      raw
    };
  });
}
function formatUnknown(value, maxLength = 280) {
  if (value === undefined || value === null)
    return;
  const raw = typeof value === "string" ? value : stableSerialize2(value);
  return truncateMetadataString(raw, maxLength);
}
function summarizeCounts2(values) {
  if (values.length === 0)
    return "none";
  const counts = new Map;
  for (const value of values)
    counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => `${value}=${count}`).join(", ");
}
function formatAuditLogRow2(row, index) {
  const targetSummary = row.targets.length > 0 ? row.targets.map((target) => `${target.type || "unknown"}:${target.id || target.name || "unknown"}`).join(", ") : "none";
  const metadataSummary = formatUnknown(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || "unknown time"} | action=${row.action}`,
    `   actor=${row.actor.type || "unknown"}:${row.actor.id || row.actor.name || "unknown"}`,
    `   targets=${targetSummary}`,
    metadataSummary ? `   metadata=${metadataSummary}` : undefined
  ].filter(Boolean).join(`
`);
}
async function sleep(ms, signal) {
  if (!signal) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return;
  }
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      reject(new Error("Aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
function workosAuditLogsExtension(pi) {
  let config = getConfig();
  let client = createClient(config);
  let warned = false;
  let queue = Promise.resolve();
  let agentStartedAt = null;
  let turnCount = 0;
  let toolStartedAt = new Map;
  function refreshStatus(ctx) {
    config = getConfig();
    client = createClient(config);
    if (ctx?.hasUI)
      ctx.ui.setStatus(EXTENSION_STATUS_KEY, summarizeConfig(config));
  }
  function enqueue(task) {
    queue = queue.catch(() => {
      return;
    }).then(task).catch((error) => {
      if (!warned) {
        warned = true;
        console.warn("[workos-audit-logs]", error);
      }
    });
    return queue;
  }
  async function emitEvent2(action, ctx, metadata, targets, occurredAt) {
    refreshStatus(ctx);
    if (!config.enabled)
      return;
    const event = {
      action,
      occurredAt: occurredAt || new Date,
      actor: {
        id: config.actorId,
        type: config.actorType,
        ...config.actorName ? { name: config.actorName } : {},
        metadata: {}
      },
      targets,
      context: {
        location: config.location,
        userAgent: config.userAgent
      },
      metadata
    };
    await runAuditHarness(config, "emit-event", event);
  }
  pi.registerCommand("workos-audit-status", {
    description: "Show WorkOS audit log extension configuration status",
    handler: async (_args, ctx) => {
      refreshStatus(ctx);
      const summary = summarizeConfig(config);
      if (ctx.hasUI)
        ctx.ui.notify(summary, config.enabled ? "info" : "warning");
      else
        console.log(summary);
    }
  });
  pi.registerCommand("workos-audit-disable", {
    description: "Disable WorkOS audit event emission without clearing the saved config",
    handler: async (_args, ctx) => {
      const stored = readStoredConfig();
      stored.enabled = false;
      writeStoredConfig(stored);
      refreshStatus(ctx);
      const message = "WorkOS audit event emission disabled. Run /workos-audit-enable to turn it back on.";
      if (ctx.hasUI)
        ctx.ui.notify(message, "info");
      console.log(message);
    }
  });
  pi.registerCommand("workos-audit-enable", {
    description: "Enable WorkOS audit event emission using the saved config",
    handler: async (_args, ctx) => {
      const stored = readStoredConfig();
      stored.enabled = true;
      writeStoredConfig(stored);
      refreshStatus(ctx);
      const message = config.configured ? "WorkOS audit event emission enabled." : "WorkOS audit event emission enabled. Run workos auth login (or set apiKey) for credentials; organization defaults to auto-created Audit Log Harness.";
      if (ctx.hasUI)
        ctx.ui.notify(message, config.configured ? "info" : "warning");
      console.log(message);
    }
  });
  pi.registerCommand("workos-audit-login", {
    description: "Authenticate the WorkOS CLI with browser login for staging Audit Logs API access",
    handler: async (_args, ctx) => {
      const message = "Starting WorkOS browser auth. If the browser does not open, follow the URL/code printed in the terminal.";
      if (ctx.hasUI)
        ctx.ui.notify(message, "info");
      console.log(message);
      execFileSync2("npx", ["--yes", "workos@latest", "auth", "login"], { stdio: "inherit" });
      refreshStatus(ctx);
    }
  });
  pi.registerCommand("workos-audit-ensure-organization", {
    description: "Find or create the default WorkOS Audit Log Harness organization and print its organization ID",
    handler: async (_args, ctx) => {
      refreshStatus(ctx);
      const result = await runAuditHarness(config, "ensure-organization", {});
      const message = `WorkOS audit organization: ${result.organizationName || "Audit Log Harness"} (${result.organizationId})`;
      if (ctx.hasUI)
        ctx.ui.notify(message, "info");
      console.log(message);
    }
  });
  pi.registerCommand("workos-audit-config", {
    description: "Configure WorkOS audit logging (/workos-audit-config show|path|edit|set|unset|clear)",
    handler: async (args, ctx) => {
      const [subcommand = "show", ...rest] = args.trim() ? args.trim().split(/\s+/) : [];
      if (subcommand === "path") {
        const filePath = getConfigFilePath();
        const message2 = `WorkOS audit config path: ${filePath}`;
        if (ctx.hasUI)
          ctx.ui.notify(message2, "info");
        console.log(message2);
        return;
      }
      if (subcommand === "show" || !subcommand) {
        refreshStatus(ctx);
        const summary = summarizeStoredConfig(config, readStoredConfig());
        if (ctx.hasUI)
          ctx.ui.notify(summarizeConfig(config), config.enabled ? "info" : "warning");
        console.log(summary);
        return;
      }
      if (subcommand === "clear") {
        if (ctx.hasUI) {
          const ok = await ctx.ui.confirm("Clear WorkOS audit config", `Delete ${getConfigFilePath()}?`);
          if (!ok)
            return;
        }
        clearStoredConfig();
        refreshStatus(ctx);
        const message2 = "WorkOS audit config cleared";
        if (ctx.hasUI)
          ctx.ui.notify(message2, "info");
        console.log(message2);
        return;
      }
      if (subcommand === "unset") {
        const key = parseConfigKey(rest[0] || "");
        if (!key) {
          const message3 = `Unknown key. Use one of: ${CONFIG_KEYS.join(", ")}`;
          if (ctx.hasUI)
            ctx.ui.notify(message3, "warning");
          console.log(message3);
          return;
        }
        const stored = readStoredConfig();
        delete stored[key];
        writeStoredConfig(stored);
        refreshStatus(ctx);
        const message2 = `Unset ${key} in ${getConfigFilePath()}`;
        if (ctx.hasUI)
          ctx.ui.notify(message2, "info");
        console.log(message2);
        return;
      }
      if (subcommand === "set") {
        const key = parseConfigKey(rest[0] || "");
        const value = rest.slice(1).join(" ").trim();
        if (!key) {
          const message3 = `Unknown key. Use one of: ${CONFIG_KEYS.join(", ")}`;
          if (ctx.hasUI)
            ctx.ui.notify(message3, "warning");
          console.log(message3);
          return;
        }
        if (!value) {
          const message3 = `Usage: /workos-audit-config set ${key} <value>`;
          if (ctx.hasUI)
            ctx.ui.notify(message3, "warning");
          console.log(message3);
          return;
        }
        const stored = readStoredConfig();
        stored[key] = value;
        writeStoredConfig(stored);
        refreshStatus(ctx);
        const displayValue = key === "apiKey" ? maskSecret(value) : value;
        const message2 = `Set ${key}=${displayValue}`;
        if (ctx.hasUI)
          ctx.ui.notify(message2, "info");
        console.log(message2);
        return;
      }
      if (subcommand === "edit") {
        if (!ctx.hasUI) {
          const message2 = "Interactive edit requires UI. Use /workos-audit-config set <key> <value> instead.";
          console.log(message2);
          return;
        }
        const stored = readStoredConfig();
        const current = getConfig();
        const next = { ...stored };
        const apiKey = await ctx.ui.input("WorkOS API key", current.apiKey ? `${maskSecret(current.apiKey)} (leave blank to keep current)` : "optional; leave blank to use workos auth login");
        if (apiKey === undefined)
          return;
        if (apiKey.trim())
          next.apiKey = apiKey.trim();
        const organizationId = await ctx.ui.input("WorkOS organization ID", current.organizationId || "org_...");
        if (organizationId === undefined)
          return;
        if (organizationId.trim())
          next.organizationId = organizationId.trim();
        const actorId = await ctx.ui.input("Actor ID", current.actorId);
        if (actorId === undefined)
          return;
        if (actorId.trim())
          next.actorId = actorId.trim();
        const actorType = await ctx.ui.input("Actor type", current.actorType);
        if (actorType === undefined)
          return;
        if (actorType.trim())
          next.actorType = actorType.trim();
        const actorName = await ctx.ui.input("Actor name (optional)", current.actorName || "leave blank to keep current");
        if (actorName === undefined)
          return;
        if (actorName.trim())
          next.actorName = actorName.trim();
        const location = await ctx.ui.input("Location", current.location);
        if (location === undefined)
          return;
        if (location.trim())
          next.location = location.trim();
        const userAgent = await ctx.ui.input("User agent", current.userAgent);
        if (userAgent === undefined)
          return;
        if (userAgent.trim())
          next.userAgent = userAgent.trim();
        writeStoredConfig(next);
        refreshStatus(ctx);
        ctx.ui.notify(`Saved WorkOS audit config to ${getConfigFilePath()}`, "info");
        console.log(summarizeStoredConfig(getConfig(), next));
        return;
      }
      const message = "Usage: /workos-audit-config show|path|edit|set|unset|clear";
      if (ctx.hasUI)
        ctx.ui.notify(message, "warning");
      console.log(message);
    }
  });
  pi.registerCommand("workos-audit-seed-schemas", {
    description: "Create WorkOS audit schemas for pi events (/workos-audit-seed-schemas [--prefix=pi] [--dry-run])",
    handler: async (args, ctx) => {
      const tokens = args.trim() ? args.trim().split(/\s+/) : [];
      let prefix = "pi";
      let dryRun = false;
      const unknownArgs = [];
      for (const token of tokens) {
        if (token === "--dry-run") {
          dryRun = true;
          continue;
        }
        if (token.startsWith("--prefix=")) {
          const value = token.slice("--prefix=".length).trim();
          if (value)
            prefix = value;
          else
            unknownArgs.push(token);
          continue;
        }
        unknownArgs.push(token);
      }
      if (unknownArgs.length > 0) {
        const message2 = "Usage: /workos-audit-seed-schemas [--prefix=pi] [--dry-run]";
        if (ctx.hasUI)
          ctx.ui.notify(message2, "warning");
        console.log(message2);
        return;
      }
      refreshStatus(ctx);
      const schemas = getPiAuditSchemaDefinitions(prefix);
      if (dryRun) {
        const preview = JSON.stringify({ prefix, schemaCount: schemas.length, schemas }, null, 2);
        if (ctx.hasUI)
          ctx.ui.notify(`Prepared ${schemas.length} pi audit schemas for prefix "${prefix}"`, "info");
        console.log(preview);
        return;
      }
      if (ctx.hasUI) {
        const ok = await ctx.ui.confirm("Seed WorkOS pi audit schemas", `Create ${schemas.length} schema(s) with prefix "${prefix}"? Existing actions may get a new schema version.`);
        if (!ok)
          return;
      }
      const schemaClient = config.apiKey ? new WorkOS2(config.apiKey) : undefined;
      const createdSchemas = [];
      for (const schema of schemas) {
        if (schemaClient) {
          const created = await schemaClient.auditLogs.createSchema({
            action: schema.action,
            actor: schema.actor,
            targets: schema.targets,
            metadata: schema.metadata
          });
          createdSchemas.push(`${schema.action} -> schema v${created.version}`);
        } else {
          await runAuditHarness(config, "create-schema", schema);
          createdSchemas.push(`${schema.action} -> schema created via workos cli`);
        }
      }
      const message = `Created ${createdSchemas.length} pi audit schema(s) with prefix "${prefix}"`;
      if (ctx.hasUI)
        ctx.ui.notify(message, "info");
      console.log([message, ...createdSchemas].join(`
`));
    }
  });
  pi.registerCommand("workos-audit-seed-harness-schemas", {
    description: "Create generic WorkOS audit schemas for harness events (/workos-audit-seed-harness-schemas [--prefix=pi] [--dry-run])",
    handler: async (args, ctx) => {
      const tokens = args.trim() ? args.trim().split(/\s+/) : [];
      let prefix = "pi";
      let dryRun = false;
      for (const token of tokens) {
        if (token === "--dry-run")
          dryRun = true;
        else if (token.startsWith("--prefix="))
          prefix = token.slice("--prefix=".length) || prefix;
      }
      const result = dryRun ? { prefix, schemas: getHarnessAuditSchemaDefinitions(prefix), schemaCount: getHarnessAuditSchemaDefinitions(prefix).length, dryRun: true } : await runAuditHarness(config, "seed-generic-schemas", { prefix });
      const message = JSON.stringify(result, null, 2);
      if (ctx.hasUI)
        ctx.ui.notify(dryRun ? "Prepared generic harness schemas" : "Created generic harness schemas", "info");
      console.log(message);
    }
  });
  pi.registerTool({
    name: "workos_audit_query",
    label: "WorkOS Audit Query",
    description: "Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows for answering questions about audit activity.",
    promptSnippet: "Query WorkOS audit logs by exporting filtered events and returning aggregate summaries plus sample rows.",
    promptGuidelines: [
      "Use workos_audit_query when the user asks questions about WorkOS audit logs or past pi audit activity.",
      "When using workos_audit_query, derive rangeStart and rangeEnd from the user's timeframe if specified; otherwise prefer the tool's bounded recent default window.",
      "When using workos_audit_query, pass action, actor, and target filters whenever the question clearly implies them to reduce export size and improve answer quality."
    ],
    parameters: Type.Object({
      question: Type.String({ description: "The user's audit-log question." }),
      rangeStart: Type.Optional(Type.String({ description: "ISO-8601 start time. If omitted, defaults to 7 days before rangeEnd." })),
      rangeEnd: Type.Optional(Type.String({ description: "ISO-8601 end time. If omitted, defaults to now." })),
      actions: Type.Optional(Type.Array(Type.String({ description: "Audit action filter, e.g. pi.tool.called" }))),
      actorIds: Type.Optional(Type.Array(Type.String({ description: "Actor ID filter." }))),
      actorNames: Type.Optional(Type.Array(Type.String({ description: "Actor name filter." }))),
      targets: Type.Optional(Type.Array(Type.String({ description: "Target type filter, e.g. session, tool, message, model" }))),
      maxRows: Type.Optional(Type.Integer({ description: "Maximum number of parsed rows to return in the sample output (1-200, default 50)." }))
    }),
    async execute(_toolCallId, params, signal, onUpdate) {
      refreshStatus();
      onUpdate?.({ content: [{ type: "text", text: `Creating WorkOS audit export via the Audit Log Harness for: ${params.question}` }] });
      const harnessResult = await runAuditHarness(config, "query", params);
      return {
        content: [{ type: "text", text: harnessResult.text || JSON.stringify(harnessResult, null, 2) }],
        details: harnessResult.details
      };
      const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date;
      if (Number.isNaN(rangeEnd.getTime()))
        throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);
      const rangeStart = params.rangeStart ? new Date(params.rangeStart) : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS2 * 24 * 60 * 60 * 1000);
      if (Number.isNaN(rangeStart.getTime()))
        throw new Error(`Invalid rangeStart: ${params.rangeStart}`);
      if (rangeStart.getTime() > rangeEnd.getTime())
        throw new Error("rangeStart must be before rangeEnd");
      const maxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS2, params.maxRows || DEFAULT_QUERY_MAX_ROWS2));
      const filters = {
        organizationId: config.organizationId,
        rangeStart,
        rangeEnd,
        ...params.actions?.length ? { actions: params.actions } : {},
        ...params.actorIds?.length ? { actorIds: params.actorIds } : {},
        ...params.actorNames?.length ? { actorNames: params.actorNames } : {},
        ...params.targets?.length ? { targets: params.targets } : {}
      };
      onUpdate?.({
        content: [{ type: "text", text: `Creating WorkOS audit export for: ${params.question}` }],
        details: { filters: { ...filters, rangeStart: rangeStart.toISOString(), rangeEnd: rangeEnd.toISOString() } }
      });
      let auditExport = await client.auditLogs.createExport(filters);
      const pollDeadline = Date.now() + EXPORT_POLL_TIMEOUT_MS2;
      while (auditExport.state === "pending") {
        if (signal?.aborted)
          throw new Error("Aborted");
        if (Date.now() > pollDeadline)
          throw new Error(`Timed out waiting for audit export ${auditExport.id}`);
        onUpdate?.({
          content: [{ type: "text", text: `Waiting for WorkOS audit export ${auditExport.id}...` }],
          details: { exportId: auditExport.id, state: auditExport.state }
        });
        await sleep(EXPORT_POLL_INTERVAL_MS2, signal);
        auditExport = await client.auditLogs.getExport(auditExport.id);
      }
      if (auditExport.state !== "ready" || !auditExport.url) {
        throw new Error(`Audit export ${auditExport.id} finished in unexpected state: ${auditExport.state}`);
      }
      const response = await fetch(auditExport.url, { signal });
      if (!response.ok)
        throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
      const csv = await response.text();
      const csvPath = path4.join(os4.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
      writeFileSync3(csvPath, csv, "utf8");
      const rows = parseAuditLogRows2(csv).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
      const sampleRows = rows.slice(0, maxRows);
      const actionSummary = summarizeCounts2(rows.map((row) => row.action).filter(Boolean));
      const actorSummary = summarizeCounts2(rows.map((row) => row.actor.id || row.actor.name || "unknown"));
      const targetSummary = summarizeCounts2(rows.flatMap((row) => row.targets.map((target) => target.type || "unknown")));
      const content = [
        `Question: ${params.question}`,
        `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
        `Export ID: ${auditExport.id}`,
        `Rows: ${rows.length}`,
        `Action counts: ${actionSummary}`,
        `Actor counts: ${actorSummary}`,
        `Target type counts: ${targetSummary}`,
        `Full CSV saved to: ${csvPath}`,
        rows.length === 0 ? "No matching audit log rows found." : `Sample rows (newest first, up to ${maxRows}):`,
        ...sampleRows.map((row, index) => formatAuditLogRow2(row, index))
      ].join(`

`);
      return {
        content: [{ type: "text", text: content }],
        details: {
          question: params.question,
          exportId: auditExport.id,
          exportUrl: auditExport.url,
          csvPath,
          filters: {
            ...filters,
            rangeStart: rangeStart.toISOString(),
            rangeEnd: rangeEnd.toISOString()
          },
          rowCount: rows.length,
          sampledRowCount: sampleRows.length,
          counts: {
            actions: actionSummary,
            actors: actorSummary,
            targetTypes: targetSummary
          },
          rows: sampleRows
        }
      };
    }
  });
  pi.on("session_start", async (event, ctx) => {
    refreshStatus(ctx);
    await enqueue(() => emitEvent2("pi.session.started", ctx, compactMetadata({
      reason: event.reason,
      cwd: ctx.cwd,
      session_file: ctx.sessionManager.getSessionFile(),
      previous_session_file: event.previousSessionFile
    }), [getSessionTarget(ctx)]));
  });
  pi.on("session_shutdown", async (event, ctx) => {
    refreshStatus(ctx);
    await enqueue(() => emitEvent2("pi.session.shutdown", ctx, compactMetadata({
      reason: event.reason,
      target_session_file: event.targetSessionFile
    }), [getSessionTarget(ctx)]));
  });
  pi.on("input", async (event, ctx) => {
    enqueue(() => emitEvent2("pi.input.received", ctx, compactMetadata({
      source: event.source,
      text_length: event.text.length,
      text_sha256: sha256(event.text),
      text_preview: truncateMetadataString(event.text),
      text_truncated: event.text.length > 500,
      has_images: hasImages(event.images),
      image_count: event.images?.length
    }), [getSessionTarget(ctx)]));
  });
  pi.on("before_agent_start", async (event, ctx) => {
    agentStartedAt = Date.now();
    turnCount = 0;
    enqueue(() => emitEvent2("pi.agent.started", ctx, compactMetadata({
      prompt_length: event.prompt.length,
      prompt_sha256: sha256(event.prompt),
      system_prompt_sha256: sha256(event.systemPrompt),
      has_images: hasImages(event.images)
    }), [getSessionTarget(ctx)]));
  });
  pi.on("turn_start", async () => {
    turnCount += 1;
  });
  pi.on("agent_end", async (event, ctx) => {
    const duration = agentStartedAt ? Date.now() - agentStartedAt : undefined;
    const messages = event.messages || [];
    const assistantCount = messages.filter((message) => getMessageRole(message) === "assistant").length;
    const toolResultCount = messages.filter((message) => getMessageRole(message) === "tool").length;
    const lastAssistant = [...messages].reverse().find((message) => getMessageRole(message) === "assistant");
    const status = lastAssistant?.stopReason === "aborted" ? "aborted" : lastAssistant?.stopReason === "error" ? "errored" : "completed";
    enqueue(() => emitEvent2("pi.agent.completed", ctx, compactMetadata({
      duration_ms: duration,
      turn_count: turnCount,
      assistant_message_count: assistantCount,
      tool_result_count: toolResultCount,
      status
    }), [getSessionTarget(ctx)]));
  });
  pi.on("message_end", async (event, ctx) => {
    const content = getMessageContent(event.message);
    const role = getMessageRole(event.message);
    const summary = getTextSummary(content);
    const messageId = `msg_${sha256({ role, content }).slice(0, 24)}`;
    enqueue(() => emitEvent2("pi.message.finalized", ctx, compactMetadata({
      role,
      content_length: summary.length,
      content_sha256: sha256(content),
      has_images: getImageCount(content) > 0,
      image_count: getImageCount(content),
      tool_call_count: getToolCallCount(content),
      custom_type: event.message.customType
    }), [
      getSessionTarget(ctx),
      {
        id: messageId,
        type: "message",
        metadata: compactMetadata({ role })
      }
    ]));
  });
  pi.on("tool_call", async (event, ctx) => {
    toolStartedAt.set(event.toolCallId, Date.now());
    enqueue(() => emitEvent2("pi.tool.called", ctx, compactMetadata({
      tool_name: event.toolName,
      tool_call_id: event.toolCallId,
      input_sha256: sha256(event.input),
      input_bytes: byteLength(event.input),
      command_preview: getCommandPreview(event.toolName === "bash" ? getBashToolCommand(event.input) : undefined),
      command_truncated: isCommandTruncated(event.toolName === "bash" ? getBashToolCommand(event.input) : undefined),
      blocked: false
    }), [
      getSessionTarget(ctx),
      {
        id: event.toolCallId,
        type: "tool",
        metadata: compactMetadata({ tool_name: event.toolName })
      }
    ]));
  });
  pi.on("tool_result", async (event, ctx) => {
    const startedAt = toolStartedAt.get(event.toolCallId);
    toolStartedAt.delete(event.toolCallId);
    enqueue(() => emitEvent2("pi.tool.completed", ctx, compactMetadata({
      tool_name: event.toolName,
      tool_call_id: event.toolCallId,
      is_error: event.isError,
      duration_ms: startedAt ? Date.now() - startedAt : undefined,
      result_sha256: sha256({ content: event.content, details: event.details, isError: event.isError }),
      result_bytes: byteLength({ content: event.content, details: event.details, isError: event.isError })
    }), [
      getSessionTarget(ctx),
      {
        id: event.toolCallId,
        type: "tool",
        metadata: compactMetadata({ tool_name: event.toolName })
      }
    ]));
  });
  pi.on("user_bash", async (event, ctx) => {
    const commandId = `cmd_${sha256({ command: event.command, cwd: event.cwd }).slice(0, 24)}`;
    enqueue(() => emitEvent2("pi.user_bash.executed", ctx, compactMetadata({
      exclude_from_context: event.excludeFromContext,
      cwd: event.cwd,
      command_sha256: sha256(event.command),
      command_length: event.command.length,
      command_preview: getCommandPreview(event.command),
      command_truncated: isCommandTruncated(event.command)
    }), [
      getSessionTarget(ctx),
      {
        id: commandId,
        type: "command"
      }
    ]));
  });
  pi.on("model_select", async (event, ctx) => {
    const modelTargetId = `${event.model.provider}/${event.model.id}`;
    enqueue(() => emitEvent2("pi.model.selected", ctx, compactMetadata({
      source: event.source,
      provider: event.model.provider,
      model_id: event.model.id,
      previous_provider: event.previousModel?.provider,
      previous_model_id: event.previousModel?.id,
      thinking_level: pi.getThinkingLevel()
    }), [
      getSessionTarget(ctx),
      {
        id: modelTargetId,
        type: "model",
        metadata: compactMetadata({
          provider: event.model.provider,
          model_id: event.model.id
        })
      }
    ]));
  });
}
export {
  workosAuditLogsExtension as default
};
