"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "../hero/Reveal";
import { useReducedMotion } from "../hero/useReducedMotion";
import { SpeechBubbleCard } from "./SpeechBubbleCard";
import type { Testimonial, TestimonialConfig } from "./testimonial";

type Props = {
  testimonials: readonly Testimonial[];
  config: TestimonialConfig;
  /** Force the entrance on immediately (used by the playground preview). */
  playImmediately?: boolean;
};

/**
 * Speech-bubble testimonial carousel. Renders N cards on a sliding track with
 * prev/next arrows + dot indicators (shown only for 2+ testimonials). Autoplay,
 * transition timing, and the on-load entrance are all driven by TestimonialConfig
 * and disabled under `prefers-reduced-motion`.
 */
export function TestimonialsCarousel({
  testimonials,
  config,
  playImmediately = false,
}: Props) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(playImmediately);
  const rootRef = useRef<HTMLDivElement>(null);

  const count = testimonials.length;
  const multi = count > 1;

  // Clamp the active index if the list shrinks.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, count - 1)));
  }, [count]);

  // Trigger the entrance reveal once the carousel scrolls into view.
  useEffect(() => {
    if (playImmediately || inView) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playImmediately, inView]);

  // Autoplay.
  useEffect(() => {
    if (!config.autoplay || !multi || reduced) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % count),
      config.autoplayIntervalMs,
    );
    return () => clearInterval(id);
  }, [config.autoplay, config.autoplayIntervalMs, multi, count, reduced]);

  const go = (next: number) => setIndex(((next % count) + count) % count);

  return (
    <div ref={rootRef}>
      <Reveal
        play={inView}
        delayMs={0}
        mode={config.revealMode}
        distancePx={config.revealDistancePx}
        durationMs={config.revealDurationMs}
        easing={config.revealEasing}
        instant={reduced}
      >
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          style={{ position: "relative" }}
        >
          {/* Sliding track */}
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                transform: `translateX(-${index * 100}%)`,
                transition: reduced
                  ? "none"
                  : `transform ${config.transitionMs}ms ${config.transitionEasing}`,
              }}
            >
              {testimonials.map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={i !== index}
                  style={{ flex: "0 0 100%", minWidth: 0, padding: "0 4px" }}
                >
                  <SpeechBubbleCard testimonial={t} config={config} />
                </div>
              ))}
            </div>
          </div>

          {/* Prev / next arrows */}
          {multi && config.showArrows ? (
            <>
              <CarouselArrow dir="prev" onClick={() => go(index - 1)} />
              <CarouselArrow dir="next" onClick={() => go(index + 1)} />
            </>
          ) : null}
        </div>

        {/* Dot indicators */}
        {multi && config.showDots ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 28,
            }}
          >
            {testimonials.map((t, i) => (
              <button
                key={`dot-${t.name}-${i}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === index}
                style={{
                  width: i === index ? 22 : 8,
                  height: 8,
                  borderRadius: 9999,
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  background:
                    i === index
                      ? "var(--color-primary-400)"
                      : "var(--color-neutral-400)",
                  transition: "width 200ms ease, background 200ms ease",
                }}
              />
            ))}
          </div>
        ) : null}
      </Reveal>
    </div>
  );
}

function CarouselArrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = dir === "prev";
  return (
    <button
      onClick={onClick}
      aria-label={isPrev ? "Previous testimonial" : "Next testimonial"}
      className="ds-label"
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: isPrev ? -8 : undefined,
        right: isPrev ? undefined : -8,
        width: 44,
        height: 44,
        borderRadius: 9999,
        background: "#ffffff",
        border: "1px solid var(--color-neutral-300)",
        boxShadow: "0px 8px 18px -8px rgba(31,29,28,0.16)",
        color: "var(--color-neutral-800)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        lineHeight: 1,
      }}
    >
      <span aria-hidden>{isPrev ? "←" : "→"}</span>
    </button>
  );
}
