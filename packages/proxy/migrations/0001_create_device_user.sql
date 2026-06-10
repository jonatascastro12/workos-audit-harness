-- Migration number: 0001 	 2026-06-10T00:00:00.000Z
-- Device serial → assigned user.
--
-- With an MDM configured (KANDJI_API_BASE + KANDJI_API_TOKEN) this is a
-- read-through cache refreshed on ingest. Without one, it is the authoritative
-- mapping — insert rows yourself:
--   INSERT INTO device_user (serial, email, name, updated)
--   VALUES ('KXVJ32DH30', 'jane@example.com', 'Jane Doe', unixepoch());
CREATE TABLE IF NOT EXISTS device_user (
  serial  TEXT PRIMARY KEY,  -- device serial from the client cert CN
  email   TEXT NOT NULL,     -- audit actor id
  name    TEXT NOT NULL,     -- audit actor display name
  updated INTEGER NOT NULL   -- epoch seconds of last refresh
);
