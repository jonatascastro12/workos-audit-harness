#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(HERE, '..');
const BIN_DIR = path.join(PACKAGE_DIR, 'bin');

const REPO_OWNER = process.env.WORKOS_AUDIT_HARNESS_REPO_OWNER || 'jonatascastro12';
const REPO_NAME = process.env.WORKOS_AUDIT_HARNESS_REPO_NAME || 'workos-audit-harness';

const PLATFORM_SLUGS = {
  'darwin-arm64': { slug: 'darwin-arm64', suffix: '' },
  'darwin-x64': { slug: 'darwin-x64', suffix: '' },
  'linux-x64': { slug: 'linux-x64', suffix: '' },
  'linux-arm64': { slug: 'linux-arm64', suffix: '' },
  'win32-x64': { slug: 'windows-x64', suffix: '.exe' },
};

function log(...parts) {
  process.stderr.write(`[workos-audit-harness postinstall] ${parts.join(' ')}\n`);
}

function isSkipped() {
  const flag = (process.env.WORKOS_AUDIT_HARNESS_SKIP_DOWNLOAD || '').toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

function getTarget() {
  const key = `${process.platform}-${process.arch}`;
  const target = PLATFORM_SLUGS[key];
  if (!target) {
    log(`No prebuilt binary for ${key}; the CLI will fall back to running under Node.`);
    return undefined;
  }
  return target;
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'workos-audit-harness-postinstall' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'workos-audit-harness-postinstall' },
    redirect: 'follow',
  });
  if (!response.ok) return undefined;
  return await response.text();
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function main() {
  if (isSkipped()) {
    log('WORKOS_AUDIT_HARNESS_SKIP_DOWNLOAD set; skipping binary download.');
    return;
  }

  const target = getTarget();
  if (!target) return;

  const pkg = JSON.parse(readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8'));
  const version = pkg.version;
  const tag = `v${version}`;
  const fileName = `workos-audit-harness-${target.slug}${target.suffix}`;
  const releaseBase = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}`;
  const binaryUrl = `${releaseBase}/${fileName}`;
  const manifestUrl = `${releaseBase}/manifest.json`;

  mkdirSync(BIN_DIR, { recursive: true });
  const finalPath = path.join(BIN_DIR, `workos-audit-harness${target.suffix}`);

  try {
    log(`Downloading ${fileName} for ${tag}`);
    const buffer = await fetchBuffer(binaryUrl);

    const manifestText = await fetchText(manifestUrl);
    if (manifestText) {
      try {
        const manifest = JSON.parse(manifestText);
        const expected = manifest.targets?.find((entry) => entry.file === fileName);
        if (expected?.sha256) {
          const actual = sha256Hex(buffer);
          if (actual !== expected.sha256) {
            throw new Error(`SHA-256 mismatch for ${fileName}: expected ${expected.sha256}, got ${actual}`);
          }
        }
      } catch (error) {
        if (error.message.startsWith('SHA-256 mismatch')) throw error;
        log(`Manifest unavailable or unparseable; skipping integrity check (${error.message}).`);
      }
    } else {
      log('Release manifest.json not found; skipping integrity check.');
    }

    const tmpPath = path.join(tmpdir(), `workos-audit-harness-${process.pid}-${Date.now()}${target.suffix}`);
    writeFileSync(tmpPath, buffer);
    if (process.platform !== 'win32') chmodSync(tmpPath, 0o755);
    if (existsSync(finalPath)) unlinkSync(finalPath);
    renameSync(tmpPath, finalPath);
    log(`Installed ${finalPath}`);
  } catch (error) {
    log(`Skipped binary download: ${error instanceof Error ? error.message : String(error)}`);
    log('The CLI will fall back to running under Node.');
  }
}

main().catch((error) => {
  log(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(0);
});
