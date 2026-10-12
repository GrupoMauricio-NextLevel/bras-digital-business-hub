import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { clubCards, clubCounters, clubPurchases, clubSettlements, clubVoucherFunding, clubVouchers, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor, requireMasterFn } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { getGroupCompanies } from "../grupo";
import { clubBalance, creditPoints, spendVoucherAt } from "./pontos";
import { getClubRules } from "./regras";

/**
 * Cartão do Club no balcão das empresas do grupo (D120, fase E8a). O membro mostra o QR (identificador opaco, nunca o
 * documento); o balcão da empresa (link sem login, só o hash guardado, padrão D106) vê o primeiro nome, o nível e o
 * saldo, registra a compra (vira pontos pagos pela empresa da compra) e baixa o vale. No fim do mês, o Master vê quem
 * deve a quem entre as empresas e marca o acerto feito fora do sistema. Nada aqui movimenta dinheiro.
 */
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const COUNTER_TOKEN = /^[A-Za-z0-9_-]{32,64}$/;
const CARD = /^[A-Z0-9]{10}$/;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const cardToken = () => Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join("");
const firstName = (name: string | null) => (name ?? "").trim().split(/\s+/)[0] || "Membro";

// ---------------------------------------------------------------------------
// Cartão do membro
// ---------------------------------------------------------------------------
export async function myClubCard(db: Database, userId: string) {
  const ex = await db.query.clubCards.findFirst({ where: eq(clubCards.userId, userId) });
  if (ex) return { token: ex.token };
  for (let i = 0; i < 5; i++) {
    const token = cardToken();
    const r = await db.insert(clubCards).values({ userId, token }).onConflictDoNothing().returning({ token: clubCards.token });
    if (r.length) return { token: r[0]!.token };
    const again = await db.query.clubCards.findFirst({ where: eq(clubCards.userId, userId) });
    if (again) return { token: again.token };
  }
  throw new DomainError("CARD", "Não foi possível gerar o cartão agora. Tente de novo.");
}

/** Cartão perdido ou exposto: troca o código (o anterior deixa de valer no balcão). */
export async function renewClubCard(db: Database, actor: Actor) {
  await db.delete(clubCards).where(eq(clubCards.userId, actor.userId));
  return myClubCard(db, actor.userId);
}

// ---------------------------------------------------------------------------
// Balcões das empresas (Master cria o link)
// ---------------------------------------------------------------------------
const counterSchema = z.object({ company: z.string().regex(/^[A-Z0-9_]{2,30}$/), name: z.string().trim().min(3, "Dê um nome ao balcão").max(80) });

export async function createCounter(db: Database, actor: Actor, raw: z.input<typeof counterSchema>) {
  requireMaster(actor);
  const v = counterSchema.parse(raw);
  if (!(await getGroupCompanies(db)).some((c) => c.key === v.company)) throw new DomainError("COMPANY", "Empresa do grupo não encontrada.");
  const token = randomBytes(24).toString("base64url");
  const id = newId("clct");
  await db.insert(clubCounters).values({ id, company: v.company, name: v.name, tokenHash: hash(token), createdBy: actor.userId });
  await recordAudit(db, actor, { action: "CLUB_COUNTER_CREATED", entityType: "club_counter", entityId: id, after: { company: v.company, name: v.name } }, { force: true });
  return { id, token, path: `/balcao-club/${token}` };
}

export async function revokeCounter(db: Database, actor: Actor, counterId: string) {
  requireMaster(actor);
  const upd = await db.update(clubCounters).set({ active: false }).where(eq(clubCounters.id, counterId)).returning({ id: clubCounters.id });
  if (!upd.length) throw new NotFoundError("Balcão não encontrado.");
  await recordAudit(db, actor, { action: "CLUB_COUNTER_REVOKED", entityType: "club_counter", entityId: counterId }, { force: true });
  return { ok: true as const };
}

export async function listCounters(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select().from(clubCounters).orderBy(desc(clubCounters.createdAt));
  return rows.map((c) => ({ id: c.id, company: c.company, name: c.name, active: c.active, lastUsedAt: c.lastUsedAt ? new Date(c.lastUsedAt).toISOString() : null }));
}

/** Balcão dono do link (ativo). Código malformado ou revogado: null. */
export async function counterByToken(db: Database, token: string) {
  if (!COUNTER_TOKEN.test(token)) return null;
  const h = hash(token);
  const c = await db.query.clubCounters.findFirst({ where: eq(clubCounters.tokenHash, h) });
  if (!c?.active || !timingSafeEqual(Buffer.from(c.tokenHash), Buffer.from(h))) return null;
  const company = (await getGroupCompanies(db)).find((x) => x.key === c.company);
  return { id: c.id, company: c.company, companyName: company?.tradeName || company?.legalName || c.company, name: c.name };
}

// ---------------------------------------------------------------------------
// No balcão: ler o cartão, registrar a compra, baixar o vale
// ---------------------------------------------------------------------------
async function memberByCard(db: Database, card: string) {
  const t = card.trim().toUpperCase().replace(/^CLUB:/, "").replace(/[^A-Z0-9]/g, "");
  if (!CARD.test(t)) throw new DomainError("CARD", "Código do cartão inválido. São 10 letras e números.");
  const c = await db.query.clubCards.findFirst({ where: eq(clubCards.token, t) });
  if (!c) throw new NotFoundError("Cartão não encontrado. Peça ao cliente para abrir o cartão no Meu Brás → Club.");
  const u = await db.query.users.findFirst({ where: eq(users.id, c.userId), columns: { id: true, name: true } });
  if (!u) throw new NotFoundError("Cartão não encontrado.");
  return u;
}

/** O que o balcão vê do cartão: primeiro nome, saldo e o valor dos vales ativos. Nada de documento, e-mail ou telefone. */
export async function counterLookup(db: Database, token: string, card: string, now = new Date()) {
  const counter = await counterByToken(db, token);
  if (!counter) throw new NotFoundError("Balcão indisponível.");
  const u = await memberByCard(db, card);
  const [bal, vouchers] = await Promise.all([clubBalance(db, u.id, now), db.select({ valueCents: clubVouchers.valueCents, expiresAt: clubVouchers.expiresAt }).from(clubVouchers).where(and(eq(clubVouchers.userId, u.id), eq(clubVouchers.status, "ATIVO"), gte(clubVouchers.expiresAt, now.toISOString())))]);
  // O código do vale não aparece: o cliente mostra o vale no celular dele (o balcão não usa vale sem o cliente).
  return { name: firstName(u.name), available: bal.available, vouchers: vouchers.map((v) => ({ valueCents: v.valueCents, expiresAt: new Date(v.expiresAt).toISOString() })) };
}

const purchaseSchema = z.object({
  card: z.string().trim().min(4).max(40),
  valueCents: z.number().int().min(100, "Informe o valor da compra").max(100_000_000),
  receipt: z.string().trim().max(60).optional().transform((v) => v || null),
  voucherCode: z.string().trim().max(20).optional().transform((v) => v || null),
  /** Cartão do guia de excursão que trouxe o passageiro (opcional): ele ganha o percentual da regra em pontos. */
  guideCard: z.string().trim().max(40).optional().transform((v) => v || null),
});

/**
 * Registra a compra no balcão: pontos pagos pela empresa (regra `purchase` do Club), uma vez por cupom. Se veio vale,
 * baixa junto (o vale tem de ser do dono do cartão e cobrir no máximo o percentual da regra). Compra acima do valor de
 * revisão nasce em revisão do Master.
 */
export async function registerPurchase(db: Database, token: string, raw: z.input<typeof purchaseSchema>, now = new Date()) {
  const counter = await counterByToken(db, token);
  if (!counter) throw new NotFoundError("Balcão indisponível.");
  const v = purchaseSchema.parse(raw);
  const rules = await getClubRules(db);
  if (!rules.purchase.companies.includes(counter.company)) throw new DomainError("COMPANY", "Esta empresa ainda não dá pontos por compra. Fale com a NextLevel.");
  const u = await memberByCard(db, v.card);
  const guide = v.guideCard ? await memberByCard(db, v.guideCard) : null;
  if (guide && guide.id === u.id) throw new DomainError("GUIDE", "O guia não pode ser o próprio cliente.");
  if (v.receipt && (await db.query.clubPurchases.findFirst({ where: and(eq(clubPurchases.company, counter.company), eq(clubPurchases.receipt, v.receipt)), columns: { id: true } }))) throw new DomainError("DUP", "Esse cupom já foi registrado.");
  let discountCents = 0;
  if (v.voucherCode) {
    const voucher = await db.query.clubVouchers.findFirst({ where: eq(clubVouchers.code, v.voucherCode.toUpperCase()), columns: { valueCents: true, userId: true } });
    if (!voucher) throw new NotFoundError("Vale não encontrado.");
    if (voucher.userId !== u.id) throw new DomainError("OWNER", "Esse vale é de outra pessoa. Use o vale do dono do cartão.");
    if (voucher.valueCents > Math.floor((v.valueCents * rules.purchase.maxDiscountPct) / 100)) throw new DomainError("MAX", `O vale cobre até ${rules.purchase.maxDiscountPct}% da compra.`);
    discountCents = (await spendVoucherAt(db, v.voucherCode, counter.company, `Balcão ${counter.name}${v.receipt ? ` · cupom ${v.receipt}` : ""}`, now, { userId: u.id })).valueCents;
  }
  // Pontos sobre o que o cliente pagou (compra menos o vale).
  const paid = v.valueCents - discountCents;
  const points = Math.floor((paid / 100) * rules.purchase.pointsPerReal);
  const id = newId("clpu");
  await db.insert(clubPurchases).values({ id, counterId: counter.id, company: counter.company, userId: u.id, valueCents: v.valueCents, points, receipt: v.receipt });
  const credit = points > 0 ? await creditPoints(db, { userId: u.id, points, source: "PURCHASE", referenceId: id, funder: counter.company, review: v.valueCents > rules.purchase.reviewAboveCents, note: `Compra na ${counter.companyName}` }, rules, now) : null;
  // Guia de excursão (D121): percentual do que o passageiro pagou, em pontos, pago pela empresa da compra.
  const guidePoints = guide ? Math.floor((paid * rules.cross.guidePct) / 100) : 0;
  if (guide && guidePoints > 0) await creditPoints(db, { userId: guide.id, points: guidePoints, source: "GUIDE", referenceId: id, funder: counter.company, review: v.valueCents > rules.purchase.reviewAboveCents, note: `Passageiro comprou na ${counter.companyName}` }, rules, now);
  await db.update(clubCounters).set({ lastUsedAt: now.toISOString() }).where(eq(clubCounters.id, counter.id));
  return { name: firstName(u.name), points, inReview: credit?.status === "REVISAO", discountCents, guideName: guide ? firstName(guide.name) : null, guidePoints };
}

// ---------------------------------------------------------------------------
// Acerto entre empresas (Master)
// ---------------------------------------------------------------------------
const monthRange = (month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return { from: new Date(Date.UTC(y, m - 1, 1, 3)).toISOString(), to: new Date(Date.UTC(y, m, 1, 3)).toISOString() };
};
export const monthOf = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 7);

/**
 * Quem deve a quem no mês: cada vale usado numa empresa foi pago pelos pontos de quem os concedeu (ordem de chegada).
 * Se quem concedeu é outra empresa, ela deve à empresa onde o vale foi usado. As dívidas entre duas empresas se compensam.
 */
export async function settlementReport(db: Database, actor: Actor, month: string) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  if (!/^\d{4}-\d{2}$/.test(month)) throw new DomainError("MONTH", "Mês inválido.");
  const { from, to } = monthRange(month);
  const used = await db.select({ id: clubVouchers.id, points: clubVouchers.points, valueCents: clubVouchers.valueCents, usedBy: clubVouchers.usedBy }).from(clubVouchers).where(and(eq(clubVouchers.status, "USADO"), gte(clubVouchers.usedAt, from), lt(clubVouchers.usedAt, to)));
  const funding = used.length ? await db.select().from(clubVoucherFunding).where(inArray(clubVoucherFunding.voucherId, used.map((u) => u.id))) : [];
  const gross = new Map<string, number>();
  let totalCents = 0;
  for (const v of used) {
    totalCents += v.valueCents;
    for (const f of funding.filter((x) => x.voucherId === v.id)) {
      if (!v.usedBy || f.funder === v.usedBy) continue;
      const k = `${f.funder}>${v.usedBy}`;
      gross.set(k, (gross.get(k) ?? 0) + Math.round((v.valueCents * f.points) / Math.max(1, v.points)));
    }
  }
  const lines: { debtor: string; creditor: string; amountCents: number; settledCents: number }[] = [];
  const seen = new Set<string>();
  for (const [k, amount] of gross) {
    const [a, b] = k.split(">") as [string, string];
    const pair = [a, b].sort().join("|");
    if (seen.has(pair)) continue;
    seen.add(pair);
    const net = amount - (gross.get(`${b}>${a}`) ?? 0);
    if (net !== 0) lines.push(net > 0 ? { debtor: a, creditor: b, amountCents: net, settledCents: 0 } : { debtor: b, creditor: a, amountCents: -net, settledCents: 0 });
  }
  const settled = await db.select().from(clubSettlements).where(eq(clubSettlements.month, month));
  for (const l of lines) l.settledCents = settled.filter((s) => s.debtor === l.debtor && s.creditor === l.creditor).reduce((s, x) => s + x.amountCents, 0);
  const companies = await getGroupCompanies(db);
  const label = (k: string) => companies.find((c) => c.key === k)?.tradeName || companies.find((c) => c.key === k)?.legalName || k;
  return { month, vouchers: used.length, totalCents, lines: lines.map((l) => ({ ...l, debtorName: label(l.debtor), creditorName: label(l.creditor), openCents: Math.max(0, l.amountCents - l.settledCents) })) };
}

/** Marca o acerto feito fora do sistema (nota ou transferência), pelo valor em aberto da linha. */
export async function markSettled(db: Database, actor: Actor, month: string, debtor: string, creditor: string, note?: string) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  const rep = await settlementReport(db, actor, month);
  const line = rep.lines.find((l) => l.debtor === debtor && l.creditor === creditor);
  if (!line || line.openCents <= 0) throw new DomainError("NOTHING", "Nada em aberto entre essas empresas neste mês.");
  const id = newId("clst");
  await db.insert(clubSettlements).values({ id, month, debtor, creditor, amountCents: line.openCents, note: note?.trim().slice(0, 200) || null, settledBy: actor.userId });
  await recordAudit(db, actor, { action: "CLUB_SETTLEMENT_MARKED", entityType: "club_settlement", entityId: id, after: { month, debtor, creditor, amountCents: line.openCents } }, { force: true });
  return { ok: true as const, amountCents: line.openCents };
}

/** Compras registradas nos balcões (Master), as mais recentes. */
export async function recentPurchases(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ p: clubPurchases, name: users.name }).from(clubPurchases).innerJoin(users, eq(users.id, clubPurchases.userId)).orderBy(desc(clubPurchases.createdAt)).limit(50);
  return rows.map(({ p, name }) => ({ id: p.id, company: p.company, name: firstName(name), valueCents: p.valueCents, points: p.points, receipt: p.receipt, at: new Date(p.createdAt).toISOString() }));
}
