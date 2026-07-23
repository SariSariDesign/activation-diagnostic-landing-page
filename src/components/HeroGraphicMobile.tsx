/* ----------------------------------------------------------------------------
 * HeroGraphicMobile — the mobile-only visual anchor for the hero. A compact
 * (~75% of desktop) wellness-app onboarding phone, marked up with two audit
 * notes ("Conflicting CTAs" and "No default choice") and faded at the bottom so
 * it dissolves into the next section. Purely decorative; shown only < lg (see
 * usage in AnimatedHero). Desktop uses the larger HeroGraphic instead.
 * ------------------------------------------------------------------------- */

const SAGE = "#7c9082";
const ICON_TILE = "#ebf0ed";
const CARD_BORDER = "#e2e1df";
const MUTED = "#5c5a58";
const AUDIT_RED = "#c8453b";

type Goal = {
  title: string;
  sub: string;
  icon: React.ReactNode;
  selected?: boolean;
};

function GoalRow({ goal }: { goal: Goal }) {
  const { title, sub, icon, selected } = goal;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 9,
        borderRadius: 11,
        background: selected ? SAGE : "#ffffff",
        border: selected ? "none" : `1px solid ${CARD_BORDER}`,
        boxShadow: selected ? "0px 4px 6px rgba(124,144,130,0.25)" : "none",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: 7,
          background: selected ? "rgba(255,255,255,0.15)" : ICON_TILE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? "#ffffff" : "var(--color-neutral-900)",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 600,
            color: selected ? "#ffffff" : "var(--color-neutral-900)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 7,
            color: selected ? "rgba(255,255,255,0.7)" : MUTED,
          }}
        >
          {sub}
        </span>
      </div>
      {selected && (
        <div
          style={{
            width: 12,
            height: 12,
            flexShrink: 0,
            borderRadius: 6,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="7" height="7" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7.2 5.6 10.3 11.5 4"
              stroke={SAGE}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

const GOALS: Goal[] = [
  {
    title: "Better Sleep",
    sub: "Waking up refreshed",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.7 6.7 0 0 0 9.7 9.7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Build Energy",
    sub: "Less burnout, more vitality",
    selected: true,
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Reduce Stress",
    sub: "Calm for the mind & body",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M11 20A7 7 0 0 1 11 6c4 0 8-2 9-3 .5 4 .5 13-9 17Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M4 21c1.5-5 5-8.5 9-10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Improve Focus",
    sub: "Sharp and sustained attention",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

/** Audit note card: a small coloured label, a bold finding, and a one-line why. */
function Note({
  tone,
  metric,
  finding,
  detail,
  style,
}: {
  tone: "red" | "blue";
  metric: string;
  finding: string;
  detail: string;
  style: React.CSSProperties;
}) {
  const accent = tone === "red" ? AUDIT_RED : "var(--color-primary-400)";
  const border = tone === "red" ? "#e7c4bf" : "var(--color-primary-200)";
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "8px 10px",
        borderRadius: 9,
        background: "#ffffff",
        border: `1px solid ${border}`,
        boxShadow: "0px 8px 18px -8px rgba(31,29,28,0.2)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: accent, flexShrink: 0 }} />
        <span
          className="ds-label"
          style={{ fontSize: 8, letterSpacing: "0.02em", color: accent }}
        >
          {metric}
        </span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, lineHeight: "13px", color: "var(--color-neutral-900)" }}>
        {finding}
      </span>
      <span style={{ fontSize: 8, lineHeight: "11px", color: MUTED }}>{detail}</span>
    </div>
  );
}

export function HeroGraphicMobile({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{ position: "relative", width: "100%", maxWidth: 360, height: 340, margin: "0 auto" }}
    >
      {/* Device — centred, faded at the bottom so it bleeds into the next section. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 10,
          transform: "translateX(-50%)",
          width: 198,
          padding: 8,
          borderRadius: 20,
          background: "rgba(31,95,166,0.25)",
          border: "1px solid var(--color-primary-200)",
          boxShadow: "0px 6px 12px rgba(41,39,38,0.16)",
          display: "flex",
          flexDirection: "column",
          WebkitMaskImage: "linear-gradient(to bottom, #000 66%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 66%, transparent 100%)",
        }}
      >
        <div
          style={{
            width: 182,
            borderRadius: 14,
            overflow: "hidden",
            background: "var(--color-neutral-100)",
            display: "flex",
            flexDirection: "column",
            color: "var(--color-neutral-900)",
          }}
        >
          {/* Status bar */}
          <div style={{ height: 21, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 11px" }}>
            <span style={{ fontSize: 8, fontWeight: 600 }}>9:41</span>
            <svg width="34" height="8" viewBox="0 0 44 10" fill="none">
              <rect x="0" y="6" width="2.5" height="3.5" rx="1" fill="currentColor" />
              <rect x="4" y="4" width="2.5" height="5.5" rx="1" fill="currentColor" />
              <rect x="8" y="2" width="2.5" height="7.5" rx="1" fill="currentColor" />
              <rect x="12" y="0.5" width="2.5" height="9" rx="1" fill="currentColor" />
              <rect x="30" y="0.5" width="12" height="8" rx="2" stroke="currentColor" strokeOpacity="0.4" />
              <rect x="31.5" y="2" width="8" height="5" rx="1" fill="currentColor" />
            </svg>
          </div>

          {/* Top bar: back / progress / skip */}
          <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 0" }}>
            <div style={{ width: 17, height: 17, borderRadius: 9, background: "#fff", border: `1px solid ${CARD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="9" height="9" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: 75, height: 2, borderRadius: 2, background: CARD_BORDER, overflow: "hidden", display: "flex" }}>
                <div style={{ width: 30, height: 2, background: SAGE }} />
              </div>
              <span style={{ fontSize: 5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Step 2 of 5</span>
            </div>
            <span style={{ fontSize: 6, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Skip</span>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "14px 11px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-brand)", fontStyle: "italic", fontWeight: 500, fontSize: 16, lineHeight: "18px" }}>
                What is your primary focus?
              </span>
              <span style={{ fontSize: 7.5, lineHeight: "11px", color: MUTED }}>
                Select one goal to help us personalize your daily wellness journey.
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 16 }}>
              {GOALS.map((goal) => (
                <GoalRow key={goal.title} goal={goal} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leader lines — dashed connectors from each note to the point it flags. */}
      <svg width="20" height="26" viewBox="0 0 20 26" fill="none" style={{ position: "absolute", right: 84, top: 52 }}>
        <path d="M10 10 L10 24" stroke={AUDIT_RED} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2 3" />
        <circle cx="10" cy="4" r="3" fill={AUDIT_RED} />
      </svg>
      <svg width="42" height="16" viewBox="0 0 42 16" fill="none" style={{ position: "absolute", left: 108, top: 172 }}>
        <path d="M2 8 L34 8" stroke="var(--color-primary-400)" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2 3" />
        <circle cx="38" cy="8" r="3" fill="var(--color-primary-400)" />
      </svg>

      <Note
        tone="red"
        metric="38% DROP-OFF"
        finding="Conflicting CTAs"
        detail={'"Skip" undercuts "Continue"'}
        style={{ top: 78, right: 0, width: 98, transform: "rotate(-3deg)" }}
      />
      <Note
        tone="blue"
        metric="HESITATION"
        finding="No default choice"
        detail="5 goals, none recommended"
        style={{ top: 150, left: 0, width: 104, transform: "rotate(2.5deg)" }}
      />
    </div>
  );
}
