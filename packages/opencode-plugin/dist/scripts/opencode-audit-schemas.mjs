// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
// importing externalized native deps (e.g. @napi-rs/keyring). The marketplace
// install copies files only; this is the cheapest place to bootstrap deps so
// hooks can run on a fresh install.
import { existsSync as __preflightExists } from 'node:fs';
import { execFileSync as __preflightExec } from 'node:child_process';
import { fileURLToPath as __preflightFileURL } from 'node:url';
import { createRequire as __preflightRequire } from 'node:module';
import __preflightPath from 'node:path';
(function __ensurePluginDeps() {
  try {
    const here = __preflightPath.dirname(__preflightFileURL(import.meta.url));
    let pluginRoot = here;
    for (let i = 0; i < 4; i += 1) {
      if (__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) break;
      pluginRoot = __preflightPath.resolve(pluginRoot, '..');
    }
    const __pkg = __preflightPath.join(pluginRoot, 'package.json');
    if (!__preflightExists(__pkg)) return;
    // Ask Node whether the dep RESOLVES, rather than testing one hardcoded path.
    // The old check was existsSync(pluginRoot/node_modules/@napi-rs/keyring),
    // which npm workspace hoisting makes permanently false — the package lands in
    // the ROOT node_modules. Every hook therefore re-ran `npm install` (~620ms
    // measured) before doing any work, on every single event.
    try {
      __preflightRequire(__pkg).resolve('@napi-rs/keyring');
      return;
    } catch {
      // Genuinely absent — fall through and install it once.
    }
    __preflightExec('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
      cwd: pluginRoot,
      stdio: 'ignore',
      timeout: 90_000,
    });
  } catch {
    // Best-effort: callers fall back to no-keyring mode if install fails.
  }
})();

// scripts/opencode-audit-schemas.mjs
function getOpenCodeAuditSchemaDefinitions(prefix = "opencode") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "OpenCode session created.",
      targets: [{ type: "session" }],
      metadata: {
        parent_session_id: "string",
        cwd: "string",
        harness_version: "string"
      }
    },
    {
      action: `${prefix}.session.ended`,
      note: "OpenCode session deleted.",
      targets: [{ type: "session" }],
      metadata: {
        parent_session_id: "string",
        cwd: "string"
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "User chat message observed by OpenCode, with hashed prompt metadata.",
      targets: [{ type: "session" }, { type: "message", metadata: { role: "string" } }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        prompt_preview: "string",
        agent: "string",
        provider: "string",
        model_id: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before an OpenCode tool call executes.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After an OpenCode tool call finishes.",
      targets: [{ type: "session" }, { type: "tool", metadata: { tool_name: "string" } }],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        title: "string"
      }
    },
    {
      action: `${prefix}.permission.requested`,
      note: "OpenCode permission prompt shown to the user (observe-only).",
      targets: [{ type: "session" }, { type: "tool" }],
      metadata: {
        permission_type: "string",
        permission_pattern: "string",
        title: "string",
        tool_call_id: "string"
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "OpenCode session went idle after an assistant turn.",
      targets: [{ type: "session" }],
      metadata: {
        cwd: "string"
      }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "OpenCode session error during a turn.",
      targets: [{ type: "session" }],
      metadata: {
        cwd: "string",
        error_type: "string",
        error_preview: "string"
      }
    }
  ];
}
export {
  getOpenCodeAuditSchemaDefinitions
};
