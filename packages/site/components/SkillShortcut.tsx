"use client";

import { Fragment, useState } from "react";
import { tokenizeLine, classFor, Tokenized } from "./tokenize";

type Target = {
  id: string;
  name: string;
  meta: string;
  dir: string;
  command: string;
};

const REPO = "jonatascastro12/workos-audit-harness";
const REPO_PATH = "packages/site/public/skills/workos-audit-recipe.md";
const SKILL_RAW_URL = `https://raw.githubusercontent.com/${REPO}/main/${REPO_PATH}`;
const SKILL_VIEW_URL = `https://github.com/${REPO}/blob/main/${REPO_PATH}`;

const TARGETS: Target[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    meta: "~/.claude/skills/",
    dir: "~/.claude/skills/workos-audit-recipe",
    command: `mkdir -p ~/.claude/skills/workos-audit-recipe \\
  && curl -fsSL ${SKILL_RAW_URL} \\
       -o ~/.claude/skills/workos-audit-recipe/SKILL.md`,
  },
  {
    id: "codex",
    name: "Codex",
    meta: "~/.codex/skills/",
    dir: "~/.codex/skills/workos-audit-recipe",
    command: `mkdir -p ~/.codex/skills/workos-audit-recipe \\
  && curl -fsSL ${SKILL_RAW_URL} \\
       -o ~/.codex/skills/workos-audit-recipe/SKILL.md`,
  },
];

export function SkillShortcut() {
  const targets = TARGETS;
  const [active, setActive] = useState<string>(targets[0].id);
  const [copied, setCopied] = useState(false);
  const current = targets.find((t) => t.id === active)!;

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
        <span>
          SHORTCUT · <span className="tok-str">1-LINER</span> ·{" "}
          <span className="tok-num">v1</span>
        </span>
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
          <span>
            shortcut · <span className="tok-kw">skill</span>
          </span>
          <span className="opacity-30">·</span>
          <span className="tok-num">00</span>
          <span className="flex-1 mx-3 h-px bg-[var(--rule)] opacity-60" />
          <span className="hidden md:inline">
            recipe → <span className="tok-str">one&nbsp;line</span>
          </span>
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
              <span className="tok-id">workos-audit-recipe</span>
            </div>
          </div>
          <div>
            <div className="dim">size</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              <span className="tok-num">~4 kb</span>
              <span className="tok-punct"> · </span>
              <span className="tok-num">1</span>
              <span className="tok-punct"> </span>
              <span>file</span>
            </div>
          </div>
          <div>
            <div className="dim">trigger</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              <span className="tok-str">audit</span>
              <span className="tok-punct"> · </span>
              <span className="tok-str">log</span>
              <span className="tok-punct"> · </span>
              <span className="tok-str">harness</span>
            </div>
          </div>
          <div>
            <div className="dim">scope</div>
            <div className="mt-1 normal-case tracking-normal text-[12.5px]">
              <span className="tok-kw">user-local</span>
            </div>
          </div>
        </div>

        {/* harness tabs */}
        <div className="mt-7 flex items-end" role="tablist" aria-label="Target harness">
          {targets.map((t) => (
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
              <Tokenized text={current.meta} />
            </code>
          </span>
        </div>

        {/* command */}
        <div className="border border-t-0 rule bg-[var(--bg-2)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2 text-[11px] uppercase tracking-[0.14em] dim">
            <span className="whitespace-nowrap">
              <span className="tok-kw">bash</span>{" "}
              <span className="opacity-50">·</span>{" "}
              <span className="tok-str">one-shot</span>
            </span>
            <span className="text-right normal-case tracking-normal text-[0.95em]">
              <span className="uppercase tracking-[0.14em] dim mr-1">
                creates
              </span>
              <Tokenized text={`${current.dir}/SKILL.md`} />
            </span>
          </div>
          <pre className="m-0 p-0 overflow-x-auto text-[13px] leading-[1.55]">
            <code className="block">
              {current.command.split("\n").map((line, i) => {
                const display = i === 0 ? `$ ${line}` : line;
                const toks = tokenizeLine(display);
                return (
                  <div key={i} className="whitespace-pre">
                    {toks.map((tk, j) => (
                      <Fragment key={j}>
                        <span className={classFor(tk.type)}>{tk.text}</span>
                      </Fragment>
                    ))}
                  </div>
                );
              })}
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
              href={SKILL_VIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="btn text-[12px] uppercase tracking-[0.14em]"
            >
              <span aria-hidden>↗</span>
              <span>view SKILL.md on github</span>
            </a>

            <a
              href={SKILL_RAW_URL}
              target="_blank"
              rel="noreferrer"
              download="SKILL.md"
              className="btn text-[12px] uppercase tracking-[0.14em]"
            >
              <span aria-hidden>⬇</span>
              <span>download raw</span>
            </a>
          </div>
        </div>

        {/* sub-line / verify */}
        <div className="mt-5 flex flex-col gap-2 text-[12px] uppercase tracking-[0.14em] dim md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[var(--accent)]">●</span>
            <span>
              after install · <span className="tok-kw">restart</span>{" "}
              <span className="text-[var(--accent)] normal-case tracking-normal">
                {current.name}
              </span>{" "}
              · prompt:
            </span>
            <code className="normal-case tracking-normal px-[6px] py-[1px] border rule bg-[var(--bg-2)] text-[0.93em] whitespace-nowrap">
              <span className="tok-id">add</span>{" "}
              <span className="tok-str">workos</span>{" "}
              <span className="tok-id">audit logs</span>{" "}
              <span className="tok-kw">to</span>{" "}
              <span className="tok-id">this harness</span>
            </code>
          </div>
          <span className="opacity-70 whitespace-nowrap shrink-0">
            works in any <span className="tok-str">md</span>-aware agent
          </span>
        </div>
      </div>
    </section>
  );
}
