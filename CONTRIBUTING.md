# Contributing

Thanks for your interest in contributing to the WorkOS Audit Harness.

## Getting set up

```bash
git clone https://github.com/workos/workos-audit-harness.git
cd workos-audit-harness
npm install
```

npm workspaces installs every package except `packages/chat`, which keeps its
own lockfile — run `npm ci` inside that directory if you are working on the
chat console.

## Before you open a PR

- **Typecheck the proxy**: `npm run verify -w @workos-inc/audit-proxy`
- **Keep plugin versions in sync**: `npm run check:versions`. Any change to a
  plugin's source needs a version bump in its `package.json`, its plugin
  manifest, and the marketplace manifest — CI enforces this, because
  marketplace installs and pi load code straight from a checkout by version.
- **Rebuild committed bundles**: plugins ship a committed `dist/` (marketplace
  installs copy files without installing dependencies). If you touch plugin or
  audit-core source, run `node scripts/bundle-plugins.mjs` and commit the
  result.
- **Chat console**: `cd packages/chat && npm run lint && npm run build`.

CI runs all of the above on every pull request; none of it needs secrets, so
it passes on forks.

## Guidelines

- Keep PRs focused on a single change.
- Explain the *why* in the commit message and PR description, not just the
  what.
- New emitted events need a schema in
  `packages/audit-core/src/harness-audit-schemas.mjs` and must not log raw
  prompts, tool inputs/outputs, or command output unless explicitly intended —
  hash, truncate, or omit sensitive fields.
- Do not add WorkOS-internal deployment details (account ids, resource names,
  secret stores) to this repository. The vendor-neutral `wrangler.toml` files
  must stay deployable by anyone.

## Reporting security issues

Please do not open public issues for security vulnerabilities — see
[SECURITY.md](SECURITY.md).
