import { Section } from "@/components/Section";
import { TestimonialsWithDials } from "@/components/testimonials/TestimonialsWithDials";
import { diagnostic } from "@/content/activation-diagnostic";

/**
 * Preview playground for the testimonials speech-bubble carousel. Renders it inside
 * the real Proof-section chrome so it previews in-context, with the dev dial kit
 * mounted for tuning (also reachable in prod with `?dials=1`). Once the look is
 * dialed in, paste the panel's "Copy config" over TESTIMONIAL_DEFAULTS and swap the
 * placeholder in the Proof section (src/app/page.tsx) for <TestimonialsCarousel />.
 */
export default function TestimonialsPlaygroundPage() {
  const { proof } = diagnostic;

  return (
    <main>
      <Section index={proof.index} className="bg-neutral-200">
        <div className="flex flex-col gap-4">
          <span className="ds-label text-label-l text-primary-400">
            {proof.eyebrow}
          </span>
          <h2 className="font-brand text-display-s text-neutral-900">
            {proof.headline}
          </h2>
          <p className="ds-label text-label-m text-neutral-500">
            Playground — tune with the dial kit, then bake the config.
          </p>
        </div>

        <div className="mt-16">
          <TestimonialsWithDials testimonials={proof.testimonials} />
        </div>
      </Section>
    </main>
  );
}
