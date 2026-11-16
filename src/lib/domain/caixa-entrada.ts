import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { brandLeads, partners, stores, users } from "@/db/schema";
import { CONTATOS } from "@/lib/contatos";
import * as hm from "@/lib/integrations/hostinger-mail";
import { isMasterOwner, type Actor } from "./access";
import { DomainError, ForbiddenError } from "./errors";
import { emitEvent } from "./events";
import { newId } from "@/lib/ids";

/**
 * Caixa de entrada do Master (D296): a caixa da Hostinger (contato@, suporte@, financeiro@, comercial@, parceiros@)
 * lida e respondida dentro do Master. Só o dono abre (a caixa tem dados de todos os clientes). Cada remetente é
 * reconhecido no sistema (lojista, parceiro, interessado) para responder com contexto.
 */
export const podeUsarCaixa = (actor: Actor) => isMasterOwner(actor);
const exigir = (actor: Actor) => { if (!podeUsarCaixa(actor)) throw new ForbiddenError("Só o dono abre a caixa de entrada."); };

export type QuemE = { email: string; tipo: "LOJISTA" | "EQUIPE_LOJA" | "PARCEIRO" | "INTERESSADO" | "MASTER" | "OUTRO"; nome: string | null; detalhe: string | null; href: string | null };

/** Reconhece remetentes: conta no sistema (lojista, parceiro, equipe) ou interessado do CRM. Uma consulta por tabela. */
export async function quemSao(db: Database, emails: string[]): Promise<Map<string, QuemE>> {
  const lista = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))].slice(0, 200);
  const mapa = new Map<string, QuemE>();
  if (!lista.length) return mapa;
  const contas = await db.select({ id: users.id, email: users.email, nome: users.name, role: users.role, storeRole: users.storeRole, loja: stores.name, storeId: stores.id }).from(users).leftJoin(stores, eq(stores.id, users.storeId)).where(inArray(users.email, lista));
  const parc = contas.length ? await db.select({ userId: partners.userId, id: partners.id }).from(partners).where(inArray(partners.userId, contas.map((c) => c.id))) : [];
  const ehParceiro = new Map(parc.map((p) => [p.userId, p.id]));
  for (const c of contas) {
    const tipo: QuemE["tipo"] = c.role === "NEXTLEVEL_MASTER" ? "MASTER" : c.role === "STORE_OWNER" ? (c.storeRole === "STAFF" ? "EQUIPE_LOJA" : "LOJISTA") : ehParceiro.has(c.id) || c.role === "AFFILIATE" ? "PARCEIRO" : "OUTRO";
    mapa.set(c.email.toLowerCase(), { email: c.email, tipo, nome: c.nome, detalhe: c.loja ? `Loja ${c.loja}` : null, href: c.storeId ? `/master/comercial/${encodeURIComponent(`loja:${c.storeId}`)}` : null });
  }
  const leads = await db.select({ id: brandLeads.id, email: brandLeads.email, nome: brandLeads.name, kind: brandLeads.kind, status: brandLeads.status }).from(brandLeads).where(inArray(brandLeads.email, lista));
  for (const l of leads) if (!mapa.has(l.email.toLowerCase())) mapa.set(l.email.toLowerCase(), { email: l.email, tipo: "INTERESSADO", nome: l.nome === "Visitante do site" ? null : l.nome, detalhe: l.kind === "SAIDA" ? "Deixou o e-mail na janela de saída" : l.kind === "DIAGNOSTIC" ? "Pediu diagnóstico" : "Interessado", href: `/master/comercial/${encodeURIComponent(`interessado:${l.id}`)}` });
  return mapa;
}

/** Para qual endereço da NextLevel a mensagem foi enviada (contato@, suporte@...). */
export function enderecoDeDestino(m: Pick<hm.Mensagem, "to" | "cc">): keyof typeof CONTATOS | null {
  const todos = [...m.to, ...m.cc].map((a) => a.address.toLowerCase());
  for (const [k, v] of Object.entries(CONTATOS)) if (todos.includes(v)) return k as keyof typeof CONTATOS;
  return null;
}

export async function caixa(db: Database, actor: Actor, pasta: string, page: number, busca?: string) {
  exigir(actor);
  const [listaPastas, msgs] = await Promise.all([hm.pastas(), busca ? hm.buscar(pasta, busca).then((data) => ({ data, pagination: { page: 1, perPage: data.length, total: data.length, totalPages: 1 } })) : hm.mensagens(pasta, page)]);
  const remetentes = await quemSao(db, msgs.data.flatMap((m) => m.from.map((a) => a.address)));
  return { pastas: listaPastas, ...msgs, remetentes };
}

export async function lerMensagem(db: Database, actor: Actor, pasta: string, uid: number) {
  exigir(actor);
  const [m, corpo] = await Promise.all([hm.mensagem(pasta, uid), hm.textoDaMensagem(pasta, uid)]);
  if (m.unseen) { await hm.marcar(pasta, uid, true).catch(() => undefined); hm.limparNaoLidasCache(); }
  const remetentes = await quemSao(db, m.from.map((a) => a.address));
  return { m, corpo, remetentes, destino: enderecoDeDestino(m) };
}

export const respostaSchema = z.object({
  pasta: z.string().min(1).max(100), uid: z.number().int().positive(),
  para: z.array(z.string().trim().email("E-mail inválido")).min(1).max(20), cc: z.array(z.string().trim().email()).max(20).default([]),
  assunto: z.string().trim().min(1).max(300), texto: z.string().trim().min(1, "Escreva a resposta").max(50_000),
});

/** Responde na mesma conversa (a Hostinger marca a original como respondida). */
export async function responder(db: Database, actor: Actor, raw: z.input<typeof respostaSchema>) {
  exigir(actor);
  const v = respostaSchema.parse(raw);
  await hm.enviar({ to: v.para, cc: v.cc, subject: v.assunto, text: v.texto, resposta: { uid: v.uid, folder: v.pasta } });
  await marcarContatados(db, v.para);
  await emitEvent(db, { type: "CAIXA_RESPONDIDA", actorRole: actor.role, payload: { pasta: v.pasta, uid: v.uid, para: v.para.length } });
}

export const novoSchema = z.object({ para: z.array(z.string().trim().email("E-mail inválido")).min(1).max(20), assunto: z.string().trim().min(1).max(300), texto: z.string().trim().min(1).max(50_000) });
export async function escrever(db: Database, actor: Actor, raw: z.input<typeof novoSchema>) {
  exigir(actor);
  const v = novoSchema.parse(raw);
  await hm.enviar({ to: v.para, subject: v.assunto, text: v.texto });
  await marcarContatados(db, v.para);
  await emitEvent(db, { type: "CAIXA_ENVIADA", actorRole: actor.role, payload: { para: v.para.length } });
}

export async function moverMensagem(actor: Actor, pasta: string, uid: number, destino: string) {
  exigir(actor);
  if (pasta === destino) throw new DomainError("CAIXA_MESMA_PASTA", "A mensagem já está nessa pasta.");
  await hm.mover(pasta, uid, destino);
  hm.limparNaoLidasCache();
}

export async function marcarMensagem(actor: Actor, pasta: string, uid: number, lida: boolean) {
  exigir(actor);
  await hm.marcar(pasta, uid, lida);
  hm.limparNaoLidasCache();
}

/** Respondeu ou escreveu para um interessado novo: ele passa a "contatado" no CRM, sem trabalho manual. */
async function marcarContatados(db: Database, para: string[]) {
  const lista = para.map((e) => e.trim().toLowerCase());
  if (lista.length) await db.update(brandLeads).set({ status: "CONTACTED", updatedAt: new Date().toISOString() }).where(and(inArray(brandLeads.email, lista), eq(brandLeads.status, "NEW")));
}

export const interessadoSchema = z.object({ email: z.string().trim().toLowerCase().email(), nome: z.string().trim().max(120).optional(), assunto: z.string().trim().max(300).optional() });
/** Remetente sem conta vira interessado no CRM (Commerce) com um clique; sem e-mail automático para ele. */
export async function salvarComoInteressado(db: Database, actor: Actor, raw: z.input<typeof interessadoSchema>) {
  exigir(actor);
  const v = interessadoSchema.parse(raw);
  const existe = await db.query.brandLeads.findFirst({ where: and(eq(brandLeads.brand, "NEXTLEVEL_COMMERCE"), eq(brandLeads.email, v.email)) });
  if (existe) return { id: existe.id, criado: false };
  const id = newId("bld");
  await db.insert(brandLeads).values({ id, brand: "NEXTLEVEL_COMMERCE", name: v.nome || v.email.split("@")[0]!, email: v.email, phone: "", message: v.assunto ? `E-mail: ${v.assunto}` : null, attribution: { origem: "email" } });
  return { id, criado: true };
}
