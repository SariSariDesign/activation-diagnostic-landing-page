#!/usr/bin/env node
/**
 * Activation Scorecard deliverable publisher.
 *
 * Commands:
 *   allocate --company "Acme" --type preview|scorecard [legacy default]
 *   publish --source-dir /abs/report --slug acme-preview-abcdef
 *     --company "Acme" --type preview [--update]
 *   verify --slug acme-preview-abcdef --publish-id 0123456789abcdef
 *
 * Standard output is reserved for one JSON result. Progress and errors go to
 * standard error so agents can parse the result without scraping logs.
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_BASE_URL,
  PublishError,
  allocateSlug,
  copyAuditScreenshots,
  parseCli,
  publishArtifact,
  verifyDeployment,
} from "./publish-deliverable-lib.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, "..");
const reportsDir = join(appRoot, "public", "reports");
const baseUrl = process.env.DEPLOY_BASE_URL || DEFAULT_BASE_URL;

function emit(result) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function log(message) {
  process.stderr.write(`[publish-deliverable] ${message}\n`);
}

function timeoutFromEnvironment() {
  const raw = process.env.PUBLISH_VERIFY_TIMEOUT_MS;
  if (!raw) return undefined;
  const timeoutMs = Number(raw);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new PublishError("invalid_arguments", `Invalid PUBLISH_VERIFY_TIMEOUT_MS: ${raw}`);
  }
  return timeoutMs;
}

async function allocate(options) {
  const type = options.type;
  const slug = allocateSlug({
    company: options.company,
    type,
    reportsDir,
    reuseSlug: options.slug,
  });
  const dir = join(reportsDir, slug);
  const screenshotsDir = join(dir, "screenshots");
  mkdirSync(screenshotsDir, { recursive: true });
  const copied = copyAuditScreenshots(options.auditFolder, screenshotsDir);
  const surface = options.surface ?? "website";
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  log(`allocated ${slug} (${type}, ${surface}, ${date}); copied ${copied} screenshot(s)`);
  emit({
    slug,
    dir,
    screenshotsDir,
    url: `${baseUrl.replace(/\/+$/, "")}/${slug}/`,
  });
}

async function publish(options) {
  const result = await publishArtifact({
    appRoot,
    sourceDir: options.sourceDir,
    slug: options.slug,
    company: options.company,
    type: options.type,
    update: options.update === true,
    baseUrl,
    verifyImpl: (verifyOptions) => verifyDeployment({
      ...verifyOptions,
      timeoutMs: timeoutFromEnvironment(),
    }),
    logger: log,
  });
  emit(result);
  if (result.status !== "published") process.exitCode = 1;
}

async function verify(options) {
  const verified = await verifyDeployment({
    slug: options.slug,
    publishId: options.publishId,
    baseUrl,
    timeoutMs: timeoutFromEnvironment(),
  });
  emit({
    status: "published",
    slug: options.slug,
    publishId: options.publishId,
    url: verified.url,
    verifiedAssets: verified.verifiedAssets,
  });
}

async function main() {
  const { command, options } = parseCli(process.argv.slice(2));
  if (command === "allocate") return allocate(options);
  if (command === "publish") return publish(options);
  if (command === "verify") return verify(options);
  throw new PublishError("invalid_arguments", `Unknown command: ${command}`);
}

main().catch((error) => {
  const code = error instanceof PublishError ? error.code : "failed";
  const message = error instanceof Error ? error.message : String(error);
  log(message);
  emit({ status: code, error: message, details: error?.details ?? {} });
  process.exitCode = 1;
});
