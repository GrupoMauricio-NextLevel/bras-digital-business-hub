import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { financeInvoices, nextlevelPayments, platformSettings, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { createPixPayment, getPayment, MercadoPagoError, verifyAccessToken, type FetchLike } from "@/lib/payments/mercadopago";
import { ADDON_KEYS, type AddonKey } from "@/lib/finance/price-book";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { getPriceBook, markInvoicePaid } from "./finance";
import { grantEntitlement, tenantOf } from "./entitlements";

const MP_KEY = "nextlevel_mp";
type MpSetting = { tokenEnc: string; accountId: string; nickname: string; isTest: boolean };

// ---------------------------------------------------------------------------
// Conta Mercado Pago da NextLevel
// ---------------------------------------------------------------------------
export async function getNextLevelMp(db: Database): Promise<{ connected: boolean; nickname?: string; isTest?: boolean }> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, MP_KEY) });
  const v = row?.value as MpSetting | undefined;
  return v?.tokenEnc ? { connected: true, nickname: v.nickname, isTest: v.isTest } : { connected: false };
}

export async function connectNextLevelMp(db: Database, actor: Actor, rawToken: string, fetchImpl?: FetchLike) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel conecta a conta de recebimento.");
  const token = z.string().trim().min(20, "Cole o Access Token completo").parse(rawToken);
  if (!/^(TEST|APP_USR)-/.test(token)) throw new DomainError("MP_TOKEN", "O Access Token deve começar com APP_USR- (produção) ou TEST- (teste).");
  let acc;
  try { acc = await verifyAccessToken(token, fetchImpl); } catch (e) { throw new DomainError("MP_TOKEN", e instanceof MercadoPagoError ? e.message : "Não foi possível validar o token."); }
  const value: MpSetting = { tokenEnc: encryptSecret(token), accountId: String(acc.id), nickname: acc.nickname, isTest: acc.isTest };
  await db.insert(platformSettings).values({ key: MP_KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  return { nickname: acc.nickname, isTest: acc.isTest };
}

async function nlToken(db: Database): Promise<string> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, MP_KEY) });
  const token = decryptSecret((row?.value as MpSetting | undefined)?.tokenEnc);
  if (!token) throw new DomainError("NL_MP_NOT_CONFIGURED", "A NextLevel ainda não conectou a conta de recebimento. Fale com o suporte.");
  return token;
}

// ---------------------------------------------------------------------------
// Cobrança de faturas
// ---------------------------------------------------------------------------
async function loadOwnInvoice(db: Database, actor: Actor, invoiceId: string) {
  const inv = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) });
  if (!inv) throw new NotFoundError("Fatura não encontrada.");
  if (!isMaster(actor)) {
    const t = tenantOf(actor);
    const own = t && ((t.type === "STORE" && inv.storeId === t.storeId && inv.payerType === "STORE") || (t.type === "SUPPLIER" && inv.supplierId === t.supplierId && inv.payerType === "SUPPLIER"));
    if (!own) throw new ForbiddenError();
  }
  return inv;
}

/** Gera (ou reaproveita, se ainda válido) o Pix de uma fatura na conta da NextLevel. */
export async function chargeInvoice(db: Database, actor: Actor, invoiceId: string, opts: { fetchImpl?: FetchLike; notificationBaseUrl?: string; payerEmail?: string } = {}) {
  const inv = await loadOwnInvoice(db, actor, invoiceId);
  if (inv.status === "PAID" || inv.status === "WAIVED" || inv.status === "CANCELED") throw new DomainError("INVOICE_STATE", "Esta fatura não está em aberto.");
  if (inv.amountCents <= 0) throw new DomainError("INVOICE_ZERO", "Fatura sem valor a pagar.");
  const open = await db.select().from(nextlevelPayments).where(and(eq(nextlevelPayments.invoiceId, invoiceId), eq(nextlevelPayments.status, "PENDING"))).orderBy(desc(nextlevelPayments.createdAt)).limit(1);
  if (open[0]?.expiresAt && new Date(open[0].expiresAt) > new Date() && open[0].pixCode) return { id: open[0].id, pixCode: open[0].pixCode, pixQrBase64: open[0].pixQrBase64 ?? "", expiresAt: open[0].expiresAt, amountCents: inv.amountCents };
  const token = await nlToken(db);
  const id = newId("nlp");
  const expiresAt = new Date(Date.now() + 60 * 60_000);
  try {
    const pix = await createPixPayment(token, { amountCents: inv.amountCents, description: inv.description, payerEmail: opts.payerEmail ?? "cobranca@nextlevel.app", externalReference: id, notificationUrl: opts.notificationBaseUrl ? `${opts.notificationBaseUrl}/api/webhooks/mercadopago-nextlevel?payment=${id}` : undefined, expiresAt }, opts.fetchImpl);
    await db.insert(nextlevelPayments).values({ id, invoiceId, mpPaymentId: pix.paymentId, amountCents: inv.amountCents, pixCode: pix.qrCode, pixQrBase64: pix.qrCodeBase64, expiresAt: expiresAt.toISOString() });
    return { id, pixCode: pix.qrCode, pixQrBase64: pix.qrCodeBase64, expiresAt: expiresAt.toISOString(), amountCents: inv.amountCents };
  } catch (e) {
    if (e instanceof MercadoPagoError) throw new DomainError("PIX_FAILED", e.message);
    throw e;
  }
}

/** Confere o pagamento na API do Mercado Pago e quita a fatura. Idempotente; o corpo do webhook nunca é confiável. */
export async function syncNextLevelPayment(db: Database, paymentRowId: string, fetchImpl: FetchLike = fetch): Promise<{ paid: boolean }> {
  const row = await db.query.nextlevelPayments.findFirst({ where: eq(nextlevelPayments.id, paymentRowId) });
  if (!row) return { paid: false };
  if (row.status === "PAID") return { paid: true };
  if (!row.mpPaymentId) return { paid: false };
  const p = await getPayment(await nlToken(db), row.mpPaymentId, fetchImpl);
  if (p.externalReference !== row.id || p.status !== "approved") return { paid: false };
  if (p.amountCents < row.amountCents) throw new DomainError("AMOUNT_MISMATCH", "Valor pago menor que o da fatura.");
  await db.update(nextlevelPayments).set({ status: "PAID", paidAt: new Date().toISOString() }).where(eq(nextlevelPayments.id, row.id));
  await markInvoicePaid(db, row.invoiceId);
  return { paid: true };
}

export async function listInvoicesFor(db: Database, actor: Actor) {
  const t = tenantOf(actor);
  if (!t && !isMaster(actor)) return [];
  const rows = await db.select().from(financeInvoices).orderBy(desc(financeInvoices.dueDate));
  if (isMaster(actor)) return rows;
  return rows.filter((i) => (t!.type === "STORE" ? i.storeId === t!.storeId && i.payerType === "STORE" : i.supplierId === t!.supplierId && i.payerType === "SUPPLIER"));
}

// ---------------------------------------------------------------------------
// Venda de add-ons (gera fatura; ao pagar, concede o direito)
// ---------------------------------------------------------------------------
export async function buyAddon(db: Database, actor: Actor, key: string, cycle: "MONTHLY" | "ANNUAL", now = new Date()) {
  const t = tenantOf(actor);
  if (!t) throw new ForbiddenError("Apenas lojistas e fornecedores compram add-ons.");
  if (!(ADDON_KEYS as readonly string[]).includes(key)) throw new NotFoundError("Add-on não encontrado.");
  const book = await getPriceBook(db);
  const addon = book.addons[key as AddonKey];
  const isStore = t.type === "STORE";
  if (addon.audience === (isStore ? "SUPPLIER" : "STORE")) throw new DomainError("NOT_FOR_YOU", "Este add-on não está disponível para o seu perfil.");
  const amount = cycle === "ANNUAL" ? addon.annualCents : addon.monthlyCents;
  const months = cycle === "ANNUAL" ? 12 : 1;
  const dedupeKey = `ADDON:${isStore ? t.storeId : t.supplierId}:${key}:${cycle}:${now.toISOString().slice(0, 7)}`;
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, dedupeKey) });
  if (existing && existing.status === "OPEN") return { invoiceId: existing.id, amountCents: existing.amountCents };
  if (existing && existing.status === "PAID") throw new DomainError("ALREADY_ACTIVE", "Você já contratou este add-on neste mês.");
  const supplierId = isStore ? (await supplierOfStore(db, t.storeId)) : t.supplierId;
  const id = newId("fin");
  const due = new Date(now); due.setUTCDate(due.getUTCDate() + 3);
  await db.insert(financeInvoices).values({ id, dedupeKey, payerType: isStore ? "STORE" : "SUPPLIER", supplierId, storeId: isStore ? t.storeId : null, kind: "ADDON", description: `${addon.name} (${cycle === "ANNUAL" ? "anual" : "mensal"})`, amountCents: amount, lines: [{ kind: "ADDON", description: `${addon.name} · ${months} mês(es)`, amountCents: amount }], status: "OPEN", dueDate: due.toISOString() });
  await emitEvent(db, { type: "ADDON_ORDERED", supplierId, storeId: isStore ? t.storeId : null, actorRole: actor.role, payload: { key, cycle, invoiceId: id } });
  return { invoiceId: id, amountCents: amount };
}

export async function supplierOfStore(db: Database, storeId: string): Promise<string | null> {
  const { networks } = await import("@/db/schema");
  const r = await db.select({ supplierId: networks.supplierId }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(stores.id, storeId)).limit(1);
  return r[0]?.supplierId ?? null;
}

/** Chamado por `markInvoicePaid`: fatura de add-on paga concede o direito pelo período contratado. */
export async function fulfillPaidInvoice(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (inv.kind !== "ADDON") return;
  const key = inv.dedupeKey.split(":")[2];
  const cycle = inv.dedupeKey.split(":")[3];
  if (!key) return;
  const tenant = inv.payerType === "STORE" && inv.storeId ? ({ type: "STORE", storeId: inv.storeId } as const) : inv.supplierId ? ({ type: "SUPPLIER", supplierId: inv.supplierId } as const) : null;
  if (!tenant) return;
  await grantEntitlement(db, tenant, { key, source: "ADD_ON", months: cycle === "LIFETIME" ? undefined : cycle === "ANNUAL" ? 12 : 1, invoiceId: inv.id, now });
  await emitEvent(db, { type: key.startsWith("THEME_") ? "THEME_PURCHASED" : "ADDON_ACTIVATED", supplierId: inv.supplierId, storeId: inv.storeId, payload: { key, invoiceId: inv.id }, dedupeKey: `${key.startsWith("THEME_") ? "THEME_PURCHASED" : "ADDON_ACTIVATED"}:${inv.id}` });
}



/** Demonstração (sem conta da NextLevel conectada): Pix fictício quitado só pelo botão de simulação. */
export async function chargeInvoiceDemo(db: Database, actor: Actor, invoiceId: string) {
  const inv = await loadOwnInvoice(db, actor, invoiceId);
  if (inv.status === "PAID" || inv.status === "WAIVED" || inv.status === "CANCELED") throw new DomainError("INVOICE_STATE", "Esta fatura não está em aberto.");
  const id = newId("nlp");
  const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString();
  const code = `00020126DEMO${id}5204000053039865802BR`;
  await db.insert(nextlevelPayments).values({ id, invoiceId, mpPaymentId: `demo_${id}`, amountCents: inv.amountCents, pixCode: code, pixQrBase64: "", expiresAt });
  return { id, pixCode: code, pixQrBase64: "", expiresAt, amountCents: inv.amountCents };
}

export async function simulateNextLevelPayment(db: Database, actor: Actor, paymentRowId: string) {
  const row = await db.query.nextlevelPayments.findFirst({ where: eq(nextlevelPayments.id, paymentRowId) });
  if (!row || !row.mpPaymentId?.startsWith("demo_")) throw new NotFoundError("Cobrança não encontrada.");
  await loadOwnInvoice(db, actor, row.invoiceId);
  await db.update(nextlevelPayments).set({ status: "PAID", paidAt: new Date().toISOString() }).where(eq(nextlevelPayments.id, row.id));
  await markInvoicePaid(db, row.invoiceId);
}

/** Estado de uma cobrança para o polling da tela (do próprio tenant). */
export async function checkPayment(db: Database, actor: Actor, paymentRowId: string, fetchImpl?: FetchLike): Promise<{ paid: boolean }> {
  const row = await db.query.nextlevelPayments.findFirst({ where: eq(nextlevelPayments.id, paymentRowId) });
  if (!row) throw new NotFoundError("Cobrança não encontrada.");
  await loadOwnInvoice(db, actor, row.invoiceId);
  if (row.mpPaymentId?.startsWith("demo_")) return { paid: row.status === "PAID" };
  return syncNextLevelPayment(db, paymentRowId, fetchImpl);
}

/** Add-ons oferecidos ao ator, com estado (ativo até quando, fatura em aberto). */
export async function addonViewsFor(db: Database, actor: Actor) {
  const t = tenantOf(actor);
  if (!t) return [];
  const book = await getPriceBook(db);
  const { entitlements } = await import("@/db/schema");
  const ents = await db.select().from(entitlements).where(t.type === "STORE" ? eq(entitlements.storeId, t.storeId) : eq(entitlements.supplierId, t.supplierId));
  const now = new Date();
  const invoices = await listInvoicesFor(db, actor);
  return (Object.keys(book.addons) as AddonKey[]).filter((k) => { const a = book.addons[k].audience; return a === "BOTH" || a === t.type; }).map((k) => {
    const a = book.addons[k];
    const active = ents.filter((e) => e.key === k && (e.endsAt === null || new Date(e.endsAt) > now)).sort((x, y) => (x.endsAt ?? "9").localeCompare(y.endsAt ?? "9")).pop();
    const open = invoices.find((i) => i.kind === "ADDON" && i.status === "OPEN" && i.dedupeKey.split(":")[2] === k);
    return { key: k, name: a.name, description: a.description, monthlyCents: a.monthlyCents, annualCents: a.annualCents, active: Boolean(active), endsAt: active?.endsAt ?? null, openInvoiceId: open?.id ?? null };
  });
}
