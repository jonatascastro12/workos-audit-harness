"use client";

import { useState, Fragment } from "react";
import { tokenizeLine, classFor } from "./tokenize";

type Props = {
  code: string;
  label?: string;
  language?: string;
  showLineNumbers?: boolean;
};

export function CodeBlock({ code, label, language, showLineNumbers }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  const lines = code.replace(/^\n/, "").replace(/\n$/, "").split("\n");

  return (
    <div className="code group">
      <div className="flex items-center justify-between mb-2 text-[11px] uppercase tracking-[0.14em] dim">
        <span>{label ?? language ?? "shell"}</span>
        <button
          onClick={copy}
          className="hover:text-[var(--accent)] transition-colors"
          aria-label="copy command"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <pre className="m-0 p-0">
        <code className="block">
          {lines.map((ln, i) => {
            const toks = tokenizeLine(ln);
            return (
              <div key={i} className="whitespace-pre">
                {showLineNumbers && <span className="ln">{i + 1}</span>}
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
    </div>
  );
}
