type SectionProps = {
  id?: string;
  index?: string;
  className?: string;
  noise?: boolean;
  gridlines?: boolean;
  children: React.ReactNode;
};

/**
 * Full-width section with the DS chrome: optional left index rail ("01"),
 * decorative gridlines, and the grain overlay used on saturated backgrounds.
 */
export function Section({ id, index, className = "", noise, gridlines, children }: SectionProps) {
  return (
    <section id={id} className={`relative overflow-hidden ${noise ? "noise" : ""} ${className}`}>
      {gridlines && (
        <div className="gridlines" aria-hidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
      )}
      <div className="relative mx-auto max-w-[1200px] px-6 py-24 md:py-36 lg:px-4">
        {index && (
          <span className="ds-label mb-10 block text-label-l opacity-60 lg:absolute lg:left-4 lg:top-60 lg:mb-0">
            {index}
          </span>
        )}
        {children}
      </div>
    </section>
  );
}
