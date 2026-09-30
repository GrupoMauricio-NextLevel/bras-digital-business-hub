import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
};

export default nextConfig;
