"use server";
import { headers } from "next/headers";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { runAction } from "@/lib/action-result";
import { getBaseUrl } from "@/lib/base-url";
import { DomainError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { registrarContato, type envioSchema } from "@/lib/business/contatos";

/**
 * Formulário de orçamento do site da empresa (NextLevel Business, NB3, D309). Público, sem sessão. A empresa é achada pelo
 * endereço da loja no servidor; o limite por endereço de rede fica só em memória (o IP não é gravado).
 */
export async function enviarContatoAction(slug: string, input: z.input<typeof envioSchema>) {
  return runAction(async () => {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`contato:${slug}:${ip}`, 6, 10 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos envios seguidos. Espere alguns minutos e tente de novo.");
    const r = await registrarContato(await getDb(), String(slug).slice(0, 80), input, { hostProprio: h.get("host"), baseUrl: await getBaseUrl() });
    return { recebido: true, novo: r.novo };
  });
}
