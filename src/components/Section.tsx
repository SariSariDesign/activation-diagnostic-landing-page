type SectionProps = {
  id?: string;
  index?: string;
  /** Number color on dark/saturated backgrounds. Defaults to the dark (light-bg) tone. */
  indexTone?: "dark" | "light";
  className?: string;
  noise?: boolean;
  gridlines?: boolean;
  /** Trim the top padding ~25% — used for the hero so it sits closer to the header. */
  tightTop?: boolean;
  children: React.ReactNode;
};

/**
 * Full-width section with the DS chrome: optional left index rail ("01"),
 * decorative gridlines, and the grain overlay used on saturated backgrounds.
 *
 * On large screens the index sits in a left gutter, top-aligned with the
 * section's first line — never overlapping the heading.
 */
export function Section({
  id,
  index,
  indexTone = "dark",
  className = "",
  noise,
  gridlines,
  tightTop,
  children,
}: SectionProps) {
  const indexClass =
    indexTone === "light"
      ? "text-primary-200 opacity-80"
      : "opacity-60";
  return (
    <section id={id} className={`relative overflow-hidden ${noise ? "noise" : ""} ${className}`}>
      {gridlines && (
        <div className="gridlines" aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
      )}
      <div
        className={`relative mx-auto max-w-[1200px] px-6 ${
          tightTop ? "pt-[72px] md:pt-[108px]" : "pt-24 md:pt-36"
        } pb-24 md:pb-36 lg:pl-20 lg:pr-4`}
      >
        {index && (
          <span
            className={`ds-label mb-10 block text-label-l lg:absolute lg:left-4 lg:top-36 lg:mb-0 ${indexClass}`}
          >
            {index}
          </span>
        )}
        {children}
      </div>
    </section>
  );
}
