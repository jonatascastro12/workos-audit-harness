#!/usr/bin/env bash
# Drives a plugin's emit-event hook with a minimal stub payload, useful for QA tapes.
# Usage: emit.sh <plugin> <event-kind> <session-id>
#   plugin: claude | codex | pi
set -euo pipefail
plugin="${1:?plugin required}"
kind="${2:?event kind required}"
session="${3:-qa-session}"

case "$plugin" in
  claude) script="packages/claude-plugin/scripts/emit-event.mjs" ;;
  codex)  script="packages/codex-plugin/scripts/emit-event.mjs" ;;
  pi)     script="packages/pi-extension/scripts/emit-event.mjs" ;;
  *) echo "unknown plugin: $plugin" >&2; exit 1 ;;
esac

payload=$(printf '{"session_id":"%s","cwd":"/tmp","source":"startup","permission_mode":"default"}' "$session")
printf '%s' "$payload" | node "$script" "$kind"
status=$?
if [ "${WORKOS_AUDIT_RECORDING:-${CLAUDE_WORKOS_AUDIT_RECORDING:-${CODEX_WORKOS_AUDIT_RECORDING:-1}}}" = "0" ]; then
  echo "recording disabled — hook short-circuited (no event sent)"
else
  echo "event sent ($plugin/$kind/$session)"
fi
exit $status
