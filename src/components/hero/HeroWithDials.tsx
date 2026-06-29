"use client";

import { useEffect, useState } from "react";
import { AnimatedHero } from "./AnimatedHero";
import { HeroMotionPanel } from "./HeroMotionPanel";
import { useReducedMotion } from "./useReducedMotion";
import { HERO_MOTION_DEFAULTS, type HeroMotionConfig } from "./motion";

/**
 * Client wrapper for the hero text column. Owns the live config + replay nonce and
 * mounts the dev dial panel only in development or when the URL has `?dials=1`.
 * In a normal production load it renders just the tuned AnimatedHero.
 */
export function HeroWithDials() {
  const instant = useReducedMotion();
  const [config, setConfig] = useState<HeroMotionConfig>(HERO_MOTION_DEFAULTS);
  const [nonce, setNonce] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === "development" ||
      new URLSearchParams(window.location.search).has("dials");
    setShowPanel(enabled);
  }, []);

  return (
    <>
      <AnimatedHero key={nonce} config={config} instant={instant} />
      {showPanel ? (
        <HeroMotionPanel
          config={config}
          onChange={setConfig}
          onReplay={() => setNonce((n) => n + 1)}
        />
      ) : null}
    </>
  );
}
