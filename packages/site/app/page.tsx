import { StatusBar } from "@/components/StatusBar";
import { InstallTabs } from "@/components/InstallTabs";
import { CodeBlock } from "@/components/CodeBlock";
import { EventsMarquee } from "@/components/EventsMarquee";
import { HeroShader } from "@/components/HeroShader";
import { LifecycleMatrix } from "@/components/LifecycleMatrix";
import { TypeText } from "@/components/TypeText";
import { AskAudit } from "@/components/AskAudit";

const PAYLOAD = `{
  "action": "claude.tool.completed",
  "occurred_at": "2026-05-16T10:24:08.412Z",
  "actor": { "id": "user_01J7…", "type": "user", "name": "jonatas" },
  "targets": [
    { "type": "session",   "id": "sess_01J7…" },
    { "type": "tool_call", "id": "call_01J7…", "name": "Bash" }
  ],
  "context": {
    "agent": "claude-code",
    "model": "claude-opus-4-7",
    "turn":  42,
    "duration_ms": 612
  },
  "metadata": {
    "command": "git status --short",
    "exit_code": 0,
    "stdout_bytes": 184
  }
}`;

export default function Page() {
  return (
    <div className="crt">
      <StatusBar />

      {/* ──────────────────────────────── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden border-b rule">
        <div className="absolute inset-0 hero-canvas">
          <HeroShader />
          <div className="hero-fade" />
        </div>
        <div className="relative mx-auto max-w-[1240px] px-5 md:px-8 pt-14 pb-20 md:pt-20 md:pb-28">
          <div>
              <div className="reveal reveal-1 text-[12px] uppercase tracking-[0.18em] dim mb-8 flex items-center gap-3">
                <span className="ok">●</span>
                <span>audit logging for coding agents</span>
              </div>

              <h1 className="reveal reveal-2 glyph" style={{ minHeight: "1.9em" }}>
                <TypeText
                  ariaLabel="Ship audit logs from your agents"
                  speed={70}
                  startDelay={520}
                  segments={[
                    { text: "Ship audit logs\nfrom your " },
                    { text: "agents", className: "dim" },
                  ]}
                />
              </h1>

              <p className="reveal reveal-3 mt-10 max-w-[44ch] text-[15px] md:text-[16px] leading-[1.7] text-[var(--fg-2)]">
                <span className="dim">{">"} </span>
                Lifecycle events from Claude Code, Codex, and
                pi-coding-agent — streamed to WorkOS, queryable over MCP.
              </p>

              <div className="reveal reveal-4 mt-10 flex flex-wrap items-center gap-3">
                <a href="#quick-start" className="btn btn-primary">
                  <span>▸</span> quick start
                </a>
                <a
                  href="https://github.com/workos/workos-audit-harness"
                  target="_blank"
                  rel="noreferrer"
                  className="btn"
                >
                  github.com/workos/workos-audit-harness
                </a>
              </div>

              <div className="reveal reveal-5 mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border rule max-w-[960px]">
                {[
                  { name: "claude code",      prefix: "claude.*",  meta: "plugin · MCP · hooks", href: "#quick-start" },
                  { name: "codex",            prefix: "codex.*",   meta: "plugin · MCP · hooks", href: "#quick-start" },
                  { name: "pi-coding-agent",  prefix: "pi.*",      meta: "extension · CLI",      href: "#quick-start" },
                  { name: "build your own",   prefix: "agent.*",   meta: "guide · 12 min",       href: "/blog/audit-logs-for-ai-harnesses", emphasized: true },
                ].map((p, i, arr) => {
                  const right = (i + 1) % 2 === 0;
                  const lastRowLg = i >= arr.length - 1;
                  return (
                    <a
                      key={p.name}
                      href={p.href}
                      className={
                        "group block p-5 bg-[var(--bg)] hover:bg-[var(--bg-2)] transition-colors relative " +
                        // bottom border on small screens (except last)
                        (i < arr.length - 1 ? "border-b sm:border-b-0 " : "") +
                        // right border on sm (every odd cell except last col)
                        (!right ? "sm:border-r rule " : "") +
                        // for lg layout, every cell except the last has a right border
                        (!lastRowLg ? "lg:border-r rule " : "") +
                        // restore bottom border between rows on sm (2-col grid: index 0,1 row, 2,3 row)
                        (i < 2 ? "sm:border-b lg:border-b-0 rule " : "")
                      }
                    >
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] dim mb-3">
                        <span className="ok">●</span>
                        <span>{p.meta}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium group-hover:text-[var(--accent)] transition-colors">
                          {p.name}
                        </span>
                        {p.emphasized && (
                          <span className="text-[11px] accent border border-[var(--accent)] px-1.5 py-[1px] tracking-[0.08em] uppercase">
                            new
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[12px] dim flex items-center justify-between">
                        <span>
                          <span className="accent">▸</span>{" "}
                          <span className="text-[var(--fg-2)]">{p.prefix}</span>
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity accent" aria-hidden>
                          →
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
          </div>
        </div>

        <EventsMarquee />
      </section>

      {/* ──────────────────────────────── WHAT IT DOES ──────────────────────────────── */}
      <section className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="h-sec mb-10">
            <span>01 — what it does</span>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border rule">
            {[
              {
                k: "lifecycle",
                t: "Every event, emitted.",
                glyph: ["session.*", "prompt.*", "tool.*", "turn.*"],
              },
              {
                k: "schemas",
                t: "One set. Three prefixes.",
                glyph: ["claude.*", "codex.*", "pi.*"],
              },
              {
                k: "mcp",
                t: "Queryable from inside.",
                glyph: ["workos_audit_query", "()"],
              },
            ].map((c, i) => (
              <div
                key={c.k}
                className={
                  "p-7 md:p-9 " +
                  (i < 2 ? "md:border-r rule " : "") +
                  (i < 2 ? "border-b md:border-b-0 rule" : "")
                }
              >
                <div className="text-[11px] uppercase tracking-[0.16em] accent mb-8">
                  {String(i + 1).padStart(2, "0")} / {c.k}
                </div>
                <h3 className="text-[22px] leading-[1.2] mb-6 font-medium">
                  {c.t}
                </h3>
                <div className="text-[12px] leading-[1.9] dim space-y-0">
                  {c.glyph.map((g) => (
                    <div key={g} className="flex items-center gap-2">
                      <span className="accent">▸</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── LIFECYCLE MATRIX ──────────────────────────────── */}
      <section className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-[1fr_auto] items-end gap-4 mb-10">
            <div>
              <div className="h-sec mb-3">
                <span>02 — lifecycle</span>
              </div>
              <h2 className="text-[28px] md:text-[34px] leading-[1.15] tracking-[-0.02em] max-w-[28ch]">
                Same harness.<br />
                <span className="dim">Three runtimes, mapped.</span>
              </h2>
            </div>
            <div className="text-[11px] uppercase tracking-[0.14em] dim md:text-right">
              normalized&nbsp;event&nbsp;&nbsp;→&nbsp;&nbsp;native&nbsp;hook
            </div>
          </div>

          <LifecycleMatrix />

          <p className="mt-5 text-[11.5px] dim max-w-[64ch]">
            † Pi reports failures via <span className="text-[var(--fg-2)]">tool_result</span> with{" "}
            <span className="text-[var(--fg-2)]">isError</span>; Codex via{" "}
            <span className="text-[var(--fg-2)]">PostToolUse</span> response inspection. Surface counts:
            full hook inventory available in each runtime, not just the events wired by this harness.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────── QUICK START ──────────────────────────────── */}
      <section id="quick-start" className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="h-sec mb-3">
            <span>03 — quick start</span>
          </div>
          <h2 className="text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em] mb-10 max-w-[28ch]">
            Pick your coding agent.<br />
            <span className="dim">Three keystrokes from zero to audited.</span>
          </h2>

          <InstallTabs />
        </div>
      </section>

      {/* ──────────────────────────────── CONFIGURE ──────────────────────────────── */}
      <section className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16">
            <div>
              <div className="h-sec mb-4">
                <span>04 — configure</span>
              </div>
              <h2 className="text-[28px] md:text-[34px] leading-[1.15] tracking-[-0.02em] mb-8">
                Run the wizard.<br />
                <span className="dim">Four prompts, one config file.</span>
              </h2>

              <div className="space-y-2 text-[13px]">
                <Row label="credential" value="api-key | workos-cli" />
                <Row label="organization" value="org_…" />
                <Row label="recordingEnabled" value="true | false" />
                <Row label="actorName" value="you" />
              </div>

              <p className="mt-6 text-[12px] dim leading-[1.6] max-w-[44ch]">
                Writes <span className="text-[var(--accent)]">~/.claude/workos-audit/config.json</span> with mode <span className="text-[var(--accent)]">0600</span>. Shared by every plugin. Restart your agent after the wizard exits.
              </p>
              <p className="mt-3 text-[12px] dim leading-[1.6] max-w-[44ch]">
                <span className="text-[var(--accent)]">Note:</span> the native <span className="text-[var(--accent)]">workos-cli</span> credential only supports the staging environment. For production, choose <span className="text-[var(--accent)]">api-key</span>.
              </p>
            </div>

            <div className="space-y-5">
              <CodeBlock
                label="recommended · interactive wizard"
                code={`# inside claude code:
$ /workos-audit-setup
✓ credential: workos-cli (live)
✓ organization: Audit Log Harness
✓ recording: enabled
✓ actor: jonatas`}
              />
              <CodeBlock
                label="alternative · env vars"
                code={`$ export WORKOS_API_KEY="sk_…"
$ export WORKOS_ORGANIZATION_ID="org_…"`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── SCHEMAS ──────────────────────────────── */}
      <section className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="h-sec mb-3">
            <span>05 — seed schemas</span>
          </div>
          <h2 className="text-[28px] md:text-[34px] leading-[1.15] tracking-[-0.02em] mb-10 max-w-[36ch]">
            Generic audit actions, namespaced per agent.
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <CodeBlock
              label="seed once · per environment"
              code={`$ npm run create:harness-schemas -- --prefix=claude
$ npm run create:harness-schemas -- --prefix=codex
$ npm run create:harness-schemas -- --prefix=pi`}
            />
            <CodeBlock
              label="dry-run first · always safe"
              code={`$ npm run create:harness-schemas -- \\
    --prefix=claude --dry-run
✓ would create: claude.session.started
✓ would create: claude.prompt.submitted
✓ would create: claude.tool.called …`}
            />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── PAYLOAD PREVIEW ──────────────────────────────── */}
      <section className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 items-center">
            <div>
              <div className="h-sec mb-4">
                <span>06 — payload</span>
              </div>
              <h2 className="text-[28px] md:text-[34px] leading-[1.15] tracking-[-0.02em] mb-8">
                One tool call.<br />
                <span className="dim">Fully shaped.</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="tag on">actor</span>
                <span className="tag">targets[]</span>
                <span className="tag">context</span>
                <span className="tag">metadata</span>
                <span className="tag">occurred_at</span>
              </div>
            </div>
            <CodeBlock label="audit_log.event · jsonc" code={PAYLOAD} showLineNumbers />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── ASK (natural language) ──────────────────────────────── */}
      <AskAudit />

      {/* ──────────────────────────────── DOCS LINKS ──────────────────────────────── */}
      <section className="border-b rule onscroll">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-16 md:py-24">
          <div className="h-sec mb-10">
            <span>08 — docs &amp; references</span>
          </div>

          <ul className="border rule">
            {[
              {
                t: "Claude Code plugin",
                href: "https://github.com/workos/workos-audit-harness/tree/main/packages/claude-plugin",
                tag: "packages/claude-plugin",
              },
              {
                t: "Codex plugin",
                href: "https://github.com/workos/workos-audit-harness/tree/main/packages/codex-plugin",
                tag: "packages/codex-plugin",
              },
              {
                t: "pi-coding-agent extension",
                href: "https://github.com/workos/workos-audit-harness/tree/main/packages/pi-extension",
                tag: "packages/pi-extension",
              },
              {
                t: "audit-core (shared CLI)",
                href: "https://github.com/workos/workos-audit-harness/tree/main/packages/audit-core",
                tag: "packages/audit-core",
              },
              {
                t: "WorkOS Audit Logs",
                href: "https://workos.com/docs/audit-logs",
                tag: "workos.com/docs",
              },
              {
                t: "Model Context Protocol",
                href: "https://modelcontextprotocol.io",
                tag: "modelcontextprotocol.io",
              },
            ].map((d, i, arr) => (
              <li
                key={d.t}
                className={
                  "group hover:bg-[var(--bg-2)] transition-colors " +
                  (i < arr.length - 1 ? "border-b rule" : "")
                }
              >
                <a
                  href={d.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-6 px-6 md:px-8 py-5"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="text-[11px] dim tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16px] md:text-[17px] font-medium group-hover:text-[var(--accent)] transition-colors">
                      {d.t}
                    </span>
                  </span>
                  <span className="flex items-center gap-5 text-[11px] uppercase tracking-[0.14em] dim">
                    <span className="hidden sm:inline">{d.tag}</span>
                    <span className="group-hover:text-[var(--accent)] transition-colors" aria-hidden>
                      →
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ──────────────────────────────── FOOTER ──────────────────────────────── */}
      <footer>
        <div className="mx-auto max-w-[1240px] px-5 md:px-8 py-12">
          <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
            <div>
              <div className="text-[14px] font-medium flex items-center gap-2">
                <span className="accent">▌</span>
                workos-audit-harness
                <span className="caret" />
              </div>
              <p className="mt-4 text-[12.5px] leading-[1.7] text-[var(--fg-2)] max-w-[40ch]">
                One harness · one schema set · three plugins.
              </p>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] dim mb-3">
                source
              </div>
              <ul className="space-y-2 text-[13px]">
                <li><a className="link" href="https://github.com/workos/workos-audit-harness" target="_blank" rel="noreferrer">GitHub repository</a></li>
                <li><a className="link" href="https://github.com/workos/workos-audit-harness/blob/main/LICENSE" target="_blank" rel="noreferrer">License (MIT)</a></li>
                <li><a className="link" href="https://github.com/workos/workos-audit-harness/issues" target="_blank" rel="noreferrer">Issues</a></li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] dim mb-3">
                workos
              </div>
              <ul className="space-y-2 text-[13px]">
                <li><a className="link" href="https://workos.com/docs/audit-logs" target="_blank" rel="noreferrer">Audit Logs docs</a></li>
                <li><a className="link" href="https://workos.com/docs/reference" target="_blank" rel="noreferrer">API reference</a></li>
                <li><a className="link" href="https://workos.com" target="_blank" rel="noreferrer">workos.com</a></li>
                <li><a className="link" href="https://workos.com/mcp-night" target="_blank" rel="noreferrer">MCP Night</a></li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] dim mb-3">
                community
              </div>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <a className="link" href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                    modelcontextprotocol.io
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="div-dot my-10" />

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] dim uppercase tracking-[0.14em]">
            <span>EOF · 0 errors · 0 warnings</span>
            <span>built on the WorkOS Engineering bench · 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3">
      <span className="dim">›</span>
      <span className="border-b border-dotted rule h-3 self-end" />
      <span>
        <span className="dim">{label}</span>
        <span className="dim">:</span>{" "}
        <span className="text-[var(--accent)]">{value}</span>
      </span>
    </div>
  );
}
