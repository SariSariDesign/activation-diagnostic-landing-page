// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  EXPECTED_REPOSITORY,
  PublishError,
  assertExpectedRemote,
  collectAndValidateArtifact,
  createPublishId,
  injectPublishMarker,
  parseCli,
  publishArtifact,
  runCommand,
  verifyDeployment,
} from "../../scripts/publish-deliverable-lib.mjs";

const roots = [];

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "publish-deliverable-test-"));
  roots.push(dir);
  return dir;
}

function writePreview(root, slug, htmlOverrides = "") {
  mkdirSync(join(root, "screenshots"), { recursive: true });
  writeFileSync(join(root, "screenshots", "one.webp"), "image-one");
  writeFileSync(join(root, "index.html"), `<!doctype html>
<html><head><title>Example Preview</title></head><body>
<img src="/reports/${slug}/screenshots/one.webp">
${htmlOverrides}
</body></html>`);
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function createGitFixture({ existingSlug } = {}) {
  const root = tempDir();
  const remote = join(root, "remote.git");
  const appRoot = join(root, "app");
  mkdirSync(appRoot);
  git(root, "init", "--bare", remote);
  git(appRoot, "init");
  git(appRoot, "config", "user.name", "Publisher Test");
  git(appRoot, "config", "user.email", "publisher@example.test");
  writeFileSync(join(appRoot, "package.json"), '{"scripts":{}}');
  writeFileSync(join(appRoot, "base.txt"), "base");
  if (existingSlug) {
    mkdirSync(join(appRoot, "public", "reports", existingSlug), { recursive: true });
    writeFileSync(join(appRoot, "public", "reports", existingSlug, "index.html"), "existing");
  }
  git(appRoot, "add", ".");
  git(appRoot, "commit", "-m", "base");
  git(appRoot, "branch", "-M", "main");
  git(appRoot, "remote", "add", "origin", remote);
  git(appRoot, "push", "-u", "origin", "main");
  git(appRoot, `--git-dir=${remote}`, "symbolic-ref", "HEAD", "refs/heads/main");
  return { root, remote, appRoot };
}

describe("parseCli", () => {
  it("keeps the historical flag-only invocation as allocate", () => {
    expect(parseCli(["--company", "Acme", "--type", "preview"])).toEqual({
      command: "allocate",
      options: { company: "Acme", type: "preview" },
    });
  });

  it("parses publish and boolean update", () => {
    expect(parseCli([
      "publish",
      "--source-dir",
      "/tmp/report",
      "--slug",
      "acme-preview-abcdef",
      "--company",
      "Acme",
      "--type",
      "preview",
      "--update",
    ])).toEqual({
      command: "publish",
      options: {
        sourceDir: "/tmp/report",
        slug: "acme-preview-abcdef",
        company: "Acme",
        type: "preview",
        update: true,
      },
    });
  });
});

describe("repository guard", () => {
  it("accepts SSH and HTTPS forms of the production repository", () => {
    expect(() => assertExpectedRemote("git@github.com:SariSariDesign/activation-diagnostic-landing-page.git")).not.toThrow();
    expect(() => assertExpectedRemote("git@github-sarisari:SariSariDesign/activation-diagnostic-landing-page.git")).not.toThrow();
    expect(() => assertExpectedRemote("https://github.com/SariSariDesign/activation-diagnostic-landing-page.git")).not.toThrow();
  });

  it("rejects Patricia's older activation-diagnostic repository", () => {
    try {
      assertExpectedRemote("git@github.com:SariSariDesign/activation-diagnostic.git");
      throw new Error("expected repository guard to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(PublishError);
      expect(error).toMatchObject({ code: "wrong_repository" });
      expect(error.message).toContain(`Expected ${EXPECTED_REPOSITORY}`);
    }
  });
});

describe("artifact validation", () => {
  it("rejects malformed and traversal-shaped slugs", () => {
    const source = tempDir();
    writePreview(source, "acme-preview-abcdef");
    expect(() => collectAndValidateArtifact({
      sourceDir: source,
      slug: "../acme-preview-abcdef",
      type: "preview",
    })).toThrowError(/slug must match/i);
  });

  it("allows only index.html and regular screenshot files", () => {
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);
    writeFileSync(join(source, "transcript.txt"), "private transcript");

    const artifact = collectAndValidateArtifact({ sourceDir: source, slug, type: "preview" });

    expect(artifact.files.map((file) => file.relativePath)).toEqual([
      "index.html",
      "screenshots/one.webp",
    ]);
    expect(artifact.assetPaths).toEqual([`/reports/${slug}/screenshots/one.webp`]);
  });

  it("rejects unresolved template placeholders", () => {
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug, "[PREVIEW_SCORE]");

    expect(() => collectAndValidateArtifact({ sourceDir: source, slug, type: "preview" }))
      .toThrowError(/unresolved template placeholder/i);
  });

  it("rejects relative and cross-slug screenshot paths", () => {
    const relative = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(relative, slug, '<img src="screenshots/one.webp">');
    expect(() => collectAndValidateArtifact({ sourceDir: relative, slug, type: "preview" }))
      .toThrowError(/absolute \/reports/i);

    const crossSlug = tempDir();
    writePreview(crossSlug, slug, '<img src="/reports/other-preview-abcdef/screenshots/one.webp">');
    expect(() => collectAndValidateArtifact({ sourceDir: crossSlug, slug, type: "preview" }))
      .toThrowError(/another report slug/i);

    const traversal = tempDir();
    writePreview(traversal, slug, `<img src="/reports/${slug}/screenshots/%2e%2e/private.webp">`);
    expect(() => collectAndValidateArtifact({ sourceDir: traversal, slug, type: "preview" }))
      .toThrowError(/escape its report directory/i);
  });

  it("rejects missing screenshot files and symlinks", () => {
    const missing = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(missing, slug, `<img src="/reports/${slug}/screenshots/missing.webp">`);
    expect(() => collectAndValidateArtifact({ sourceDir: missing, slug, type: "preview" }))
      .toThrowError(/missing screenshot/i);

    const linked = tempDir();
    writePreview(linked, slug);
    symlinkSync(join(linked, "screenshots", "one.webp"), join(linked, "screenshots", "linked.webp"));
    expect(() => collectAndValidateArtifact({ sourceDir: linked, slug, type: "preview" }))
      .toThrowError(/symlink/i);
  });

  it("rejects a symlinked source directory and non-image files under screenshots", () => {
    const slug = "acme-preview-abcdef";
    const realSource = tempDir();
    writePreview(realSource, slug);
    const linkedParent = tempDir();
    const linkedSource = join(linkedParent, "linked-source");
    symlinkSync(realSource, linkedSource);
    expect(() => collectAndValidateArtifact({ sourceDir: linkedSource, slug, type: "preview" }))
      .toThrowError(/source directory cannot be a symlink/i);

    const linkedScreenshots = tempDir();
    const outsideScreenshots = tempDir();
    writeFileSync(join(outsideScreenshots, "one.webp"), "outside");
    symlinkSync(outsideScreenshots, join(linkedScreenshots, "screenshots"));
    writeFileSync(join(linkedScreenshots, "index.html"), `
      <img src="/reports/${slug}/screenshots/one.webp">
    `);
    expect(() => collectAndValidateArtifact({ sourceDir: linkedScreenshots, slug, type: "preview" }))
      .toThrowError(/screenshots directory cannot be a symlink/i);

    const privateFile = tempDir();
    writePreview(privateFile, slug);
    writeFileSync(join(privateFile, "screenshots", "transcript.txt"), "private");
    expect(() => collectAndValidateArtifact({ sourceDir: privateFile, slug, type: "preview" }))
      .toThrowError(/non-image file/i);
  });
});

describe("publish marker", () => {
  it("is deterministic across source directory locations and changes with assets", () => {
    const slug = "acme-preview-abcdef";
    const first = tempDir();
    const second = tempDir();
    writePreview(first, slug);
    writePreview(second, slug);

    const id1 = createPublishId(collectAndValidateArtifact({ sourceDir: first, slug, type: "preview" }));
    const id2 = createPublishId(collectAndValidateArtifact({ sourceDir: second, slug, type: "preview" }));
    expect(id1).toBe(id2);

    writeFileSync(join(second, "screenshots", "one.webp"), "changed");
    const id3 = createPublishId(collectAndValidateArtifact({ sourceDir: second, slug, type: "preview" }));
    expect(id3).not.toBe(id1);
  });

  it("replaces an earlier marker rather than duplicating it", () => {
    const once = injectPublishMarker("<html><head></head></html>", "abc123");
    const twice = injectPublishMarker(once, "def456");
    expect(twice).not.toContain("abc123");
    expect(twice.match(/publish-id:/g)).toHaveLength(1);
    expect(twice).toContain("publish-id:def456");
  });
});

describe("live verification", () => {
  it("verifies a delayed deployment through a local HTTP server", async () => {
    const slug = "acme-preview-abcdef";
    const publishId = "1234567890abcdef";
    let pageRequests = 0;
    const server = createServer((request, response) => {
      if (request.url === `/reports/${slug}/`) {
        pageRequests += 1;
        response.writeHead(200, { "x-robots-tag": "noindex, nofollow", "content-type": "text/html" });
        response.end(pageRequests === 1
          ? "<html>old deployment</html>"
          : `<html><!-- publish-id:${publishId} --><img src="/reports/${slug}/screenshots/one.webp"></html>`);
        return;
      }
      if (request.url === `/reports/${slug}/screenshots/one.webp`) {
        response.writeHead(200, { "content-type": "image/webp" });
        response.end("image");
        return;
      }
      response.writeHead(404).end();
    });
    await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
    const address = server.address();

    try {
      const result = await verifyDeployment({
        slug,
        publishId,
        baseUrl: `http://127.0.0.1:${address.port}/reports`,
        timeoutMs: 100,
        sleepImpl: async () => {},
        nowImpl: (() => {
          let now = 0;
          return () => (now += 10);
        })(),
      });
      expect(result.verifiedAssets).toHaveLength(1);
      expect(pageRequests).toBe(2);
    } finally {
      await new Promise((resolveClose, rejectClose) => server.close((error) => {
        if (error) rejectClose(error);
        else resolveClose();
      }));
    }
  });

  it("waits through an old deployment and verifies marker, noindex, and assets", async () => {
    const slug = "acme-preview-abcdef";
    const publishId = "1234567890abcdef";
    const pageUrl = `https://example.test/reports/${slug}/`;
    let pageRequests = 0;
    const fetchImpl = vi.fn(async (url) => {
      if (url === pageUrl) {
        pageRequests += 1;
        const body = pageRequests === 1
          ? "<html>old</html>"
          : `<html><!-- publish-id:${publishId} --><img src="/reports/${slug}/screenshots/one.webp"></html>`;
        return new Response(body, {
          status: 200,
          headers: { "x-robots-tag": "noindex, nofollow" },
        });
      }
      return new Response("image", { status: 200 });
    });

    const result = await verifyDeployment({
      slug,
      publishId,
      baseUrl: "https://example.test/reports",
      fetchImpl,
      timeoutMs: 100,
      sleepImpl: async () => {},
      nowImpl: (() => {
        let now = 0;
        return () => (now += 10);
      })(),
    });

    expect(result.url).toBe(pageUrl);
    expect(result.verifiedAssets).toEqual([`${pageUrl}screenshots/one.webp`]);
    expect(pageRequests).toBe(2);
  });

  it("times out instead of claiming an old page is published", async () => {
    await expect(verifyDeployment({
      slug: "acme-preview-abcdef",
      publishId: "deadbeef12345678",
      baseUrl: "https://example.test/reports",
      fetchImpl: async () => new Response("<html>old</html>", {
        status: 200,
        headers: { "x-robots-tag": "noindex" },
      }),
      timeoutMs: 10,
      sleepImpl: async () => {},
      nowImpl: (() => {
        let now = 0;
        return () => (now += 10);
      })(),
    })).rejects.toMatchObject({ code: "verification_timeout" });
  });
});

describe("atomic Git publication", () => {
  it("requires the explicit preview type before inspecting Git", async () => {
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);

    await expect(publishArtifact({
      appRoot: tempDir(),
      sourceDir: source,
      slug,
      company: "Acme",
    })).rejects.toMatchObject({ code: "invalid_arguments" });
  });

  it("publishes from a clean detached worktree and excludes caller changes", async () => {
    const { appRoot, remote } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);
    writeFileSync(join(appRoot, "private-notes.txt"), "do not publish");
    const verifyImpl = vi.fn(async () => ({
      url: `https://example.test/reports/${slug}/`,
      verifiedAssets: [`https://example.test/reports/${slug}/screenshots/one.webp`],
    }));

    const result = await publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      qualityCommands: [],
      verifyImpl,
    });

    expect(result.status).toBe("published");
    expect(verifyImpl).toHaveBeenCalledWith(expect.objectContaining({ slug, publishId: result.publishId }));
    expect(git(appRoot, "status", "--short")).toContain("?? private-notes.txt");
    expect(git(appRoot, `--git-dir=${remote}`, "show", `main:public/reports/${slug}/index.html`))
      .toContain(`publish-id:${result.publishId}`);
    expect(git(appRoot, `--git-dir=${remote}`, "ls-tree", "-r", "--name-only", "main"))
      .not.toContain("private-notes.txt");
    expect(readFileSync(join(source, "index.html"), "utf8")).not.toContain("publish-id:");
  });

  it("rejects a wrong remote before running quality checks", async () => {
    const { appRoot } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);
    const qualityChecks = vi.fn();

    await expect(publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      runQualityChecks: qualityChecks,
    })).rejects.toMatchObject({ code: "wrong_repository" });
    expect(qualityChecks).not.toHaveBeenCalled();
  });

  it("stops on authentication failure before quality checks or a push", async () => {
    const { appRoot, remote } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);
    const before = git(appRoot, `--git-dir=${remote}`, "rev-parse", "main");
    const qualityChecks = vi.fn();
    const run = async (command, args, options) => {
      if (command === "git" && args[0] === "fetch") {
        throw new PublishError("command_failed", "authentication failed");
      }
      return runCommand(command, args, options);
    };

    await expect(publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      runQualityChecks: qualityChecks,
      run,
    })).rejects.toMatchObject({ code: "command_failed" });
    expect(qualityChecks).not.toHaveBeenCalled();
    expect(git(appRoot, `--git-dir=${remote}`, "rev-parse", "main")).toBe(before);
  });

  it("does not push when quality checks fail", async () => {
    const { appRoot, remote } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);

    await expect(publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      runQualityChecks: async () => {
        throw new PublishError("quality_failed", "build failed");
      },
    })).rejects.toMatchObject({ code: "quality_failed" });
    expect(git(appRoot, `--git-dir=${remote}`, "ls-tree", "-r", "--name-only", "main"))
      .not.toContain(`public/reports/${slug}/index.html`);
  });

  it("requires --update before replacing an existing slug", async () => {
    const slug = "acme-preview-abcdef";
    const { appRoot } = createGitFixture({ existingSlug: slug });
    const source = tempDir();
    writePreview(source, slug);

    await expect(publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      qualityCommands: [],
    })).rejects.toMatchObject({ code: "slug_exists" });
  });

  it("replaces an existing slug only when update is explicit", async () => {
    const slug = "acme-preview-abcdef";
    const { appRoot, remote } = createGitFixture({ existingSlug: slug });
    const source = tempDir();
    writePreview(source, slug, "updated");

    const result = await publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      update: true,
      remoteGuard: () => {},
      qualityCommands: [],
      verifyImpl: async () => ({ url: "https://example.test/report", verifiedAssets: [] }),
    });

    expect(result.status).toBe("published");
    expect(git(appRoot, `--git-dir=${remote}`, "show", `main:public/reports/${slug}/index.html`))
      .toContain("updated");
  });

  it("retries from fresh main after a non-fast-forward race", async () => {
    const { appRoot, root } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);
    let raced = false;

    const result = await publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      qualityCommands: [],
      verifyImpl: async () => ({ url: "https://example.test/report", verifiedAssets: [] }),
      beforePush: async ({ attempt }) => {
        if (attempt !== 1 || raced) return;
        raced = true;
        const racer = join(root, "racer");
        git(root, "clone", join(root, "remote.git"), racer);
        git(racer, "config", "user.name", "Racer");
        git(racer, "config", "user.email", "racer@example.test");
        writeFileSync(join(racer, "race.txt"), "race");
        git(racer, "add", "race.txt");
        git(racer, "commit", "-m", "race");
        git(racer, "push", "origin", "HEAD:main");
      },
    });

    expect(result.status).toBe("published");
    expect(result.attempts).toBe(2);
  });

  it("returns pushed_pending with a resumable command after verification timeout", async () => {
    const { appRoot } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);

    const result = await publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      qualityCommands: [],
      verifyImpl: async () => {
        throw new PublishError("verification_timeout", "still old");
      },
    });

    expect(result).toMatchObject({
      status: "pushed_pending",
      slug,
      recoveryCommand: expect.stringContaining(`verify --slug ${slug}`),
    });
  });

  it("reports an exhausted push race after three moving-main attempts", async () => {
    const { appRoot, root } = createGitFixture();
    const source = tempDir();
    const slug = "acme-preview-abcdef";
    writePreview(source, slug);

    await expect(publishArtifact({
      appRoot,
      sourceDir: source,
      slug,
      company: "Acme",
      type: "preview",
      remoteGuard: () => {},
      qualityCommands: [],
      beforePush: async ({ attempt }) => {
        const racer = join(root, `racer-${attempt}`);
        git(root, "clone", join(root, "remote.git"), racer);
        git(racer, "config", "user.name", "Racer");
        git(racer, "config", "user.email", "racer@example.test");
        writeFileSync(join(racer, `race-${attempt}.txt`), "race");
        git(racer, "add", `race-${attempt}.txt`);
        git(racer, "commit", "-m", `race ${attempt}`);
        git(racer, "push", "origin", "HEAD:main");
      },
    })).rejects.toMatchObject({ code: "push_race_exhausted" });
  });
});
