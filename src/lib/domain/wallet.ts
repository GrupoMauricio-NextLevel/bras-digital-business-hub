import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, orderEvents, orders, stores, suppliers, walletAccounts, walletEntries, walletRecharges, networks, type WalletEntryType } from "@/db/schema";
import { newId } from "@/lib/ids";
import { decryptSecret } from "@/lib/security/crypto";
import { createPixPayment, getPayment, MercadoPagoError, type FetchLike } from "@/lib/payments/mercadopago";
import { assertCanAccess, isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { cancelOrderBySystem } from "./orders";
import { resolveFulfillmentStatus } from "./order-status";
import { emitEvent } from "./events";

/** Prazo para o lojista recarregar antes de o pedido pago pelo cliente ser cancelado. */
export const AWAITING_FUNDS_HOURS = 72;
export const MIN_RECHARGE_CENTS = 1000;
export const MAX_RECHARGE_CENTS = 5_000_000;

type Tx = Database;

async function lockAccount(tx: Tx, storeId: string) {
  await tx.insert(walletAccounts).values({ id: newId("wal"), storeId }).onConflictDoNothing({ target: walletAccounts.storeId });
  const rows = await tx.execute(sql`select id, balance_cents from wallet_accounts where store_id = ${storeId} for update`);
  const r = (rows as unknown as { rows?: { id: string; balance_cents: number }[] }).rows ?? (rows as unknown as { id: string; balance_cents: number }[]);
  return { id: r[0]!.id, balance: Number(r[0]!.balance_cents) };
}

/** Lança no extrato e atualiza o saldo. Precisa rodar dentro de transação (conta travada com FOR UPDATE). */
async function post(tx: Tx, storeId: string, e: { type: WalletEntryType; amountCents: number; orderId?: string; rechargeId?: string; note?: string; actorUserId?: string }) {
  const acc = await lockAccount(tx, storeId);
  const next = acc.balance + e.amountCents;
  if (next < 0) throw new DomainError("INSUFFICIENT_FUNDS", "Saldo insuficiente.");
  await tx.update(walletAccounts).set({ balanceCents: next }).where(eq(walletAccounts.id, acc.id));
  await tx.insert(walletEntries).values({ id: newId("wen"), storeId, type: e.type, amountCents: e.amountCents, balanceAfterCents: next, orderId: e.orderId, rechargeId: e.rechargeId, note: e.note, actorUserId: e.actorUserId });
  return next;
}

export async function getBalanceCents(db: Database, storeId: string): Promise<number> {
  const a = await db.query.walletAccounts.findFirst({ where: eq(walletAccounts.storeId, storeId) });
  return a?.balanceCents ?? 0;
}

export async function listWalletEntries(db: Database, actor: Actor, storeId: string, limit = 50) {
  const store = await loadStore(db, storeId);
  assertCanAccess(actor, { storeId, supplierId: store.supplierId });
  return db.select().from(walletEntries).where(eq(walletEntries.storeId, storeId)).orderBy(desc(walletEntries.createdAt)).limit(limit);
}

async function loadStore(db: Database, storeId: string) {
  const row = await db.select({ store: stores, supplierId: networks.supplierId }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(stores.id, storeId)).limit(1);
  if (!row[0]) throw new NotFoundError("Loja não encontrada.");
  return { ...row[0].store, supplierId: row[0].supplierId };
}

// ---------------------------------------------------------------------------
// Débito do pedido (regra D2)
// ---------------------------------------------------------------------------
/**
 * Debita o custo do pedido do saldo se o cliente já pagou e há saldo. Sem saldo, o pedido fica em
 * AWAITING_CENTRAL_PAYMENT ("Aguardando recarga"). Idempotente. Roda dentro de transação.
 */
export async function tryDebitOrder(tx: Tx, orderId: string): Promise<"DEBITED" | "AWAITING_FUNDS" | "SKIPPED"> {
  const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.status === "CANCELED" || order.customerPaymentStatus !== "PAID" || order.centralPaymentStatus === "PAID") return "SKIPPED";
  const acc = await lockAccount(tx, order.storeId);
  const now = new Date().toISOString();
  if (acc.balance < order.costTotalCents) {
    if (!order.awaitingFundsSince || order.status !== "AWAITING_CENTRAL_PAYMENT") {
      const next = resolveFulfillmentStatus({ ...order, centralPaymentStatus: "PENDING" });
      await tx.update(orders).set({ awaitingFundsSince: order.awaitingFundsSince ?? now, status: next, updatedAt: now }).where(eq(orders.id, orderId));
      if (next !== order.status) await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "AWAITING_FUNDS", message: "Aguardando recarga: saldo insuficiente para o custo do pedido.", actorRole: "SYSTEM" });
      await tx.insert(activities).values({ id: newId("act"), scope: "STORE", supplierId: order.supplierId, storeId: order.storeId, type: "AWAITING_FUNDS", message: `Pedido #${order.number} aguarda recarga de saldo` });
      await emitEvent(tx, { type: "ORDER_AWAITING_FUNDS", supplierId: order.supplierId, storeId: order.storeId, payload: { orderId }, dedupeKey: `ORDER_AWAITING_FUNDS:${orderId}` });
    }
    return "AWAITING_FUNDS";
  }
  await post(tx, order.storeId, { type: "ORDER_DEBIT", amountCents: -order.costTotalCents, orderId, note: `Custo do pedido #${order.number}` });
  const next = resolveFulfillmentStatus({ ...order, centralPaymentStatus: "PAID" });
  await tx.update(orders).set({ centralPaymentStatus: "PAID", centralPaidAt: now, awaitingFundsSince: null, status: next, updatedAt: now }).where(eq(orders.id, orderId));
  await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CENTRAL_PAID", message: "Custo debitado do saldo.", actorRole: "SYSTEM" });
  if (next !== order.status) await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: `STATUS_${next}`, message: "Fila de expedição atualizada.", actorRole: "SYSTEM" });
  await emitEvent(tx, { type: "ORDER_DEBITED", supplierId: order.supplierId, storeId: order.storeId, payload: { orderId, costCents: order.costTotalCents }, dedupeKey: `ORDER_DEBITED:${orderId}` });
  return "DEBITED";
}

/** Depois de um crédito: debita os pedidos que esperam saldo, do mais antigo para o mais novo (FIFO estrito). */
export async function settleAwaitingOrders(tx: Tx, storeId: string): Promise<number> {
  const waiting = await tx.select({ id: orders.id }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.status, "AWAITING_CENTRAL_PAYMENT"), eq(orders.centralPaymentStatus, "PENDING"))).orderBy(asc(orders.awaitingFundsSince), asc(orders.createdAt));
  let n = 0;
  for (const w of waiting) {
    if ((await tryDebitOrder(tx, w.id)) !== "DEBITED") break;
    n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Créditos
// ---------------------------------------------------------------------------
/** Credita uma recarga paga. Idempotente por recarga (índice único + status). */
export async function creditRecharge(db: Database, rechargeId: string, info: { mpPaymentId: string; amountCents: number }) {
  return db.transaction(async (tx) => {
    const r = await tx.query.walletRecharges.findFirst({ where: eq(walletRecharges.id, rechargeId) });
    if (!r) throw new NotFoundError("Recarga não encontrada.");
    if (info.amountCents < r.amountCents) throw new DomainError("AMOUNT_MISMATCH", "Valor pago menor que o da recarga.");
    await lockAccount(tx, r.storeId);
    const fresh = await tx.query.walletRecharges.findFirst({ where: eq(walletRecharges.id, rechargeId) });
    if (fresh!.status === "PAID") return { changed: false as const, released: 0 };
    await tx.update(walletRecharges).set({ status: "PAID", mpPaymentId: info.mpPaymentId, paidAt: new Date().toISOString() }).where(eq(walletRecharges.id, rechargeId));
    await post(tx, r.storeId, { type: "RECHARGE", amountCents: r.amountCents, rechargeId, note: "Recarga Pix" });
    const released = await settleAwaitingOrders(tx, r.storeId);
    await emitEvent(tx, { type: "WALLET_RECHARGED", supplierId: r.supplierId, storeId: r.storeId, payload: { rechargeId, amountCents: r.amountCents, released }, dedupeKey: `WALLET_RECHARGED:${rechargeId}` });
    return { changed: true as const, released };
  });
}

const manualSchema = z.object({ amountCents: z.number().int().positive().max(MAX_RECHARGE_CENTS), note: z.string().trim().min(5, "Explique o motivo (mín. 5 caracteres)") });

/** Crédito manual auditado (ADM do fornecedor da loja ou master). Substitui o antigo "confirmar pagamento". */
export async function manualCredit(db: Database, actor: Actor, storeId: string, raw: z.input<typeof manualSchema>) {
  if (actor.role !== "SUPPLIER_ADMIN" && !isMaster(actor)) throw new ForbiddenError();
  const input = manualSchema.parse(raw);
  const store = await loadStore(db, storeId);
  assertCanAccess(actor, { storeId, supplierId: store.supplierId });
  return db.transaction(async (tx) => {
    const balance = await post(tx, storeId, { type: "MANUAL_CREDIT", amountCents: input.amountCents, note: input.note, actorUserId: actor.userId });
    const released = await settleAwaitingOrders(tx, storeId);
    return { balance, released };
  });
}

/** Débito manual auditado (correções). Nunca deixa o saldo negativo. */
export async function manualDebit(db: Database, actor: Actor, storeId: string, raw: z.input<typeof manualSchema>) {
  if (actor.role !== "SUPPLIER_ADMIN" && !isMaster(actor)) throw new ForbiddenError();
  const input = manualSchema.parse(raw);
  const store = await loadStore(db, storeId);
  assertCanAccess(actor, { storeId, supplierId: store.supplierId });
  return db.transaction((tx) => post(tx, storeId, { type: "MANUAL_DEBIT", amountCents: -input.amountCents, note: input.note, actorUserId: actor.userId }));
}

// ---------------------------------------------------------------------------
// Recarga Pix (conta Mercado Pago do fornecedor)
// ---------------------------------------------------------------------------
export async function createRecharge(db: Database, actor: Actor, storeId: string, amountCents: number, opts: { notificationBaseUrl?: string; fetchImpl?: FetchLike; payerEmail?: string } = {}) {
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Recarga disponível apenas para o lojista.");
  const store = await loadStore(db, storeId);
  assertCanAccess(actor, { storeId, supplierId: store.supplierId });
  if (!Number.isInteger(amountCents) || amountCents < MIN_RECHARGE_CENTS || amountCents > MAX_RECHARGE_CENTS) throw new DomainError("INVALID_AMOUNT", "Informe um valor entre R$ 10,00 e R$ 50.000,00.");
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, store.supplierId) });
  const token = decryptSecret(supplier?.walletMpTokenEnc);
  if (!token) throw new DomainError("WALLET_NOT_CONFIGURED", "Seu fornecedor ainda não habilitou recargas por Pix. Fale com ele.");
  const id = newId("rch");
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  try {
    const pix = await createPixPayment(token, { amountCents, description: `Recarga de saldo · ${store.name}`, payerEmail: opts.payerEmail ?? "recarga@nextlevel.app", externalReference: id, notificationUrl: opts.notificationBaseUrl ? `${opts.notificationBaseUrl}/api/webhooks/mercadopago-wallet?recharge=${id}` : undefined, expiresAt }, opts.fetchImpl);
    await db.insert(walletRecharges).values({ id, storeId, supplierId: store.supplierId, amountCents, mpPaymentId: pix.paymentId, pixCode: pix.qrCode, pixQrBase64: pix.qrCodeBase64, expiresAt: expiresAt.toISOString() });
    return { id, pixCode: pix.qrCode, pixQrBase64: pix.qrCodeBase64, expiresAt: expiresAt.toISOString() };
  } catch (e) {
    if (e instanceof MercadoPagoError) throw new DomainError("PIX_FAILED", e.message);
    throw e;
  }
}

/** Demonstração (sem token do fornecedor): gera um Pix fictício que só é "pago" pelo botão de simulação. */
export async function createDemoRecharge(db: Database, actor: Actor, storeId: string, amountCents: number) {
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Recarga disponível apenas para o lojista.");
  const store = await loadStore(db, storeId);
  assertCanAccess(actor, { storeId, supplierId: store.supplierId });
  if (!Number.isInteger(amountCents) || amountCents < MIN_RECHARGE_CENTS || amountCents > MAX_RECHARGE_CENTS) throw new DomainError("INVALID_AMOUNT", "Informe um valor entre R$ 10,00 e R$ 50.000,00.");
  const id = newId("rch");
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await db.insert(walletRecharges).values({ id, storeId, supplierId: store.supplierId, amountCents, mpPaymentId: `demo_${id}`, pixCode: `00020126DEMO${id}5204000053039865802BR`, pixQrBase64: "", expiresAt });
  return { id, pixCode: `00020126DEMO${id}5204000053039865802BR`, pixQrBase64: "", expiresAt };
}

/** Só demonstração: marca a recarga fictícia como paga. */
export async function simulateDemoRecharge(db: Database, actor: Actor, rechargeId: string) {
  const r = await db.query.walletRecharges.findFirst({ where: eq(walletRecharges.id, rechargeId) });
  if (!r || !r.mpPaymentId?.startsWith("demo_")) throw new NotFoundError("Recarga não encontrada.");
  assertCanAccess(actor, { storeId: r.storeId, supplierId: r.supplierId });
  return creditRecharge(db, rechargeId, { mpPaymentId: r.mpPaymentId, amountCents: r.amountCents });
}

/** Confirma uma recarga consultando o Mercado Pago (webhook ou polling). O corpo do webhook nunca é confiável. */
export async function syncRecharge(db: Database, rechargeId: string, fetchImpl: FetchLike = fetch): Promise<{ paid: boolean }> {
  const r = await db.query.walletRecharges.findFirst({ where: eq(walletRecharges.id, rechargeId) });
  if (!r) return { paid: false };
  if (r.status === "PAID") return { paid: true };
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, r.supplierId) });
  const token = decryptSecret(supplier?.walletMpTokenEnc);
  if (!token || !r.mpPaymentId) return { paid: false };
  const p = await getPayment(token, r.mpPaymentId, fetchImpl);
  if (p.externalReference !== r.id || p.status !== "approved") return { paid: false };
  await creditRecharge(db, r.id, { mpPaymentId: p.id, amountCents: p.amountCents });
  return { paid: true };
}

export async function listRecharges(db: Database, actor: Actor, storeId: string, limit = 10) {
  const store = await loadStore(db, storeId);
  assertCanAccess(actor, { storeId, supplierId: store.supplierId });
  return db.select().from(walletRecharges).where(eq(walletRecharges.storeId, storeId)).orderBy(desc(walletRecharges.createdAt)).limit(limit);
}

// ---------------------------------------------------------------------------
// Expiração (72h sem saldo)
// ---------------------------------------------------------------------------
export async function expireUnfundedOrders(db: Database, now = new Date()): Promise<{ canceled: number }> {
  const limit = new Date(now.getTime() - AWAITING_FUNDS_HOURS * 3_600_000).toISOString();
  const stale = await db.select().from(orders).where(and(eq(orders.status, "AWAITING_CENTRAL_PAYMENT"), eq(orders.centralPaymentStatus, "PENDING"), lt(orders.awaitingFundsSince, limit)));
  for (const o of stale) {
    await cancelOrderBySystem(db, o.id, `sem recarga de saldo em ${AWAITING_FUNDS_HOURS}h. Cliente já pagou: estornar no Mercado Pago da loja.`);
    await db.insert(activities).values({ id: newId("act"), scope: "STORE", supplierId: o.supplierId, storeId: o.storeId, type: "FUNDS_EXPIRED", message: `Pedido #${o.number} cancelado por falta de saldo. Estorne o cliente.` });
  }
  return { canceled: stale.length };
}

/** Visão do fornecedor sobre as carteiras dos lojistas da rede: saldo, pedidos aguardando e última recarga. */
export async function walletOverviewForSupplier(db: Database, actor: Actor) {
  if (actor.role !== "SUPPLIER_ADMIN" || !actor.supplierId) throw new ForbiddenError();
  const rows = await db.select({ store: stores }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(networks.supplierId, actor.supplierId));
  const out = [];
  for (const { store } of rows) {
    const balance = await getBalanceCents(db, store.id);
    const waiting = await db.select({ cost: orders.costTotalCents }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.status, "AWAITING_CENTRAL_PAYMENT"), eq(orders.centralPaymentStatus, "PENDING")));
    const last = await db.select().from(walletRecharges).where(and(eq(walletRecharges.storeId, store.id), eq(walletRecharges.status, "PAID"))).orderBy(desc(walletRecharges.paidAt)).limit(1);
    out.push({ storeId: store.id, name: store.name, offer: store.offer, status: store.status, balanceCents: balance, awaitingOrders: waiting.length, awaitingCents: waiting.reduce((s, w) => s + w.cost, 0), lastRechargeAt: last[0]?.paidAt ?? null, lastRechargeCents: last[0]?.amountCents ?? null });
  }
  const paid30 = await db.select({ n: walletRecharges.amountCents, at: walletRecharges.paidAt }).from(walletRecharges).where(and(eq(walletRecharges.supplierId, actor.supplierId), eq(walletRecharges.status, "PAID")));
  return { stores: out.sort((a, b) => b.awaitingCents - a.awaitingCents || a.balanceCents - b.balanceCents), receivedCents: paid30.reduce((s, r) => s + r.n, 0), rechargeCount: paid30.length };
}
