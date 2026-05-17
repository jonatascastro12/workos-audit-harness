import type { ReactNode } from "react";

type Annotated = {
  line: string;
  title?: string;
  body?: string;
  emphasize?: "org" | "actor" | "action" | "targets" | "metadata";
};

const LINES: Annotated[] = [
  { line: "{" },
  {
    line: `  "organization_id": "org_01ABC",`,
    title: "scope",
    body: "tenant boundary — maps to your customer",
    emphasize: "org",
  },
  { line: `  "event": {` },
  {
    line: `    "action": "agent.tool.called",`,
    title: "action",
    body: "stable verb; must match a registered schema",
    emphasize: "action",
  },
  {
    line: `    "occurred_at": "2026-05-12T10:15:00Z",`,
  },
  {
    line: `    "actor": { "type": "user", "id": "user_01" },`,
    title: "actor",
    body: "who did it — user, system, or service account",
    emphasize: "actor",
  },
  {
    line: `    "targets": [`,
    title: "targets",
    body: "what was affected — stable IDs, typed",
    emphasize: "targets",
  },
  { line: `      { "type": "session", "id": "sess_01" },` },
  { line: `      { "type": "tool",    "id": "toolu_01" }` },
  { line: `    ],` },
  {
    line: `    "metadata": {`,
    title: "metadata",
    body: "typed key·value — strings, numbers, booleans only",
    emphasize: "metadata",
  },
  { line: `      "tool_name": "bash",` },
  { line: `      "input_sha256": "9b1c…",` },
  { line: `      "input_bytes": 482` },
  { line: `    }` },
  { line: `  }` },
  { line: `}` },
];

function Token({ text, em }: { text: string; em?: Annotated["emphasize"] }) {
  // syntax-tint just the keys we annotate so the diagram reads visually
  if (!em) return <span>{text}</span>;
  const key = {
    org: "organization_id",
    actor: "actor",
    action: "action",
    targets: "targets",
    metadata: "metadata",
  }[em];
  const i = text.indexOf(`"${key}"`);
  if (i < 0) return <span>{text}</span>;
  const before = text.slice(0, i);
  const middle = `"${key}"`;
  const after = text.slice(i + middle.length);
  return (
    <span>
      {before}
      <span className="ev-key">{middle}</span>
      {after}
    </span>
  );
}

function Bracket({ children }: { children: ReactNode }) {
  return <span className="ev-bracket" aria-hidden>{children}</span>;
}

export function EventAnatomy() {
  return (
    <figure className="my-12 not-prose">
      <div className="border rule bg-[var(--bg)] relative overflow-hidden ev-frame">
        {/* header bar */}
        <div className="flex items-center justify-between border-b rule px-4 py-2 text-[10px] uppercase tracking-[0.2em] bg-[var(--bg-2)]">
          <span className="dim">fig·02 — anatomy of one audit event</span>
          <span className="accent">▸ exploded view</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-0">
          {/* LEFT: JSON */}
          <pre className="ev-json px-4 md:px-6 py-6 text-[12.5px] leading-[1.85] overflow-x-auto m-0">
            {LINES.map((l, i) => (
              <div
                key={i}
                className={
                  "ev-row " +
                  (l.title ? "ev-row-annotated" : "")
                }
                data-mark={l.emphasize || ""}
              >
                <span className="ev-gutter" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ev-line">
                  <Token text={l.line} em={l.emphasize} />
                </span>
                {l.title ? <Bracket>·</Bracket> : null}
              </div>
            ))}
          </pre>

          {/* RIGHT: labels stack */}
          <div className="border-t md:border-t-0 md:border-l rule bg-[var(--bg-2)] px-4 md:px-6 py-6 flex flex-col gap-3">
            {LINES.filter((l) => l.title).map((l) => (
              <div key={l.title} className="ev-label" data-mark={l.emphasize}>
                <div className="flex items-baseline gap-2">
                  <span className="accent text-[10px] tracking-[0.2em] uppercase">
                    [{l.emphasize}]
                  </span>
                  <span className="text-[13px] font-medium">{l.title}</span>
                </div>
                <div className="text-[12px] dim leading-[1.55] mt-0.5">
                  {l.body}
                </div>
              </div>
            ))}

            {/* legend */}
            <div className="mt-auto pt-3 border-t border-dashed rule text-[10px] uppercase tracking-[0.18em] dim flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>actor → action → target</span>
              <span className="opacity-40">·</span>
              <span>timestamp</span>
              <span className="opacity-40">·</span>
              <span>typed metadata</span>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-[11px] uppercase tracking-[0.16em] dim text-center">
        same shape as any audit event — only the targets and metadata are harness-native.
      </figcaption>
    </figure>
  );
}
