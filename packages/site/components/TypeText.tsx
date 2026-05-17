"use client";

import { useEffect, useMemo, useState } from "react";

type Segment = { text: string; className?: string };

type Props = {
  /** Full text to type, line-by-line. */
  segments: Segment[];
  /** ms per character */
  speed?: number;
  /** ms to wait before starting */
  startDelay?: number;
  /** Accessible label — the whole text rendered for screen readers. */
  ariaLabel: string;
  /** Render a blinking caret at the end. */
  showCaret?: boolean;
};

/**
 * Types out a sequence of styled segments character-by-character. Renders the
 * full text immediately for users with prefers-reduced-motion or no JS.
 */
export function TypeText({
  segments,
  speed = 38,
  startDelay = 220,
  ariaLabel,
  showCaret = true,
}: Props) {
  const full = useMemo(
    () => segments.map((s) => s.text).join(""),
    [segments],
  );
  const totalLen = full.length;

  const [n, setN] = useState<number>(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setN(totalLen);
      setDone(true);
      return;
    }

    let raf = 0;
    let cancelled = false;
    const startAt = performance.now() + startDelay;

    const tick = (t: number) => {
      if (cancelled) return;
      const elapsed = Math.max(0, t - startAt);
      const k = Math.min(totalLen, Math.floor(elapsed / speed));
      setN(k);
      if (k >= totalLen) {
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [totalLen, speed, startDelay]);

  // Slice the segments to the first `n` characters total.
  let remaining = n;
  const rendered: Array<{ seg: Segment; visible: string }> = [];
  for (const seg of segments) {
    if (remaining <= 0) {
      rendered.push({ seg, visible: "" });
      continue;
    }
    const take = Math.min(seg.text.length, remaining);
    rendered.push({ seg, visible: seg.text.slice(0, take) });
    remaining -= take;
  }

  return (
    <>
      <span className="sr-only">{ariaLabel}</span>
      <span aria-hidden="true">
        {rendered.map(({ seg, visible }, i) => {
          // Handle explicit newline tokens "\n" inside text
          const parts = visible.split("\n");
          return (
            <span key={i} className={seg.className}>
              {parts.map((p, j) => (
                <span key={j}>
                  {p}
                  {j < parts.length - 1 ? <br /> : null}
                </span>
              ))}
            </span>
          );
        })}
        {showCaret && (
          <span
            className={"caret caret-hero" + (done ? " caret-done" : "")}
            aria-hidden="true"
          />
        )}
      </span>
    </>
  );
}
