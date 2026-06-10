#!/usr/bin/env node
// Fail if a plugin's version is out of sync across package.json, plugin manifest,
// and marketplace entry. Run via `npm run check:versions` or directly.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CHECKS = [
  {
    plugin: 'claude-plugin',
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
    sources: [
      { file: 'packages/codex-plugin/package.json', pick: (json) => json.version },
      { file: 'packages/codex-plugin/.codex-plugin/plugin.json', pick: (json) => json.version },
    ],
  },
  {
    plugin: 'openclaw-plugin',
    sources: [
      { file: 'packages/openclaw-plugin/package.json', pick: (json) => json.version },
      { file: 'packages/openclaw-plugin/openclaw.plugin.json', pick: (json) => json.version },
    ],
  },
];

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
}

const failures = [];
for (const { plugin, sources } of CHECKS) {
  const observed = sources.map((source) => ({
    label: source.label || source.file,
    version: source.pick(readJson(source.file)),
  }));
  const versions = new Set(observed.map((entry) => entry.version));
  if (versions.size === 1 && !versions.has(undefined)) {
    console.log(`✓ ${plugin}: ${[...versions][0]}`);
    continue;
  }
  failures.push({ plugin, observed });
}

if (failures.length > 0) {
  console.error('');
  console.error('Plugin version drift detected:');
  for (const { plugin, observed } of failures) {
    console.error(`  ${plugin}:`);
    for (const entry of observed) {
      console.error(`    ${entry.label} -> ${entry.version ?? '(missing)'}`);
    }
  }
  console.error('');
  console.error('Bump the lagging file(s) so every source agrees, then re-run.');
  process.exit(1);
}
