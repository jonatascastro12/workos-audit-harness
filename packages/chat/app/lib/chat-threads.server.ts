import type { UIMessage } from "ai";

/**
 * Per-user chat thread persistence (D1 binding `DB`, migration 0002).
 *
 * This module is the ONLY place that touches chat_thread / chat_message — the
 * same confinement convention proxy-settings.server.ts uses for PROXY_DB.
 *
 * Two rules govern everything here:
 *
 *  1. Ownership is a SECURITY property. It comes from the AuthKit session's
 *     stable `user.id`, never from a client-supplied value, and every read is
 *     scoped in SQL (the transcript query joins back to chat_thread) so even a
 *     caller that forgot to pre-check ownership cannot read another user's
 *     messages. Email is stored for operator debugging only and is never a
 *     predicate: an address reassigned to a new hire must not inherit threads.
 *
 *  2. Persistence is ADDITIVE and must never break chatting. Every function
 *     here degrades instead of throwing — a missing table (migration not yet
 *     applied) or a D1 outage yields `storeAvailable: false` / a no-op write,
 *     and the caller still answers the question. Chat working must not depend
 *     on persistence succeeding.
 */

/** Newest N threads shown in the switcher. */
export const THREAD_LIST_LIMIT = 30;
const MAX_TITLE_LENGTH = 80;
/** Reject absurd transcripts rather than trying to persist them. */
const MAX_TRANSCRIPT_MESSAGES = 400;
const THREAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Shown in place of a tool part that was still in flight when the stream was
 * cut, so a reloaded transcript never renders an eternal spinner.
 */
const INTERRUPTED_TOOL_ERROR =
  "This export did not finish — the answer was interrupted before results came back.";

export function isValidThreadId(id: unknown): id is string {
  return typeof id === "string" && THREAD_ID_RE.test(id);
}

/** First line of the user's opening question, trimmed to a sane length. */
export function threadTitle(message: UIMessage | undefined): string {
  const text = (message?.parts ?? [])
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "New investigation";
  return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text;
}

export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ThreadPage {
  threads: ThreadSummary[];
  messages: UIMessage[];
  /** False for a never-used id — the console shows the suggestions hero. */
  exists: boolean;
  /** False when the tables are missing or D1 failed; the UI says so. */
  storeAvailable: boolean;
}

interface MessageRow {
  id: string;
  role: string;
  parts: string;
}

/**
 * Heal a persisted message: drop parts we can't parse and neutralize any tool
 * call that never produced output, so an interrupted turn renders as a failed
 * export instead of spinning forever.
 */
function reviveMessage(row: MessageRow): UIMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.parts);
  } catch (error) {
    console.error("chat message parts unparsable; skipping", { id: row.id, error: String(error) });
    return null;
  }
  if (!Array.isArray(parsed)) {
    console.error("chat message parts not an array; skipping", { id: row.id });
    return null;
  }
  if (row.role !== "user" && row.role !== "assistant") return null;

  const parts = parsed.map((part) => {
    const candidate = part as { type?: unknown; state?: unknown };
    if (
      typeof candidate.type === "string" &&
      candidate.type.startsWith("tool-") &&
      candidate.state !== "output-available" &&
      candidate.state !== "output-error"
    ) {
      return { ...candidate, state: "output-error", errorText: INTERRUPTED_TOOL_ERROR };
    }
    return part;
  });

  return { id: row.id, role: row.role, parts } as UIMessage;
}

/**
 * Everything the console route needs in one call: the user's thread list, the
 * requested thread's transcript, and whether the store is usable.
 */
export async function loadThreadPage(
  db: D1Database,
  userId: string,
  threadId: string,
): Promise<ThreadPage> {
  const empty: ThreadPage = { threads: [], messages: [], exists: false, storeAvailable: true };
  if (!isValidThreadId(threadId)) return empty;

  try {
    const [threadList, ownRow, messageRows] = await db.batch([
      db
        .prepare(
          "SELECT id, title, updated_at AS updatedAt FROM chat_thread " +
            "WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT ?2",
        )
        .bind(userId, THREAD_LIST_LIMIT),
      db
        .prepare("SELECT id FROM chat_thread WHERE id = ?1 AND user_id = ?2")
        .bind(threadId, userId),
      // Ownership enforced in SQL, not by the caller: no join match, no rows.
      db
        .prepare(
          "SELECT m.id, m.role, m.parts FROM chat_message m " +
            "JOIN chat_thread t ON t.id = m.thread_id " +
            "WHERE m.thread_id = ?1 AND t.user_id = ?2 ORDER BY m.seq, m.rowid",
        )
        .bind(threadId, userId),
    ]);

    const messages = ((messageRows.results ?? []) as unknown as MessageRow[])
      .map(reviveMessage)
      .filter((message): message is UIMessage => message !== null);

    return {
      threads: (threadList.results ?? []) as unknown as ThreadSummary[],
      messages,
      exists: (ownRow.results ?? []).length > 0,
      storeAvailable: true,
    };
  } catch (error) {
    // Missing table (migration not applied) or a D1 outage: the console still
    // renders and chatting still works, just without history.
    console.error("chat thread load failed", String(error));
    return { ...empty, storeAvailable: false };
  }
}

/** The user's most recent thread, or null. Used by `/` to resume. */
export async function latestThreadId(db: D1Database, userId: string): Promise<string | null> {
  try {
    const row = await db
      .prepare("SELECT id FROM chat_thread WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT 1")
      .bind(userId)
      .first<{ id: string }>();
    return row?.id ?? null;
  } catch (error) {
    console.error("chat thread lookup failed", String(error));
    return null;
  }
}

/** Prior transcript for the model, rebuilt server-side (the client sends only
 * the newest message, so it cannot fabricate earlier turns or tool outputs). */
export async function loadTranscript(
  db: D1Database,
  userId: string,
  threadId: string,
): Promise<UIMessage[]> {
  if (!isValidThreadId(threadId)) return [];
  try {
    const { results } = await db
      .prepare(
        "SELECT m.id, m.role, m.parts FROM chat_message m " +
          "JOIN chat_thread t ON t.id = m.thread_id " +
          "WHERE m.thread_id = ?1 AND t.user_id = ?2 ORDER BY m.seq, m.rowid LIMIT ?3",
      )
      .bind(threadId, userId, MAX_TRANSCRIPT_MESSAGES)
      .all();
    return ((results ?? []) as unknown as MessageRow[])
      .map(reviveMessage)
      .filter((message): message is UIMessage => message !== null);
  } catch (error) {
    console.error("chat transcript load failed", String(error));
    return [];
  }
}

export type ClaimResult = "claimed" | "forbidden" | "unavailable";

/**
 * Create the thread if it does not exist, or touch it if this user owns it —
 * in ONE atomic statement, so create-if-absent and verify-ownership cannot
 * race. Returns "forbidden" when the id belongs to someone else: the
 * `WHERE chat_thread.user_id = excluded.user_id` guard makes the UPDATE branch
 * a no-op for a foreign owner, so `changes` comes back 0 and nothing leaks.
 */
export async function claimThread(
  db: D1Database,
  userId: string,
  userEmail: string,
  threadId: string,
  title: string,
): Promise<ClaimResult> {
  if (!isValidThreadId(threadId)) return "forbidden";
  try {
    const result = await db
      .prepare(
        "INSERT INTO chat_thread (id, user_id, user_email, title) VALUES (?1, ?2, ?3, ?4) " +
          "ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now') " +
          "WHERE chat_thread.user_id = excluded.user_id",
      )
      .bind(threadId, userId, userEmail, title)
      .run();
    return (result.meta.changes ?? 0) > 0 ? "claimed" : "forbidden";
  } catch (error) {
    console.error("chat thread claim failed", String(error));
    return "unavailable";
  }
}

/**
 * Append (or replace) one message. Never throws — a failed history write must
 * not cost the user their answer. Ownership is re-checked in the statement so
 * this is safe even if a caller skipped claimThread.
 */
export async function saveMessage(
  db: D1Database,
  userId: string,
  threadId: string,
  message: UIMessage,
): Promise<void> {
  if (!isValidThreadId(threadId)) return;
  if (message.role !== "user" && message.role !== "assistant") return;
  try {
    await db
      .prepare(
        "INSERT INTO chat_message (thread_id, id, seq, role, parts) " +
          "SELECT ?1, ?2, " +
          "COALESCE((SELECT MAX(seq) + 1 FROM chat_message WHERE thread_id = ?1), 0), ?3, ?4 " +
          "WHERE EXISTS (SELECT 1 FROM chat_thread WHERE id = ?1 AND user_id = ?5) " +
          "ON CONFLICT(thread_id, id) DO UPDATE SET parts = excluded.parts",
      )
      .bind(threadId, message.id, message.role, JSON.stringify(message.parts ?? []), userId)
      .run();
    await db
      .prepare("UPDATE chat_thread SET updated_at = datetime('now') WHERE id = ?1 AND user_id = ?2")
      .bind(threadId, userId)
      .run();
  } catch (error) {
    console.error("chat message save failed", { threadId, error: String(error) });
  }
}

/** Delete one thread and its messages. Ownership is in the predicate. */
export async function deleteThread(
  db: D1Database,
  userId: string,
  threadId: string,
): Promise<boolean> {
  if (!isValidThreadId(threadId)) return false;
  try {
    // Messages are removed explicitly: D1 does not enable foreign keys (and so
    // ON DELETE CASCADE) by default, and the child delete re-checks ownership.
    await db.batch([
      db
        .prepare(
          "DELETE FROM chat_message WHERE thread_id = ?1 AND EXISTS " +
            "(SELECT 1 FROM chat_thread WHERE id = ?1 AND user_id = ?2)",
        )
        .bind(threadId, userId),
      db.prepare("DELETE FROM chat_thread WHERE id = ?1 AND user_id = ?2").bind(threadId, userId),
    ]);
    return true;
  } catch (error) {
    console.error("chat thread delete failed", String(error));
    return false;
  }
}
