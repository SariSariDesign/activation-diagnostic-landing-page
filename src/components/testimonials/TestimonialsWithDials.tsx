"use client";

import { useEffect, useState } from "react";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { TestimonialsPanel } from "./TestimonialsPanel";
import {
  TESTIMONIAL_DEFAULTS,
  type Testimonial,
  type TestimonialConfig,
} from "./testimonial";

type Props = {
  testimonials: readonly Testimonial[];
};

/**
 * Playground wrapper for the testimonials carousel. Owns the live config + a
 * replay nonce, and mounts the dev dial panel only in development or when the URL
 * has `?dials=1`. Used by /playground/testimonials to tune the look before baking
 * the config into TESTIMONIAL_DEFAULTS and shipping it in the Proof section.
 */
export function TestimonialsWithDials({ testimonials }: Props) {
  const [config, setConfig] = useState<TestimonialConfig>(TESTIMONIAL_DEFAULTS);
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
      <TestimonialsCarousel
        key={nonce}
        testimonials={testimonials}
        config={config}
        playImmediately
      />
      {showPanel ? (
        <TestimonialsPanel
          config={config}
          onChange={setConfig}
          onReplay={() => setNonce((n) => n + 1)}
        />
      ) : null}
    </>
  );
}
