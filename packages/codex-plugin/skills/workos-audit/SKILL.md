---
name: workos-audit
description: Configure, verify, and use the WorkOS Audit Codex plugin for audit log querying and lifecycle event logging.
---

Use this skill when the user asks about WorkOS audit logs, Codex audit event logging, or this plugin's configuration.

## Configuration

Do not ask the user to paste a WorkOS API key into chat. Prefer one of these setup paths:

1. WorkOS CLI auth before starting Codex:

```bash
npx -y workos@latest auth login
# Optional Codex-specific overrides:
export CODEX_WORKOS_AUDIT_ACTION_PREFIX="codex"
codex
```

2. Environment variables before starting Codex:

```bash
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
# Optional Codex-specific overrides:
export CODEX_WORKOS_AUDIT_ACTION_PREFIX="codex"
codex
```

3. Config file:

```bash
mkdir -p ~/.codex/workos-audit
cat > ~/.codex/workos-audit/config.json <<'JSON'
{
  "apiKey": "sk_...",
  "organizationId": "org_...",
  "actionPrefix": "codex",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "codex",
  "userAgent": "codex-workos-audit/1"
}
JSON
chmod 600 ~/.codex/workos-audit/config.json
```

To see the current resolved configuration, call the `workos_audit_status` MCP tool if available.

## Hooks

Bundled plugin hooks are opt-in in Codex. Tell the user to enable them with:

```toml
[features]
plugin_hooks = true
```

Then restart Codex and run `/hooks` to review and trust the plugin hooks. Hooks emit session, prompt, tool, permission request, and turn events to WorkOS.

## Querying audit logs

Use the `workos_audit_query` MCP tool when the user asks questions about WorkOS audit activity. Derive `rangeStart` and `rangeEnd` from the user's timeframe when specified; otherwise use the default recent window. Pass action, actor, and target filters whenever the question clearly implies them.
