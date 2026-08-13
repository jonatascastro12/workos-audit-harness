import atexit
import json
import os
import shutil
import subprocess
import threading
import time

PLUGIN_ROOT = os.path.dirname(os.path.abspath(__file__))
EMIT_EVENT_SCRIPT = os.path.join(PLUGIN_ROOT, "dist", "scripts", "emit-event.mjs")
CONFIG_STATUS_SCRIPT = os.path.join(PLUGIN_ROOT, "dist", "scripts", "print-config-status.mjs")
AUDIT_QUERY_SCRIPT = os.path.join(PLUGIN_ROOT, "dist", "scripts", "audit-query.mjs")
SKILL_MD_PATH = os.path.join(PLUGIN_ROOT, "skills", "workos-audit", "SKILL.md")

FAILURE_STATUSES = {"error", "failed", "failure", "timeout", "denied"}

NODE_MISSING_MESSAGE = (
    "node binary not found; install Node.js 18+ or set HERMES_WORKOS_AUDIT_NODE_BIN "
    "to the node executable path"
)


def _resolve_node_bin():
    override = os.environ.get("HERMES_WORKOS_AUDIT_NODE_BIN", "").strip()
    if override:
        return override
    return shutil.which("node")


NODE_BIN = _resolve_node_bin()

# Serialize emissions per-process: on a dependency-less install the bundled
# preflight in emit-event.mjs runs `npm install` (up to 90s), and concurrent
# emits would race the same install in the same plugin directory.
_EMIT_LOCK = threading.Lock()

_LIVE_THREADS = set()
_LIVE_THREADS_LOCK = threading.Lock()


def _drain_pending_emissions():
    # One-shot runs (`hermes chat -q`) exit right after on_session_end fires;
    # without this join the tail emission dies queued behind _EMIT_LOCK before
    # its subprocess ever spawns. Once spawned, the child survives us as an
    # orphan, so the grace only has to cover lock-wait plus spawn.
    deadline = time.monotonic() + 15
    with _LIVE_THREADS_LOCK:
        pending = list(_LIVE_THREADS)
    for thread in pending:
        thread.join(timeout=max(0.0, deadline - time.monotonic()))


atexit.register(_drain_pending_emissions)


def _pick(payload, *keys):
    return {key: payload[key] for key in keys if payload.get(key) is not None}


def _emit(kind, payload):
    if not NODE_BIN:
        return

    def _run():
        try:
            with _EMIT_LOCK:
                subprocess.run(
                    [NODE_BIN, EMIT_EVENT_SCRIPT, kind],
                    input=json.dumps(payload, default=str).encode("utf-8"),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    # Must cover the preflight's 90s npm-install budget on a
                    # cold install; this runs on a daemon thread, so the agent
                    # is never blocked by it.
                    timeout=90,
                )
        except Exception:
            pass
        finally:
            with _LIVE_THREADS_LOCK:
                _LIVE_THREADS.discard(threading.current_thread())

    thread = threading.Thread(target=_run, name="hermes-workos-audit-emit", daemon=True)
    with _LIVE_THREADS_LOCK:
        _LIVE_THREADS.add(thread)
    thread.start()


def on_session_start(**kwargs):
    _emit("session-started", _pick(kwargs, "session_id", "model", "platform"))


def on_session_end(**kwargs):
    _emit(
        "turn-finished",
        _pick(
            kwargs,
            "session_id",
            "completed",
            "interrupted",
            "failed",
            "turn_exit_reason",
            "model",
            "platform",
            "task_id",
            "turn_id",
        ),
    )


def on_session_finalize(**kwargs):
    _emit(
        "session-ended",
        _pick(kwargs, "session_id", "platform", "reason", "old_session_id", "new_session_id"),
    )


def pre_llm_call(**kwargs):
    payload = _pick(
        kwargs,
        "session_id",
        "is_first_turn",
        "parent_session_id",
        "sender_id",
        "model",
        "platform",
        "task_id",
        "turn_id",
    )
    # Raw value: emit-event.mjs computes sha256/length/preview with the shared
    # audit-core util so hashes match every other emission path. The raw
    # message only ever travels to the local node subprocess and is never
    # placed in event metadata.
    message = kwargs.get("user_message")
    if isinstance(message, str):
        payload["user_message"] = message
    # conversation_history (multi-message raw history) is deliberately
    # stripped here: only its count is serialized.
    history = kwargs.get("conversation_history")
    if isinstance(history, list):
        payload["history_message_count"] = len(history)
    _emit("prompt-submitted", payload)


def pre_tool_call(**kwargs):
    payload = _pick(
        kwargs, "session_id", "tool_name", "tool_call_id", "task_id", "turn_id", "api_request_id"
    )
    args = kwargs.get("args")
    if isinstance(args, dict):
        payload["args"] = args
    _emit("tool-called", payload)


def post_tool_call(**kwargs):
    payload = _pick(
        kwargs,
        "session_id",
        "tool_name",
        "tool_call_id",
        "task_id",
        "turn_id",
        "api_request_id",
        "duration_ms",
        "status",
        "error_type",
    )
    args = kwargs.get("args")
    if isinstance(args, dict):
        payload["args"] = args
    result = kwargs.get("result")
    if isinstance(result, str):
        payload["result"] = result
    error_message = kwargs.get("error_message")
    if isinstance(error_message, str) and error_message:
        payload["error_message"] = error_message
    _emit("tool-finished", payload)


def _approval_payload(kwargs):
    payload = _pick(kwargs, "session_key", "pattern_key", "surface", "turn_id", "tool_call_id")
    command = kwargs.get("command")
    if isinstance(command, str):
        payload["command"] = command
    description = kwargs.get("description")
    if isinstance(description, str) and description:
        payload["description"] = description
    pattern_keys = kwargs.get("pattern_keys")
    if isinstance(pattern_keys, list):
        payload["pattern_key_count"] = len(pattern_keys)
    return payload


def pre_approval_request(**kwargs):
    _emit("permission-requested", _approval_payload(kwargs))


def post_approval_response(**kwargs):
    payload = _approval_payload(kwargs)
    payload.update(_pick(kwargs, "choice", "decided_by"))
    _emit("permission-resolved", payload)


def subagent_start(**kwargs):
    payload = _pick(
        kwargs,
        "parent_session_id",
        "parent_turn_id",
        "parent_subagent_id",
        "child_session_id",
        "child_subagent_id",
        "child_role",
    )
    goal = kwargs.get("child_goal")
    if isinstance(goal, str):
        payload["child_goal"] = goal
    _emit("agent-started", payload)


def subagent_stop(**kwargs):
    payload = _pick(kwargs, "parent_session_id", "child_role", "child_status", "duration_ms")
    summary = kwargs.get("child_summary")
    if isinstance(summary, str):
        payload["child_summary"] = summary
    # tool_call_history (multi-entry raw history) is deliberately stripped
    # here: only aggregate counts and byte totals are serialized.
    history = kwargs.get("tool_call_history")
    if isinstance(history, list):
        entries = [entry for entry in history if isinstance(entry, dict)]
        payload["tool_call_count"] = len(history)
        payload["tool_input_bytes_total"] = sum(
            entry["input_bytes"] for entry in entries if isinstance(entry.get("input_bytes"), (int, float))
        )
        payload["tool_output_bytes_total"] = sum(
            entry["output_bytes"] for entry in entries if isinstance(entry.get("output_bytes"), (int, float))
        )
        payload["tool_failed_count"] = sum(
            1
            for entry in entries
            if isinstance(entry.get("status"), str) and entry["status"].lower() in FAILURE_STATUSES
        )
    _emit("agent-completed", payload)


STATUS_TOOL_SCHEMA = {
    "name": "workos_audit_status",
    "description": (
        "Report the resolved WorkOS audit configuration and which write transport "
        "(proxy, API key, or WorkOS CLI) audit events would use."
    ),
    "parameters": {"type": "object", "properties": {}, "required": []},
}

QUERY_TOOL_SCHEMA = {
    "name": "workos_audit_query",
    "description": (
        "Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "The question the audit log export should answer.",
            },
            "rangeStart": {
                "type": "string",
                "description": "ISO 8601 start of the export window; defaults to 7 days before rangeEnd.",
            },
            "rangeEnd": {
                "type": "string",
                "description": "ISO 8601 end of the export window; defaults to now.",
            },
            "actions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Action filters, for example hermes.tool.called.",
            },
            "actorIds": {"type": "array", "items": {"type": "string"}},
            "actorNames": {"type": "array", "items": {"type": "string"}},
            "targets": {"type": "array", "items": {"type": "string"}},
            "maxRows": {"type": "integer", "minimum": 1, "maximum": 200},
        },
        "required": ["question"],
    },
}


def _run_node_tool(script, stdin_text, timeout):
    if not NODE_BIN:
        return None, NODE_MISSING_MESSAGE
    try:
        proc = subprocess.run(
            [NODE_BIN, script],
            input=stdin_text.encode("utf-8") if stdin_text is not None else b"",
            capture_output=True,
            timeout=timeout,
        )
    except Exception as error:
        return None, str(error)
    stdout = proc.stdout.decode("utf-8", "replace").strip()
    stderr = proc.stderr.decode("utf-8", "replace").strip()
    if proc.returncode != 0:
        return None, stderr or stdout or f"exited with code {proc.returncode}"
    return stdout, None


def workos_audit_status(args, **kwargs):
    stdout, error = _run_node_tool(CONFIG_STATUS_SCRIPT, None, 30)
    if error is not None:
        return json.dumps({"error": error})
    return stdout or json.dumps({"error": "empty status output"})


def workos_audit_query(args, **kwargs):
    stdout, error = _run_node_tool(AUDIT_QUERY_SCRIPT, json.dumps(args or {}), 120)
    if error is not None:
        return json.dumps({"error": error})
    return json.dumps({"result": stdout})


def register(ctx):
    ctx.register_tool(
        name="workos_audit_status",
        toolset="workos-audit",
        schema=STATUS_TOOL_SCHEMA,
        handler=workos_audit_status,
    )
    ctx.register_tool(
        name="workos_audit_query",
        toolset="workos-audit",
        schema=QUERY_TOOL_SCHEMA,
        handler=workos_audit_query,
    )
    ctx.register_hook("on_session_start", on_session_start)
    ctx.register_hook("on_session_end", on_session_end)
    ctx.register_hook("on_session_finalize", on_session_finalize)
    ctx.register_hook("pre_llm_call", pre_llm_call)
    ctx.register_hook("pre_tool_call", pre_tool_call)
    ctx.register_hook("post_tool_call", post_tool_call)
    ctx.register_hook("pre_approval_request", pre_approval_request)
    ctx.register_hook("post_approval_response", post_approval_response)
    ctx.register_hook("subagent_start", subagent_start)
    ctx.register_hook("subagent_stop", subagent_stop)
    # Skill registration is best-effort: a missing file or an older Hermes
    # without ctx.register_skill must never break plugin loading.
    try:
        if os.path.isfile(SKILL_MD_PATH):
            ctx.register_skill("workos-audit", SKILL_MD_PATH)
    except Exception:
        pass
