"use client";

import { useState } from "react";
import {
  LOGO_CRAWL_DEFAULTS,
  type Direction,
  type LogoCrawlConfig,
} from "./logos";
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
  config: LogoCrawlConfig;
  onChange: (next: LogoCrawlConfig) => void;
};

/**
 * Dev-only floating dial kit for the logo crawl. Tunes LogoCrawlConfig live
 * against the real strip. "Copy config" emits an object you can paste over
 * LOGO_CRAWL_DEFAULTS in logos.ts.
 */
export function LogosPanel({ config, onChange }: PanelProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof LogoCrawlConfig>(
    key: K,
    value: LogoCrawlConfig[K],
  ) => onChange({ ...config, [key]: value });

  const copy = async () => {
    const body = (Object.keys(config) as (keyof LogoCrawlConfig)[])
      .map((k) => {
        const v = config[k];
        return `  ${k}: ${typeof v === "string" ? JSON.stringify(v) : v},`;
      })
      .join("\n");
    const text = `export const LOGO_CRAWL_DEFAULTS: LogoCrawlConfig = {\n${body}\n};`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy logo crawl config:", text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const wrap = panelWrap(open);

  if (!open) {
    return (
      <div style={wrap}>
        <button onClick={() => setOpen(true)} style={btn}>
          ⚙ logo dials
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
        <strong>Logo crawl</strong>
        <button onClick={() => setOpen(false)} style={btnGhost} aria-label="Collapse">
          ✕
        </button>
      </div>

      <Group label="motion">
        <Slider label="speedPxPerSec" min={0} max={160} step={5} value={config.speedPxPerSec} onChange={(v) => set("speedPxPerSec", v)} />
        <Segmented<Direction>
          value={config.direction}
          options={["left", "right"]}
          onChange={(v) => set("direction", v)}
        />
        <Toggle label="pauseOnHover" checked={config.pauseOnHover} onChange={(v) => set("pauseOnHover", v)} />
      </Group>

      <Group label="layout">
        <Slider label="gapPx" min={16} max={140} step={2} value={config.gapPx} onChange={(v) => set("gapPx", v)} />
        <Slider label="fontSizePx" min={12} max={32} step={1} value={config.fontSizePx} onChange={(v) => set("fontSizePx", v)} />
        <Slider label="markGapPx" min={0} max={24} step={1} value={config.markGapPx} onChange={(v) => set("markGapPx", v)} />
        <Slider label="opacity" min={0.3} max={1} step={0.05} value={config.opacity} onChange={(v) => set("opacity", v)} />
      </Group>

      <Group label="edges">
        <Toggle label="fadeEdges" checked={config.fadeEdges} onChange={(v) => set("fadeEdges", v)} />
        <Slider label="fadeWidthPx" min={0} max={160} step={4} value={config.fadeWidthPx} onChange={(v) => set("fadeWidthPx", v)} />
      </Group>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => onChange(LOGO_CRAWL_DEFAULTS)} style={btnGhost}>Reset</button>
      </div>
      <button onClick={copy} style={{ ...btn, width: "100%", marginTop: 8 }}>
        {copied ? "✓ Copied" : "⧉ Copy config"}
      </button>
    </div>
  );
}
