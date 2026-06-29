"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the OS-level `prefers-reduced-motion: reduce` setting.
 *
 * SSR-safe: starts `false` (matching the server render where we play the animation),
 * then syncs on mount. When true, the hero should render its final state immediately.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
