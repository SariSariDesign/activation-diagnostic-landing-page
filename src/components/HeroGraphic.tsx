/* ----------------------------------------------------------------------------
 * HeroGraphic — "Audit C": a realistic wellness-app onboarding screen on a
 * phone, marked up with audit annotations (drop-off, vague field, no reason to
 * act) and a magnifier over the highlighted choice. Purely decorative; hidden
 * on small screens (see usage in the Hero).
 *
 * Geometry is pixel-exact to the Paper comp, so the phone internals use inline
 * styles with exact px. Tokenised colours come through CSS variables; the
 * wellness mock keeps its own sage palette as literals so it reads as a
 * separate product from the landing page brand.
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

function GoalCard({ goal }: { goal: Goal }) {
  const { title, sub, icon, selected } = goal;
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 15,
        background: selected ? SAGE : "#ffffff",
        border: selected ? "none" : `1px solid ${CARD_BORDER}`,
        boxShadow: selected ? "0px 6px 8px rgba(124,144,130,0.25)" : "none",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: 9,
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
            fontSize: 10,
            lineHeight: "15px",
            fontWeight: 600,
            color: selected ? "#ffffff" : "var(--color-neutral-900)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 9,
            lineHeight: "12px",
            color: selected ? "rgba(255,255,255,0.7)" : MUTED,
          }}
        >
          {sub}
        </span>
      </div>
      {selected && (
        <div
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            borderRadius: 8,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.7 6.7 0 0 0 9.7 9.7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M18 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    title: "Build Energy",
    sub: "Less burnout, more vitality",
    selected: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
  {
    title: "Physical Health",
    sub: "Strength and resilience",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 12h4l2.5-6 4 13 2.5-7H22"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/** White annotation chip with a numbered blue badge. */
function Chip({
  n,
  label,
  style,
}: {
  n: number;
  label: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 9,
        paddingBlock: 7,
        paddingLeft: 7,
        paddingRight: 12,
        borderRadius: 9,
        background: "#ffffff",
        border: `1px solid var(--color-neutral-300)`,
        boxShadow: "0px 8px 18px -8px rgba(31,29,28,0.12)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: 9999,
          background: "var(--color-primary-400)",
          color: "#ffffff",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </span>
      <span
        className="ds-label"
        style={{ fontSize: 11, letterSpacing: "0.04em", color: "var(--color-neutral-800)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function HeroGraphic({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{ position: "relative", width: 500, height: 620 }}
    >
      {/* Device shell */}
      <div
        style={{
          position: "absolute",
          left: 32,
          top: 6,
          width: 264,
          padding: 10,
          borderRadius: 26,
          background: "rgba(31,95,166,0.25)",
          border: "1px solid var(--color-primary-200)",
          boxShadow: "0px 8px 16px rgba(41,39,38,0.16)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: 244,
            borderRadius: 18,
            overflow: "hidden",
            background: "var(--color-neutral-100)",
            display: "flex",
            flexDirection: "column",
            color: "var(--color-neutral-900)",
          }}
        >
          {/* Status bar */}
          <div
            style={{
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 15px",
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600 }}>9:41</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="13" height="9" viewBox="0 0 18 12" fill="none">
                <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
                <rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor" />
                <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="currentColor" />
                <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
              </svg>
              <svg width="12" height="9" viewBox="0 0 16 12" fill="none">
                <path
                  d="M2 5.2a8.5 8.5 0 0 1 12 0M4.6 7.6a4.8 4.8 0 0 1 6.8 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="10.4" r="1" fill="currentColor" />
              </svg>
              <svg width="18" height="9" viewBox="0 0 24 12" fill="none">
                <rect x="0.6" y="0.6" width="20" height="10.8" rx="2.5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
                <rect x="2" y="2" width="16" height="8" rx="1.4" fill="currentColor" />
                <rect x="22" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" fillOpacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Top bar */}
          <div
            style={{
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px 0 10px",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                borderRadius: 12,
                background: "#ffffff",
                border: `1px solid ${CARD_BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 100, height: 3, borderRadius: 2, background: CARD_BORDER, overflow: "hidden", display: "flex" }}>
                <div style={{ width: 40, height: 3, background: SAGE }} />
              </div>
              <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>
                Step 2 of 5
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 7px", flexShrink: 0 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>
                Skip
              </span>
            </div>
          </div>

          {/* Main body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "22px 15px 0 15px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span
                style={{
                  fontFamily: "var(--font-brand)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 21,
                  lineHeight: "24px",
                }}
              >
                What is your primary focus?
              </span>
              <span style={{ fontSize: 10, lineHeight: "15px", color: MUTED }}>
                Select one goal to help us personalize your daily wellness journey.
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GOALS.map((goal) => (
                <GoalCard key={goal.title} goal={goal} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "15px 15px 22px 15px" }}>
            <div
              style={{
                width: "100%",
                height: 40,
                borderRadius: 20,
                background: "var(--color-neutral-900)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0px 8px 10px rgba(0,0,0,0.08)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#ffffff" }}>Continue</span>
            </div>
            <div style={{ width: "100%", height: 14, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingTop: 9 }}>
              <div style={{ width: 83, height: 3, borderRadius: 100, background: "var(--color-neutral-900)", opacity: 0.2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Leader lines */}
      <svg
        width="480"
        height="620"
        viewBox="0 0 480 620"
        fill="none"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <g>
          <path d="M286 58 L320 58" stroke="var(--color-primary-300)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4" />
          <path d="M286 348 L322 348" stroke="var(--color-primary-300)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4" />
          <path d="M286 540 L322 540" stroke="var(--color-primary-300)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4" />
        </g>
        <circle cx="286" cy="348" r="3.5" fill="var(--color-primary-400)" />
        <circle cx="286" cy="540" r="3.5" fill="var(--color-primary-400)" />
        <circle cx="286" cy="58" r="3.5" fill={AUDIT_RED} />
      </svg>

      {/* Drop-off flag */}
      <div
        style={{
          position: "absolute",
          left: 322,
          top: 43,
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBlock: 7,
          paddingLeft: 9,
          paddingRight: 12,
          borderRadius: 9,
          background: "#ffffff",
          border: "1px solid #e7c4bf",
          boxShadow: "0px 8px 18px -8px rgba(31,29,28,0.12)",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 9999, background: AUDIT_RED, flexShrink: 0 }} />
        <span className="ds-label" style={{ fontSize: 11, letterSpacing: "0.04em", color: AUDIT_RED }}>
          Drop-off 38%
        </span>
      </div>

      <Chip n={1} label="Vague field" style={{ left: 330, top: 331 }} />
      <Chip n={2} label="No reason to act" style={{ left: 330, top: 523 }} />

      {/* Magnifier over the highlighted choice */}
      <div style={{ position: "absolute", left: 17, top: 253, width: 86, height: 86 }}>
        <svg width="86" height="86" viewBox="0 0 86 86" fill="none">
          <line x1="34" y1="52" x2="14" y2="72" stroke="var(--color-primary-500)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="36" r="26" fill="#ebf4ffb3" stroke="var(--color-primary-500)" strokeWidth="4" />
          <circle cx="50" cy="36" r="26" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
