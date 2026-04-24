import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.join(__dirname),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "gen.pollinations.ai" },
      { protocol: "https", hostname: "pollinations.ai" },
      { protocol: "https", hostname: "*.pollinations.ai" },
      { protocol: "https", hostname: "*.nanobananaapi.ai" },
      { protocol: "https", hostname: "api.nanobananaapi.ai" },
    ],
  },
};

export default nextConfig;
