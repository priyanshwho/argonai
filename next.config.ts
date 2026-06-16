import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["confining-cognitive-shudder.ngrok-free.dev"],
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "confining-cognitive-shudder.ngrok-free.dev"],
    },
  },
};

export default nextConfig;
