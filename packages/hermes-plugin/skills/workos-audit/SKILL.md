---
name: workos-audit
description: Configure, verify, and use the WorkOS Audit Hermes plugin for audit log querying and lifecycle event logging.
---

Use this skill when the user asks about WorkOS audit logs, Hermes audit event logging, or this plugin's configuration.

## Tools

- `workos_audit_status`: check whether WorkOS credentials, organization resolution, and recording are configured, and which write transport (proxy, API key, or WorkOS CLI) events would use.
- `workos_audit_query`: export WorkOS audit logs with optional action, actor, target, and time filters.

Both tools require a `node` binary on `PATH` (or `HERMES_WORKOS_AUDIT_NODE_BIN` pointing at one); they return an explanatory error otherwise.

## Configuration

Do not ask the user to paste a WorkOS API key into chat. Prefer one of these setup paths:

1. WorkOS CLI auth before starting Hermes:

```bash
npx -y workos@0.21.0 auth login
# Optional Hermes-specific overrides:
export HERMES_WORKOS_AUDIT_ACTION_PREFIX="hermes"
hermes
```

2. Environment variables before starting Hermes:

```bash
export WORKOS_API_KEY="sk_..."
export WORKOS_ORGANIZATION_ID="org_..."
# Optional Hermes-specific overrides:
export HERMES_WORKOS_AUDIT_ACTION_PREFIX="hermes"
hermes
```

3. Config file:

```bash
mkdir -p ~/.hermes/workos-audit
cat > ~/.hermes/workos-audit/config.json <<'JSON'
{
  "apiKey": "sk_...",
  "organizationId": "org_...",
  "actionPrefix": "hermes",
  "actorId": "your-user-id",
  "actorType": "user",
  "location": "hermes",
  "userAgent": "hermes-workos-audit/1"
}
JSON
chmod 600 ~/.hermes/workos-audit/config.json
```

To see the current resolved configuration, call the `workos_audit_status` tool.

## Hooks

The plugin registers observer hooks that emit session, prompt, tool, approval, and subagent lifecycle events to WorkOS. Hooks never block or modify agent behavior, and only hashed/truncated metadata is recorded — never raw prompts, tool inputs, or outputs.

## Querying audit logs

Use the `workos_audit_query` tool when the user asks questions about WorkOS audit activity. Derive `rangeStart` and `rangeEnd` from the user's timeframe when specified; otherwise use the default recent window. Pass action, actor, and target filters whenever the question clearly implies them. Use Hermes action prefixes such as `hermes.session.started`, `hermes.prompt.submitted`, `hermes.tool.called`, `hermes.tool.completed`, `hermes.tool.failed`, `hermes.permission.requested`, `hermes.permission.resolved`, `hermes.agent.started`, `hermes.agent.completed`, `hermes.turn.completed`, and `hermes.turn.failed`.
