"use server";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { mensagensDepois } from "@/lib/domain/ia-conversas";
import { responderNaLoja } from "@/lib/domain/assistente-loja";
import { abrirAtendimentoDaLoja, abrirConversaComLoja, enviarParaLoja, listarAtendimentoDaLoja, pulsoAtendimentoDaLoja, resolverAtendimentoDaLoja, responderComoLoja } from "@/lib/domain/atendimento-loja";

/** Atendimento da loja (D206): cliente final ↔ lojista. */
async function limite(chave: string, n: number) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (!rateLimit(`${chave}:${ip}`, n, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas mensagens seguidas. Tente de novo daqui a pouco.");
}
async function ator() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return s.actor; }

// Cliente final (sem login): token da conversa.
export async function abrirConversaComLojaAction(input: { slug: string; nome: string; whatsapp: string; texto: string; pagina?: string }) {
  return runAction(async () => { await limite("loja-abrir", 10); return abrirConversaComLoja(await getDb(), input); });
}
export async function enviarParaLojaAction(input: { id: string; token: string; texto: string; depoisDe?: string | null }) {
  return runAction(async () => { await limite("loja-msg", 60); return enviarParaLoja(await getDb(), input); });
}
export async function mensagensDaLojaAction(input: { id: string; token: string; depoisDe?: string | null }) {
  return runAction(async () => mensagensDepois(await getDb(), input.id, input.token, input.depoisDe));
}
/** Assistente da loja (D239): produtos do catálogo e situação do pedido, com os dados reais da loja. */
export async function perguntarNaLojaAction(input: { slug: string; texto: string }) {
  return runAction(async () => { await limite("loja-assistente", 120); return responderNaLoja(await getDb(), String(input.slug).slice(0, 80), String(input.texto)); });
}
// Lojista.
export async function listarAtendimentoDaLojaAction(filtro: "ABERTAS" | "RESOLVIDAS") {
  return runAction(async () => listarAtendimentoDaLoja(await getDb(), await ator(), filtro));
}
export async function abrirAtendimentoDaLojaAction(id: string) {
  return runAction(async () => abrirAtendimentoDaLoja(await getDb(), await ator(), id));
}
export async function responderComoLojaAction(id: string, texto: string) {
  return runAction(async () => { await responderComoLoja(await getDb(), await ator(), id, texto); return undefined; });
}
export async function resolverAtendimentoDaLojaAction(id: string) {
  return runAction(async () => { await resolverAtendimentoDaLoja(await getDb(), await ator(), id); return undefined; });
}
export async function pulsoAtendimentoLojaAction() {
  return runAction(async () => { const s = await getSession(); return s ? pulsoAtendimentoDaLoja(await getDb(), s.actor) : null; });
}
