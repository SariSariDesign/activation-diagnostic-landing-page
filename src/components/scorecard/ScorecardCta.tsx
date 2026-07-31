"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { diagnostic } from "@/content/activation-diagnostic";
import { ScorecardModal } from "./ScorecardModal";

/**
 * Secondary, no-cost entry point that sits under the primary "Book an intro call"
 * CTA. Each instance owns its own modal (only one can be open at a time), so it can
 * be dropped anywhere without threading state through the server-rendered page.
 *
 * `tone="onDark"` recolors the ghost label for saturated (blue) backgrounds like
 * the final CTA, where the default `text-primary-400` would be illegible.
 */
export function ScorecardCta({
  size = "medium",
  tone = "default",
}: {
  size?: "large" | "medium";
  tone?: "default" | "onDark";
}) {
  const [open, setOpen] = useState(false);
  const toneCls =
    tone === "onDark" ? "!text-primary-100 hover:!text-neutral-100" : "";
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size={size}
        className={toneCls}
      >
        {diagnostic.scorecard.tryItLabel}
      </Button>
      <ScorecardModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
