-- Generic key/value store for this console's own state.
--
-- Currently unused. It arrived with the internal-app template to back a demo
-- "fun fact" workflow, which has been removed along with its seed rows. The table
-- itself is kept: it is already applied on existing deployments, and dropping it
-- would need another migration that buys nothing. Nothing reads it today, so
-- treat it as a spare slot rather than something the console depends on.
--
-- NOT to be confused with the PROXY's app_state table, which holds the
-- "proxy_settings" runtime document and lives in a DIFFERENT database, reached
-- through the optional PROXY_DB binding (see app/lib/proxy-settings.server.ts).
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
