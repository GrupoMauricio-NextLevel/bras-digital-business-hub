"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { cadastrarExecutivo, concluirRetorno, definirMetaSemanal, estornarVendaDeRua, receberDoExecutivo, registrarVendaDeRua, registrarVisita, type executivoSchema, type vendaDeRuaSchema, type visitaSchema } from "@/lib/domain/executivos";

/** Executivos de venda (CX3, D273). Permissões e regras no domínio. */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }
const refresh = () => { revalidatePath("/master/partners/executivos"); revalidatePath("/master/receita/caixa"); revalidatePath("/partner"); };

export async function cadastrarExecutivoAction(input: z.input<typeof executivoSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await cadastrarExecutivo(db, actor, input); refresh(); return r; });
}
export async function receberDoExecutivoAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await receberDoExecutivo(db, actor, id); refresh(); return r; });
}
export async function estornarVendaDeRuaAction(id: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await estornarVendaDeRua(db, actor, id, motivo); refresh(); return undefined; });
}
export async function registrarVendaDeRuaAction(input: z.input<typeof vendaDeRuaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await registrarVendaDeRua(db, actor, input); refresh(); return r; });
}
export async function registrarVisitaAction(input: z.input<typeof visitaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await registrarVisita(db, actor, input); refresh(); return r; });
}
export async function concluirRetornoAction(visitaId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await concluirRetorno(db, actor, visitaId); refresh(); return undefined; });
}
export async function definirMetaSemanalAction(partnerId: string, meta: number | null) {
  return runAction(async () => { const { actor, db } = await ctx(); await definirMetaSemanal(db, actor, partnerId, meta); refresh(); return undefined; });
}
