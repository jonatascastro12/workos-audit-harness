import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// Hook payloads arrive on stdin and are therefore caller-controlled: anything a
// user process can pipe to the emitter, it can also make up. We never open the
// `transcript_path` the payload claims — we look the session up under the known
// transcript root instead. The session id is validated to a bare slug first, so
// path.join() below cannot be walked out of the root.
const SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/;

function transcriptRoots() {
  const roots = [];
  const configDir = process.env.CLAUDE_CONFIG_DIR;
  if (typeof configDir === 'string' && configDir.trim()) {
    roots.push(path.join(configDir.trim(), 'projects'));
  }
  roots.push(path.join(homedir(), '.claude', 'projects'));
  return roots;
}

export function resolveTranscriptPath(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) return undefined;

  const leaf = `${sessionId}.jsonl`;

  for (const root of transcriptRoots()) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(root, entry.name, leaf);
      if (existsSync(candidate)) return candidate;
    }
  }

  return undefined;
}
