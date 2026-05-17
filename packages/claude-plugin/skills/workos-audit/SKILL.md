---
name: workos-audit
description: Use when the user asks questions about WorkOS audit logs or prior Claude Code activity. Query the workos_audit_query MCP tool instead of guessing.
---

When the user asks about audit history, use `workos_audit_query`.

Guidelines:
- Derive `rangeStart` and `rangeEnd` from the user's timeframe when they give one.
- Pass `actions`, `actorIds`, `actorNames`, and `targets` whenever the question implies them.
- Keep the default bounded recent time window when the user gives no timeframe.
- For file deletion or command attribution questions, look for `claude.tool.called`, `claude.tool.completed`, and related action names.
