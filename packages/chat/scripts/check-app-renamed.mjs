#!/usr/bin/env node
// Guard run before `build` and `deploy` to ensure the template's
// `internal-app-example` placeholder has been replaced.
//
// Exits 0 (allow) when:
//   - the git origin still points at workos/internal-app-example (this IS
//     the template repo — its own builds and deploys must keep working), or
//   - no occurrences of the placeholder remain.
//
// Exits 1 (block) otherwise, with instructions on how to fix.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PLACEHOLDER = "internal-app-example";
const TEMPLATE_REPO_PATTERN = /workos\/internal-app-example(\.git)?$/i;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const TARGET_FILES = [
  "wrangler.toml",
  "wrangler.worker.toml",
  "package.json",
  "README.md",
  ".github/workflows/build-test-deploy.yml",
];

function getOriginUrl() {
  try {
    return execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function findOccurrences() {
  const hits = [];
  for (const rel of TARGET_FILES) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (line.includes(PLACEHOLDER)) {
        hits.push({ file: rel, line: i + 1, text: line.trim() });
      }
    });
  }
  return hits;
}

const origin = getOriginUrl();
if (origin && TEMPLATE_REPO_PATTERN.test(origin)) {
  // This is the template repo itself; its own deploy must keep the literal.
  process.exit(0);
}

const hits = findOccurrences();
if (hits.length === 0) process.exit(0);

console.error(
  `\n✗ Template placeholder \`${PLACEHOLDER}\` still present in ${hits.length} location(s):\n`,
);
for (const h of hits) {
  console.error(`    ${h.file}:${h.line}  ${h.text}`);
}
console.error(
  `\nThis repo (${origin || "unknown remote"}) doesn't look like the template,\n` +
    `but it still contains the placeholder. Run:\n\n` +
    `    npm run rename-app -- <your-app-name>\n\n` +
    `Or, if this is intentional, set SKIP_APP_RENAME_CHECK=1 to bypass.\n`,
);

if (process.env.SKIP_APP_RENAME_CHECK === "1") {
  console.error("SKIP_APP_RENAME_CHECK=1 set; proceeding anyway.\n");
  process.exit(0);
}
process.exit(1);
