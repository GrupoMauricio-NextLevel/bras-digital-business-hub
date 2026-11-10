"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { aceitarContrato, cancelarContrato, enviarContratoLojaPronta, type ContratoLojaProntaInput } from "@/lib/domain/contratos";

/** Contratos com aceite no painel (CT1+CT2, D276). Regras e permissões no domínio. */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }

export async function enviarContratoAction(input: ContratoLojaProntaInput) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await enviarContratoLojaPronta(db, actor, input); revalidatePath("/master/contratos"); return r; });
}
export async function cancelarContratoAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await cancelarContrato(db, actor, id); revalidatePath("/master/contratos"); return undefined; });
}
export async function aceitarContratoAction(id: string, input: { concordo: boolean; hashVisto: string; nome: string }) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim() || h.get("x-real-ip");
    const r = await aceitarContrato(db, actor, id, { ...input, concordo: input.concordo as true }, { ip: ip || null, aparelho: h.get("user-agent") });
    revalidatePath("/merchant/contratos"); revalidatePath("/merchant");
    return r;
  });
}
