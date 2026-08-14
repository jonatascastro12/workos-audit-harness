# workos-audit Hermes plugin

Hermes Agent plugin that:

- exposes `workos_audit_query` and `workos_audit_status` as Hermes agent tools
- emits Hermes lifecycle events to WorkOS via plugin hooks

The Python side is a thin adapter: every hook serializes its payload to JSON and hands it to `node dist/scripts/emit-event.mjs <kind>` from a daemon background thread, so the agent loop is never blocked and every failure is swallowed. All audit logic (config resolution, transports, hashing) lives in the bundled Node scripts. A `node` binary (18+) must be on `PATH`, or set `HERMES_WORKOS_AUDIT_NODE_BIN`; without one, hooks no-op silently and the tools return an explanatory error.

## Included audit actions

- `hermes.session.started`
- `hermes.session.ended`
- `hermes.prompt.submitted`
- `hermes.tool.called`
- `hermes.tool.completed`
- `hermes.tool.failed`
- `hermes.permission.requested`
- `hermes.permission.resolved`
- `hermes.agent.started`
- `hermes.agent.completed`
- `hermes.turn.completed`
- `hermes.turn.failed`

Only hashed and truncated metadata is recorded (sha256, byte lengths, ≤500-char previews) — never raw prompts, tool inputs, or outputs. `hermes.turn.completed`/`hermes.turn.failed` come from `on_session_end` (Hermes fires it per conversation turn); `hermes.session.ended` comes from `on_session_finalize`.

## Install

From this folder, build the plugin, then copy (or symlink) it into the Hermes user plugin directory and enable it:

```bash
npm install
npm run bundle
mkdir -p ~/.hermes/plugins
ln -s "$(pwd)" ~/.hermes/plugins/workos-audit
hermes plugins enable workos-audit
```

Restart Hermes after installing or updating the plugin. `hermes plugins install <owner/repo>` also works once the plugin is published with a pinned commit SHA.

Project-level installs (`.hermes/plugins/` inside a repo) additionally require `HERMES_ENABLE_PROJECT_PLUGINS=true`.

Enabling may prompt for the tool-override capability grant; answer no — the plugin only registers its own `workos_audit_*` tools and never replaces built-ins.

The bundled `skills/workos-audit/SKILL.md` is registered via `ctx.register_skill`, which Hermes added in 0.20.0; on older versions the plugin still loads and emits, the skill just stays unregistered. `hermes plugins doctor` is also 0.20.0+.

Validate the plugin locally with:

```bash
hermes plugins doctor . --ci
```

## Configure recording

Recording is proxy-first. The plugin should send lifecycle audit events to your company's [audit ingestion proxy](../proxy) over device mTLS, so the Hermes plugin client does not need a `sk_...` API key for event emission. The mTLS path is **macOS-only** (device cert in the keychain + Secure Transport curl); on other platforms the plugin falls back to the direct-credential mode below. In a managed deployment the proxy URL is shipped by MDM via the machine-wide managed config (see [packages/proxy/README.md](../proxy/README.md#point-the-plugins-at-your-proxy)); for local testing, set it manually before starting Hermes:

```bash
export HERMES_WORKOS_AUDIT_PROXY_URL="https://audit-proxy.yourcompany.com/api/events"
export HERMES_WORKOS_AUDIT_ACTION_PREFIX="hermes"
export HERMES_WORKOS_AUDIT_RECORDING="1"
```

Direct WorkOS credentials are still supported when someone explicitly wants that mode, and are also useful for development, non-mTLS environments, schema creation, and querying existing audit logs:

```bash
npm run workos-auth-login
# or:
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
```

Hermes-specific environment variables take precedence over generic WorkOS values:

```bash
export HERMES_WORKOS_AUDIT_API_KEY="sk_..."
export HERMES_WORKOS_AUDIT_ORGANIZATION_ID="org_..."
```

Config file:

```bash
mkdir -p ~/.hermes/workos-audit
cat > ~/.hermes/workos-audit/config.json <<'JSON'
{
  "proxyUrl": "https://audit-proxy.yourcompany.com/api/events",
  "actionPrefix": "hermes",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "hermes",
  "userAgent": "hermes-workos-audit/1"
}
JSON
chmod 600 ~/.hermes/workos-audit/config.json
```

Override the config path with `WORKOS_AUDIT_CONFIG_PATH` or `HERMES_WORKOS_AUDIT_CONFIG_PATH`.

After starting Hermes, call the `workos_audit_status` tool to verify the resolved configuration and write transport.

## Query-only install

Set `recordingEnabled` to `false` in `~/.hermes/workos-audit/config.json`, or export `HERMES_WORKOS_AUDIT_RECORDING=0` (or `WORKOS_AUDIT_RECORDING=0`). The `emit-event` hooks exit immediately and emit nothing; the `workos_audit_query` and `workos_audit_status` tools remain available.

## Alternative: shell hooks only

If you do not want a Python plugin, Hermes shell hooks can pipe their stdin JSON straight to the same bundled emitter. The shell-hook payload is the Claude-Code-compatible shape (`{hook_event_name, tool_name, tool_input, session_id, cwd, extra}`), which `emit-event.mjs` accepts alongside the Python plugin payload shape. Add to `~/.hermes/config.yaml` (adjust the path; quote it if it contains spaces):

```yaml
hooks:
  on_session_start:
    - command: node ~/.hermes/plugins/workos-audit/dist/scripts/emit-event.mjs session-started
      timeout: 15
  on_session_end:
    - command: node ~/.hermes/plugins/workos-audit/dist/scripts/emit-event.mjs turn-finished
      timeout: 15
  pre_llm_call:
    - command: node ~/.hermes/plugins/workos-audit/dist/scripts/emit-event.mjs prompt-submitted
      timeout: 15
  pre_tool_call:
    - command: node ~/.hermes/plugins/workos-audit/dist/scripts/emit-event.mjs tool-called
      timeout: 15
  post_tool_call:
    - command: node ~/.hermes/plugins/workos-audit/dist/scripts/emit-event.mjs tool-finished
      timeout: 15
  subagent_stop:
    - command: node ~/.hermes/plugins/workos-audit/dist/scripts/emit-event.mjs agent-completed
      timeout: 15
```

Hermes prompts for consent per `(event, command)` pair on first use; approve with `hooks_auto_accept: true`, `--accept-hooks`, or `HERMES_ACCEPT_HOOKS=1` for non-interactive runs. The hooks always exit 0, so they can never block a tool call or break the agent.

## Schema scripts

From the repo root. The generic harness schemas work with any coding-agent integration and can use either `WORKOS_API_KEY` or the active `workos` CLI environment created by `npm run workos-auth-login`:

```bash
npm run create:harness-schemas -- --prefix=hermes --dry-run
npm run create:harness-schemas -- --prefix=hermes
```

Hermes-specific schemas (adds `hermes.permission.resolved` and the `hermes.agent.*` subagent variants):

```bash
npm run --workspace @workos-inc/hermes-audit-plugin create:schemas -- --prefix=hermes --dry-run
npm run --workspace @workos-inc/hermes-audit-plugin create:schemas -- --prefix=hermes
```
