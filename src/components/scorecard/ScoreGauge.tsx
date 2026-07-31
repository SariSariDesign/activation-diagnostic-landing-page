/**
 * Circular score ring used in the scorecard modal. The score shown on the form
 * screen is illustrative (a sample), not the visitor's real result.
 */
export function ScoreGauge({
  score,
  size = 168,
  label = "Sample score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-neutral-300)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-primary-400)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-brand text-[52px] font-semibold leading-none text-primary-400">
            {score}
          </span>
          <span className="ds-label text-label-s text-neutral-600">/ 100</span>
        </div>
      </div>
      <span className="ds-label text-label-s text-neutral-600">{label}</span>
    </div>
  );
}
