#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(HERE, '..');
const ENTRY = path.join(PACKAGE_DIR, 'src/cli/index.mjs');
const BUILD_DIR = path.join(PACKAGE_DIR, 'build');

const TARGETS = [
  { slug: 'darwin-arm64', bunTarget: 'bun-darwin-arm64', suffix: '' },
  { slug: 'darwin-x64', bunTarget: 'bun-darwin-x64', suffix: '' },
  { slug: 'linux-x64', bunTarget: 'bun-linux-x64', suffix: '' },
  { slug: 'linux-arm64', bunTarget: 'bun-linux-arm64', suffix: '' },
  { slug: 'windows-x64', bunTarget: 'bun-windows-x64', suffix: '.exe' },
];

function sha256(file) {
  const hash = createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}

function bunVersion() {
  try {
    return execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('Bun is required to build audit-core CLI binaries. Install from https://bun.sh.');
  }
}

function buildTarget({ slug, bunTarget, suffix }) {
  const outfile = path.join(BUILD_DIR, `workos-audit-harness-${slug}${suffix}`);
  const args = [
    'build', ENTRY,
    '--compile',
    `--target=${bunTarget}`,
    `--outfile=${outfile}`,
    '--minify',
  ];
  const result = spawnSync('bun', args, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (result.status !== 0) {
    throw new Error(`bun build failed for ${slug} (exit code ${result.status})`);
  }
  const stat = statSync(outfile);
  return {
    slug,
    file: path.basename(outfile),
    bytes: stat.size,
    sha256: sha256(outfile),
  };
}

function readPackageVersion() {
  const pkg = JSON.parse(readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8'));
  return pkg.version;
}

function main() {
  const version = readPackageVersion();
  const requestedTargetSlug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const selected = requestedTargetSlug
    ? TARGETS.filter((target) => target.slug === requestedTargetSlug)
    : TARGETS;
  if (selected.length === 0) {
    throw new Error(`Unknown target: ${requestedTargetSlug}. Known: ${TARGETS.map((target) => target.slug).join(', ')}`);
  }

  rmSync(BUILD_DIR, { recursive: true, force: true });
  mkdirSync(BUILD_DIR, { recursive: true });

  const bun = bunVersion();
  console.error(`Building audit-core CLI v${version} with bun ${bun}`);

  const targets = selected.map((target) => {
    console.error(`  → ${target.slug}`);
    return buildTarget(target);
  });

  const manifest = {
    name: 'workos-audit-harness',
    version,
    bunVersion: bun,
    builtAt: new Date().toISOString(),
    targets,
  };

  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const sumsPath = path.join(BUILD_DIR, 'SHA256SUMS.txt');
  const sums = targets.map((target) => `${target.sha256}  ${target.file}`).join('\n');
  writeFileSync(sumsPath, `${sums}\n`);

  console.error(`\nWrote ${targets.length} binaries + manifest to ${BUILD_DIR}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
