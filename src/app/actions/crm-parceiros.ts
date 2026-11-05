"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import type { PartnerStage } from "@/db/schema";
import {
  avisarSegmento, concluirTarefa, criarDesafio, encerrarDesafio, fichaDoParceiro, moverEtapa, registrarAtividade, removerSegmento,
  salvarPerfilParceiro, salvarSegmento, type Filtro,
} from "@/lib/domain/crm-parceiros";

/** CRM de parceiros do Master (D251). Permissões conferidas no domínio. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, db: await getDb() };
}
const refresh = () => { revalidatePath("/master/partners", "layout"); revalidatePath("/partner", "layout"); };

export async function fichaAction(id: string) {
  return runAction(async () => { const { session, db } = await ctx(); return fichaDoParceiro(db, session.actor, id); });
}
export async function moverEtapaAction(id: string, etapa: PartnerStage | null) {
  return runAction(async () => { const { session, db } = await ctx(); await moverEtapa(db, session.actor, id, etapa); refresh(); return undefined; });
}
export async function salvarPerfilParceiroAction(id: string, raw: unknown) {
  return runAction(async () => { const { session, db } = await ctx(); await salvarPerfilParceiro(db, session.actor, id, raw); refresh(); return undefined; });
}
export async function registrarAtividadeAction(id: string, raw: unknown) {
  return runAction(async () => { const { session, db } = await ctx(); await registrarAtividade(db, session.actor, id, raw); refresh(); return undefined; });
}
export async function concluirTarefaAction(activityId: string) {
  return runAction(async () => { const { session, db } = await ctx(); await concluirTarefa(db, session.actor, activityId); refresh(); return undefined; });
}
export async function salvarSegmentoAction(nome: string, filtro: Filtro) {
  return runAction(async () => { const { session, db } = await ctx(); await salvarSegmento(db, session.actor, nome, filtro); refresh(); return undefined; });
}
export async function removerSegmentoAction(id: string) {
  return runAction(async () => { const { session, db } = await ctx(); await removerSegmento(db, session.actor, id); refresh(); return undefined; });
}
export async function avisarSegmentoAction(filtro: Filtro, titulo: string, texto: string) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await avisarSegmento(db, session.actor, filtro, titulo, texto); refresh(); return r; });
}
export async function criarDesafioAction(raw: unknown) {
  return runAction(async () => { const { session, db } = await ctx(); await criarDesafio(db, session.actor, raw); refresh(); return undefined; });
}
export async function encerrarDesafioAction(id: string) {
  return runAction(async () => { const { session, db } = await ctx(); await encerrarDesafio(db, session.actor, id); refresh(); return undefined; });
}
