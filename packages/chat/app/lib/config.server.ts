import { configure } from "@workos-inc/authkit-react-router";
// Deep import: configureSessionStorage is not re-exported from the package
// root, but it is what `authkitLoader` calls internally and the only way to
// prepare session storage for an action that uses `withAuth` directly.
import { configureSessionStorage } from "@workos-inc/authkit-react-router/dist/cjs/sessionStorage.js";
import { createContext } from "react-router";

/**
 * Secrets and optional vars are not part of the generated `Env` (they are set as
 * Worker secrets — WorkOS-internally via a Doppler sync — or in .dev.vars
 * locally), so they are declared here and the binding env is widened to include
 * them.
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

/**
 * PROXY_DB is re-declared OPTIONAL on purpose. It binds the ingestion proxy's
 * own D1 database, which a deployment that runs only this console does not have
 * (the binding is commented out in the vendor-neutral wrangler.toml and bound in
 * wrangler.internal.toml). `wrangler types` emits it as a required property
 * whenever the binding happens to be present, so overriding it here keeps the
 * app compiling and behaving identically either way, and forces every call site
 * to handle "not bound" instead of throwing on `undefined.prepare`.
 */
export type AuditChatEnv = Omit<Env, "PROXY_DB"> &
  AuditChatSecrets & {
    PROXY_DB?: D1Database;
  };

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
      `Missing ${name}. Set it as a Worker secret (\`wrangler secret put\`), or in .dev.vars for local dev.`,
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
 *
 * Session storage is configured here too, and that is load-bearing: only
 * `authkitLoader` configures it on its own. An action that calls `withAuth`
 * directly (api/chat, the settings save, the thread delete) goes straight to
 * getSessionStorage(), which throws "SessionStorage was never configured"
 * unless a loader happened to run first in the same isolate — so those actions
 * failed with a 500 whenever they landed on a cold one.
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
  // Must follow configure(): the cookie options are read from the config above.
  // Idempotent — the session manager only initialises once per isolate.
  void configureSessionStorage();
}

export function emailAllowed(email: string | null | undefined, tenant: TenantConfig): boolean {
  if (!tenant.allowedEmailDomain) return true;
  return !!email && email.toLowerCase().endsWith(`@${tenant.allowedEmailDomain.toLowerCase()}`);
}
