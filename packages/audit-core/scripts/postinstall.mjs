#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(HERE, '..');
const BIN_DIR = path.join(PACKAGE_DIR, 'bin');

const REPO_OWNER = process.env.WORKOS_AUDIT_HARNESS_REPO_OWNER || 'workos';
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

/**
 * Thrown only when a downloaded binary fails its published checksum. Kept
 * distinct from every other failure because the two demand opposite handling:
 * a network/404 failure is routine (fall back to Node, exit 0), a checksum
 * mismatch means the bytes are not the release's bytes and must stop the install.
 */
class IntegrityError extends Error {}

/**
 * The expected SHA-256 for `fileName`, from the release's own manifest.json,
 * falling back to the SHA256SUMS.txt that `build:cli` emits alongside it —
 * releases publish both, and either one being reachable is enough to verify.
 *
 * Returns undefined when neither asset yields a hash for this file. Callers
 * must treat that as "cannot verify" and refuse the binary: the checksum ships
 * from the same release as the binary, so it proves the download matches what
 * was published (transfer corruption, a truncated CDN response, a swapped
 * asset) — it is not a signature, and skipping it proves nothing at all.
 */
async function expectedSha256(releaseBase, fileName) {
  const manifestText = await fetchText(`${releaseBase}/manifest.json`);
  if (manifestText) {
    try {
      const manifest = JSON.parse(manifestText);
      const entry = manifest.targets?.find((target) => target.file === fileName);
      if (entry?.sha256) return String(entry.sha256).trim().toLowerCase();
    } catch {
      // Unparseable manifest: try SHA256SUMS.txt before giving up.
    }
  }

  const sumsText = await fetchText(`${releaseBase}/SHA256SUMS.txt`);
  if (sumsText) {
    for (const line of sumsText.split('\n')) {
      // `sha256sum` format: hex, two spaces (or ` *` in binary mode), file name.
      const match = /^([0-9a-f]{64}) [ *](.+?)\s*$/i.exec(line);
      if (match && match[2] === fileName) return match[1].toLowerCase();
    }
  }

  return undefined;
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

  mkdirSync(BIN_DIR, { recursive: true });
  const finalPath = path.join(BIN_DIR, `workos-audit-harness${target.suffix}`);

  try {
    log(`Downloading ${fileName} for ${tag}`);
    const buffer = await fetchBuffer(binaryUrl);

    // Verify BEFORE anything touches the filesystem: the bytes are never written,
    // never chmod +x'd, and never reachable as `workos-audit-harness` unless they
    // hash to what the release published.
    const expected = await expectedSha256(releaseBase, fileName);
    if (!expected) {
      // Not a mismatch — we simply could not fetch a checksum (offline, proxy,
      // a release cut without the manifest). Refuse the binary anyway and let
      // the CLI run under Node: degrading to a slower-but-verified code path is
      // fine, executing unverified bytes is not.
      throw new Error(`No published checksum for ${fileName}; refusing to install an unverified binary.`);
    }
    const actual = sha256Hex(buffer);
    if (actual !== expected) {
      throw new IntegrityError(`SHA-256 mismatch for ${fileName}: expected ${expected}, got ${actual}`);
    }

    const tmpPath = path.join(tmpdir(), `workos-audit-harness-${process.pid}-${Date.now()}${target.suffix}`);
    writeFileSync(tmpPath, buffer);
    if (process.platform !== 'win32') chmodSync(tmpPath, 0o755);
    if (existsSync(finalPath)) unlinkSync(finalPath);
    renameSync(tmpPath, finalPath);
    log(`Installed ${finalPath}`);
  } catch (error) {
    if (error instanceof IntegrityError) {
      // Fail the install. The download succeeded and the release told us what
      // those bytes should be, and they are not those bytes — that is tampering
      // or corruption, not a flaky network, and it must not be a warning someone
      // scrolls past in npm output.
      log(error.message);
      log('Refusing to install. Delete any stale bin/workos-audit-harness, then reinstall or');
      log('set WORKOS_AUDIT_HARNESS_SKIP_DOWNLOAD=1 to run the CLI under Node instead.');
      process.exit(1);
    }
    log(`Skipped binary download: ${error instanceof Error ? error.message : String(error)}`);
    log('The CLI will fall back to running under Node.');
  }
}

main().catch((error) => {
  // Any other failure is best-effort: a postinstall must not break `npm install`
  // when the only consequence is running the CLI under Node. Integrity failures
  // are the deliberate exception and exit non-zero above.
  log(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(0);
});
