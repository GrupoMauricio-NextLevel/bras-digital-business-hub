import { and, asc, count, desc, eq, gte, inArray, isNull, lt, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdAccessGrants, bdAppointments, bdImporters, bdMembers, bdSupportMessages, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { BRAS_PLAN_LABEL, brasPlanForChannel, brasPlanRank, brasSupportFor, getBrasRules, type BrasMemberPlan, type BrasRules, type BrasSupportChannel } from "./regras";

/**
 * Suporte da Brás por plano (D108). Grátis: perguntas frequentes. Prata: chat e WhatsApp. Ouro e Platinum: + agenda
 * pessoal na importadora. Os canais e os limites vêm das regras do Master; o plano vem da liberação ativa (concedida
 * pelo Master até a cobrança dos planos entrar pelo Financeiro Master). Tudo conferido no servidor.
 */

/** Plano vigente do membro: o maior entre as liberações ativas; sem liberação, Grátis. */
export async function brasMemberPlan(db: Database, memberId: string, now = new Date()): Promise<{ plan: BrasMemberPlan; validUntil: string | null }> {
  const rows = await db.select({ plan: bdAccessGrants.plan, validUntil: bdAccessGrants.validUntil }).from(bdAccessGrants)
    .where(and(eq(bdAccessGrants.memberId, memberId), isNull(bdAccessGrants.revokedAt), gte(bdAccessGrants.validUntil, now.toISOString())));
  if (!rows.length) return { plan: "GRATIS", validUntil: null };
  const best = rows.reduce((a, b) => (brasPlanRank(b.plan) > brasPlanRank(a.plan) || (b.plan === a.plan && b.validUntil > a.validUntil) ? b : a));
  return { plan: best.plan, validUntil: new Date(best.validUntil).toISOString() };
}

/** Planos de todos os membros de uma vez (para a lista do Master). */
export async function brasMemberPlans(db: Database, actor: Actor, now = new Date()): Promise<Record<string, BrasMemberPlan>> {
  requireMaster(actor);
  const rows = await db.select({ memberId: bdAccessGrants.memberId, plan: bdAccessGrants.plan }).from(bdAccessGrants)
    .where(and(isNull(bdAccessGrants.revokedAt), gte(bdAccessGrants.validUntil, now.toISOString())));
  const out: Record<string, BrasMemberPlan> = {};
  for (const r of rows) if (!out[r.memberId] || brasPlanRank(r.plan) > brasPlanRank(out[r.memberId]!)) out[r.memberId] = r.plan;
  return out;
}

async function myMember(db: Database, actor: Actor) {
  if (actor.role !== "BRAS_MEMBER") throw new ForbiddenError("Área do membro da Brás.");
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, actor.userId) });
  if (!m) throw new NotFoundError("Cadastro de membro não encontrado.");
  if (m.status !== "ACTIVE") throw new ForbiddenError("Cadastro em análise pela equipe.");
  return m;
}

/** Mês corrente em São Paulo (para o limite de visitas por mês). */
function monthStartBrt(now: Date) {
  const brt = new Date(now.getTime() - 3 * 3600_000);
  return new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), 1, 3)).toISOString();
}

export type BrasSupportView = {
  plan: BrasMemberPlan; channels: BrasSupportChannel[]; largeAccountBoost: boolean;
  agenda: { perMonth: number; usedThisMonth: number };
  upgradeFor: Partial<Record<BrasSupportChannel, BrasMemberPlan | null>>;
  chatReplyHours: number; faq: BrasRules["support"]["faq"];
};

/** O que o membro tem de suporte agora (canais, limite da agenda, e o plano que libera o que falta). */
export async function brasSupportView(db: Database, actor: Actor, level: string | null, now = new Date()): Promise<BrasSupportView & { memberId: string }> {
  const m = await myMember(db, actor);
  const [rules, { plan }] = await Promise.all([getBrasRules(db), brasMemberPlan(db, m.id, now)]);
  const s = brasSupportFor(rules, plan, level);
  const [used] = await db.select({ n: count() }).from(bdAppointments).where(and(eq(bdAppointments.memberId, m.id), gte(bdAppointments.createdAt, monthStartBrt(now)), ne(bdAppointments.status, "CANCELED")));
  const upgradeFor = Object.fromEntries((["CHAT", "WHATSAPP", "AGENDA"] as const).filter((c) => !s.channels.includes(c)).map((c) => [c, brasPlanForChannel(rules, c)]));
  return { memberId: m.id, plan, channels: s.channels, largeAccountBoost: s.largeAccountBoost, agenda: { perMonth: s.agendaPerMonth, usedThisMonth: Number(used?.n ?? 0) }, upgradeFor, chatReplyHours: rules.support.chatReplyHours, faq: rules.support.faq };
}

// ---------------------------------------------------------------------------
// Chat (assíncrono): membro ↔ equipe da Brás
// ---------------------------------------------------------------------------
const bodySchema = z.string().trim().min(2, "Escreva a sua mensagem.").max(2000, "Mensagem com até 2.000 caracteres.");

export async function sendBrasSupportMessage(db: Database, actor: Actor, raw: string, level: string | null, now = new Date()) {
  const m = await myMember(db, actor);
  const body = bodySchema.parse(raw);
  const rules = await getBrasRules(db);
  const { plan } = await brasMemberPlan(db, m.id, now);
  if (!brasSupportFor(rules, plan, level).channels.includes("CHAT")) {
    const need = brasPlanForChannel(rules, "CHAT");
    throw new DomainError("PLAN_CHAT", need ? `O chat com a equipe faz parte do plano ${BRAS_PLAN_LABEL[need]}. No seu plano, veja as perguntas frequentes.` : "O chat não está disponível no momento.");
  }
  // Freio simples contra rajada: até 10 mensagens em 10 minutos.
  const [recent] = await db.select({ n: count() }).from(bdSupportMessages).where(and(eq(bdSupportMessages.memberId, m.id), eq(bdSupportMessages.author, "MEMBER"), gte(bdSupportMessages.createdAt, new Date(now.getTime() - 600_000).toISOString())));
  if (Number(recent?.n ?? 0) >= 10) throw new DomainError("RATE", "Muitas mensagens seguidas. Aguarde a resposta da equipe.");
  const id = newId("bdsm");
  await db.insert(bdSupportMessages).values({ id, memberId: m.id, author: "MEMBER", authorUserId: actor.userId, body });
  return { id };
}

/** Conversa do próprio membro (marca como lidas as respostas da equipe). */
export async function myBrasSupportThread(db: Database, actor: Actor) {
  const m = await myMember(db, actor);
  const rows = await db.select().from(bdSupportMessages).where(eq(bdSupportMessages.memberId, m.id)).orderBy(asc(bdSupportMessages.createdAt)).limit(300);
  const unread = rows.filter((r) => r.author === "TEAM" && !r.readAt).map((r) => r.id);
  if (unread.length) await db.update(bdSupportMessages).set({ readAt: new Date().toISOString() }).where(inArray(bdSupportMessages.id, unread));
  return rows.map((r) => ({ id: r.id, author: r.author, body: r.body, createdAt: new Date(r.createdAt).toISOString() }));
}

/** Respostas da equipe ainda não lidas pelo membro (para o aviso no Meu Brás). */
export async function myBrasUnreadReplies(db: Database, memberId: string) {
  const [r] = await db.select({ n: count() }).from(bdSupportMessages).where(and(eq(bdSupportMessages.memberId, memberId), eq(bdSupportMessages.author, "TEAM"), isNull(bdSupportMessages.readAt)));
  return Number(r?.n ?? 0);
}

/** Caixa de entrada do Master: uma linha por membro com conversa, a mais recente primeiro, com não lidas. */
export async function brasSupportInbox(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ id: bdSupportMessages.id, memberId: bdSupportMessages.memberId, author: bdSupportMessages.author, body: bdSupportMessages.body, readAt: bdSupportMessages.readAt, createdAt: bdSupportMessages.createdAt, companyName: bdMembers.companyName })
    .from(bdSupportMessages).innerJoin(bdMembers, eq(bdMembers.id, bdSupportMessages.memberId)).orderBy(desc(bdSupportMessages.createdAt)).limit(1000);
  const by = new Map<string, { memberId: string; companyName: string; last: string; lastAt: string; lastAuthor: "MEMBER" | "TEAM"; unread: number }>();
  for (const r of rows) {
    const cur = by.get(r.memberId);
    if (!cur) by.set(r.memberId, { memberId: r.memberId, companyName: r.companyName, last: r.body.slice(0, 140), lastAt: new Date(r.createdAt).toISOString(), lastAuthor: r.author, unread: r.author === "MEMBER" && !r.readAt ? 1 : 0 });
    else if (r.author === "MEMBER" && !r.readAt) cur.unread++;
  }
  return [...by.values()];
}

export async function brasSupportThreadForMaster(db: Database, actor: Actor, memberId: string) {
  requireMaster(actor);
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.id, memberId), columns: { id: true, companyName: true, whatsapp: true } });
  if (!m) throw new NotFoundError("Membro não encontrado.");
  const rows = await db.select().from(bdSupportMessages).where(eq(bdSupportMessages.memberId, memberId)).orderBy(asc(bdSupportMessages.createdAt)).limit(300);
  const unread = rows.filter((r) => r.author === "MEMBER" && !r.readAt).map((r) => r.id);
  if (unread.length) await db.update(bdSupportMessages).set({ readAt: new Date().toISOString() }).where(inArray(bdSupportMessages.id, unread));
  return { member: m, messages: rows.map((r) => ({ id: r.id, author: r.author, body: r.body, createdAt: new Date(r.createdAt).toISOString() })) };
}

export async function replyBrasSupport(db: Database, actor: Actor, memberId: string, raw: string) {
  requireMaster(actor);
  const body = bodySchema.parse(raw);
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.id, memberId), columns: { id: true } });
  if (!m) throw new NotFoundError("Membro não encontrado.");
  const id = newId("bdsm");
  await db.insert(bdSupportMessages).values({ id, memberId, author: "TEAM", authorUserId: actor.userId, body });
  return { id };
}

export async function brasSupportUnreadCount(db: Database) {
  const [r] = await db.select({ n: count() }).from(bdSupportMessages).where(and(eq(bdSupportMessages.author, "MEMBER"), isNull(bdSupportMessages.readAt)));
  return Number(r?.n ?? 0);
}

// ---------------------------------------------------------------------------
// Agenda pessoal na importadora
// ---------------------------------------------------------------------------
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha o dia.");
export const brasAppointmentSchema = z.object({
  preferredDate: dateOnly,
  period: z.enum(["MANHA", "TARDE"]),
  importerId: z.string().optional().transform((v) => v || undefined),
  topic: z.string().trim().min(5, "Conte em poucas palavras o que quer ver (ex.: \"utilidades para o Natal\").").max(500),
});

export async function requestBrasAppointment(db: Database, actor: Actor, raw: z.input<typeof brasAppointmentSchema>, level: string | null, now = new Date()) {
  const m = await myMember(db, actor);
  const input = brasAppointmentSchema.parse(raw);
  const view = await brasSupportView(db, actor, level, now);
  if (!view.channels.includes("AGENDA")) {
    const need = view.upgradeFor.AGENDA;
    throw new DomainError("PLAN_AGENDA", need ? `A agenda pessoal na importadora faz parte do plano ${BRAS_PLAN_LABEL[need]}.` : "A agenda não está disponível no momento.");
  }
  if (view.agenda.usedThisMonth >= view.agenda.perMonth) throw new DomainError("AGENDA_LIMIT", `Seu plano tem ${view.agenda.perMonth} visita(s) por mês, e elas já foram pedidas. Fale com a equipe pelo chat se precisar de outra.`);
  const today = new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  if (input.preferredDate <= today) throw new DomainError("DATE", "Escolha um dia a partir de amanhã.");
  if (input.preferredDate > new Date(now.getTime() + 60 * 86_400_000).toISOString().slice(0, 10)) throw new DomainError("DATE", "Escolha um dia nos próximos 60 dias.");
  if (input.importerId && !(await db.query.bdImporters.findFirst({ where: and(eq(bdImporters.id, input.importerId), eq(bdImporters.active, true)), columns: { id: true } }))) throw new DomainError("IMPORTER", "Importadora não encontrada.");
  const id = newId("bdap");
  await db.insert(bdAppointments).values({ id, memberId: m.id, importerId: input.importerId ?? null, preferredDate: input.preferredDate, period: input.period, topic: input.topic });
  return { id };
}

export async function myBrasAppointments(db: Database, actor: Actor) {
  const m = await myMember(db, actor);
  return db.select({ id: bdAppointments.id, preferredDate: bdAppointments.preferredDate, period: bdAppointments.period, topic: bdAppointments.topic, status: bdAppointments.status, scheduledAt: bdAppointments.scheduledAt, teamNote: bdAppointments.teamNote, importerName: bdImporters.name })
    .from(bdAppointments).leftJoin(bdImporters, eq(bdImporters.id, bdAppointments.importerId)).where(eq(bdAppointments.memberId, m.id)).orderBy(desc(bdAppointments.createdAt)).limit(50);
}

export async function cancelMyBrasAppointment(db: Database, actor: Actor, id: string) {
  const m = await myMember(db, actor);
  const a = await db.query.bdAppointments.findFirst({ where: and(eq(bdAppointments.id, id), eq(bdAppointments.memberId, m.id)) });
  if (!a) throw new NotFoundError("Agendamento não encontrado.");
  if (a.status === "DONE" || a.status === "CANCELED") return { ok: true as const };
  await db.update(bdAppointments).set({ status: "CANCELED", updatedAt: new Date().toISOString() }).where(eq(bdAppointments.id, id));
  return { ok: true as const };
}

export async function listBrasAppointments(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select({ id: bdAppointments.id, preferredDate: bdAppointments.preferredDate, period: bdAppointments.period, topic: bdAppointments.topic, status: bdAppointments.status, scheduledAt: bdAppointments.scheduledAt, teamNote: bdAppointments.teamNote, importerName: bdImporters.name, memberId: bdMembers.id, companyName: bdMembers.companyName, contact: users.name, whatsapp: bdMembers.whatsapp })
    .from(bdAppointments).innerJoin(bdMembers, eq(bdMembers.id, bdAppointments.memberId)).innerJoin(users, eq(users.id, bdMembers.userId)).leftJoin(bdImporters, eq(bdImporters.id, bdAppointments.importerId))
    .orderBy(asc(bdAppointments.preferredDate)).limit(300);
}

const decideSchema = z.object({
  status: z.enum(["CONFIRMED", "DONE", "CANCELED"]),
  scheduledAt: z.string().optional(),
  teamNote: z.string().trim().max(500).optional(),
});
export async function decideBrasAppointment(db: Database, actor: Actor, id: string, raw: z.input<typeof decideSchema>) {
  requireMaster(actor);
  const input = decideSchema.parse(raw);
  const a = await db.query.bdAppointments.findFirst({ where: eq(bdAppointments.id, id) });
  if (!a) throw new NotFoundError("Agendamento não encontrado.");
  let scheduledAt = a.scheduledAt ? new Date(a.scheduledAt).toISOString() : null;
  if (input.status === "CONFIRMED") {
    const d = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (!d || Number.isNaN(d.getTime())) throw new DomainError("WHEN", "Informe dia e hora da visita.");
    scheduledAt = d.toISOString();
  }
  await db.update(bdAppointments).set({ status: input.status, scheduledAt, teamNote: input.teamNote ?? a.teamNote, updatedAt: new Date().toISOString() }).where(eq(bdAppointments.id, id));
  await recordAudit(db, actor, { action: "BRAS_APPOINTMENT_" + input.status, entityType: "bd_appointment", entityId: id, before: { status: a.status }, after: { status: input.status, scheduledAt } });
  return { ok: true as const };
}

export async function brasPendingAppointments(db: Database) {
  const [r] = await db.select({ n: count() }).from(bdAppointments).where(eq(bdAppointments.status, "REQUESTED"));
  return Number(r?.n ?? 0);
}

/** Visitas já passadas e ainda confirmadas (para a equipe marcar como feitas). */
export async function brasOverdueAppointments(db: Database, now = new Date()) {
  const [r] = await db.select({ n: count() }).from(bdAppointments).where(and(eq(bdAppointments.status, "CONFIRMED"), lt(bdAppointments.scheduledAt, now.toISOString())));
  return Number(r?.n ?? 0);
}

/** Importadoras ativas (só id e nome) para o membro com agenda escolher onde visitar. Nada de contato ou endereço. */
export async function brasImportersForAgenda(db: Database, actor: Actor) {
  await myMember(db, actor);
  return db.select({ id: bdImporters.id, name: bdImporters.name }).from(bdImporters).where(eq(bdImporters.active, true)).orderBy(asc(bdImporters.name));
}

/**
 * Pedido de plano pelo membro (enquanto a cobrança não entra pelo Financeiro Master): vira uma mensagem na caixa do
 * Atendimento e a equipe chama pelo WhatsApp do cadastro. Funciona em qualquer plano; um pedido por plano por dia.
 */
export async function requestBrasPlanUpgrade(db: Database, actor: Actor, plan: Exclude<BrasMemberPlan, "GRATIS">, now = new Date()) {
  const m = await myMember(db, actor);
  if (!["PRATA", "OURO", "PLATINUM"].includes(plan)) throw new DomainError("PLAN", "Plano desconhecido.");
  const body = `[Pedido de plano] Quero o plano ${BRAS_PLAN_LABEL[plan]}.`;
  const recent = await db.select({ id: bdSupportMessages.id }).from(bdSupportMessages)
    .where(and(eq(bdSupportMessages.memberId, m.id), eq(bdSupportMessages.body, body), gte(bdSupportMessages.createdAt, new Date(now.getTime() - 86_400_000).toISOString()))).limit(1);
  if (recent.length) return { already: true as const };
  await db.insert(bdSupportMessages).values({ id: newId("bdsm"), memberId: m.id, author: "MEMBER", authorUserId: actor.userId, body });
  return { already: false as const };
}
