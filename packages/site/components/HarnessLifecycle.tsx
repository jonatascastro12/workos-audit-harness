const STATIONS: Array<{ idx: string; label: string; sub: string; action: string }> = [
  { idx: "01", label: "SESSION",   sub: "started",   action: "agent.session.started" },
  { idx: "02", label: "PROMPT",    sub: "submitted", action: "agent.prompt.submitted" },
  { idx: "03", label: "RUN",       sub: "started",   action: "agent.run.started" },
  { idx: "04", label: "RUN",       sub: "completed", action: "agent.run.completed" },
  { idx: "05", label: "SESSION",   sub: "ended",     action: "agent.session.ended" },
];

const BRANCHES: Array<{ k: string; v: string }> = [
  { k: "tool",     v: "agent.tool.called" },
  { k: "result",   v: "agent.tool.completed" },
  { k: "failure",  v: "agent.tool.failed" },
  { k: "shell",    v: "agent.command.executed" },
  { k: "file",     v: "agent.file.changed" },
  { k: "model",    v: "agent.model.selected" },
  { k: "consent",  v: "agent.approval.granted" },
];

export function HarnessLifecycle() {
  return (
    <figure className="my-12 not-prose">
      <div className="border rule bg-[var(--bg)] relative overflow-hidden lc-frame">
        {/* corner ticks */}
        <span aria-hidden className="lc-corner lc-corner-tl">┌</span>
        <span aria-hidden className="lc-corner lc-corner-tr">┐</span>
        <span aria-hidden className="lc-corner lc-corner-bl">└</span>
        <span aria-hidden className="lc-corner lc-corner-br">┘</span>

        {/* header bar */}
        <div className="flex items-center justify-between border-b rule px-4 py-2 text-[10px] uppercase tracking-[0.2em] bg-[var(--bg-2)]">
          <span className="dim">fig·01 — harness rail → audit emission</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="lc-dot lc-dot-primary" />
              <span className="dim">primary</span>
            </span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1.5">
              <span className="lc-dot lc-dot-branch" />
              <span className="dim">branched</span>
            </span>
          </span>
        </div>

        {/* canvas */}
        <div className="px-3 md:px-6 pt-10 pb-2">
          {/* main rail */}
          <div className="relative">
            {/* tick scale above */}
            <div
              className="absolute left-[10%] right-[10%] -top-5 h-2 dim text-[9px] tracking-[0.2em] uppercase"
              aria-hidden
            >
              <div className="absolute inset-x-0 top-0 flex justify-between">
                <span>t₀</span>
                <span>·</span>
                <span>·</span>
                <span>·</span>
                <span>t₁</span>
              </div>
            </div>

            {/* dashed accent rail */}
            <div className="lc-rail" />

            <div className="grid grid-cols-5 gap-1 md:gap-2 relative">
              {STATIONS.map((s) => {
                const [prefix, ...rest] = s.action.split(".");
                const suffix = rest.join(".");
                return (
                  <div key={s.idx} className="relative pt-0 text-center min-w-0">
                    <div className="relative h-6 flex items-center justify-center">
                      <span className="lc-station" aria-hidden />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] dim mt-1">{s.idx}</div>
                    <div className="text-[13px] md:text-[14px] font-medium mt-1 tracking-tight">
                      {s.label}
                    </div>
                    <div className="text-[11px] dim italic">{s.sub}</div>
                    <div className="mt-3 mx-1 inline-block text-[10px] accent font-mono leading-tight px-1.5 py-1 border rule bg-[var(--bg-2)] max-w-full">
                      <span className="dim">{prefix}.</span>
                      <wbr />
                      <span>{suffix}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* branch drop from columns 3-4 */}
          <div className="relative h-10 mt-3" aria-hidden>
            {/* horizontal pickup bar between station 3 and 4 */}
            <div
              className="absolute h-px bg-[var(--rule)]"
              style={{ left: "calc(40% + 8px)", right: "calc(40% + 8px)", top: 0 }}
            />
            {/* vertical drop to box */}
            <div
              className="absolute w-px top-0 bottom-0 left-1/2"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--accent) 50%, transparent 50%)",
                backgroundSize: "1px 6px",
              }}
            />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2px] accent text-[14px] leading-none">
              ▼
            </div>
          </div>

          {/* branch detail */}
          <div className="mx-auto max-w-[560px] border rule bg-[var(--bg-2)] relative">
            <div className="border-b rule px-4 py-2 text-[10px] uppercase tracking-[0.2em] dim flex items-center justify-between">
              <span>during run · fires n×</span>
              <span className="accent">▸ exploded</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 px-4 py-4 text-[12px]">
              {BRANCHES.map((b) => (
                <div key={b.v} className="flex items-baseline gap-2">
                  <span className="dim text-[10px] uppercase tracking-[0.18em] w-[58px] shrink-0">
                    {b.k}
                  </span>
                  <span className="accent font-mono">{b.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* export footer */}
          <div className="mt-6 border-t border-dashed rule pt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[12px]">
            <span className="text-[10px] uppercase tracking-[0.2em] dim">post·hoc</span>
            <div className="flex items-center gap-2 font-mono accent">
              <span>agent.audit_export.created</span>
              <span aria-hidden className="dim">────────►</span>
              <span className="dim">csv · org-scoped · filterable</span>
            </div>
            <span aria-hidden className="dim">[ eof ]</span>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-[11px] uppercase tracking-[0.16em] dim text-center">
        five primary stops on the rail · branched events fire any number of times between run.started and run.completed.
      </figcaption>
    </figure>
  );
}
