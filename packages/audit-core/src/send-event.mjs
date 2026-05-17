import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { trimToUndefined } from './util.mjs';

export function getHarnessPath() {
  const fromEnv = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_PATH);
  if (fromEnv) return fromEnv;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../pi-extension/scripts/audit-log-harness.mjs');
}

export function sendAuditEvent({ event, config }) {
  const args = [getHarnessPath(), 'emit-event'];
  if (config.organizationId) args.push('--org', config.organizationId);
  if (config.apiKey) args.push('--api-key', config.apiKey);
  execFileSync(process.execPath, args, {
    input: JSON.stringify(event),
    encoding: 'utf8',
    stdio: ['pipe', 'ignore', 'pipe'],
  });
}

export function runHarnessJson({ command, payload = {}, extraArgs = [], config }) {
  const args = [getHarnessPath(), command, '--json', ...extraArgs];
  if (config.organizationId) args.push('--org', config.organizationId);
  if (config.apiKey) args.push('--api-key', config.apiKey);
  const output = execFileSync(process.execPath, args, {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}
