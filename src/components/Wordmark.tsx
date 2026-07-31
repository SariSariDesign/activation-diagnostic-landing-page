/**
 * "sari sari" wordmark — text rendering in the brand serif as a stand-in until the
 * SVG vectors are exported from the Figma COVER page (node 8188:2402).
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-brand italic lowercase leading-none tracking-tight ${className}`}>
      sarisari
    </span>
  );
}
