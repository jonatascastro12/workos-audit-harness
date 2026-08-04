#!/usr/bin/env node
// Point pi's local-packages entry at this working copy instead of a detached clone.
//
// pi registers the extension in ~/.pi/agent/settings.json as
//   "local-packages/workos-audit-harness/packages/pi-extension"
// and `pi update --extensions` only refreshes `npm:` sources — a directory under
// local-packages/ is never fetched again. Installing it as a git clone therefore
// pins the extension to whatever commit happened to be HEAD that day, silently,
// with no warning that it has fallen behind.
//
// Replacing the clone with a symlink to this repo removes the drift entirely:
// pi loads packages/pi-extension/dist/index.mjs straight from the working copy,
// so `npm run bundle` is the only step needed to pick up a change.
//
// Idempotent. Refuses to delete a clone with uncommitted work.
//
// Usage: node scripts/link-pi-extension.mjs [--force]

import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readlinkSync, rmSync, mkdirSync, symlinkSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_PACKAGES = path.join(os.homedir(), '.pi', 'agent', 'local-packages');
const LINK = path.join(LOCAL_PACKAGES, 'workos-audit-harness');
const SETTINGS = path.join(os.homedir(), '.pi', 'agent', 'settings.json');
const EXPECTED_ENTRY = 'local-packages/workos-audit-harness/packages/pi-extension';
const force = process.argv.includes('--force');

function fail(message) {
  console.error(`link-pi-extension: ${message}`);
  process.exit(1);
}

if (!existsSync(path.join(ROOT, 'packages', 'pi-extension', 'package.json'))) {
  fail(`${ROOT} does not look like the workos-audit-harness repo`);
}

// Already linked to the right place — nothing to do.
if (existsSync(LINK) && lstatSync(LINK).isSymbolicLink()) {
  const target = path.resolve(path.dirname(LINK), readlinkSync(LINK));
  if (target === ROOT) {
    console.log(`Already linked: ${LINK} -> ${ROOT}`);
    reportSettings();
    process.exit(0);
  }
  console.log(`Relinking (was -> ${target})`);
  rmSync(LINK);
} else if (existsSync(LINK)) {
  // A real directory: only remove it if it is a clean checkout of this repo, so
  // an accidental run can never eat local work.
  let dirty = '';
  try {
    dirty = execFileSync('git', ['-C', LINK, 'status', '--porcelain'], { encoding: 'utf8' }).trim();
  } catch {
    if (!force) fail(`${LINK} exists and is not a git checkout. Re-run with --force to replace it.`);
  }
  if (dirty && !force) {
    fail(`${LINK} has uncommitted changes:\n${dirty}\nCommit/stash them, or re-run with --force.`);
  }
  console.log(`Removing detached clone at ${LINK}`);
  rmSync(LINK, { recursive: true, force: true });
}

mkdirSync(LOCAL_PACKAGES, { recursive: true });
symlinkSync(ROOT, LINK, 'dir');
console.log(`Linked: ${LINK} -> ${ROOT}`);
reportSettings();

// The symlink only takes effect if pi still lists the package. Report rather than
// edit: settings.json is the user's file and may be managed elsewhere.
function reportSettings() {
  if (!existsSync(SETTINGS)) {
    console.log(`\nNote: ${SETTINGS} not found — add the extension to pi's "packages" yourself.`);
    return;
  }
  let packages = [];
  try {
    packages = JSON.parse(readFileSync(SETTINGS, 'utf8')).packages ?? [];
  } catch {
    console.log(`\nNote: could not parse ${SETTINGS}; check its "packages" list manually.`);
    return;
  }
  if (packages.includes(EXPECTED_ENTRY)) {
    console.log('pi settings already list the extension. Restart pi to load it.');
    return;
  }
  console.log(`\nAdd this to "packages" in ${SETTINGS}, then restart pi:\n  "${EXPECTED_ENTRY}"`);
}
