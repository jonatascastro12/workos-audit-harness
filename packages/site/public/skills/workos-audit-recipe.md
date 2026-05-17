---
name: workos-audit-recipe
description: Use when the user wants to add WorkOS Audit Logs to an AI/agent harness, CLI, or agentic framework (Claude Code, Codex, pi, LangGraph, custom). Walks through schema design, lifecycle hook mapping, event emission with sensible redaction, and querying the audit trail back.
---

# Add WorkOS Audit Logs to an Agent Harness

Use this skill when the user is integrating audit logging into an AI harness or agentic framework and asks something like:

- "Add WorkOS audit logs to my agent."
- "Wire up audit events on tool calls / shell commands / file writes."
- "What lifecycle events should I record for compliance?"
- "Help me design schemas for an agent's audit trail."

Do **not** invent action names, schemas, or org-mapping policy on your own — follow the recipe below and surface decisions explicitly to the user.

## The recipe

The integration always follows six steps. Confirm with the user before skipping any.

1. **Pick the lifecycle events that matter.** Aim for security, compliance, and incident-investigation value — not telemetry. Strong defaults:
   - session started / ended
   - prompt submitted
   - agent run started / completed
   - tool call started / completed / failed
   - shell command executed
   - model selected
   - approval granted / denied
   - file changed
   - audit export created (audit access is itself audited)
2. **Model actor, action, target, metadata.** Use a stable action prefix (e.g. `agent.*`, `claude.*`, `codex.*`). Actor is usually the end user resolved from the authenticated session. Targets are harness-native: `session`, `tool`, `command`, `model`, `file`, `audit_export`.
3. **Create schemas before emitting events.** WorkOS validates events against schemas; unknown actions are rejected. Seed schemas via `workos.auditLogs.createSchema(...)` and keep types narrow (`string` / `number` / `boolean`).
4. **Emit events from harness hooks.** Centralize emission in a single `emitAuditEvent(...)` helper. Never block the agent loop on ingestion — log and continue.
5. **Keep the API key server-side.** Resolve the WorkOS organization ID from the authenticated customer. Never expose the key to model context or untrusted clients.
6. **Let the agent query the trail.** Expose a tool (e.g. `audit_log_query`) that creates an audit-log export, polls until ready, downloads CSV, and returns row counts and sample rows.

## What to redact

Default to metadata, not payloads. Safer fields:

- prompt length, SHA-256 hash, optional truncated preview
- tool name, input / output byte size
- command preview (truncated), command hash, duration, success / failure

Avoid logging raw prompts, raw tool inputs, raw tool outputs, or full shell stdout/stderr unless the user explicitly asks and accepts the data-handling cost.

## Schema definition — shape

```ts
import { WorkOS } from '@workos-inc/node';
const workos = new WorkOS(process.env.WORKOS_API_KEY!);

await workos.auditLogs.createSchema({
  action: 'agent.tool.called',
  targets: [
    { type: 'session' },
    { type: 'tool', metadata: { tool_name: 'string' } },
  ],
  metadata: {
    tool_name: 'string',
    tool_call_id: 'string',
    input_sha256: 'string',
    input_bytes: 'number',
    command_preview: 'string',
    command_truncated: 'boolean',
    blocked: 'boolean',
  },
});
```

Always provide a `--dry-run` flag on the seed script so reviewers can inspect proposed schemas before they are created.

## Event emission — shape

```ts
await workos.auditLogs.createEvent(organizationId, {
  action: 'agent.tool.called',
  occurredAt: new Date(),
  actor: { type: 'user', id: user.id, name: user.name },
  targets: [
    { type: 'session', id: session.id },
    { type: 'tool', id: toolCall.id, metadata: { tool_name: toolCall.name } },
  ],
  context: { location: request.ip, userAgent: request.headers['user-agent'] },
  metadata: {
    tool_name: toolCall.name,
    tool_call_id: toolCall.id,
    input_sha256: sha256(toolCall.input),
    input_bytes: byteLength(toolCall.input),
  },
});
```

If you call the HTTP API directly, send an `Idempotency-Key` header per event.

## Querying the trail (agent-accessible tool)

Expose a tool that takes a question, optional date range, and optional filters. Implementation outline:

1. `workos.auditLogs.createExport({ organizationId, rangeStart, rangeEnd, actions, targets })`
2. Poll `workos.auditLogs.getExport(id)` until ready.
3. Download the CSV, parse rows, summarize by action / actor / target.
4. Return row counts and a bounded sample (e.g. first 50 rows) so the agent can answer with evidence rather than from memory.

## Implementation checklist — verify before shipping

- Every emitted action has a WorkOS Audit Logs schema.
- Organization IDs map correctly to customers / tenants.
- Actors resolve to real users, admins, systems, or service accounts.
- Targets use stable IDs and meaningful types.
- Raw prompts, tool inputs / outputs, and command stdout are not logged unless explicitly intended.
- Sensitive fields are hashed, truncated, or omitted.
- The WorkOS API key is server-side / in a trusted secret manager.
- Ingestion failures never break the agent experience.
- High-value events — commands, approvals, file writes, exports, model changes — are covered.
- Audit-export access is itself audited (`agent.audit_export.created`).
- The harness can query logs with filters and cite evidence from exported rows.

## When the user is on a specific harness

- **Claude Code** — lifecycle hooks: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`. Reference plugin: `packages/claude-plugin` in this repo.
- **Codex** — hooks under `[features] plugin_hooks = true`. Reference plugin: `packages/codex-plugin` in this repo.
- **pi-coding-agent** — events: `session_started`, `input_received`, `agent_started`, `tool_call`, `tool_completed`, `user_bash`, `model_selected`, `agent_completed`, `message_finalized`, `session_shutdown`. Reference extension: `packages/pi-extension` in this repo.
- **Custom / LangGraph / other** — map your own lifecycle into the action taxonomy above. Keep the action prefix consistent (one prefix per harness) so the audit trail is easy to filter.

## Reference

Full walkthrough with examples: https://audit-harness.workos.dev/blog/audit-logs-for-ai-harnesses

Repository (CLI + plugins): https://github.com/jonatascastro12/workos-audit-harness
