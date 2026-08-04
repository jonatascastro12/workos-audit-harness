-- Per-user persisted chat threads for the audit console.
--
-- Ownership is by WorkOS user id (stable), never by email (reassignable) and
-- never by anything the client sends. Every transcript read joins back to
-- chat_thread, so a guessed thread id cannot expose another user's messages.
--
-- One row per MESSAGE rather than one JSON blob per thread: a single assistant
-- turn can carry a tool-query_audit_logs part holding up to 200 sampled audit
-- rows, so a whole-thread blob grows without bound against D1's per-row
-- ceiling. Per-message rows keep each write small and make appending a plain
-- upsert with no read-modify-write.
-- organization_id binds the thread to the tenant whose audit logs it is about.
-- It is fixed at creation and thereafter authoritative: the model's system
-- prompt and the replayed transcript must always describe the SAME
-- organization, or a persisted export from one tenant would be re-injected as
-- context under another tenant's prompt.
CREATE TABLE IF NOT EXISTS chat_thread (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  user_email      TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  title           TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Serves the only thread-list query: one user, newest first.
CREATE INDEX IF NOT EXISTS chat_thread_user_updated
  ON chat_thread (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_message (
  thread_id  TEXT NOT NULL REFERENCES chat_thread(id) ON DELETE CASCADE,
  id         TEXT NOT NULL,
  seq        INTEGER NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  parts      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Makes every append idempotent: a retried request or a regenerated
  -- assistant turn overwrites its own row instead of duplicating it.
  PRIMARY KEY (thread_id, id)
);

-- Serves the transcript read: one thread, in order.
CREATE INDEX IF NOT EXISTS chat_message_thread_seq
  ON chat_message (thread_id, seq);
