#!/usr/bin/env bash
# Shared QA tape setup: isolate plugin config, pin to staging org, write reusable query files.
set -euo pipefail
export WORKOS_ORGANIZATION_ID="${QA_ORG_ID:-org_01KRS134BMB9CA308BEPGDQ5G8}"
export WORKOS_AUDIT_CONFIG_PATH="${QA_CONFIG_PATH:-/tmp/qa-plugin-config.json}"
rm -f "$WORKOS_AUDIT_CONFIG_PATH"
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

cat > /tmp/qa-pi-query.json <<'JSON'
{"question": "pi.session.started events", "actions": ["pi.session.started"], "maxRows": 3}
JSON
