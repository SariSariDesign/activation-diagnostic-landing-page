"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { RevealMode } from "./motion";

type RevealProps = {
  children: ReactNode;
  /** Reveal when true. */
  play: boolean;
  /** Delay before this element enters, relative to when `play` flips true (ms). */
  delayMs: number;
  mode: RevealMode;
  distancePx: number;
  durationMs: number;
  easing: string;
  /** Reduced-motion: render visible immediately, no transition. */
  instant?: boolean;
  className?: string;
};

/** Fades / slides a non-typed element in once `play` is true, after `delayMs`. */
export function Reveal({
  children,
  play,
  delayMs,
  mode,
  distancePx,
  durationMs,
  easing,
  instant = false,
  className,
}: RevealProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (instant) {
      setShown(true);
      return;
    }
    setShown(false);
    if (!play) return;
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [play, instant, delayMs]);

  const hiddenTransform =
    mode === "slide-up" ? `translateY(${distancePx}px)` : "none";

  return (
    <div
      className={className}
      style={{
        opacity: shown || instant ? 1 : 0,
        transform: shown || instant ? "translateY(0)" : hiddenTransform,
        transition: instant
          ? "none"
          : `opacity ${durationMs}ms ${easing}, transform ${durationMs}ms ${easing}`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
