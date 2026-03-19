import type { NextConfig } from "next";
import path from "path";
import withPWAInit from "@ducanh2912/next-pwa";

const effectRoot = path.resolve("node_modules/effect");

const withPWA = withPWAInit({
  dest: "public",
  register: true,

  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
    ],
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

export default withPWA(nextConfig);
