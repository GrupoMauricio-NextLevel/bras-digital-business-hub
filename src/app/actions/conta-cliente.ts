"use server";
import { cookies, headers } from "next/headers";
import { getDb } from "@/db/client";
import { runAction } from "@/lib/action-result";
import { getBaseUrl } from "@/lib/base-url";
import { DomainError } from "@/lib/domain/errors";
import { COOKIE_CLIENTE, entrarComCodigo, pedirCodigo } from "@/lib/domain/conta-cliente";
import { rateLimit } from "@/lib/rate-limit";

/** Minha conta do cliente final (D240): código no e-mail e sessão por loja. */
async function limite(chave: string, n: number) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (!rateLimit(`${chave}:${ip}`, n, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo daqui a pouco.");
}
const nomeCookie = (slug: string) => `${COOKIE_CLIENTE}-${slug.replace(/[^a-z0-9-]/g, "")}`;

export async function pedirCodigoClienteAction(slug: string, email: string) {
  return runAction(async () => { await limite("cliente-codigo", 8); return pedirCodigo(await getDb(), String(slug), String(email), await getBaseUrl()); });
}
export async function entrarClienteAction(slug: string, email: string, codigo: string) {
  return runAction(async () => {
    await limite("cliente-entrar", 20);
    const token = await entrarComCodigo(await getDb(), String(slug), String(email), String(codigo));
    const proto = (await headers()).get("x-forwarded-proto") ?? "http";
    (await cookies()).set(nomeCookie(slug), token, { path: "/", httpOnly: true, sameSite: "lax", secure: proto === "https", maxAge: 30 * 86_400 });
    return undefined;
  });
}
export async function sairClienteAction(slug: string) {
  (await cookies()).delete(nomeCookie(slug));
}
