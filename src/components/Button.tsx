import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "light" | "ghost";
  size?: "large" | "medium";
  /** Opens in a new tab with rel="noopener noreferrer" (used for offsite CTAs like Calendly). */
  external?: boolean;
  /** Extra classes (e.g. pill radius on the offer landing page). */
  className?: string;
};

/** DS button: Supply label + arrow-right, per Figma component `type=primary/ghost`. */
export function Button({
  href,
  children,
  variant = "primary",
  size = "large",
  external = false,
  className = "",
}: Props) {
  const base =
    "ds-label inline-flex items-center gap-3 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400";
  const sizing =
    size === "large" ? "px-8 py-4 text-label-l" : "px-6 py-2 text-label-m";
  const skin = {
    primary: "bg-primary-400 text-neutral-100 hover:bg-primary-500 active:bg-primary-600",
    light: "bg-primary-100 text-primary-400 hover:bg-primary-200",
    ghost: "text-primary-400 hover:text-primary-500 px-0",
  }[variant];

  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      className={`${base} ${sizing} ${skin} ${className}`}
      {...externalProps}
    >
      {children}
      <Arrow />
    </Link>
  );
}

function Arrow() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden>
      <path d="M10 1l7 7-7 7M17 8H1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
