const EVENTS = [
  "claude.session.started",
  "claude.prompt.submitted",
  "claude.tool.called",
  "claude.tool.completed",
  "claude.turn.completed",
  "claude.session.ended",
  "codex.session.started",
  "codex.prompt.submitted",
  "codex.tool.called",
  "codex.permission.requested",
  "codex.tool.completed",
  "codex.turn.completed",
  "pi.session.started",
  "pi.prompt.submitted",
  "pi.tool.called",
  "pi.turn.completed",
];

export function EventsMarquee() {
  const doubled = [...EVENTS, ...EVENTS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((e, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span className="text-[var(--accent)]">▸</span>
            <span>{e}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
