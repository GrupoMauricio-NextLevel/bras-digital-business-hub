"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AnuncioStatus } from "@/db/schema";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import * as A from "@/lib/domain/anuncios";

async function sessao() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s;
}
const atualizar = (id?: string) => { revalidatePath("/merchant/anuncios", "layout"); revalidatePath("/master/anuncios", "layout"); if (id) revalidatePath(`/merchant/anuncios/${id}`); };

/** Anúncios da loja na Meta (D299): lado do lojista. */
export async function novoAnuncioAction() {
  const s = await sessao();
  const { id } = await A.criarAnuncio(await getDb(), s.actor);
  redirect(`/merchant/anuncios/${id}`);
}
export async function salvarDiagnosticoAction(id: string, parcial: unknown) {
  return runAction(async () => { const s = await sessao(); await A.salvarDiagnostico(await getDb(), s.actor, id, parcial); return undefined; });
}
export async function enviarDiagnosticoAction(id: string) {
  return runAction(async () => { const s = await sessao(); await A.enviarDiagnostico(await getDb(), s.actor, id); atualizar(id); return undefined; });
}
export async function mensagemDoLojistaAction(id: string, texto: string) {
  return runAction(async () => { const s = await sessao(); await A.mensagemDoLojista(await getDb(), s.actor, id, s.user.name, texto); atualizar(id); return undefined; });
}
export async function marcarPendenciaAction(id: string, chave: string, feito: boolean) {
  return runAction(async () => { const s = await sessao(); await A.marcarPendencia(await getDb(), s.actor, id, chave, feito, s.user.name); atualizar(id); return undefined; });
}
export async function aceitarPropostaAction(id: string) {
  return runAction(async () => { const s = await sessao(); await A.aceitarProposta(await getDb(), s.actor, id, s.user.name); atualizar(id); return undefined; });
}
export async function cancelarAnuncioAction(id: string) {
  return runAction(async () => { const s = await sessao(); await A.cancelarAnuncio(await getDb(), s.actor, id, s.user.name); atualizar(id); return undefined; });
}

/** Lado da equipe (mesa de anúncios do Master). */
export async function mudarEtapaAction(id: string, status: AnuncioStatus, mensagem?: string) {
  return runAction(async () => { const s = await sessao(); await A.mudarEtapa(await getDb(), s.actor, id, status, s.user.name, mensagem); atualizar(id); return undefined; });
}
export async function mensagemDaEquipeAction(id: string, texto: string) {
  return runAction(async () => { const s = await sessao(); await A.mensagemDaEquipe(await getDb(), s.actor, id, s.user.name, texto); atualizar(id); return undefined; });
}
export async function assumirAnuncioAction(id: string) {
  return runAction(async () => { const s = await sessao(); await A.assumirAnuncio(await getDb(), s.actor, id, s.user.name); atualizar(id); return undefined; });
}
export async function criarPropostaAnuncioAction(id: string) {
  return runAction(async () => { const s = await sessao(); const r = await A.criarPropostaDoAnuncio(await getDb(), s.actor, id); atualizar(id); revalidatePath("/master/financeiro/propostas"); return r; });
}
export async function lancarResultadoAction(id: string, r: unknown) {
  return runAction(async () => { const s = await sessao(); await A.lancarResultado(await getDb(), s.actor, id, s.user.name, r as never); atualizar(id); return undefined; });
}
export async function novaPendenciaAction(id: string, p: { rotulo: string; dica?: string; quem: "LOJISTA" | "EQUIPE" }) {
  return runAction(async () => { const s = await sessao(); await A.novaPendencia(await getDb(), s.actor, id, p, s.user.name); atualizar(id); return undefined; });
}
