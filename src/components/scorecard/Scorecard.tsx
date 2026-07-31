import type { Finding, ScorecardResult } from "@/lib/scorecard/types";
import { ScoreGauge } from "./ScoreGauge";

/**
 * Data-driven Activation Scorecard. Renders a generated ScorecardResult:
 * overall score, per-dimension bars, and the top-5 friction list. Shared by the
 * on-site preview and (via a plain-HTML twin) the emailed report.
 */
export function Scorecard({ result }: { result: ScorecardResult }) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <ScoreGauge score={result.overallScore} label="Activation score" />
        <div className="flex flex-col gap-2">
          <span className="ds-label text-label-s text-primary-400">
            Activation Scorecard
          </span>
          <h2 className="font-brand text-h2 text-neutral-900">{result.headline}</h2>
          <p className="text-body-m text-neutral-700">{result.summary}</p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h3 className="ds-label text-label-m text-neutral-800">
          11 dimensions evaluated
        </h3>
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {result.dimensions.map((d) => (
            <li key={d.dimension} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-body-s text-neutral-700">{d.dimension}</span>
                <span className="ds-label text-label-s text-neutral-800">
                  {d.score}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-300">
                <div
                  className={`h-full rounded-full ${barColor(d.score)}`}
                  style={{ width: `${Math.max(0, Math.min(100, d.score))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="ds-label text-label-m text-neutral-800">
          Top 5 points keeping users from converting
        </h3>
        <ol className="flex flex-col gap-4">
          {result.topFindings.map((f, i) => (
            <FindingCard key={f.title} finding={f} index={i + 1} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-neutral-300 bg-neutral-100 p-6">
      <div className="flex items-start gap-4">
        <span className="font-brand text-[32px] font-semibold leading-none text-primary-400">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex flex-col gap-1">
          <h4 className="text-title-l font-semibold text-neutral-1000">
            {finding.title}
          </h4>
          <span className="ds-label text-label-s text-neutral-600">{finding.page}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone={severityTone(finding.severity)}>{finding.severity}</Badge>
        <Badge tone="neutral">Effort: {finding.effort}</Badge>
        <Badge tone="neutral">Impact: {finding.impact}</Badge>
      </div>

      <p className="text-body-s text-neutral-700">{finding.description}</p>
      <p className="text-body-s text-neutral-900">
        <span className="ds-label text-label-s text-primary-400">Fix — </span>
        {finding.recommendation}
      </p>
    </li>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "critical" | "major" | "minor" | "neutral";
  children: React.ReactNode;
}) {
  const cls = {
    critical: "bg-red-100 text-red-500",
    major: "bg-yellow-100 text-yellow-500",
    minor: "bg-primary-100 text-primary-400",
    neutral: "bg-neutral-200 text-neutral-700",
  }[tone];
  return (
    <span className={`ds-label rounded-full px-2.5 py-1 text-label-s ${cls}`}>
      {children}
    </span>
  );
}

function severityTone(s: Finding["severity"]) {
  return s;
}

function barColor(score: number) {
  if (score >= 80) return "bg-success-400";
  if (score >= 60) return "bg-yellow-400";
  return "bg-red-400";
}
