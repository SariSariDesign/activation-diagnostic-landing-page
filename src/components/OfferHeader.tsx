"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { diagnostic } from "@/content/activation-diagnostic";

/**
 * Sticky offer header. On desktop the booking CTA is always present. On mobile
 * it's withheld at the top of the fold — where the hero already carries an
 * inline CTA — and slides in only once the user has scrolled past the first
 * screen, so the top of the fold stays clean and text-forward.
 */
export function OfferHeader() {
  const [scrolledPastFold, setScrolledPastFold] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolledPastFold(window.scrollY > window.innerHeight * 0.7);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: "#faf8f880" }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3 lg:px-4">
        {/* Non-clickable brand mark — keeps the page to one destination. */}
        <Wordmark className="h-[22px]" />
        <div
          className={`transition-opacity duration-200 lg:!opacity-100 ${
            scrolledPastFold ? "opacity-100" : "pointer-events-none opacity-0 lg:pointer-events-auto"
          }`}
        >
          <Button
            href={diagnostic.bookingUrl}
            variant="primary"
            size="medium"
            external
            className="rounded-full"
          >
            {diagnostic.ctaLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
