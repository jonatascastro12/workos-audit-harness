#!/usr/bin/env node
// Bundle each plugin's runtime entry points into `dist/` with @workos-inc/audit-core
// inlined and the real npm deps (@modelcontextprotocol/sdk, @workos-inc/node, zod,
// @napi-rs/keyring) left external. The marketplace ships `dist/` so installed plugins
// are self-contained without the monorepo or a published audit-core package.
//
// Usage:
//   node scripts/bundle-plugins.mjs              # build every plugin
//   node scripts/bundle-plugins.mjs claude       # build a single plugin

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXTERNALS = [
  '@modelcontextprotocol/sdk',
  '@workos-inc/node',
  '@napi-rs/keyring',
  '@mariozechner/pi-ai',
  '@mariozechner/pi-coding-agent',
  'typebox',
  'zod',
];

const PLUGINS = {
  'claude-plugin': {
    dir: 'packages/claude-plugin',
    entries: ['server/index.mjs', 'scripts/*.mjs'],
  },
  'codex-plugin': {
    dir: 'packages/codex-plugin',
    entries: ['server/index.mjs', 'scripts/*.mjs'],
  },
  'pi-extension': {
    dir: 'packages/pi-extension',
    entries: ['index.ts'],
  },
};

function expandEntries(pluginDir, patterns) {
  const entries = [];
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const [subdir, glob] = pattern.split('/');
      const abs = path.join(ROOT, pluginDir, subdir);
      const suffix = glob.replace('*', '');
      for (const file of readdirSync(abs)) {
        if (file.endsWith(suffix)) entries.push(`${subdir}/${file}`);
      }
    } else {
      entries.push(pattern);
    }
  }
  return entries;
}

function bundlePlugin(name, { dir, entries: patterns }) {
  const pluginRoot = path.join(ROOT, dir);
  const distRoot = path.join(pluginRoot, 'dist');
  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(distRoot, { recursive: true });

  const entries = expandEntries(dir, patterns);
  for (const entry of entries) {
    const src = path.join(pluginRoot, entry);
    const out = path.join(distRoot, entry.replace(/\.ts$/, '.mjs'));
    mkdirSync(path.dirname(out), { recursive: true });
    const args = [
      'build', src,
      '--target=node',
      '--format=esm',
      `--outfile=${out}`,
    ];
    for (const ext of EXTERNALS) args.push('--external', ext);
    execFileSync('bun', args, { stdio: 'inherit', cwd: pluginRoot });
  }
  console.log(`✔ bundled ${name} → ${path.relative(ROOT, distRoot)} (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`);
}

const requested = process.argv.slice(2);
const targets = requested.length
  ? requested.map((name) => [name, PLUGINS[name] || PLUGINS[`${name}-plugin`]]).filter(([, v]) => v)
  : Object.entries(PLUGINS);

if (targets.length === 0) {
  console.error(`No matching plugin. Known: ${Object.keys(PLUGINS).join(', ')}`);
  process.exit(1);
}

for (const [name, config] of targets) {
  if (!existsSync(path.join(ROOT, config.dir))) continue;
  bundlePlugin(name, config);
}
