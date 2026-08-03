CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO app_state (key, value) VALUES ('last_updated', datetime('now'));
INSERT INTO app_state (key, value) VALUES ('fun_fact', 'No fun fact yet. The workflow runs every 15 minutes.');
