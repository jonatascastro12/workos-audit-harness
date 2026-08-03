# Convert an Existing App to a Cloudflare Internal App

This repo includes an internal Claude/Cursor skill for converting an existing local app into a WorkOS internal app deployed to Cloudflare.

The skill lives at:

```text
.claude/skills/convert-to-cloudflare-internal-app/SKILL.md
```

## Install into another app

From the target app's repository root:

```bash
npx degit workos/internal-app-example/.claude/skills/convert-to-cloudflare-internal-app .claude/skills/convert-to-cloudflare-internal-app
```

For Cursor, replace `.claude/` with `.cursor/`:

```bash
npx degit workos/internal-app-example/.claude/skills/convert-to-cloudflare-internal-app .cursor/skills/convert-to-cloudflare-internal-app
```

For agents that use `.agents/`, replace `.claude/` with `.agents/`:

```bash
npx degit workos/internal-app-example/.claude/skills/convert-to-cloudflare-internal-app .agents/skills/convert-to-cloudflare-internal-app
```

## Use the skill

After installing it, a non-technical user can ask:

> Convert this app into a WorkOS internal app deployed to Cloudflare.

The skill is designed to inspect the app, choose safe defaults, make the local repository changes, run the checks it can infer, and summarize what changed.

It should only stop to ask for help when a choice is unsafe or impossible to infer, such as creating remote Cloudflare resources, picking a production domain, provisioning Doppler/GitHub secrets, or choosing between incompatible architecture paths.

For Doppler, the skill should keep an existing clearly configured project. If no project exists, it defaults to `claude-day` for now and uses authenticated Doppler and GitHub CLI commands to populate GitHub Actions secrets.

If you want a review step before changes, ask:

> Use the convert-to-cloudflare-internal-app skill to inspect this repo and propose a conversion plan. Do not edit files yet.

## When to use this template directly

Use this repo as the starting point for new internal apps or tiny prototypes that are easier to rebuild than adapt.

For an existing working app, prefer converting that repo in place and use this repo only as the reference for Wrangler, Doppler, Workers, D1, R2, Workflows, and CI patterns.
