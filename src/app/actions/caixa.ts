"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { abrirCaixa, editarLancamento, estornarLancamento, fecharCaixa, lancar, reabrirCaixa, type lancamentoSchema } from "@/lib/domain/caixa";

/** Caixa do Master (CX1, D269). Permissões e regras no domínio. */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }
const refresh = () => revalidatePath("/master/receita/caixa");

export async function abrirCaixaAction(input: { data?: string; saldoInicialCents?: number }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await abrirCaixa(db, actor, input); refresh(); return r; });
}
export async function lancarAction(input: z.input<typeof lancamentoSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await lancar(db, actor, input); refresh(); return r; });
}
export async function editarLancamentoAction(id: string, input: Parameters<typeof editarLancamento>[3]) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await editarLancamento(db, actor, id, input); refresh(); return r; });
}
export async function estornarLancamentoAction(id: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await estornarLancamento(db, actor, id, motivo); refresh(); return r; });
}
export async function fecharCaixaAction(input: { data?: string; contadoCents: number; motivo?: string }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await fecharCaixa(db, actor, input); refresh(); return r; });
}
export async function reabrirCaixaAction(data: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await reabrirCaixa(db, actor, data, motivo); refresh(); return undefined; });
}
