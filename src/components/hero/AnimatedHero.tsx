"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { diagnostic } from "@/content/activation-diagnostic";
import { Button } from "@/components/Button";
import { Reveal } from "./Reveal";
import { Typewriter } from "./Typewriter";
import { HERO_MOTION_DEFAULTS, type HeroMotionConfig } from "./motion";
import { LogoCrawl } from "@/components/logos/LogoCrawl";
import { LOGO_CRAWL_DEFAULTS } from "@/components/logos/logos";
import { HeroGraphicMobile } from "@/components/HeroGraphicMobile";

/**
 * Stage gate for the choreographed entrance:
 *   1 eyebrow → 2 headline (types) → 3 subhead → 4 cta/microcopy → 5 trust
 * Reduced motion jumps straight to DONE (everything visible, no animation).
 */
const DONE = 99;

const PILL = "rounded-full";

function CTA() {
  return (
    <Button
      href={diagnostic.bookingUrl}
      variant="primary"
      size="large"
      external
      className={PILL}
    >
      {diagnostic.ctaLabel}
    </Button>
  );
}

export function AnimatedHero({
  config = HERO_MOTION_DEFAULTS,
  instant = false,
}: {
  config?: HeroMotionConfig;
  /** Force final state with no animation (reduced motion). */
  instant?: boolean;
}) {
  const { hero } = diagnostic;
  const [stage, setStage] = useState(instant ? DONE : 0);

  // Read latest config inside timers without restarting the timeline on every drag.
  const cfgRef = useRef(config);
  cfgRef.current = config;

  // Kick off: after startDelay, reveal the eyebrow (stage 1).
  useEffect(() => {
    if (instant) {
      setStage(DONE);
      return;
    }
    setStage(0);
    const t = setTimeout(() => setStage(1), cfgRef.current.startDelayMs);
    return () => clearTimeout(t);
  }, [instant]);

  // Advance through the timed stages. Headline → subhead is driven by the
  // Typewriter's onDone (see handleHeadlineDone), not a timer.
  useEffect(() => {
    if (instant) return;
    const c = cfgRef.current;

    if (stage === 1) {
      const t = setTimeout(() => setStage(2), c.stageGapMs);
      return () => clearTimeout(t);
    }
    if (stage === 3) {
      const subheadSpan =
        hero.subhead.length * c.subheadLineStaggerMs + c.revealDurationMs;
      const t = setTimeout(() => setStage(4), c.stageGapMs + subheadSpan);
      return () => clearTimeout(t);
    }
    if (stage === 4) {
      const t = setTimeout(() => setStage(5), c.stageGapMs + c.revealDurationMs);
      return () => clearTimeout(t);
    }
  }, [stage, instant, hero.subhead.length]);

  const handleHeadlineDone = () => {
    if (instant) return;
    const t = setTimeout(() => setStage(3), cfgRef.current.stageGapMs);
    // Best-effort cleanup if the component unmounts mid-gap.
    headlineTimer.current = t;
  };
  const headlineTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(headlineTimer.current), []);

  const reveal = (key: string, play: boolean, delayMs: number, className: string, children: ReactNode) => (
    <Reveal
      key={key}
      play={play}
      delayMs={delayMs}
      instant={instant}
      mode={config.revealMode}
      distancePx={config.revealDistancePx}
      durationMs={config.revealDurationMs}
      easing={config.revealEasing}
      className={className}
    >
      {children}
    </Reveal>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 py-6 md:py-10">
      {reveal(
        "eyebrow",
        stage >= 1,
        0,
        // Hidden on mobile to reclaim top-of-fold space (see HeroGraphicMobile).
        "ds-label text-label-l text-primary-400 hidden lg:block",
        hero.eyebrow,
      )}

      <h1 className="max-w-[16ch] font-brand text-[clamp(38px,6.2vw,72px)] leading-[1.04] tracking-[-0.02em] text-neutral-900 sm:max-w-[20ch]">
        <Typewriter
          text={hero.headline}
          play={stage >= 2}
          instant={instant}
          mode={config.mode}
          charSpeedMs={config.charSpeedMs}
          wordSpeedMs={config.wordSpeedMs}
          humanizeJitter={config.humanizeJitter}
          caretEnabled={config.caretEnabled}
          caretBlinkMs={config.caretBlinkMs}
          caretChar={config.caretChar}
          onDone={handleHeadlineDone}
        />
      </h1>

      {/* Mobile: one running paragraph. Desktop: the three stacked lines. */}
      {reveal(
        "subheadParagraph",
        stage >= 3,
        0,
        "max-w-[640px] text-body-l text-neutral-700 lg:hidden",
        hero.subheadParagraph,
      )}
      <div className="hidden max-w-[640px] text-body-l text-neutral-700 lg:block">
        {hero.subhead.map((line, i) =>
          reveal(
            line,
            stage >= 3,
            i * config.subheadLineStaggerMs,
            "block",
            line,
          ),
        )}
      </div>

      {reveal(
        "cta",
        stage >= 4,
        0,
        "mt-2",
        <CTA />,
      )}

      {reveal(
        "trust",
        stage >= 5,
        0,
        "mt-8 max-w-[560px] border-t border-neutral-300 pt-6 text-body-s text-neutral-500",
        hero.logosLabel,
      )}

      {reveal(
        "logos",
        stage >= 5,
        config.revealDurationMs,
        "mt-3 w-full min-w-0 max-w-[600px]",
        <LogoCrawl config={LOGO_CRAWL_DEFAULTS} />,
      )}

      {/* Mobile-only visual anchor below the trust row; desktop uses HeroGraphic. */}
      {reveal(
        "hero-anchor",
        stage >= 5,
        config.revealDurationMs,
        "mt-8 lg:hidden",
        <HeroGraphicMobile />,
      )}
    </div>
  );
}
