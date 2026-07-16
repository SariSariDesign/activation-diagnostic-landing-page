/**
 * Logos "dial kit" — the single source of truth for the "trusted by" crawl
 * (marquee) that sits under the hero. Every knob in the dev panel (LogosPanel)
 * maps to a field here. To bake a tuned look, paste the panel's "Copy config"
 * output over LOGO_CRAWL_DEFAULTS below.
 */

export type Logo = {
  /** Company name, rendered as the wordmark text. */
  name: string;
  /** Optional brand mark shown before the name (path under /public). */
  mark: string | null;
  /** Intrinsic aspect ratio (width / height) of the mark image. */
  markAspect: number;
  /** Mark height as a multiple of the name font size — keeps optical balance
   *  across marks of different proportions as the whole strip scales. */
  markScale: number;
};

/**
 * The five client logos, each reduced to a flat single-tone silhouette in the
 * house grey (see /public/logos/*.png). Silk & Sonder has no separate mark, so
 * it renders name-only. markAspect/markScale are baked from the source art.
 */
export const LOGOS: readonly Logo[] = [
  { name: "Lendzi", mark: "/logos/lendzi.png", markAspect: 110 / 234, markScale: 1.05 },
  { name: "SignalVerified", mark: "/logos/signalverified.png", markAspect: 677 / 386, markScale: 0.84 },
  { name: "Silk & Sonder", mark: null, markAspect: 0, markScale: 0 },
  { name: "Lions & Lambs", mark: "/logos/lionslambs.png", markAspect: 214 / 338, markScale: 1.16 },
  { name: "Selfbook", mark: "/logos/selfbook.png", markAspect: 512 / 512, markScale: 1.05 },
];

export type Direction = "left" | "right";

export type LogoCrawlConfig = {
  /** Scroll speed in pixels per second. */
  speedPxPerSec: number;
  /** Scroll direction. */
  direction: Direction;
  /** Horizontal gap between adjacent logos (px). */
  gapPx: number;
  /** Name font size (px). Each mark scales from this via its markScale. */
  fontSizePx: number;
  /** Gap between a logo's mark and its name (px). */
  markGapPx: number;
  /** Opacity of the whole strip (0–1). */
  opacity: number;
  /** Pause the crawl while the pointer is over the strip. */
  pauseOnHover: boolean;
  /** Fade the left/right edges into the background. */
  fadeEdges: boolean;
  /** Width of each edge fade (px). */
  fadeWidthPx: number;
};

export const LOGO_CRAWL_DEFAULTS: LogoCrawlConfig = {
  speedPxPerSec: 30,
  direction: "left",
  gapPx: 60,
  fontSizePx: 20,
  markGapPx: 0,
  opacity: 1,
  pauseOnHover: true,
  fadeEdges: true,
  fadeWidthPx: 52,
};
