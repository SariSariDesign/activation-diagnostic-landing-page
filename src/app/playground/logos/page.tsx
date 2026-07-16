import { Section } from "@/components/Section";
import { LogosWithDials } from "@/components/logos/LogosWithDials";

/**
 * Preview playground for the "trusted by" logo crawl. Renders the marquee on the
 * hero's neutral background with the dev dial kit mounted for tuning (also
 * reachable in prod with `?dials=1`). Once the motion is dialed in, paste the
 * panel's "Copy config" over LOGO_CRAWL_DEFAULTS in
 * src/components/logos/logos.ts and drop <LogoCrawl config={LOGO_CRAWL_DEFAULTS} />
 * under the hero's trust line.
 */
export default function LogosPlaygroundPage() {
  return (
    <main>
      <Section className="bg-neutral-100">
        <div className="flex flex-col gap-4">
          <span className="ds-label text-label-l text-primary-400">
            SOCIAL PROOF
          </span>
          <h2 className="font-brand text-display-s text-neutral-900">
            Trusted by leading teams
          </h2>
          <p className="ds-label text-label-m text-neutral-500">
            Playground — tune the crawl with the dial kit, then bake the config.
          </p>
        </div>

        <div className="mt-16">
          <p className="mb-6 text-body-s text-neutral-500">
            Built by senior designers, and trusted by Fortune 500 companies and
            15+ clients.
          </p>
          <LogosWithDials />
        </div>
      </Section>
    </main>
  );
}
