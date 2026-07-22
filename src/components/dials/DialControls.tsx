"use client";

/**
 * Shared "dial kit" control primitives — the dev-only floating tuning panels
 * (hero motion, testimonials layout) are all built from these. Inline-styled on
 * purpose: dev tooling, never shipped in a normal production load.
 */

/**
 * Horizontal offset from the right edge. Leaves room for the Agentation toolbar
 * (its collapsed circle sits ~44px wide in the bottom-right corner) so the dial
 * kit and Agentation line up as a single toolbar row instead of stacking.
 */
const AGENTATION_CLEARANCE = 72;

export const panelWrap = (open: boolean): React.CSSProperties => ({
  position: "fixed",
  right: AGENTATION_CLEARANCE,
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
});

export const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 6,
};

export const btn: React.CSSProperties = {
  background: "#2b6",
  color: "#06210f",
  border: "none",
  borderRadius: 7,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 700,
  fontFamily: "inherit",
};

export const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "#bbb",
  border: "1px solid #444",
  borderRadius: 7,
  padding: "6px 10px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: "10px 0", borderTop: "1px solid #2a2a2a", paddingTop: 8 }}>
      <div
        style={{
          color: "#888",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function Slider({
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

export function Segmented<T extends string>({
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

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={row}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
