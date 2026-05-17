type Col = {
  zone: string;
  trust: "untrusted" | "trusted" | "external";
  title: string;
  bullets: string[];
};

const COLS: Col[] = [
  {
    zone: "client",
    trust: "untrusted",
    title: "harness · browser",
    bullets: [
      "emits raw lifecycle events",
      "may include hashes, lengths, previews",
      "never sees the api key",
      "never resolves org_id directly",
    ],
  },
  {
    zone: "your backend",
    trust: "trusted",
    title: "ingestion service",
    bullets: [
      "authenticates the user",
      "resolves organization_id for the tenant",
      "redacts / truncates sensitive fields",
      "retries failed ingestion",
      "holds workos_api_key",
    ],
  },
  {
    zone: "workos",
    trust: "external",
    title: "audit logs api",
    bullets: [
      "validates event against schema",
      "stores org-scoped record",
      "issues exports on request",
      "audits export access",
    ],
  },
];

export function ServerFlow() {
  return (
    <figure className="my-12 not-prose">
      <div className="border rule bg-[var(--bg)] relative overflow-hidden sf-frame">
        {/* header */}
        <div className="flex items-center justify-between border-b rule px-4 py-2 text-[10px] uppercase tracking-[0.2em] bg-[var(--bg-2)]">
          <span className="dim">fig·03 — trusted ingestion path</span>
          <span className="accent">▸ key stays server-side</span>
        </div>

        {/* transition band above columns (desktop) */}
        <div className="hidden md:grid grid-cols-3 border-b rule bg-[var(--bg-2)] text-[9px] uppercase tracking-[0.22em] dim">
          <div className="px-5 py-2 flex items-center justify-end gap-2">
            <span>lifecycle event</span>
            <span className="sf-band-arrow accent">━━►</span>
          </div>
          <div className="px-5 py-2 flex items-center justify-end gap-2 border-l rule">
            <span>+ org_id + api key</span>
            <span className="sf-band-arrow accent">━━►</span>
          </div>
          <div className="px-5 py-2 flex items-center gap-2 border-l rule">
            <span className="dim">stored · indexed · exportable</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 relative">
          {COLS.map((c, i) => (
            <div
              key={c.zone}
              className={
                "relative px-5 py-6 " +
                (i > 0 ? "md:border-l rule " : "") +
                (i === 1 ? "sf-trust-col " : "")
              }
            >
              {/* zone label */}
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] dim">
                <span className={"sf-zone sf-zone-" + c.trust} aria-hidden />
                <span>{c.zone}</span>
              </div>

              <div className="mt-3 text-[15px] font-medium tracking-tight">{c.title}</div>

              <ul className="mt-3 space-y-1.5 text-[12.5px] text-[var(--fg-2)] leading-[1.55]">
                {c.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="accent shrink-0 select-none">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* key callout (server column only) */}
              {i === 1 ? (
                <div className="mt-5 sf-key">
                  <div className="sf-key-bar">
                    <span aria-hidden>▣</span>
                    <span className="tracking-[0.18em]">WORKOS_API_KEY</span>
                    <span className="dim">·</span>
                    <span className="dim">stays here</span>
                  </div>
                </div>
              ) : null}

              {/* trust pill */}
              <div className="mt-5 inline-block text-[9.5px] uppercase tracking-[0.22em] px-2 py-0.5 border rule sf-pill" data-trust={c.trust}>
                {c.trust === "untrusted" ? "× untrusted" : null}
                {c.trust === "trusted" ? "✓ trust boundary" : null}
                {c.trust === "external" ? "↗ external" : null}
              </div>

              {/* mobile divider arrow */}
              {i < COLS.length - 1 ? (
                <div className="md:hidden mt-5 text-center accent text-[14px]" aria-hidden>
                  ▼
                </div>
              ) : null}
            </div>
          ))}

          {/* trust boundary line decoration over the center column */}
          <div aria-hidden className="hidden md:block sf-boundary sf-boundary-left" />
          <div aria-hidden className="hidden md:block sf-boundary sf-boundary-right" />
        </div>
      </div>

      <figcaption className="mt-3 text-[11px] uppercase tracking-[0.16em] dim text-center">
        the api key only crosses the rightmost boundary · clients never resolve org_id.
      </figcaption>
    </figure>
  );
}
