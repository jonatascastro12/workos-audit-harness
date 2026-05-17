"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AnswerRow = {
  actor: string;
  action: string;
  when: string;
  detail: string;
  target?: string;
};

type Question = {
  q: string;
  tag: string;
  actionsFilter: string[];
  rangeLabel: string;
  rows: AnswerRow[];
  summary: string;
};

const QUESTIONS: Question[] = [
  {
    q: "Who ran rm -rf last week?",
    tag: "security",
    actionsFilter: ["claude.tool.called", "claude.user_bash.executed"],
    rangeLabel: "2026-05-09 → 2026-05-16",
    summary: "3 rows · 2 actors · 1 session under review",
    rows: [
      {
        actor: "jonatas",
        action: "claude.tool.called",
        when: "2026-05-12 14:22:08Z",
        target: "tool:Bash · sess_01J7Q…",
        detail: 'command_preview: "rm -rf node_modules/.cache"',
      },
      {
        actor: "ana",
        action: "codex.user_bash.executed",
        when: "2026-05-13 09:41:50Z",
        target: "cmd_8c41a · sess_01K2P…",
        detail: 'command_preview: "rm -rf .next/" · blocked: false',
      },
      {
        actor: "system",
        action: "claude.tool.failed",
        when: "2026-05-14 03:11:02Z",
        target: "tool:Bash · sess_01K3X…",
        detail: 'blocked: true · reason: "denylist:rm-rf-root"',
      },
    ],
  },
  {
    q: "Who changed the model right before yesterday's incident at 17:42?",
    tag: "incident-review",
    actionsFilter: ["claude.model.selected", "codex.model.selected"],
    rangeLabel: "2026-05-15 17:30 → 17:45 UTC",
    summary: "2 rows · same actor · 8 minutes prior",
    rows: [
      {
        actor: "jonatas",
        action: "claude.model.selected",
        when: "2026-05-15 17:34:11Z",
        target: "model:claude-opus-4-6 → claude-haiku-4-5",
        detail: 'reason: "switching for cost test" · session: sess_01K5T…',
      },
      {
        actor: "jonatas",
        action: "claude.turn.failed",
        when: "2026-05-15 17:42:08Z",
        target: "turn:T-118 · sess_01K5T…",
        detail: 'error_class: "ContextWindowExceeded" · model: haiku-4-5',
      },
    ],
  },
  {
    q: "Show every shell command jonatas ran after midnight on Tuesday.",
    tag: "audit-trail",
    actionsFilter: ["claude.user_bash.executed", "pi.user_bash.executed"],
    rangeLabel: "2026-05-12 00:00 → 06:00 UTC",
    summary: "5 rows · 2 sessions · 0 blocked",
    rows: [
      {
        actor: "jonatas",
        action: "claude.user_bash.executed",
        when: "2026-05-12 00:14:51Z",
        target: "cmd_2f1ce · sess_01J9A…",
        detail: 'command_preview: "git rebase -i HEAD~6"',
      },
      {
        actor: "jonatas",
        action: "claude.user_bash.executed",
        when: "2026-05-12 02:03:22Z",
        target: "cmd_71b09 · sess_01J9A…",
        detail: 'command_preview: "psql -c \'select count(*) from users\'"',
      },
      {
        actor: "jonatas",
        action: "pi.user_bash.executed",
        when: "2026-05-12 04:48:09Z",
        target: "cmd_ad88e · sess_01J9F…",
        detail: 'command_preview: "kubectl rollout restart deploy/api"',
      },
    ],
  },
  {
    q: "Find tool calls that failed 3+ times in the same session.",
    tag: "reliability",
    actionsFilter: ["claude.tool.failed", "codex.tool.failed", "pi.tool.failed"],
    rangeLabel: "2026-05-09 → 2026-05-16",
    summary: "2 sessions · 7 total failures · 1 tool",
    rows: [
      {
        actor: "rashid",
        action: "claude.tool.failed",
        when: "2026-05-14 11:08:44Z",
        target: "tool:Edit · sess_01K4M… (×4)",
        detail: 'error_code: "EROFS" · path: "/usr/local/lib/…"',
      },
      {
        actor: "ana",
        action: "codex.tool.failed",
        when: "2026-05-15 16:55:01Z",
        target: "tool:Bash · sess_01K5R… (×3)",
        detail: 'exit_code: 137 · cause: "OOMKilled in container"',
      },
    ],
  },
  {
    q: "Did anyone export the audit log this month — who, when, and for which org?",
    tag: "compliance",
    actionsFilter: ["claude.audit_export.created", "pi.audit_export.created"],
    rangeLabel: "2026-05-01 → 2026-05-16",
    summary: "4 exports · 3 actors · 2 organizations",
    rows: [
      {
        actor: "compliance-bot",
        action: "pi.audit_export.created",
        when: "2026-05-03 09:00:00Z",
        target: "audit_export:exp_a91… · org_acme",
        detail: 'range: "2026-04-01 → 2026-04-30" · rows: 412 893',
      },
      {
        actor: "jonatas",
        action: "claude.audit_export.created",
        when: "2026-05-12 18:21:14Z",
        target: "audit_export:exp_c4d… · org_acme",
        detail: 'actions: ["claude.tool.failed"] · rows: 311',
      },
      {
        actor: "rashid",
        action: "claude.audit_export.created",
        when: "2026-05-15 22:47:30Z",
        target: "audit_export:exp_d77… · org_lumen",
        detail: 'range: "2026-05-14 → 2026-05-15" · rows: 18 204',
      },
    ],
  },
  {
    q: "Which session called Bash and then git push?",
    tag: "forensics",
    actionsFilter: ["claude.tool.called"],
    rangeLabel: "2026-05-14 → 2026-05-16",
    summary: "1 session · ordered pair matched · 312 ms between calls",
    rows: [
      {
        actor: "jonatas",
        action: "claude.tool.called",
        when: "2026-05-15 13:04:55Z",
        target: "tool:Bash · sess_01K5G… · call_8f1c…",
        detail: 'command_preview: "npm run build && npm test"',
      },
      {
        actor: "jonatas",
        action: "claude.tool.called",
        when: "2026-05-15 13:04:55Z",
        target: "tool:Bash · sess_01K5G… · call_8f1d…",
        detail: 'command_preview: "git push origin main"',
      },
    ],
  },
];

type Mode = "cli" | "mcp";

export function AskAudit() {
  const [mode, setMode] = useState<Mode>("cli");
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);

  const current = QUESTIONS[idx];

  // auto-cycle
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => {
      setIdx((i) => (i + 1) % QUESTIONS.length);
    }, 6200);
    return () => window.clearTimeout(id);
  }, [idx, paused]);

  // typewriter on the question line
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    const text = current.q;
    let i = 0;
    const stepDelay = 18;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, stepDelay);
    return () => window.clearInterval(id);
  }, [idx, current.q]);

  const renderedCommand = useMemo(() => {
    if (mode === "cli") {
      return `workos-audit-harness ask "${current.q}"`;
    }
    return `workos_audit_query({ q: "${current.q}", actions: ${JSON.stringify(
      current.actionsFilter,
    )} })`;
  }, [mode, current]);

  return (
    <section
      className="ask-audit border-b rule onscroll"
      aria-label="Ask the audit trail"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr_auto] items-end gap-4 mb-10">
          <div>
            <div className="h-sec mb-3">
              <span>07 — ask</span>
            </div>
            <h2 className="text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em] max-w-[24ch]">
              Ask the audit trail
              <br />
              <span className="dim">in plain English.</span>
            </h2>
          </div>
          <div className="text-[11px] uppercase tracking-[0.14em] dim md:text-right">
            cli&nbsp;·&nbsp;mcp&nbsp;·&nbsp;same&nbsp;answers
          </div>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-0 border rule">
          {/* question chips */}
          <ul
            role="tablist"
            aria-label="Example audit questions"
            className="md:border-r rule divide-y rule"
          >
            {QUESTIONS.map((qq, i) => {
              const active = i === idx;
              return (
                <li key={qq.q}>
                  <button
                    role="tab"
                    aria-selected={active}
                    onClick={() => setIdx(i)}
                    className={
                      "ask-chip w-full text-left px-5 py-4 transition-colors " +
                      (active
                        ? "bg-[var(--bg-2)] text-[var(--fg)]"
                        : "text-[var(--fg-2)] hover:bg-[var(--bg-2)]")
                    }
                  >
                    <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] dim mb-1.5">
                      <span
                        className={
                          active
                            ? "text-[var(--accent)]"
                            : "opacity-70"
                        }
                      >
                        {active ? "▶" : "·"}
                      </span>
                      <span>{qq.tag}</span>
                      <span className="opacity-40">·</span>
                      <span>
                        Q{String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="text-[13.5px] leading-[1.45]">{qq.q}</div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* terminal */}
          <div className="ask-term relative">
            {/* terminal header */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b rule text-[11px] uppercase tracking-[0.16em]">
              <div className="flex items-center gap-2 dim">
                <span className="ask-dot" aria-hidden />
                <span className="ask-dot ask-dot-y" aria-hidden />
                <span className="ask-dot ask-dot-g" aria-hidden />
                <span className="ml-3 hidden sm:inline">
                  workos-audit-harness · {mode}
                </span>
              </div>
              <div className="flex items-stretch border rule">
                {(["cli", "mcp"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={m === mode}
                    className={
                      "ask-mode px-3 py-[3px] text-[11px] uppercase tracking-[0.16em] " +
                      (m === mode ? "ask-mode-active" : "")
                    }
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* prompt + typed question */}
            <div className="px-4 md:px-6 py-5 md:py-7 text-[13px] leading-[1.65] font-mono">
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--accent)] shrink-0">$</span>
                <span className="break-all">
                  {mode === "cli" ? (
                    <>
                      <span className="text-[var(--fg)]">workos-audit-harness</span>{" "}
                      <span className="dim">ask</span>{" "}
                      <span className="text-[var(--accent)]">&ldquo;{typed}</span>
                      <span className="caret" aria-hidden />
                      <span className="text-[var(--accent)]">&rdquo;</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[var(--fg)]">workos_audit_query</span>
                      <span className="dim">(&#123; q: </span>
                      <span className="text-[var(--accent)]">&ldquo;{typed}</span>
                      <span className="caret" aria-hidden />
                      <span className="text-[var(--accent)]">&rdquo;</span>
                      <span className="dim">, actions: </span>
                      <span className="text-[var(--fg-2)]">
                        {JSON.stringify(current.actionsFilter)}
                      </span>
                      <span className="dim"> &#125;)</span>
                    </>
                  )}
                </span>
              </div>

              {/* meta row */}
              <div
                className="mt-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[11.5px] uppercase tracking-[0.14em] dim"
                aria-live="polite"
                ref={liveRef}
              >
                <span>range</span>
                <span className="normal-case tracking-normal text-[var(--fg-2)]">
                  {current.rangeLabel}
                </span>
                <span>summary</span>
                <span className="normal-case tracking-normal text-[var(--fg-2)]">
                  ↳ {current.summary}
                </span>
              </div>

              {/* answer rows */}
              <div className="mt-5 space-y-3">
                {current.rows.map((row, i) => (
                  <div
                    key={`${idx}-${i}`}
                    className="ask-row border rule p-3 md:p-4"
                    style={{ animationDelay: `${120 + i * 110}ms` }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11.5px] uppercase tracking-[0.14em] dim">
                      <span className="text-[var(--accent)]">▸</span>
                      <span className="text-[var(--fg)] normal-case tracking-normal text-[12.5px] font-medium">
                        {row.actor}
                      </span>
                      <span className="opacity-50">·</span>
                      <span className="normal-case tracking-normal text-[12.5px] text-[var(--fg-2)]">
                        {row.action}
                      </span>
                      <span className="opacity-50">·</span>
                      <span className="normal-case tracking-normal text-[12.5px] tabular-nums">
                        {row.when}
                      </span>
                    </div>
                    {row.target && (
                      <div className="mt-1.5 text-[12.5px] text-[var(--fg-2)] flex flex-wrap items-baseline gap-x-2">
                        <span className="dim text-[10.5px] uppercase tracking-[0.16em] mt-[2px]">
                          target
                        </span>
                        <code className="text-[12.5px]">{row.target}</code>
                      </div>
                    )}
                    <div className="mt-1.5 text-[12.5px] text-[var(--fg-2)] flex flex-wrap items-baseline gap-x-2">
                      <span className="dim text-[10.5px] uppercase tracking-[0.16em] mt-[2px]">
                        evidence
                      </span>
                      <code className="text-[12.5px]">{row.detail}</code>
                    </div>
                  </div>
                ))}
              </div>

              {/* footer hint */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] dim">
                <span>
                  {mode === "cli" ? "shipped with the cli" : "exposed over mcp"}
                  &nbsp;·&nbsp;evidence pulled from a live audit-log export
                </span>
                <span aria-hidden className="flex items-center gap-2">
                  <span className="ask-tick" />
                  <span>{paused ? "paused — choose a question" : "auto-cycling"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* under-section caption */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.14em] dim">
          <span>
            <span className="text-[var(--accent)]">▌</span>{" "}
            <code className="normal-case tracking-normal text-[var(--fg-2)]">
              workos-audit-harness ask &lt;question&gt;
            </code>
          </span>
          <span className="opacity-40">·</span>
          <span>
            mcp tool{" "}
            <code className="normal-case tracking-normal text-[var(--fg-2)]">
              workos_audit_query
            </code>
          </span>
          <span className="opacity-40">·</span>
          <span>any agent with mcp gets the same answer.</span>
        </div>
      </div>
    </section>
  );
}
