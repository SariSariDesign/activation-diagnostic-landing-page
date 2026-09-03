#!/usr/bin/env node
/**
 * publish-deliverable.mjs — allocate a slug + directory for an Activation
 * Diagnostic deliverable (scorecard / preview / re-score) and print the
 * publish contract as one JSON line.
 *
 * This is the shared publish contract consumed by the vault skills
 * `activation-scorecard` and `activation-scorecard-preview`:
 *
 *   node scripts/publish-deliverable.mjs \
 *     --company "Acme Health" \
 *     --type scorecard|preview \
 *     --surface website|platform|app \
 *     --date YYYY-MM-DD \
 *     --audit-folder /abs/path/to/ux-audit-output   (optional)
 *
 * Output (single JSON line on stdout):
 *   { "slug": "...", "dir": "...", "screenshotsDir": "...", "url": "..." }
 *
 * Behaviour:
 *   - slug = <company-slug>-<type>-<6 hex chars>, unguessable and unique
 *     (regenerated on collision). Matches the existing convention under
 *     public/reports/ (e.g. ashley-boyd-marketing-7ad3e6).
 *   - Creates public/reports/<slug>/screenshots/.
 *   - If --audit-folder is given and contains a screenshots/ directory, its
 *     images are copied into the deliverable's screenshots/ dir.
 *   - Idempotent-ish: pass --slug <existing> to reuse a previously allocated
 *     slug (e.g. re-render without re-publishing).
 *
 * The caller then writes the rendered HTML to <dir>/index.html, referencing
 * screenshots by ABSOLUTE path /reports/<slug>/screenshots/<file>, commits,
 * and pushes to main — the GitHub → Vercel integration deploys production.
 * Reports are served at https://activation-diagnostic.sarisari.design/reports/<slug>/
 * (static, noindex via next.config headers; analytics injected at build by
 * scripts/inject-analytics.mjs).
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "..", "public", "reports");
const BASE_URL = "https://activation-diagnostic.sarisari.design/reports";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

const company = arg("company");
const type = arg("type");
const surface = arg("surface") ?? "website";
const date = arg("date") ?? new Date().toISOString().slice(0, 10);
const auditFolder = arg("audit-folder");
const reuseSlug = arg("slug");

if (!company || !type) {
  console.error(
    'Usage: publish-deliverable.mjs --company "Name" --type scorecard|preview [--surface s] [--date YYYY-MM-DD] [--audit-folder /abs/path] [--slug existing-slug]'
  );
  process.exit(1);
}

const companySlug = company
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

let slug = reuseSlug;
if (!slug) {
  do {
    slug = `${companySlug}-${type}-${randomBytes(3).toString("hex")}`;
  } while (existsSync(join(REPORTS_DIR, slug)));
}

const dir = join(REPORTS_DIR, slug);
const screenshotsDir = join(dir, "screenshots");
mkdirSync(screenshotsDir, { recursive: true });

let copied = 0;
if (auditFolder) {
  const src = join(auditFolder, "screenshots");
  if (existsSync(src)) {
    for (const f of readdirSync(src)) {
      cpSync(join(src, f), join(screenshotsDir, f));
      copied++;
    }
  } else {
    console.error(`note: no screenshots/ dir in --audit-folder (${auditFolder}); nothing copied`);
  }
}

console.error(
  `allocated ${slug} (${type}, ${surface}, ${date}); copied ${copied} screenshot(s)`
);
console.log(
  JSON.stringify({ slug, dir, screenshotsDir, url: `${BASE_URL}/${slug}/` })
);
