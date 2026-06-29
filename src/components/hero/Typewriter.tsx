"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TypeMode } from "./motion";

type TypewriterProps = {
  text: string;
  /** Begin typing when true. Mount with false to hold the pre-type state. */
  play: boolean;
  mode: TypeMode;
  charSpeedMs: number;
  wordSpeedMs: number;
  /** 0 = metronomic, 1 = heavy human variance. */
  humanizeJitter: number;
  caretEnabled: boolean;
  caretBlinkMs: number;
  caretChar: string;
  /** Reduced-motion / no-animation: render the full text immediately, no caret. */
  instant?: boolean;
  onDone?: () => void;
  className?: string;
};

/**
 * Types a single string with NO layout reflow.
 *
 * The full text is always present in the DOM (so the element reserves its final size);
 * each token animates `opacity` 0 → 1 in sequence. The caret is a zero-width inline
 * element, so it never nudges the surrounding text either.
 */
export function Typewriter({
  text,
  play,
  mode,
  charSpeedMs,
  wordSpeedMs,
  humanizeJitter,
  caretEnabled,
  caretBlinkMs,
  caretChar,
  instant = false,
  onDone,
  className,
}: TypewriterProps) {
  // char mode: one token per character (spaces included).
  // word mode: one token per "word + trailing whitespace".
  const tokens = useMemo(
    () =>
      mode === "char"
        ? Array.from(text)
        : text.match(/\S+\s*/g) ?? [text],
    [text, mode],
  );

  const [revealed, setRevealed] = useState(0);
  const [caretHidden, setCaretHidden] = useState(false);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (instant) {
      setRevealed(tokens.length);
      onDoneRef.current?.();
      return;
    }

    setRevealed(0);
    setCaretHidden(false);
    if (!play) return;

    const baseSpeed = mode === "char" ? charSpeedMs : wordSpeedMs;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    let doneTimer: ReturnType<typeof setTimeout>;

    const step = () => {
      i += 1;
      setRevealed(i);
      if (i >= tokens.length) {
        onDoneRef.current?.();
        // Let the caret blink at the end, then retire it.
        doneTimer = setTimeout(() => setCaretHidden(true), 1200);
        return;
      }
      const jitter = 1 + (Math.random() * 2 - 1) * humanizeJitter;
      timer = setTimeout(step, Math.max(8, baseSpeed * jitter));
    };

    timer = setTimeout(step, Math.max(8, baseSpeed));
    return () => {
      clearTimeout(timer);
      clearTimeout(doneTimer);
    };
  }, [
    play,
    instant,
    tokens,
    mode,
    charSpeedMs,
    wordSpeedMs,
    humanizeJitter,
  ]);

  const showCaret = caretEnabled && !instant && !caretHidden;

  return (
    <span className={className} aria-label={text}>
      {tokens.map((token, idx) => {
        const isRevealed = idx < revealed;
        const isCaretSlot = idx === revealed - 1;
        return (
          <span key={idx} aria-hidden="true" style={{ position: "relative" }}>
            <span
              style={{
                opacity: isRevealed ? 1 : 0,
                // pre-wrap so leading/trailing spaces in tokens are preserved
                whiteSpace: "pre-wrap",
              }}
            >
              {token}
            </span>
            {showCaret && isCaretSlot ? <Caret blinkMs={caretBlinkMs} glyph={caretChar} /> : null}
          </span>
        );
      })}
      {/* Caret before any character has typed (the "ready" blink). */}
      {showCaret && revealed === 0 ? <Caret blinkMs={caretBlinkMs} glyph={caretChar} /> : null}
    </span>
  );
}

/** Zero-width caret: occupies no layout width, so it never shifts the text. */
function Caret({ blinkMs, glyph }: { blinkMs: number; glyph: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-block",
        width: 0,
        overflow: "visible",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color: "var(--color-primary-400)",
          animation: `hero-caret-blink ${blinkMs}ms steps(1, end) infinite`,
        }}
      >
        {glyph}
      </span>
    </span>
  );
}
