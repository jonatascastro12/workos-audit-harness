"use client";

import { useState } from "react";

type Target = {
  id: string;
  name: string;
  meta: string;
  dir: string;
  command: string;
};

const SKILL_URL = "https://audit-harness.workos.dev/skills/workos-audit-recipe.md";

const TARGETS: Target[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    meta: "~/.claude/skills/",
    dir: "~/.claude/skills/workos-audit-recipe",
    command: `mkdir -p ~/.claude/skills/workos-audit-recipe \\
  && curl -fsSL ${SKILL_URL} \\
       -o ~/.claude/skills/workos-audit-recipe/SKILL.md`,
  },
  {
    id: "codex",
    name: "Codex",
    meta: "~/.codex/skills/",
    dir: "~/.codex/skills/workos-audit-recipe",
    command: `mkdir -p ~/.codex/skills/workos-audit-recipe \\
  && curl -fsSL ${SKILL_URL} \\
       -o ~/.codex/skills/workos-audit-recipe/SKILL.md`,
  },
];

export function SkillShortcut() {
  const [active, setActive] = useState<string>(TARGETS[0].id);
  const [copied, setCopied] = useState(false);
  const current = TARGETS.find((t) => t.id === active)!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section
      aria-label="Skill shortcut"
      className="skill-shortcut relative my-14 border rule"
    >
      {/* ribbon · vertical pull-tab */}
      <div className="skill-ribbon" aria-hidden>
        <span>SHORTCUT · 1-LINER · v1</span>
      </div>

      {/* corner glyphs */}
      <span className="corner corner-tl" aria-hidden>
        ┌
      </span>
      <span className="corner corner-tr" aria-hidden>
        ┐
      </span>
      <span className="corner corner-bl" aria-hidden>
        └
      </span>
      <span className="corner corner-br" aria-hidden>
        ┘
      </span>

      <div className="px-5 md:px-9 pt-10 md:pt-11 pb-7 md:pb-8">
        {/* eyebrow */}
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] dim">
          <span className="text-[var(--accent)]">▶</span>
          <span>shortcut · skill</span>
          <span className="opacity-30">·</span>
          <span>00</span>
          <span className="flex-1 mx-3 h-px bg-[var(--rule)] opacity-60" />
          <span className="hidden md:inline">recipe → one&nbsp;line</span>
        </div>

        {/* headline */}
        <h2 className="mt-5 text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.02em] font-medium">
          Don&apos;t want to wire&nbsp;hooks?
          <br />
          <span className="skill-headline-mark">Install the&nbsp;SKILL.</span>
        </h2>

        <p className="mt-5 max-w-[58ch] text-[14.5px] md:text-[15px] leading-[1.75] text-[var(--fg-2)]">
          This entire post, distilled into a portable agent skill. Drop it into
          Claude Code or Codex and ask the agent to{" "}
          <em>&ldquo;add WorkOS audit logs to my harness.&rdquo;</em> It will
          pick the lifecycle events, design schemas, redact sensibly, and wire
          the emit path — straight from the recipe below.
        </p>

        {/* spec strip */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-y-3 text-[11px] uppercase tracking-[0.14em] border-y rule py-3">
          <div>
            <div className="dim">name</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              workos-audit-recipe
            </div>
          </div>
          <div>
            <div className="dim">size</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              ~4 kb · 1 file
            </div>
          </div>
          <div>
            <div className="dim">trigger</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              audit · log · harness
            </div>
          </div>
          <div>
            <div className="dim">scope</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              user-local
            </div>
          </div>
        </div>

        {/* harness tabs */}
        <div className="mt-7 flex items-end" role="tablist" aria-label="Target harness">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === active}
              data-active={t.id === active}
              onClick={() => setActive(t.id)}
              className="tab text-[12px] uppercase tracking-[0.14em]"
            >
              {t.name}
            </button>
          ))}
          <span className="flex-1 border-b rule" />
          <span className="hidden md:inline-block ml-3 mb-[6px] text-[11px] uppercase tracking-[0.14em] dim">
            installs to{" "}
            <code className="px-[5px] py-[1px] border rule bg-[var(--bg-2)] text-[0.95em]">
              {current.meta}
            </code>
          </span>
        </div>

        {/* command */}
        <div className="border border-t-0 rule bg-[var(--bg-2)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2 text-[11px] uppercase tracking-[0.14em] dim">
            <span className="whitespace-nowrap">bash · one-shot</span>
            <span className="text-right">
              creates{" "}
              <span className="accent normal-case tracking-normal text-[0.95em]">
                {current.dir}/SKILL.md
              </span>
            </span>
          </div>
          <pre className="m-0 p-0 overflow-x-auto text-[13px] leading-[1.55]">
            <code className="block">
              {current.command.split("\n").map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {i === 0 ? <span className="accent">$&nbsp;</span> : "  "}
                  {line}
                </div>
              ))}
            </code>
          </pre>

          {/* primary actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={copy}
              className={
                "skill-cta " + (copied ? "skill-cta--ok" : "")
              }
              aria-live="polite"
            >
              <span className="skill-cta-glyph" aria-hidden>
                {copied ? "✓" : "▶"}
              </span>
              <span>
                {copied
                  ? "copied — paste into your terminal"
                  : `copy install for ${current.name.toLowerCase()}`}
              </span>
            </button>

            <a
              href={SKILL_URL}
              target="_blank"
              rel="noreferrer"
              className="btn text-[12px] uppercase tracking-[0.14em]"
            >
              <span aria-hidden>↗</span>
              <span>view SKILL.md</span>
            </a>

            <a
              href={SKILL_URL}
              download="SKILL.md"
              className="btn text-[12px] uppercase tracking-[0.14em]"
            >
              <span aria-hidden>⬇</span>
              <span>download</span>
            </a>
          </div>
        </div>

        {/* sub-line / verify */}
        <div className="mt-5 flex flex-col gap-2 text-[12px] uppercase tracking-[0.14em] dim md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[var(--accent)]">●</span>
            <span>after install · restart {current.name} · prompt:</span>
            <code className="normal-case tracking-normal px-[6px] py-[1px] border rule bg-[var(--bg-2)] text-[0.93em] text-[var(--fg)] whitespace-nowrap">
              add workos audit logs to this harness
            </code>
          </div>
          <span className="opacity-70 whitespace-nowrap shrink-0">
            works in any md-aware agent
          </span>
        </div>
      </div>
    </section>
  );
}
