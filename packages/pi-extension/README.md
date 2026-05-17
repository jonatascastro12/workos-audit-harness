# @workos-inc/pi-audit

WorkOS audit logging extension for the [pi-coding-agent](https://github.com/mariozechner/pi).

Wires pi-coding-agent into WorkOS audit logs and ships a CLI harness (`workos-audit-harness`) for managing the underlying audit schemas, organizations, and ad-hoc event emission.

## What's inside

- `index.ts` — pi extension entry point. Hooks pi's session/prompt/tool lifecycle and forwards audit events to WorkOS via the `@workos-inc/audit-core` harness.

The `workos-audit-harness` CLI (`auth-login`, `status`, `ensure-organization`, `emit-event`, `query`, `create-schema`, `seed-generic-schemas`) now lives in [`@workos-inc/audit-core`](../audit-core).

## Install

```bash
git clone https://github.com/jonatascastro12/workos-audit-harness.git
cd workos-audit-harness
npm install
```

Then register `packages/pi-extension/index.ts` with pi-coding-agent using whichever path pi expects.

## Configure WorkOS credentials

Easiest path is the WorkOS CLI:

```bash
npm run workos-auth-login
```

Or set environment variables: `WORKOS_API_KEY`, `WORKOS_ORGANIZATION_ID`.

If no organization is set, the harness finds or creates one named `Audit Log Harness`.

## Seed schemas

```bash
npm run create:harness-schemas -- --prefix=pi --dry-run
npm run create:harness-schemas -- --prefix=pi
```

## CLI usage

```bash
npm run audit-harness -- status
npm run audit-harness -- query --limit=20
```

See `npm run audit-harness -- --help` for the full command surface.
