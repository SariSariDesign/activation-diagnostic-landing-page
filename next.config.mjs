/** @type {import('next').NextConfig} */
const nextConfig = {
  // Resolve /reports/<slug>/ (trailing slash, no .html) to
  // public/reports/<slug>/index.html — matches the delivered report URL.
  trailingSlash: true,

  // Serve the static report directory URL /reports/<slug>/ from the
  // copied public/reports/<slug>/index.html file.
  async rewrites() {
    return [
      { source: "/reports/:slug/", destination: "/reports/:slug/index.html" },
    ];
  },

  // Keep diagnostic reports out of search indexes (matches prior prod behavior).
  // Both the static /reports/ deliverables and the dynamic /s/<slug> scorecard
  // pages are unguessable, per-lead, and must not be indexed.
  async headers() {
    return [
      {
        source: "/reports/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/s/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
