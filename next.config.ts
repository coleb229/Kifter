import type { NextConfig } from "next";
import path from "path";

const effectRoot = path.resolve("node_modules/effect");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  // Empty turbopack config silences the "webpack config but no turbopack config" error
  // introduced in Next.js 16. The webpack config below is still used when building
  // with --webpack (local) but Turbopack handles production builds on Vercel fine
  // without the alias (Effect deduplication is a dev-mode HMR concern only).
  turbopack: {},
  // Force all effect/* imports to resolve through a single root so CJS and ESM
  // module instances share the same version registry and don't warn.
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      effect: effectRoot,
    };
    return config;
  },
};

export default nextConfig;
