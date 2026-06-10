# WorkOS Audit

Use WorkOS Audit when the user asks about OpenClaw audit logs, session history captured in WorkOS, tool-call activity, model-call telemetry, or recent lifecycle events.

## Tools

- `workos_audit_status`: check whether WorkOS credentials, organization resolution, and recording are configured.
- `workos_audit_query`: export WorkOS audit logs with optional action, actor, target, and time filters.

## Query Tips

- Prefer narrow time windows for active debugging, for example the last 1-2 hours.
- Use OpenClaw action prefixes such as `openclaw.session.started`, `openclaw.prompt.submitted`, `openclaw.tool.called`, `openclaw.tool.completed`, `openclaw.tool.failed`, `openclaw.model.call.started`, `openclaw.model.call.completed`, `openclaw.model.call.failed`, `openclaw.turn.completed`, and `openclaw.turn.failed`.
- Session identifiers may appear as `session_id` or `session_key` metadata, depending on which OpenClaw hook emitted the event.
