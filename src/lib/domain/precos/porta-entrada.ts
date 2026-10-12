import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { catalogOffers, clubLedger, financeInvoices, stores, trialClaims, users, type OfferRules, type Store } from "@/db/schema";
import { newId } from "@/lib/ids";
import { activeOffer, listOffers, seededOnce } from "../nl-catalog";
import { type Actor, requireMasterFn } from "../access";
import { NotFoundError } from "../errors";
import { assertReauth, CORPORATE, recordFinancialAudit } from "../fin-audit";
import { emitEvent } from "../events";
import { creditPoints } from "../club/pontos";
import { getClubRules } from "../club/regras";

/**
 * Porta de entrada "grátis para começar, paga quando cresce" (D126, fase P5 do prompt de público e preço).
 * As regras moram nas ofertas do catálogo do Master (`catalog_offers`, chaves `PORTA_COMMERCE` e `PORTA_SUPERDROP`),
 * versionadas e **pausadas por padrão**. Quando a oferta da marca está ativa, a loja que entra recebe uma **cópia da
 * regra** (`stores.entry_offer`): quem entrou com uma condição mantém a dela, mesmo que o Master mude depois.
 */
export const DOOR_OFFER_KEYS = { NEXTLEVEL_COMMERCE: "PORTA_COMMERCE", SUPERDROP: "PORTA_SUPERDROP" } as const;
export type DoorBrand = keyof typeof DOOR_OFFER_KEYS;
export type MilestoneEvent = "STORE_PUBLISHED" | "FIRST_SALE";
export const MILESTONE_LABEL: Record<MilestoneEvent, string> = { STORE_PUBLISHED: "loja publicada", FIRST_SALE: "primeira venda" };

/** O que a loja recebeu ao entrar (cópia congelada da oferta). */
export type EntrySnapshot = {
  offerKey: string; version: number;
  mode: "REVERSE_TRIAL" | "FREE_TIER";
  trialDays: number;
  freeTierFeeBps: number;
  milestones: { event: MilestoneEvent; days: number }[];
  milestoneCapDays: number;
  annualPromo: { paidMonths: number; getMonths: number } | null;
  cashbackBps: number;
  /** Preços da Proposta (D140): mensalidade e taxa por plano, congeladas na loja. Sem isso valem os preços de hoje. */
  priceSource?: "PROPOSTA";
  planPrices?: Record<string, PlanPrice>;
};
export type PlanPrice = { monthlyCents: number; feeBps: number };

/**
 * Planos pagos da Proposta, por ordem de preço, ligados às chaves reais de cada marca (D140). O plano grátis da Proposta
 * vira a taxa do grátis da porta. Plano da Proposta que falta deixa o preço de hoje naquele plano.
 */
const PLAN_SLOTS: Record<DoorBrand, string[][]> = {
  NEXTLEVEL_COMMERCE: [["COMMERCE_START"], ["COMMERCE_PRO"], ["COMMERCE_SCALE"]],
  SUPERDROP: [["DROP_MANUAL", "STORE_SUBDOMAIN"], ["STORE_OWN"]],
};
export function proposalPrices(ladder: { monthlyCents: number; feeBps: number }[], brand: DoorBrand) {
  const free = ladder.find((p) => p.monthlyCents === 0);
  const paid = ladder.filter((p) => p.monthlyCents > 0).sort((a, b) => a.monthlyCents - b.monthlyCents);
  const planPrices: Record<string, PlanPrice> = {};
  PLAN_SLOTS[brand].forEach((keys, i) => { const p = paid[i]; if (p) for (const k of keys) planPrices[k] = { monthlyCents: p.monthlyCents, feeBps: p.feeBps }; });
  return { freeTierFeeBps: free ? free.feeBps : null, planPrices };
}

/** Preço congelado na loja para um plano (porta com os preços da Proposta), ou `null` = vale o preço de hoje. */
export function doorPlanPrice(entryOffer: unknown, planKey: string): PlanPrice | null {
  return (entryOffer as EntrySnapshot | null | undefined)?.planPrices?.[planKey] ?? null;
}

/** Oferta de porta ativa da marca (ou `null` = desligada, comportamento de hoje). */
export async function activeDoor(db: Database, brand: DoorBrand, now = new Date()): Promise<EntrySnapshot | null> {
  const o = await activeOffer(db, DOOR_OFFER_KEYS[brand], now);
  if (!o) return null;
  const snap = snapshotOf(o.key, o.version, o.rules);
  if (!snap || o.rules.priceSource !== "PROPOSTA") return snap;
  // Experimento com os preços da Proposta (D140): a escada é lida agora e fica congelada na loja que entrar.
  const { getProposal } = await import("./proposta");
  const x = proposalPrices((await getProposal(db)).brands[brand].ladder, brand);
  return { ...snap, priceSource: "PROPOSTA", freeTierFeeBps: x.freeTierFeeBps ?? snap.freeTierFeeBps, planPrices: x.planPrices };
}

export function snapshotOf(key: string, version: number, r: OfferRules): EntrySnapshot | null {
  if (r.mode !== "REVERSE_TRIAL" && r.mode !== "FREE_TIER") return null;
  return {
    offerKey: key, version, mode: r.mode,
    trialDays: r.mode === "FREE_TIER" ? 0 : r.trialDays,
    freeTierFeeBps: r.freeTierFeeBps ?? 0,
    milestones: (r.milestoneDays ?? []).filter((m) => m.days > 0),
    milestoneCapDays: r.milestoneCapDays ?? r.trialDays,
    annualPromo: r.annualPromo ?? null,
    cashbackBps: r.cashbackBps ?? 0,
  };
}

const DAY = 86_400_000;

/**
 * Dia ganho por conquista (loja publicada, primeira venda): soma dias ao teste reverso, uma vez por conquista e até o teto
 * contado desde o início do teste. Fora do teste (já pagou, caiu no grátis ou sem porta) não faz nada.
 */
export async function applyTrialMilestone(db: Database, storeId: string, event: MilestoneEvent, now = new Date()) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  const snap = store?.entryOffer as EntrySnapshot | null | undefined;
  if (!store || !snap || snap.mode !== "REVERSE_TRIAL" || !store.trialEndsAt || !store.trialStartedAt) return null;
  if (new Date(store.trialEndsAt) <= now || (store.paidUntil && new Date(store.paidUntil) > now)) return null;
  const m = snap.milestones.find((x) => x.event === event);
  if (!m) return null;
  const cap = new Date(new Date(store.trialStartedAt).getTime() + snap.milestoneCapDays * DAY);
  const current = new Date(store.trialEndsAt);
  const target = new Date(Math.min(current.getTime() + m.days * DAY, cap.getTime()));
  if (target <= current) return null;
  // Uma vez por conquista (o evento com chave única não repete).
  const first = await emitEvent(db, { type: "TRIAL_MILESTONE", storeId, payload: { event, days: m.days, endsAt: target.toISOString() }, dedupeKey: `TRIAL_MILESTONE:${storeId}:${event}` });
  if (!first) return null;
  await db.update(stores).set({ trialEndsAt: target.toISOString(), updatedAt: now.toISOString() }).where(eq(stores.id, storeId));
  return { event, addedDays: Math.round((target.getTime() - current.getTime()) / DAY), trialEndsAt: target };
}

/**
 * Porta com os preços da Proposta (D140): a fatura de ativação ainda em aberto (setup + 1º mês, criada no cadastro com o
 * preço de hoje) passa a cobrar o 1º mês pelo preço congelado na loja. O setup não muda.
 */
export async function repriceOpenSetup(db: Database, storeId: string, offerKey: string, snap: EntrySnapshot) {
  const price = snap.planPrices?.[offerKey];
  if (!price) return null;
  const inv = await db.query.financeInvoices.findFirst({ where: and(eq(financeInvoices.dedupeKey, `STORESETUP:${storeId}`), eq(financeInvoices.status, "OPEN")) });
  if (!inv) return null;
  const lines = inv.lines.map((l) => (l.kind === "STORE_FIRST_MONTH" ? { ...l, amountCents: price.monthlyCents } : l));
  const amountCents = lines.reduce((t, l) => t + l.amountCents, 0);
  await db.update(financeInvoices).set({ lines, amountCents }).where(eq(financeInvoices.id, inv.id));
  return { invoiceId: inv.id, amountCents };
}

/** Grava a porta na loja ao começar o teste (dentro da mesma operação que cria o teste). */
export function doorFields(snap: EntrySnapshot, now: Date) {
  return { entryOffer: snap, trialStartedAt: now.toISOString() } satisfies Partial<Store>;
}

/** Fatura de plano paga → parte em pontos do Club para o dono da loja (uma vez por fatura). */
export async function creditPlanCashback(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (!inv.storeId || !["STORE_PLAN", "STORE_SETUP"].includes(inv.kind) || inv.status !== "PAID") return null;
  const store = await db.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
  const snap = store?.entryOffer as EntrySnapshot | null | undefined;
  if (!store || !snap?.cashbackBps) return null;
  const owner = await db.query.users.findFirst({ where: and(eq(users.storeId, store.id), eq(users.role, "STORE_OWNER")) });
  if (!owner) return null;
  const rules = await getClubRules(db);
  const cents = Math.floor((inv.amountCents * snap.cashbackBps) / 10_000);
  const points = Math.floor((cents * rules.pointsPerReal) / 100);
  return creditPoints(db, { userId: owner.id, points, source: "PLAN_CASHBACK", referenceId: inv.id, funder: "NEXTLEVEL", note: `Cashback do plano: ${inv.description}` }, rules, now);
}

/** Estorno da fatura → os pontos do cashback voltam (uma vez). */
export async function reversePlanCashback(db: Database, invoiceId: string) {
  const earned = await db.select().from(clubLedger).where(and(eq(clubLedger.source, "PLAN_CASHBACK"), eq(clubLedger.referenceId, invoiceId)));
  const done = await db.select({ id: clubLedger.id }).from(clubLedger).where(and(eq(clubLedger.source, "PLAN_CASHBACK_REVERSAL"), inArray(clubLedger.referenceId, [invoiceId])));
  const e = earned[0];
  if (!e || done.length) return null;
  await db.insert(clubLedger).values({ id: newId("clg"), userId: e.userId, points: -e.points, kind: "REVERSE", status: "DISPONIVEL", source: "PLAN_CASHBACK_REVERSAL", referenceId: invoiceId, funder: e.funder, note: "Fatura do plano estornada: cashback devolvido" });
  return { points: e.points };
}

/** Teste reverso por CPF/CNPJ (mesma regra antiabuso do teste com cupom). */
export async function taxIdUsedTrial(db: Database, taxId: string) {
  return !!(await db.query.trialClaims.findFirst({ where: eq(trialClaims.taxId, taxId) }));
}

// ---------------------------------------------------------------------------
// Master: versões da porta de entrada (pausada por padrão; quem entrou mantém a condição que recebeu)
// ---------------------------------------------------------------------------
export const doorVersionSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
  mode: z.enum(["REVERSE_TRIAL", "FREE_TIER"]),
  trialDays: z.number().int().min(0).max(30),
  freeTierFeeBps: z.number().int().min(0).max(2_000),
  publishDays: z.number().int().min(0).max(30),
  firstSaleDays: z.number().int().min(0).max(30),
  milestoneCapDays: z.number().int().min(0).max(60),
  annualPaidMonths: z.number().int().min(0).max(12),
  cashbackBps: z.number().int().min(0).max(3_000),
  /** Usar a escada da Proposta de preço (D140) no lugar dos preços de hoje. */
  useProposalPrices: z.boolean().default(false),
  reason: z.string().trim().min(5).max(300),
}).refine((v) => v.milestoneCapDays >= v.trialDays, { message: "O teto do teste não pode ser menor que os dias de teste." });

export async function listDoors(db: Database, actor: Actor) {
  const all = await listOffers(db, actor);
  return (Object.keys(DOOR_OFFER_KEYS) as DoorBrand[]).map((brand) => ({ brand, offer: all.find((o) => o.key === DOOR_OFFER_KEYS[brand]) ?? null }));
}

export async function addDoorVersion(db: Database, actor: Actor, brand: DoorBrand, raw: z.input<typeof doorVersionSchema>, password: string | undefined) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  await assertReauth(db, actor, password);
  const v = doorVersionSchema.parse(raw);
  const key = DOOR_OFFER_KEYS[brand];
  await seededOnce(db);
  const last = (await db.select().from(catalogOffers).where(eq(catalogOffers.key, key)).orderBy(desc(catalogOffers.version)).limit(1))[0];
  if (!last) throw new NotFoundError("Porta de entrada não encontrada.");
  const rules: OfferRules = {
    ...last.rules, mode: v.mode, trialDays: v.mode === "FREE_TIER" ? 0 : v.trialDays, freeTierFeeBps: v.freeTierFeeBps,
    milestoneDays: [{ event: "STORE_PUBLISHED", days: v.publishDays }, { event: "FIRST_SALE", days: v.firstSaleDays }], milestoneCapDays: v.milestoneCapDays,
    annualPromo: v.annualPaidMonths > 0 ? { paidMonths: v.annualPaidMonths, getMonths: 12 } : null, cashbackBps: v.cashbackBps,
  };
  if (v.useProposalPrices) rules.priceSource = "PROPOSTA"; else delete rules.priceSource;
  const id = newId("cof");
  await db.insert(catalogOffers).values({ id, key, version: last.version + 1, name: last.name, status: v.status, rules, authorUserId: actor.userId, reason: v.reason });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "OFFER_VERSION_CREATED", entityType: "catalog_offer", entityId: id, before: { version: last.version, status: last.status, rules: last.rules }, after: { version: last.version + 1, status: v.status, rules }, reason: v.reason });
  return { id, version: last.version + 1 };
}
