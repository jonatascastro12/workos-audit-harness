import type {
  DeviceUserRow,
  EffectiveSetting,
  EffectiveSettings,
  PauseDisplay,
} from "./proxy-settings.shared";
import {
  DEFAULT_CACHE_TTL_SECONDS,
  ORG_ID_RE,
  TTL_MAX_SECONDS,
  TTL_MIN_SECONDS,
} from "./proxy-settings.shared";

/**
 * Write side of the audit proxy's runtime settings.
 *
 * The settings live as ONE JSON document in the PROXY's own D1 database (the one
 * packages/proxy deploys), in its existing app_state key/value table under the
 * key "proxy_settings", reached through the PROXY_DB binding. The proxy
 * reads that document on every ingested event and falls back to its env vars /
 * built-in defaults for any absent or malformed field, so an absent row (or an
 * unreachable store) leaves ingestion untouched.
 *
 * Cross-repo contract: the read side is
 * packages/proxy/src/settings.ts — the key name, field names,
 * TTL bounds, org-id pattern, and the effective-paused rule are duplicated
 * there as documented constants (the repos share no package). This module
 * mirrors the proxy's PER-FIELD tolerance: one invalid field degrades to "not
 * overridden" without hiding the rest of the document (a strict all-or-nothing
 * parse here once meant a single unknown field could hide an active pause and
 * a subsequent save would silently rebuild the document from empty). Unknown
 * fields are preserved verbatim across writes (forward compat with newer
 * writers). Only a row whose value is not a JSON object at all is treated as
 * malformed — and then every document write is refused rather than repaired,
 * so nothing stored is ever silently discarded.
 *
 * This module is the ONLY place allowed to touch PROXY_DB. D1 has no scoped
 * grants, so the binding is technically full read/write on the proxy's
 * database; confinement to app_state's "proxy_settings" key and the
 * device_user cache table is by convention, enforced here.
 *
 * The binding is OPTIONAL: a deployment that runs only this console never
 * deployed the proxy, so there is no database to bind. Every entry point here
 * therefore takes `D1Database | undefined` and reports "not bound" as data — a
 * console without the proxy must render /settings as unavailable, never throw.
 */

export const PROXY_SETTINGS_KEY = "proxy_settings";
// Must accept every serial the proxy can store: it extracts serials from the
// cert CN with ([^,\s]+), so the purge validation mirrors that (plus a length
// cap). All queries bind parameters regardless — this is a sanity check only.
const SERIAL_RE = /^[^,\s]{1,128}$/;

export interface SettingsRead {
  /**
   * The stored document as parsed JSON, kept verbatim for round-tripping
   * unknown fields through writes. Null when the row is absent or malformed.
   */
  raw: Record<string, unknown> | null;
  /** True when the row exists but its value is not a JSON object. */
  malformed: boolean;
  /** CAS token for the next write; 0 when the row is absent or unreadable. */
  version: number;
  /**
   * False when the SELECT threw — covers the empty local-dev miniflare copy of
   * PROXY_DB ("no such table"), any real D1 outage, AND an absent binding. The
   * page then renders env defaults read-only and the action refuses writes.
   */
  storeAvailable: boolean;
  /**
   * False when PROXY_DB is not bound at all (a console deployed without the
   * ingestion proxy). Distinguished from an unreachable store so the page can
   * say "no proxy database bound" instead of implying an outage — the two need
   * completely different fixes. Always paired with storeAvailable: false.
   */
  storeBound: boolean;
}

export async function readSettingsDocument(db: D1Database | undefined): Promise<SettingsRead> {
  if (!db) {
    return { raw: null, malformed: false, version: 0, storeAvailable: false, storeBound: false };
  }
  let row: { value: string } | null;
  try {
    row = await db
      .prepare("SELECT value FROM app_state WHERE key = ?")
      .bind(PROXY_SETTINGS_KEY)
      .first<{ value: string }>();
  } catch (error) {
    console.error("proxy settings read failed", String(error));
    return { raw: null, malformed: false, version: 0, storeAvailable: false, storeBound: true };
  }
  if (!row) {
    return { raw: null, malformed: false, version: 0, storeAvailable: true, storeBound: true };
  }
  try {
    const parsed: unknown = JSON.parse(row.value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { raw: null, malformed: true, version: 0, storeAvailable: true, storeBound: true };
    }
    const raw = parsed as Record<string, unknown>;
    // Any integer counts; anything else (missing, string, float) reads as 0.
    // The CAS predicate in writeSettingsDocument applies the SAME rule in SQL —
    // the two must stay identical or writes lock out forever.
    const version =
      typeof raw.version === "number" && Number.isInteger(raw.version) ? raw.version : 0;
    return { raw, malformed: false, version, storeAvailable: true, storeBound: true };
  } catch {
    return { raw: null, malformed: true, version: 0, storeAvailable: true, storeBound: true };
  }
}

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: "conflict" | "malformed" | "unavailable" | "unbound" };

/**
 * Compare-and-swap write: the update only applies while the stored version
 * still equals expectedVersion, so two admins saving concurrently produce a
 * visible conflict instead of a silent clobber. An absent row inserts freely.
 * json_valid() guards the predicate so a hand-corrupted non-JSON value maps to
 * a conflict result instead of a thrown D1 error. The version comparison must
 * mirror readSettingsDocument's rule exactly ("not an integer" reads as 0):
 * json_extract returns NULL for a missing key and text for a string version,
 * and a bare `= ?` against those never matches — which would lock every write
 * out permanently on a document whose version field was hand-edited away.
 */
async function writeSettingsDocument(
  db: D1Database | undefined,
  nextDoc: Record<string, unknown>,
  expectedVersion: number,
): Promise<WriteResult> {
  // Single choke point for every document write, so the "no proxy database
  // bound" case cannot slip past one of the three public writers below.
  if (!db) return { ok: false, reason: "unbound" };
  let changes: number;
  try {
    const result = await db
      .prepare(
        "INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
          "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at " +
          // CASE (not AND) is load-bearing: SQLite's AND does not short-circuit
          // json_type's malformed-JSON error, CASE WHEN does — verified.
          "WHERE CASE WHEN json_valid(app_state.value) " +
          "THEN (CASE WHEN json_type(app_state.value, '$.version') = 'integer' " +
          "THEN json_extract(app_state.value, '$.version') ELSE 0 END) = ? " +
          "ELSE 0 END",
      )
      .bind(PROXY_SETTINGS_KEY, JSON.stringify(nextDoc), expectedVersion)
      .run();
    changes = result.meta.changes;
  } catch (error) {
    console.error("proxy settings write failed", String(error));
    return { ok: false, reason: "unavailable" };
  }
  if (changes === 0) return { ok: false, reason: "conflict" };
  return { ok: true };
}

/** Start the next document from the stored one so unknown fields round-trip. */
function nextDocument(read: SettingsRead, updatedBy: string): Record<string, unknown> {
  return {
    ...read.raw,
    version: read.version + 1,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };
}

export interface SettingsPatch {
  /** Empty string = reset to env default (key deleted). Non-empty values must
   * already be validated by the caller (org regex + live-list existence). */
  workosOrgId?: string;
  /** Empty string = reset to built-in default (key deleted). Non-empty values
   * must already be validated by the caller (integer within TTL bounds). */
  deviceCacheTtlSeconds?: string;
  unassignedDevicePolicy?: "reject" | "placeholder";
}

export async function saveSettings(
  db: D1Database | undefined,
  current: SettingsRead,
  patch: SettingsPatch,
  updatedBy: string,
): Promise<WriteResult> {
  if (current.malformed) return { ok: false, reason: "malformed" };
  const next = nextDocument(current, updatedBy);
  if (patch.workosOrgId !== undefined) {
    if (patch.workosOrgId === "") delete next.workos_org_id;
    else next.workos_org_id = patch.workosOrgId;
  }
  if (patch.deviceCacheTtlSeconds !== undefined) {
    if (patch.deviceCacheTtlSeconds === "") delete next.device_cache_ttl_seconds;
    else next.device_cache_ttl_seconds = Number(patch.deviceCacheTtlSeconds);
  }
  if (patch.unassignedDevicePolicy !== undefined) {
    if (patch.unassignedDevicePolicy === "reject") delete next.unassigned_device_policy;
    else next.unassigned_device_policy = patch.unassignedDevicePolicy;
  }
  return writeSettingsDocument(db, next, current.version);
}

export async function pauseIngest(
  db: D1Database | undefined,
  current: SettingsRead,
  reason: string,
  autoResumeAt: string | null,
  pausedBy: string,
): Promise<WriteResult> {
  if (current.malformed) return { ok: false, reason: "malformed" };
  const next = nextDocument(current, pausedBy);
  next.pause = {
    paused: true,
    reason,
    paused_by: pausedBy,
    paused_at: new Date().toISOString(),
    auto_resume_at: autoResumeAt,
  };
  return writeSettingsDocument(db, next, current.version);
}

export async function resumeIngest(
  db: D1Database | undefined,
  current: SettingsRead,
  resumedBy: string,
): Promise<WriteResult> {
  if (current.malformed) return { ok: false, reason: "malformed" };
  const next = nextDocument(current, resumedBy);
  delete next.pause;
  return writeSettingsDocument(db, next, current.version);
}

/**
 * Effective-paused rule, byte-for-byte the proxy's: paused === true AND (no
 * auto_resume_at OR it parses to a future time). An unparsable auto_resume_at
 * (including "") means EXPIRED — both sides fail toward ingesting, so the UI
 * can never show "paused" while the proxy ingests.
 */
export function isEffectivelyPaused(pause: unknown): boolean {
  if (typeof pause !== "object" || pause === null || Array.isArray(pause)) return false;
  const p = pause as Record<string, unknown>;
  if (p.paused !== true) return false;
  const autoResume = p.auto_resume_at;
  if (autoResume == null) return true;
  const resumeAt = typeof autoResume === "string" ? Date.parse(autoResume) : NaN;
  return !Number.isNaN(resumeAt) && resumeAt > Date.now();
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Tolerant per-field view of the stored document, mirroring the proxy's
 * parser (packages/proxy/src/settings.ts) so the provenance
 * badges and effective values shown here always match what the proxy applies.
 */
export function resolveEffective(read: SettingsRead, envOrgId: string | null): EffectiveSettings {
  const raw = read.raw ?? {};

  const rawOrgId = raw.workos_org_id;
  const workosOrgId: EffectiveSetting<string | null> =
    typeof rawOrgId === "string" && ORG_ID_RE.test(rawOrgId)
      ? { value: rawOrgId, source: "override" }
      : envOrgId
        ? { value: envOrgId, source: "env" }
        : { value: null, source: "default" };

  const rawTtl = raw.device_cache_ttl_seconds;
  const deviceCacheTtlSeconds: EffectiveSetting<number> = Number.isInteger(rawTtl)
    ? {
        value: Math.min(TTL_MAX_SECONDS, Math.max(TTL_MIN_SECONDS, rawTtl as number)),
        source: "override",
      }
    : { value: DEFAULT_CACHE_TTL_SECONDS, source: "default" };

  const rawPolicy = raw.unassigned_device_policy;
  const unassignedDevicePolicy: EffectiveSetting<"reject" | "placeholder"> =
    rawPolicy === "placeholder"
      ? { value: "placeholder", source: "override" }
      : rawPolicy === "reject"
        ? { value: "reject", source: "override" }
        : { value: "reject", source: "default" };

  let pause: PauseDisplay | null = null;
  const rawPause = raw.pause;
  if (
    typeof rawPause === "object" &&
    rawPause !== null &&
    !Array.isArray(rawPause) &&
    (rawPause as Record<string, unknown>).paused === true
  ) {
    const p = rawPause as Record<string, unknown>;
    pause = {
      reason: stringOrNull(p.reason),
      pausedBy: stringOrNull(p.paused_by),
      pausedAt: stringOrNull(p.paused_at),
      autoResumeAt: stringOrNull(p.auto_resume_at),
    };
  }

  return {
    workosOrgId,
    deviceCacheTtlSeconds,
    unassignedDevicePolicy,
    paused: isEffectivelyPaused(rawPause),
    pause,
    updatedBy: stringOrNull(raw.updated_by),
    updatedAt: stringOrNull(raw.updated_at),
  };
}

export interface DeviceUserList {
  rows: DeviceUserRow[];
  total: number;
  available: boolean;
}

export async function listDeviceUsers(db: D1Database | undefined): Promise<DeviceUserList> {
  // Not bound reads the same as unreadable to the caller: an empty list marked
  // unavailable. The page explains WHICH of the two it is from storeBound.
  if (!db) return { rows: [], total: 0, available: false };
  try {
    const [list, count] = await db.batch([
      db.prepare(
        "SELECT serial, email, name, updated FROM device_user ORDER BY updated DESC LIMIT 200",
      ),
      db.prepare("SELECT COUNT(*) AS total FROM device_user"),
    ]);
    return {
      rows: (list.results ?? []) as unknown as DeviceUserRow[],
      total: Number((count.results?.[0] as { total?: number } | undefined)?.total ?? 0),
      available: true,
    };
  } catch (error) {
    console.error("device_user cache read failed", String(error));
    return { rows: [], total: 0, available: false };
  }
}

export function isValidDeviceSerial(serial: string): boolean {
  return SERIAL_RE.test(serial);
}

// The two purges still REQUIRE a bound database: they are destructive, so the
// caller must have narrowed PROXY_DB (the /settings action refuses the intent
// outright when it is absent) rather than have a silent no-op look like success.
export async function purgeDeviceUser(db: D1Database, serial: string): Promise<void> {
  await db.prepare("DELETE FROM device_user WHERE serial = ?").bind(serial).run();
}

export async function purgeAllDeviceUsers(db: D1Database): Promise<number> {
  const result = await db.prepare("DELETE FROM device_user").run();
  return result.meta.changes ?? 0;
}
