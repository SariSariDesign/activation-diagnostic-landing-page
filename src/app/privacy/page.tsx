import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy Policy | Sari Sari Design",
  description:
    "How Sari Sari Design LLC collects, uses, and protects your information.",
  robots: { index: false, follow: false },
};

const CONTACT = "zach@sarisari.design";

export default function PrivacyPage() {
  return (
    <main>
      <Section className="bg-neutral-100">
        <div className="flex max-w-[70ch] flex-col gap-6">
          <span className="ds-label text-label-l text-primary-400">Legal</span>
          <h1 className="font-brand text-display-s text-neutral-900">Privacy Policy</h1>
          <p className="ds-label text-label-m text-neutral-500">Last updated: July 30, 2026</p>

          <div className="flex flex-col gap-8 text-body-m text-neutral-700">
            <p>
              This Privacy Policy explains how Sari Sari Design LLC
              (&ldquo;Sari Sari Design,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
              or &ldquo;our&rdquo;) collects, uses, and protects information when
              you visit this website or interact with our services. By using this
              site, you agree to the practices described here.
            </p>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Information We Collect
              </h2>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-neutral-400">
                <li>
                  <strong>Information you provide.</strong> When you complete the
                  scorecard or diagnostic form, book an intro call, or otherwise
                  contact us, we may collect your name, work email, company or
                  website, funding stage, and any details you choose to share.
                </li>
                <li>
                  <strong>Usage and device data.</strong> We automatically collect
                  standard analytics data such as pages viewed, referring links,
                  approximate location, browser type, and device information.
                </li>
                <li>
                  <strong>Cookies and similar technologies.</strong> We use cookies
                  and analytics tools to understand how visitors use the site and to
                  improve it.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                How We Use Your Information
              </h2>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-neutral-400">
                <li>
                  To respond to your inquiries and provide the services or
                  information you request.
                </li>
                <li>
                  To operate, maintain, analyze, and improve the website and our
                  services.
                </li>
                <li>To schedule and conduct intro calls and engagements.</li>
                <li>
                  To send you relevant communications where you have requested them
                  or where permitted by law.
                </li>
                <li>
                  To comply with legal obligations and protect our rights.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Analytics &amp; Third-Party Services
              </h2>
              <p>
                We use third-party services to operate this site and understand its
                usage, including analytics providers (such as Google Analytics and
                Microsoft Clarity) and scheduling tools (such as Calendly). These
                providers may collect information in accordance with their own
                privacy policies. We do not sell your personal information.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">Data Retention</h2>
              <p>
                We retain personal information only for as long as necessary to
                fulfill the purposes described in this policy, to comply with our
                legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Your Choices &amp; Rights
              </h2>
              <p>
                Depending on your location, you may have the right to access,
                correct, or delete the personal information we hold about you, or to
                object to or restrict certain processing. To make a request, contact
                us at the email below. You can also disable cookies through your
                browser settings.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">Data Security</h2>
              <p>
                We use reasonable administrative, technical, and organizational
                measures designed to protect your information. However, no method of
                transmission or storage is completely secure, and we cannot
                guarantee absolute security.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Children&rsquo;s Privacy
              </h2>
              <p>
                This site is not directed to children under 13, and we do not
                knowingly collect personal information from them.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we
                will revise the &ldquo;Last updated&rdquo; date above. Your continued
                use of the site after changes take effect constitutes acceptance of
                the updated policy.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-brand text-title-l text-neutral-900">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data
                practices, contact Sari Sari Design LLC at{" "}
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
              This Privacy Policy is provided for general informational purposes and
              does not constitute legal advice.
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
