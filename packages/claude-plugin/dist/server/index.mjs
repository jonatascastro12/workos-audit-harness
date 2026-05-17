// ../audit-core/src/mcp-server.mjs
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ../audit-core/src/util.mjs
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function maskSecret(value) {
  if (!value)
    return;
  if (value.length <= 8)
    return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
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

// ../audit-core/src/audit-query.mjs
import os2 from "node:os";
import path2 from "node:path";
import { writeFileSync } from "node:fs";

// ../audit-core/src/workos-client.mjs
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { Entry } from "@napi-rs/keyring";
import { WorkOS } from "@workos-inc/node";
var DEFAULT_API_BASE_URL = "https://api.workos.com";
var DEFAULT_ORGANIZATION_NAME = "Audit Log Harness";
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

// ../audit-core/src/audit-query.mjs
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

// ../audit-core/src/mcp-server.mjs
async function runMcpServer({ configLoader, serverName = "workos-audit", version = "0.1.0" }) {
  const config = configLoader.loadConfig();
  const queryConfig = configLoader.loadQueryConfig ? configLoader.loadQueryConfig() : { apiKey: config.apiKey, organizationId: config.organizationId };
  const server = new McpServer({ name: serverName, version });
  server.registerTool("workos_audit_status", {
    title: "WorkOS Audit Status",
    description: "Show WorkOS audit plugin configuration status.",
    inputSchema: z.object({}).strict()
  }, async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          enabled: true,
          configPath: configLoader.getConfigFilePath(),
          credentialSource: config.apiKey ? "api-key" : "workos-cli",
          apiKey: maskSecret(config.apiKey),
          organizationId: config.organizationId || null,
          organizationResolution: config.organizationId ? "explicit" : "auto-find-or-create Audit Log Harness",
          recordingEnabled: config.recordingEnabled !== false,
          actionPrefix: config.actionPrefix,
          actorId: config.actorId,
          actorType: config.actorType,
          actorName: config.actorName,
          location: config.location,
          userAgent: config.userAgent,
          sources: config.sources
        }, null, 2)
      }
    ]
  }));
  server.registerTool("workos_audit_query", {
    title: "WorkOS Audit Query",
    description: "Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows.",
    inputSchema: z.object({
      question: z.string(),
      rangeStart: z.string().optional(),
      rangeEnd: z.string().optional(),
      actions: z.array(z.string()).optional(),
      actorIds: z.array(z.string()).optional(),
      actorNames: z.array(z.string()).optional(),
      targets: z.array(z.string()).optional(),
      maxRows: z.number().int().min(1).max(MAX_QUERY_MAX_ROWS).optional()
    })
  }, async (payload) => {
    try {
      const result = await queryAuditLogs(queryConfig, payload);
      return {
        content: [{ type: "text", text: result.text }],
        structuredContent: result.details
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: error.stderr?.toString?.() || error.message || String(error) }]
      };
    }
  });
  const transport = new StdioServerTransport;
  await server.connect(transport);
}

// ../audit-core/src/config.mjs
import os3 from "node:os";
import path3 from "node:path";
import { chmodSync, existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, rmSync, writeFileSync as writeFileSync2 } from "node:fs";
var CONFIG_KEYS = [
  "apiKey",
  "organizationId",
  "actionPrefix",
  "actorId",
  "actorType",
  "actorName",
  "location",
  "userAgent"
];
var BOOLEAN_CONFIG_KEYS = new Set(["recordingEnabled"]);
function parseBoolean(value) {
  if (typeof value === "boolean")
    return value;
  if (typeof value !== "string")
    return;
  const normalized = value.trim().toLowerCase();
  if (!normalized)
    return;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized))
    return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized))
    return false;
  return;
}
function createConfigLoader({
  configFilePathEnvs,
  defaultConfigDir,
  envKeyOrder,
  defaults
}) {
  function getConfigFilePath() {
    for (const name of configFilePathEnvs) {
      const value = trimToUndefined(process.env[name]);
      if (value)
        return value;
    }
    return path3.join(os3.homedir(), defaultConfigDir, "workos-audit", "config.json");
  }
  function readFileConfig() {
    const filePath = getConfigFilePath();
    if (!existsSync2(filePath))
      return {};
    try {
      const raw = JSON.parse(readFileSync2(filePath, "utf8"));
      if (!raw || typeof raw !== "object")
        return {};
      const config = {};
      for (const key of CONFIG_KEYS) {
        const value = trimToUndefined(raw[key]);
        if (value)
          config[key] = value;
      }
      for (const key of BOOLEAN_CONFIG_KEYS) {
        if (raw[key] !== undefined) {
          const parsed = parseBoolean(raw[key]);
          if (parsed !== undefined)
            config[key] = parsed;
        }
      }
      return config;
    } catch {
      return {};
    }
  }
  function writeFileConfig(config) {
    const filePath = getConfigFilePath();
    const sanitized = {};
    for (const key of CONFIG_KEYS) {
      const value = trimToUndefined(config[key]);
      if (value)
        sanitized[key] = value;
    }
    for (const key of BOOLEAN_CONFIG_KEYS) {
      if (config[key] !== undefined) {
        const parsed = parseBoolean(config[key]);
        if (parsed !== undefined)
          sanitized[key] = parsed;
      }
    }
    mkdirSync(path3.dirname(filePath), { recursive: true, mode: 448 });
    writeFileSync2(filePath, `${JSON.stringify(sanitized, null, 2)}
`, { mode: 384 });
    chmodSync(filePath, 384);
    return filePath;
  }
  function clearFileConfig() {
    rmSync(getConfigFilePath(), { force: true });
  }
  function lookupEnv(key) {
    const candidates = envKeyOrder[key] || [];
    for (const name of candidates) {
      const value = trimToUndefined(process.env[name]);
      if (value)
        return { value, source: name };
    }
    return { value: undefined, source: null };
  }
  function resolveKey(key, fileConfig, fallback) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value)
      return { value: fromEnv.value, source: fromEnv.source };
    if (fileConfig[key] !== undefined)
      return { value: fileConfig[key], source: "config_file" };
    if (fallback) {
      const fb = fallback();
      if (fb !== undefined)
        return { value: fb.value, source: fb.source || "default" };
    }
    return { value: undefined, source: null };
  }
  function resolveBooleanKey(key, fileConfig, defaultValue) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value !== undefined) {
      const parsed = parseBoolean(fromEnv.value);
      if (parsed !== undefined)
        return { value: parsed, source: fromEnv.source };
    }
    if (fileConfig[key] !== undefined) {
      return { value: fileConfig[key], source: "config_file" };
    }
    return { value: defaultValue, source: "default" };
  }
  function loadConfig() {
    const fileConfig = readFileConfig();
    const apiKey = resolveKey("apiKey", fileConfig);
    const organizationId = resolveKey("organizationId", fileConfig);
    const actionPrefix = resolveKey("actionPrefix", fileConfig, () => ({ value: defaults.actionPrefix, source: "default" }));
    const actorType = resolveKey("actorType", fileConfig, () => ({ value: defaults.actorType, source: "default" }));
    const actorId = resolveKey("actorId", fileConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      if (user)
        return { value: user, source: "os_user" };
      return { value: os3.hostname(), source: "hostname" };
    });
    const actorName = resolveKey("actorName", fileConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      return user ? { value: user, source: "os_user" } : undefined;
    });
    const location = resolveKey("location", fileConfig, () => ({ value: defaults.location, source: "default" }));
    const userAgent = resolveKey("userAgent", fileConfig, () => ({ value: defaults.userAgent, source: "default" }));
    const recordingEnabled = resolveBooleanKey("recordingEnabled", fileConfig, defaults.recordingEnabled ?? true);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      actionPrefix: actionPrefix.value,
      actorId: actorId.value,
      actorType: actorType.value,
      actorName: actorName.value,
      location: location.value,
      userAgent: userAgent.value,
      recordingEnabled: recordingEnabled.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source,
        actionPrefix: actionPrefix.source,
        actorId: actorId.source,
        actorType: actorType.source,
        actorName: actorName.source,
        location: location.source,
        userAgent: userAgent.source,
        recordingEnabled: recordingEnabled.source
      }
    };
  }
  function loadQueryConfig() {
    const fileConfig = readFileConfig();
    const apiKey = resolveKey("apiKey", fileConfig);
    const organizationId = resolveKey("organizationId", fileConfig);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source
      }
    };
  }
  return {
    getConfigFilePath,
    readFileConfig,
    writeFileConfig,
    clearFileConfig,
    loadConfig,
    loadQueryConfig
  };
}

// scripts/config-file.mjs
function claudePluginOptionEnvs(name) {
  return [
    `CLAUDE_PLUGIN_OPTION_${name}`,
    `CLAUDE_PLUGIN_OPTION_${name.toLowerCase()}`,
    `CLAUDE_PLUGIN_OPTION_${name.toUpperCase()}`
  ];
}
var configLoader = createConfigLoader({
  configFilePathEnvs: ["WORKOS_AUDIT_CONFIG_PATH", "CLAUDE_WORKOS_AUDIT_CONFIG_PATH"],
  defaultConfigDir: ".claude",
  envKeyOrder: {
    apiKey: ["WORKOS_API_KEY", ...claudePluginOptionEnvs("API_KEY")],
    organizationId: ["WORKOS_ORGANIZATION_ID", ...claudePluginOptionEnvs("ORGANIZATION_ID")],
    actionPrefix: ["WORKOS_ACTION_PREFIX", ...claudePluginOptionEnvs("ACTION_PREFIX")],
    actorId: ["WORKOS_ACTOR_ID", ...claudePluginOptionEnvs("ACTOR_ID")],
    actorType: ["WORKOS_ACTOR_TYPE", ...claudePluginOptionEnvs("ACTOR_TYPE")],
    actorName: ["WORKOS_ACTOR_NAME", ...claudePluginOptionEnvs("ACTOR_NAME")],
    location: ["WORKOS_LOCATION", ...claudePluginOptionEnvs("LOCATION")],
    userAgent: ["WORKOS_USER_AGENT", ...claudePluginOptionEnvs("USER_AGENT")],
    recordingEnabled: ["CLAUDE_WORKOS_AUDIT_RECORDING", "WORKOS_AUDIT_RECORDING", ...claudePluginOptionEnvs("RECORDING_ENABLED")]
  },
  defaults: {
    actionPrefix: "claude",
    actorType: "user",
    location: "claude-code",
    userAgent: "claude-code-workos-audit/1",
    recordingEnabled: true
  }
});

// server/index.mjs
await runMcpServer({ configLoader, version: "0.1.5" });
