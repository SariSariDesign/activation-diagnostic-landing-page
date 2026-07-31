import type { ScorecardResult } from "./types";
import type { ScorecardLead } from "./pipeline";

/**
 * Emails the generated scorecard to the lead via Resend. The email is a
 * self-contained inline-HTML twin of the on-site <Scorecard> component — no
 * datastore or hosted results page required.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Brand tokens (mirror globals.css). Inlined because email clients strip <style>.
const C = {
  bg: "#faf9f7",
  card: "#ffffff",
  border: "#e6e5e4",
  ink: "#1f1d1c",
  body: "#575452",
  muted: "#999693",
  primary: "#1f5fa6",
  primarySoft: "#ebf4ff",
  good: "#1d8f65",
  warn: "#dda73a",
  bad: "#ac4b4b",
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function barColor(score: number) {
  if (score >= 80) return C.good;
  if (score >= 60) return C.warn;
  return C.bad;
}

export function renderScorecardEmailHtml(
  lead: ScorecardLead,
  result: ScorecardResult,
): string {
  const dimensions = result.dimensions
    .map(
      (d) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${C.body};">${esc(d.dimension)}</td>
        <td style="padding:6px 0;width:120px;">
          <div style="background:${C.border};border-radius:9999px;height:6px;width:100%;">
            <div style="background:${barColor(d.score)};height:6px;border-radius:9999px;width:${Math.max(0, Math.min(100, d.score))}%;"></div>
          </div>
        </td>
        <td style="padding:6px 0 6px 10px;font-size:12px;color:${C.ink};text-align:right;width:32px;">${d.score}</td>
      </tr>`,
    )
    .join("");

  const findings = result.topFindings
    .map(
      (f, i) => `
      <div style="border:1px solid ${C.border};border-radius:14px;padding:18px;margin-bottom:12px;background:${C.card};">
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:${C.primary};">${String(i + 1).padStart(2, "0")}</div>
        <div style="font-size:16px;font-weight:600;color:${C.ink};margin:4px 0;">${esc(f.title)}</div>
        <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};">${esc(f.page)} · ${esc(f.severity)} · effort ${esc(f.effort)} · impact ${esc(f.impact)}</div>
        <p style="font-size:13px;color:${C.body};line-height:1.5;margin:10px 0 6px;">${esc(f.description)}</p>
        <p style="font-size:13px;color:${C.ink};line-height:1.5;margin:0;"><strong style="color:${C.primary};">Fix — </strong>${esc(f.recommendation)}</p>
      </div>`,
    )
    .join("");

  const bookingUrl =
    "https://calendly.com/sarisari/sari-sari-activation-sprint-intro-call";

  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.bg};">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.body};">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.primary};">Activation Scorecard</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:${C.ink};margin:8px 0 4px;">Hi ${esc(lead.name.split(" ")[0] || lead.name)}, here's your scorecard</h1>
    <p style="font-size:13px;color:${C.muted};margin:0 0 24px;">For ${esc(lead.url)}</p>

    <div style="display:inline-block;background:${C.primarySoft};border-radius:14px;padding:16px 22px;margin-bottom:20px;">
      <span style="font-family:Georgia,serif;font-size:44px;font-weight:600;color:${C.primary};line-height:1;">${result.overallScore}</span>
      <span style="font-size:13px;color:${C.muted};"> / 100</span>
    </div>

    <h2 style="font-family:Georgia,serif;font-size:20px;color:${C.ink};margin:0 0 6px;">${esc(result.headline)}</h2>
    <p style="font-size:14px;line-height:1.6;color:${C.body};margin:0 0 28px;">${esc(result.summary)}</p>

    <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.ink};margin-bottom:8px;">11 dimensions evaluated</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">${dimensions}</table>

    <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.ink};margin-bottom:12px;">Top 5 points keeping users from converting</div>
    ${findings}

    <div style="text-align:center;margin:32px 0 8px;">
      <a href="${bookingUrl}" style="display:inline-block;background:${C.primary};color:#fff;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border-radius:9999px;">Book an intro call</a>
    </div>
    <p style="font-size:12px;color:${C.muted};text-align:center;line-height:1.5;">This preview shows the top 5. The 21-Day Activation Diagnostic takes one high-stakes flow and fixes it end to end.</p>

    <hr style="border:none;border-top:1px solid ${C.border};margin:28px 0 12px;">
    <p style="font-size:11px;color:${C.muted};text-align:center;">SariSari Design LLC ·
      <a href="https://www.sarisari.design/privacy" style="color:${C.muted};">Privacy</a> ·
      <a href="https://www.sarisari.design/terms" style="color:${C.muted};">Terms</a>
    </p>
  </div>
  </body></html>`;
}

export async function sendScorecardEmail(
  lead: ScorecardLead,
  result: ScorecardResult,
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const from = process.env.RESEND_FROM ?? "Sari Sari Design <scorecard@sarisari.design>";
  const html = renderScorecardEmailHtml(lead, result);

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [lead.email],
      subject: `Your Activation Scorecard — ${result.overallScore}/100`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend send failed: ${res.status} ${detail}`);
  }
}
