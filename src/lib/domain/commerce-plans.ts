import { activeDoor, doorFields } from "./precos/porta-entrada";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";
import { inTreatment } from "./experimentos";
import { and, count, desc, eq, gte, inArray, lt, ne, sql, sum } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { financeInvoices, nlSubscriptions, offerRedemptions, orders, stores, type InvoiceLine, type NlSubscriptionStatus, type Store } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ENTRY_OFFER_KEY } from "@/lib/finance/catalog-seed";
import { annualSaving } from "@/lib/finance/catalog-pricing";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { activeOffer, getCatalogItem, listCatalog } from "./nl-catalog";
import { paidCountForSubscription, recordSaleCommission } from "./corporate-commissions";

/**
 * Planos da NextLevel E-commerce (D90). A assinatura guarda o preço e a taxa de plataforma CONGELADOS na contratação.
 * O acesso continua travado por `stores.trial_ends_at` / `paid_until` (regra usada por todas as telas): esta camada
 * só decide quanto cobrar, quando, e aplica a oferta de entrada (3 dias, R$ 9,90 no 1º mês, taxa zero por 3 meses),
 * uma vez por CPF/CNPJ.
 */
export const COMMERCE_PLAN_KEYS = ["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE"] as const;
export type CommercePlanKey = (typeof COMMERCE_PLAN_KEYS)[number];
export type PlanCycle = "MONTHLY" | "ANNUAL";
export type NlSubscription = typeof nlSubscriptions.$inferSelect;
const DAY = 86_400_000;
const addMonths = (d: Date, m: number) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + m); return x; };

export const STATUS_LABEL: Record<NlSubscriptionStatus, string> = { trial: "Em teste", pending_payment: "Aguardando pagamento", active: "Ativa", past_due: "Em atraso", suspended: "Suspensa", cancelled: "Cancelada", expired: "Expirada" };

export async function subscriptionOf(db: Database, storeId: string) {
  return (await db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, storeId) })) ?? null;
}

async function planPrice(db: Database, productKey: string, cycle: PlanCycle) {
  if (!(COMMERCE_PLAN_KEYS as readonly string[]).includes(productKey)) throw new DomainError("PLAN", "Plano inválido. Para o Enterprise, peça uma proposta.");
  const p = await getCatalogItem(db, { key: productKey });
  if (!p) throw new DomainError("PLAN_UNAVAILABLE", "Este plano não está disponível agora.");
  const v = p.prices[cycle];
  if (!v || v.amountCents === null) throw new DomainError("PLAN_PRICE", "Preço do plano não publicado.");
  return { product: p, version: v, amountCents: v.amountCents, feeBps: v.platformFeeBps ?? Number(p.meta.platformFeeBps ?? 0) };
}

/** Oferta de entrada aplicável a este CPF/CNPJ (sem consumir). */
export async function entryOfferFor(db: Database, taxId: string | null, cycle: PlanCycle, now = new Date()) {
  const offer = await activeOffer(db, ENTRY_OFFER_KEY, now);
  if (!offer || !offer.rules.appliesToCycles.includes(cycle)) return null;
  if (taxId && (await db.query.offerRedemptions.findFirst({ where: and(eq(offerRedemptions.offerKey, ENTRY_OFFER_KEY), eq(offerRedemptions.taxId, taxId)) }))) return null;
  return offer;
}

/**
 * Abre a assinatura de uma loja Commerce. Com a oferta de entrada: teste de N dias, primeiro mês pelo valor da oferta
 * e taxa zero pelos meses de carência; sem ela (CPF/CNPJ já usou): acesso só depois do pagamento.
 */
export async function startCommerceSubscription(db: Database, input: { storeId: string; productKey: string; cycle: PlanCycle; taxId: string | null; actor?: Actor | null; now?: Date; allowOffer?: boolean }) {
  const now = input.now ?? new Date();
  if (await subscriptionOf(db, input.storeId)) throw new DomainError("SUB_EXISTS", "Esta loja já tem assinatura.");
  const price = await planPrice(db, input.productKey, input.cycle);
  const { version } = price;
  // Porta de entrada da Commerce ligada (D126): teste reverso que cai no grátis, no lugar da oferta de entrada clássica.
  const door = input.allowOffer === false || !(await inTreatment(db, "PORTA_COMMERCE", input.storeId, now)) ? null : await activeDoor(db, "NEXTLEVEL_COMMERCE", now);
  if (door && input.taxId) {
    const claimed = await db.insert(offerRedemptions).values({ id: newId("ofr"), offerKey: door.offerKey, offerVersion: door.version, taxId: input.taxId, storeId: input.storeId }).onConflictDoNothing().returning({ id: offerRedemptions.id });
    if (claimed.length) {
      // Experimento com os preços da Proposta (D140): mensalidade e taxa do plano vêm da porta, congeladas na assinatura.
      const dp = door.planPrices?.[input.productKey];
      const amountCents = dp ? dp.monthlyCents * (input.cycle === "ANNUAL" ? (door.annualPromo?.paidMonths ?? 12) : 1) : price.amountCents;
      const feeBps = dp?.feeBps ?? price.feeBps;
      const ends = new Date(now.getTime() + door.trialDays * DAY);
      const id = newId("nls");
      await db.insert(nlSubscriptions).values({ id, storeId: input.storeId, productKey: input.productKey, cycle: input.cycle, status: door.trialDays > 0 ? "trial" : "pending_payment", priceVersionId: version.id, amountCents, platformFeeBps: feeBps, offerKey: door.offerKey, offerVersion: door.version, firstPeriodCents: null, trialEndsAt: door.trialDays > 0 ? ends.toISOString() : null, feeHolidayUntil: null });
      await db.update(stores).set({ trialEndsAt: ends.toISOString(), updatedAt: now.toISOString(), ...doorFields(door, now) }).where(eq(stores.id, input.storeId));
      await recordFinancialAudit(db, input.actor ?? null, { domain: CORPORATE, action: "SUBSCRIPTION_STARTED", entityType: "nl_subscription", entityId: id, storeId: input.storeId, after: { productKey: input.productKey, cycle: input.cycle, amountCents, platformFeeBps: feeBps, offer: `${door.offerKey} v${door.version}`, trialEndsAt: ends.toISOString(), door: door.mode } });
      await emitEvent(db, { type: "COMMERCE_SUBSCRIPTION_STARTED", storeId: input.storeId, payload: { productKey: input.productKey, cycle: input.cycle, offer: true, door: true }, dedupeKey: `COMMERCE_SUB:${input.storeId}` });
      return { subscriptionId: id, trial: door.trialDays > 0, trialEndsAt: door.trialDays > 0 ? ends : null, offerApplied: true };
    }
  }
  const { amountCents, feeBps } = price;
  let offer = input.allowOffer === false ? null : await entryOfferFor(db, input.taxId, input.cycle, now);
  if (offer && input.taxId) {
    // A chave única (oferta, CPF/CNPJ) é a trava real contra duas lojas do mesmo cliente ao mesmo tempo.
    const r = await db.insert(offerRedemptions).values({ id: newId("ofr"), offerKey: offer.key, offerVersion: offer.version, taxId: input.taxId, storeId: input.storeId }).onConflictDoNothing().returning({ id: offerRedemptions.id });
    if (!r.length) offer = null;
  } else offer = null;
  const trialEnds = offer && offer.rules.trialDays > 0 ? new Date(now.getTime() + offer.rules.trialDays * DAY) : null;
  const feeHoliday = offer && offer.rules.feeHolidayMonths > 0 ? addMonths(now, offer.rules.feeHolidayMonths) : null;
  const id = newId("nls");
  await db.insert(nlSubscriptions).values({ id, storeId: input.storeId, productKey: input.productKey, cycle: input.cycle, status: trialEnds ? "trial" : "pending_payment", priceVersionId: version.id, amountCents, platformFeeBps: feeBps, offerKey: offer?.key ?? null, offerVersion: offer?.version ?? null, firstPeriodCents: offer && input.cycle === "MONTHLY" ? offer.rules.firstPeriodCents : null, trialEndsAt: trialEnds?.toISOString() ?? null, feeHolidayUntil: feeHoliday?.toISOString() ?? null });
  // Acesso: em teste até o fim do teste; sem teste, bloqueado até pagar (tela de pagamento abre sozinha).
  await db.update(stores).set({ trialEndsAt: (trialEnds ?? new Date(now.getTime() - 1000)).toISOString(), updatedAt: now.toISOString() }).where(eq(stores.id, input.storeId));
  await recordFinancialAudit(db, input.actor ?? null, { domain: CORPORATE, action: "SUBSCRIPTION_STARTED", entityType: "nl_subscription", entityId: id, storeId: input.storeId, after: { productKey: input.productKey, cycle: input.cycle, amountCents, platformFeeBps: feeBps, offer: offer ? `${offer.key} v${offer.version}` : null, trialEndsAt: trialEnds?.toISOString() ?? null, feeHolidayUntil: feeHoliday?.toISOString() ?? null } });
  await emitEvent(db, { type: "COMMERCE_SUBSCRIPTION_STARTED", storeId: input.storeId, payload: { productKey: input.productKey, cycle: input.cycle, offer: !!offer }, dedupeKey: `COMMERCE_SUB:${input.storeId}` });
  return { subscriptionId: id, trial: !!trialEnds, trialEndsAt: trialEnds, offerApplied: !!offer };
}

/** Valor do próximo ciclo: 1º mês da oferta (se ainda não houve pagamento) ou o valor congelado. */
export async function nextChargeOf(db: Database, sub: NlSubscription) {
  const paid = await paidCountForSubscription(db, sub.storeId);
  const first = paid === 0 && sub.firstPeriodCents !== null && sub.cycle === "MONTHLY";
  return { amountCents: first ? sub.firstPeriodCents! : sub.amountCents, seq: paid + 1, firstPeriodOffer: first, months: sub.cycle === "ANNUAL" ? 12 : 1 };
}

/** Fatura em aberto da assinatura (idempotente por número do ciclo). Paga pelo checkout Pix/cartão de faturas existente. */
export async function ensureSubscriptionInvoice(db: Database, store: Pick<Store, "id" | "name">, now = new Date()) {
  let sub = await subscriptionOf(db, store.id);
  if (!sub) return null;
  // Assinatura encerrada e cliente de volta (tela de pagamento): reativa no mesmo plano congelado, aguardando pagamento.
  if (sub.status === "cancelled" || sub.status === "expired") {
    await db.update(nlSubscriptions).set({ status: "pending_payment", cancelAtPeriodEnd: false, canceledAt: null, updatedAt: now.toISOString() }).where(eq(nlSubscriptions.id, sub.id));
    await recordFinancialAudit(db, null, { domain: CORPORATE, action: "SUBSCRIPTION_REOPENED", entityType: "nl_subscription", entityId: sub.id, storeId: store.id, before: { status: sub.status }, after: { status: "pending_payment" } });
    sub = (await subscriptionOf(db, store.id))!;
  }
  const p = await getCatalogItem(db, { key: sub.productKey }, { includeUnpublished: true });
  const next = await nextChargeOf(db, sub);
  const dedupeKey = `NLSUB:${sub.id}:${next.seq}`;
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, dedupeKey) });
  if (existing && existing.status !== "CANCELED") return { invoiceId: existing.id, amountCents: existing.amountCents, description: existing.description, includesSetup: false };
  const key = existing ? `${dedupeKey}:${now.getTime()}` : dedupeKey;
  const name = nomePlanoEc(p?.name ?? sub.productKey);
  const cycleText = sub.cycle === "ANNUAL" ? "anual" : "mensal";
  const description = `${name} · ${cycleText}${next.firstPeriodOffer ? " (1º mês da oferta de entrada)" : ""}`;
  const lines: InvoiceLine[] = [{ kind: "STORE_PLAN", description: next.firstPeriodOffer ? `${name} · 1º mês pela oferta de entrada` : `${name} · ${next.months === 12 ? "12 meses" : "1 mês"}`, amountCents: next.amountCents }];
  const id = newId("fin");
  await db.insert(financeInvoices).values({ id, dedupeKey: key, payerType: "STORE", supplierId: null, storeId: store.id, kind: "STORE_PLAN", period: now.toISOString().slice(0, 7), description, amountCents: next.amountCents, lines, status: "OPEN", dueDate: new Date(now.getTime() + 3 * DAY).toISOString() });
  return { invoiceId: id, amountCents: next.amountCents, description, includesSetup: false };
}

/** Chamado quando a fatura `NLSUB:` é paga: ativa/renova a assinatura, soma o período e lança a comissão pela regra. */
export async function onSubscriptionInvoicePaid(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  const subId = inv.dedupeKey.split(":")[1];
  const sub = subId ? await db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.id, subId) }) : null;
  if (!sub || !inv.storeId) return;
  const store = await db.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
  if (!store) return;
  const months = sub.cycle === "ANNUAL" ? 12 : 1;
  // Período começa no fim do que já está pago, ou no fim do teste (pagar antes não "come" os dias de teste).
  const candidates = [now, store.paidUntil ? new Date(store.paidUntil) : null, store.trialEndsAt && sub.status === "trial" ? new Date(store.trialEndsAt) : null].filter((d): d is Date => !!d);
  const start = new Date(Math.max(...candidates.map((d) => d.getTime())));
  const end = addMonths(start, months);
  await db.update(stores).set({ paidUntil: end.toISOString(), status: store.status === "PENDING_PAYMENT" ? "ACTIVE" : store.status, updatedAt: now.toISOString() }).where(eq(stores.id, store.id));
  await db.update(nlSubscriptions).set({ status: "active", currentPeriodStart: start.toISOString(), currentPeriodEnd: end.toISOString(), updatedAt: now.toISOString() }).where(eq(nlSubscriptions.id, sub.id));
  await emitEvent(db, { type: "PLAN_PAID", storeId: store.id, payload: { months, until: end.toISOString(), invoiceId: inv.id, productKey: sub.productKey }, dedupeKey: `PLAN_PAID:${inv.id}` });
  await recordFinancialAudit(db, null, { domain: CORPORATE, action: "SUBSCRIPTION_PAID", entityType: "nl_subscription", entityId: sub.id, storeId: store.id, before: { status: sub.status }, after: { status: "active", periodEnd: end.toISOString(), invoiceId: inv.id, amountCents: inv.amountCents } });
  if (store.partnerId && !store.attributionFlag) {
    const index = await paidCountForSubscription(db, store.id);
    await recordSaleCommission(db, { partnerId: store.partnerId, family: "COMMERCE_PLAN", productKey: sub.productKey, cycle: sub.cycle, paymentIndex: index, paidCents: inv.amountCents, feeCents: null, storeId: store.id, invoiceId: inv.id, dedupeKey: `SUBCOM:${inv.id}`, now });
  }
}

const changeSchema = z.object({ productKey: z.enum(COMMERCE_PLAN_KEYS), cycle: z.enum(["MONTHLY", "ANNUAL"]) });

/**
 * Lojista escolhe/troca o plano. Sem assinatura: abre (com a oferta, se elegível). Com assinatura: novo preço e taxa
 * valem a partir da próxima fatura; a fatura em aberto é cancelada e refeita. Histórico fica na auditoria.
 */
export async function choosePlan(db: Database, actor: Actor, raw: z.input<typeof changeSchema>, now = new Date()) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da loja escolhe o plano.");
  const input = changeSchema.parse(raw);
  const store = await db.query.stores.findFirst({ where: eq(stores.id, actor.storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const { isCommerceStore } = await import("@/lib/store-brand");
  if (!(await isCommerceStore(db, store))) throw new DomainError("NOT_COMMERCE", "Os planos Commerce são para lojas da NextLevel E-commerce.");
  const sub = await subscriptionOf(db, store.id);
  if (!sub) {
    // Loja que já pagou antes (contas antigas) não é cliente novo: sem oferta de entrada.
    return startCommerceSubscription(db, { storeId: store.id, productKey: input.productKey, cycle: input.cycle, taxId: store.taxId ?? null, actor, now, allowOffer: !store.paidUntil && !!store.taxId });
  }
  if (sub.productKey === input.productKey && sub.cycle === input.cycle && !["cancelled", "expired"].includes(sub.status)) return { subscriptionId: sub.id, trial: sub.status === "trial", trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null, offerApplied: !!sub.offerKey };
  const { version, amountCents, feeBps } = await planPrice(db, input.productKey, input.cycle);
  await db.update(financeInvoices).set({ status: "CANCELED" }).where(and(eq(financeInvoices.storeId, store.id), eq(financeInvoices.status, "OPEN"), sql`${financeInvoices.dedupeKey} like ${`NLSUB:${sub.id}:%`}`));
  const reopened: NlSubscriptionStatus = sub.status === "cancelled" || sub.status === "expired" ? "pending_payment" : sub.status;
  await db.update(nlSubscriptions).set({ productKey: input.productKey, cycle: input.cycle, priceVersionId: version.id, amountCents, platformFeeBps: feeBps, firstPeriodCents: input.cycle === "MONTHLY" ? sub.firstPeriodCents : null, status: reopened, cancelAtPeriodEnd: false, canceledAt: null, updatedAt: now.toISOString() }).where(eq(nlSubscriptions.id, sub.id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_PLAN_CHANGED", entityType: "nl_subscription", entityId: sub.id, storeId: store.id, before: { productKey: sub.productKey, cycle: sub.cycle, amountCents: sub.amountCents, platformFeeBps: sub.platformFeeBps, status: sub.status }, after: { productKey: input.productKey, cycle: input.cycle, amountCents, platformFeeBps: feeBps, status: reopened } });
  return { subscriptionId: sub.id, trial: reopened === "trial", trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null, offerApplied: !!sub.offerKey };
}

/** Cancelamento: o acesso segue até o fim do período pago; nada é cobrado depois. */
export async function cancelSubscription(db: Database, actor: Actor, reason: string, now = new Date()) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da loja cancela a assinatura.");
  const sub = await subscriptionOf(db, actor.storeId);
  if (!sub) throw new NotFoundError("Assinatura não encontrada.");
  await db.update(nlSubscriptions).set({ cancelAtPeriodEnd: true, updatedAt: now.toISOString(), ...(sub.status === "trial" || sub.status === "pending_payment" ? { status: "cancelled" as const, canceledAt: now.toISOString() } : {}) }).where(eq(nlSubscriptions.id, sub.id));
  await db.update(financeInvoices).set({ status: "CANCELED" }).where(and(eq(financeInvoices.storeId, actor.storeId), eq(financeInvoices.status, "OPEN"), sql`${financeInvoices.dedupeKey} like ${`NLSUB:${sub.id}:%`}`));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_CANCEL_REQUESTED", entityType: "nl_subscription", entityId: sub.id, storeId: actor.storeId, before: { status: sub.status }, reason: z.string().trim().max(300).parse(reason || "sem motivo") });
}

/**
 * Rotina diária (com trava para não rodar duas ao mesmo tempo): fim do teste → aguardando pagamento; fim do período →
 * renovação (fatura nova) ou cancelamento; atraso → suspensão; aguardando há muito tempo → expirada.
 */
export async function runSubscriptionJobs(db: Database, now = new Date(), opts: { suspendAfterDays?: number; expireAfterDays?: number; renewAheadDays?: number } = {}) {
  const suspendAfter = opts.suspendAfterDays ?? 10, expireAfter = opts.expireAfterDays ?? 30, ahead = opts.renewAheadDays ?? 3;
  let locked = true;
  try { locked = Boolean(((await db.execute(sql`select pg_try_advisory_lock(90090) as ok`)) as { rows: { ok: boolean }[] }).rows[0]?.ok); } catch { locked = true; }
  if (!locked) return { skipped: true, changed: 0, invoices: 0 };
  let changed = 0, invoices = 0;
  try {
    const subs = await db.select().from(nlSubscriptions).where(inArray(nlSubscriptions.status, ["trial", "pending_payment", "active", "past_due", "suspended"]));
    for (const s of subs) {
      const set = async (status: NlSubscriptionStatus, extra: Partial<NlSubscription> = {}) => {
        const r = await db.update(nlSubscriptions).set({ status, updatedAt: now.toISOString(), ...extra }).where(and(eq(nlSubscriptions.id, s.id), eq(nlSubscriptions.status, s.status))).returning({ id: nlSubscriptions.id });
        if (r.length) { changed++; await recordFinancialAudit(db, null, { domain: CORPORATE, action: "SUBSCRIPTION_STATUS", entityType: "nl_subscription", entityId: s.id, storeId: s.storeId, before: { status: s.status }, after: { status } }); }
      };
      const end = s.currentPeriodEnd ? new Date(s.currentPeriodEnd) : null;
      if (s.status === "trial" && s.trialEndsAt && new Date(s.trialEndsAt) <= now) await set("pending_payment");
      else if (s.status === "pending_payment" && now.getTime() - new Date(s.updatedAt).getTime() > expireAfter * DAY) await set("expired");
      else if (s.status === "active" && end) {
        if (end <= now) await (s.cancelAtPeriodEnd ? set("cancelled", { canceledAt: now.toISOString() }) : set("past_due"));
        else if (!s.cancelAtPeriodEnd && end.getTime() - now.getTime() <= ahead * DAY) {
          const store = await db.query.stores.findFirst({ where: eq(stores.id, s.storeId) });
          if (store) { const before = await db.select({ n: count() }).from(financeInvoices).where(eq(financeInvoices.storeId, store.id)); await ensureSubscriptionInvoice(db, store, now); const after = await db.select({ n: count() }).from(financeInvoices).where(eq(financeInvoices.storeId, store.id)); if (after[0]!.n > before[0]!.n) invoices++; }
        }
      } else if (s.status === "past_due" && end && now.getTime() - end.getTime() > suspendAfter * DAY) await set("suspended");
    }
  } finally {
    try { await db.execute(sql`select pg_advisory_unlock(90090)`); } catch { /* sem trava */ }
  }
  return { skipped: false, changed, invoices };
}

// ---------------------------------------------------------------------------
// Taxa de plataforma (pedidos pagos pelo cliente final; sem frete; carência da oferta)
// ---------------------------------------------------------------------------
export async function platformFeeFor(db: Database, storeId: string, start: Date, end: Date) {
  const sub = await subscriptionOf(db, storeId);
  if (!sub) return null;
  const holiday = sub.feeHolidayUntil ? new Date(sub.feeHolidayUntil) : null;
  const from = holiday && holiday > start ? holiday : start;
  if (from >= end || sub.platformFeeBps <= 0) return { feeCents: 0, baseCents: 0, orders: 0, bps: sub.platformFeeBps, holidayUntil: sub.feeHolidayUntil };
  const [r] = await db.select({ base: sum(orders.subtotalCents), n: count() }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), ne(orders.paymentProvider, "DEMO"), gte(orders.createdAt, from.toISOString()), lt(orders.createdAt, end.toISOString())));
  const baseCents = Number(r?.base ?? 0);
  return { feeCents: Math.round((baseCents * sub.platformFeeBps) / 10_000), baseCents, orders: r?.n ?? 0, bps: sub.platformFeeBps, holidayUntil: sub.feeHolidayUntil };
}

// ---------------------------------------------------------------------------
// Vitrine dos planos (pública e no painel)
// ---------------------------------------------------------------------------
export type OfertaPublica = { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number; version: number };

/**
 * O que as páginas públicas prometem (D177): só o que TODA loja nova vai receber no cadastro. Sem porta de entrada, vale a
 * oferta clássica; com a porta ligada para todos, valem os termos da porta (que não tem 1º mês promocional nem taxa zero);
 * com a porta em experimento (metade das lojas), só o que as duas têm em comum. Nada de prometer 3 dias e entregar 7, ou
 * prometer R$ 9,90 a quem cai na porta.
 */
export function ofertaPublica(classica: OfertaPublica | null, porta: { trialDays: number; version: number } | null, emExperimento: boolean): OfertaPublica | null {
  const daPorta: OfertaPublica | null = porta ? { trialDays: porta.trialDays, firstPeriodCents: null, feeHolidayMonths: 0, version: porta.version } : null;
  if (!daPorta) return classica;
  const r = !emExperimento ? daPorta
    : { trialDays: Math.min(daPorta.trialDays, classica?.trialDays ?? 0), firstPeriodCents: null, feeHolidayMonths: 0, version: classica?.version ?? daPorta.version };
  return r.trialDays > 0 || r.firstPeriodCents !== null || r.feeHolidayMonths > 0 ? r : null;
}

export async function commercePlansView(db: Database, opts: { taxId?: string | null } = {}) {
  const items = await listCatalog(db, { families: ["COMMERCE_PLAN"] });
  const [offer, porta, experimento] = await Promise.all([
    activeOffer(db, ENTRY_OFFER_KEY), activeDoor(db, "NEXTLEVEL_COMMERCE"),
    db.query.experiments.findFirst({ where: (e, { and: a, eq: q }) => a(q(e.piece, "PORTA_COMMERCE"), q(e.status, "RODANDO")) }),
  ]);
  const classica = offer ? { trialDays: offer.rules.trialDays, firstPeriodCents: offer.rules.firstPeriodCents ?? null, feeHolidayMonths: offer.rules.feeHolidayMonths, version: offer.version } : null;
  return {
    offer: ofertaPublica(classica, porta, !!experimento),
    eligible: opts.taxId !== undefined ? !!(await entryOfferFor(db, opts.taxId ?? null, "MONTHLY")) : null,
    plans: items.map((p) => {
      const m = p.prices.MONTHLY, a = p.prices.ANNUAL;
      return { key: p.key, slug: p.slug, name: p.name, tagline: p.tagline, kind: p.kind, quote: p.kind === "quote_required", monthlyCents: m?.amountCents ?? null, annualCents: a?.amountCents ?? null, feeBps: m?.platformFeeBps ?? null, saving: m?.amountCents && a?.amountCents ? annualSaving(m.amountCents, a.amountCents) : null, features: (p.meta.features as string[] | undefined) ?? [] };
    }),
  };
}

/** Painel do Master: assinaturas Commerce. */
export async function listSubscriptions(db: Database, actor: Actor) {
  if (!isMaster(actor)) throw new ForbiddenError();
  return db.select({ sub: nlSubscriptions, storeName: stores.name, storeSlug: stores.slug }).from(nlSubscriptions).innerJoin(stores, eq(stores.id, nlSubscriptions.storeId)).orderBy(desc(nlSubscriptions.createdAt));
}
