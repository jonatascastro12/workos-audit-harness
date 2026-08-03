#!/usr/bin/env node
// Rename this template from `internal-app-example` to a new app name.
// Replaces literal occurrences across TOMLs, package.json, README, and the
// deploy workflow. Optionally provisions a D1 database via `wrangler d1 create`
// and writes the resulting `database_id` into both wrangler config files.
//
// Usage:
//   node scripts/rename-app.mjs <new-name> [--dry-run] [--skip-db] [--skip-package]
//
// Designed to be invoked by `internal-cli app create` after the template is
// cloned. Idempotent: re-running on an already-renamed repo is a no-op.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PLACEHOLDER = "internal-app-example";
const PACKAGE_PLACEHOLDER_NAME = "pangyo";

// Prefix prepended to every Cloudflare-bound name (workers, routes, D1, R2,
// Workflows). Keeps newly-provisioned resources from colliding with the prod
// `internal-app-example` resources in the same Cloudflare account.
const CLOUDFLARE_PREFIX = "cd26-";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Wrangler configs: every literal `internal-app-example` is a Cloudflare
// resource name and gets the cd26- prefix.
const CLOUDFLARE_FILES = ["wrangler.toml", "wrangler.worker.toml"];

// Everything else: only URL/derived-name occurrences (the worker hostname,
// `-db`, `-images`, `-workflow`, `-update-workflow`) are Cloudflare-bound and
// get the prefix; bare `internal-app-example` is the GitHub repo / Doppler
// project name and stays unprefixed.
const MIXED_FILES = [
  "package.json",
  "README.md",
  ".github/workflows/build-test-deploy.yml",
];

// Keep this list in sync with `git grep -l internal-app-example` output
// (excluding .git and node_modules).
const TARGET_FILES = [...CLOUDFLARE_FILES, ...MIXED_FILES];

function parseArgs(argv) {
  const flags = new Set();
  const positional = [];
  for (const arg of argv) {
    if (arg.startsWith("--")) flags.add(arg);
    else positional.push(arg);
  }
  return {
    name: positional[0],
    dryRun: flags.has("--dry-run"),
    skipDb: flags.has("--skip-db"),
    skipPackage: flags.has("--skip-package"),
    help: flags.has("--help") || flags.has("-h"),
  };
}

function printHelp() {
  console.log(`Usage: node scripts/rename-app.mjs <new-name> [options]

Replaces all \`${PLACEHOLDER}\` placeholders with <new-name> across template
files, and (by default) provisions a Cloudflare D1 database.

Options:
  --dry-run        Show what would change without writing files
  --skip-db        Don't run \`wrangler d1 create\`
  --skip-package   Don't update package.json's \`name\` field
  -h, --help       Show this help

Examples:
  node scripts/rename-app.mjs my-cool-app
  npm run rename-app -- my-cool-app --skip-db
`);
}

// Cloudflare Workers / D1 naming rules: lowercase alphanumeric and hyphens,
// must start with a letter, 1-63 chars. Same constraint applies cleanly to
// our derived names (`<name>`, `<name>-db`, `<name>-workflow`, ...).
function validateName(name) {
  if (!name) throw new Error("Missing required <new-name> argument.");
  if (name === PLACEHOLDER) {
    throw new Error(`<new-name> cannot be \`${PLACEHOLDER}\` itself.`);
  }
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(name)) {
    throw new Error(
      `Invalid name "${name}". Must be lowercase, start with a letter, ` +
        `contain only [a-z0-9-], and be 1-63 chars.`,
    );
  }
  // Reserve room for the cd26- prefix (5 chars) and the longest derived suffix
  // (`-update-workflow` = 16 chars), so derived names like
  // `cd26-<name>-update-workflow` fit within Cloudflare's 63-char limit.
  if (name.length > 42) {
    throw new Error(
      `Name "${name}" is too long. Derived names like ` +
        `"${CLOUDFLARE_PREFIX}${name}-update-workflow" must fit within 63 chars.`,
    );
  }
}

// Remove the README's `<!-- template-bootstrap:start -->` ... `:end -->` block.
// Those instructions are only meaningful before the rename has run; leaving
// them post-rename produces nonsense ("replace the my-cool-app placeholder").
function stripBootstrapSection(path, dryRun) {
  if (!existsSync(path)) return { stripped: false };
  const before = readFileSync(path, "utf8");
  const re = /\n*<!-- template-bootstrap:start -->[\s\S]*?<!-- template-bootstrap:end -->\n*/;
  if (!re.test(before)) return { stripped: false };
  const after = before.replace(re, "\n\n");
  if (!dryRun) writeFileSync(path, after);
  return { stripped: true };
}

// Order matters: longer suffixes must come first so e.g. `-update-workflow`
// isn't shadowed by the shorter `-workflow` match.
function cloudflareSubs(name) {
  const cd = `${CLOUDFLARE_PREFIX}${name}`;
  return [
    [`${PLACEHOLDER}.workos.tools`, `${cd}.workos.tools`],
    [`${PLACEHOLDER}-update-workflow`, `${cd}-update-workflow`],
    [`${PLACEHOLDER}-workflow`, `${cd}-workflow`],
    [`${PLACEHOLDER}-images`, `${cd}-images`],
    [`${PLACEHOLDER}-db`, `${cd}-db`],
  ];
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

function replaceInFile(relPath, name, dryRun) {
  const path = join(ROOT, relPath);
  if (!existsSync(path)) {
    console.warn(`  skip: ${relPath} (not found)`);
    return { path: relPath, changed: false, count: 0 };
  }
  const before = readFileSync(path, "utf8");
  let text = before;
  let count = 0;

  // Pass A: Cloudflare resource names (URL, -db, -images, -workflow, ...).
  // Applies in every file so that docs and CI references stay in sync with
  // the prefixed wrangler config.
  for (const [from, to] of cloudflareSubs(name)) {
    const n = countOccurrences(text, from);
    if (n > 0) {
      count += n;
      text = text.split(from).join(to);
    }
  }

  // Pass B: bare `internal-app-example` left over. In wrangler files it's
  // still a Cloudflare worker name (gets prefixed); elsewhere it's the GitHub
  // repo / Doppler project identifier (stays unprefixed).
  const isCloudflareFile = CLOUDFLARE_FILES.includes(relPath);
  const bareReplacement = isCloudflareFile ? `${CLOUDFLARE_PREFIX}${name}` : name;
  const bareCount = countOccurrences(text, PLACEHOLDER);
  if (bareCount > 0) {
    count += bareCount;
    text = text.split(PLACEHOLDER).join(bareReplacement);
  }

  if (count === 0) return { path: relPath, changed: false, count: 0 };
  if (!dryRun) writeFileSync(path, text);
  return { path: relPath, changed: true, count };
}

function updatePackageName(path, name, dryRun) {
  if (!existsSync(path)) return { changed: false };
  const text = readFileSync(path, "utf8");
  const pkg = JSON.parse(text);
  if (pkg.name !== PACKAGE_PLACEHOLDER_NAME) {
    return { changed: false, reason: `name is "${pkg.name}", not the placeholder` };
  }
  pkg.name = name;
  // Preserve trailing newline convention.
  const out = JSON.stringify(pkg, null, 2) + (text.endsWith("\n") ? "\n" : "");
  if (!dryRun) writeFileSync(path, out);
  return { changed: true };
}

function isWranglerAvailable() {
  return existsSync(join(ROOT, "node_modules", "wrangler", "package.json"));
}

function isWranglerAuthed() {
  try {
    execFileSync("npx", ["wrangler", "whoami"], {
      cwd: ROOT,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

function createD1Database(dbName) {
  console.log(`\n→ Creating D1 database "${dbName}"...`);
  const out = execFileSync("npx", ["wrangler", "d1", "create", dbName], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  });
  // Wrangler prints a TOML-ish snippet; the only `database_id` line in the
  // output is the new DB's id.
  const match = out.match(/database_id\s*=\s*"([0-9a-f-]{36})"/i);
  if (!match) {
    console.error(out);
    throw new Error(
      "Could not parse database_id from wrangler output. " +
        "Run with --skip-db and paste it manually.",
    );
  }
  return match[1];
}

function writeDatabaseId(path, newId) {
  const before = readFileSync(path, "utf8");
  const after = before.replace(
    /database_id\s*=\s*"[^"]*"/g,
    `database_id = "${newId}"`,
  );
  if (after === before) {
    throw new Error(`No database_id line found in ${path}`);
  }
  writeFileSync(path, after);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  try {
    validateName(args.name);
  } catch (err) {
    console.error(`error: ${err.message}\n`);
    printHelp();
    process.exit(1);
  }

  const { name, dryRun, skipDb, skipPackage } = args;
  console.log(
    `Renaming \`${PLACEHOLDER}\` → \`${name}\`${dryRun ? " (dry-run)" : ""}`,
  );

  // Pass 0: strip the README bootstrap section. Done before literal replacement
  // so the section's prose can mention the placeholder freely without being
  // mangled into a self-referential mess on the way out.
  const stripResult = stripBootstrapSection(join(ROOT, "README.md"), dryRun);
  if (stripResult.stripped) {
    console.log("  README.md: removed template-bootstrap section");
  }

  // Pass 1: literal replacement across known files.
  const results = TARGET_FILES.map((rel) => replaceInFile(rel, name, dryRun));
  const totalReplacements = results.reduce((n, r) => n + r.count, 0);

  for (const r of results) {
    if (r.changed) console.log(`  ${r.path}: ${r.count} replacement(s)`);
  }

  // Pass 2: package.json "name" field.
  if (!skipPackage) {
    const pkgResult = updatePackageName(join(ROOT, "package.json"), name, dryRun);
    if (pkgResult.changed) console.log(`  package.json: name → "${name}"`);
    else if (pkgResult.reason) console.log(`  package.json: skipped (${pkgResult.reason})`);
  }

  if (totalReplacements === 0) {
    console.log(
      `\nNo \`${PLACEHOLDER}\` occurrences found. Repo appears already renamed.`,
    );
  }

  if (dryRun) {
    console.log("\n(dry-run) No files were modified.");
    return;
  }

  // Pass 3: D1 database provisioning. The D1 name carries the cd26- prefix
  // so it can't collide with the prod `internal-app-example-db`.
  if (skipDb) {
    console.log(
      `\nSkipped D1 creation. Run \`npx wrangler d1 create ${CLOUDFLARE_PREFIX}${name}-db\` ` +
        "and paste the `database_id` into wrangler.toml and wrangler.worker.toml.",
    );
    return;
  }

  if (!isWranglerAvailable()) {
    console.warn(
      "\nwrangler isn't installed yet. Run `npm install` then re-run with " +
        "--skip-db replaced by no flag, or paste database_id manually.",
    );
    return;
  }
  if (!isWranglerAuthed()) {
    console.warn(
      "\nwrangler isn't authenticated. Run `npx wrangler login`, then " +
        "re-run this script (or paste database_id manually with --skip-db).",
    );
    return;
  }

  const dbName = `${CLOUDFLARE_PREFIX}${name}-db`;
  let dbId;
  try {
    dbId = createD1Database(dbName);
  } catch (err) {
    console.error(`\nFailed to create D1 database: ${err.message}`);
    console.error(
      "If the database already exists, delete it via the Cloudflare " +
        "dashboard or paste its id manually with --skip-db.",
    );
    process.exit(1);
  }

  writeDatabaseId(join(ROOT, "wrangler.toml"), dbId);
  writeDatabaseId(join(ROOT, "wrangler.worker.toml"), dbId);
  console.log(`  database_id wired into both wrangler configs: ${dbId}`);

  console.log("\nDone. Next steps:");
  console.log("  npm install");
  console.log("  npm run db:migrate:local");
  console.log("  npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
