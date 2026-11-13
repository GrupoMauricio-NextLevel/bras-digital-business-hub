"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { escrever, salvarComoInteressado, marcarMensagem, moverMensagem, responder, type novoSchema, type respostaSchema } from "@/lib/domain/caixa-entrada";
import type { z } from "zod";

/** Caixa de entrada do Master (D290): regras e permissão no domínio. */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }
const atualizar = () => revalidatePath("/master/caixa-de-entrada");

export async function responderAction(input: z.input<typeof respostaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await responder(db, actor, input); atualizar(); return undefined; });
}
export async function escreverAction(input: z.input<typeof novoSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await escrever(db, actor, input); atualizar(); return undefined; });
}
export async function moverAction(pasta: string, uid: number, destino: string) {
  return runAction(async () => { const { actor } = await ctx(); await moverMensagem(actor, pasta, uid, destino); atualizar(); return undefined; });
}
export async function marcarAction(pasta: string, uid: number, lida: boolean) {
  return runAction(async () => { const { actor } = await ctx(); await marcarMensagem(actor, pasta, uid, lida); atualizar(); return undefined; });
}
export async function salvarInteressadoAction(email: string, nome?: string, assunto?: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await salvarComoInteressado(db, actor, { email, nome, assunto }); atualizar(); revalidatePath("/commerce/leads"); return r; });
}
