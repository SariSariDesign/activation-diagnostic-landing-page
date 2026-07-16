"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hero/useReducedMotion";
import { LOGOS, type Logo, type LogoCrawlConfig } from "./logos";

type Props = {
  config: LogoCrawlConfig;
  logos?: readonly Logo[];
};

/**
 * Infinite "trusted by" logo crawl. Renders two identical logo sets end-to-end
 * on a single track and animates it with the `logo-crawl` keyframe (translateX
 * to -50%), so one full set scrolls off exactly as its copy scrolls in — a
 * seamless loop. Loop duration is derived from the measured set width and the
 * target speed (px/s), so speed stays constant no matter how many logos there
 * are. Frozen under `prefers-reduced-motion`.
 */
export function LogoCrawl({ config, logos = LOGOS }: Props) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [durationSec, setDurationSec] = useState(20);
  const [hovered, setHovered] = useState(false);

  // Derive the loop duration from the measured single-set width and the target
  // speed. Re-measures when any size-affecting dial changes or the box resizes.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const setWidth = el.scrollWidth / 2; // track holds two identical sets
      const speed = Math.max(1, config.speedPxPerSec);
      setDurationSec(setWidth / speed);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    config.speedPxPerSec,
    config.gapPx,
    config.fontSizePx,
    config.markGapPx,
    logos,
  ]);

  const animate = !reduced;
  const paused = animate && config.pauseOnHover && hovered;
  const items = [...logos, ...logos];

  // Soft edge fade via a mask so it works over any background colour.
  const fade = config.fadeEdges
    ? `linear-gradient(to right, transparent 0, #000 ${config.fadeWidthPx}px, #000 calc(100% - ${config.fadeWidthPx}px), transparent 100%)`
    : undefined;

  return (
    <div
      role="group"
      aria-label="Trusted by leading teams"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        opacity: config.opacity,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
    >
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: "max-content",
          willChange: animate ? "transform" : undefined,
          ...(animate
            ? {
                animationName: "logo-crawl",
                animationDuration: `${durationSec}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDirection:
                  config.direction === "right" ? "reverse" : "normal",
                animationPlayState: paused ? "paused" : "running",
              }
            : null),
        }}
      >
        {items.map((logo, i) => (
          <LogoItem
            key={`${logo.name}-${i}`}
            logo={logo}
            config={config}
            duplicate={i >= logos.length}
          />
        ))}
      </div>
    </div>
  );
}

function LogoItem({
  logo,
  config,
  duplicate,
}: {
  logo: Logo;
  config: LogoCrawlConfig;
  duplicate: boolean;
}) {
  const markH = config.fontSizePx * logo.markScale;
  return (
    <div
      // The second set is a visual duplicate only — hide it from assistive tech.
      aria-hidden={duplicate || undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: config.markGapPx,
        marginRight: config.gapPx,
        flexShrink: 0,
      }}
    >
      {logo.mark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.mark}
          alt=""
          aria-hidden
          style={{
            height: markH,
            width: markH * logo.markAspect,
            objectFit: "contain",
            flexShrink: 0,
            display: "block",
          }}
        />
      ) : null}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: config.fontSizePx,
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          color: "#A8A5A2",
          whiteSpace: "nowrap",
        }}
      >
        {logo.name}
      </span>
    </div>
  );
}
