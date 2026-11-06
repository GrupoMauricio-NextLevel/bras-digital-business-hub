import { and, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import {
  nlSubscriptions, partnerActivities, partnerChallenges, partnerCommissions, partnerLinks, partnerNotices, partnerPayouts, partnerProfiles,
  partnerTierHistory, partners, platformSettings, stores, users, PARTNER_STAGES, type PartnerStage, type PartnerTier,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { isMaster, requireMasterFn, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { periodOf } from "./finance";

/**
 * CRM de parceiros do Master (D251, fase PV3): funil em colunas, ficha 360, fila, ranking, segmentos, aviso em massa e
 * desafio do mês. Cada bloco da tela sai de poucas consultas agrupadas (nada de consulta por parceiro no quadro).
 */
const DIA = 86_400_000;
const need = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel."); };
const NOVO_CLIENTE = ["SALE", "SETUP"] as const;
const VENDA = ["SALE", "RECURRING", "SETUP", "MAINTENANCE"] as const;

export const ETAPAS: { key: PartnerStage; nome: string; dica: string }[] = [
  { key: "CANDIDATO", nome: "Candidato", dica: "Pediu para entrar" },
  { key: "EM_ANALISE", nome: "Em análise", dica: "A equipe está avaliando" },
  { key: "APROVADO", nome: "Aprovado", dica: "Pronto para começar" },
  { key: "ATIVANDO", nome: "Ativando", dica: "Ainda sem a 1ª venda" },
  { key: "PRODUTIVO", nome: "Produtivo", dica: "Trouxe cliente nos últimos 30 dias" },
  { key: "EM_RISCO", nome: "Em risco", dica: "30 dias sem trazer cliente" },
  { key: "INATIVO", nome: "Inativo", dica: "Cadastro inativo" },
  { key: "DESLIGADO", nome: "Desligado", dica: "Suspenso pela NextLevel" },
];
const INICIAIS: PartnerStage[] = ["CANDIDATO", "EM_ANALISE", "APROVADO", "ATIVANDO"];

/** Etapa do parceiro: suspenso e inativo mandam; depois a etapa manual (as iniciais só até a 1ª venda); senão, o cálculo. */
export function etapaDe(p: { status: string; manualStage: PartnerStage | null; ultimoClienteEm: string | null }, now = new Date()): PartnerStage {
  if (p.status === "SUSPENDED") return "DESLIGADO";
  if (p.status === "INACTIVE") return "INATIVO";
  if (p.manualStage && !(INICIAIS.includes(p.manualStage) && p.ultimoClienteEm)) return p.manualStage;
  if (!p.ultimoClienteEm) return "ATIVANDO";
  return now.getTime() - new Date(p.ultimoClienteEm).getTime() <= 30 * DIA ? "PRODUTIVO" : "EM_RISCO";
}

/**
 * Saúde de 0 a 100: recência do último cliente (40), conversão dos indicados em pagantes (30), retenção dos que já
 * pagaram (20) e nada em revisão de antifraude (10).
 */
export function saudeDe(x: { ultimoClienteEm: string | null; indicados: number; ativos: number; cancelados: number; revisao: number }, now = new Date()): number {
  const dias = x.ultimoClienteEm ? (now.getTime() - new Date(x.ultimoClienteEm).getTime()) / DIA : Infinity;
  const recencia = dias <= 30 ? 40 : dias <= 60 ? 25 : dias <= 90 ? 10 : 0;
  const conversao = x.indicados ? Math.round(30 * Math.min(1, x.ativos / x.indicados)) : 0;
  const pagaram = x.ativos + x.cancelados;
  const retencao = pagaram ? Math.round(20 * (x.ativos / pagaram)) : 0;
  return recencia + conversao + retencao + (x.revisao ? 0 : 10);
}

export const filtroSchema = z.object({
  q: z.string().trim().max(80).optional(),
  kind: z.string().max(20).optional(),
  tier: z.string().max(20).optional(),
  etapa: z.string().max(20).optional(),
  region: z.string().trim().max(60).optional(),
  owner: z.string().max(40).optional(),
});
export type Filtro = z.infer<typeof filtroSchema>;

export type CartaoParceiro = {
  id: string; nome: string; codigo: string; kind: string; tier: PartnerTier; status: string; telefone: string; etapa: PartnerStage; manual: boolean;
  ativos: number; indicados: number; ativacoesMes: number; receitaMesCents: number; aPagarCents: number; saude: number;
  ultimoClienteEm: string | null; ultimaAtividadeEm: string | null; proximaAcao: string | null; proximaAcaoEm: string | null;
  regiao: string | null; donoId: string | null; donoNome: string | null; criadoEm: string; revisao: number;
};

/** Todos os parceiros com os números do quadro, em consultas agrupadas. */
export async function cartoesDeParceiros(db: Database, actor: Actor, now = new Date()): Promise<CartaoParceiro[]> {
  need(actor);
  const periodo = periodOf(now);
  const [lista, perfis, indic, ativos, cancel, revisao, mes, aberto, ultimo, ultAtiv, tarefas, donos] = await Promise.all([
    db.select().from(partners),
    db.select().from(partnerProfiles),
    db.select({ id: stores.partnerId, n: sql<number>`count(*)::int` }).from(stores).where(sql`${stores.partnerId} is not null`).groupBy(stores.partnerId),
    db.select({ id: stores.partnerId, n: sql<number>`count(*)::int` }).from(stores).innerJoin(nlSubscriptions, eq(nlSubscriptions.storeId, stores.id)).where(and(sql`${stores.partnerId} is not null`, isNull(stores.attributionFlag), eq(nlSubscriptions.status, "active"))).groupBy(stores.partnerId),
    db.select({ id: stores.partnerId, n: sql<number>`count(*)::int` }).from(stores).innerJoin(nlSubscriptions, eq(nlSubscriptions.storeId, stores.id)).where(and(sql`${stores.partnerId} is not null`, inArray(nlSubscriptions.status, ["cancelled", "expired", "suspended"]))).groupBy(stores.partnerId),
    db.select({ id: stores.partnerId, n: sql<number>`count(*)::int` }).from(stores).where(eq(stores.attributionFlag, "FRAUD_REVIEW")).groupBy(stores.partnerId),
    db.select({ id: partnerCommissions.partnerId, base: sql<number>`coalesce(sum(${partnerCommissions.baseCents}), 0)::int`, novos: sql<number>`count(*) filter (where ${partnerCommissions.kind} in ('SALE','SETUP'))::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.period, periodo), inArray(partnerCommissions.kind, [...VENDA]), ne(partnerCommissions.status, "VOID"))).groupBy(partnerCommissions.partnerId),
    db.select({ id: partnerCommissions.partnerId, s: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(inArray(partnerCommissions.status, ["PENDING", "AVAILABLE"])).groupBy(partnerCommissions.partnerId),
    db.select({ id: partnerCommissions.partnerId, em: sql<string>`max(${partnerCommissions.createdAt})` }).from(partnerCommissions).where(and(inArray(partnerCommissions.kind, [...NOVO_CLIENTE]), ne(partnerCommissions.status, "VOID"))).groupBy(partnerCommissions.partnerId),
    db.select({ id: partnerActivities.partnerId, em: sql<string>`max(${partnerActivities.createdAt})` }).from(partnerActivities).groupBy(partnerActivities.partnerId),
    db.select({ id: partnerActivities.partnerId, texto: partnerActivities.text, em: partnerActivities.dueAt }).from(partnerActivities).where(and(eq(partnerActivities.kind, "TAREFA"), isNull(partnerActivities.doneAt))).orderBy(partnerActivities.dueAt),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "NEXTLEVEL_MASTER")),
  ]);
  const m = <T extends { id: string | null }>(rows: T[]) => new Map(rows.map((r) => [r.id ?? "", r]));
  const [mPerfil, mInd, mAt, mCan, mRev, mMes, mAb, mUlt, mAtiv] = [new Map(perfis.map((p) => [p.partnerId, p])), m(indic), m(ativos), m(cancel), m(revisao), m(mes), m(aberto), m(ultimo), m(ultAtiv)];
  const proxTarefa = new Map<string, { texto: string; em: string | null }>();
  for (const t of tarefas) if (!proxTarefa.has(t.id)) proxTarefa.set(t.id, { texto: t.texto, em: t.em });
  const nomeDono = new Map(donos.map((d) => [d.id, d.name]));
  return lista.map((p) => {
    const pf = mPerfil.get(p.id);
    const ultimoClienteEm = mUlt.get(p.id)?.em ? new Date(mUlt.get(p.id)!.em).toISOString() : null;
    const x = { indicados: Number(mInd.get(p.id)?.n ?? 0), ativos: Number(mAt.get(p.id)?.n ?? 0), cancelados: Number(mCan.get(p.id)?.n ?? 0), revisao: Number(mRev.get(p.id)?.n ?? 0) };
    const tarefa = proxTarefa.get(p.id);
    const proxEm = pf?.nextActionAt ?? tarefa?.em ?? null;
    return {
      id: p.id, nome: p.displayName, codigo: p.code, kind: p.kind, tier: p.tier, status: p.status, telefone: p.phone,
      etapa: etapaDe({ status: p.status, manualStage: pf?.manualStage ?? null, ultimoClienteEm }, now), manual: !!pf?.manualStage,
      ...x, ativacoesMes: Number(mMes.get(p.id)?.novos ?? 0), receitaMesCents: Number(mMes.get(p.id)?.base ?? 0), aPagarCents: Number(mAb.get(p.id)?.s ?? 0),
      saude: saudeDe({ ultimoClienteEm, ...x }, now), ultimoClienteEm,
      ultimaAtividadeEm: mAtiv.get(p.id)?.em ? new Date(mAtiv.get(p.id)!.em).toISOString() : null,
      proximaAcao: pf?.nextAction ?? tarefa?.texto ?? null, proximaAcaoEm: proxEm ? new Date(proxEm).toISOString() : null,
      regiao: pf?.region ?? null, donoId: pf?.ownerUserId ?? null, donoNome: pf?.ownerUserId ? nomeDono.get(pf.ownerUserId) ?? null : null,
      criadoEm: new Date(p.createdAt).toISOString(),
    };
  });
}

export function filtrar(cartoes: CartaoParceiro[], f: Filtro): CartaoParceiro[] {
  const q = f.q?.toLowerCase();
  return cartoes.filter((c) => (!q || c.nome.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q))
    && (!f.kind || c.kind === f.kind) && (!f.tier || c.tier === f.tier) && (!f.etapa || c.etapa === f.etapa)
    && (!f.region || (c.regiao ?? "").toLowerCase().includes(f.region.toLowerCase())) && (!f.owner || c.donoId === f.owner));
}

/** Ranking do mês por trilha: clientes novos no mês, depois receita gerada. */
export function ranking(cartoes: CartaoParceiro[]): Record<string, CartaoParceiro[]> {
  const out: Record<string, CartaoParceiro[]> = {};
  for (const c of cartoes.filter((x) => x.status === "ACTIVE")) (out[c.kind] ??= []).push(c);
  for (const k of Object.keys(out)) out[k] = out[k]!.sort((a, b) => b.ativacoesMes - a.ativacoesMes || b.receitaMesCents - a.receitaMesCents).slice(0, 10);
  return out;
}

export type ItemFila = { id: string; titulo: string; detalhe: string; tom: "warning" | "danger" | "info"; partnerId: string };
/** Fila ampliada do CRM: tarefas vencidas, ativando há mais de 14 dias, em risco e candidatos parados há mais de 48 h. */
export function filaDoCrm(cartoes: CartaoParceiro[], now = new Date()): ItemFila[] {
  const out: ItemFila[] = [];
  for (const c of cartoes) {
    if (c.proximaAcaoEm && new Date(c.proximaAcaoEm) <= now) out.push({ id: `acao-${c.id}`, titulo: `${c.nome}: ${c.proximaAcao ?? "próxima ação"}`, detalhe: "Ação marcada para hoje ou atrasada.", tom: "danger", partnerId: c.id });
    if (c.etapa === "ATIVANDO" && now.getTime() - new Date(c.criadoEm).getTime() > 14 * DIA) out.push({ id: `ativ-${c.id}`, titulo: `${c.nome} ainda sem a 1ª venda`, detalhe: "Mais de 14 dias de cadastro: ligue e ensine o caminho.", tom: "warning", partnerId: c.id });
    if (c.etapa === "EM_RISCO") out.push({ id: `risco-${c.id}`, titulo: `${c.nome} entrou em risco`, detalhe: "30 dias sem trazer cliente novo.", tom: "warning", partnerId: c.id });
    if ((c.etapa === "CANDIDATO" || c.etapa === "EM_ANALISE") && now.getTime() - new Date(c.criadoEm).getTime() > 2 * DIA) out.push({ id: `cand-${c.id}`, titulo: `${c.nome} esperando análise`, detalhe: "Candidato parado há mais de 48 h.", tom: "info", partnerId: c.id });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Ficha 360
// ---------------------------------------------------------------------------------------------------------------------
export type EventoLinha = { em: string; tipo: string; texto: string };
export async function fichaDoParceiro(db: Database, actor: Actor, partnerId: string, now = new Date()) {
  need(actor);
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  const [perfil, atividades, niveis, comissoes, saques, links, lojas, porMes, dono] = await Promise.all([
    db.query.partnerProfiles.findFirst({ where: eq(partnerProfiles.partnerId, p.id) }),
    db.select().from(partnerActivities).where(eq(partnerActivities.partnerId, p.id)).orderBy(desc(partnerActivities.createdAt)).limit(100),
    db.select().from(partnerTierHistory).where(eq(partnerTierHistory.partnerId, p.id)).orderBy(desc(partnerTierHistory.at)).limit(20),
    db.select({ kind: partnerCommissions.kind, amount: partnerCommissions.amountCents, em: partnerCommissions.createdAt, note: partnerCommissions.note }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), inArray(partnerCommissions.kind, ["SALE", "SETUP", "BONUS"]), ne(partnerCommissions.status, "VOID"))).orderBy(desc(partnerCommissions.createdAt)).limit(30),
    db.select().from(partnerPayouts).where(eq(partnerPayouts.partnerId, p.id)).orderBy(desc(partnerPayouts.requestedAt)).limit(10),
    db.select({ label: partnerLinks.label, em: partnerLinks.createdAt, clicks: partnerLinks.clicks }).from(partnerLinks).where(eq(partnerLinks.partnerId, p.id)),
    db.select({ id: stores.id, name: stores.name, em: stores.attributedAt, flag: stores.attributionFlag, sub: nlSubscriptions.status }).from(stores).leftJoin(nlSubscriptions, eq(nlSubscriptions.storeId, stores.id)).where(eq(stores.partnerId, p.id)),
    db.select({ periodo: partnerCommissions.period, s: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), ne(partnerCommissions.status, "VOID"), inArray(partnerCommissions.kind, ["SALE", "RECURRING", "SETUP", "MAINTENANCE", "BONUS", "ADJUSTMENT", "MANUAL", "CLAWBACK"]))).groupBy(partnerCommissions.period).orderBy(desc(partnerCommissions.period)).limit(6),
    db.query.users.findFirst({ where: eq(users.id, p.userId), columns: { email: true } }),
  ]);
  const situacao = (s: string | null, flag: string | null) => flag ? "Em revisão" : s === "active" ? "Pagante" : s === "trial" ? "Em teste" : s === "past_due" || s === "pending_payment" ? "Atrasada" : s ? "Cancelada" : "Sem plano";
  const linha: EventoLinha[] = [
    { em: new Date(p.createdAt).toISOString(), tipo: "Cadastro", texto: `Entrou como ${p.kind}` },
    ...niveis.map((n) => ({ em: new Date(n.at).toISOString(), tipo: "Nível", texto: `${n.fromTier} → ${n.toTier}${n.reason ? ` · ${n.reason}` : ""}` })),
    ...comissoes.map((c) => ({ em: new Date(c.em).toISOString(), tipo: c.kind === "BONUS" ? "Bônus" : "Venda", texto: `${(c.amount / 100).toFixed(2).replace(".", ",")} · ${c.note ?? ""}` })),
    ...saques.map((s) => ({ em: new Date(s.requestedAt).toISOString(), tipo: "Saque", texto: `${(s.amountCents / 100).toFixed(2).replace(".", ",")} · ${s.status}` })),
    ...links.map((l) => ({ em: new Date(l.em).toISOString(), tipo: "Link", texto: `${l.label} (${l.clicks} cliques)` })),
    ...atividades.map((a) => ({ em: new Date(a.createdAt).toISOString(), tipo: a.kind === "NOTA" ? "Nota" : a.kind === "LIGACAO" ? "Ligação" : a.kind === "TAREFA" ? "Tarefa" : "Mensagem", texto: a.text })),
  ].sort((a, b) => b.em.localeCompare(a.em));
  const indicados = lojas.map((l) => ({ id: l.id, nome: l.name, em: l.em ? new Date(l.em).toISOString() : null, situacao: situacao(l.sub, l.flag) }));
  return {
    parceiro: { id: p.id, nome: p.displayName, codigo: p.code, kind: p.kind, tier: p.tier, status: p.status, telefone: p.phone, email: dono?.email ?? "" },
    perfil: { region: perfil?.region ?? "", channels: perfil?.channels ?? "", followers: perfil?.followers ?? null, ownerUserId: perfil?.ownerUserId ?? "", manualStage: perfil?.manualStage ?? null, nextAction: perfil?.nextAction ?? "", nextActionAt: perfil?.nextActionAt ? new Date(perfil.nextActionAt).toISOString() : null },
    linha: linha.slice(0, 60), indicados, porMes: porMes.map((r) => ({ periodo: r.periodo, cents: Number(r.s) })),
    tarefas: atividades.filter((a) => a.kind === "TAREFA").map((a) => ({ id: a.id, texto: a.text, em: a.dueAt ? new Date(a.dueAt).toISOString() : null, feita: !!a.doneAt })),
    notas: atividades.filter((a) => a.kind !== "TAREFA").map((a) => ({ id: a.id, kind: a.kind, texto: a.text, em: new Date(a.createdAt).toISOString() })),
    agora: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Ações do Master
// ---------------------------------------------------------------------------------------------------------------------
const MASTER_CRM = ["COMERCIAL", "FINANCEIRO"] as const;
async function existe(db: Database, partnerId: string) {
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId), columns: { id: true } });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
}
async function upsertPerfil(db: Database, partnerId: string, patch: Partial<typeof partnerProfiles.$inferInsert>) {
  await db.insert(partnerProfiles).values({ partnerId, ...patch }).onConflictDoUpdate({ target: partnerProfiles.partnerId, set: { ...patch, updatedAt: new Date().toISOString() } });
}

/** Move no funil (arrastar). `null` volta ao cálculo automático. */
export async function moverEtapa(db: Database, actor: Actor, partnerId: string, etapa: PartnerStage | null) {
  requireMasterFn(actor, [...MASTER_CRM]);
  if (etapa && !PARTNER_STAGES.includes(etapa)) throw new DomainError("ETAPA", "Etapa inválida.");
  if (etapa === "INATIVO" || etapa === "DESLIGADO") throw new DomainError("ETAPA", "Inativo e desligado mudam pela situação do parceiro (ativar, inativar ou suspender).");
  await existe(db, partnerId);
  await upsertPerfil(db, partnerId, { manualStage: etapa });
  await db.insert(partnerActivities).values({ id: newId("pac"), partnerId, kind: "NOTA", text: etapa ? `Movido para ${ETAPAS.find((e) => e.key === etapa)!.nome}` : "Etapa volta ao cálculo automático", authorUserId: actor.userId });
}

const perfilSchema = z.object({
  region: z.string().trim().max(60).optional(), channels: z.string().trim().max(200).optional(), followers: z.number().int().min(0).max(1e9).nullable().optional(),
  ownerUserId: z.string().max(40).nullable().optional(), nextAction: z.string().trim().max(160).optional(), nextActionAt: z.string().datetime().nullable().optional(),
});
export async function salvarPerfilParceiro(db: Database, actor: Actor, partnerId: string, raw: unknown) {
  requireMasterFn(actor, [...MASTER_CRM]);
  const v = perfilSchema.parse(raw);
  await existe(db, partnerId);
  if (v.ownerUserId) {
    const u = await db.query.users.findFirst({ where: and(eq(users.id, v.ownerUserId), eq(users.role, "NEXTLEVEL_MASTER")), columns: { id: true } });
    if (!u) throw new DomainError("DONO", "Escolha alguém da equipe NextLevel.");
  }
  await upsertPerfil(db, partnerId, { region: v.region || null, channels: v.channels || null, followers: v.followers ?? null, ownerUserId: v.ownerUserId || null, nextAction: v.nextAction || null, nextActionAt: v.nextActionAt ?? null });
}

const atividadeSchema = z.object({ kind: z.enum(["NOTA", "LIGACAO", "TAREFA"]), text: z.string().trim().min(2, "Escreva a nota.").max(500), dueAt: z.string().datetime().nullable().optional() });
export async function registrarAtividade(db: Database, actor: Actor, partnerId: string, raw: unknown) {
  requireMasterFn(actor, [...MASTER_CRM, "SUPORTE"]);
  const v = atividadeSchema.parse(raw);
  if (v.kind === "TAREFA" && !v.dueAt) throw new DomainError("DATA", "Escolha a data da tarefa.");
  await existe(db, partnerId);
  const id = newId("pac");
  await db.insert(partnerActivities).values({ id, partnerId, kind: v.kind, text: v.text, dueAt: v.kind === "TAREFA" ? v.dueAt! : null, authorUserId: actor.userId });
  return id;
}
export async function concluirTarefa(db: Database, actor: Actor, activityId: string, now = new Date()) {
  requireMasterFn(actor, [...MASTER_CRM, "SUPORTE"]);
  const r = await db.update(partnerActivities).set({ doneAt: now.toISOString() }).where(and(eq(partnerActivities.id, activityId), eq(partnerActivities.kind, "TAREFA"), isNull(partnerActivities.doneAt))).returning({ id: partnerActivities.id });
  if (!r.length) throw new NotFoundError("Tarefa não encontrada ou já feita.");
}

// Segmentos salvos (filtros com nome), numa configuração só.
const SEG_KEY = "parceiros.segmentos";
export type Segmento = { id: string; nome: string; filtro: Filtro };
export async function segmentos(db: Database): Promise<Segmento[]> {
  const r = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, SEG_KEY) });
  const p = z.array(z.object({ id: z.string(), nome: z.string(), filtro: filtroSchema })).safeParse(r?.value);
  return p.success ? p.data : [];
}
export async function salvarSegmento(db: Database, actor: Actor, nome: string, filtro: Filtro) {
  requireMasterFn(actor, [...MASTER_CRM]);
  const n = nome.trim();
  if (n.length < 3 || n.length > 60) throw new DomainError("NOME", "Dê um nome de 3 a 60 letras ao segmento.");
  const lista = [...(await segmentos(db)).filter((s) => s.nome !== n), { id: newId("seg"), nome: n, filtro: filtroSchema.parse(filtro) }].slice(-20);
  await db.insert(platformSettings).values({ key: SEG_KEY, value: lista, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: lista, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  return lista;
}
export async function removerSegmento(db: Database, actor: Actor, id: string) {
  requireMasterFn(actor, [...MASTER_CRM]);
  const lista = (await segmentos(db)).filter((s) => s.id !== id);
  await db.insert(platformSettings).values({ key: SEG_KEY, value: lista, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: lista, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
}

/** Aviso em massa: vai para o painel de cada parceiro do segmento (e fica na linha do tempo de cada um). */
export async function avisarSegmento(db: Database, actor: Actor, filtro: Filtro, titulo: string, texto: string, now = new Date()) {
  requireMasterFn(actor, [...MASTER_CRM]);
  const t = titulo.trim(), b = texto.trim();
  if (t.length < 3 || t.length > 80) throw new DomainError("TITULO", "Título de 3 a 80 letras.");
  if (b.length < 5 || b.length > 600) throw new DomainError("TEXTO", "Mensagem de 5 a 600 letras.");
  const alvo = filtrar(await cartoesDeParceiros(db, actor, now), filtroSchema.parse(filtro)).filter((c) => c.status !== "SUSPENDED");
  if (!alvo.length) throw new DomainError("VAZIO", "Nenhum parceiro neste segmento.");
  const id = newId("pnt");
  await db.insert(partnerNotices).values({ id, title: t, body: b, partnerIds: alvo.map((c) => c.id), segment: JSON.stringify(filtro), createdBy: actor.userId });
  await db.insert(partnerActivities).values(alvo.map((c) => ({ id: newId("pac"), partnerId: c.id, kind: "MENSAGEM" as const, text: `Aviso: ${t}`, authorUserId: actor.userId })));
  return { id, enviados: alvo.length };
}

/** Avisos que o parceiro vê no painel (últimos 45 dias). */
export async function avisosDoParceiro(db: Database, partnerId: string, now = new Date()) {
  const desde = new Date(now.getTime() - 45 * DIA).toISOString();
  return db.select({ id: partnerNotices.id, title: partnerNotices.title, body: partnerNotices.body, createdAt: partnerNotices.createdAt }).from(partnerNotices)
    .where(and(gte(partnerNotices.createdAt, desde), sql`${partnerNotices.partnerIds} @> ${JSON.stringify([partnerId])}::jsonb`)).orderBy(desc(partnerNotices.createdAt)).limit(5);
}

// ---------------------------------------------------------------------------------------------------------------------
// Desafio do mês
// ---------------------------------------------------------------------------------------------------------------------
const desafioSchema = z.object({
  title: z.string().trim().min(5).max(80), period: z.string().regex(/^\d{4}-\d{2}$/), target: z.number().int().min(1).max(500),
  /** D260: o desafio é reconhecimento (ranking e destaque), sem dinheiro. */
  bonusCents: z.number().int().min(0).max(0).default(0), kinds: z.array(z.string()).max(5).default([]),
});
export async function criarDesafio(db: Database, actor: Actor, raw: unknown) {
  requireMasterFn(actor, ["FINANCEIRO", "COMERCIAL"]);
  const v = desafioSchema.parse(raw);
  const id = newId("pch");
  await db.insert(partnerChallenges).values({ id, ...v, createdBy: actor.userId });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "PARTNER_CHALLENGE_CREATED", entityType: "partner_challenge", entityId: id, after: v });
  return id;
}
export async function encerrarDesafio(db: Database, actor: Actor, id: string) {
  requireMasterFn(actor, ["FINANCEIRO", "COMERCIAL"]);
  await db.update(partnerChallenges).set({ active: false }).where(eq(partnerChallenges.id, id));
}
export async function listarDesafios(db: Database) {
  return db.select().from(partnerChallenges).orderBy(desc(partnerChallenges.period), desc(partnerChallenges.createdAt)).limit(24);
}

/** Clientes novos (1ª venda paga) do parceiro no mês. */
async function novosNoMes(db: Database, periodo: string) {
  const rows = await db.select({ id: partnerCommissions.partnerId, n: sql<number>`count(*)::int` }).from(partnerCommissions)
    .where(and(eq(partnerCommissions.period, periodo), inArray(partnerCommissions.kind, [...NOVO_CLIENTE]), ne(partnerCommissions.status, "VOID"))).groupBy(partnerCommissions.partnerId);
  return new Map(rows.map((r) => [r.id, Number(r.n)]));
}

/** Progresso do parceiro nos desafios ativos do mês (para o painel dele). */
export async function desafiosDoParceiro(db: Database, partnerId: string, now = new Date()) {
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId), columns: { kind: true } });
  if (!p) return [];
  const periodo = periodOf(now);
  const ds = (await db.select().from(partnerChallenges).where(and(eq(partnerChallenges.period, periodo), eq(partnerChallenges.active, true)))).filter((d) => !d.kinds.length || d.kinds.includes(p.kind));
  const feitos = (await novosNoMes(db, periodo)).get(partnerId) ?? 0;
  return ds.map((d) => ({ id: d.id, title: d.title, target: d.target, bonusCents: d.bonusCents, feitos: Math.min(feitos, d.target), batido: feitos >= d.target }));
}

/** Rotina diária: paga o bônus de quem bateu o desafio do mês (uma vez por desafio e parceiro). */
export async function pagarDesafios(db: Database, now = new Date()) {
  const periodo = periodOf(now);
  const ds = await db.select().from(partnerChallenges).where(and(eq(partnerChallenges.period, periodo), eq(partnerChallenges.active, true)));
  if (!ds.length) return 0;
  const novos = await novosNoMes(db, periodo);
  const kinds = new Map((await db.select({ id: partners.id, kind: partners.kind, status: partners.status }).from(partners)).map((p) => [p.id, p]));
  let pagos = 0;
  for (const d of ds) for (const [partnerId, n] of novos) {
    const p = kinds.get(partnerId);
    if (!p || p.status !== "ACTIVE" || n < d.target || (d.kinds.length && !d.kinds.includes(p.kind))) continue;
    const r = await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId, kind: "BONUS", amountCents: d.bonusCents, period: periodo, status: "PENDING", availableAt: now.toISOString(), note: `Desafio do mês: ${d.title}`, dedupeKey: `DESAFIO:${d.id}:${partnerId}` }).onConflictDoNothing().returning({ id: partnerCommissions.id });
    if (r.length) pagos++;
  }
  return pagos;
}

/** Pessoas da equipe NextLevel (para "dono interno"). */
export async function equipeNextLevel(db: Database) {
  return db.select({ id: users.id, name: users.name }).from(users).where(and(eq(users.role, "NEXTLEVEL_MASTER"), isNull(users.disabledAt)));
}

/** CSV do segmento (para planilha). */
export function csvDoSegmento(cartoes: CartaoParceiro[]): string {
  const q = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const nomeEtapa = (e: PartnerStage) => ETAPAS.find((x) => x.key === e)?.nome ?? e;
  return [["codigo", "nome", "tipo", "nivel", "etapa", "clientes_ativos", "indicados", "novos_no_mes", "receita_mes_centavos", "a_pagar_centavos", "saude", "regiao", "dono_interno", "proxima_acao"].join(","),
    ...cartoes.map((c) => [q(c.codigo), q(c.nome), q(c.kind), q(c.tier), q(nomeEtapa(c.etapa)), c.ativos, c.indicados, c.ativacoesMes, c.receitaMesCents, c.aPagarCents, c.saude, q(c.regiao), q(c.donoNome), q(c.proximaAcao)].join(","))].join("\n");
}
