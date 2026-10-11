import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { accountingTicketMessages, accountingTickets, platformSettings, trParcelEvents, trParcels, trTrips, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { isValidNfeKey, normalizeNfeKey } from "@/lib/fiscal/nfe";
import { isMaster, requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";

/**
 * Função emergencial "Meu Contador" (D117): quem está com fardo sem nota abre um chamado urgente; a equipe contábil
 * resolve pelo caminho correto (a loja emite com ajuda, ou nota avulsa quando couber) e a chave volta para o fardo.
 * O sistema não emite nota por quem não é o vendedor: organiza, acelera e registra. Preço e prazo no Master; a
 * cobrança só liga quando o dono decidir (até lá o preço aparece como referência).
 */
export const meuContadorSettingsSchema = z.object({
  priceCents: z.number().int().min(0).max(1_000_000),
  slaHours: z.number().int().min(1).max(72),
  hours: z.string().trim().min(3).max(120),
  charging: z.boolean(),
});
export type MeuContadorSettings = z.output<typeof meuContadorSettingsSchema>;
export const DEFAULT_MEU_CONTADOR: MeuContadorSettings = { priceCents: 0, slaHours: 4, hours: "Segunda a sábado, das 8h às 20h", charging: false };
const KEY = "fiscal.meu_contador";

export async function getMeuContadorSettings(db: Database): Promise<MeuContadorSettings> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const parsed = meuContadorSettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_MEU_CONTADOR;
}
export async function saveMeuContadorSettings(db: Database, actor: Actor, raw: z.input<typeof meuContadorSettingsSchema>) {
  requireMaster(actor);
  const before = await getMeuContadorSettings(db);
  const v = meuContadorSettingsSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "MEU_CONTADOR_SETTINGS", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

export const ticketSchema = z.object({
  parcelId: z.string().max(60).optional().transform((v) => v || null),
  storeName: z.string().trim().min(2, "Informe a loja onde comprou").max(120),
  storePhone: z.string().optional().transform((v) => (v ? v.replace(/\D/g, "") : null)).refine((v) => v === null || (v.length >= 10 && v.length <= 13), "WhatsApp da loja com DDD"),
  description: z.string().trim().min(5, "Conte o que foi comprado").max(600),
  approxValueCents: z.number().int().min(0).max(1_000_000_000).optional(),
});

/** Abre o chamado. Se for de um fardo, o prazo é a saída do ônibus; senão, o prazo padrão do serviço. */
export async function openTicket(db: Database, actor: Actor, raw: z.input<typeof ticketSchema>, now = new Date()) {
  const v = ticketSchema.parse(raw);
  const settings = await getMeuContadorSettings(db);
  let deadline = new Date(now.getTime() + settings.slaHours * 3_600_000).toISOString();
  if (v.parcelId) {
    const p = await db.query.trParcels.findFirst({ where: eq(trParcels.id, v.parcelId) });
    if (!p || p.clientUserId !== actor.userId) throw new NotFoundError("Fardo não encontrado.");
    if (p.invoiceKey) throw new DomainError("HAS_INVOICE", "Esse fardo já tem nota.");
    const open = await db.query.accountingTickets.findFirst({ where: and(eq(accountingTickets.parcelId, p.id), inArray(accountingTickets.status, ["ABERTO", "EM_ATENDIMENTO"])), columns: { number: true } });
    if (open) throw new DomainError("OPEN", `Já existe o chamado ${open.number} para esse fardo.`);
    const t = await db.query.trTrips.findFirst({ where: eq(trTrips.id, p.tripId), columns: { departAt: true } });
    if (t) deadline = new Date(t.departAt).toISOString();
  }
  const id = newId("atk");
  let number = 0;
  await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`coalesce(max(${accountingTickets.number}), 3000) + 1` }).from(accountingTickets) as [{ n: number }];
    number = Number(n);
    await tx.insert(accountingTickets).values({ id, number, requesterUserId: actor.userId, parcelId: v.parcelId, storeName: v.storeName, storePhone: v.storePhone, description: v.description, approxValueCents: v.approxValueCents ?? null, deadlineAt: deadline, priceCents: settings.priceCents });
    if (v.parcelId) await tx.insert(trParcelEvents).values({ id: newId("trpe"), parcelId: v.parcelId, kind: "MEU_CONTADOR", actor: "Cliente", note: `Chamado ${number}` });
  });
  await recordAudit(db, actor, { action: "MEU_CONTADOR_OPENED", entityType: "accounting_ticket", entityId: id, after: { number, parcelId: v.parcelId } });
  return { id, number, deadlineAt: deadline, priceCents: settings.priceCents, charging: settings.charging };
}

async function ticketFor(db: Database, actor: Actor, id: string) {
  const t = await db.query.accountingTickets.findFirst({ where: eq(accountingTickets.id, id) });
  if (!t || (!isMaster(actor) && t.requesterUserId !== actor.userId)) throw new NotFoundError("Chamado não encontrado.");
  return t;
}

export async function ticketMessage(db: Database, actor: Actor, id: string, raw: string) {
  const t = await ticketFor(db, actor, id);
  const body = raw.trim().slice(0, 1000);
  if (body.length < 2) throw new DomainError("BODY", "Escreva a mensagem.");
  if (t.status === "RESOLVIDO" || t.status === "CANCELADO" || t.status === "SEM_SOLUCAO") throw new DomainError("CLOSED", "Esse chamado já foi encerrado.");
  await db.insert(accountingTicketMessages).values({ id: newId("atm"), ticketId: t.id, author: isMaster(actor) ? "CONTADOR" : "CLIENTE", authorUserId: actor.userId, body });
  if (isMaster(actor) && t.status === "ABERTO") await db.update(accountingTickets).set({ status: "EM_ATENDIMENTO", assignedTo: actor.userId, updatedAt: new Date().toISOString() }).where(eq(accountingTickets.id, t.id));
  return { ok: true as const };
}

/** Contador assume o chamado. */
export async function takeTicket(db: Database, actor: Actor, id: string) {
  requireMaster(actor);
  const t = await ticketFor(db, actor, id);
  if (t.status !== "ABERTO") throw new DomainError("STATUS", "Esse chamado já está em atendimento ou encerrado.");
  await db.update(accountingTickets).set({ status: "EM_ATENDIMENTO", assignedTo: actor.userId, updatedAt: new Date().toISOString() }).where(and(eq(accountingTickets.id, t.id), eq(accountingTickets.status, "ABERTO")));
  return { ok: true as const };
}

/** Resolvido: a chave da nota (conferida) vai para o fardo. Ou "sem solução", com o motivo (o fardo vai na próxima viagem). */
export async function closeTicket(db: Database, actor: Actor, id: string, raw: { resolved: true; invoiceKey: string; note?: string } | { resolved: false; note: string }, now = new Date()) {
  requireMaster(actor);
  const t = await ticketFor(db, actor, id);
  if (t.status !== "ABERTO" && t.status !== "EM_ATENDIMENTO") throw new DomainError("STATUS", "Esse chamado já foi encerrado.");
  if (!raw.resolved) {
    const note = raw.note?.trim();
    if (!note) throw new DomainError("NOTE", "Conte o motivo para o cliente.");
    await db.update(accountingTickets).set({ status: "SEM_SOLUCAO", resolutionNote: note.slice(0, 500), resolvedAt: now.toISOString(), updatedAt: now.toISOString(), assignedTo: t.assignedTo ?? actor.userId }).where(eq(accountingTickets.id, t.id));
    await recordAudit(db, actor, { action: "MEU_CONTADOR_NO_SOLUTION", entityType: "accounting_ticket", entityId: t.id }, { force: true });
    return { ok: true as const };
  }
  const key = normalizeNfeKey(raw.invoiceKey);
  if (!isValidNfeKey(key)) throw new DomainError("NFE", "Chave da nota inválida. Confira os 44 números.");
  await db.transaction(async (tx) => {
    await tx.update(accountingTickets).set({ status: "RESOLVIDO", invoiceKey: key, resolutionNote: raw.note?.trim().slice(0, 500) || null, resolvedAt: now.toISOString(), updatedAt: now.toISOString(), assignedTo: t.assignedTo ?? actor.userId }).where(eq(accountingTickets.id, t.id));
    if (t.parcelId) {
      await tx.update(trParcels).set({ invoiceKey: key, updatedAt: now.toISOString() }).where(eq(trParcels.id, t.parcelId));
      await tx.insert(trParcelEvents).values({ id: newId("trpe"), parcelId: t.parcelId, kind: "NOTA", actor: "Meu Contador", note: `Chamado ${t.number}` });
    }
  });
  await recordAudit(db, actor, { action: "MEU_CONTADOR_RESOLVED", entityType: "accounting_ticket", entityId: t.id }, { force: true });
  return { ok: true as const };
}

export async function cancelTicket(db: Database, actor: Actor, id: string) {
  const t = await ticketFor(db, actor, id);
  if (t.status !== "ABERTO") throw new DomainError("STATUS", "Só chamado ainda não atendido pode ser cancelado.");
  await db.update(accountingTickets).set({ status: "CANCELADO", updatedAt: new Date().toISOString() }).where(eq(accountingTickets.id, t.id));
  return { ok: true as const };
}

const view = (t: typeof accountingTickets.$inferSelect, msgs: (typeof accountingTicketMessages.$inferSelect)[], now: Date) => ({
  id: t.id, number: t.number, status: t.status, storeName: t.storeName, storePhone: t.storePhone, description: t.description, approxValueCents: t.approxValueCents, priceCents: t.priceCents,
  deadlineAt: t.deadlineAt ? new Date(t.deadlineAt).toISOString() : null, minutesLeft: t.deadlineAt ? Math.round((new Date(t.deadlineAt).getTime() - now.getTime()) / 60_000) : null,
  parcelId: t.parcelId, invoiceKey: t.invoiceKey, resolutionNote: t.resolutionNote, createdAt: new Date(t.createdAt).toISOString(),
  messages: msgs.filter((m) => m.ticketId === t.id).map((m) => ({ id: m.id, author: m.author, body: m.body, at: new Date(m.createdAt).toISOString() })),
});

export async function myTickets(db: Database, actor: Actor, now = new Date()) {
  const rows = await db.select().from(accountingTickets).where(eq(accountingTickets.requesterUserId, actor.userId)).orderBy(desc(accountingTickets.createdAt)).limit(50);
  const msgs = rows.length ? await db.select().from(accountingTicketMessages).where(inArray(accountingTicketMessages.ticketId, rows.map((r) => r.id))).orderBy(asc(accountingTicketMessages.createdAt)) : [];
  return rows.map((t) => view(t, msgs, now));
}

/** Fila do contador: abertos e em atendimento por prazo; indicadores do serviço. */
export async function ticketQueue(db: Database, actor: Actor, now = new Date()) {
  requireMaster(actor);
  const rows = await db.select({ t: accountingTickets, name: users.name, email: users.email }).from(accountingTickets).innerJoin(users, eq(users.id, accountingTickets.requesterUserId)).orderBy(asc(accountingTickets.deadlineAt)).limit(300);
  const ids = rows.map((r) => r.t.id);
  const msgs = ids.length ? await db.select().from(accountingTicketMessages).where(inArray(accountingTicketMessages.ticketId, ids)).orderBy(asc(accountingTicketMessages.createdAt)) : [];
  const closed = rows.filter((r) => r.t.status === "RESOLVIDO" || r.t.status === "SEM_SOLUCAO");
  const resolved = rows.filter((r) => r.t.status === "RESOLVIDO");
  const onTime = resolved.filter((r) => r.t.resolvedAt && r.t.deadlineAt && new Date(r.t.resolvedAt) <= new Date(r.t.deadlineAt)).length;
  const avgMinutes = resolved.length ? Math.round(resolved.reduce((s, r) => s + (new Date(r.t.resolvedAt!).getTime() - new Date(r.t.createdAt).getTime()) / 60_000, 0) / resolved.length) : null;
  return {
    open: rows.filter((r) => r.t.status === "ABERTO" || r.t.status === "EM_ATENDIMENTO").map((r) => ({ ...view(r.t, msgs, now), requester: r.name, requesterEmail: r.email })),
    closed: closed.slice(-50).reverse().map((r) => ({ ...view(r.t, msgs, now), requester: r.name, requesterEmail: r.email })),
    stats: { open: rows.filter((r) => r.t.status === "ABERTO").length, inProgress: rows.filter((r) => r.t.status === "EM_ATENDIMENTO").length, resolved: resolved.length, onTimePct: resolved.length ? Math.round((onTime / resolved.length) * 100) : null, avgMinutes },
  };
}
