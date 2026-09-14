import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

export const EXPECTED_REPOSITORY = "SariSariDesign/activation-diagnostic-landing-page";
export const DEFAULT_BASE_URL = "https://activation-diagnostic.sarisari.design/reports";
export const PUBLISH_MARKER_PATTERN = /<!--\s*publish-id:([a-f0-9]+)\s*-->/gi;
const execFileAsync = promisify(execFile);

export class PublishError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PublishError";
    this.code = code;
    this.details = details;
  }
}

function camelCaseFlag(flag) {
  return flag.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function parseCli(argv) {
  const knownCommands = new Set(["allocate", "publish", "verify"]);
  const command = knownCommands.has(argv[0]) ? argv[0] : "allocate";
  const args = command === argv[0] ? argv.slice(1) : argv;
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) {
      throw new PublishError("invalid_arguments", `Unexpected argument: ${token}`);
    }
    const key = camelCaseFlag(token.slice(2));
    if (key === "update") {
      options.update = true;
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new PublishError("invalid_arguments", `Missing value for ${token}`);
    }
    options[key] = value;
    index += 1;
  }

  return { command, options };
}

export function normalizeRemote(remote) {
  const trimmed = String(remote ?? "").trim().replace(/\.git$/, "");
  const sshMatch = trimmed.match(/(?:github\.com|github-sarisari)[:/]([^/]+\/[^/]+)$/i);
  const httpsMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)$/i);
  return (sshMatch?.[1] ?? httpsMatch?.[1] ?? "").toLowerCase();
}

export function assertExpectedRemote(remote) {
  if (normalizeRemote(remote) !== EXPECTED_REPOSITORY.toLowerCase()) {
    throw new PublishError(
      "wrong_repository",
      `Expected ${EXPECTED_REPOSITORY}; found ${remote || "no origin remote"}`,
      { expected: EXPECTED_REPOSITORY, actual: remote || null },
    );
  }
}

export function validateSlug(slug, type = "preview") {
  const pattern = new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-${type}-[a-f0-9]{6,32}$`);
  if (!pattern.test(slug ?? "")) {
    throw new PublishError(
      "invalid_slug",
      `Slug must match <company>-${type}-<6-32 lowercase hex characters>: ${slug ?? "(missing)"}`,
    );
  }
}

function walkScreenshotFiles(root, current = root) {
  if (!existsSync(current)) return [];
  const files = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolutePath = join(current, entry.name);
    if (entry.isSymbolicLink() || lstatSync(absolutePath).isSymbolicLink()) {
      throw new PublishError("unsafe_source", `Screenshot source contains a symlink: ${absolutePath}`);
    }
    if (entry.isDirectory()) {
      files.push(...walkScreenshotFiles(root, absolutePath));
    } else if (entry.isFile()) {
      if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(entry.name)) {
        throw new PublishError("unsafe_source", `Screenshot directory contains a non-image file: ${absolutePath}`);
      }
      files.push({
        absolutePath,
        relativePath: `screenshots/${relative(root, absolutePath).split(sep).join("/")}`,
      });
    }
  }
  return files;
}

function extractScreenshotPaths(html) {
  const matches = html.matchAll(/(?:src|href)=["']([^"']*screenshots\/[^"']+)["']/gi);
  return [...new Set([...matches].map((match) => match[1]))].sort();
}

export function collectAndValidateArtifact({ sourceDir, slug, type = "preview" }) {
  validateSlug(slug, type);
  const sourceRoot = resolve(sourceDir ?? "");
  if (!sourceDir || !existsSync(sourceRoot)) {
    throw new PublishError("invalid_source", `Source directory does not exist: ${sourceDir ?? "(missing)"}`);
  }
  if (lstatSync(sourceRoot).isSymbolicLink()) {
    throw new PublishError("unsafe_source", `Source directory cannot be a symlink: ${sourceRoot}`);
  }
  const indexPath = join(sourceRoot, "index.html");
  if (!sourceDir || !existsSync(indexPath) || !lstatSync(indexPath).isFile()) {
    throw new PublishError("invalid_source", `Source must contain a regular index.html file: ${sourceDir ?? "(missing)"}`);
  }
  if (lstatSync(indexPath).isSymbolicLink()) {
    throw new PublishError("unsafe_source", `index.html cannot be a symlink: ${indexPath}`);
  }

  const html = readFileSync(indexPath, "utf8");
  const placeholder = html.match(/\[[A-Z][A-Z0-9_]{2,}\]/);
  if (placeholder) {
    throw new PublishError("unresolved_placeholder", `Unresolved template placeholder: ${placeholder[0]}`);
  }

  const assetPaths = extractScreenshotPaths(html);
  const expectedPrefix = `/reports/${slug}/screenshots/`;
  for (const assetPath of assetPaths) {
    if (/^(?:\.\.\/|\.\/|screenshots\/)/.test(assetPath)) {
      throw new PublishError(
        "invalid_asset_path",
        `Screenshot references must use the absolute /reports/<slug>/screenshots/ path: ${assetPath}`,
      );
    }
    if (!assetPath.startsWith(expectedPrefix)) {
      throw new PublishError("invalid_asset_path", `Screenshot references another report slug: ${assetPath}`);
    }
    const encodedRelative = assetPath.slice(expectedPrefix.length).split(/[?#]/, 1)[0];
    let assetRelative;
    try {
      assetRelative = decodeURIComponent(encodedRelative);
    } catch {
      throw new PublishError("invalid_asset_path", `Screenshot path is not valid URL encoding: ${assetPath}`);
    }
    if (!assetRelative || assetRelative.includes("..") || assetRelative.startsWith("/")) {
      throw new PublishError("invalid_asset_path", `Screenshot path attempts to escape its report directory: ${assetPath}`);
    }
    const absoluteAsset = resolve(sourceRoot, "screenshots", assetRelative);
    const screenshotRoot = resolve(sourceRoot, "screenshots") + sep;
    if (!absoluteAsset.startsWith(screenshotRoot) || !existsSync(absoluteAsset) || !lstatSync(absoluteAsset).isFile()) {
      throw new PublishError("missing_asset", `Missing screenshot referenced by index.html: ${assetPath}`);
    }
    if (lstatSync(absoluteAsset).isSymbolicLink()) {
      throw new PublishError("unsafe_source", `Referenced screenshot cannot be a symlink: ${absoluteAsset}`);
    }
  }

  const screenshotsRoot = join(sourceRoot, "screenshots");
  if (existsSync(screenshotsRoot) && lstatSync(screenshotsRoot).isSymbolicLink()) {
    throw new PublishError("unsafe_source", `screenshots directory cannot be a symlink: ${screenshotsRoot}`);
  }
  const screenshotFiles = walkScreenshotFiles(screenshotsRoot);
  return {
    sourceRoot,
    slug,
    type,
    html,
    assetPaths,
    files: [{ absolutePath: indexPath, relativePath: "index.html" }, ...screenshotFiles]
      .sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
  };
}

export function stripPublishMarker(html) {
  return html.replace(PUBLISH_MARKER_PATTERN, "");
}

export function createPublishId(artifact) {
  const hash = createHash("sha256");
  for (const file of artifact.files) {
    hash.update(file.relativePath);
    hash.update("\0");
    if (file.relativePath === "index.html") {
      hash.update(stripPublishMarker(artifact.html));
    } else {
      hash.update(readFileSync(file.absolutePath));
    }
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 20);
}

export function injectPublishMarker(html, publishId) {
  const marker = `<!-- publish-id:${publishId} -->`;
  const clean = stripPublishMarker(html);
  if (clean.includes("</head>")) return clean.replace("</head>", `${marker}\n</head>`);
  return `${marker}\n${clean}`;
}

export function copyArtifact(artifact, destination) {
  mkdirSync(destination, { recursive: true });
  for (const file of artifact.files) {
    const target = join(destination, file.relativePath);
    mkdirSync(dirname(target), { recursive: true });
    if (file.relativePath === "index.html") {
      writeFileSync(target, artifact.markedHtml ?? artifact.html, "utf8");
    } else {
      cpSync(file.absolutePath, target, { dereference: false });
    }
  }
}

function pageUrlFor(baseUrl, slug) {
  return `${baseUrl.replace(/\/+$/, "")}/${slug}/`;
}

export async function verifyDeployment({
  slug,
  publishId,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch,
  timeoutMs = 8 * 60 * 1000,
  sleepImpl = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  nowImpl = Date.now,
}) {
  validateSlug(slug, "preview");
  if (!/^[a-f0-9]{8,64}$/.test(publishId ?? "")) {
    throw new PublishError("invalid_publish_id", `Invalid publish ID: ${publishId ?? "(missing)"}`);
  }
  const url = pageUrlFor(baseUrl, slug);
  const deadline = nowImpl() + timeoutMs;
  let lastProblem = "deployment not checked";
  let delayMs = 5_000;

  do {
    try {
      const response = await fetchImpl(url, { redirect: "follow", cache: "no-store" });
      const body = await response.text();
      const robots = response.headers.get("x-robots-tag") ?? "";
      if (!response.ok) {
        lastProblem = `page returned HTTP ${response.status}`;
      } else if (!body.includes(`publish-id:${publishId}`)) {
        lastProblem = "live page does not contain the requested publish marker";
      } else if (!robots.toLowerCase().includes("noindex")) {
        lastProblem = "live page is missing X-Robots-Tag: noindex";
      } else {
        const assetPaths = extractScreenshotPaths(body)
          .filter((path) => path.startsWith(`/reports/${slug}/screenshots/`));
        const verifiedAssets = [];
        let assetFailure = null;
        for (const assetPath of assetPaths) {
          const assetUrl = new URL(assetPath, url).href;
          const assetResponse = await fetchImpl(assetUrl, { redirect: "follow", cache: "no-store" });
          if (!assetResponse.ok) {
            assetFailure = `${assetPath} returned HTTP ${assetResponse.status}`;
            break;
          }
          verifiedAssets.push(assetUrl);
        }
        if (!assetFailure) return { url, verifiedAssets };
        lastProblem = assetFailure;
      }
    } catch (error) {
      lastProblem = error instanceof Error ? error.message : String(error);
    }

    if (nowImpl() >= deadline) break;
    await sleepImpl(delayMs);
    delayMs = Math.min(delayMs + 5_000, 15_000);
  } while (nowImpl() < deadline);

  throw new PublishError(
    "verification_timeout",
    `Production verification timed out for ${url}: ${lastProblem}`,
    { slug, publishId, url, lastProblem },
  );
}

export function allocateSlug({ company, type, reportsDir, reuseSlug }) {
  if (!company || !type || !["preview", "scorecard"].includes(type)) {
    throw new PublishError("invalid_arguments", "allocate requires --company and --type preview|scorecard");
  }
  const companySlug = company
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let slug = reuseSlug;
  if (!slug) {
    do {
      slug = `${companySlug}-${type}-${randomBytes(3).toString("hex")}`;
    } while (existsSync(join(reportsDir, slug)));
  }
  validateSlug(slug, type);
  return slug;
}

export function copyAuditScreenshots(auditFolder, screenshotsDir) {
  if (!auditFolder) return 0;
  const source = join(auditFolder, "screenshots");
  if (!existsSync(source)) return 0;
  let copied = 0;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink()) continue;
    cpSync(join(source, entry.name), join(screenshotsDir, basename(entry.name)));
    copied += 1;
  }
  return copied;
}

export async function runCommand(command, args, { cwd, env = process.env } = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
  } catch (error) {
    const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
    const stdout = typeof error?.stdout === "string" ? error.stdout.trim() : "";
    throw new PublishError(
      "command_failed",
      `${command} ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`,
      { command, args, cwd, stdout, stderr, exitCode: error?.code ?? null },
    );
  }
}

function isNonFastForward(error) {
  const text = `${error?.message ?? ""}\n${error?.details?.stderr ?? ""}`;
  return /non-fast-forward|fetch first|\[rejected\]/i.test(text);
}

async function removeWorktree(appRoot, worktreePath, run) {
  try {
    await run("git", ["worktree", "remove", "--force", worktreePath], { cwd: appRoot });
  } catch {
    // Best-effort cleanup continues with removal of the temporary directory.
  }
}

async function defaultQualityChecks(worktreePath, run, logger, commands) {
  for (const [command, args] of commands) {
    logger(`quality: ${command} ${args.join(" ")}`);
    await run(command, args, { cwd: worktreePath });
  }
}

export async function publishArtifact({
  appRoot,
  sourceDir,
  slug,
  company,
  type,
  update = false,
  baseUrl = DEFAULT_BASE_URL,
  remoteGuard = assertExpectedRemote,
  qualityCommands = [
    ["npm", ["ci"]],
    ["npm", ["test"]],
    ["npm", ["run", "typecheck"]],
    ["npm", ["run", "build"]],
  ],
  runQualityChecks,
  run = runCommand,
  verifyImpl = verifyDeployment,
  beforePush = async () => {},
  logger = (message) => console.error(`[publish-deliverable] ${message}`),
  maxPushAttempts = 3,
}) {
  if (!appRoot || !company || type !== "preview") {
    throw new PublishError(
      "invalid_arguments",
      "publish requires appRoot, sourceDir, slug, company, and --type preview",
    );
  }
  const resolvedAppRoot = resolve(appRoot);
  const artifact = collectAndValidateArtifact({ sourceDir, slug, type });
  const publishId = createPublishId(artifact);
  artifact.markedHtml = injectPublishMarker(artifact.html, publishId);

  const remoteResult = await run("git", ["remote", "get-url", "origin"], { cwd: resolvedAppRoot });
  remoteGuard(remoteResult.stdout);

  const qualityRunner = runQualityChecks ?? (async (worktreePath) => {
    await defaultQualityChecks(worktreePath, run, logger, qualityCommands);
  });

  let commit = null;
  let attempts = 0;
  for (let attempt = 1; attempt <= maxPushAttempts; attempt += 1) {
    attempts = attempt;
    logger(`fetching origin/main (attempt ${attempt}/${maxPushAttempts})`);
    await run("git", ["fetch", "origin", "main"], { cwd: resolvedAppRoot });

    const tempRoot = await import("node:fs/promises").then(({ mkdtemp }) =>
      mkdtemp(join(tmpdir(), "activation-report-publish-")),
    );
    const worktreePath = join(tempRoot, "worktree");
    let worktreeAdded = false;
    try {
      await run("git", ["worktree", "add", "--detach", worktreePath, "origin/main"], { cwd: resolvedAppRoot });
      worktreeAdded = true;
      const relativeTarget = `public/reports/${slug}`;
      const target = join(worktreePath, relativeTarget);
      if (existsSync(target) && !update) {
        throw new PublishError(
          "slug_exists",
          `${slug} already exists on origin/main; pass --update to replace it explicitly`,
        );
      }
      if (existsSync(target)) rmSync(target, { recursive: true, force: true });
      copyArtifact(artifact, target);

      await qualityRunner(worktreePath);
      await run("git", ["add", "--", relativeTarget], { cwd: worktreePath });
      const staged = await run("git", ["diff", "--cached", "--name-only"], { cwd: worktreePath });
      const stagedFiles = staged.stdout.split("\n").filter(Boolean);
      if (stagedFiles.some((file) => file !== relativeTarget && !file.startsWith(`${relativeTarget}/`))) {
        throw new PublishError(
          "unsafe_staging",
          `Refusing to publish unrelated staged files: ${stagedFiles.join(", ")}`,
        );
      }

      if (stagedFiles.length === 0) {
        commit = (await run("git", ["rev-parse", "origin/main"], { cwd: worktreePath })).stdout;
      } else {
        await run(
          "git",
          ["commit", "-m", `Publish ${company} Activation Scorecard Preview (${slug})`],
          { cwd: worktreePath },
        );
        commit = (await run("git", ["rev-parse", "HEAD"], { cwd: worktreePath })).stdout;
        await beforePush({ attempt, worktreePath, commit });
        try {
          await run("git", ["push", "origin", "HEAD:refs/heads/main"], { cwd: worktreePath });
        } catch (error) {
          if (isNonFastForward(error)) {
            if (attempt < maxPushAttempts) {
              logger("origin/main moved during publication; retrying from the new head");
              continue;
            }
            logger("origin/main moved during the final publication attempt");
            break;
          }
          throw error;
        }
      }

      try {
        const verified = await verifyImpl({ slug, publishId, baseUrl });
        return {
          status: "published",
          slug,
          url: verified.url,
          publishId,
          commit,
          verifiedAssets: verified.verifiedAssets,
          attempts,
        };
      } catch (error) {
        if (error instanceof PublishError && error.code === "verification_timeout") {
          return {
            status: "pushed_pending",
            slug,
            url: pageUrlFor(baseUrl, slug),
            publishId,
            commit,
            attempts,
            recoveryCommand: `npm run publish:deliverable -- verify --slug ${slug} --publish-id ${publishId}`,
            error: error.message,
          };
        }
        throw error;
      }
    } finally {
      if (worktreeAdded) await removeWorktree(resolvedAppRoot, worktreePath, run);
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }

  throw new PublishError(
    "push_race_exhausted",
    `origin/main moved during all ${maxPushAttempts} publish attempts; no report commit was pushed`,
    { slug, publishId },
  );
}
