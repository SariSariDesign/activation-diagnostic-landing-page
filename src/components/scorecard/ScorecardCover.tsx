import { Wordmark } from "@/components/Wordmark";
import { diagnostic } from "@/content/activation-diagnostic";

const { cover } = diagnostic.scorecard;

/**
 * The packaged "report cover" for the free Activation Scorecard — a flat,
 * book-cover-style object shown beside the lead form (modal + /preview). All
 * colors come from the design system: near-black (neutral-1000) panel with a
 * primary-blue spine, brand serif title, mono subhead.
 */
export function ScorecardCover() {
  return (
    <div
      className="relative flex aspect-[3/4] w-[clamp(200px,72%,280px)] flex-col justify-between overflow-hidden rounded-l-[5px] rounded-r-[10px] bg-neutral-1000 p-7 shadow-[-14px_18px_36px_rgba(20,24,40,0.28)] sm:p-8"
      aria-hidden
    >
      {/* Spine + its inner shadow */}
      <span className="absolute inset-y-0 left-0 w-3.5 bg-primary-300" />
      <span
        className="absolute inset-y-0 left-3.5 w-2.5"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.30), transparent)" }}
      />

      <Wordmark invert className="h-[15px] opacity-90" />

      <div>
        <h3 className="font-brand text-[clamp(26px,3vw,32px)] font-bold leading-[1.03] text-neutral-100">
          {cover.title.split(" ").map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </h3>
        <span className="mt-3 block h-[3px] w-9 rounded bg-primary-300" />
        <p className="ds-label mt-3 text-[9px] leading-[1.55] tracking-[0.12em] text-neutral-100 opacity-70">
          {cover.subhead}
        </p>
      </div>
    </div>
  );
}
