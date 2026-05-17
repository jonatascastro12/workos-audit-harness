import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trimToUndefined } from './util.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(HERE, '..');

function platformSuffix() {
  return process.platform === 'win32' ? '.exe' : '';
}

function platformSlug() {
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  return `${platform}-${arch}`;
}

export function getHarnessBinary() {
  const fromEnv = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_PATH);
  if (fromEnv && existsSync(fromEnv)) return { kind: 'binary', path: fromEnv };

  const suffix = platformSuffix();
  const local = path.join(PACKAGE_DIR, 'bin', `workos-audit-harness${suffix}`);
  if (existsSync(local)) return { kind: 'binary', path: local };

  const targeted = path.join(PACKAGE_DIR, 'bin', `workos-audit-harness-${platformSlug()}${suffix}`);
  if (existsSync(targeted)) return { kind: 'binary', path: targeted };

  return { kind: 'node', path: path.join(PACKAGE_DIR, 'src/cli/index.mjs') };
}

// Back-compat: legacy callers expect a path string.
export function getHarnessPath() {
  const resolved = getHarnessBinary();
  return resolved.path;
}
