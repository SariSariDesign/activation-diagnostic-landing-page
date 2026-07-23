import { Accordion } from "@/components/Accordion";
import { Button } from "@/components/Button";
import { HeroGraphic } from "@/components/HeroGraphic";
import { HeroWithDials } from "@/components/hero/HeroWithDials";
import { OfferHeader } from "@/components/OfferHeader";
import { Section } from "@/components/Section";
import { TestimonialsCarousel } from "@/components/testimonials/TestimonialsCarousel";
import { TESTIMONIAL_DEFAULTS } from "@/components/testimonials/testimonial";
import { Wordmark } from "@/components/Wordmark";
import { diagnostic } from "@/content/activation-diagnostic";

const PILL = "rounded-full";

/** The single, repeated booking CTA. One label, one destination, always new-tab. */
function CTA({
  variant = "primary",
  size = "large",
}: {
  variant?: "primary" | "light";
  size?: "large" | "medium";
}) {
  return (
    <Button
      href={diagnostic.bookingUrl}
      variant={variant}
      size={size}
      external
      className={PILL}
    >
      {diagnostic.ctaLabel}
    </Button>
  );
}

export default function ActivationDiagnosticPage() {
  return (
    <>
      <OfferHeader />
      <main>
        <Hero />
        <Problem />
        <WhatThisIs />
        <Goal />
        <HowItWorks />
        <ForAndNotFor />
        <Comparison />
        <PriceAndScope />
        <Faq />
        <Proof />
        <FinalCta />
        <MeetTheTeam />
      </main>
      <OfferFooter />
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Chrome — deliberately stripped to a single destination.
 * No nav links, no footer link columns: a focused offer page has exactly one
 * job (book the call) and no escape routes.
 * ------------------------------------------------------------------------- */

function OfferFooter() {
  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-6 py-12 lg:px-4">
        <Wordmark className="text-[28px] text-neutral-100" />
        <p className="ds-label text-label-m text-neutral-500">
          © Sari Sari LLC — Product design for health & wellness
        </p>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------------------
 * 1 — Hero
 * ------------------------------------------------------------------------- */

function Hero() {
  return (
    <Section gridlines tightTop className="bg-neutral-100">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_500px]">
        <HeroWithDials />
        <HeroGraphic className="hidden justify-self-end lg:block" />
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 2 — The problem
 * ------------------------------------------------------------------------- */

function Problem() {
  const { problem } = diagnostic;
  return (
    <Section index={problem.index} className="bg-neutral-200">
      <div className="grid gap-12 lg:grid-cols-[1fr_576px]">
        <h2 className="lg:max-w-[12ch] font-brand text-display-s text-neutral-900">
          {problem.headline}
        </h2>
        <div className="flex flex-col gap-6">
          {problem.body.map((p) => (
            <p key={p.slice(0, 28)} className="text-body-l text-neutral-700">
              {p}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 3 — What this is + 5 deliverables
 * ------------------------------------------------------------------------- */

/** Descending left-indent per step — literal classes so Tailwind keeps them. */
const STAIR = ["lg:pl-0", "lg:pl-24", "lg:pl-48", "lg:pl-72", "lg:pl-96"];

function WhatThisIs() {
  const { whatThisIs } = diagnostic;
  return (
    <Section index={whatThisIs.index} indexTone="light" noise className="bg-primary-600">
      <div className="flex flex-col gap-5">
        <span className="ds-label text-label-l text-primary-300">
          {whatThisIs.eyebrow}
        </span>
        <h2 className="font-brand text-display-s font-medium text-neutral-100">
          {whatThisIs.headline}
        </h2>
      </div>

      <div className="mt-8 flex max-w-[68ch] flex-col gap-6">
        {whatThisIs.body.map((p) => (
          <p key={p.slice(0, 28)} className="text-body-l text-primary-100">
            {p}
          </p>
        ))}
      </div>

      <div className="mt-16 flex flex-col gap-6">
        {whatThisIs.deliverables.map((d, i) => {
          const climax = i === 4;
          return (
            <div
              key={d.title}
              className={`flex flex-col items-start gap-6 lg:flex-row lg:items-center ${STAIR[i]}`}
            >
              <div
                className={`flex w-full items-center gap-6 p-6 lg:max-w-[700px] ${
                  climax ? "bg-primary-400" : "bg-neutral-100"
                }`}
              >
                <span
                  className={`w-[74px] shrink-0 font-brand text-[52px] font-semibold leading-none ${
                    climax ? "text-primary-200" : "text-primary-400"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`w-px self-stretch shrink-0 ${
                    climax ? "bg-primary-300" : "bg-neutral-400"
                  }`}
                  aria-hidden
                />
                <div className="flex flex-col gap-1.5">
                  <h3
                    className={`text-title-l font-semibold ${
                      climax ? "text-neutral-100" : "text-neutral-1000"
                    }`}
                  >
                    {d.title}
                  </h3>
                  <p
                    className={`text-body-s ${
                      climax ? "text-primary-100" : "text-neutral-700"
                    }`}
                  >
                    {d.body}
                  </p>
                </div>
              </div>

              {i === 0 && (
                <div className="order-first flex max-w-[360px] flex-col gap-2 border-l-2 border-primary-400 pl-5 lg:order-none">
                  <span className="ds-label text-label-s text-primary-300">
                    {whatThisIs.aside.label}
                  </span>
                  <p className="text-body-m text-primary-200">
                    {whatThisIs.aside.body}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 4 — The goal
 * ------------------------------------------------------------------------- */

function Goal() {
  const { goal } = diagnostic;
  return (
    <Section index={goal.index} className="bg-neutral-100">
      <div className="grid gap-12 lg:grid-cols-[1fr_576px]">
        <div className="flex flex-col gap-4">
          <span className="ds-label text-label-l text-primary-400">
            {goal.eyebrow}
          </span>
          <h2 className="lg:max-w-[14ch] font-brand text-display-s text-neutral-900">
            {goal.headline}
          </h2>
        </div>
        <div className="flex flex-col gap-6">
          {goal.body.map((p) => (
            <p key={p.slice(0, 28)} className="text-body-l text-neutral-700">
              {p}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 5 — How it works (3-phase timeline + callout)
 * ------------------------------------------------------------------------- */

function HowItWorks() {
  const { howItWorks } = diagnostic;
  return (
    <Section index={howItWorks.index} className="bg-neutral-200">
      <div className="flex flex-col gap-4">
        <span className="ds-label text-label-l text-primary-400">
          {howItWorks.eyebrow}
        </span>
        <h2 className="lg:max-w-[16ch] font-brand text-display-s text-neutral-900">
          {howItWorks.headline}
        </h2>
      </div>

      <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-300 md:grid-cols-3">
        {howItWorks.phases.map((phase) => (
          <li
            key={phase.tag}
            className="flex flex-col gap-3 bg-neutral-100 p-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="ds-label text-label-m text-primary-400">
                {phase.tag}
              </span>
              <span className="ds-label text-label-s text-neutral-600">
                {phase.week}
              </span>
            </div>
            <p className="text-body-m text-neutral-700">{phase.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 border-l-2 border-primary-400 bg-primary-100 p-6 text-body-m text-neutral-900">
        <strong className="font-medium">{howItWorks.callout}</strong>
      </p>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 6 + 7 — Who this is for / NOT for
 * ------------------------------------------------------------------------- */

function ForAndNotFor() {
  const { forYou, notForYou } = diagnostic;
  return (
    <Section index={forYou.index} className="bg-neutral-100">
      <div className="grid gap-12 md:grid-cols-2">
        <ChecklistColumn
          headline={forYou.headline}
          items={forYou.items}
          tone="for"
        />
        <ChecklistColumn
          headline={notForYou.headline}
          items={notForYou.items}
          tone="not"
        />
      </div>
    </Section>
  );
}

function ChecklistColumn({
  headline,
  items,
  tone,
}: {
  headline: string;
  items: readonly string[];
  tone: "for" | "not";
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-brand text-h2 text-neutral-900">{headline}</h2>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.slice(0, 28)} className="flex items-start gap-3">
            {tone === "for" ? <Check /> : <Cross />}
            <span className="text-body-m text-neutral-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Check() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className="mt-1 shrink-0"
    >
      <circle cx="11" cy="11" r="11" className="fill-success-200" />
      <path
        d="M6 11.5l3.2 3.2L16 8"
        stroke="var(--color-success-500)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cross() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className="mt-1 shrink-0"
    >
      <circle cx="11" cy="11" r="11" className="fill-neutral-300" />
      <path
        d="M7.5 7.5l7 7M14.5 7.5l-7 7"
        stroke="var(--color-neutral-700)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * 8 — Why this over a bigger engagement (comparison table)
 * ------------------------------------------------------------------------- */

function Comparison() {
  const { comparison } = diagnostic;
  return (
    <Section index={comparison.index} className="bg-neutral-200">
      <div className="flex max-w-[760px] flex-col gap-4">
        <span className="ds-label text-label-l text-primary-400">
          {comparison.eyebrow}
        </span>
        <h2 className="font-brand text-display-s text-neutral-900">
          {comparison.headline}
        </h2>
        <p className="text-body-l text-neutral-700">{comparison.intro}</p>
      </div>

      <ComparisonTable
        columns={comparison.columns}
        rows={comparison.rows}
      />

      <p className="mt-10 max-w-[760px] text-body-l text-neutral-700">
        {comparison.outro}
      </p>
    </Section>
  );
}

function ComparisonTable({
  columns,
  rows,
}: {
  columns: readonly [string, string] | readonly string[];
  rows: readonly {
    criterion: string;
    diagnostic: string;
    agency: string;
  }[];
}) {
  const [diagnosticCol, agencyCol] = columns;
  return (
    <table className="mt-12 w-full border-collapse text-left">
      <thead className="hidden md:table-header-group">
        <tr className="border-b border-neutral-400">
          <th scope="col" className="w-1/4 py-4 pr-4" />
          <th
            scope="col"
            className="ds-label w-[37.5%] py-4 pr-4 text-label-m text-primary-400"
          >
            {diagnosticCol}
          </th>
          <th
            scope="col"
            className="ds-label w-[37.5%] py-4 text-label-m text-neutral-600"
          >
            {agencyCol}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.criterion}
            className="block border-b border-neutral-400 py-5 last:border-b-0 md:table-row md:py-0"
          >
            <th
              scope="row"
              className="block pb-3 text-body-m font-bold text-neutral-900 md:table-cell md:py-5 md:pr-4 md:align-top"
            >
              {row.criterion}
            </th>
            <td className="mb-2 block border-l-2 border-primary-400 pl-3 text-body-m text-neutral-900 md:mb-0 md:table-cell md:border-l-0 md:py-5 md:pl-0 md:pr-4 md:align-top">
              <span className="ds-label mb-0.5 block text-label-s text-primary-400 md:hidden">
                {diagnosticCol}
              </span>
              {row.diagnostic}
            </td>
            <td className="block border-l-2 border-neutral-300 pl-3 text-body-m text-neutral-600 md:table-cell md:border-l-0 md:py-5 md:pl-0 md:align-top">
              <span className="ds-label mb-0.5 block text-label-s text-neutral-500 md:hidden">
                {agencyCol}
              </span>
              {row.agency}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ----------------------------------------------------------------------------
 * 9 — Price & scope (include / exclude + CTA)
 * ------------------------------------------------------------------------- */

function PriceAndScope() {
  const { price } = diagnostic;
  return (
    <Section index={price.index} indexTone="light" noise className="bg-primary-400">
      <div className="flex max-w-[760px] flex-col gap-4">
        <span className="ds-label text-label-l text-primary-200">
          {price.eyebrow}
        </span>
        <h2 className="font-brand text-display-m text-neutral-100">
          {price.headline}
        </h2>
        <p className="text-body-l text-primary-100">{price.body}</p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <ScopeColumn
          title="What's included"
          items={price.included}
          tone="included"
        />
        <ScopeColumn
          title="What's not included"
          items={price.excluded}
          tone="excluded"
        />
      </div>

      <div className="mt-12 flex flex-col gap-4">
        <div>
          <CTA variant="light" />
        </div>
        <p className="text-body-s text-primary-200">{price.microcopy}</p>
      </div>
    </Section>
  );
}

function ScopeColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone: "included" | "excluded";
}) {
  return (
    <div className="flex flex-col gap-4 bg-neutral-100 p-6">
      <h3 className="ds-label text-label-l text-neutral-900">{title}</h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.slice(0, 28)} className="flex items-start gap-3">
            {tone === "included" ? <Check /> : <Cross />}
            <span className="text-body-m text-neutral-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 10 — FAQ
 * ------------------------------------------------------------------------- */

function Faq() {
  const { faq } = diagnostic;
  return (
    <Section index={faq.index} className="bg-neutral-100">
      <div className="grid gap-12 lg:grid-cols-[1fr_576px]">
        <div className="flex flex-col gap-4">
          <span className="ds-label text-label-l text-primary-400">
            {faq.eyebrow}
          </span>
          <h2 className="font-brand text-display-s text-neutral-900">
            {faq.headline}
          </h2>
        </div>
        <Accordion items={[...faq.items]} defaultOpen={0} />
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 11 — Proof / trust signals
 * ------------------------------------------------------------------------- */

function Proof() {
  const { proof } = diagnostic;
  return (
    <Section index={proof.index} className="bg-neutral-200">
      <div className="grid gap-12 lg:grid-cols-[1fr_576px]">
        <div className="flex flex-col gap-4">
          <span className="ds-label text-label-l text-primary-400">
            {proof.eyebrow}
          </span>
          <h2 className="font-brand text-display-s text-neutral-900">
            {proof.headline}
          </h2>
        </div>
        <div className="flex flex-col gap-8">
          <p className="text-body-l text-neutral-700 whitespace-pre-line">{proof.body}</p>
        </div>
      </div>
      <div className="mt-16 md:mt-24">
        <TestimonialsCarousel
          testimonials={proof.testimonials}
          config={TESTIMONIAL_DEFAULTS}
        />
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 12 — Meet the team
 * ------------------------------------------------------------------------- */

function MeetTheTeam() {
  const { team } = diagnostic;
  return (
    <Section className="bg-neutral-100">
      <h2 className="font-brand text-display-s text-neutral-900">
        {team.headline}
      </h2>

      <div className="mt-16 flex flex-col items-center gap-12 md:flex-row md:justify-center md:gap-24">
        {team.members.map((member) => (
          <div
            key={member.name}
            className="flex flex-col items-center text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.image}
              alt={`Portrait of ${member.name}`}
              width={280}
              height={280}
              loading="lazy"
              className="h-[220px] w-[220px] rounded-full object-cover md:h-[280px] md:w-[280px]"
            />
            <span className="ds-label mt-6 text-label-m text-primary-400">
              {member.role}
            </span>
            <h3 className="mt-2 font-brand text-h3 text-neutral-900">
              {member.name}
            </h3>
            <p className="mt-1 text-body-m text-neutral-700">
              {member.credential}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <a
          href={team.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ds-label inline-flex items-center gap-2 border-b border-primary-200 pb-1 text-label-m text-primary-500 transition-colors hover:border-primary-400"
        >
          {team.link.label}
          <span aria-hidden>&rarr;</span>
        </a>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * 13 — Final CTA
 * ------------------------------------------------------------------------- */

function FinalCta() {
  const { finalCta } = diagnostic;
  return (
    <Section noise className="bg-primary-400">
      <div className="flex max-w-[800px] flex-col gap-6">
        <h2 className="font-brand text-display-m text-neutral-100">
          {finalCta.headline}
        </h2>
        <p className="text-body-l text-primary-100">{finalCta.body}</p>
        <div className="mt-2">
          <CTA variant="light" />
        </div>
      </div>
    </Section>
  );
}
