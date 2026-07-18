// Runtime settings — read per ingested event from the D1 `app_state` table.
//
// An admin tool (anything that can write this Worker's D1 — a companion admin
// app over a direct D1 binding, a CLI, or `wrangler d1 execute`) writes ONE
// JSON document under the key `proxy_settings`. The proxy applies it on the
// next event, so operational changes (pausing ingest, re-pointing the
// organization) need no redeploy. See README "Runtime settings" for the
// document contract.
//
// Two rules govern this parser:
//   1. Absence means "use env/built-in default". A missing row, a missing
//      field, or a null field is normal — it is NOT an error, it just means
//      "the admin hasn't overridden this", so we fall back.
//   2. Per-field validation is defense-in-depth. The writer is trusted, but a
//      hand-edited, half-written, or schema-drifted row must degrade to
//      defaults rather than break, misroute, or drop ingest. Every field is
//      validated independently, so one corrupt field never poisons the others.
//
// Unknown fields are ignored (forward compat with newer writers).

export const PROXY_SETTINGS_KEY = "proxy_settings";
export const TTL_MIN_SECONDS = 5 * 60; // 300
export const TTL_MAX_SECONDS = 7 * 24 * 60 * 60; // 604800
export const ORG_ID_RE = /^org_[A-Za-z0-9]+$/;
// Actor id used when an unassigned/unknown device is admitted under the
// "placeholder" policy instead of being rejected.
export const PLACEHOLDER_ACTOR_ID = "unassigned-device";

export interface ProxySettings {
  /** Overrides env WORKOS_ORG_ID when set. */
  workosOrgId: string | null;
  /**
   * Overrides env DEVICE_CACHE_TTL_SECONDS when set (MDM mode only). Null
   * means "not overridden" so the env var keeps working as the next fallback.
   */
  deviceCacheTtlSeconds: number | null;
  paused: boolean;
  pauseReason: string | null;
  unassignedDevicePolicy: "reject" | "placeholder";
}

// Parse the raw `proxy_settings` value into a fully-defaulted ProxySettings.
// Never throws: any malformed input degrades to the safe defaults.
export function parseProxySettings(raw: string | null | undefined): ProxySettings {
  const defaults: ProxySettings = {
    workosOrgId: null,
    deviceCacheTtlSeconds: null,
    paused: false,
    pauseReason: null,
    unassignedDevicePolicy: "reject",
  };

  let doc: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw ?? "");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return defaults;
    }
    doc = parsed as Record<string, unknown>;
  } catch {
    return defaults;
  }

  // workos_org_id: only a string matching the org id shape overrides the env.
  const rawOrgId = doc.workos_org_id;
  const workosOrgId = typeof rawOrgId === "string" && ORG_ID_RE.test(rawOrgId) ? rawOrgId : null;

  // device_cache_ttl_seconds: integer only, clamped to [MIN, MAX]; else null
  // (fall through to env DEVICE_CACHE_TTL_SECONDS, then the built-in default).
  const rawTtl = doc.device_cache_ttl_seconds;
  const deviceCacheTtlSeconds = Number.isInteger(rawTtl)
    ? Math.min(TTL_MAX_SECONDS, Math.max(TTL_MIN_SECONDS, rawTtl as number))
    : null;

  // unassigned_device_policy: exactly "placeholder" opts in; anything else rejects.
  const unassignedDevicePolicy =
    doc.unassigned_device_policy === "placeholder" ? "placeholder" : "reject";

  // pause: effective-paused rule — paused === true AND (no auto_resume_at OR it
  // is in the future). A malformed auto_resume_at (Date.parse -> NaN) is
  // treated as EXPIRED, i.e. we fail toward ingesting.
  let paused = false;
  let pauseReason: string | null = null;
  const rawPause = doc.pause;
  if (typeof rawPause === "object" && rawPause !== null && !Array.isArray(rawPause)) {
    const pause = rawPause as Record<string, unknown>;
    if (pause.paused === true) {
      const autoResume = pause.auto_resume_at;
      if (autoResume == null) {
        paused = true;
      } else {
        const resumeAt = typeof autoResume === "string" ? Date.parse(autoResume) : NaN;
        // Future resume time -> still paused; NaN or past -> resume (ingest).
        paused = !Number.isNaN(resumeAt) && resumeAt > Date.now();
      }
    }
    // Reason is captured whenever present; the kill switch surfaces it only
    // when effectively paused.
    if (typeof pause.reason === "string") {
      pauseReason = pause.reason.slice(0, 200);
    }
  }

  return {
    workosOrgId,
    deviceCacheTtlSeconds,
    paused,
    pauseReason,
    unassignedDevicePolicy,
  };
}
