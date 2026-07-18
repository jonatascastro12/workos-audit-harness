/**
 * Constants and types for the audit proxy's runtime settings that are shared
 * between the server module (app/lib/proxy-settings.server.ts) and the
 * /settings UI. Client-safe: no zod, no D1, no secrets — anything here may end
 * up in the browser bundle.
 */

export const DEFAULT_CACHE_TTL_SECONDS = 86_400;
export const TTL_MIN_SECONDS = 300;
export const TTL_MAX_SECONDS = 604_800;
/** The proxy caps negative-cache sentinel rows (email === "") at this TTL so
 * reassigned loaner laptops are re-checked promptly. Mirrored from
 * workos-audit-proxy/app/routes/api.events.ts. */
export const UNASSIGNED_SENTINEL_TTL_SECONDS = 3_600;
export const ORG_ID_RE = /^org_[A-Za-z0-9]+$/;

export type SettingSource = "override" | "env" | "default";

export interface EffectiveSetting<T> {
  value: T;
  source: SettingSource;
}

/**
 * Display view of the stored pause object. Every field is tolerant — the
 * stored document may have been written by another tool or hand-edited, so
 * anything that isn't a string renders as null rather than breaking the page.
 */
export interface PauseDisplay {
  reason: string | null;
  pausedBy: string | null;
  pausedAt: string | null;
  autoResumeAt: string | null;
}

export interface EffectiveSettings {
  workosOrgId: EffectiveSetting<string | null>;
  deviceCacheTtlSeconds: EffectiveSetting<number>;
  unassignedDevicePolicy: EffectiveSetting<"reject" | "placeholder">;
  /** Computed with the shared effective-paused rule (auto-resume respected,
   * unparsable auto_resume_at treated as expired — same as the proxy). */
  paused: boolean;
  /** Present whenever the stored pause object claims paused, even if expired. */
  pause: PauseDisplay | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface DeviceUserRow {
  serial: string;
  /** Empty string = the proxy's negative-cache sentinel for an unassigned device. */
  email: string;
  name: string;
  /** Epoch SECONDS of the last Kandji lookup (not ms, not ISO). */
  updated: number;
}
