#!/usr/bin/env bash
# Shared QA tape setup: isolate plugin config, pick the org, write reusable query files.
#
# Organization: export QA_ORG_ID to pin the tapes to a specific org, e.g.
#
#     QA_ORG_ID=org_XXXXXXXXXXXXXXXXXXXXXXXXXX vhs qa/recordings/claude-plugin.tape
#
# Left unset by default, and no real org id is committed here: with
# WORKOS_ORGANIZATION_ID absent the harness finds-or-creates an organization
# named "Audit Log Harness" in whatever WorkOS environment you are authenticated
# against, which is enough to re-run every tape from a clean account. Only
# exported when non-empty — exporting it empty would look like an explicit
# choice and suppress that fallback.
set -euo pipefail
if [ -n "${QA_ORG_ID:-}" ]; then
  export WORKOS_ORGANIZATION_ID="$QA_ORG_ID"
fi
export WORKOS_AUDIT_CONFIG_PATH="${QA_CONFIG_PATH:-/tmp/qa-plugin-config.json}"
rm -f "$WORKOS_AUDIT_CONFIG_PATH"
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

cat > /tmp/qa-pi-query.json <<'JSON'
{"question": "pi.session.started events", "actions": ["pi.session.started"], "maxRows": 3}
JSON
