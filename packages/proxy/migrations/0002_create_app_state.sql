-- Migration number: 0002 	 2026-07-18T00:00:00.000Z
-- Generic key/value state for the proxy. Currently holds one optional row:
-- the `proxy_settings` runtime-settings document (see src/settings.ts for the
-- shape and README "Runtime settings" for the contract). The proxy behaves
-- identically when the row is absent, so this migration is a no-op for
-- existing deployments until something writes the row.
CREATE TABLE IF NOT EXISTS app_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
