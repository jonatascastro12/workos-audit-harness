"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = resolvedTheme === "dark";
  const label = mounted ? (dark ? "dark" : "light") : "····";

  return (
    <button
      aria-label="toggle theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] dim hover:text-[var(--accent)] transition-colors"
    >
      <span className="opacity-60">theme</span>
      <span className="text-[var(--fg)]">[</span>
      <span className="text-[var(--accent)] min-w-[3ch] inline-block text-center">
        {label}
      </span>
      <span className="text-[var(--fg)]">]</span>
    </button>
  );
}
