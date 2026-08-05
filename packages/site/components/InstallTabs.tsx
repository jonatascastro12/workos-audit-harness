"use client";

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

type Target = {
  id: string;
  name: string;
  blurb: string;
  meta: string;
  code: string;
  link: string;
};

const TARGETS: Target[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    blurb: "Marketplace install. /workos-audit-setup wires creds.",
    meta: "plugin · MCP · hooks",
    code: `$ claude plugin marketplace add workos/workos-audit-harness
$ claude plugin install workos-audit@workos-audit-plugins
# restart claude code, then:
$ /workos-audit-setup`,
    link: "https://github.com/workos/workos-audit-harness/tree/main/packages/claude-plugin",
  },
  {
    id: "codex",
    name: "Codex",
    blurb: "Add the marketplace, install workos-audit, restart.",
    meta: "plugin · MCP · hooks",
    code: `$ git clone https://github.com/workos/workos-audit-harness.git
$ cd workos-audit-harness
$ codex plugin marketplace add .
# inside codex: install workos-audit, then restart`,
    link: "https://github.com/workos/workos-audit-harness/tree/main/packages/codex-plugin",
  },
  {
    id: "pi",
    name: "pi-coding-agent",
    blurb: "Register the extension. Ships the workos-audit-harness CLI.",
    meta: "extension · CLI",
    code: `$ git clone https://github.com/workos/workos-audit-harness.git
$ cd workos-audit-harness
$ npm install
# then point pi at packages/pi-extension/index.ts`,
    link: "https://github.com/workos/workos-audit-harness/tree/main/packages/pi-extension",
  },
];

export function InstallTabs() {
  const [active, setActive] = useState<string>(TARGETS[0].id);
  const current = TARGETS.find((t) => t.id === active)!;

  return (
    <div>
      <div className="flex flex-wrap items-end" role="tablist">
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
      </div>

      <div className="hl border border-t-0 rule p-5 md:p-7">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 md:gap-8 items-start mb-5">
          <p className="text-[15px] leading-[1.6] max-w-[60ch]">
            {current.blurb}
          </p>
          <div className="text-[11px] uppercase tracking-[0.14em] dim md:text-right">
            {current.meta}
          </div>
        </div>
        <CodeBlock code={current.code} label="bash" />
        <div className="mt-5 text-[12px]">
          <a
            href={current.link}
            target="_blank"
            rel="noreferrer"
            className="link dim"
          >
            full setup → packages/{current.id === "claude-code" ? "claude-plugin" : current.id === "codex" ? "codex-plugin" : "pi-extension"}
          </a>
        </div>
      </div>
    </div>
  );
}
