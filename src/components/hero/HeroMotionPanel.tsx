"use client";

import { useState } from "react";
import {
  HERO_MOTION_DEFAULTS,
  type CaretChar,
  type HeroMotionConfig,
  type RevealMode,
  type TypeMode,
} from "./motion";
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
  config: HeroMotionConfig;
  onChange: (next: HeroMotionConfig) => void;
  onReplay: () => void;
};

/**
 * Dev-only floating dial kit. Tunes HeroMotionConfig live against real fonts/layout.
 * "Copy config" emits an object you can paste over HERO_MOTION_DEFAULTS in motion.ts.
 */
export function HeroMotionPanel({ config, onChange, onReplay }: PanelProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof HeroMotionConfig>(key: K, value: HeroMotionConfig[K]) =>
    onChange({ ...config, [key]: value });

  const copy = async () => {
    const body = (Object.keys(config) as (keyof HeroMotionConfig)[])
      .map((k) => {
        const v = config[k];
        return `  ${k}: ${typeof v === "string" ? JSON.stringify(v) : v},`;
      })
      .join("\n");
    const text = `export const HERO_MOTION_DEFAULTS: HeroMotionConfig = {\n${body}\n};`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be blocked; fall back to a prompt.
      window.prompt("Copy hero motion config:", text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const wrap = panelWrap(open);

  if (!open) {
    return (
      <div style={wrap}>
        <button onClick={() => setOpen(true)} style={btn}>
          ⚙ hero dials
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong>Hero motion</strong>
        <button onClick={() => setOpen(false)} style={btnGhost} aria-label="Collapse">
          ✕
        </button>
      </div>

      <Group label="mode">
        <Segmented<TypeMode>
          value={config.mode}
          options={["char", "word"]}
          onChange={(v) => set("mode", v)}
        />
      </Group>

      {config.mode === "char" ? (
        <Slider label="charSpeedMs" min={5} max={140} step={1} value={config.charSpeedMs} onChange={(v) => set("charSpeedMs", v)} />
      ) : (
        <Slider label="wordSpeedMs" min={30} max={400} step={5} value={config.wordSpeedMs} onChange={(v) => set("wordSpeedMs", v)} />
      )}
      <Slider label="humanizeJitter" min={0} max={1} step={0.05} value={config.humanizeJitter} onChange={(v) => set("humanizeJitter", v)} />

      <Group label="caret">
        <Toggle label="enabled" checked={config.caretEnabled} onChange={(v) => set("caretEnabled", v)} />
        <Segmented<CaretChar>
          value={config.caretChar}
          options={["|", "▍", "_"]}
          onChange={(v) => set("caretChar", v)}
        />
      </Group>
      <Slider label="caretBlinkMs" min={200} max={1000} step={20} value={config.caretBlinkMs} onChange={(v) => set("caretBlinkMs", v)} />

      <Slider label="startDelayMs" min={0} max={1500} step={20} value={config.startDelayMs} onChange={(v) => set("startDelayMs", v)} />
      <Slider label="stageGapMs" min={0} max={1200} step={20} value={config.stageGapMs} onChange={(v) => set("stageGapMs", v)} />
      <Slider label="subheadLineStaggerMs" min={0} max={600} step={10} value={config.subheadLineStaggerMs} onChange={(v) => set("subheadLineStaggerMs", v)} />

      <Group label="reveal">
        <Segmented<RevealMode>
          value={config.revealMode}
          options={["fade", "slide-up"]}
          onChange={(v) => set("revealMode", v)}
        />
      </Group>
      <Slider label="revealDistancePx" min={0} max={48} step={1} value={config.revealDistancePx} onChange={(v) => set("revealDistancePx", v)} />
      <Slider label="revealDurationMs" min={120} max={1200} step={20} value={config.revealDurationMs} onChange={(v) => set("revealDurationMs", v)} />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onReplay} style={btn}>▶ Replay</button>
        <button onClick={() => onChange(HERO_MOTION_DEFAULTS)} style={btnGhost}>Reset</button>
      </div>
      <button onClick={copy} style={{ ...btn, width: "100%", marginTop: 8 }}>
        {copied ? "✓ Copied" : "⧉ Copy config"}
      </button>
    </div>
  );
}
