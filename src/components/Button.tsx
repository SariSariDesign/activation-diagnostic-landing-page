import Link from "next/link";

type BaseProps = {
  children: React.ReactNode;
  variant?: "primary" | "light" | "ghost";
  size?: "large" | "medium";
  /** Extra classes (e.g. pill radius on the offer landing page). */
  className?: string;
  /** Hide the trailing arrow (e.g. for in-page actions that don't navigate). */
  hideArrow?: boolean;
};

type LinkProps = BaseProps & {
  href: string;
  /** Opens in a new tab with rel="noopener noreferrer" (used for offsite CTAs like Calendly). */
  external?: boolean;
  onClick?: never;
  type?: never;
};

type ButtonProps = BaseProps & {
  /** In-page action (opens a modal, etc.). Renders a native <button> instead of a link. */
  onClick: () => void;
  type?: "button" | "submit";
  href?: never;
  external?: never;
};

type Props = LinkProps | ButtonProps;

function classes(
  variant: NonNullable<BaseProps["variant"]>,
  size: NonNullable<BaseProps["size"]>,
  className: string,
) {
  const base =
    "ds-label inline-flex items-center gap-3 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400";
  const sizing =
    size === "large" ? "px-8 py-4 text-label-l" : "px-6 py-2 text-label-m";
  const skin = {
    primary: "bg-primary-400 text-neutral-100 hover:bg-primary-500 active:bg-primary-600",
    light: "bg-primary-100 text-primary-400 hover:bg-primary-200",
    ghost: "text-primary-400 hover:text-primary-500 px-0",
  }[variant];
  return `${base} ${sizing} ${skin} ${className}`;
}

/** DS button: Supply label + arrow-right, per Figma component `type=primary/ghost`.
 *  Renders a Next `<Link>` for `href`, or a native `<button>` when given `onClick`
 *  (used for in-page actions like opening the scorecard modal). */
export function Button(props: Props) {
  const {
    children,
    variant = "primary",
    size = "large",
    className = "",
    hideArrow = false,
  } = props;
  const cls = classes(variant, size, className);

  if ("onClick" in props && props.onClick) {
    return (
      <button type={props.type ?? "button"} onClick={props.onClick} className={cls}>
        {children}
        {!hideArrow && <Arrow />}
      </button>
    );
  }

  const externalProps = props.external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link href={props.href} className={cls} {...externalProps}>
      {children}
      {!hideArrow && <Arrow />}
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
