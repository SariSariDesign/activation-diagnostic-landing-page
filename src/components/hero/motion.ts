/**
 * Hero motion "dial kit" — the single source of truth for the on-load entrance.
 *
 * Every knob exposed by the in-app dev panel (HeroMotionPanel) and the standalone
 * /playground explorer maps to a field here. To bake a tuned look, paste the panel's
 * "Copy config" output over HERO_MOTION_DEFAULTS below.
 */

export type TypeMode = "char" | "word";
export type RevealMode = "fade" | "slide-up";
export type CaretChar = "|" | "▍" | "_";

export type HeroMotionConfig = {
  /** Type the headline a character at a time (terminal feel) or a word at a time. */
  mode: TypeMode;
  /** Interval between characters in "char" mode (ms). */
  charSpeedMs: number;
  /** Interval between words in "word" mode (ms). */
  wordSpeedMs: number;
  /** 0 = perfectly metronomic; 1 = heavy random variance for a human cadence. */
  humanizeJitter: number;

  /** Show a blinking caret while/after the headline types. */
  caretEnabled: boolean;
  /** Caret blink period (ms). */
  caretBlinkMs: number;
  /** Glyph used for the caret. */
  caretChar: CaretChar;

  /** Delay before the first element (eyebrow) appears (ms). */
  startDelayMs: number;
  /** Gap between stages: eyebrow → headline → subhead → cta → trust (ms). */
  stageGapMs: number;
  /** Stagger between the individual subhead lines (ms). */
  subheadLineStaggerMs: number;

  /** How non-typed elements enter. */
  revealMode: RevealMode;
  /** Slide distance for "slide-up" reveals (px). Ignored for "fade". */
  revealDistancePx: number;
  /** Duration of each reveal (ms). */
  revealDurationMs: number;
  /** CSS easing for reveals. */
  revealEasing: string;
};

export const HERO_MOTION_DEFAULTS: HeroMotionConfig = {
  mode: "char",
  charSpeedMs: 40,
  wordSpeedMs: 110,
  humanizeJitter: 0.15,

  caretEnabled: true,
  caretBlinkMs: 440,
  caretChar: "|",

  startDelayMs: 100,
  stageGapMs: 260,
  subheadLineStaggerMs: 220,

  revealMode: "slide-up",
  revealDistancePx: 14,
  revealDurationMs: 520,
  revealEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
};
