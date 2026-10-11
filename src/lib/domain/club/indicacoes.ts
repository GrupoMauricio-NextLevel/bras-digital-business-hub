import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { clubReferrals, trCarriers, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { creditReferral } from "./pontos";

/**
 * Indicações em rede do Brás Digital Club (D113). Um motor só para todo convite. Nesta etapa: o cliente indica a
 * transportadora ou o ônibus que já usa ("não está aqui"). O indicado é reconhecido pelo tipo + WhatsApp: a primeira
 * indicação válida é a que vale (antifraude, seção 7B.3). Os pontos entram na etapa do razão (E4).
 */
const digits = (v: string) => v.replace(/\D/g, "");
export const carrierReferralSchema = z.object({
  kind: z.enum(["TRANSPORTADORA", "ONIBUS", "IMPORTADORA", "LOJA"]),
  name: z.string().trim().min(2, "Informe o nome").max(120),
  contactName: z.string().trim().max(80).optional().transform((v) => v || null),
  phone: z.string().transform(digits).refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp com DDD"),
  city: z.string().trim().max(80).optional().transform((v) => v || null),
  uf: z.enum(BRAS_UFS).optional(),
  contextType: z.string().max(40).optional(),
  contextId: z.string().max(60).optional(),
});

const phoneKey = (p: string) => (p.startsWith("55") && p.length > 11 ? p.slice(2) : p);
const CARGAS_URL = "https://cargas.nextlevelgroup.com.br";

/** Convite pronto para o WhatsApp do indicado. */
export function carrierInviteUrl(phone: string, name: string, referrer: string, kind: string = "TRANSPORTADORA") {
  const text = kind === "LOJA"
    ? `Olá! Sou ${referrer}, cliente de vocês. Meu pedido vai pelo ônibus e precisa da nota para embarcar. Com o Nota Fácil da Brás Digital vocês emitem em poucos minutos, com condição especial para lojista novo: https://bras.nextlevelgroup.com.br`
    : kind === "IMPORTADORA"
    ? `Olá! ${referrer} trabalha com a Brás Digital e indicou a ${name} para vender por caixa fechada para lojistas do Brasil inteiro, com painel próprio e grátis para começar: https://bras.nextlevelgroup.com.br`
    : `Olá! ${referrer} usa a NextLevel Cargas e indicou a ${name} para receber as cargas dele do Brás pelo sistema. É grátis para a transportadora: ${CARGAS_URL}`;
  return `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(text)}`;
}

export async function referCarrier(db: Database, actor: Actor, raw: z.input<typeof carrierReferralSchema>) {
  const v = carrierReferralSchema.parse(raw);
  const key = phoneKey(v.phone);
  const me = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
  const referrer = me?.name?.split(" ")[0] ?? "Um cliente";
  // Já está no catálogo? Então não é indicação: o cliente escolhe direto.
  const existing = v.kind === "IMPORTADORA" || v.kind === "LOJA" ? null : (await db.select({ id: trCarriers.id, name: trCarriers.name, phone: trCarriers.phone }).from(trCarriers)).find((c) => phoneKey(c.phone) === key);
  if (existing) return { status: "IN_CATALOG" as const, carrierId: existing.id, carrierName: existing.name };
  const family = v.kind === "IMPORTADORA" ? (["IMPORTADORA"] as const) : v.kind === "LOJA" ? (["LOJA"] as const) : (["TRANSPORTADORA", "ONIBUS"] as const);
  const dup = await db.query.clubReferrals.findFirst({ where: and(inArray(clubReferrals.kind, [...family]), eq(clubReferrals.phone, key)) });
  if (dup) return { status: dup.referrerUserId === actor.userId ? ("MINE" as const) : ("ALREADY_REFERRED" as const), referralId: dup.id, whatsappUrl: carrierInviteUrl(key, dup.name, referrer, dup.kind) };
  const id = newId("crf");
  await db.insert(clubReferrals).values({ id, referrerUserId: actor.userId, kind: v.kind, name: v.name, contactName: v.contactName, phone: key, city: v.city, uf: v.uf ?? null, contextType: v.contextType ?? null, contextId: v.contextId ?? null });
  await recordAudit(db, actor, { action: "CLUB_REFERRAL_CREATED", entityType: "club_referral", entityId: id, after: { kind: v.kind } });
  return { status: "CREATED" as const, referralId: id, whatsappUrl: carrierInviteUrl(key, v.name, referrer, v.kind) };
}

export async function myReferrals(db: Database, actor: Actor) {
  const rows = await db.select().from(clubReferrals).where(eq(clubReferrals.referrerUserId, actor.userId)).orderBy(desc(clubReferrals.createdAt)).limit(200);
  return rows.map((r) => ({ id: r.id, kind: r.kind, name: r.name, city: r.city, uf: r.uf, status: r.status, createdAt: new Date(r.createdAt).toISOString() }));
}

/** Master: indicações de transportadoras e ônibus, com quem indicou. */
export async function listCarrierReferrals(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ r: clubReferrals, referrer: users.name, referrerEmail: users.email }).from(clubReferrals).innerJoin(users, eq(users.id, clubReferrals.referrerUserId)).where(inArray(clubReferrals.kind, ["TRANSPORTADORA", "ONIBUS"])).orderBy(desc(clubReferrals.createdAt)).limit(300);
  return rows.map(({ r, referrer, referrerEmail }) => ({ id: r.id, kind: r.kind, name: r.name, contactName: r.contactName, phone: r.phone, city: r.city, uf: r.uf, status: r.status, targetId: r.targetId, referrer, referrerEmail, createdAt: new Date(r.createdAt).toISOString(), whatsappUrl: carrierInviteUrl(r.phone, r.name, referrer.split(" ")[0] ?? "Um cliente") }));
}

/**
 * Quando uma transportadora entra (cadastro), a indicação com o mesmo WhatsApp passa para "cadastrou" e fica ligada a
 * ela. Chamado pelo cadastro de transportadora; não falha o cadastro.
 */
export async function linkCarrierReferral(db: Pick<Database, "query" | "update">, carrier: { id: string; phone: string }) {
  const key = phoneKey(digits(carrier.phone));
  const r = await db.query.clubReferrals.findFirst({ where: and(inArray(clubReferrals.kind, ["TRANSPORTADORA", "ONIBUS"]), eq(clubReferrals.phone, key), eq(clubReferrals.status, "CONVIDADO")) });
  if (!r) return null;
  await db.update(clubReferrals).set({ status: "CADASTROU", targetType: "tr_carrier", targetId: carrier.id, updatedAt: new Date().toISOString() }).where(eq(clubReferrals.id, r.id));
  return r.id;
}

/** Primeira coleta ou viagem concluída: a indicação "ativou" e os pontos vão para quem indicou (D115). */
export async function activateCarrierReferral(db: Database, carrierId: string, now = new Date()) {
  const r = await db.query.clubReferrals.findFirst({ where: and(eq(clubReferrals.targetType, "tr_carrier"), eq(clubReferrals.targetId, carrierId), eq(clubReferrals.status, "CADASTROU")) });
  if (!r) return null;
  const upd = await db.update(clubReferrals).set({ status: "ATIVOU", activatedAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(clubReferrals.id, r.id), eq(clubReferrals.status, "CADASTROU"))).returning({ id: clubReferrals.id });
  if (upd.length) await creditReferral(db, r.id, now);
  return r.id;
}

export async function dismissReferral(db: Database, actor: Actor, id: string) {
  requireMaster(actor);
  const r = await db.query.clubReferrals.findFirst({ where: eq(clubReferrals.id, id) });
  if (!r) throw new NotFoundError("Indicação não encontrada.");
  if (r.status !== "CONVIDADO") throw new DomainError("STATUS", "Só indicações em convite podem ser recusadas.");
  await db.update(clubReferrals).set({ status: "RECUSADA", updatedAt: new Date().toISOString() }).where(eq(clubReferrals.id, id));
  await recordAudit(db, actor, { action: "CLUB_REFERRAL_DISMISSED", entityType: "club_referral", entityId: id }, { force: true });
  return { ok: true as const };
}

/** Master: todas as indicações (Club), com quem indicou. */
export async function listAllReferrals(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ r: clubReferrals, referrer: users.name }).from(clubReferrals).innerJoin(users, eq(users.id, clubReferrals.referrerUserId)).orderBy(desc(clubReferrals.createdAt)).limit(300);
  return rows.map(({ r, referrer }) => ({ id: r.id, kind: r.kind, name: r.name, phone: r.phone, city: r.city, uf: r.uf, status: r.status, referrer, createdAt: new Date(r.createdAt).toISOString(), whatsappUrl: carrierInviteUrl(r.phone, r.name, referrer.split(" ")[0] ?? "Um parceiro", r.kind) }));
}

/** Master confirma a ativação que o sistema ainda não vê sozinho (ex.: importadora indicada que fez a primeira venda). */
export async function activateReferralManually(db: Database, actor: Actor, id: string, now = new Date()) {
  requireMaster(actor);
  const r = await db.query.clubReferrals.findFirst({ where: eq(clubReferrals.id, id) });
  if (!r) throw new NotFoundError("Indicação não encontrada.");
  if (r.status !== "CONVIDADO" && r.status !== "CADASTROU") throw new DomainError("STATUS", "Essa indicação já foi ativada ou encerrada.");
  await db.update(clubReferrals).set({ status: "ATIVOU", activatedAt: now.toISOString(), updatedAt: now.toISOString() }).where(eq(clubReferrals.id, id));
  await recordAudit(db, actor, { action: "CLUB_REFERRAL_ACTIVATED", entityType: "club_referral", entityId: id }, { force: true });
  await creditReferral(db, id, now);
  return { ok: true as const };
}
