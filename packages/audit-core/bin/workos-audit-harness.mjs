#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(HERE, '..');

function trim(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveBinary() {
  const override = trim(process.env.WORKOS_AUDIT_HARNESS_PATH);
  if (override && existsSync(override)) return { kind: 'binary', path: override };

  const suffix = process.platform === 'win32' ? '.exe' : '';
  const local = path.join(HERE, `workos-audit-harness${suffix}`);
  if (existsSync(local)) return { kind: 'binary', path: local };

  const slug = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'arm64' ? 'arm64' : 'x64'}`;
  const targeted = path.join(HERE, `workos-audit-harness-${slug}${suffix}`);
  if (existsSync(targeted)) return { kind: 'binary', path: targeted };

  // Dev / fallback: run the JS dispatcher under the current Node runtime.
  return { kind: 'node', path: path.join(PACKAGE_DIR, 'src/cli/index.mjs') };
}

const target = resolveBinary();
const args = process.argv.slice(2);
const result = target.kind === 'binary'
  ? spawnSync(target.path, args, { stdio: 'inherit' })
  : spawnSync(process.execPath, [target.path, ...args], { stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 0);
