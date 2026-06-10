# workos-audit-harness

Ship WorkOS audit logs from your coding agents.

This repo contains four integrations plus a fleet-deployment proxy, sharing one CLI harness and one set of audit schemas:

| Package | What it does |
|---|---|
| [`packages/claude-plugin`](packages/claude-plugin) | Claude Code plugin: emits session/prompt/tool/turn events to WorkOS and exposes a `workos_audit_query` MCP tool. |
| [`packages/codex-plugin`](packages/codex-plugin) | Codex plugin: same lifecycle events + MCP audit query, with Codex's hook model. |
| [`packages/openclaw-plugin`](packages/openclaw-plugin) | OpenClaw plugin: emits native session/message/agent/LLM/tool/turn events and exposes WorkOS audit query/status tools. |
| [`packages/pi-extension`](packages/pi-extension) | Extension for [pi-coding-agent](https://github.com/mariozechner/pi) and the `workos-audit-harness` CLI. |
| [`packages/proxy`](packages/proxy) | Cloudflare Worker ingestion proxy: laptops authenticate with a device cert over mTLS instead of carrying a WorkOS API key. Deployable to any Cloudflare account. |
| [`packages/site`](packages/site) | Marketing & docs site (Next.js 15 + Tailwind v4) — also hosts the `workos-audit-recipe` SKILL.md. |

## Install

### Claude Code

```text
/plugin marketplace add jonatascastro12/workos-audit-harness
/plugin install workos-audit@workos-audit-plugins
```

Then restart Claude Code and run `/workos-audit-setup` to wire up credentials. See [packages/claude-plugin/README.md](packages/claude-plugin/README.md).

### Codex

```bash
git clone https://github.com/jonatascastro12/workos-audit-harness.git
cd workos-audit-harness
codex plugin marketplace add .
```

Install `workos-audit` from the marketplace inside Codex, then restart. See [packages/codex-plugin/README.md](packages/codex-plugin/README.md).

### OpenClaw

```bash
git clone https://github.com/workos/workos-audit-harness.git
cd workos-audit-harness/packages/openclaw-plugin
npm install
npm run bundle
openclaw plugins install .
openclaw plugins enable workos-audit
```

Restart the OpenClaw gateway after installing or updating the plugin. See [packages/openclaw-plugin/README.md](packages/openclaw-plugin/README.md).

### pi-coding-agent

```bash
git clone https://github.com/jonatascastro12/workos-audit-harness.git
cd workos-audit-harness
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

### Fleet rollout (no key on laptops)

For rolling out to a whole fleet, don't put API keys on laptops at all — deploy the [ingestion proxy](packages/proxy) to your Cloudflare account and push its URL to every device via your MDM (a machine-wide config file at `/Library/Application Support/workos-audit/config.json` on macOS). Laptops authenticate with a device certificate over mTLS; the proxy holds the key and attributes events server-side. See [packages/proxy/README.md](packages/proxy/README.md).

## Self-check from your shell

The `workos-audit-harness` CLI in `packages/audit-core` is the shared core for all integrations. From the repo root:

```bash
npm run audit-harness -- status              # show api-key / WorkOS CLI credential state
npm run audit-harness -- auth-login          # delegate to `workos auth login`
npm run audit-harness -- ensure-organization # find or create the harness org
npm run audit-harness -- query --help        # export & summarize audit logs
```

If you only need the WorkOS CLI's own view of your auth (no harness config), run `npx -y workos@latest auth status --mode agent` from any shell — this is what the plugin's `/workos-audit-setup` reflects under `workosCli.loggedIn`.

## Seed audit schemas

The generic harness schemas work across all three integrations:

```bash
npm run create:harness-schemas -- --prefix=claude    # or codex, pi, ...
```

Per-integration legacy schemas are still available:

```bash
npm run create:claude-schemas
npm run create:codex-schemas
npm run create:openclaw-schemas
```

## Repository layout

```
.
├── .claude-plugin/marketplace.json       # Claude Code marketplace manifest (points at packages/claude-plugin)
├── .agents/plugins/marketplace.json      # Codex marketplace manifest (points at packages/codex-plugin)
├── packages/
│   ├── claude-plugin/
│   ├── codex-plugin/
│   ├── openclaw-plugin/
│   ├── pi-extension/
│   ├── proxy/                           # mTLS ingestion proxy (Cloudflare Worker + D1)
│   └── site/                            # audit-harness.workos.dev (Next.js, deploys to Vercel)
└── package.json                          # npm workspaces root
```

npm workspaces handles dependency installation; there is no separate build step. Each package has its own `package.json` and is independently usable.

## License

MIT — see [LICENSE](LICENSE).
