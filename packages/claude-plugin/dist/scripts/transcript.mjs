// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
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
    // the ROOT node_modules. Every hook therefore re-ran `npm install` (~620ms
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

// scripts/transcript.mjs
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
var SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/;
function transcriptRoots() {
  const roots = [];
  const configDir = process.env.CLAUDE_CONFIG_DIR;
  if (typeof configDir === "string" && configDir.trim()) {
    roots.push(path.join(configDir.trim(), "projects"));
  }
  roots.push(path.join(homedir(), ".claude", "projects"));
  return roots;
}
function resolveTranscriptPath(sessionId) {
  if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId))
    return;
  const leaf = `${sessionId}.jsonl`;
  for (const root of transcriptRoots()) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory())
        continue;
      const candidate = path.join(root, entry.name, leaf);
      if (existsSync(candidate))
        return candidate;
    }
  }
  return;
}
export {
  resolveTranscriptPath
};
