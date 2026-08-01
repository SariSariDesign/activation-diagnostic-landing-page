import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/scorecard/store.supabase";
import { ScorecardReport } from "@/components/scorecard/report/ScorecardReport";

/**
 * Hosted Activation Scorecard report. Rendered at request time from the row the
 * pipeline stored under this unguessable slug — no file is written to the tree,
 * no redeploy. Kept out of search indexes (noindex header in next.config.mjs +
 * metadata below).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activation Scorecard",
  robots: { index: false, follow: false },
};

export default async function ScorecardReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getStore().getBySlug(slug);
  if (!row) notFound();

  return (
    <ScorecardReport
      lead={{
        name: row.name,
        company: row.company,
        email: row.email,
        stage: row.stage,
        url: row.url,
        domain: row.domain,
      }}
      result={row.result}
    />
  );
}
