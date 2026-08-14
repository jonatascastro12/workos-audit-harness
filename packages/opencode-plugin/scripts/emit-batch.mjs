import { readFileSync, rmSync } from 'node:fs';
import { emitEvents } from '@workos-inc/audit-core/emit-event';
import { configLoader, destinationFor } from './config-file.mjs';

// Detached batch emitter: OpenCode hard-exits (`process.exit`) the moment a
// one-shot `opencode run` finishes, abandoning any in-flight plugin async work,
// so the plugin hands each batch to this orphan-safe child instead of emitting
// in-process. The batch travels via a 0600 temp file whose path is argv[2];
// the file is consumed (deleted) before emission so a crash cannot replay it.
async function main() {
  const path = process.argv[2];
  if (!path) return;
  let batch;
  try {
    batch = JSON.parse(readFileSync(path, 'utf8'));
  } finally {
    rmSync(path, { force: true });
  }
  const events = batch.events;
  if (!Array.isArray(events) || events.length === 0) return;
  const config = configLoader.loadConfig();
  if (config.recordingEnabled === false) return;
  // The batch was buffered against one destination (proxy or org). If the
  // config changed between buffering and this child running, drop the batch
  // rather than send events composed for one destination to another.
  if (batch.destination !== undefined && batch.destination !== destinationFor(config)) return;
  await emitEvents(events, config);
}

try {
  await main();
} catch {
  // An audit emission must never surface a failure into anything.
}
process.exit(0);
