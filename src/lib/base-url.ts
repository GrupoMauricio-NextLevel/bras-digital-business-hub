import { headers } from "next/headers";

/** URL pública do app (para webhooks e retorno do checkout). APP_URL tem prioridade. */
export async function getBaseUrl(): Promise<string> {
  const fromEnv = process.env.APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const isPublicHttps = (url: string) => url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(url);

/**
 * Endereço público de uma requisição (para redirecionar no mesmo domínio da marca). Atrás do proxy do Render,
 * `req.url` traz o endereço interno (ex.: localhost:10000); o domínio real vem de x-forwarded-host.
 */
export function requestOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
