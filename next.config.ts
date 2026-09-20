import type { NextConfig } from "next";

const configuredActionOrigins = process.env.SERVER_ACTION_ALLOWED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.app.github.dev",
        ...configuredActionOrigins,
      ],
    },
  },
};

export default nextConfig;
