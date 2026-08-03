import { configure } from "@workos-inc/authkit-react-router";
import { createContext } from "react-router";

/**
 * Secrets and optional vars are not part of the generated `Env` (they are set
 * via Doppler → Cloudflare secrets, or .dev.vars locally), so they are
 * declared here and the binding env is widened to include them.
 */
export interface AuditChatSecrets {
  /** WorkOS API key for the tenant the proxy ingests into. Falls back to the proxy's secret. */
  AUDIT_CHAT_WORKOS_API_KEY?: string;
  AUDIT_HARNESS_WORKOS_API_KEY?: string;
  /** Organization the audit events are attributed to. Falls back to the proxy's var. */
  AUDIT_CHAT_WORKOS_ORG_ID?: string;
  AUDIT_HARNESS_WORKOS_ORG_ID?: string;
  /** AuthKit client for the same WorkOS environment as the API key. */
  AUDIT_CHAT_WORKOS_CLIENT_ID?: string;
  AUDIT_CHAT_WORKOS_COOKIE_PASSWORD?: string;
  /** Defaults to https://<AUDIT_CHAT_PUBLIC_HOSTNAME>/callback. */
  AUDIT_CHAT_WORKOS_REDIRECT_URI?: string;
  /** Restrict sign-ins to one email domain (e.g. "workos.com"). Empty = any AuthKit user. */
  AUDIT_CHAT_ALLOWED_EMAIL_DOMAIN?: string;
  /** "provider/model" string, e.g. "anthropic/claude-sonnet-4-6" or "openai/gpt-4o". */
  AUDIT_CHAT_MODEL?: string;
  /** Cloudflare AI Gateway name holding stored provider keys. */
  AUDIT_CHAT_AI_GATEWAY?: string;
  /** Direct provider keys; when set they bypass the AI Gateway. */
  AUDIT_CHAT_ANTHROPIC_API_KEY?: string;
  AUDIT_CHAT_OPENAI_API_KEY?: string;
}

export type AuditChatEnv = Env & AuditChatSecrets;

/**
 * Loaders and actions always receive a `RouterContextProvider`, so the worker
 * entry (`workers/app.ts`) hands the Cloudflare bindings over through this
 * typed context instead of a plain load-context object.
 */
export const cloudflareContext = createContext<{
  env: AuditChatEnv;
  ctx: ExecutionContext;
}>();

export interface TenantConfig {
  apiKey: string;
  /** Optional pre-selected org; the user picks from the live org list otherwise. */
  defaultOrganizationId: string | null;
  environmentLabel: "sandbox" | "production";
  publicHostname: string;
  modelId: string;
  allowedEmailDomain: string | null;
}

export const DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it as a Cloudflare secret (Doppler claude-day) or in .dev.vars for local dev.`,
    );
  }
  return value;
}

export function getTenantConfig(env: AuditChatEnv): TenantConfig {
  const apiKey = required(
    env.AUDIT_CHAT_WORKOS_API_KEY ?? env.AUDIT_HARNESS_WORKOS_API_KEY,
    "AUDIT_CHAT_WORKOS_API_KEY (or AUDIT_HARNESS_WORKOS_API_KEY)",
  );
  return {
    apiKey,
    defaultOrganizationId: env.AUDIT_CHAT_WORKOS_ORG_ID ?? env.AUDIT_HARNESS_WORKOS_ORG_ID ?? null,
    environmentLabel: apiKey.startsWith("sk_test_") ? "sandbox" : "production",
    publicHostname: env.AUDIT_CHAT_PUBLIC_HOSTNAME,
    modelId: env.AUDIT_CHAT_MODEL ?? DEFAULT_MODEL,
    allowedEmailDomain: env.AUDIT_CHAT_ALLOWED_EMAIL_DOMAIN || null,
  };
}

/**
 * AuthKit's config store is module-global; calling this at the top of every
 * auth-touching loader/action keeps it correct per isolate without relying on
 * process.env existing in the Workers runtime.
 */
export function configureAuthKit(env: AuditChatEnv): void {
  const tenant = getTenantConfig(env);
  configure({
    clientId: required(env.AUDIT_CHAT_WORKOS_CLIENT_ID, "AUDIT_CHAT_WORKOS_CLIENT_ID"),
    apiKey: tenant.apiKey,
    redirectUri: env.AUDIT_CHAT_WORKOS_REDIRECT_URI ?? `https://${tenant.publicHostname}/callback`,
    cookiePassword: required(
      env.AUDIT_CHAT_WORKOS_COOKIE_PASSWORD,
      "AUDIT_CHAT_WORKOS_COOKIE_PASSWORD",
    ),
  });
}

export function emailAllowed(email: string | null | undefined, tenant: TenantConfig): boolean {
  if (!tenant.allowedEmailDomain) return true;
  return !!email && email.toLowerCase().endsWith(`@${tenant.allowedEmailDomain.toLowerCase()}`);
}
