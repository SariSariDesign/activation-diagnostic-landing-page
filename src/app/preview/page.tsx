import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Wordmark } from "@/components/Wordmark";
import { ScorecardForm } from "@/components/scorecard/ScorecardForm";
import { diagnostic } from "@/content/activation-diagnostic";

const { page } = diagnostic.scorecard;

// Public, shareable, indexable — do NOT noindex. `/preview` isn't covered by the
// `/s/*`+`/reports/*` noindex headers in next.config.mjs, so it's indexable by
// default. OG/Twitter inherit from the root layout.
export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default function PreviewPage() {
  return (
    <main>
      <Section className="bg-neutral-100">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-10">
          <Link href="/" aria-label="Sari Sari Design — home" className="w-fit">
            <Wordmark className="h-[22px]" />
          </Link>
          <ScorecardForm variant="page" />
        </div>
      </Section>
    </main>
  );
}
