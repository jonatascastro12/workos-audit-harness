type Row = {
  event: string;
  pi: string | null;
  claude: string | null;
  codex: string | null;
};

const ROWS: Row[] = [
  { event: "session.started",  pi: "session_start",        claude: "SessionStart",        codex: "SessionStart" },
  { event: "session.ended",    pi: "session_shutdown",     claude: "SessionEnd",          codex: null },
  { event: "prompt.submitted", pi: "input",                claude: "UserPromptSubmit",    codex: "UserPromptSubmit" },
  { event: "agent.started",    pi: "before_agent_start",   claude: null,                  codex: null },
  { event: "turn.completed",   pi: "agent_end",            claude: "Stop",                codex: "Stop" },
  { event: "turn.failed",      pi: null,                   claude: "StopFailure",         codex: null },
  { event: "message.finalized",pi: "message_end",          claude: null,                  codex: null },
  { event: "tool.called",      pi: "tool_call",            claude: "PreToolUse",          codex: "PreToolUse" },
  { event: "tool.completed",   pi: "tool_result",          claude: "PostToolUse",         codex: "PostToolUse" },
  { event: "tool.failed",      pi: "tool_result†",         claude: "PostToolUseFailure",  codex: "PostToolUse†" },
  { event: "permission.requested", pi: null,               claude: null,                  codex: "PermissionRequest" },
  { event: "user_bash.executed",   pi: "user_bash",        claude: null,                  codex: null },
  { event: "model.selected",       pi: "model_select",     claude: null,                  codex: null },
];

const TOTALS = [
  { agent: "pi",     wired: 10, surface: 29 },
  { agent: "claude", wired: 8,  surface: 29 },
  { agent: "codex",  wired: 6,  surface: 6  },
];

function Cell({ value }: { value: string | null }) {
  if (!value) return <span className="dim">—</span>;
  return <span className="text-[var(--fg)]">{value}</span>;
}

export function LifecycleMatrix() {
  return (
    <div className="border rule overflow-x-auto">
      {/* header row */}
      <div className="grid grid-cols-[1.4fr_1fr_1.2fr_1.1fr] text-[11px] uppercase tracking-[0.14em] dim border-b rule bg-[var(--bg-2)]">
        <div className="px-5 md:px-6 py-3">audit event</div>
        <div className="px-5 md:px-6 py-3 border-l rule">pi</div>
        <div className="px-5 md:px-6 py-3 border-l rule">claude code</div>
        <div className="px-5 md:px-6 py-3 border-l rule">codex</div>
      </div>

      {/* body */}
      {ROWS.map((r, i) => (
        <div
          key={r.event}
          className={
            "grid grid-cols-[1.4fr_1fr_1.2fr_1.1fr] text-[13px] " +
            (i < ROWS.length - 1 ? "border-b rule " : "") +
            "hover:bg-[var(--bg-2)] transition-colors"
          }
        >
          <div className="px-5 md:px-6 py-3 flex items-center gap-2">
            <span className="accent">▸</span>
            <span className="font-medium">{r.event}</span>
          </div>
          <div className="px-5 md:px-6 py-3 border-l rule">
            <Cell value={r.pi} />
          </div>
          <div className="px-5 md:px-6 py-3 border-l rule">
            <Cell value={r.claude} />
          </div>
          <div className="px-5 md:px-6 py-3 border-l rule">
            <Cell value={r.codex} />
          </div>
        </div>
      ))}

      {/* totals strip */}
      <div className="grid grid-cols-[1.4fr_1fr_1.2fr_1.1fr] text-[11px] uppercase tracking-[0.14em] border-t rule bg-[var(--bg-2)]">
        <div className="px-5 md:px-6 py-3 dim">audited / available</div>
        {TOTALS.map((t) => (
          <div
            key={t.agent}
            className="px-5 md:px-6 py-3 border-l rule flex items-center gap-2"
          >
            <span className="accent tabular-nums">{t.wired}</span>
            <span className="dim">/ {t.surface} hooks</span>
          </div>
        ))}
      </div>
    </div>
  );
}
