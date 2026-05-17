# Plugin QA pass — 2026-05-16

End-to-end live QA of each plugin against the WorkOS staging sandbox (active
`workos auth login` env: `staging`, sandbox). Recording is in
`qa/recordings/<plugin>.gif`; the tapes that produced them are next to each gif
and re-runnable via `vhs qa/recordings/<plugin>.tape`.

Org used: `org_01KRS134BMB9CA308BEPGDQ5G8` ("Audit Log Harness").

## Bugs found and fixed during this pass

### 1. `query` command silently dropped every filter (`actorIds`, `actorNames`, `actions`, `targets`)

`src/cli/commands/query.mjs` called `parseJsonText(stdinText)` but never read
`flags.file`, so any `--file <path>` invocation parsed an empty string and lost
the whole payload. Fixed by routing through `readJsonFileOrStdin` (matching
what `emit-event` already did) and adding `file` to `RESERVED_FLAGS` so it's not
mis-spread into params.

Verified: querying with `actorIds: ["user_qa_smoke"]` now returns the 1
matching smoke event instead of 50 unfiltered rows.

### 2. `query` failed hard on filters that match zero events

The WorkOS audit-log export endpoint throws `GenericServerException: No audit log events found`
(an HTTP error from the SDK) when the requested filter combination matches no
events. The query path let that propagate as an unhandled error — the CLI
exited 1 and the MCP tool returned an error result, which is misleading
("query failed" vs. "0 results").

Fixed `audit-query.mjs` to detect that specific error and synthesize an
`{ state: 'empty', id: null }` export, which flows through the existing
"0 rows" formatter and returns a clean result.

### 3. pi-extension crashed when the audit-core binary was present (Node tried to import the compiled bun executable)

`packages/pi-extension/index.ts` was calling `execFileSync(process.execPath, [getHarnessPath(), …])`
unconditionally. With the new bun-compiled binary in place, `getHarnessPath()`
returns the binary path, and Node tried to load it as ESM — `SyntaxError:
Invalid or unexpected token`. Claude- and Codex-plugins were fine because they
use `sendAuditEvent` / `runHarnessJson` from `@workos-inc/audit-core/send-event`,
which already branches on `getHarnessBinary().kind`.

Fixed pi-extension to import `getHarnessBinary` instead and wrap invocations in
a `buildHarnessInvocation` helper that picks `bin + argv` based on `kind`.

Verified end-to-end: ran
`pi --no-tools -e packages/pi-extension/index.ts -p "say only OK"` and the
extension emitted `pi.session.started` (target session id
`019e33c2-4ea9-750c-8fcc-127916563044`, found in the audit log on next query).

## Pre-existing behavior worth noting (not fixed here)

- **`targets` filter never matches.** Filtering audit-log exports by `targets`
  (target IDs as strings) returns 0 rows even when those targets demonstrably
  exist in unfiltered exports. Not introduced by this refactor — same behavior
  with the bun binary and the Node fallback path — likely a WorkOS API quirk
  (probably wants `{type, id}` pairs or a different field name). The query
  module already passes the values through `targets: filters.targets` exactly
  as the SDK expects. **Action**: investigate against the WorkOS audit-logs API
  docs or open a Notion/Linear ticket; meanwhile, document that the filter is
  unreliable in the MCP tool description.

- **Hook scripts exit 0 on JSON parse failure.** `claude-plugin/scripts/emit-event.mjs`
  and `codex-plugin/scripts/emit-event.mjs` wrap their main loop in
  `try { … } catch { console.error(err); process.exit(0); }`. This is
  *intentional* (a broken hook shouldn't crash the host agent), but it means a
  misconfigured hook produces zero feedback in the host agent UI — you'd only
  discover the silence by querying the audit log and noticing nothing landed.
  **Recommendation**: keep the exit-0 contract, but add a single
  `console.error` line above `process.exit(0)` even on `EVENT_NAMES.has(kind) === false`,
  and surface hook errors via `workos_audit_status` (e.g. a "last-hook-error"
  scratch file the status tool reads).

- **No non-interactive `configure`.** `npm run configure -w @workos-inc/claude-audit-plugin`
  is interactive only. CI / Codex / pi installs all bypass it and use env vars
  or hand-written `config.json`. That's fine, but worth calling out in the
  README that env-based config is first-class — and adding a one-shot
  `configure --json '{…}'` would smooth onboarding for ops/CI.

- **`status` tool reports `credentialSource: workos-cli`** but the actual
  effective API key comes from `~/.workos/config.json`'s legacy `workosApiKey`
  field (the WorkOS CLI's own bootstrap key), not from the active environment's
  keyring entry. Functionally fine, but the source-of-truth labeling is
  slightly misleading. Worth tightening if/when the auth flow consolidates.

## Per-plugin results

### claude-plugin — PASS

| step | result |
| --- | --- |
| MCP server boots (`server/index.mjs`) | ✓ name=`workos-audit` version=`0.1.5` |
| `tools/list` | ✓ exposes `workos_audit_status` + `workos_audit_query` |
| `workos_audit_status` | ✓ shows `recordingEnabled: true`, org explicit, credential source |
| `emit-event session-started` (recording on) | ✓ event lands in audit log (`claude.session.started` count incremented) |
| `emit-event session-started` (CLAUDE_WORKOS_AUDIT_RECORDING=0) | ✓ short-circuits, no event emitted |
| `workos_audit_query` via MCP | ✓ returns aggregate counts + sample rows |

Recording: `qa/recordings/claude-plugin.gif` (44 s).

### codex-plugin — PASS

Same probe surface as claude-plugin. All steps green; `recordingEnabled: true`
default, `CODEX_WORKOS_AUDIT_RECORDING=0` short-circuits cleanly.

Recording: `qa/recordings/codex-plugin.gif` (44 s).

### pi-extension — PASS (after Bug #3 fix)

| step | result |
| --- | --- |
| `pi --no-tools -e packages/pi-extension/index.ts -p "say only OK"` | ✓ extension loads, LLM responds, exit 0 |
| `pi.session.started` event lands in audit log | ✓ verified by `query --actions pi.session.started` |
| Harness binary selection | ✓ extension now uses `getHarnessBinary()` and respects `kind` ∈ {`binary`, `node`} |

Recording: `qa/recordings/pi-extension.gif` (43 s).

## Onboarding observations (new-dev POV)

Things that worked smoothly:
- `workos auth status` (via npx) showed an authenticated state even with a
  stale access token, and the audit-core CLI auto-refreshed it on the next
  call.
- `ensure-organization` auto-created/found `Audit Log Harness` org with no
  setup needed.
- Plugin MCP servers and emit hooks pick up the same `WORKOS_AUDIT_CONFIG_PATH`
  override consistently across all three plugins.
- The compiled bun binary launches in ~150 ms and is fully functional offline
  (no node_modules needed once the binary is staged).

Friction a new dev will hit:
- The `npm run configure` script is the only path the Claude README highlights,
  but it's interactive — copy-paste into CI fails. README should lead with
  env-vars / config-file path and mention configure as the convenience option.
- `targets` filter being unreliable will surprise anyone trying to scope a
  query by session id; either fix or document.
- `~/.workos/config.json` plaintext API key (CLI bootstrap) is what actually
  authenticates the SDK — should be documented in the security section of each
  README.

## Reproducing the QA pass

```bash
# 1. Build the local darwin-arm64 binary (or whichever target this dev is on)
npm run build:cli -w @workos-inc/audit-core
cp packages/audit-core/build/workos-audit-harness-darwin-arm64 \
   packages/audit-core/bin/workos-audit-harness-darwin-arm64
chmod +x packages/audit-core/bin/workos-audit-harness-darwin-arm64

# 2. Confirm WorkOS CLI auth
npx --yes workos@latest auth status

# 3. Run the tapes
vhs qa/recordings/claude-plugin.tape
vhs qa/recordings/codex-plugin.tape
vhs qa/recordings/pi-extension.tape
```

Helpers used by the tapes:
- `qa/recordings/_setup.sh` — exports `WORKOS_ORGANIZATION_ID`, points config to `/tmp`, writes reusable query JSON files.
- `qa/recordings/probe.mjs` — drives a plugin's MCP server over stdio (`status` or `query`).
- `qa/recordings/emit.sh` — invokes a plugin's `emit-event.mjs` with a minimal stub Claude/Codex payload.
