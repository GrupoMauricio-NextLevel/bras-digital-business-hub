import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, gt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { iaConversas, iaMensagens } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { requireMasterFn, type Actor } from "./access";
import { createBrandLead } from "./brand-leads";
import { enviarRespostaPorEmail } from "./suporte-email";
import type { BrandCode } from "@/lib/brand";
import { FAIXAS_VENDA, responder, responderTexto, type FatosVenda, type RespostaVenda } from "@/lib/ia/vendedor-publico";

/** Motor de respostas da conversa: o vendedor da home ou o guia do programa de parceiros (D253, páginas /parceiros). */
export type MotorConversa = { responder: (assunto: string | null) => RespostaVenda; responderTexto: (texto: string) => RespostaVenda; cadastro: string; guiado?: boolean };
const motorVenda = (f: FatosVenda): MotorConversa => ({ responder: (a) => responder(f, a), responderTexto: (t) => responderTexto(f, t), cadastro: f.cadastro });
export const ehPaginaDeParceiros = (pagina: string | null | undefined) => !!pagina && /^\/parceiros(\/|$|\?|#)/.test(pagina);

/**
 * Conversas do Maurício nas páginas públicas e o CRM ao vivo do Master (D197). O visitante só fala com a própria conversa
 * (token aleatório; guardamos só o hash). Dados pessoais entram quando ele informa. Equipe assume, responde e devolve.
 */
export type Conversa = typeof iaConversas.$inferSelect;
export type Mensagem = typeof iaMensagens.$inferSelect;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const agora = () => new Date().toISOString();

async function conferir(db: Database, id: string, token: string): Promise<Conversa> {
  const c = (await db.select().from(iaConversas).where(eq(iaConversas.id, id)).limit(1))[0];
  const a = Buffer.from(c?.tokenHash ?? "0".repeat(64)), b = Buffer.from(hash(token ?? ""));
  if (!c || a.length !== b.length || !timingSafeEqual(a, b)) throw new NotFoundError("Conversa não encontrada.");
  return c;
}

async function gravar(db: Database, conversaId: string, autor: Mensagem["autor"], texto: string, extra: Record<string, unknown> = {}, autorNome: string | null = null) {
  const m = { id: newId("iam"), conversaId, autor, autorNome, texto: texto.slice(0, 2000), extra, createdAt: agora() };
  await db.insert(iaMensagens).values(m);
  return m;
}
const extraDe = (r: RespostaVenda) => ({ atalhos: r.atalhos, acoes: r.acoes, assunto: r.assunto });

export async function iniciarConversa(db: Database, input: { brand: BrandCode; pagina?: string; origem?: Record<string, string> }, fatos: FatosVenda, motorParceiros?: MotorConversa) {
  const token = randomBytes(24).toString("hex");
  const id = newId("iac");
  await db.insert(iaConversas).values({ id, brand: input.brand, tokenHash: hash(token), pagina: input.pagina?.slice(0, 200) ?? null, origem: input.origem ?? {} });
  const motor = ehPaginaDeParceiros(input.pagina) && motorParceiros ? motorParceiros : motorVenda(fatos);
  const boasVindas = motor.responder(null);
  await gravar(db, id, "MAURICIO", boasVindas.texto, extraDe(boasVindas));
  return { id, token, mensagens: await mensagensDepois(db, id, token) };
}

export async function mensagensDepois(db: Database, id: string, token: string, depoisDe?: string | null) {
  const c = await conferir(db, id, token);
  const ms = await db.select().from(iaMensagens).where(depoisDe ? and(eq(iaMensagens.conversaId, id), gt(iaMensagens.createdAt, depoisDe)) : eq(iaMensagens.conversaId, id)).orderBy(asc(iaMensagens.createdAt));
  return { status: c.status, temContato: !!c.whatsapp, mensagens: ms.map(({ id: mid, autor, autorNome, texto, extra, createdAt }) => ({ id: mid, autor, autorNome, texto, extra, createdAt })) };
}

/** Mensagem do visitante: grava, e o Maurício responde, a menos que a equipe tenha assumido a conversa. */
export async function enviarDoCliente(db: Database, input: { id: string; token: string; texto?: string; atalho?: { id: string; rotulo: string }; depoisDe?: string | null }, fatos: FatosVenda, responderLivre?: (historico: { de: "cliente" | "mauricio"; texto: string }[]) => Promise<string | null>, motorParceiros?: () => Promise<MotorConversa | undefined>) {
  const c = await conferir(db, input.id, input.token);
  if (["GANHA", "PERDIDA"].includes(c.status)) throw new DomainError("ENCERRADA", "Esta conversa foi encerrada. Abra uma nova.");
  const texto = (input.atalho?.rotulo ?? input.texto ?? "").trim().slice(0, 600);
  if (!texto) throw new DomainError("VAZIA", "Escreva uma mensagem.");
  if (c.mensagens >= 120) throw new DomainError("LIMITE", "Esta conversa ficou longa. Deixe o seu WhatsApp que a equipe continua com você.");
  await gravar(db, c.id, "CLIENTE", texto, input.atalho ? { atalho: input.atalho.id } : {});
  const faixa = FAIXAS_VENDA.find((f) => f.id === input.atalho?.id);
  let assunto = c.interesse;
  if (c.status !== "HUMANO") {
    // Nas páginas /parceiros, o guia do programa responde sempre pelo motor guiado (offline, números das regras).
    const motor = (ehPaginaDeParceiros(c.pagina) && motorParceiros ? await motorParceiros() : undefined) ?? motorVenda(fatos);
    let r: RespostaVenda | null = null;
    if (input.atalho) r = motor.responder(input.atalho.id);
    else if (responderLivre && motor.guiado !== true) {
      const hist = (await db.select().from(iaMensagens).where(eq(iaMensagens.conversaId, c.id)).orderBy(desc(iaMensagens.createdAt)).limit(8)).reverse()
        .filter((m) => m.autor === "CLIENTE" || m.autor === "MAURICIO").map((m) => ({ de: m.autor === "CLIENTE" ? "cliente" as const : "mauricio" as const, texto: m.texto }));
      const livre = await responderLivre(hist).catch(() => null);
      if (livre) r = { texto: livre, atalhos: [], acoes: [{ rotulo: "Criar minha loja", href: fatos.cadastro }], assunto: "livre" };
    }
    r ??= motor.responderTexto(texto);
    if (r.assunto && !["inicio", "nao-entendi", "livre"].includes(r.assunto)) assunto = r.assunto;
    await gravar(db, c.id, "MAURICIO", r.texto, extraDe(r));
  }
  await db.update(iaConversas).set({
    status: c.status === "NOVA" ? "IA" : c.status, interesse: assunto, faturamento: faixa?.rotulo ?? c.faturamento,
    mensagens: sql`${iaConversas.mensagens} + 1`, naoLidas: sql`${iaConversas.naoLidas} + 1`, ultimaMensagem: texto.slice(0, 160), ultimaEm: agora(),
  }).where(eq(iaConversas.id, c.id));
  return mensagensDepois(db, c.id, input.token, input.depoisDe);
}

const contatoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o seu nome").max(80),
  whatsapp: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp com DDD"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160).optional().or(z.literal("").transform(() => undefined)),
});
/** Contato do visitante: vai para a conversa (CRM ao vivo) e, com e-mail, também para os interessados da marca. */
export async function salvarContato(db: Database, input: { id: string; token: string } & z.input<typeof contatoSchema>) {
  const c = await conferir(db, input.id, input.token);
  const d = contatoSchema.parse(input);
  let leadId = c.leadId;
  if (d.email) {
    const resumo = (await db.select({ t: iaMensagens.texto }).from(iaMensagens).where(and(eq(iaMensagens.conversaId, c.id), eq(iaMensagens.autor, "CLIENTE"))).orderBy(asc(iaMensagens.createdAt)).limit(6)).map((m) => m.t).join(" | ");
    leadId = (await createBrandLead(db, { brand: c.brand as BrandCode, name: d.nome.length >= 3 ? d.nome : `${d.nome} (chat)`, email: d.email, phone: d.whatsapp, message: `Chat do Maurício: ${resumo}`.slice(0, 600), segment: c.interesse ?? undefined })).id;
  }
  await db.update(iaConversas).set({ nome: d.nome, whatsapp: d.whatsapp, email: d.email ?? c.email, leadId, ultimaEm: agora(), naoLidas: sql`${iaConversas.naoLidas} + 1` }).where(eq(iaConversas.id, c.id));
  await gravar(db, c.id, "SISTEMA", `Contato recebido: ${d.nome.split(" ")[0]}. A equipe também pode falar com você pelo WhatsApp.`);
  return mensagensDepois(db, c.id, input.token);
}

// ---------------------------------------------------------------------------------------------------------------
// Master: CRM ao vivo
// ---------------------------------------------------------------------------------------------------------------
const equipe = (actor: Actor) => requireMasterFn(actor, ["COMERCIAL", "SUPORTE"]);

export async function listarConversas(db: Database, actor: Actor, filtro: { status?: Conversa["status"] | "ABERTAS"; canal?: "HOME" | "PAINEL" } = {}) {
  equipe(actor);
  const porStatus = filtro.status === "ABERTAS" ? sql`${iaConversas.status} in ('NOVA','IA','HUMANO')` : filtro.status ? eq(iaConversas.status, filtro.status) : undefined;
  // Conversas de clientes das lojas (canal LOJA) são do lojista, nunca do Master (D206).
  const where = and(porStatus, filtro.canal ? eq(iaConversas.canal, filtro.canal) : ne(iaConversas.canal, "LOJA"));
  const lista = await db.select({ id: iaConversas.id, canal: iaConversas.canal, storeId: iaConversas.storeId, status: iaConversas.status, nome: iaConversas.nome, whatsapp: iaConversas.whatsapp, interesse: iaConversas.interesse, faturamento: iaConversas.faturamento, ultimaMensagem: iaConversas.ultimaMensagem, ultimaEm: iaConversas.ultimaEm, naoLidas: iaConversas.naoLidas, responsavelNome: iaConversas.responsavelNome, mensagens: iaConversas.mensagens, createdAt: iaConversas.createdAt })
    .from(iaConversas).where(where).orderBy(desc(iaConversas.ultimaEm)).limit(150);
  const contagem = await db.select({ status: iaConversas.status, n: sql<number>`count(*)::int` }).from(iaConversas).where(ne(iaConversas.canal, "LOJA")).groupBy(iaConversas.status);
  const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
  const [h] = await db.select({ n: sql<number>`count(*)::int`, contatos: sql<number>`count(${iaConversas.whatsapp})::int` }).from(iaConversas).where(and(ne(iaConversas.canal, "LOJA"), sql`${iaConversas.createdAt} >= ${`${hoje}T03:00:00.000Z`}`));
  return { lista, contagem: Object.fromEntries(contagem.map((x) => [x.status, x.n])) as Record<string, number>, hoje: { conversas: h?.n ?? 0, contatos: h?.contatos ?? 0 } };
}

export async function abrirConversa(db: Database, actor: Actor, id: string) {
  equipe(actor);
  const c = (await db.select().from(iaConversas).where(and(eq(iaConversas.id, id), ne(iaConversas.canal, "LOJA"))).limit(1))[0];
  if (!c) throw new NotFoundError("Conversa não encontrada.");
  await db.update(iaConversas).set({ naoLidas: 0 }).where(eq(iaConversas.id, id));
  const { tokenHash: _t, ...conversa } = c; // eslint-disable-line @typescript-eslint/no-unused-vars
  const mensagens = await db.select().from(iaMensagens).where(eq(iaMensagens.conversaId, id)).orderBy(asc(iaMensagens.createdAt));
  return { conversa, mensagens };
}

export async function assumirConversa(db: Database, actor: Actor, id: string, nome: string) {
  equipe(actor);
  await db.update(iaConversas).set({ status: "HUMANO", responsavelId: actor.userId, responsavelNome: nome, ultimaEm: agora() }).where(eq(iaConversas.id, id));
  await gravar(db, id, "SISTEMA", `${nome.split(" ")[0]}, da equipe NextLevel, entrou na conversa.`);
}

export async function responderComoEquipe(db: Database, actor: Actor, id: string, texto: string, nome: string) {
  equipe(actor);
  const t = texto.trim();
  if (!t) throw new DomainError("VAZIA", "Escreva a resposta.");
  const c = (await db.select({ status: iaConversas.status, canal: iaConversas.canal, email: iaConversas.email, origem: iaConversas.origem }).from(iaConversas).where(eq(iaConversas.id, id)).limit(1))[0];
  if (!c) throw new NotFoundError("Conversa não encontrada.");
  // D300: conversa vinda de suporte@ responde por e-mail (sai antes de gravar: se o envio falhar, nada fica registrado).
  if (c.canal === "EMAIL") await enviarRespostaPorEmail(c, t);
  if (c.status !== "HUMANO") await assumirConversa(db, actor, id, nome);
  await gravar(db, id, "HUMANO", t, {}, nome.split(" ")[0]!);
  await db.update(iaConversas).set({ ultimaMensagem: `Equipe: ${t.slice(0, 150)}`, ultimaEm: agora(), mensagens: sql`${iaConversas.mensagens} + 1` }).where(eq(iaConversas.id, id));
}

export async function devolverAoMauricio(db: Database, actor: Actor, id: string) {
  equipe(actor);
  await db.update(iaConversas).set({ status: "IA", ultimaEm: agora() }).where(eq(iaConversas.id, id));
  await gravar(db, id, "SISTEMA", "O Maurício voltou a responder. A equipe continua acompanhando.");
}

export async function atualizarConversa(db: Database, actor: Actor, id: string, patch: { status?: "GANHA" | "PERDIDA" | "IA" | "HUMANO"; notas?: string }) {
  equipe(actor);
  await db.update(iaConversas).set({ ...(patch.status ? { status: patch.status } : {}), ...(patch.notas !== undefined ? { notas: patch.notas.slice(0, 2000) } : {}) }).where(eq(iaConversas.id, id));
}

/**
 * Pulso do atendimento (D205): quantas conversas da marca esperam resposta e qual chegou por último. Leve, para o
 * aviso sonoro do Master consultar a cada 15 s. Quem não é da equipe recebe nada (sem erro).
 */
export async function pulsoAtendimento(db: Database, actor: Actor, brand = "NEXTLEVEL_COMMERCE") {
  try { equipe(actor); } catch { return null; }
  const abertas = sql`${iaConversas.status} in ('NOVA','IA','HUMANO') and ${iaConversas.canal} <> 'LOJA'`;
  const [n] = await db.select({ n: sql<number>`count(*)::int` }).from(iaConversas).where(and(eq(iaConversas.brand, brand), abertas, sql`${iaConversas.naoLidas} > 0`));
  const [u] = await db.select({ id: iaConversas.id, nome: iaConversas.nome, canal: iaConversas.canal, texto: iaConversas.ultimaMensagem, em: iaConversas.ultimaEm }).from(iaConversas)
    .where(and(eq(iaConversas.brand, brand), abertas, sql`${iaConversas.naoLidas} > 0`)).orderBy(desc(iaConversas.ultimaEm)).limit(1);
  return { esperando: n?.n ?? 0, ultima: u ?? null };
}
