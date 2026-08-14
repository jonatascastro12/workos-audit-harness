# workos-audit OpenCode plugin

Native OpenCode plugin that:

- exposes `workos_audit_query` and `workos_audit_status` as OpenCode agent tools
- emits OpenCode lifecycle events to WorkOS via plugin hooks

## Included audit actions

- `opencode.session.started`
- `opencode.session.ended`
- `opencode.prompt.submitted`
- `opencode.tool.called`
- `opencode.tool.completed`
- `opencode.permission.requested`
- `opencode.turn.completed`
- `opencode.turn.failed`

The metadata surface extends the generic harness catalogue (parent session ids, `agent`/`provider`/`model_id` on prompts, permission details, tool titles), so `npm run create:schemas` seeds OpenCode-specific schemas from `scripts/opencode-audit-schemas.mjs` that mirror exactly what the plugin emits, with the `opencode` prefix.

Emission runs in a detached child process (`node` or `bun` from `PATH`, override with `OPENCODE_WORKOS_AUDIT_NODE_BIN`): OpenCode hard-exits the moment a one-shot `opencode run` finishes, abandoning any in-process work, so only an orphan-safe child can deliver the tail of a session. Without a runner on `PATH` the plugin falls back to in-process emission, which loses the final batch of one-shot runs but is fine for interactive sessions.

## Install

### Quick install

From any machine:

```bash
npx github:workos/workos-audit-harness
```

The installer detects OpenCode and sets up the plugin for you. The two manual paths below are what it automates.

### Loader shim (global plugin directory)

OpenCode only scans `*.ts` and `*.js` files (not `.mjs`) in `{plugin,plugins}/` under its global config dir and project `.opencode/` dirs, so drop a one-line shim that re-exports this package's bundled entry. The global config dir is `~/.config/opencode` by default — if you set `XDG_CONFIG_HOME` (or `OPENCODE_CONFIG_DIR`), use `$XDG_CONFIG_HOME/opencode` (or `$OPENCODE_CONFIG_DIR`) instead:

```bash
mkdir -p ~/.config/opencode/plugins
cat > ~/.config/opencode/plugins/workos-audit.js <<'JS'
export { WorkosAuditPlugin } from '/absolute/path/to/workos-audit-harness/packages/opencode-plugin/dist/index.mjs';
JS
```

### Config plugin array

Add the package path to the `plugin` array in `~/.config/opencode/opencode.json` (or a project `opencode.json`):

```json
{
  "plugin": ["/absolute/path/to/workos-audit-harness/packages/opencode-plugin"]
}
```

Either way, restart OpenCode after installing or updating the plugin. `dist/` is committed; from a clone, `npm install` at the repo root is all the setup the plugin needs.

## Configure recording

Recording is proxy-first. The plugin should send lifecycle audit events to your company's [audit ingestion proxy](../proxy) over device mTLS, so the OpenCode plugin client does not need a `sk_...` API key for event emission. The mTLS path is **macOS-only** (device cert in the keychain + Secure Transport curl); on other platforms the plugin falls back to the direct-credential mode below. In a managed deployment the proxy URL is shipped by MDM via the machine-wide managed config (see [packages/proxy/README.md](../proxy/README.md#point-the-plugins-at-your-proxy)); for local testing, set it manually before starting OpenCode:

```bash
export OPENCODE_WORKOS_AUDIT_PROXY_URL="https://audit-proxy.yourcompany.com/api/events"
export OPENCODE_WORKOS_AUDIT_ACTION_PREFIX="opencode"
export OPENCODE_WORKOS_AUDIT_RECORDING="1"
```

Direct WorkOS credentials are still supported when someone explicitly wants that mode, and are also useful for development, non-mTLS environments, schema creation, and querying existing audit logs:

```bash
npm run workos-auth-login
# or:
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
```

OpenCode-specific environment variables take precedence over generic WorkOS values:

```bash
export OPENCODE_WORKOS_AUDIT_API_KEY="sk_..."
export OPENCODE_WORKOS_AUDIT_ORGANIZATION_ID="org_..."
```

Config file:

```bash
mkdir -p ~/.config/opencode/workos-audit
cat > ~/.config/opencode/workos-audit/config.json <<'JSON'
{
  "proxyUrl": "https://audit-proxy.yourcompany.com/api/events",
  "actionPrefix": "opencode",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "opencode",
  "userAgent": "opencode-workos-audit/1"
}
JSON
chmod 600 ~/.config/opencode/workos-audit/config.json
```

Override the config path with `WORKOS_AUDIT_CONFIG_PATH` or `OPENCODE_WORKOS_AUDIT_CONFIG_PATH`.

After starting OpenCode, call the `workos_audit_status` tool to verify the plugin sees the config.

## Query-only install

Set `recordingEnabled` to `false` in `~/.config/opencode/workos-audit/config.json`, or export `OPENCODE_WORKOS_AUDIT_RECORDING=0`. The query/status tools remain available.

## Schema scripts

From this folder:

```bash
npm run create:schemas -- --prefix=opencode --dry-run
npm run create:schemas -- --prefix=opencode
```
