import type { ScorecardResult } from "@/lib/scorecard/types";

export type ReportLead = {
  name: string;
  company: string;
  email: string;
  stage: string;
  url: string;
  domain: string;
};

/**
 * Standalone, hosted "Activation Scorecard Preview" report page. A React server
 * component that faithfully reproduces the activation-scorecard-preview skill
 * template, filled from a generated {@link ScorecardResult}.
 *
 * The skill CSS is scoped to a wrapping `.report-root` (instead of `body`) so it
 * does not clobber the app's global stylesheet. React 19 hoists the `<link>` and
 * `<style>` rendered here into `<head>`.
 */

const REPORT_CSS = `
:root {
  /* Warm gray scale */
  --grey-100: #F7F5F0;
  --grey-200: #EDEAE3;
  --grey-300: #D5D2CA;
  --grey-400: #BFBDB8;
  --grey-600: #8A8884;
  --grey-800: #575452;
  --grey-1000: #292826;

  /* Blue scale */
  --blue-100: #EAF1FD;
  --blue-200: #C2D7F7;
  --blue-400: #3A84D4;
  --blue-500: #1F5FA6;
  --blue-600: #174A82;

  /* Red scale */
  --red-100: #FCEEF2;
  --red-200: #F3C8D5;
  --red-500: #AB4E68;

  /* Orange scale */
  --orange-100: #FEF4E6;
  --orange-200: #FDE0B5;
  --orange-500: #FB8B24;

  /* Green scale */
  --green-100: #E8F7EE;
  --green-200: #B0E8C8;
  --green-500: #2E6B45;
}

.report-root {
  font-family: 'Instrument Sans', 'Helvetica Neue', Arial, sans-serif;
  background: var(--grey-100);
  color: var(--grey-1000);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

.report-root * { margin: 0; padding: 0; box-sizing: border-box; }

.container { max-width: 860px; margin: 0 auto; padding: 0 32px; }

/* ── Overline ── */
.ovl {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 2.5px;
  text-transform: uppercase; color: var(--blue-500);
  display: block; margin-bottom: 14px;
}

/* ── Header ── */
.report-header { padding: 64px 0 48px; }

.logo-lockup { margin-bottom: 64px; }

.report-title {
  font-size: 46px; font-weight: 700; line-height: 1.1;
  color: var(--grey-1000); margin-bottom: 10px;
}

.report-caption {
  font-size: 14px; color: var(--grey-600); margin-bottom: 40px;
}
.report-caption a { color: var(--grey-600); text-decoration: none; }

/* ── Why This Matters ── */
.why-block { margin-bottom: 32px; }
.why-block p {
  font-size: 16px; color: var(--grey-1000); line-height: 1.7;
}

.rule { border: none; border-top: 1px solid var(--grey-300); margin: 32px 0; }

/* ── Business Properties Grid ── */
.profile-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px 32px; margin-bottom: 48px;
}
.profile-item { display: flex; gap: 8px; }
.profile-label {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--grey-600);
  min-width: 110px; flex-shrink: 0; padding-top: 1px;
}
.profile-value { color: var(--grey-1000); font-weight: 500; font-size: 13px; }

/* ── Score Hero (Preview Score) ── */
.score-section { margin: 0 0 48px; }
.score-hero {
  background: var(--grey-200); border-radius: 4px;
  padding: 40px; margin: 0;
  display: flex; align-items: center; gap: 40px;
}
.score-meter { flex: 0 0 auto; }
.score-meter svg { display: block; }
.score-copy { flex: 1 1 auto; min-width: 0; }
.score-band-name {
  font-size: 26px; font-weight: 700; color: var(--grey-1000);
  line-height: 1.2; margin-bottom: 12px;
}
.score-framing {
  font-size: 14px; color: var(--grey-800); line-height: 1.75;
  margin-bottom: 16px;
}
.score-scope-note {
  font-size: 13px; color: var(--grey-800); line-height: 1.65;
  margin-bottom: 16px;
}
/* ── Score details reveal — full dimension breakdown ── */
.score-details { margin-top: 16px; }
.score-details > summary { list-style: none; cursor: pointer; outline: none; }
.score-details > summary::-webkit-details-marker { display: none; }
.score-dims { margin-top: 18px; }
.score-dims-intro { font-size: 13px; color: var(--grey-800); line-height: 1.65; margin: 0 0 10px; }
.dim-row {
  display: grid; grid-template-columns: 220px 1fr 34px;
  gap: 8px 16px; align-items: center;
  padding: 14px 0; border-bottom: 1px solid var(--grey-300);
}
.dim-row:last-child { border-bottom: none; }
.dim-name-cell { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dim-name { font-size: 14px; font-weight: 600; color: var(--grey-1000); }
.dim-weight {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
  color: var(--grey-600); background: var(--grey-100);
  border: 1px solid var(--grey-300);
  padding: 1px 8px; border-radius: 100px; white-space: nowrap;
}
.dim-bar-track { background: var(--grey-300); border-radius: 100px; height: 8px; overflow: hidden; }
.dim-bar-fill { background: var(--blue-500); border-radius: 100px; height: 100%; }
.dim-bar-fill.capped { background: var(--red-500); }
.dim-rating {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px; font-weight: 600; color: var(--grey-1000);
  text-align: right; white-space: nowrap;
}
.dim-note { grid-column: 1 / -1; font-size: 13px; color: var(--grey-800); line-height: 1.6; }
.cap-mark {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
  text-transform: uppercase; color: var(--red-500); background: var(--red-100);
  border: 1px solid var(--red-200);
  padding: 1px 8px; border-radius: 100px; white-space: nowrap;
}

/* ── Findings Section ── */
.findings-section { padding: 8px 0 48px; }
.findings-header { margin-bottom: 32px; }
.findings-header h2 {
  font-size: 22px; font-weight: 700; color: var(--grey-1000); margin-bottom: 6px;
}
.findings-header p { font-size: 14px; color: var(--grey-800); }

/* Page group heading — findings are grouped by page in flow order */
.page-head {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--grey-800);
  margin: 32px 0 14px; padding-bottom: 8px;
  border-bottom: 1px solid var(--grey-300);
}
.findings-section > .page-head:first-of-type { margin-top: 4px; }

/* ── Finding Card ── */
.fc {
  background: var(--grey-200);
  border-radius: 4px;
  padding: 32px; margin-bottom: 16px;
}

.fc-meta {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px; flex-wrap: wrap;
}

.fc-num {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px; font-weight: 600; color: var(--grey-100);
  background: var(--blue-500);
  width: 26px; height: 26px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.fdim {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--grey-600);
}

/* Severity badges */
.badge {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 1px;
  text-transform: uppercase; padding: 3px 10px;
  border-radius: 100px;
}
.bc { background: var(--red-100); color: var(--red-500); border: 1px solid var(--red-200); }
.bm { background: var(--orange-100); color: var(--orange-500); border: 1px solid var(--orange-200); }
.bn { background: var(--blue-100); color: var(--blue-500); border: 1px solid var(--blue-200); }

.fc-title {
  font-size: 19px; font-weight: 700; color: var(--blue-400);
  margin-bottom: 14px; line-height: 1.3;
}

.fc-body p {
  font-size: 14px; color: var(--grey-1000); line-height: 1.75;
  margin-bottom: 14px;
}

/* Why This Finding Matters callout */
.fc-why {
  border-left: 3px solid var(--blue-200);
  background: var(--grey-100);
  border-radius: 0 4px 4px 0;
  padding: 14px 16px;
  margin: 4px 0 14px;
}
.fc-why-label {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--blue-500);
  margin-bottom: 6px; display: block;
}
.fc-why p {
  font-size: 13px; color: var(--grey-800); line-height: 1.65; margin: 0;
}

/* Criterion ID chips */
.cids { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 0; }
.cid {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; font-weight: 600;
  color: var(--blue-500); background: var(--blue-100);
  padding: 2px 8px; border-radius: 4px;
}

/* Recommendation subsection */
.fc-rec { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--grey-300); }
.fc-rec-label {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--green-500);
  margin-bottom: 8px; display: block;
}
.fc-rec ul { padding-left: 18px; margin: 0; }
.fc-rec li {
  font-size: 14px; color: var(--grey-1000); line-height: 1.75;
  margin-bottom: 4px;
}
.fc-rec li:last-child { margin-bottom: 0; }

/* Evidence screenshot */
.fc-evidence { margin: 16px 0 4px; }
.fc-evidence img {
  display: block; width: 100%; height: auto;
  border-radius: 4px; border: 1px solid var(--grey-300);
}
.fc-evidence figcaption {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; color: var(--grey-600); margin-top: 6px;
}

/* Effort / Impact tags */
.tags-row { display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
.tag {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; font-weight: 500; padding: 4px 12px;
  border-radius: 100px;
  background: var(--grey-100);
  border: 1px solid var(--grey-300);
  color: var(--grey-600);
}
.te-low  { color: var(--green-500); border-color: var(--green-200); background: var(--green-100); }
.te-med  { color: var(--orange-500); border-color: var(--orange-200); background: var(--orange-100); }
.te-high { color: var(--red-500); border-color: var(--red-200); background: var(--red-100); }
.ti-high { color: var(--red-500); border-color: var(--red-200); background: var(--red-100); }
.ti-med  { color: var(--orange-500); border-color: var(--orange-200); background: var(--orange-100); }
.ti-low  { color: var(--grey-600); border-color: var(--grey-300); background: var(--grey-100); }

/* ── Expandable Finding Card (details/summary) ── */
details.fc > summary { list-style: none; cursor: pointer; outline: none; }
details.fc > summary::-webkit-details-marker { display: none; }
/* Observation lead paragraph — visible while the card is collapsed */
.fc-lead {
  font-size: 14px; color: var(--grey-1000); line-height: 1.75;
  margin: 0 0 14px;
}
/* Reveal toggle — a real button with a caret, shaped unlike the severity
   pills (rounded rectangle, sentence case) so it reads as clickable. Shared
   by the finding cards and the score-details reveal. */
.fc-toggle {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 4px;
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px; font-weight: 600; letter-spacing: 0.2px;
  color: var(--blue-500);
  padding: 8px 14px; border-radius: 6px;
  border: 1px solid var(--blue-200); background: var(--blue-100);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.fc-toggle::before { content: 'See more details'; }
.fc-toggle::after {
  content: '\\25BE'; display: inline-block; font-size: 10px; line-height: 1;
  transition: transform 0.15s ease;
}
summary:hover .fc-toggle { background: var(--blue-200); border-color: var(--blue-400); }
details[open] > summary .fc-toggle::before { content: 'Hide details'; }
details[open] > summary .fc-toggle::after { transform: rotate(180deg); }
.fc-detail {
  margin-top: 18px; padding-top: 18px;
  border-top: 1px solid var(--grey-300);
}

/* ── Shared section heading ── */
.sec-head { margin-bottom: 16px; }
.sec-head h2 { font-size: 22px; font-weight: 700; color: var(--grey-1000); margin-bottom: 6px; }
.sec-head p { font-size: 14px; color: var(--grey-800); }

/* ── Methodology Block ── */
.mb {
  background: var(--grey-200); border-radius: 4px;
  padding: 28px 32px; margin: 0 0 0;
}
.mb-section { margin-bottom: 20px; }
.mb-section:last-child { margin-bottom: 0; }
.mb-section p {
  font-size: 14px; color: var(--grey-800); line-height: 1.75;
}

/* ── AI-builder prompt (preview only) ── */
.aiprompt { margin: 48px 0 0; }
.aiprompt .sec-head { margin-bottom: 16px; }
.aiprompt-warn {
  border-left: 4px solid var(--orange-500);
  background: var(--orange-100);
  border-radius: 0 4px 4px 0;
  padding: 16px 18px; margin: 0 0 16px;
}
.aiprompt-warn-label {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--orange-500);
  display: block; margin-bottom: 6px;
}
.aiprompt-warn p { font-size: 14px; font-weight: 600; color: var(--grey-1000); line-height: 1.6; margin: 0; }
.aiprompt-box {
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px; line-height: 1.7; color: var(--grey-1000);
  background: var(--grey-100); border: 1px solid var(--grey-300);
  border-radius: 4px; padding: 20px 22px;
  white-space: pre-wrap; overflow-wrap: anywhere;
  -webkit-user-select: all; user-select: all;
}
/* Collapse the prompt behind a "See prompt" toggle */
.aiprompt-details > summary { list-style: none; cursor: pointer; outline: none; }
.aiprompt-details > summary::-webkit-details-marker { display: none; }
.aiprompt-details .aiprompt-box { margin-top: 14px; }
.aiprompt-details .fc-toggle::before { content: 'See prompt'; }
details.aiprompt-details[open] > summary .fc-toggle::before { content: 'Hide prompt'; }

/* Score-details toggle reads as "how it's calculated" */
.score-details .fc-toggle::before { content: 'See how it\\2019s calculated'; }
details.score-details[open] > summary .fc-toggle::before { content: 'Hide the calculation'; }

/* ── CTA Block ── */
.fcta {
  background: var(--blue-500);
  border-radius: 0;
  padding: 48px 40px;
  text-align: center;
  margin: 48px -32px 0;
}
.fcta .ovl { color: var(--blue-200); }
.fcta h3 {
  font-size: 22px; font-weight: 700; color: var(--grey-100);
  margin-bottom: 14px; line-height: 1.3;
}
.fcta p {
  font-size: 14px; color: var(--blue-200);
  line-height: 1.75; max-width: 560px;
  margin: 0 auto 28px;
}
.cta-btn {
  display: inline-block;
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--blue-500); background: var(--grey-100);
  border-radius: 4px; padding: 12px 28px;
  text-decoration: none;
}

/* ── Report Footer ── */
.report-footer { padding: 0 0 64px; }

.disclaimer {
  font-size: 12px; color: var(--grey-600); line-height: 1.7;
  text-align: center; padding: 24px 0;
  border-top: 1px solid var(--grey-300);
}

.brand-footer {
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  text-align: center; margin-top: 24px;
  font-size: 12px; color: var(--grey-600);
}
.brand-footer span { color: var(--blue-500); font-weight: 600; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .container { padding: 0 20px; }
  .fcta { margin: 48px -20px 0; padding: 40px 24px; }
  .report-title { font-size: 32px; }
  .profile-grid { grid-template-columns: 1fr; }
  .fc { padding: 24px; }
  .mb { padding: 24px; }
  .score-hero {
    flex-direction: column; align-items: flex-start;
    gap: 24px; padding: 28px 24px;
  }
  .dim-row { grid-template-columns: 1fr 34px; }
  .dim-name-cell { grid-column: 1 / -1; }
}
`;

const SEVERITY_BADGE: Record<
  ScorecardResult["topFindings"][number]["severity"],
  { className: string; label: string }
> = {
  critical: { className: "badge bc", label: "Critical" },
  major: { className: "badge bm", label: "Major" },
  minor: { className: "badge bn", label: "Minor" },
};

const EFFORT_TAG: Record<
  ScorecardResult["topFindings"][number]["effort"],
  { className: string; label: string }
> = {
  low: { className: "tag te-low", label: "Effort: Low" },
  medium: { className: "tag te-med", label: "Effort: Medium" },
  high: { className: "tag te-high", label: "Effort: High" },
};

const IMPACT_TAG: Record<
  ScorecardResult["topFindings"][number]["impact"],
  { className: string; label: string }
> = {
  high: { className: "tag ti-high", label: "Impact: High" },
  medium: { className: "tag ti-med", label: "Impact: Medium" },
  low: { className: "tag ti-low", label: "Impact: Low" },
};

export function ScorecardReport({
  lead,
  result,
}: {
  lead: ReportLead;
  result: ScorecardResult;
}) {
  const now = new Date();
  const auditDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
  const auditMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now);

  const scoreArcDash = ((result.overallScore / 100) * 527.79).toFixed(2);

  const aiPromptChanges = result.aiBuilderChanges
    .map((change, i) => `${i + 1}. ${change}`)
    .join("\n");

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />

      <div className="report-root">
        <div className="container">
          {/* ── HEADER ── */}
          <header className="report-header">
            <div className="logo-lockup">
              <img
                src="/sarisari-logo.svg"
                alt="Sari Sari Design"
                width={148}
                height={33}
              />
            </div>

            <span className="ovl">Activation Scorecard</span>
            <h1 className="report-title">{lead.company}</h1>
            <p className="report-caption">
              <a href={lead.url}>{lead.domain}</a>
              {"  ·  "}
              {auditDate}
            </p>

            <div className="why-block">
              <span className="ovl">Why This Matters</span>
              <p>{result.summary}</p>
            </div>

            <hr className="rule" />
          </header>

          {/* ── SCORE HERO (Preview Score) ── */}
          <section className="score-section">
            <div className="sec-head">
              <span className="ovl">Preview Score</span>
              <h2>How {lead.company} scores today</h2>
              <p>
                A criterion-referenced 0 to 100 score. A preview of the full
                Activation Scorecard.
              </p>
            </div>
            <div className="score-hero">
              <div className="score-meter">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  role="img"
                  aria-label={`Preview Score: ${result.overallScore} out of 100`}
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="84"
                    fill="none"
                    stroke="#D5D2CA"
                    strokeWidth="12"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="84"
                    fill="none"
                    stroke="#1F5FA6"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${scoreArcDash} 527.79`}
                    transform="rotate(-90 100 100)"
                  />
                  <text
                    x="100"
                    y="98"
                    textAnchor="middle"
                    fontFamily="'Space Grotesk', 'Helvetica Neue', Arial, sans-serif"
                    fontSize="52"
                    fontWeight="600"
                    fill="#292826"
                  >
                    {result.overallScore}
                  </text>
                  <text
                    x="100"
                    y="126"
                    textAnchor="middle"
                    fontFamily="'Space Grotesk', 'Helvetica Neue', Arial, sans-serif"
                    fontSize="13"
                    fontWeight="600"
                    letterSpacing="1.5"
                    fill="#8A8884"
                  >
                    OUT OF 100
                  </text>
                </svg>
              </div>
              <div className="score-copy">
                <div className="score-band-name">{result.bandName}</div>
                <p className="score-framing">{result.bandFraming}</p>
                <p className="score-scope-note">
                  Scored from your publicly reachable flow, from landing through
                  signup.
                </p>
              </div>
            </div>

            {/* ── SCORE DETAILS REVEAL — full dimension breakdown ── */}
            <details className="score-details">
              <summary>
                <span className="fc-toggle" />
              </summary>
              <div className="score-dims">
                <p className="score-dims-intro">
                  Every in-scope dimension, rated 0 to 10 against its section of
                  our reference checklist, then weighted. Findings are evidence
                  for the ratings, not point deductions.
                </p>
                {result.dimensions.map((d) => (
                  <div className="dim-row" key={d.dimension}>
                    <div className="dim-name-cell">
                      <span className="dim-name">{d.dimension}</span>
                    </div>
                    <div className="dim-bar-track">
                      <div
                        className="dim-bar-fill"
                        style={{ width: `${d.score}%` }}
                      />
                    </div>
                    <div className="dim-rating">{d.score}</div>
                  </div>
                ))}
              </div>
            </details>
          </section>

          {/* ── FINDINGS ── */}
          <section className="findings-section">
            <div className="findings-header">
              <span className="ovl">Findings</span>
              <h2>Top 5 Findings</h2>
              <p>
                {result.headline} The 5 highest-impact friction points, in the
                order a user hits them, grouped by page across the flow, selected
                from an evaluation across 11 UX dimensions. Select &ldquo;See
                more details&rdquo; on any finding for the evidence and fix.
              </p>
            </div>

            {result.topFindings.map((finding, i) => {
              const badge = SEVERITY_BADGE[finding.severity];
              const effort = EFFORT_TAG[finding.effort];
              const impact = IMPACT_TAG[finding.impact];
              const prevPage = i > 0 ? result.topFindings[i - 1].page : null;
              const showPageHead = finding.page !== prevPage;

              return (
                <div key={i}>
                  {showPageHead && (
                    <h3 className="page-head">{finding.page}</h3>
                  )}
                  <details className="fc">
                    <summary>
                      <div className="fc-meta">
                        <div className="fc-num">{i + 1}</div>
                        <span className={badge.className}>{badge.label}</span>
                      </div>
                      <h3 className="fc-title">{finding.title}</h3>
                      <p className="fc-lead">{finding.description}</p>
                      <div className="fc-why">
                        <span className="fc-why-label">
                          Why This Finding Matters
                        </span>
                        <p>{finding.whyItMatters}</p>
                      </div>
                      <span className="fc-toggle" />
                    </summary>
                    <div className="fc-detail">
                      <div className="fc-rec">
                        <span className="fc-rec-label">Recommendation</span>
                        <ul>
                          <li>{finding.recommendation}</li>
                        </ul>
                      </div>
                      <div className="tags-row">
                        <span className={effort.className}>{effort.label}</span>
                        <span className={impact.className}>{impact.label}</span>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </section>

          {/* ── METHODOLOGY ── */}
          <div className="mb">
            <div className="mb-section">
              <span className="ovl">Methodology</span>
              <p>
                An AI-assisted analyst evaluated 11 UX dimensions against a
                Nielsen Norman Group&ndash;grounded framework, with automated
                accessibility, performance, and SEO checks.
              </p>
            </div>
            <div className="mb-section">
              <span className="ovl">Evaluation Lens</span>
              <p>
                The audit was framed around {lead.company}&rsquo;s activation
                goal: getting a new visitor from first arrival to first value,
                and judging every screen by how well it moves someone toward
                that moment.
              </p>
            </div>
          </div>

          {/* ── AI-BUILDER PROMPT (preview only) ── */}
          <section className="aiprompt">
            <div className="sec-head">
              <span className="ovl">Building with AI?</span>
              <h2>Pass this to your AI builder</h2>
              <p>
                Editing your site with Lovable, v0, Cursor, Claude, or a similar
                AI builder? Paste the prompt below to make a first pass at the
                five fixes above. It works in any of them.
              </p>
            </div>
            <div className="aiprompt-warn">
              <span className="aiprompt-warn-label">Read this first</span>
              <p>
                Read the whole prompt before you paste it, and review every
                change the AI proposes before you publish. AI builders can make
                mistakes and unintended edits. This is a starting point, not a
                hands-off fix.
              </p>
            </div>
            <details className="aiprompt-details">
              <summary>
                <span className="fc-toggle" />
              </summary>
              <div className="aiprompt-box">{`You are helping improve ${lead.company}'s website (${lead.domain}), which is built with an AI website builder. Make only the specific changes listed here.

Changes to make:
${aiPromptChanges}

Rules you must follow:
- Do not change any existing code, styles, or the design system beyond the changes listed above.
- Keep the current brand, fonts, colors, and layout exactly as they are.
- Make only changes that can be undone, and show me a preview or diff of each one before you apply it.
- Do not publish, deploy, or push anything live. I will review and publish it myself.
- If anything is unclear, or a change would touch something not listed above, stop and ask me before doing it.`}</div>
            </details>
          </section>

          {/* ── CTA ── */}
          <div className="fcta">
            <span className="ovl">Ready to go deeper?</span>
            <h3>Get the full 21-Day Activation Diagnostic.</h3>
            <p>
              This preview scored what we can reach from outside. The 21-Day
              Activation Diagnostic scores the core flow of your actual product,
              with test-environment access, a senior-designer walkthrough, and
              your analytics folded in. You also get the screen-by-screen
              Annotated User Journey Map, an end-to-end prototype of the fixed
              flow, and a 90-day product roadmap.
            </p>
            <a
              href="https://activation-diagnostic.sarisari.design"
              className="cta-btn"
            >
              Book an Intro Call
            </a>
          </div>

          {/* ── FOOTER ── */}
          <footer className="report-footer">
            <p className="disclaimer">
              This audit is based on {lead.company}&rsquo;s publicly available
              marketing site. Direct access to the product, supporting flows,
              analytics, and user data would enable a deeper, more comprehensive
              review.
            </p>
            <div className="brand-footer">
              <span>Sari Sari Design</span>
              {"  ·  Activation Scorecard Preview  ·  "}
              {auditMonthYear}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
