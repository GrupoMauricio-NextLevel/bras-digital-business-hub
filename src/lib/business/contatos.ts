import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { contatosNegocio, servicosNegocio, stores, users, CONTATO_SITUACOES, type ContatoSituacao } from "@/db/schema";
import { assertCanAccess, type Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { sendEmail } from "@/lib/email";
import { canalDe, CLICK_IDS, ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";

/**
 * Contatos e orçamentos do negócio (NextLevel Business, NB3, D309).
 * - O formulário do site grava o pedido na empresa certa (achada pelo endereço no servidor, nunca por id vindo da página).
 * - Repetição técnica (clique duplo, rede ruim) não duplica: `chaveEnvio` gerada uma vez por formulário aberto.
 * - Contra robôs: campo-isca e tempo mínimo de preenchimento (o limite por endereço fica na ação).
 * - A origem vem do que a página enviou (etiquetas, clique do anúncio, site de origem), classificada pela regra única de
 *   canais (`canalDe`); faltou informação = "direto". Nada de cookie de medição no site do lojista (D185).
 */
export const SITUACAO_ROTULO: Record<ContatoSituacao, string> = { NOVO: "Novo", EM_ATENDIMENTO: "Em atendimento", ORCAMENTO_ENVIADO: "Orçamento enviado", GANHO: "Fechou", PERDIDO: "Perdeu" };
export const MOTIVOS_PERDA = ["Achou caro", "Fechou com outro", "Não respondeu mais", "Ainda não é a hora", "Fora da região atendida", "Outro"] as const;
export const TEMPO_MINIMO_MS = 3000;

const texto = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
export const envioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o seu nome.").max(120),
  whatsapp: z.string().optional().nullable().transform((v) => (v ?? "").replace(/\D/g, "") || null).refine((d) => !d || (d.length >= 10 && d.length <= 13), "WhatsApp inválido (com DDD)."),
  email: z.string().trim().toLowerCase().max(160).optional().nullable().transform((v) => v || null).refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido."),
  servicoId: texto(40),
  mensagem: texto(1000),
  pagina: texto(120),
  /** Campo escondido: pessoa não preenche; robô costuma preencher. */
  site: texto(200),
  /** Quanto tempo o formulário ficou aberto antes do envio (ms). */
  tempoMs: z.number().int().min(0).max(86_400_000).optional(),
  chaveEnvio: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  origem: z.object({
    utm_source: texto(120), utm_medium: texto(120), utm_campaign: texto(160), utm_content: texto(160), utm_term: texto(160),
    fbclid: texto(200), gclid: texto(200), gbraid: texto(200), wbraid: texto(200), ttclid: texto(200),
    referrer: texto(300),
  }).partial().optional(),
}).refine((v) => !!v.whatsapp || !!v.email, { message: "Informe o WhatsApp ou o e-mail para a empresa responder.", path: ["whatsapp"] });

export type ResultadoEnvio = { id: string | null; novo: boolean };

/** Grava o pedido que chegou pelo site. Robô recebe "ok" sem gravar (não ensina o robô a desviar). */
export async function registrarContato(db: Database, slug: string, raw: z.input<typeof envioSchema>, opts: { hostProprio?: string | null; baseUrl?: string } = {}): Promise<ResultadoEnvio> {
  const input = envioSchema.parse(raw);
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
  if (!store || store.status === "CLOSED") throw new NotFoundError("Empresa não encontrada.");
  if (input.site || (input.tempoMs !== undefined && input.tempoMs < TEMPO_MINIMO_MS)) return { id: null, novo: false };
  const ja = await db.query.contatosNegocio.findFirst({ where: and(eq(contatosNegocio.storeId, store.id), eq(contatosNegocio.chaveEnvio, input.chaveEnvio)) });
  if (ja) return { id: ja.id, novo: false };
  const servico = input.servicoId ? await db.query.servicosNegocio.findFirst({ where: and(eq(servicosNegocio.id, input.servicoId), eq(servicosNegocio.storeId, store.id)) }) : null;
  const o = input.origem ?? {};
  const canal: Canal = canalDe({ ...o, hostProprio: opts.hostProprio ?? null });
  const clickIds = Object.fromEntries(CLICK_IDS.flatMap((k) => (o[k] ? [[k, o[k]!]] : [])));
  let origemSite: string | null = null;
  try { origemSite = o.referrer ? new URL(o.referrer).hostname.replace(/^www\./, "") : null; } catch { origemSite = null; }
  const id = newId("ctn");
  const inseridos = await db.insert(contatosNegocio).values({
    id, storeId: store.id, nome: input.nome, whatsapp: input.whatsapp, email: input.email, servicoId: servico?.id ?? null, mensagem: input.mensagem, pagina: input.pagina,
    via: "FORMULARIO", canal, utmSource: o.utm_source ?? null, utmMedium: o.utm_medium ?? null, utmCampaign: o.utm_campaign ?? null, utmContent: o.utm_content ?? null, utmTerm: o.utm_term ?? null,
    clickIds, origemSite, chaveEnvio: input.chaveEnvio,
  }).onConflictDoNothing().returning({ id: contatosNegocio.id });
  if (!inseridos.length) {
    const outro = await db.query.contatosNegocio.findFirst({ where: and(eq(contatosNegocio.storeId, store.id), eq(contatosNegocio.chaveEnvio, input.chaveEnvio)) });
    return { id: outro?.id ?? null, novo: false };
  }
  await avisarODono(db, store, { id, nome: input.nome, servico: servico?.nome ?? null, canal }, opts.baseUrl);
  return { id, novo: true };
}

/** E-mail para o dono do negócio: só o essencial (o contato completo fica no painel, não no e-mail). */
async function avisarODono(db: Database, store: typeof stores.$inferSelect, c: { id: string; nome: string; servico: string | null; canal: Canal }, baseUrl?: string) {
  try {
    const dono = await db.query.users.findFirst({ where: and(eq(users.storeId, store.id), eq(users.role, "STORE_OWNER")), orderBy: [users.createdAt] });
    const para = store.contactEmail ?? dono?.email;
    if (!para) return;
    const primeiro = c.nome.split(" ")[0] ?? c.nome;
    await sendEmail(db, {
      kind: "CONTATO_NEGOCIO", to: para, dedupeKey: `CONTATO_NEGOCIO:${c.id}`, brand: "NEXTLEVEL_COMMERCE",
      subject: `Novo pedido pelo site: ${primeiro}${c.servico ? ` · ${c.servico}` : ""}`,
      text: `${primeiro} pediu contato pelo site da ${store.name}${c.servico ? `, sobre ${c.servico}` : ""}. Veio por: ${ROTULO_CANAL[c.canal]}.\n\nResponder rápido aumenta a chance de fechar. Abra o painel para ver o pedido e responder.`,
      cta: baseUrl ? { label: "Ver o pedido no painel", url: `${baseUrl}/merchant/contatos/${c.id}` } : undefined,
    });
  } catch { /* aviso nunca derruba o pedido */ }
}

function podeVer(actor: Actor, storeId: string) {
  assertCanAccess(actor, { storeId });
  if (actor.role !== "STORE_OWNER" && actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
}

export async function listarContatos(db: Database, actor: Actor, storeId: string, filtro: { situacao?: ContatoSituacao | "ABERTOS" } = {}) {
  podeVer(actor, storeId);
  const abertos: ContatoSituacao[] = ["NOVO", "EM_ATENDIMENTO", "ORCAMENTO_ENVIADO"];
  const cond = filtro.situacao === "ABERTOS" ? inArray(contatosNegocio.situacao, abertos) : filtro.situacao ? eq(contatosNegocio.situacao, filtro.situacao) : undefined;
  const rows = await db.select().from(contatosNegocio).where(cond ? and(eq(contatosNegocio.storeId, storeId), cond) : eq(contatosNegocio.storeId, storeId)).orderBy(desc(contatosNegocio.createdAt)).limit(500);
  const servicos = new Map((await db.select({ id: servicosNegocio.id, nome: servicosNegocio.nome }).from(servicosNegocio).where(eq(servicosNegocio.storeId, storeId))).map((s) => [s.id, s.nome]));
  return rows.map((r) => ({ ...r, servicoNome: r.servicoId ? servicos.get(r.servicoId) ?? null : null }));
}

/**
 * Funil em quadro (ecossistema, Etapa 2, D337): os contatos por etapa, com a soma do valor de cada coluna. Regra pura
 * (testada); fechados e perdidos só dos últimos `dias` dias para o quadro não crescer sem fim.
 */
export function funilEmQuadro<T extends { situacao: ContatoSituacao; valorCents: number | null; updatedAt: string }>(lista: T[], agora = new Date(), dias = 30) {
  const limite = agora.getTime() - dias * 86_400_000;
  return CONTATO_SITUACOES.map((situacao) => {
    const itens = lista.filter((c) => c.situacao === situacao && (situacao === "GANHO" || situacao === "PERDIDO" ? new Date(c.updatedAt).getTime() >= limite : true));
    return { situacao, rotulo: SITUACAO_ROTULO[situacao], itens, valorCents: itens.reduce((t, c) => t + (c.valorCents ?? 0), 0) };
  });
}

export async function fichaDoContato(db: Database, actor: Actor, storeId: string, id: string) {
  podeVer(actor, storeId);
  const c = await db.query.contatosNegocio.findFirst({ where: and(eq(contatosNegocio.id, id), eq(contatosNegocio.storeId, storeId)) });
  if (!c) throw new NotFoundError("Contato não encontrado.");
  const servico = c.servicoId ? await db.query.servicosNegocio.findFirst({ where: eq(servicosNegocio.id, c.servicoId), columns: { nome: true } }) : null;
  return { ...c, servicoNome: servico?.nome ?? null };
}

export const atualizacaoSchema = z.object({
  situacao: z.enum(CONTATO_SITUACOES).optional(),
  assumir: z.boolean().optional(),
  valorCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  motivoPerda: z.enum(MOTIVOS_PERDA).nullable().optional(),
  notas: z.string().trim().max(2000).nullable().optional(),
});

/** Situação, responsável, valor, motivo e anotações. A primeira saída de "novo" marca a primeira resposta (uma vez). */
export async function atualizarContato(db: Database, actor: Actor, storeId: string, id: string, raw: z.input<typeof atualizacaoSchema>, agora = new Date()) {
  const c = await fichaDoContato(db, actor, storeId, id);
  const input = atualizacaoSchema.parse(raw);
  const mudou: Partial<typeof contatosNegocio.$inferInsert> = { updatedAt: agora.toISOString() };
  if (input.situacao) {
    mudou.situacao = input.situacao;
    if (input.situacao !== "NOVO" && !c.primeiraRespostaEm) mudou.primeiraRespostaEm = agora.toISOString();
    if (input.situacao !== "PERDIDO") mudou.motivoPerda = null;
  }
  if (input.motivoPerda !== undefined) mudou.motivoPerda = input.motivoPerda;
  if (input.valorCents !== undefined) mudou.valorCents = input.valorCents;
  if (input.notas !== undefined) mudou.notas = input.notas || null;
  if (input.assumir || (input.situacao && input.situacao !== "NOVO" && !c.responsavelId)) {
    const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
    mudou.responsavelId = actor.userId; mudou.responsavelNome = u?.name ?? null;
    if (!c.primeiraRespostaEm && !mudou.primeiraRespostaEm) mudou.primeiraRespostaEm = agora.toISOString();
  }
  await db.update(contatosNegocio).set(mudou).where(eq(contatosNegocio.id, id));
  await recordAudit(db, actor, { action: "CONTATO_ATUALIZADO", entityType: "contato_negocio", entityId: id, storeId, before: { situacao: c.situacao }, after: { situacao: mudou.situacao ?? c.situacao, valorCents: mudou.valorCents, motivoPerda: mudou.motivoPerda } });
}

export const manualSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  whatsapp: z.string().optional().nullable().transform((v) => (v ?? "").replace(/\D/g, "") || null),
  servicoId: texto(40),
  mensagem: texto(1000),
  via: z.enum(["WHATSAPP_CONFIRMADO", "MANUAL"]).default("MANUAL"),
});
/** Contato que chegou por fora do site (WhatsApp, telefone, balcão), lançado pela equipe. Já entra "em atendimento". */
export async function registrarContatoManual(db: Database, actor: Actor, storeId: string, raw: z.input<typeof manualSchema>, agora = new Date()) {
  podeVer(actor, storeId);
  const input = manualSchema.parse(raw);
  const servico = input.servicoId ? await db.query.servicosNegocio.findFirst({ where: and(eq(servicosNegocio.id, input.servicoId), eq(servicosNegocio.storeId, storeId)) }) : null;
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
  const id = newId("ctn");
  await db.insert(contatosNegocio).values({ id, storeId, nome: input.nome, whatsapp: input.whatsapp, servicoId: servico?.id ?? null, mensagem: input.mensagem, via: input.via, situacao: "EM_ATENDIMENTO", canal: input.via === "WHATSAPP_CONFIRMADO" ? "whatsapp" : "direto", responsavelId: actor.userId, responsavelNome: u?.name ?? null, primeiraRespostaEm: agora.toISOString() });
  await recordAudit(db, actor, { action: "CONTATO_MANUAL", entityType: "contato_negocio", entityId: id, storeId });
  return { id };
}

/** Números do painel: novos sem resposta, abertos, fechados no período e o tempo mediano até a primeira resposta. */
export async function resumoDosContatos(db: Database, storeId: string, dias = 30, agora = new Date()) {
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const rows = await db.select({ situacao: contatosNegocio.situacao, criado: contatosNegocio.createdAt, resp: contatosNegocio.primeiraRespostaEm, canal: contatosNegocio.canal, valor: contatosNegocio.valorCents, via: contatosNegocio.via })
    .from(contatosNegocio).where(and(eq(contatosNegocio.storeId, storeId), gte(contatosNegocio.createdAt, desde)));
  const novos = rows.filter((r) => r.situacao === "NOVO").length;
  const abertos = rows.filter((r) => ["NOVO", "EM_ATENDIMENTO", "ORCAMENTO_ENVIADO"].includes(r.situacao)).length;
  const ganhos = rows.filter((r) => r.situacao === "GANHO");
  const tempos = rows.filter((r) => r.resp && r.via === "FORMULARIO").map((r) => new Date(r.resp!).getTime() - new Date(r.criado).getTime()).sort((a, b) => a - b);
  const mediana = tempos.length ? tempos[Math.floor((tempos.length - 1) / 2)]! : null;
  const porCanal = Object.entries(rows.reduce<Record<string, number>>((acc, r) => { acc[r.canal] = (acc[r.canal] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  return { total: rows.length, novos, abertos, ganhos: ganhos.length, valorGanhoCents: ganhos.reduce((s, r) => s + (r.valor ?? 0), 0), medianaRespostaMs: mediana, porCanal };
}

/** Texto curto de duração ("12 min", "3 h", "2 dias"). */
export function duracao(ms: number | null): string {
  if (ms === null) return "sem dados ainda";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} dias`;
}
