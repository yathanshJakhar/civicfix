import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones reach the dev server through a tunnel (ngrok / Cloudflare) or over the local Wi-Fi.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "192.168.*.*",
    "10.*.*.*",
  ],
  cacheComponents: true,
  partialPrefetching: true,
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
