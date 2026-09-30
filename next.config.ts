import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // allowedOrigins só existe para simular domínios de marca em testes locais (cabeçalho x-forwarded-host); vazio em produção.
  experimental: { serverActions: { bodySizeLimit: "8mb", ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ? { allowedOrigins: process.env.SERVER_ACTIONS_ALLOWED_ORIGINS.split(",") } : {}) } },
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
};

export default nextConfig;
