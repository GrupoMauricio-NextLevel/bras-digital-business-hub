"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { rateLimit } from "@/lib/rate-limit";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { aparelhoDe, origemDe } from "@/lib/domain/visitas";
import { pedirAulaExperimental, registrarResultado, salvarConfigAcademia, salvarNotas, type Resultado } from "@/lib/domain/business/academia";

/** Página pública da academia (A1, D307): pedido de aula experimental, com a origem de onde a pessoa veio. */
export async function pedirAulaExperimentalAction(slug: string, input: unknown, meta: { utm?: string; campanha?: string; ref?: string; indicacao?: string }) {
  return runAction(async () => {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
    if (!rateLimit(`academia:${ip}`, 8, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo mais tarde ou chame a academia no WhatsApp.");
    const origem = meta.indicacao ? "indicacao" : origemDe({ utmSource: meta.utm, referrer: meta.ref, hostDaLoja: h.get("x-forwarded-host") ?? h.get("host") });
    const r = await pedirAulaExperimental(await getDb(), slug, input, { origem, campanha: meta.campanha, indicacao: meta.indicacao, aparelho: aparelhoDe(h.get("user-agent")) });
    return { novo: r.novo };
  });
}

async function ator() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}

export async function registrarResultadoAction(id: string, resultado: Resultado, extra: { motivo?: string; dia?: string } = {}) {
  return runAction(async () => {
    const r = await registrarResultado(await getDb(), await ator(), id, resultado, extra);
    revalidatePath("/merchant/academia", "layout");
    return r;
  });
}

export async function salvarNotasAcademiaAction(id: string, notas: string) {
  return runAction(async () => {
    await salvarNotas(await getDb(), await ator(), id, notas);
    revalidatePath("/merchant/academia", "layout");
    return undefined;
  });
}

export async function salvarPaginaAcademiaAction(input: unknown) {
  return runAction(async () => {
    await salvarConfigAcademia(await getDb(), await ator(), input);
    revalidatePath("/merchant/academia", "layout");
    return undefined;
  });
}
