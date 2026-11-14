import type { NextConfig } from "next";

/**
 * Antaryatra is a fully static site (ADR-003): `next build` writes plain
 * HTML/JS/CSS to `out/`, which Vercel serves from its CDN (D-009).
 * Security headers live in `vercel.json`, because `headers()` here is not
 * supported with `output: "export"`.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: {
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
