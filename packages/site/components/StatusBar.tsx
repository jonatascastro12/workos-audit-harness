"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function StatusBar() {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      return [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b rule bg-[var(--bg)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/70">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8 h-11 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-3 md:gap-5">
          <a
            href="https://workos.com"
            target="_blank"
            rel="noreferrer"
            className="dim hover:text-[var(--accent)] transition-colors"
          >
            workos:~/
          </a>
          <Link
            href="/"
            className="font-medium hover:text-[var(--accent)] transition-colors"
          >
            audit-harness
          </Link>
          <span className="dim hidden sm:inline">·</span>
          <a
            href="https://github.com/workos/workos-audit-harness/tree/main"
            target="_blank"
            rel="noreferrer"
            className="dim hidden sm:inline hover:text-[var(--accent)] transition-colors"
          >
            main
          </a>
          <span className="dim hidden md:inline">·</span>
          <span className="hidden md:inline">
            <span className="dim">v</span>
            <span>0.1.0</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="dim hidden md:inline tabular-nums">{time}</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
