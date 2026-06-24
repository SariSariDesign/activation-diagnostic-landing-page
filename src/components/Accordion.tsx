"use client";

import { useState } from "react";

type Item = { label: string; body: string };

type Props = {
  items: Item[];
  /** "light" for neutral sections, "blue" for primary-400 sections */
  tone?: "light" | "blue";
  defaultOpen?: number | null;
};

/** DS accordion (Figma component `status=open/closed`): Supply label pull + body drawer. */
export function Accordion({ items, tone = "light", defaultOpen = null }: Props) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const border = tone === "blue" ? "border-primary-300/50" : "border-neutral-400";
  const label = tone === "blue" ? "text-primary-200" : "text-neutral-800";
  const body = tone === "blue" ? "text-primary-200" : "text-neutral-700";

  return (
    <div className={`w-full border-t ${border}`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.label} className={`border-b ${border}`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`ds-label flex w-full items-center justify-between gap-6 p-6 text-left text-label-l ${label}`}
            >
              {item.label}
              <span aria-hidden className="text-xl leading-none">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <p className={`whitespace-pre-line px-6 pb-6 pt-2 text-body-m ${body}`}>
                {item.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
