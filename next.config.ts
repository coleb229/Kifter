import type { NextConfig } from "next";
import path from "path";

const effectRoot = path.resolve("node_modules/effect");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
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
