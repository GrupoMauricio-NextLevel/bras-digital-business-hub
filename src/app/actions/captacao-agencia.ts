"use server";
import { headers } from "next/headers";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { runAction } from "@/lib/action-result";
import { DomainError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { registrarPedidoDaAgencia, type pedidoSchema } from "@/lib/agencias/captacao";

/** Formulário público de orçamento da agência (D322). Sem sessão; limite por endereço de rede só em memória. */
export async function enviarPedidoAgenciaAction(slug: string, input: z.input<typeof pedidoSchema>) {
  return runAction(async () => {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`orcamento-ag:${slug}:${ip}`, 6, 10 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos envios seguidos. Espere alguns minutos e tente de novo.");
    const r = await registrarPedidoDaAgencia(await getDb(), String(slug).slice(0, 80), input, { hostProprio: h.get("host") });
    return { recebido: true, novo: r.novo };
  });
}
