#!/usr/bin/env node
// Bundle each plugin's runtime entry points into `dist/` with @workos-inc/audit-core
// and its non-native deps inlined. Only native modules (@napi-rs/keyring) and pi's
// peer deps stay external. Each bundled entry gets a preflight banner that runs
// `npm install` once if the plugin's node_modules is missing (the marketplace
// install copies files but does not install deps; the MCP server's start script
// would do it lazily, but hooks fire before that on first session).
//
// Usage:
//   node scripts/bundle-plugins.mjs              # build every plugin
//   node scripts/bundle-plugins.mjs claude       # build a single plugin

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXTERNALS = [
  '@napi-rs/keyring',
  '@mariozechner/pi-ai',
  '@mariozechner/pi-coding-agent',
  'openclaw',
];

const PLUGINS = {
  'claude-plugin': {
    dir: 'packages/claude-plugin',
    entries: ['server/index.mjs', 'scripts/*.mjs'],
    keyringPackage: '@napi-rs/keyring',
  },
  'codex-plugin': {
    dir: 'packages/codex-plugin',
    entries: ['server/index.mjs', 'scripts/*.mjs'],
    keyringPackage: '@napi-rs/keyring',
  },
  'openclaw-plugin': {
    dir: 'packages/openclaw-plugin',
    entries: ['index.mjs', 'server/index.mjs', 'scripts/*.mjs'],
    keyringPackage: '@napi-rs/keyring',
  },
  'pi-extension': {
    dir: 'packages/pi-extension',
    entries: ['index.ts'],
    // pi-extension loads inside pi-coding-agent's runtime; no node_modules of its
    // own — pi resolves keyring (and everything else) from its host install.
    preflight: false,
  },
};

const PREFLIGHT = `// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
// importing externalized native deps (e.g. @napi-rs/keyring). The marketplace
// install copies files only; this is the cheapest place to bootstrap deps so
// hooks can run on a fresh install.
import { existsSync as __preflightExists } from 'node:fs';
import { execFileSync as __preflightExec } from 'node:child_process';
import { fileURLToPath as __preflightFileURL } from 'node:url';
import { createRequire as __preflightRequire } from 'node:module';
import __preflightPath from 'node:path';
(function __ensurePluginDeps() {
  try {
    const here = __preflightPath.dirname(__preflightFileURL(import.meta.url));
    let pluginRoot = here;
    for (let i = 0; i < 4; i += 1) {
      if (__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) break;
      pluginRoot = __preflightPath.resolve(pluginRoot, '..');
    }
    const __pkg = __preflightPath.join(pluginRoot, 'package.json');
    if (!__preflightExists(__pkg)) return;
    // Ask Node whether the dep RESOLVES, rather than testing one hardcoded path.
    // The old check was existsSync(pluginRoot/node_modules/@napi-rs/keyring),
    // which npm workspace hoisting makes permanently false — the package lands in
    // the ROOT node_modules. Every hook therefore re-ran \`npm install\` (~620ms
    // measured) before doing any work, on every single event.
    try {
      __preflightRequire(__pkg).resolve('@napi-rs/keyring');
      return;
    } catch {
      // Genuinely absent — fall through and install it once.
    }
    __preflightExec('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
      cwd: pluginRoot,
      stdio: 'ignore',
      timeout: 90_000,
    });
  } catch {
    // Best-effort: callers fall back to no-keyring mode if install fails.
  }
})();
`;

function getBunRunner() {
  const probe = spawnSync('bun', ['--version'], { stdio: 'ignore' });
  if (probe.status === 0) return { bin: 'bun', argsPrefix: [] };
  return { bin: 'npx', argsPrefix: ['--yes', 'bun'] };
}

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

function bundlePlugin(name, { dir, entries: patterns, preflight = true }) {
  const pluginRoot = path.join(ROOT, dir);
  const distRoot = path.join(pluginRoot, 'dist');
  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(distRoot, { recursive: true });

  const entries = expandEntries(dir, patterns);
  const bun = getBunRunner();
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
    execFileSync(bun.bin, [...bun.argsPrefix, ...args], { stdio: 'inherit', cwd: pluginRoot });
    if (preflight) {
      const bundled = readFileSync(out, 'utf8');
      writeFileSync(out, `${PREFLIGHT}\n${bundled}`, 'utf8');
    }
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
