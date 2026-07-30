/**
 * "sari sari" brand mark. Renders the logo SVG from /public. The source art is
 * near-black on transparent, so `invert` flips it to white for dark backgrounds
 * (e.g. the footer). Height is set by the caller via `className` (e.g. `h-[22px]`).
 */
export function Wordmark({
  className = "",
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sarisari-logo.svg"
      alt="Sari Sari Design"
      draggable={false}
      className={`w-auto select-none ${invert ? "[filter:invert(1)]" : ""} ${className}`}
    />
  );
}
