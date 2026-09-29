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
