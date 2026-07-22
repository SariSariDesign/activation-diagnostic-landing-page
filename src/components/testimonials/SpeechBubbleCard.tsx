import type { Testimonial, TestimonialConfig } from "./testimonial";

type Props = {
  testimonial: Testimonial;
  config: TestimonialConfig;
};

/**
 * A single testimonial rendered as a speech bubble (quote) with a downward tail,
 * and — beneath the bubble — the person's circular photo next to their name and
 * "{role}, {company}". Sizing/alignment is driven by TestimonialConfig so the
 * dev dial kit can tune it live.
 */
export function SpeechBubbleCard({ testimonial, config }: Props) {
  const {
    cardMaxWidthPx,
    bubblePaddingPx,
    bubbleRadiusPx,
    bubbleTailSizePx,
    quoteFontSizePx,
    quoteLineHeightPx,
    avatarSizePx,
    attributionGapPx,
    align,
  } = config;

  const isCenter = align === "center";
  const tailW = bubbleTailSizePx;
  const tailH = Math.round(bubbleTailSizePx * 0.72);
  // Tail apex leans slightly toward the avatar (left when left-aligned).
  const apexX = isCenter ? tailW / 2 : tailW * 0.2;

  // Responsive sizing: the dial-kit px values are the desktop maximum; on small
  // screens these shrink via clamp() so the card isn't oversized on mobile.
  const bubblePadding = `clamp(22px, 6vw, ${bubblePaddingPx}px)`;
  const bubbleRadius = `clamp(18px, 4vw, ${bubbleRadiusPx}px)`;
  const quoteFontSize = `clamp(19px, 4.6vw, ${quoteFontSizePx}px)`;
  // Unitless so line-height tracks the clamped font-size instead of staying fixed.
  const quoteLineHeight = quoteLineHeightPx / quoteFontSizePx;
  const avatarSize = `clamp(56px, 14vw, ${avatarSizePx}px)`;

  return (
    <div
      style={{
        maxWidth: cardMaxWidthPx,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: isCenter ? "center" : "flex-start",
        textAlign: isCenter ? "center" : "left",
      }}
    >
      {/* Speech bubble */}
      <div
        style={{
          position: "relative",
          width: "100%",
          background: "#ffffff",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: bubbleRadius,
          padding: bubblePadding,
          boxShadow: "0px 18px 40px -24px rgba(31,29,28,0.28)",
        }}
      >
        {testimonial.quote.split("\n\n").map((para, i, arr) => (
          <p
            key={i}
            className="font-brand text-neutral-900"
            style={{
              margin: 0,
              marginTop: i === 0 ? 0 : `${quoteLineHeight * 0.6}em`,
              fontSize: quoteFontSize,
              lineHeight: quoteLineHeight,
            }}
          >
            {i === 0 ? (
              <span style={{ color: "var(--color-primary-400)" }}>&ldquo;</span>
            ) : null}
            {para}
            {i === arr.length - 1 ? (
              <span style={{ color: "var(--color-primary-400)" }}>&rdquo;</span>
            ) : null}
          </p>
        ))}

        {/* Downward tail: filled triangle + stroked diagonals to match the border */}
        <svg
          width={tailW}
          height={tailH}
          viewBox={`0 0 ${tailW} ${tailH}`}
          fill="none"
          aria-hidden
          style={{
            position: "absolute",
            top: "100%",
            left: isCenter ? "50%" : 40,
            transform: isCenter ? `translateX(-${tailW / 2}px)` : "none",
            // Nudge up 1px so the fill covers the bubble's bottom border seam.
            marginTop: -1,
          }}
        >
          <polygon points={`0,0 ${tailW},0 ${apexX},${tailH}`} fill="#ffffff" />
          <path
            d={`M0 0 L${apexX} ${tailH}`}
            stroke="var(--color-neutral-300)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d={`M${tailW} 0 L${apexX} ${tailH}`}
            stroke="var(--color-neutral-300)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Attribution: photo + name + role, company */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: attributionGapPx,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={testimonial.image}
          alt={`Portrait of ${testimonial.name}`}
          width={avatarSizePx}
          height={avatarSizePx}
          loading="lazy"
          className="rounded-full object-cover"
          style={{
            width: avatarSize,
            height: avatarSize,
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <span className="font-brand text-h3 text-neutral-900">
            {testimonial.name}
          </span>
          <span className="ds-label text-label-m text-primary-400" style={{ marginTop: 4 }}>
            {testimonial.role}, {testimonial.company}
          </span>
        </div>
      </div>
    </div>
  );
}
