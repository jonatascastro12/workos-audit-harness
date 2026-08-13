---
name: workos-audit
description: Configure, verify, and use the WorkOS Audit OpenCode plugin for audit log querying and lifecycle event logging.
---

Use this skill when the user asks about WorkOS audit logs, OpenCode audit event logging, or this plugin's configuration.

## Configuration

Do not ask the user to paste a WorkOS API key into chat. Prefer one of these setup paths:

1. WorkOS CLI auth before starting OpenCode:

```bash
npx -y workos@0.21.0 auth login
# Optional OpenCode-specific overrides:
export OPENCODE_WORKOS_AUDIT_ACTION_PREFIX="opencode"
opencode
```

2. Environment variables before starting OpenCode:

```bash
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
# Optional OpenCode-specific overrides:
export OPENCODE_WORKOS_AUDIT_ACTION_PREFIX="opencode"
opencode
```

3. Config file:

```bash
mkdir -p ~/.config/opencode/workos-audit
cat > ~/.config/opencode/workos-audit/config.json <<'JSON'
{
  "apiKey": "sk_...",
  "organizationId": "org_...",
  "actionPrefix": "opencode",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "opencode",
  "userAgent": "opencode-workos-audit/1"
}
JSON
chmod 600 ~/.config/opencode/workos-audit/config.json
```

To see the current resolved configuration, call the `workos_audit_status` tool.

## Querying audit logs

Use the `workos_audit_query` tool when the user asks questions about WorkOS audit activity. Derive `rangeStart` and `rangeEnd` from the user's timeframe when specified; otherwise use the default recent window. Pass action, actor, and target filters whenever the question clearly implies them.

- Prefer narrow time windows for active debugging, for example the last 1-2 hours.
- Use OpenCode action prefixes such as `opencode.session.started`, `opencode.session.ended`, `opencode.prompt.submitted`, `opencode.tool.called`, `opencode.tool.completed`, `opencode.permission.requested`, `opencode.turn.completed`, and `opencode.turn.failed`.
- Session targets carry the OpenCode `sessionID` (`ses_...`); sub-agent sessions include a `parent_session_id` metadata field.
