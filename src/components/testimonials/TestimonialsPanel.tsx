"use client";

import { useState } from "react";
import {
  TESTIMONIAL_DEFAULTS,
  type Align,
  type RevealMode,
  type TestimonialConfig,
} from "./testimonial";
import {
  Group,
  Segmented,
  Slider,
  Toggle,
  btn,
  btnGhost,
  panelWrap,
} from "../dials/DialControls";

type PanelProps = {
  config: TestimonialConfig;
  onChange: (next: TestimonialConfig) => void;
  onReplay: () => void;
};

/**
 * Dev-only floating dial kit for the testimonials carousel. Tunes TestimonialConfig
 * live against the real card. "Copy config" emits an object you can paste over
 * TESTIMONIAL_DEFAULTS in testimonial.ts.
 */
export function TestimonialsPanel({ config, onChange, onReplay }: PanelProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof TestimonialConfig>(
    key: K,
    value: TestimonialConfig[K],
  ) => onChange({ ...config, [key]: value });

  const copy = async () => {
    const body = (Object.keys(config) as (keyof TestimonialConfig)[])
      .map((k) => {
        const v = config[k];
        return `  ${k}: ${typeof v === "string" ? JSON.stringify(v) : v},`;
      })
      .join("\n");
    const text = `export const TESTIMONIAL_DEFAULTS: TestimonialConfig = {\n${body}\n};`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy testimonial config:", text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const wrap = panelWrap(open);

  if (!open) {
    return (
      <div style={wrap}>
        <button onClick={() => setOpen(true)} style={btn}>
          ⚙ testimonial dials
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <strong>Testimonials</strong>
        <button onClick={() => setOpen(false)} style={btnGhost} aria-label="Collapse">
          ✕
        </button>
      </div>

      <Group label="bubble">
        <Slider label="cardMaxWidthPx" min={360} max={880} step={10} value={config.cardMaxWidthPx} onChange={(v) => set("cardMaxWidthPx", v)} />
        <Slider label="bubblePaddingPx" min={16} max={72} step={2} value={config.bubblePaddingPx} onChange={(v) => set("bubblePaddingPx", v)} />
        <Slider label="bubbleRadiusPx" min={0} max={48} step={1} value={config.bubbleRadiusPx} onChange={(v) => set("bubbleRadiusPx", v)} />
        <Slider label="bubbleTailSizePx" min={0} max={48} step={1} value={config.bubbleTailSizePx} onChange={(v) => set("bubbleTailSizePx", v)} />
        <Slider label="quoteFontSizePx" min={14} max={40} step={1} value={config.quoteFontSizePx} onChange={(v) => set("quoteFontSizePx", v)} />
        <Slider label="quoteLineHeightPx" min={18} max={56} step={1} value={config.quoteLineHeightPx} onChange={(v) => set("quoteLineHeightPx", v)} />
      </Group>

      <Group label="attribution">
        <Slider label="avatarSizePx" min={40} max={120} step={2} value={config.avatarSizePx} onChange={(v) => set("avatarSizePx", v)} />
        <Slider label="attributionGapPx" min={8} max={64} step={2} value={config.attributionGapPx} onChange={(v) => set("attributionGapPx", v)} />
        <Segmented<Align>
          value={config.align}
          options={["left", "center"]}
          onChange={(v) => set("align", v)}
        />
      </Group>

      <Group label="carousel">
        <Toggle label="autoplay" checked={config.autoplay} onChange={(v) => set("autoplay", v)} />
        <Slider label="autoplayIntervalMs" min={2000} max={12000} step={250} value={config.autoplayIntervalMs} onChange={(v) => set("autoplayIntervalMs", v)} />
        <Slider label="transitionMs" min={120} max={1200} step={20} value={config.transitionMs} onChange={(v) => set("transitionMs", v)} />
        <Toggle label="showDots" checked={config.showDots} onChange={(v) => set("showDots", v)} />
        <Toggle label="showArrows" checked={config.showArrows} onChange={(v) => set("showArrows", v)} />
      </Group>

      <Group label="entrance">
        <Segmented<RevealMode>
          value={config.revealMode}
          options={["fade", "slide-up"]}
          onChange={(v) => set("revealMode", v)}
        />
        <Slider label="revealDistancePx" min={0} max={48} step={1} value={config.revealDistancePx} onChange={(v) => set("revealDistancePx", v)} />
        <Slider label="revealDurationMs" min={120} max={1200} step={20} value={config.revealDurationMs} onChange={(v) => set("revealDurationMs", v)} />
      </Group>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onReplay} style={btn}>▶ Replay</button>
        <button onClick={() => onChange(TESTIMONIAL_DEFAULTS)} style={btnGhost}>Reset</button>
      </div>
      <button onClick={copy} style={{ ...btn, width: "100%", marginTop: 8 }}>
        {copied ? "✓ Copied" : "⧉ Copy config"}
      </button>
    </div>
  );
}
