import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Terms of Service | Sari Sari Design",
  description:
    "The terms that govern your use of the Sari Sari Design website and services.",
  robots: { index: false, follow: false },
};

const CONTACT = "zach@sarisari.design";

export default function TermsPage() {
  return (
    <main>
      <Section className="bg-neutral-100">
        <div className="flex max-w-[70ch] flex-col gap-6">
          <span className="ds-label text-label-l text-primary-400">Legal</span>
          <h1 className="font-brand text-display-s text-neutral-900">Terms of Service</h1>
          <p className="ds-label text-label-m text-neutral-500">Last updated: July 30, 2026</p>

          <div className="flex flex-col gap-8 text-body-m text-neutral-700">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
              use of the Sari Sari Design website and the tools, content, and
              services offered through it (collectively, the &ldquo;Services&rdquo;),
              provided by Sari Sari Design LLC (&ldquo;Sari Sari Design,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using the
              Services, you agree to these Terms.
            </p>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Use of the Services
              </h2>
              <p>
                You may use the Services only for lawful purposes and in accordance
                with these Terms. When you submit a website or other information for
                evaluation, you confirm that you are authorized to do so. You agree
                not to misuse the Services or interfere with their normal operation.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                No Guarantee of Results
              </h2>
              <p>
                The website, the free scorecard and diagnostic previews, and any
                related content, assessments, or advice are provided on an
                &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis for general
                informational purposes only. They are automated or best-effort
                assessments and do not constitute professional, legal, or financial
                advice.
              </p>
              <p>
                Results vary based on factors outside our control. We do not
                guarantee any specific business, revenue, conversion, user
                activation, growth, or other outcome from the Services or from
                acting on any information we provide. Nothing on this website should
                be interpreted as a promise or guarantee of results.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Paid Engagements
              </h2>
              <p>
                Using the free tools on this site does not, on its own, create a
                client relationship. Any paid engagement (such as the Activation
                Diagnostic) is governed by a separate written services agreement or
                statement of work between you and Sari Sari Design LLC. That
                agreement controls the scope, deliverables, timelines, fees, and any
                performance terms of the engagement, and it prevails over these Terms
                in the event of a conflict.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Intellectual Property
              </h2>
              <p>
                The Services, including all text, design, graphics, and other
                content, are owned by or licensed to Sari Sari Design LLC and are
                protected by applicable intellectual property laws. You may not copy,
                reproduce, or distribute our content without our prior written
                permission.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Disclaimer of Warranties
              </h2>
              <p>
                To the fullest extent permitted by law, the Services are provided
                without warranties of any kind, whether express or implied,
                including any implied warranties of merchantability, fitness for a
                particular purpose, and non-infringement. We do not warrant that the
                Services will be uninterrupted, error-free, or secure.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, Sari Sari Design LLC and its
                owners, employees, and contractors will not be liable for any
                indirect, incidental, special, consequential, or punitive damages,
                or any loss of profits or revenue, arising out of or relating to your
                use of the Services, even if advised of the possibility of such
                damages.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of California,
                USA, without regard to its conflict-of-laws principles. You agree
                that any dispute arising from these Terms or the Services will be
                subject to the exclusive jurisdiction of the state and federal courts
                located in California.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time. When we do, we will
                revise the &ldquo;Last updated&rdquo; date above. Your continued use
                of the Services after changes take effect constitutes acceptance of
                the updated Terms.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">Contact Us</h2>
              <p>
                If you have questions about these Terms, contact Sari Sari Design LLC
                at{" "}
                <a
                  href={`mailto:${CONTACT}`}
                  className="text-primary-500 underline underline-offset-2"
                >
                  {CONTACT}
                </a>
                .
              </p>
            </div>

            <p className="text-body-s text-neutral-500">
              These Terms are provided for general informational purposes and do not
              constitute legal advice.
            </p>
          </div>

          <Link
            href="/"
            className="ds-label mt-4 inline-flex items-center gap-2 text-label-m text-primary-500 underline-offset-4 hover:underline"
          >
            <span aria-hidden>&larr;</span> Back to home
          </Link>
        </div>
      </Section>
    </main>
  );
}
