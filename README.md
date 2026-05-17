# workos-audit-logs

Ship WorkOS audit logs from your coding agents.

This repo contains three integrations, sharing one CLI harness and one set of audit schemas:

| Package | What it does |
|---|---|
| [`packages/claude-plugin`](packages/claude-plugin) | Claude Code plugin: emits session/prompt/tool/turn events to WorkOS and exposes a `workos_audit_query` MCP tool. |
| [`packages/codex-plugin`](packages/codex-plugin) | Codex plugin: same lifecycle events + MCP audit query, with Codex's hook model. |
| [`packages/pi-extension`](packages/pi-extension) | Extension for [pi-coding-agent](https://github.com/mariozechner/pi) and the `workos-audit-harness` CLI. |

## Install

### Claude Code

```text
/plugin marketplace add workos/workos-audit-logs
/plugin install workos-audit@workos-audit-plugins
```

Then restart Claude Code and run `/workos-audit-setup` to wire up credentials. See [packages/claude-plugin/README.md](packages/claude-plugin/README.md).

### Codex

```bash
git clone https://github.com/workos/workos-audit-logs.git
cd workos-audit-logs
codex plugin marketplace add .
```

Install `workos-audit` from the marketplace inside Codex, then restart. See [packages/codex-plugin/README.md](packages/codex-plugin/README.md).

### pi-coding-agent

```bash
git clone https://github.com/workos/workos-audit-logs.git
cd workos-audit-logs
npm install
```

Register `packages/pi-extension/index.ts` with pi. See [packages/pi-extension/README.md](packages/pi-extension/README.md).

## Configure WorkOS credentials

The plugins and the pi extension all share the same config story. Easiest path:

```bash
npm run workos-auth-login
```

This runs the WorkOS CLI login flow. If no organization is set, an `Audit Log Harness` org is found or created automatically.

Alternatively set `WORKOS_API_KEY` and `WORKOS_ORGANIZATION_ID` env vars.

## Seed audit schemas

The generic harness schemas work across all three integrations:

```bash
npm run create:harness-schemas -- --prefix=claude    # or codex, pi, ...
```

Per-integration legacy schemas are still available:

```bash
npm run create:claude-schemas
npm run create:codex-schemas
```

## Repository layout

```
.
├── .claude-plugin/marketplace.json       # Claude Code marketplace manifest (points at packages/claude-plugin)
├── .agents/plugins/marketplace.json      # Codex marketplace manifest (points at packages/codex-plugin)
├── packages/
│   ├── claude-plugin/
│   ├── codex-plugin/
│   └── pi-extension/
└── package.json                          # npm workspaces root
```

npm workspaces handles dependency installation; there is no separate build step. Each package has its own `package.json` and is independently usable.

## License

MIT — see [LICENSE](LICENSE).
