import { and, count, desc, eq, gte, inArray, lt, ne, sql, sum } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, financeInvoices, networks, orders, plans, platformSettings, storeAcquisitions, stores, subscriptions, supplierContracts, suppliers, type FinanceInvoice, type InvoiceLine } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ACCESS_CAPABILITIES, accessStateForOverdue, closeSupplierMonth, daysBetween, defaultContract, isWaived, storeSetupCommission, type AccessState, type Capabilities, type ContractTerms } from "@/lib/finance/engine";
import { DEFAULT_PRICE_BOOK, OFFER_KEYS, priceBookSchema, TIER_KEYS, type OfferKey, type PriceBook, type SupplierModel, type TierKey } from "@/lib/finance/price-book";
import { DomainError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { fulfillPaidInvoice } from "./nextlevel-billing";

const PRICE_BOOK_KEY = "price_book";

// ---------------------------------------------------------------------------
// Tabela de preços
// ---------------------------------------------------------------------------
export async function getPriceBook(db: Database): Promise<PriceBook> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, PRICE_BOOK_KEY) });
  if (!row) return DEFAULT_PRICE_BOOK;
  const parsed = priceBookSchema.safeParse(row.value);
  return parsed.success ? parsed.data : DEFAULT_PRICE_BOOK;
}

export async function savePriceBook(db: Database, raw: unknown, userId: string): Promise<PriceBook> {
  const value = priceBookSchema.parse(raw);
  if (!(value.dunning.warningDays <= value.dunning.partialBlockDays && value.dunning.partialBlockDays <= value.dunning.suspendedDays && value.dunning.suspendedDays <= value.dunning.closedDays)) {
    throw new DomainError("DUNNING_ORDER", "Os prazos de atraso devem ser crescentes: aviso, bloqueio parcial, suspensão e encerramento.");
  }
  const before = await getPriceBook(db);
  await db.insert(platformSettings).values({ key: PRICE_BOOK_KEY, value, updatedBy: userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: userId, updatedAt: new Date().toISOString() } });
  // D90: a tabela do SuperDrop passa a ter versão na trilha só-inserção (antes e depois completos).
  const { recordFinancialAudit, CORPORATE } = await import("./fin-audit");
  await recordFinancialAudit(db, { userId, role: "NEXTLEVEL_MASTER", organizationId: "", supplierId: null, storeId: null }, { domain: CORPORATE, action: "PRICE_BOOK_SAVED", entityType: "price_book", entityId: PRICE_BOOK_KEY, before: before as unknown as Record<string, unknown>, after: value as unknown as Record<string, unknown> });
  return value;
}

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------
export type ContractRow = typeof supplierContracts.$inferSelect;

export const contractPatchSchema = z.object({
  tier: z.enum(TIER_KEYS).optional(),
  monthlyFeeCents: z.number().int().nonnegative().optional(),
  setupFeeCents: z.number().int().nonnegative().optional(),
  volumeFeeBps: z.number().int().min(0).max(10000).optional(),
  minMonthlyFeeCents: z.number().int().nonnegative().optional(),
  perOrderFeeCents: z.number().int().nonnegative().optional(),
  storeSetupCommissionBps: z.number().int().min(0).max(10000).optional(),
  monthlyWaivedUntil: z.string().nullable().optional(),
  setupWaivedUntil: z.string().nullable().optional(),
  priceLockUntil: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type ContractPatch = z.infer<typeof contractPatchSchema>;

export function contractTerms(row: ContractRow, model: SupplierModel): ContractTerms {
  return { model, tier: row.tier, monthlyFeeCents: row.monthlyFeeCents, setupFeeCents: row.setupFeeCents, volumeFeeBps: row.volumeFeeBps, minMonthlyFeeCents: row.minMonthlyFeeCents, perOrderFeeCents: row.perOrderFeeCents, storeSetupCommissionBps: row.storeSetupCommissionBps, monthlyWaivedUntil: row.monthlyWaivedUntil, setupWaivedUntil: row.setupWaivedUntil, priceLockUntil: row.priceLockUntil, creditBalanceCents: row.creditBalanceCents };
}

/** Cria o contrato a partir da tabela de preços se ainda não existir. Idempotente. */
export async function ensureContract(db: Database, supplierId: string, opts: { tier?: TierKey; waiveMonthly?: boolean; waiveSetup?: boolean; now?: Date } = {}): Promise<ContractRow> {
  const existing = await db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, supplierId) });
  if (existing) return existing;
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  if (!supplier) throw new NotFoundError("Fornecedor não encontrado.");
  const book = await getPriceBook(db);
  const now = opts.now ?? new Date();
  const c = defaultContract(book, supplier.businessModel, opts.tier ?? "GROWTH");
  const until = new Date(now); until.setDate(until.getDate() + book.billing.waiverDays);
  const lock = new Date(now); lock.setMonth(lock.getMonth() + book.billing.priceLockMonths);
  const values = {
    supplierId, tier: c.tier, monthlyFeeCents: c.monthlyFeeCents, setupFeeCents: c.setupFeeCents, volumeFeeBps: c.volumeFeeBps, minMonthlyFeeCents: c.minMonthlyFeeCents,
    perOrderFeeCents: c.perOrderFeeCents, storeSetupCommissionBps: c.storeSetupCommissionBps,
    monthlyWaivedUntil: opts.waiveMonthly ? until.toISOString() : null, setupWaivedUntil: opts.waiveSetup ? until.toISOString() : null,
    priceLockUntil: opts.waiveMonthly || opts.waiveSetup ? lock.toISOString() : null,
  };
  await db.insert(supplierContracts).values(values);
  return (await db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, supplierId) }))!;
}

export async function updateContract(db: Database, supplierId: string, raw: ContractPatch) {
  const patch = contractPatchSchema.parse(raw);
  await ensureContract(db, supplierId);
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  await db.update(supplierContracts).set({ ...clean, updatedAt: new Date().toISOString() }).where(eq(supplierContracts.supplierId, supplierId));
  // manter o modelo comercial do fornecedor coerente com a taxa contratada é decisão do master; aqui só valores.
  return (await db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, supplierId) }))!;
}

// ---------------------------------------------------------------------------
// Períodos e faturas
// ---------------------------------------------------------------------------
export const periodOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
export function periodBounds(period: string) {
  const [y, m] = period.split("-").map(Number) as [number, number];
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}
const dueDateFor = (period: string, monthOffset: number, day: number) => { const { start } = periodBounds(period); return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + monthOffset, day)).toISOString(); };

async function insertInvoiceOnce(db: Database, inv: Omit<typeof financeInvoices.$inferInsert, "id">): Promise<{ id: string; created: boolean }> {
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, inv.dedupeKey) });
  if (existing) return { id: existing.id, created: false };
  const id = newId("fin");
  await db.insert(financeInvoices).values({ id, ...inv });
  return { id, created: true };
}

const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Setup (quando houver) e primeira mensalidade do fornecedor, respeitando isenções. Idempotente. */
export async function issueSupplierOnboardingInvoices(db: Database, supplierId: string, now = new Date()) {
  const contract = await ensureContract(db, supplierId, { now });
  const book = await getPriceBook(db);
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  if (!supplier) throw new NotFoundError("Fornecedor não encontrado.");
  const due = new Date(now); due.setDate(due.getDate() + 5);
  if (contract.setupFeeCents > 0) {
    const waived = isWaived(contract.setupWaivedUntil, now);
    const lines: InvoiceLine[] = [{ kind: "SUPPLIER_SETUP", description: `Setup ${supplier.businessModel === "WHITE_LABEL" ? "White Label" : "SuperDrop"}`, amountCents: contract.setupFeeCents }];
    if (waived) lines.push({ kind: "WAIVER", description: "Isenção de setup concedida", amountCents: -contract.setupFeeCents });
    await insertInvoiceOnce(db, { dedupeKey: `SUPSETUP:${supplierId}`, payerType: "SUPPLIER", supplierId, kind: "SUPPLIER_SETUP", description: `Setup de ${supplier.name}`, amountCents: waived ? 0 : contract.setupFeeCents, lines, status: waived ? "WAIVED" : "OPEN", dueDate: due.toISOString() });
  }
  await issueSubscriptionInvoiceFor(db, supplier.id, contract, periodOf(now), now, book);
}

async function issueSubscriptionInvoiceFor(db: Database, supplierId: string, contract: ContractRow, period: string, now: Date, book: PriceBook) {
  const { start } = periodBounds(period);
  const waived = isWaived(contract.monthlyWaivedUntil, start > now ? start : now);
  const lines: InvoiceLine[] = [{ kind: "SUPPLIER_SUBSCRIPTION", description: `Mensalidade ${period}`, amountCents: contract.monthlyFeeCents }];
  if (waived) lines.push({ kind: "WAIVER", description: "Isenção de mensalidade concedida", amountCents: -contract.monthlyFeeCents });
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  return insertInvoiceOnce(db, { dedupeKey: `SUB:${supplierId}:${period}`, payerType: "SUPPLIER", supplierId, kind: "SUPPLIER_SUBSCRIPTION", period, description: `Mensalidade ${period} · ${supplier?.name ?? ""}`, amountCents: waived ? 0 : contract.monthlyFeeCents, lines, status: waived ? "WAIVED" : "OPEN", dueDate: dueDateFor(period, 0, Math.min(book.billing.dueDay, 28)) });
}

/** Emite as mensalidades antecipadas de todos os fornecedores ativos para a competência. Idempotente. */
export async function issueSubscriptionInvoices(db: Database, period: string, now = new Date()): Promise<{ issued: number }> {
  const book = await getPriceBook(db);
  const list = await db.select().from(suppliers).where(and(ne(suppliers.status, "CLOSED"), eq(suppliers.hidden, false)));
  let issued = 0;
  for (const s of list) {
    const contract = await ensureContract(db, s.id, { now });
    const r = await issueSubscriptionInvoiceFor(db, s.id, contract, period, now, book);
    if (r.created) issued++;
  }
  return { issued };
}

// ---------------------------------------------------------------------------
// Base de cálculo da taxa de volume
// ---------------------------------------------------------------------------
/** Pedidos do fornecedor com pagamento à Central confirmado na competência (não cancelados). */
export async function supplierVolume(db: Database, supplierId: string, period: string): Promise<{ baseCents: number; orders: number }> {
  const { start, end } = periodBounds(period);
  const [r] = await db.select({ base: sum(orders.costTotalCents), n: count() }).from(orders).where(and(eq(orders.supplierId, supplierId), eq(orders.centralPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), gte(orders.centralPaidAt, start.toISOString()), lt(orders.centralPaidAt, end.toISOString())));
  return { baseCents: Number(r?.base ?? 0), orders: r?.n ?? 0 };
}

/** Estimativa do mês corrente (ainda sem fatura): usada nos painéis. */
export async function estimateClosing(db: Database, supplierId: string, period: string, commissionsEligible = true) {
  const row = await ensureContract(db, supplierId);
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  const terms = contractTerms(row, supplier?.businessModel ?? "SUPERDROP");
  const vol = await supplierVolume(db, supplierId, period);
  const { end } = periodBounds(period);
  const pending = commissionsEligible ? await eligibleAcquisitions(db, supplierId, end) : [];
  const closing = closeSupplierMonth({ contract: terms, baseCents: vol.baseCents, orders: vol.orders, commissions: pending.map((a) => ({ label: `Comissão de canal · loja ${a.storeName}`, cents: a.commissionCents })) });
  return { ...vol, closing, terms };
}

async function eligibleAcquisitions(db: Database, supplierId: string, until: Date) {
  return db.select({ id: storeAcquisitions.id, commissionCents: storeAcquisitions.commissionCents, storeName: stores.name }).from(storeAcquisitions).innerJoin(stores, eq(stores.id, storeAcquisitions.storeId)).where(and(eq(storeAcquisitions.supplierId, supplierId), eq(storeAcquisitions.status, "GUARANTEE"), lt(storeAcquisitions.eligibleAt, until.toISOString())));
}

// ---------------------------------------------------------------------------
// Fechamento mensal
// ---------------------------------------------------------------------------
/**
 * Fecha a competência para cada fornecedor: taxa de volume menos comissões de canal elegíveis e saldo.
 * Idempotente por fornecedor e competência. Comissões creditadas mudam para CREDITED.
 */
export async function closeMonth(db: Database, period: string, now = new Date()): Promise<{ closed: number; skipped: number }> {
  const book = await getPriceBook(db);
  const { end } = periodBounds(period);
  const list = await db.select().from(suppliers).where(and(ne(suppliers.status, "CLOSED"), eq(suppliers.hidden, false)));
  let closed = 0, skipped = 0;
  for (const s of list) {
    const key = `CLOSE:${s.id}:${period}`;
    if (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, key) })) { skipped++; continue; }
    await db.transaction(async (tx) => {
      const row = await ensureContract(tx, s.id, { now });
      const terms = contractTerms(row, s.businessModel);
      const vol = await supplierVolume(tx, s.id, period);
      const elig = await eligibleAcquisitions(tx, s.id, end);
      const closing = closeSupplierMonth({ contract: terms, baseCents: vol.baseCents, orders: vol.orders, commissions: elig.map((a) => ({ label: `Comissão de canal · loja ${a.storeName}`, cents: a.commissionCents })) });
      const due = dueDateFor(period, 1, Math.min(book.billing.dueDay, 28));
      const { id } = await insertInvoiceOnce(tx, { dedupeKey: key, payerType: "SUPPLIER", supplierId: s.id, kind: "SUPPLIER_CLOSING", period, description: `Fechamento ${period} · ${s.name}`, amountCents: closing.netCents, lines: closing.lines, status: closing.netCents === 0 ? "WAIVED" : "OPEN", dueDate: due });
      if (elig.length) await tx.update(storeAcquisitions).set({ status: "CREDITED", creditedInvoiceId: id }).where(inArray(storeAcquisitions.id, elig.map((a) => a.id)));
      await tx.update(supplierContracts).set({ creditBalanceCents: closing.carryOutCents, updatedAt: new Date().toISOString() }).where(eq(supplierContracts.supplierId, s.id));
      await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId: s.id, type: "MONTH_CLOSED", message: `Fechamento ${period}: ${fmt(closing.netCents)} a pagar${closing.commissionCreditCents ? `, com ${fmt(closing.commissionCreditCents)} de comissões abatidas` : ""}` });
    });
    closed++;
  }
  return { closed, skipped };
}

// ---------------------------------------------------------------------------
// Aquisição de lojas (setup pago à NextLevel, comissão de canal)
// ---------------------------------------------------------------------------
/** Registra uma loja nova: fatura de setup + primeira mensalidade (pagas antes da liberação) e a comissão do fornecedor. */
export async function registerStoreAcquisition(db: Database, input: { storeId: string; supplierId: string | null; offer: OfferKey; storeName: string; now?: Date }): Promise<{ invoiceId: string | null; setupCents: number; commissionCents: number; requiresPayment: boolean }> {
  const now = input.now ?? new Date();
  const book = await getPriceBook(db);
  // Loja independente da Commerce (D89): paga só à NextLevel; não há fornecedor, contrato nem comissão de canal.
  const contract = input.supplierId ? await ensureContract(db, input.supplierId, { now }) : null;
  const offer = book.offers[input.offer];
  const setupCents = offer.setupCents;
  if (setupCents === 0 && offer.monthlyCents === 0) return { invoiceId: null, setupCents: 0, commissionCents: 0, requiresPayment: false };
  const commissionCents = contract ? storeSetupCommission(setupCents, contract.storeSetupCommissionBps) : 0;
  const due = new Date(now); due.setDate(due.getDate() + 7);
  const lines: InvoiceLine[] = [];
  if (setupCents > 0) lines.push({ kind: "STORE_SETUP", description: `Setup ${offer.name}`, amountCents: setupCents });
  lines.push({ kind: "STORE_FIRST_MONTH", description: `Primeira mensalidade ${offer.name}`, amountCents: offer.monthlyCents });
  const total = lines.reduce((s, l) => s + l.amountCents, 0);
  const inv = await insertInvoiceOnce(db, { dedupeKey: `STORESETUP:${input.storeId}`, payerType: "STORE", supplierId: input.supplierId, storeId: input.storeId, kind: "STORE_SETUP", description: `Ativação da loja ${input.storeName}`, amountCents: total, lines, status: "OPEN", dueDate: due.toISOString() });
  if (input.supplierId && contract) await db.insert(storeAcquisitions).values({ id: newId("acq"), storeId: input.storeId, supplierId: input.supplierId, offer: input.offer, setupCents, commissionBps: contract.storeSetupCommissionBps, commissionCents, status: "PENDING_PAYMENT", invoiceId: inv.id });
  return { invoiceId: inv.id, setupCents, commissionCents, requiresPayment: true };
}

/**
 * Confirma o recebimento de uma fatura. Para setup de loja: libera a loja, inicia a assinatura e abre o
 * prazo de garantia da comissão do fornecedor.
 */
export async function markInvoicePaid(db: Database, invoiceId: string, now = new Date()): Promise<FinanceInvoice> {
  const inv = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) });
  if (!inv) throw new NotFoundError("Fatura não encontrada.");
  if (inv.status === "PAID") return inv;
  if (inv.status === "CANCELED" || inv.status === "WAIVED") throw new DomainError("INVOICE_STATE", "Esta fatura não pode ser paga.");
  const book = await getPriceBook(db);
  // Atualização condicional (D90): duas confirmações simultâneas (webhook + tela) liberam só uma vez.
  let won = false;
  await db.transaction(async (tx) => {
    const moved = await tx.update(financeInvoices).set({ status: "PAID", paidAt: now.toISOString() }).where(and(eq(financeInvoices.id, invoiceId), inArray(financeInvoices.status, ["OPEN", "OVERDUE"]))).returning({ id: financeInvoices.id });
    if (!moved.length) return;
    won = true;
    if (inv.kind === "STORE_SETUP" && inv.storeId) {
      const store = await tx.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
      if (store?.status === "PENDING_PAYMENT") await tx.update(stores).set({ status: "ACTIVE", updatedAt: now.toISOString() }).where(eq(stores.id, store.id));
      const end = new Date(now); end.setDate(end.getDate() + 30);
      await tx.update(subscriptions).set({ status: "ACTIVE", currentPeriodEnd: end.toISOString() }).where(eq(subscriptions.storeId, inv.storeId));
      const eligible = new Date(now); eligible.setDate(eligible.getDate() + book.channel.guaranteeDays);
      await tx.update(storeAcquisitions).set({ status: "GUARANTEE", paidAt: now.toISOString(), eligibleAt: eligible.toISOString() }).where(and(eq(storeAcquisitions.storeId, inv.storeId), eq(storeAcquisitions.status, "PENDING_PAYMENT")));
      await tx.insert(activities).values([
        { id: newId("act"), scope: "PLATFORM", supplierId: inv.supplierId, storeId: inv.storeId, type: "STORE_ACTIVATED", message: `Loja ${store?.name ?? ""} ativada após pagamento do setup` },
        { id: newId("act"), scope: "SUPPLIER", supplierId: inv.supplierId, storeId: inv.storeId, type: "STORE_ACTIVATED", message: `Loja ${store?.name ?? ""} ativada. Sua comissão fica elegível em ${book.channel.guaranteeDays} dias` },
      ]);
    }
    if (inv.payerType === "SUPPLIER" && inv.supplierId) {
      await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId: inv.supplierId, type: "INVOICE_PAID", message: `Pagamento confirmado: ${inv.description}` });
    }
  });
  if (!won) return (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) }))!;
  await fulfillPaidInvoice(db, inv, now);
  const paid = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) });
  if (paid) await (await import("./partners")).onInvoicePaid(db, paid, now);
  if (paid && paid.amountCents > 0) {
    const { notifyTenant, emails } = await import("@/lib/email");
    await notifyTenant(db, { storeId: paid.payerType === "STORE" ? paid.storeId : null, supplierId: paid.payerType === "SUPPLIER" ? paid.supplierId : null, partnerId: paid.payerType === "PARTNER" ? paid.partnerId : null }, { kind: "INVOICE_PAID", dedupeKey: `INVOICE_PAID:${paid.id}`, ...emails.invoicePaid(paid.description, paid.amountCents, paid.payerType === "STORE" ? "/merchant" : paid.payerType === "PARTNER" ? "/partner/finance" : "/supplier/invoices") });
  }
  await emitEvent(db, { type: "INVOICE_PAID", supplierId: inv.supplierId, storeId: inv.storeId, payload: { invoiceId, kind: inv.kind, amountCents: inv.amountCents }, dedupeKey: `INVOICE_PAID:${invoiceId}` });
  await refreshSupplierAccess(db, now);
  return (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) }))!;
}

/** Estorno do setup de uma loja: cancela a fatura e a comissão; se já creditada, gera débito no saldo do fornecedor. */
export async function voidStoreSetup(db: Database, storeId: string): Promise<{ clawbackCents: number }> {
  const acq = await db.query.storeAcquisitions.findFirst({ where: eq(storeAcquisitions.storeId, storeId) });
  if (!acq) throw new NotFoundError("Aquisição não encontrada.");
  if (acq.status === "CANCELED") return { clawbackCents: 0 };
  let clawbackCents = 0;
  await db.transaction(async (tx) => {
    if (acq.status === "CREDITED") {
      clawbackCents = acq.commissionCents;
      await tx.update(supplierContracts).set({ creditBalanceCents: sql`${supplierContracts.creditBalanceCents} - ${acq.commissionCents}` }).where(eq(supplierContracts.supplierId, acq.supplierId));
    }
    await tx.update(storeAcquisitions).set({ status: "CANCELED" }).where(eq(storeAcquisitions.id, acq.id));
    if (acq.invoiceId) await tx.update(financeInvoices).set({ status: "CANCELED" }).where(eq(financeInvoices.id, acq.invoiceId));
    await tx.update(stores).set({ status: "SUSPENDED", updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
  });
  if (acq.invoiceId) await (await import("./partners")).clawback(db, acq.invoiceId);
  return { clawbackCents };
}

// ---------------------------------------------------------------------------
// Cobrança por atraso (dunning) e acesso
// ---------------------------------------------------------------------------
/** Marca faturas vencidas e ajusta o estado de acesso de cada fornecedor conforme o maior atraso. */
export async function refreshSupplierAccess(db: Database, now = new Date()): Promise<{ changed: { supplierId: string; from: string; to: AccessState }[] }> {
  const book = await getPriceBook(db);
  await db.update(financeInvoices).set({ status: "OVERDUE" }).where(and(eq(financeInvoices.status, "OPEN"), lt(financeInvoices.dueDate, now.toISOString())));
  const list = await db.select().from(suppliers).where(eq(suppliers.hidden, false));
  const changed: { supplierId: string; from: string; to: AccessState }[] = [];
  for (const s of list) {
    const overdue = await db.select({ dueDate: financeInvoices.dueDate }).from(financeInvoices).where(and(eq(financeInvoices.supplierId, s.id), eq(financeInvoices.payerType, "SUPPLIER"), eq(financeInvoices.status, "OVERDUE")));
    const worst = overdue.reduce((m, i) => Math.max(m, daysBetween(new Date(i.dueDate), now)), 0);
    const next = overdue.length ? accessStateForOverdue(worst, book.dunning) : "ACTIVE";
    if (next !== s.status) {
      await db.update(suppliers).set({ status: next }).where(eq(suppliers.id, s.id));
      await db.insert(activities).values({ id: newId("act"), scope: "PLATFORM", supplierId: s.id, type: "ACCESS_CHANGED", message: `Acesso de ${s.name} alterado para ${next}` });
      changed.push({ supplierId: s.id, from: s.status, to: next });
    }
  }
  return { changed };
}

export async function capabilitiesForSupplier(db: Database, supplierId: string): Promise<{ state: AccessState; caps: Capabilities }> {
  const s = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  const state = (s?.status ?? "ACTIVE") as AccessState;
  return { state, caps: ACCESS_CAPABILITIES[state] };
}

export async function supplierIdOfStore(db: Database, storeId: string): Promise<string | null> {
  const r = await db.select({ supplierId: networks.supplierId }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(stores.id, storeId)).limit(1);
  return r[0]?.supplierId ?? null;
}

// ---------------------------------------------------------------------------
// Visão geral (Master)
// ---------------------------------------------------------------------------
export async function financeOverview(db: Database, period: string, now = new Date()) {
  const book = await getPriceBook(db);
  const { start, end } = periodBounds(period);
  const supplierRows = await db.select().from(suppliers).where(eq(suppliers.hidden, false));
  const perSupplier = [];
  let supplierMrr = 0, volumeFees = 0;
  for (const s of supplierRows) {
    const est = await estimateClosing(db, s.id, period, false);
    const waived = isWaived(est.terms.monthlyWaivedUntil, now);
    const monthly = waived ? 0 : est.terms.monthlyFeeCents;
    supplierMrr += monthly; volumeFees += est.closing.fee.totalCents;
    perSupplier.push({ supplier: s, terms: est.terms, waived, monthlyCents: monthly, baseCents: est.baseCents, orders: est.orders, feeCents: est.closing.fee.totalCents, minAdjustmentCents: est.closing.fee.minAdjustmentCents, accessState: s.status as AccessState });
  }
  const subs = await db.select({ price: plans.priceCents }).from(subscriptions).innerJoin(plans, eq(plans.id, subscriptions.planId)).where(eq(subscriptions.status, "ACTIVE"));
  const storeMrr = subs.reduce((a, r) => a + r.price, 0);
  const invoices = await db.select().from(financeInvoices).orderBy(desc(financeInvoices.createdAt));
  const paidInPeriod = invoices.filter((i) => i.status === "PAID" && i.paidAt && new Date(i.paidAt) >= start && new Date(i.paidAt) < end);
  const sumLines = (list: FinanceInvoice[], kind: string) => list.reduce((a, i) => a + i.lines.filter((l) => l.kind === kind).reduce((x, l) => x + l.amountCents, 0), 0);
  const acquisitions = await db.select({ acq: storeAcquisitions, storeName: stores.name, supplierName: suppliers.name }).from(storeAcquisitions).innerJoin(stores, eq(stores.id, storeAcquisitions.storeId)).innerJoin(suppliers, eq(suppliers.id, storeAcquisitions.supplierId)).orderBy(desc(storeAcquisitions.createdAt));
  const receivable = invoices.filter((i) => i.status === "OPEN" || i.status === "OVERDUE");
  return {
    book, period, perSupplier, invoices, acquisitions,
    mrr: { suppliers: supplierMrr, stores: storeMrr, total: supplierMrr + storeMrr },
    estimatedVolumeFees: volumeFees,
    receivedInPeriod: paidInPeriod.reduce((a, i) => a + i.amountCents, 0),
    setupsPaidInPeriod: sumLines(paidInPeriod, "STORE_SETUP") + sumLines(paidInPeriod, "SUPPLIER_SETUP"),
    receivable: receivable.reduce((a, i) => a + i.amountCents, 0),
    overdue: invoices.filter((i) => i.status === "OVERDUE").reduce((a, i) => a + i.amountCents, 0),
    commissions: {
      guarantee: acquisitions.filter((a) => a.acq.status === "GUARANTEE").reduce((s, a) => s + a.acq.commissionCents, 0),
      credited: acquisitions.filter((a) => a.acq.status === "CREDITED").reduce((s, a) => s + a.acq.commissionCents, 0),
      pending: acquisitions.filter((a) => a.acq.status === "PENDING_PAYMENT").reduce((s, a) => s + a.acq.commissionCents, 0),
    },
  };
}

export const requireOfferKey = (v: string): OfferKey => { if (!(OFFER_KEYS as readonly string[]).includes(v)) throw new DomainError("OFFER", "Oferta inválida."); return v as OfferKey; };

// ---------------------------------------------------------------------------
// Rotina diária (cron)
// ---------------------------------------------------------------------------
const previousPeriod = (d: Date) => periodOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));

/**
 * Rotina diária idempotente: atualiza atrasos e acessos todo dia; no dia 1 (UTC) emite as mensalidades
 * antecipadas do mês e fecha o mês anterior. Pode ser executada várias vezes sem duplicar cobranças.
 */
/** Régua de cobrança: aviso in-app em D-3, D0, D+3 e D+7 do vencimento, uma vez por fatura e marco. */
export async function runDunningNotices(db: Database, now = new Date()): Promise<{ notices: number }> {
  const open = await db.select().from(financeInvoices).where(inArray(financeInvoices.status, ["OPEN", "OVERDUE"]));
  let notices = 0;
  for (const inv of open) {
    if (inv.amountCents <= 0) continue;
    const offset = daysBetween(new Date(inv.dueDate), now);
    if (![-3, 0, 3, 7].includes(offset)) continue;
    if (!(await emitEvent(db, { type: "DUNNING_NOTICE", supplierId: inv.supplierId, storeId: inv.storeId, payload: { invoiceId: inv.id, offset }, dedupeKey: `DUNNING:${inv.id}:${offset}` }))) continue;
    const msg = offset < 0 ? `A fatura "${inv.description}" vence em ${-offset} dias.` : offset === 0 ? `A fatura "${inv.description}" vence hoje.` : `A fatura "${inv.description}" está ${offset} dias em atraso. Pague por Pix para evitar bloqueios.`;
    await db.insert(activities).values({ id: newId("act"), scope: inv.payerType === "STORE" ? "STORE" : "SUPPLIER", supplierId: inv.supplierId, storeId: inv.storeId, type: "DUNNING", message: msg });
    const { notifyTenant, emails } = await import("@/lib/email");
    await notifyTenant(db, { storeId: inv.payerType === "STORE" ? inv.storeId : null, supplierId: inv.payerType === "SUPPLIER" ? inv.supplierId : null, partnerId: inv.payerType === "PARTNER" ? inv.partnerId : null }, { kind: "DUNNING", dedupeKey: `DUNNING:${inv.id}:${offset}`, ...emails.dunning(msg, inv.payerType === "STORE" ? "/merchant" : inv.payerType === "PARTNER" ? "/partner/finance" : "/supplier/invoices") });
    notices++;
  }
  return { notices };
}

// ---------------------------------------------------------------------------
// Taxa por pedido do membro (fechamento mensal)
// ---------------------------------------------------------------------------
/**
 * Taxa do mês de uma loja: percentual da oferta sobre o valor dos produtos (sem frete) dos pedidos pagos pelo cliente.
 * Estornos saem sozinhos (só conta pago e não estornado) e pedidos de teste (provedor DEMO) não pagam.
 */
export async function storeOrderFeeFor(db: Database, storeId: string, period: string, book?: PriceBook) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) return { feeCents: 0, baseCents: 0, orders: 0, bps: 0 };
  // Loja Commerce com assinatura (D90): taxa do plano congelada na assinatura, zero na carência da oferta de entrada.
  const { start: pStart, end: pEnd } = periodBounds(period);
  const commerceFee = await (await import("./commerce-plans")).platformFeeFor(db, storeId, pStart, pEnd);
  if (commerceFee) return { feeCents: commerceFee.feeCents, baseCents: commerceFee.baseCents, orders: commerceFee.orders, bps: commerceFee.bps };
  if (store.kind === "SUPPLIER_OWN") return { feeCents: 0, baseCents: 0, orders: 0, bps: 0 };
  const b = book ?? (await getPriceBook(db));
  const bps = b.orderFees[store.offer] ?? 0;
  const { start, end } = periodBounds(period);
  const [r] = await db.select({ base: sum(orders.subtotalCents), n: count() }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), ne(orders.paymentProvider, "DEMO"), gte(orders.createdAt, start.toISOString()), lt(orders.createdAt, end.toISOString())));
  const baseCents = Number(r?.base ?? 0);
  return { feeCents: Math.round((baseCents * bps) / 10_000), baseCents, orders: r?.n ?? 0, bps };
}

/** Emite a fatura de taxas do mês para cada loja com valor a cobrar. Idempotente por loja e competência. */
export async function closeStoreFees(db: Database, period: string): Promise<{ issued: number }> {
  const book = await getPriceBook(db);
  const list = await db.select().from(stores).where(ne(stores.status, "CLOSED"));
  let issued = 0;
  for (const st of list) {
    const f = await storeOrderFeeFor(db, st.id, period, book);
    if (f.feeCents <= 0) continue;
    const supplierId = await supplierIdOfStore(db, st.id);
    const lines: InvoiceLine[] = [{ kind: "ORDER_FEE", description: `Taxa de ${f.bps / 100}% sobre ${fmt(f.baseCents)} em ${f.orders} pedido(s)`, amountCents: f.feeCents }];
    const r = await insertInvoiceOnce(db, { dedupeKey: `STOREFEE:${st.id}:${period}`, payerType: "STORE", supplierId, storeId: st.id, kind: "STORE_ORDER_FEES", period, description: `Taxa por pedido ${period} · ${st.name}`, amountCents: f.feeCents, lines, status: "OPEN", dueDate: dueDateFor(period, 1, Math.min(book.billing.dueDay, 28)) });
    if (r.created) { issued++; await db.insert(activities).values({ id: newId("act"), scope: "PLATFORM", storeId: st.id, supplierId, type: "STORE_FEES_ISSUED", message: `Taxa por pedido ${period}: ${fmt(f.feeCents)}` }); }
  }
  return { issued };
}

export async function runDailyFinanceJobs(db: Database, now = new Date()) {
  const result: { accessChanged: number; subscriptionsIssued: number; closed: number; period: string; closedPeriod: string | null } = { accessChanged: 0, subscriptionsIssued: 0, closed: 0, period: periodOf(now), closedPeriod: null };
  if (now.getUTCDate() === 1) {
    result.closedPeriod = previousPeriod(now);
    result.closed = (await closeMonth(db, result.closedPeriod, now)).closed;
    result.subscriptionsIssued = (await issueSubscriptionInvoices(db, result.period, now)).issued;
    await closeStoreFees(db, result.closedPeriod);
  }
  result.accessChanged = (await refreshSupplierAccess(db, now)).changed.length;
  await runDunningNotices(db, now);
  await (await import("./store-access")).runTrialReminders(db, now);
  await (await import("./partners")).runDailyPartnerJobs(db, now);
  await (await import("./commerce-plans")).runSubscriptionJobs(db, now, { suspendAfterDays: (await getPriceBook(db)).dunning.suspendedDays });
  return result;
}

// ---------------------------------------------------------------------------
// Situação de cobrança do fornecedor (faturas, avisos e bloqueio)
// ---------------------------------------------------------------------------
export type SupplierBilling = {
  state: AccessState;
  open: { id: string; description: string; amountCents: number; dueDate: string; overdueDays: number; daysToDue: number; status: string; kind: string }[];
  overdueCount: number; openCents: number; overdueCents: number;
  worstOverdueDays: number;
  /** Próximo estágio de restrição e em quantos dias chega se nada for pago. */
  next: { state: AccessState; inDays: number } | null;
};

export async function supplierBilling(db: Database, supplierId: string, now = new Date()): Promise<SupplierBilling> {
  const book = await getPriceBook(db);
  const s = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  const rows = await db.select().from(financeInvoices).where(and(eq(financeInvoices.supplierId, supplierId), eq(financeInvoices.payerType, "SUPPLIER"), inArray(financeInvoices.status, ["OPEN", "OVERDUE"])));
  const open = rows.filter((i) => i.amountCents > 0).map((i) => ({ id: i.id, description: i.description, amountCents: i.amountCents, dueDate: i.dueDate, overdueDays: Math.max(0, daysBetween(new Date(i.dueDate), now)), daysToDue: Math.ceil((new Date(i.dueDate).getTime() - now.getTime()) / 86_400_000), status: i.status, kind: i.kind })).sort((a, b) => b.overdueDays - a.overdueDays || a.dueDate.localeCompare(b.dueDate));
  const overdue = open.filter((i) => i.overdueDays > 0 || i.status === "OVERDUE");
  const worst = overdue.reduce((m, i) => Math.max(m, i.overdueDays), 0);
  const d = book.dunning;
  const steps: [AccessState, number][] = [["WARNING", d.warningDays], ["PARTIAL_BLOCK", d.partialBlockDays], ["SUSPENDED", d.suspendedDays], ["CLOSED", d.closedDays]];
  const nextStep = overdue.length ? steps.find(([, days]) => worst < days) : undefined;
  return { state: (s?.status ?? "ACTIVE") as AccessState, open, overdueCount: overdue.length, openCents: open.reduce((t, i) => t + i.amountCents, 0), overdueCents: overdue.reduce((t, i) => t + i.amountCents, 0), worstOverdueDays: worst, next: nextStep ? { state: nextStep[0], inDays: nextStep[1] - worst } : null };
}
