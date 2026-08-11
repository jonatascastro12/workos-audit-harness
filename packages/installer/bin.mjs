#!/usr/bin/env node
// workos-audit-install — one command to instrument every coding agent on this
// machine with the WorkOS audit plugin.
//
// Detects which supported harnesses are installed (Claude Code, Codex,
// OpenClaw, pi), lets you pick (detected ones pre-selected), and runs each
// harness's install steps so you don't copy-paste four different snippets.
//
// Zero runtime dependencies on purpose: this file must work when executed
// straight from `npx github:workos/workos-audit-harness`, before any
// workspace install has happened.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const REPO = "workos/workos-audit-harness";
const REPO_URL = `https://github.com/${REPO}.git`;
const DEFAULT_CHECKOUT = path.join(homedir(), ".workos-audit", "workos-audit-harness");

// ---------------------------------------------------------------------------
// tiny output helpers (no chalk — keep this dependency-free)
const tty = process.stdout.isTTY;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = (s) => c(1, s);
const dim = (s) => c(2, s);
const green = (s) => c(32, s);
const red = (s) => c(31, s);
const cyan = (s) => c(36, s);
const yellow = (s) => c(33, s);

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}

function has(binary) {
  const probe = run(process.platform === "win32" ? "where" : "which", [binary]);
  return probe.status === 0;
}

// Runs a step with live output. Returns { ok, output } — output only captured
// when quiet, because interactive npm installs are worth seeing.
function step(label, cmd, args, opts = {}) {
  process.stdout.write(`  ${dim("$")} ${cmd} ${args.join(" ")}\n`);
  const res = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  const ok = res.status === 0;
  process.stdout.write(`  ${ok ? green("✔") : red("✖")} ${label}\n`);
  return ok;
}

// Like step(), but a non-zero exit whose output matches `tolerate` still
// counts as success (e.g. "marketplace already exists").
function stepTolerant(label, cmd, args, tolerate, opts = {}) {
  process.stdout.write(`  ${dim("$")} ${cmd} ${args.join(" ")}\n`);
  const res = run(cmd, args, opts);
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  const ok = res.status === 0 || tolerate.test(out);
  if (out.trim()) process.stdout.write(out.replace(/^/gm, "    ") + "\n");
  process.stdout.write(`  ${ok ? green("✔") : red("✖")} ${label}\n`);
  return ok;
}

// ---------------------------------------------------------------------------
// checkout management: Codex/OpenClaw/pi install from a repo checkout. When
// this script already runs inside one (dev workflow), use it; otherwise keep a
// stable clone under ~/.workos-audit/ — NOT the ephemeral npx cache, which
// matters for pi, whose extension keeps loading from the checkout afterwards.
function repoRootOfThisFile() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  return existsSync(path.join(root, ".claude-plugin", "marketplace.json")) &&
    existsSync(path.join(root, ".git"))
    ? root
    : null;
}

function ensureCheckout(dir) {
  const local = repoRootOfThisFile();
  if (local) {
    console.log(`  ${dim("using this checkout:")} ${local}`);
    return local;
  }
  if (existsSync(path.join(dir, ".git"))) {
    console.log(`  ${dim("updating checkout:")} ${dir}`);
    run("git", ["-C", dir, "pull", "--ff-only"]); // best effort; a dirty/old clone still works
    return dir;
  }
  mkdirSync(path.dirname(dir), { recursive: true });
  if (!step(`clone ${REPO}`, "git", ["clone", "--depth=1", REPO_URL, dir])) return null;
  return dir;
}

let checkoutCache;
function checkout(dir) {
  if (checkoutCache === undefined) checkoutCache = ensureCheckout(dir);
  return checkoutCache;
}

// ---------------------------------------------------------------------------
// the agents we support
const AGENTS = [
  {
    id: "claude",
    label: "Claude Code",
    binary: "claude",
    needsCheckout: false,
    install() {
      const okMarket = stepTolerant(
        "add marketplace workos-audit-plugins",
        "claude",
        ["plugin", "marketplace", "add", REPO, "--scope", "user"],
        /already/i,
      );
      const okInstall =
        okMarket &&
        stepTolerant(
          "install workos-audit@workos-audit-plugins",
          "claude",
          ["plugin", "install", "workos-audit@workos-audit-plugins", "--scope", "user"],
          /already/i,
        );
      return {
        ok: okInstall,
        next: "Restart Claude Code, then run /workos-audit-setup to wire up credentials.",
      };
    },
  },
  {
    id: "codex",
    label: "Codex",
    binary: "codex",
    needsCheckout: true,
    install(dir) {
      const root = checkout(dir);
      if (!root) return { ok: false };
      const ok = stepTolerant(
        "add marketplace (from checkout)",
        "codex",
        ["plugin", "marketplace", "add", root],
        /already/i,
      );
      return {
        ok,
        next: "Restart Codex and install/enable workos-audit from the “WorkOS Audit Plugins” marketplace.",
      };
    },
  },
  {
    id: "openclaw",
    label: "OpenClaw",
    binary: "openclaw",
    needsCheckout: true,
    install(dir) {
      const root = checkout(dir);
      if (!root) return { ok: false };
      const plugin = path.join(root, "packages", "openclaw-plugin");
      const ok =
        step("npm install (openclaw-plugin)", "npm", ["install", "--no-audit", "--no-fund"], {
          cwd: plugin,
          env: { ...process.env, WORKOS_AUDIT_HARNESS_SKIP_DOWNLOAD: "1" },
        }) &&
        step("bundle plugin", "npm", ["run", "bundle"], { cwd: plugin }) &&
        stepTolerant("openclaw plugins install", "openclaw", ["plugins", "install", plugin], /already/i) &&
        stepTolerant("openclaw plugins enable", "openclaw", ["plugins", "enable", "workos-audit"], /already/i);
      return { ok, next: "Restart the OpenClaw gateway to load the plugin." };
    },
  },
  {
    id: "pi",
    label: "pi-coding-agent",
    binary: "pi",
    needsCheckout: true,
    install(dir) {
      const root = checkout(dir);
      if (!root) return { ok: false };
      const ok = step("npm install (workspace root)", "npm", ["install", "--no-audit", "--no-fund"], {
        cwd: root,
        env: { ...process.env, WORKOS_AUDIT_HARNESS_SKIP_DOWNLOAD: "1" },
      });
      return {
        ok,
        next:
          `Register the extension with pi: run pi from ${root} (its package.json declares ` +
          `the extension), or point your pi config at ${path.join(root, "packages", "pi-extension", "dist", "index.mjs")}.`,
      };
    },
  },
];

// ---------------------------------------------------------------------------
// interactive multi-select: ↑/↓ move, space toggles, a toggles all, enter confirms
async function multiSelect(items) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("not a TTY"); // caller falls back
  }
  let cursor = 0;
  const state = items.map((i) => ({ ...i }));

  const render = (first = false) => {
    if (!first) process.stdout.write(`\x1b[${state.length + 1}A`);
    process.stdout.write(
      `${bold("Select the agents to instrument")} ${dim("(space toggles · a all · enter confirms)")}\x1b[K\n`,
    );
    for (let i = 0; i < state.length; i++) {
      const it = state[i];
      const pointer = i === cursor ? cyan("❯") : " ";
      const box = it.selected ? green("◉") : dim("◯");
      const note = it.detected ? green(" (detected)") : dim(" (not detected)");
      process.stdout.write(`${pointer} ${box} ${it.label}${note}\x1b[K\n`);
    }
  };

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  render(true);

  return new Promise((resolve, reject) => {
    const done = (err, value) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("keypress", onKey);
      err ? reject(err) : resolve(value);
    };
    const onKey = (_ch, key) => {
      if (!key) return;
      if (key.name === "c" && key.ctrl) return done(new Error("interrupted"));
      if (key.name === "up") cursor = (cursor + state.length - 1) % state.length;
      else if (key.name === "down") cursor = (cursor + 1) % state.length;
      else if (key.name === "space") state[cursor].selected = !state[cursor].selected;
      else if (key.name === "a") {
        const all = state.every((s) => s.selected);
        for (const s of state) s.selected = !all;
      } else if (key.name === "return") return done(null, state.filter((s) => s.selected).map((s) => s.id));
      render();
    };
    process.stdin.on("keypress", onKey);
  });
}

// numbered fallback for non-TTY-raw environments
async function numberedSelect(items) {
  console.log(bold("Select the agents to instrument") + dim(" (comma-separated numbers, enter = detected)"));
  items.forEach((it, i) => {
    const note = it.detected ? green("(detected)") : dim("(not detected)");
    console.log(`  ${i + 1}. ${it.label} ${note}`);
  });
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) => rl.question("> ", res));
  rl.close();
  const picks = answer
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => n >= 1 && n <= items.length);
  return picks.length ? picks.map((n) => items[n - 1].id) : items.filter((i) => i.detected).map((i) => i.id);
}

// ---------------------------------------------------------------------------
function usage() {
  console.log(`${bold("workos-audit-install")} — instrument your coding agents with WorkOS audit logs

Usage:
  npx github:${REPO}                 interactive: detect, pick, install
  workos-audit-install --yes         install for every detected agent, no prompt
  workos-audit-install --agents claude,codex
  workos-audit-install --list        show what is detected and exit

Options:
  -a, --agents <ids>    comma-separated: ${AGENTS.map((a) => a.id).join(", ")}
  -y, --yes             skip the prompt; use detected (or --agents) as-is
      --checkout <dir>  where Codex/OpenClaw/pi installs keep their repo checkout
                        (default: ${DEFAULT_CHECKOUT})
      --list            print detection results and exit
  -h, --help            this help
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (long, short) => argv.includes(long) || (short && argv.includes(short));
  const valueOf = (long, short) => {
    for (const name of [long, short].filter(Boolean)) {
      const i = argv.indexOf(name);
      if (i !== -1 && argv[i + 1]) return argv[i + 1];
      const pref = argv.find((a) => a.startsWith(`${name}=`));
      if (pref) return pref.split("=").slice(1).join("=");
    }
    return undefined;
  };

  if (flag("--help", "-h")) return usage();

  const checkoutDir = valueOf("--checkout") ?? DEFAULT_CHECKOUT;
  const detected = AGENTS.map((a) => ({ ...a, detected: has(a.binary) }));

  console.log(`\n${bold("WorkOS Audit Harness · quick install")}\n`);
  for (const a of detected) {
    console.log(`  ${a.detected ? green("●") : dim("○")} ${a.label} ${dim(`(${a.binary})`)}`);
  }
  console.log("");

  if (flag("--list")) return;

  let picked;
  const agentsArg = valueOf("--agents", "-a");
  if (agentsArg) {
    picked = agentsArg.split(",").map((s) => s.trim()).filter(Boolean);
    const unknown = picked.filter((id) => !AGENTS.some((a) => a.id === id));
    if (unknown.length) {
      console.error(red(`Unknown agent(s): ${unknown.join(", ")}. Known: ${AGENTS.map((a) => a.id).join(", ")}`));
      process.exitCode = 2;
      return;
    }
  } else if (flag("--yes", "-y")) {
    picked = detected.filter((a) => a.detected).map((a) => a.id);
  } else {
    const items = detected.map((a) => ({ id: a.id, label: a.label, detected: a.detected, selected: a.detected }));
    try {
      picked = await multiSelect(items);
    } catch (err) {
      if (err.message === "interrupted") return void (process.exitCode = 130);
      picked = await numberedSelect(items);
    }
  }

  if (!picked.length) {
    console.log(yellow("Nothing selected — nothing to do."));
    return;
  }

  const results = [];
  for (const id of picked) {
    const agent = AGENTS.find((a) => a.id === id);
    console.log(`\n${bold(`── ${agent.label} `)}${dim("─".repeat(Math.max(0, 40 - agent.label.length)))}`);
    if (!has(agent.binary)) {
      console.log(`  ${yellow("!")} ${agent.binary} not found on PATH — installing anyway (it may live elsewhere)`);
    }
    const { ok, next } = agent.install(checkoutDir);
    results.push({ agent, ok, next });
  }

  console.log(`\n${bold("Summary")}`);
  for (const r of results) {
    console.log(`  ${r.ok ? green("✔") : red("✖")} ${r.agent.label}`);
    if (r.ok && r.next) console.log(`      ${dim("next:")} ${r.next}`);
  }
  console.log(`
${bold("Credentials")} ${dim("(shared by every integration)")}
  Easiest: ${cyan("npx -y workos@latest auth login")} — or set WORKOS_API_KEY and
  WORKOS_ORGANIZATION_ID. If no organization is set, the harness finds or
  creates one named “Audit Log Harness”. Fleet rollout without laptop keys:
  https://github.com/${REPO}#fleet-rollout-no-key-on-laptops
`);
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

main().catch((err) => {
  console.error(red(err.stack ?? String(err)));
  process.exitCode = 1;
});
