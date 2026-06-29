"use client";

import { useState } from "react";
import {
  HERO_MOTION_DEFAULTS,
  type CaretChar,
  type HeroMotionConfig,
  type RevealMode,
  type TypeMode,
} from "./motion";

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

  const wrap: React.CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 9999,
    width: open ? 280 : "auto",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#111",
    color: "#eee",
    border: "1px solid #333",
    borderRadius: 12,
    padding: open ? 14 : "8px 12px",
    font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
    boxShadow: "0 8px 30px rgba(0,0,0,.4)",
  };

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
        <label style={row}>
          <input type="checkbox" checked={config.caretEnabled} onChange={(e) => set("caretEnabled", e.target.checked)} />
          enabled
        </label>
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

/* ---- tiny control primitives (inline-styled, dev-only) ------------------- */

const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 };
const btn: React.CSSProperties = {
  background: "#2b6",
  color: "#06210f",
  border: "none",
  borderRadius: 7,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "inherit",
};
const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "#bbb",
  border: "1px solid #444",
  borderRadius: 7,
  padding: "6px 10px",
  cursor: "pointer",
  fontFamily: "inherit",
};

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "10px 0", borderTop: "1px solid #2a2a2a", paddingTop: 8 }}>
      <div style={{ color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span style={{ color: "#7d7" }}>{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            background: value === opt ? "#2b6" : "transparent",
            color: value === opt ? "#06210f" : "#ccc",
            border: "1px solid #444",
            borderRadius: 6,
            padding: "5px 4px",
            cursor: "pointer",
            fontWeight: value === opt ? 700 : 400,
            fontFamily: "inherit",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
