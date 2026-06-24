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
  async headers() {
    return [
      {
        source: "/reports/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
