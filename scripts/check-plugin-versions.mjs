#!/usr/bin/env node
// Guard the version numbers users actually install against.
//
// Two independent checks:
//
//   1. AGREEMENT (always). A plugin's version is duplicated across its
//      package.json, its plugin manifest, and — for Claude Code — the
//      marketplace entry. They must agree, or a machine installs one version
//      and reports another.
//
//   2. BUMPED (only with --changed-since <ref>). Distribution here is the git
//      repo itself: marketplace clients pull by version, and pi loads
//      dist/index.mjs straight from a checkout. So shipping a source change
//      without bumping the version means machines keep the old code with no
//      signal that anything is stale. Nothing caught that before.
//
// Usage:
//   node scripts/check-plugin-versions.mjs
//   node scripts/check-plugin-versions.mjs --changed-since origin/main

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CHECKS = [
  {
    plugin: 'claude-plugin',
    dir: 'packages/claude-plugin',
    sources: [
      { file: 'packages/claude-plugin/package.json', pick: (json) => json.version },
      { file: 'packages/claude-plugin/.claude-plugin/plugin.json', pick: (json) => json.version },
      {
        file: '.claude-plugin/marketplace.json',
        pick: (json) => json.plugins?.find((p) => p.name === 'workos-audit')?.version,
        label: '.claude-plugin/marketplace.json (workos-audit entry)',
      },
    ],
  },
  {
    plugin: 'codex-plugin',
    dir: 'packages/codex-plugin',
    sources: [
      { file: 'packages/codex-plugin/package.json', pick: (json) => json.version },
      { file: 'packages/codex-plugin/.codex-plugin/plugin.json', pick: (json) => json.version },
    ],
  },
  {
    plugin: 'openclaw-plugin',
    dir: 'packages/openclaw-plugin',
    sources: [
      { file: 'packages/openclaw-plugin/package.json', pick: (json) => json.version },
      { file: 'packages/openclaw-plugin/openclaw.plugin.json', pick: (json) => json.version },
    ],
  },
  {
    plugin: 'pi-extension',
    dir: 'packages/pi-extension',
    // Single manifest, so check 1 is a tautology for pi — it cannot disagree
    // with itself. Listed anyway for two reasons: a missing or malformed version
    // still fails here, and pi is covered by check 2, which is the one that
    // matters for it. pi is loaded straight from a checkout (see the symlink
    // setup in scripts/link-pi-extension.mjs), so a stale version is
    // indistinguishable from a current one at a glance.
    sources: [{ file: 'packages/pi-extension/package.json', pick: (json) => json.version }],
  },
];

const SEMVER = /^\d+\.\d+\.\d+(?:[-+].+)?$/;

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

const failures = [];

// ---------------------------------------------------------------- check 1
for (const { plugin, sources } of CHECKS) {
  const observed = sources.map((source) => ({
    label: source.label || source.file,
    version: source.pick(readJson(source.file)),
  }));
  const versions = new Set(observed.map((entry) => entry.version));
  const [only] = [...versions];

  if (versions.size !== 1 || versions.has(undefined)) {
    failures.push({ kind: 'drift', plugin, observed });
    continue;
  }
  if (!SEMVER.test(String(only))) {
    failures.push({ kind: 'malformed', plugin, observed });
    continue;
  }
  console.log(`✓ ${plugin}: ${only}`);
}

// ---------------------------------------------------------------- check 2
const sinceIndex = process.argv.indexOf('--changed-since');
if (sinceIndex !== -1) {
  const ref = process.argv[sinceIndex + 1];
  if (!ref) {
    console.error('--changed-since needs a git ref');
    process.exit(2);
  }

  let base;
  try {
    // Three-dot: compare against the merge base, so unrelated commits landing on
    // the base branch never look like changes in this branch.
    base = git(['merge-base', ref, 'HEAD']);
  } catch {
    console.error(`\nCannot resolve ${ref} — skipping the version-bump check.`);
    console.error('Fetch the base ref first (actions/checkout needs fetch-depth: 0).');
    process.exit(failures.length > 0 ? 1 : 0);
  }

  console.log(`\nChecking version bumps against ${ref} (${base.slice(0, 7)}):`);

  for (const { plugin, dir } of CHECKS) {
    // dist/ is build output: it changes whenever the bundler runs, so requiring
    // a bump for it alone would demand a version for no behaviour change.
    const changed = git([
      'diff', '--name-only', `${base}...HEAD`, '--', dir, `:(exclude)${dir}/dist`,
    ]).split('\n').filter(Boolean);

    if (changed.length === 0) {
      console.log(`  – ${plugin}: unchanged`);
      continue;
    }

    const manifest = `${dir}/package.json`;
    let before;
    try {
      before = JSON.parse(git(['show', `${base}:${manifest}`])).version;
    } catch {
      // New package on this branch — nothing to bump from.
      console.log(`  ✓ ${plugin}: new package`);
      continue;
    }
    const after = readJson(manifest).version;

    if (before === after) {
      failures.push({ kind: 'unbumped', plugin, version: after, changed });
      continue;
    }
    console.log(`  ✓ ${plugin}: ${before} -> ${after} (${changed.length} file(s) changed)`);
  }
}

// ---------------------------------------------------------------- report
if (failures.length > 0) {
  console.error('');
  for (const failure of failures) {
    if (failure.kind === 'unbumped') {
      console.error(`${failure.plugin}: source changed but version is still ${failure.version}`);
      for (const file of failure.changed.slice(0, 10)) console.error(`    ${file}`);
      if (failure.changed.length > 10) console.error(`    …and ${failure.changed.length - 10} more`);
      console.error('  Machines install this by version. Bump it, and rerun `npm run bundle`');
      console.error('  so the committed dist/ matches the source.');
    } else if (failure.kind === 'malformed') {
      console.error(`${failure.plugin}: version is not semver:`);
      for (const entry of failure.observed) console.error(`    ${entry.label} -> ${entry.version ?? '(missing)'}`);
    } else {
      console.error(`${failure.plugin}: version drift across manifests:`);
      for (const entry of failure.observed) console.error(`    ${entry.label} -> ${entry.version ?? '(missing)'}`);
      console.error('  Bump the lagging file(s) so every source agrees.');
    }
    console.error('');
  }
  process.exit(1);
}
