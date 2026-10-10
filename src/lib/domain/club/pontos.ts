import { randomBytes } from "node:crypto";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdMembers, bdRequests, clubCodes, clubLedger, clubReferrals, clubVouchers, trParcels, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { getClubRules, pointsToCents, type ClubRules } from "./regras";

/**
 * Pontos do Brás Digital Club (D115). Razão append-only (`club_ledger`): o saldo é a soma dos lançamentos disponíveis.
 * Indicação só vira ponto quando o indicado ativa (evento real e pago); acima do teto do mês vai para revisão.
 * Vencimento por ordem de chegada (os mais antigos vencem primeiro), lançado na leitura (idempotente por dia).
 * Resgate = vale com código, usado no balcão de uma empresa participante e baixado pelo Master.
 */
type Tx = Pick<Database, "select" | "insert" | "update" | "query">;
const monthStartBrt = (now: Date) => { const b = new Date(now.getTime() - 3 * 3600_000); return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 1, 3)).toISOString(); };
const monthKey = (now: Date) => new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 7);
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x; };

/** Crédito idempotente (mesma origem + referência não credita duas vezes). Indicação acima do teto do mês → revisão. */
export async function creditPoints(db: Tx, input: { userId: string; points: number; source: string; referenceId: string; note?: string | null; actorUserId?: string | null }, rules: ClubRules, now = new Date()) {
  if (input.points <= 0) return null;
  const dup = await db.query.clubLedger.findFirst({ where: and(eq(clubLedger.userId, input.userId), eq(clubLedger.source, input.source), eq(clubLedger.referenceId, input.referenceId)), columns: { id: true } });
  if (dup) return null;
  let status: "DISPONIVEL" | "REVISAO" = "DISPONIVEL";
  if (input.source === "REFERRAL") {
    const [m] = await db.select({ p: sql<number>`coalesce(sum(${clubLedger.points}), 0)` }).from(clubLedger).where(and(eq(clubLedger.userId, input.userId), eq(clubLedger.source, "REFERRAL"), inArray(clubLedger.status, ["DISPONIVEL", "REVISAO"]), gte(clubLedger.createdAt, monthStartBrt(now))));
    if (Number(m?.p ?? 0) + input.points > rules.monthlyCap) status = "REVISAO";
  }
  const id = newId("clg");
  await db.insert(clubLedger).values({ id, userId: input.userId, points: input.points, kind: "EARN", status, source: input.source, referenceId: input.referenceId, expiresAt: addMonths(now, rules.expiryMonths).toISOString(), note: input.note ?? null, actorUserId: input.actorUserId ?? null });
  return { id, status };
}

/** Indicação ativada → pontos para quem indicou (valor do tipo na regra do momento). */
export async function creditReferral(db: Database, referralId: string, now = new Date()) {
  const r = await db.query.clubReferrals.findFirst({ where: eq(clubReferrals.id, referralId) });
  if (!r || r.status !== "ATIVOU") return null;
  const rules = await getClubRules(db);
  return creditPoints(db, { userId: r.referrerUserId, points: rules.referral[r.kind], source: "REFERRAL", referenceId: r.id, note: `Indicação ativada: ${r.name}` }, rules, now);
}

/** Saldo com o vencimento por ordem de chegada (os pontos mais antigos são os primeiros usados e os primeiros a vencer). */
export async function clubBalance(db: Tx, userId: string, now = new Date()) {
  const rows = await db.select().from(clubLedger).where(eq(clubLedger.userId, userId));
  const avail = rows.filter((r) => r.status === "DISPONIVEL");
  const earnedExpired = avail.filter((r) => r.kind === "EARN" && r.expiresAt && new Date(r.expiresAt) <= now).reduce((s, r) => s + r.points, 0);
  // Consumo líquido: vales e vencimentos (negativos) menos o que voltou de vale cancelado.
  const consumed = -avail.filter((r) => r.kind === "REDEEM" || r.kind === "EXPIRE" || r.kind === "REVERSE").reduce((s, r) => s + r.points, 0);
  const toExpire = Math.max(0, earnedExpired - consumed);
  if (toExpire > 0) {
    // Chave pelo total já vencido: a mesma leitura repetida não lança duas vezes.
    const ref = `vencidos:${earnedExpired}`;
    if (!rows.some((r) => r.kind === "EXPIRE" && r.referenceId === ref)) await db.insert(clubLedger).values({ id: newId("clg"), userId, points: -toExpire, kind: "EXPIRE", status: "DISPONIVEL", source: "EXPIRY", referenceId: ref, note: "Pontos vencidos" });
  }
  const available = avail.reduce((s, r) => s + r.points, 0) - toExpire;
  const in30 = new Date(now.getTime() + 30 * 86_400_000);
  const soonRaw = avail.filter((r) => r.kind === "EARN" && r.expiresAt && new Date(r.expiresAt) > now && new Date(r.expiresAt) <= in30).reduce((s, r) => s + r.points, 0);
  const leftover = Math.max(0, consumed + toExpire - earnedExpired);
  return { available: Math.max(0, available), inReview: rows.filter((r) => r.status === "REVISAO").reduce((s, r) => s + r.points, 0), expiringSoon: Math.max(0, soonRaw - leftover) };
}

// ---------------------------------------------------------------------------
// Código de convite (link /c/<código>) e indicação de cliente
// ---------------------------------------------------------------------------
export async function myClubCode(db: Database, userId: string) {
  const row = await db.query.clubCodes.findFirst({ where: eq(clubCodes.userId, userId) });
  if (row) return row.code;
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(4).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase();
    if (code.length < 6) continue;
    try { await db.insert(clubCodes).values({ userId, code }); return code; } catch { /* colisão: tenta de novo */ }
  }
  throw new DomainError("CODE", "Não foi possível gerar o código agora. Tente de novo.");
}

/** Quem é o dono do código (ou null). */
export async function referrerByCode(db: Database, code: string) {
  if (!/^[A-Z0-9]{6}$/.test(code)) return null;
  const row = await db.query.clubCodes.findFirst({ where: eq(clubCodes.code, code) });
  return row?.userId ?? null;
}

/**
 * Novo membro da Brás que entrou pelo link de um membro do Club. Regra "uma indicação, um dono": quem chegou pelo link
 * de um parceiro (`/r/`) fica com o parceiro e não gera pontos. Não indica a si mesmo; o mesmo WhatsApp vale uma vez.
 */
export async function registerClientReferral(db: Database, input: { referrerUserId: string; newUserId: string; name: string; phone: string; memberId: string; partnerAttributed: boolean }) {
  if (input.partnerAttributed || input.referrerUserId === input.newUserId) return null;
  const phone = input.phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  const dup = await db.query.clubReferrals.findFirst({ where: and(eq(clubReferrals.kind, "CLIENTE"), eq(clubReferrals.phone, phone)) });
  if (dup) return null;
  const id = newId("crf");
  await db.insert(clubReferrals).values({ id, referrerUserId: input.referrerUserId, kind: "CLIENTE", name: input.name, phone, status: "CADASTROU", targetType: "bd_member", targetId: input.memberId, contextType: "convite" });
  return id;
}

/** Pedido pago cancelado e o indicado ficou sem nenhuma compra paga: a ativação volta e os pontos saem (lançamento, nunca apagar). */
export async function reverseClientReferral(db: Database, memberId: string, now = new Date()) {
  const r = await db.query.clubReferrals.findFirst({ where: and(eq(clubReferrals.targetType, "bd_member"), eq(clubReferrals.targetId, memberId), eq(clubReferrals.status, "ATIVOU")) });
  if (!r) return null;
  const [paid] = await db.select({ n: sql<number>`count(*)` }).from(bdRequests).where(and(eq(bdRequests.memberId, memberId), inArray(bdRequests.status, ["PAID", "PICKED_UP"])));
  if (Number(paid?.n ?? 0) > 0) return null;
  const earned = await db.select().from(clubLedger).where(and(eq(clubLedger.userId, r.referrerUserId), eq(clubLedger.source, "REFERRAL"), inArray(clubLedger.referenceId, [r.id, `${r.id}:r`])));
  const reversed = await db.select().from(clubLedger).where(and(eq(clubLedger.userId, r.referrerUserId), eq(clubLedger.source, "REFERRAL_REVERSAL"), inArray(clubLedger.referenceId, [r.id, `${r.id}:r`])));
  const last = earned.filter((e) => e.status !== "RECUSADO").find((e) => !reversed.some((x) => x.referenceId === e.referenceId));
  await db.update(clubReferrals).set({ status: "CADASTROU", activatedAt: null, updatedAt: now.toISOString() }).where(eq(clubReferrals.id, r.id));
  if (last) await db.insert(clubLedger).values({ id: newId("clg"), userId: r.referrerUserId, points: -last.points, kind: "ADJUST", status: last.status === "REVISAO" ? "RECUSADO" : "DISPONIVEL", source: "REFERRAL_REVERSAL", referenceId: last.referenceId, note: `Indicação estornada: ${r.name}` });
  return r.id;
}

/** Primeiro pedido pago do membro indicado → indicação ativada e pontos para quem indicou. */
export async function activateClientReferral(db: Database, memberId: string, now = new Date()) {
  const r = await db.query.clubReferrals.findFirst({ where: and(eq(clubReferrals.targetType, "bd_member"), eq(clubReferrals.targetId, memberId), eq(clubReferrals.status, "CADASTROU")) });
  if (!r) return null;
  const upd = await db.update(clubReferrals).set({ status: "ATIVOU", activatedAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(clubReferrals.id, r.id), eq(clubReferrals.status, "CADASTROU"))).returning({ id: clubReferrals.id });
  if (!upd.length) return null;
  // Reativação depois de um estorno credita uma vez mais (referência própria), nunca duas.
  const reverted = await db.query.clubLedger.findFirst({ where: and(eq(clubLedger.userId, r.referrerUserId), eq(clubLedger.source, "REFERRAL_REVERSAL"), eq(clubLedger.referenceId, r.id)), columns: { id: true } });
  if (!reverted) return creditReferral(db, r.id, now);
  const rules = await getClubRules(db);
  return creditPoints(db, { userId: r.referrerUserId, points: rules.referral.CLIENTE, source: "REFERRAL", referenceId: `${r.id}:r`, note: `Indicação ativada de novo: ${r.name}` }, rules, now);
}

// ---------------------------------------------------------------------------
// Missões, nível e conquistas (calculados; missão credita uma vez por mês)
// ---------------------------------------------------------------------------
async function activity(db: Database, userId: string, now: Date) {
  const since = monthStartBrt(now);
  const d90 = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, userId), columns: { id: true } });
  const [refs, parcels, reqs] = await Promise.all([
    db.select({ kind: clubReferrals.kind, status: clubReferrals.status, activatedAt: clubReferrals.activatedAt }).from(clubReferrals).where(eq(clubReferrals.referrerUserId, userId)),
    db.select({ status: trParcels.status, createdAt: trParcels.createdAt, deliveredAt: trParcels.deliveredAt }).from(trParcels).where(eq(trParcels.clientUserId, userId)),
    m ? db.select({ createdAt: bdRequests.createdAt, carrierId: bdRequests.carrierId, status: bdRequests.status }).from(bdRequests).where(eq(bdRequests.memberId, m.id)) : Promise.resolve([] as { createdAt: string; carrierId: string | null; status: string }[]),
  ]);
  const activated = refs.filter((r) => r.status === "ATIVOU" || r.status === "RECORRENTE");
  const thisMonth = (iso: string | null) => !!iso && new Date(iso).toISOString() >= since;
  const freightsMonth = reqs.filter((r) => r.carrierId && r.status !== "CANCELED" && thisMonth(r.createdAt)).length + parcels.filter((p) => p.status !== "CANCELADO" && p.status !== "RECUSADO" && thisMonth(p.createdAt)).length;
  const freights90 = reqs.filter((r) => r.carrierId && r.status !== "CANCELED" && new Date(r.createdAt).toISOString() >= d90).length + parcels.filter((p) => p.status !== "CANCELADO" && p.status !== "RECUSADO" && new Date(p.createdAt).toISOString() >= d90).length;
  return {
    refs, activated,
    metrics: {
      INDICACOES_ATIVADAS: activated.filter((r) => thisMonth(r.activatedAt)).length,
      TRANSPORTADORA_ATIVADA: activated.filter((r) => (r.kind === "TRANSPORTADORA" || r.kind === "ONIBUS") && thisMonth(r.activatedAt)).length,
      FRETES_MES: freightsMonth,
      FARDOS_ONIBUS: parcels.filter((p) => p.status === "ENTREGUE" && thisMonth(p.deliveredAt)).length,
    },
    freights90, parcelsDelivered: parcels.filter((p) => p.status === "ENTREGUE").length,
  };
}

export const CLUB_LEVELS = ["MEMBRO", "FREQUENTE", "VIP"] as const;
export const CLUB_LEVEL_LABEL = { MEMBRO: "Membro", FREQUENTE: "Frequente", VIP: "VIP" } as const;
/** Nível pela atividade (D115): Frequente com 3 fretes em 90 dias ou 1 indicação ativada; VIP com 10 fretes ou 3 indicações. */
export function clubLevel(a: { freights90: number; activated: number }): { level: (typeof CLUB_LEVELS)[number]; next: { label: string; missing: string } | null } {
  if (a.freights90 >= 10 || a.activated >= 3) return { level: "VIP", next: null };
  if (a.freights90 >= 3 || a.activated >= 1) return { level: "FREQUENTE", next: { label: "VIP", missing: `${Math.max(0, 10 - a.freights90)} frete(s) em 90 dias ou ${Math.max(0, 3 - a.activated)} indicação(ões) ativada(s)` } };
  return { level: "MEMBRO", next: { label: "Frequente", missing: `${Math.max(0, 3 - a.freights90)} frete(s) em 90 dias ou 1 indicação ativada` } };
}

/** Painel "Indique e ganhe" (igual para todos os papéis): saldo, pendentes, funil, missões, nível, conquistas, vales. */
export async function clubPanel(db: Database, actor: Actor, now = new Date()) {
  const rules = await getClubRules(db);
  const act = await activity(db, actor.userId, now);
  // Missões do mês: credita uma vez por mês quando a meta é atingida.
  const mk = monthKey(now);
  const missions = [];
  for (const m of rules.missions) {
    const value = act.metrics[m.metric];
    const done = value >= m.target;
    if (done) await creditPoints(db, { userId: actor.userId, points: m.points, source: "MISSION", referenceId: `${m.key}:${mk}`, note: `Missão: ${m.title}` }, rules, now);
    missions.push({ key: m.key, title: m.title, target: m.target, value: Math.min(value, m.target), points: m.points, done });
  }
  const bal = await clubBalance(db, actor.userId, now);
  const pending = act.refs.filter((r) => r.status === "CONVIDADO" || r.status === "CADASTROU").reduce((s, r) => s + rules.referral[r.kind], 0);
  const funnel = { CONVIDADO: 0, CADASTROU: 0, ATIVOU: 0, RECORRENTE: 0 };
  for (const r of act.refs) if (r.status in funnel) funnel[r.status as keyof typeof funnel]++;
  const lvl = clubLevel({ freights90: act.freights90, activated: act.activated.length });
  const badges = [
    { key: "PRIMEIRA", label: "Primeira indicação", earned: act.activated.length >= 1 },
    { key: "TRANSPORTE", label: "Trouxe uma transportadora", earned: act.activated.some((r) => r.kind === "TRANSPORTADORA" || r.kind === "ONIBUS") },
    { key: "REDE10", label: "Rede de 10", earned: act.activated.length >= 10 },
    { key: "FARDO", label: "Primeiro fardo por ônibus", earned: act.parcelsDelivered >= 1 },
  ];
  const [history, vouchers] = await Promise.all([
    db.select().from(clubLedger).where(eq(clubLedger.userId, actor.userId)).orderBy(desc(clubLedger.createdAt)).limit(30),
    db.select().from(clubVouchers).where(eq(clubVouchers.userId, actor.userId)).orderBy(desc(clubVouchers.createdAt)).limit(20),
  ]);
  return {
    rules: { pointsPerReal: rules.pointsPerReal, minRedeem: rules.minRedeem, referral: rules.referral, expiryMonths: rules.expiryMonths },
    balance: bal, valueCents: pointsToCents(bal.available, rules), pending, funnel, missions, level: lvl, badges,
    code: await myClubCode(db, actor.userId),
    history: history.map((h) => ({ id: h.id, points: h.points, kind: h.kind, status: h.status, note: h.note, at: new Date(h.createdAt).toISOString() })),
    vouchers: vouchers.map((v) => ({ id: v.id, code: v.code, points: v.points, valueCents: v.valueCents, status: v.status, expiresAt: new Date(v.expiresAt).toISOString(), usedBy: v.usedBy })),
  };
}

// ---------------------------------------------------------------------------
// Resgate: vale com código, usado no balcão de uma empresa participante
// ---------------------------------------------------------------------------
export async function redeemVoucher(db: Database, actor: Actor, points: number, now = new Date()) {
  const rules = await getClubRules(db);
  if (!Number.isInteger(points) || points < rules.minRedeem) throw new DomainError("MIN", `O vale mínimo é de ${rules.minRedeem} pontos.`);
  const id = newId("clv");
  const code = `VALE-${randomBytes(3).toString("hex").toUpperCase()}`;
  const valueCents = pointsToCents(points, rules);
  await db.transaction(async (tx) => {
    const bal = await clubBalance(tx, actor.userId, now);
    if (bal.available < points) throw new DomainError("BALANCE", `Você tem ${bal.available} pontos disponíveis.`);
    await tx.insert(clubVouchers).values({ id, userId: actor.userId, code, points, valueCents, expiresAt: new Date(now.getTime() + 30 * 86_400_000).toISOString() });
    await tx.insert(clubLedger).values({ id: newId("clg"), userId: actor.userId, points: -points, kind: "REDEEM", status: "DISPONIVEL", source: "VOUCHER", referenceId: id, note: `Vale ${code}` });
  });
  await recordAudit(db, actor, { action: "CLUB_VOUCHER_CREATED", entityType: "club_voucher", entityId: id, after: { points, valueCents } });
  return { id, code, valueCents };
}

/** Cancelar o vale ainda não usado devolve os pontos. */
export async function cancelVoucher(db: Database, actor: Actor, voucherId: string) {
  const v = await db.query.clubVouchers.findFirst({ where: and(eq(clubVouchers.id, voucherId), eq(clubVouchers.userId, actor.userId)) });
  if (!v) throw new NotFoundError("Vale não encontrado.");
  if (v.status !== "ATIVO") throw new DomainError("STATUS", "Esse vale não pode mais ser cancelado.");
  await db.transaction(async (tx) => {
    const upd = await tx.update(clubVouchers).set({ status: "CANCELADO" }).where(and(eq(clubVouchers.id, v.id), eq(clubVouchers.status, "ATIVO"))).returning({ id: clubVouchers.id });
    if (!upd.length) throw new DomainError("STATUS", "Esse vale não pode mais ser cancelado.");
    await tx.insert(clubLedger).values({ id: newId("clg"), userId: v.userId, points: v.points, kind: "REVERSE", status: "DISPONIVEL", source: "VOUCHER_CANCEL", referenceId: v.id, note: `Vale ${v.code} cancelado` });
  });
  return { ok: true as const };
}

/** Master: baixa o vale usado no balcão de uma empresa do grupo (entra no acerto entre empresas). */
export async function applyVoucher(db: Database, actor: Actor, code: string, company: string, note?: string, now = new Date()) {
  requireMaster(actor);
  const v = await db.query.clubVouchers.findFirst({ where: eq(clubVouchers.code, code.trim().toUpperCase()) });
  if (!v) throw new NotFoundError("Vale não encontrado.");
  if (v.status !== "ATIVO") throw new DomainError("STATUS", v.status === "USADO" ? "Esse vale já foi usado." : "Esse vale foi cancelado.");
  if (new Date(v.expiresAt) < now) throw new DomainError("EXPIRED", "Esse vale venceu. O cliente pode cancelar e gerar outro.");
  const upd = await db.update(clubVouchers).set({ status: "USADO", usedAt: now.toISOString(), usedBy: company.slice(0, 30), usedNote: note?.slice(0, 200) ?? null }).where(and(eq(clubVouchers.id, v.id), eq(clubVouchers.status, "ATIVO"))).returning({ id: clubVouchers.id });
  if (!upd.length) throw new DomainError("STATUS", "Esse vale já foi usado.");
  await recordAudit(db, actor, { action: "CLUB_VOUCHER_USED", entityType: "club_voucher", entityId: v.id, after: { company, valueCents: v.valueCents } }, { force: true });
  return { ok: true as const, valueCents: v.valueCents };
}

/** Master: visão do Club (funil geral, revisão antifraude, vales). */
export async function clubAdmin(db: Database, actor: Actor) {
  requireMaster(actor);
  const [refs, review, vouchers, totals] = await Promise.all([
    db.select({ kind: clubReferrals.kind, status: clubReferrals.status }).from(clubReferrals),
    db.select({ l: clubLedger, name: users.name, email: users.email }).from(clubLedger).innerJoin(users, eq(users.id, clubLedger.userId)).where(eq(clubLedger.status, "REVISAO")).orderBy(desc(clubLedger.createdAt)).limit(100),
    db.select({ v: clubVouchers, name: users.name }).from(clubVouchers).innerJoin(users, eq(users.id, clubVouchers.userId)).orderBy(desc(clubVouchers.createdAt)).limit(100),
    db.select({ kind: clubLedger.kind, p: sql<number>`coalesce(sum(${clubLedger.points}), 0)` }).from(clubLedger).where(eq(clubLedger.status, "DISPONIVEL")).groupBy(clubLedger.kind),
  ]);
  const funnel: Record<string, Record<string, number>> = {};
  for (const r of refs) { funnel[r.kind] ??= {}; funnel[r.kind]![r.status] = (funnel[r.kind]![r.status] ?? 0) + 1; }
  return {
    funnel,
    review: review.map(({ l, name, email }) => ({ id: l.id, name, email, points: l.points, note: l.note, at: new Date(l.createdAt).toISOString() })),
    vouchers: vouchers.map(({ v, name }) => ({ id: v.id, code: v.code, name, points: v.points, valueCents: v.valueCents, status: v.status, usedBy: v.usedBy, at: new Date(v.createdAt).toISOString() })),
    issuedPoints: Number(totals.find((t) => t.kind === "EARN")?.p ?? 0),
    redeemedPoints: -Number(totals.find((t) => t.kind === "REDEEM")?.p ?? 0),
  };
}

/** Master decide a revisão (acima do teto): libera ou recusa. */
export async function reviewPoints(db: Database, actor: Actor, ledgerId: string, approve: boolean) {
  requireMaster(actor);
  const l = await db.query.clubLedger.findFirst({ where: eq(clubLedger.id, ledgerId) });
  if (!l || l.status !== "REVISAO") throw new NotFoundError("Lançamento em revisão não encontrado.");
  await db.update(clubLedger).set({ status: approve ? "DISPONIVEL" : "RECUSADO" }).where(and(eq(clubLedger.id, l.id), eq(clubLedger.status, "REVISAO")));
  await recordAudit(db, actor, { action: approve ? "CLUB_POINTS_APPROVED" : "CLUB_POINTS_REFUSED", entityType: "club_ledger", entityId: l.id, after: { points: l.points } }, { force: true });
  return { ok: true as const };
}

