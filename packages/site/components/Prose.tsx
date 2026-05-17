import type { ReactNode } from "react";

export function H2({ children, n }: { children: ReactNode; n?: string }) {
  return (
    <h2 className="mt-20 mb-6 text-[24px] md:text-[28px] leading-[1.2] tracking-[-0.015em] font-medium scroll-mt-24">
      {n && (
        <span className="text-[12px] uppercase tracking-[0.14em] dim mr-3 align-middle">
          §&nbsp;{n}
        </span>
      )}
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-12 mb-4 text-[17px] md:text-[18px] leading-[1.3] font-medium">
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="my-5 text-[14.5px] md:text-[15px] leading-[1.8] text-[var(--fg-2)]">
      {children}
    </p>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="my-6 space-y-2 text-[14.5px] leading-[1.7] text-[var(--fg-2)]">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="accent select-none shrink-0">▸</span>
      <span>{children}</span>
    </li>
  );
}

export function OL({ children }: { children: ReactNode }) {
  return (
    <ol className="my-6 space-y-2 text-[14.5px] leading-[1.7] text-[var(--fg-2)] [counter-reset:olc]">
      {children}
    </ol>
  );
}

export function OLI({ children }: { children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2.4ch_1fr] gap-3 [counter-increment:olc] before:content-[counter(olc,decimal-leading-zero)] before:text-[var(--accent)] before:font-medium">
      <span>{children}</span>
    </li>
  );
}

export function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-6 border-l-2 border-[var(--accent)] pl-5 text-[14.5px] leading-[1.7] text-[var(--fg)]">
      {children}
    </blockquote>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="px-[5px] py-[1px] border rule bg-[var(--bg-2)] text-[0.93em]">
      {children}
    </code>
  );
}

export function HR() {
  return <div className="my-14 div-dot" />;
}
