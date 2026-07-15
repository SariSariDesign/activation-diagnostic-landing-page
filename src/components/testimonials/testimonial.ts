/**
 * Testimonials "dial kit" — the single source of truth for the speech-bubble
 * carousel's layout + motion. Every knob in the dev panel (TestimonialsPanel)
 * maps to a field here. To bake a tuned look, paste the panel's "Copy config"
 * output over TESTIMONIAL_DEFAULTS below.
 */

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  image: string;
};

export type RevealMode = "fade" | "slide-up";
export type Align = "left" | "center";

export type TestimonialConfig = {
  /** Max width of a testimonial card (px). */
  cardMaxWidthPx: number;
  /** Inner padding of the speech bubble (px). */
  bubblePaddingPx: number;
  /** Corner radius of the speech bubble (px). */
  bubbleRadiusPx: number;
  /** Size of the downward tail triangle at the bubble's bottom-left (px). */
  bubbleTailSizePx: number;
  /** Quote font size (px). */
  quoteFontSizePx: number;
  /** Quote line height (px). */
  quoteLineHeightPx: number;

  /** Circular avatar diameter (px). */
  avatarSizePx: number;
  /** Gap between the bubble and the attribution row (px). */
  attributionGapPx: number;
  /** Horizontal alignment of the card contents. */
  align: Align;

  /** Auto-advance the carousel. */
  autoplay: boolean;
  /** Delay between auto-advances (ms). */
  autoplayIntervalMs: number;
  /** Slide cross-fade / transition duration (ms). */
  transitionMs: number;
  /** CSS easing for the slide transition. */
  transitionEasing: string;
  /** Show the dot indicators (only when there are 2+ testimonials). */
  showDots: boolean;
  /** Show the prev/next arrows (only when there are 2+ testimonials). */
  showArrows: boolean;

  /** How each card enters on load. */
  revealMode: RevealMode;
  /** Slide distance for "slide-up" reveals (px). Ignored for "fade". */
  revealDistancePx: number;
  /** Duration of the entrance reveal (ms). */
  revealDurationMs: number;
  /** CSS easing for the entrance reveal. */
  revealEasing: string;
};

export const TESTIMONIAL_DEFAULTS: TestimonialConfig = {
  cardMaxWidthPx: 880,
  bubblePaddingPx: 62,
  bubbleRadiusPx: 34,
  bubbleTailSizePx: 34,
  quoteFontSizePx: 33,
  quoteLineHeightPx: 43,
  avatarSizePx: 94,
  attributionGapPx: 32,
  align: "left",
  autoplay: false,
  autoplayIntervalMs: 6000,
  transitionMs: 500,
  transitionEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
  showDots: true,
  showArrows: true,
  revealMode: "slide-up",
  revealDistancePx: 16,
  revealDurationMs: 560,
  revealEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
};
