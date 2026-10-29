import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Só no modo de desenvolvimento: os endereços de teste das marcas (sd.test, cm.test, nl.test…) podem carregar os recursos do dev.
  allowedDevOrigins: ["*.test"],
  reactStrictMode: true,
  // allowedOrigins só existe para simular domínios de marca em testes locais (cabeçalho x-forwarded-host); vazio em produção.
  experimental: { serverActions: { bodySizeLimit: "8mb", ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ? { allowedOrigins: process.env.SERVER_ACTIONS_ALLOWED_ORIGINS.split(",") } : {}) } },
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // Cabeçalhos de segurança básicos (documento 10 §46 e §47). CSP completa fica para depois: o Next usa scripts embutidos.
  // SAMEORIGIN: a demonstração de temas e a prévia do lojista usam iframe do mesmo endereço.
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default nextConfig;
