import { execFileSync } from 'node:child_process';
import { getHarnessBinary, getHarnessPath } from './harness-path.mjs';

export { getHarnessPath };

function buildCommand(command, config, extraArgs = []) {
  const target = getHarnessBinary();
  const args = [command, ...extraArgs];
  if (config.organizationId) args.push('--org', config.organizationId);
  if (config.apiKey) args.push('--api-key', config.apiKey);

  if (target.kind === 'binary') {
    return { bin: target.path, argv: args };
  }
  return { bin: process.execPath, argv: [target.path, ...args] };
}

export function sendAuditEvent({ event, config }) {
  const { bin, argv } = buildCommand('emit-event', config);
  execFileSync(bin, argv, {
    input: JSON.stringify(event),
    encoding: 'utf8',
    stdio: ['pipe', 'ignore', 'pipe'],
  });
}

export function runHarnessJson({ command, payload = {}, extraArgs = [], config }) {
  const { bin, argv } = buildCommand(command, config, ['--json', ...extraArgs]);
  const output = execFileSync(bin, argv, {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}
