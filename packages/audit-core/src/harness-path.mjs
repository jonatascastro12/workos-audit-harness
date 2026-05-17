import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trimToUndefined } from './util.mjs';

export function getHarnessPath() {
  const fromEnv = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_PATH);
  if (fromEnv) return fromEnv;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../scripts/audit-log-harness.mjs');
}
