import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { groupSiteUrl } from "@/lib/host-routing";
import { corporateOrders, gatewayTransactions, paymentEvents, reconciliationRecords, serviceDeliveries, stores, users, type GatewayCode, type GatewayTxStatus, type PriceSnapshot } from "@/db/schema";
import { newId } from "@/lib/ids";
import { PricingError, quotePrice } from "@/lib/finance/catalog-pricing";
import { chooseGateway, GATEWAY_IMPL, GatewayError } from "@/lib/payments/gateway";
import { MercadoPagoError, type FetchLike } from "@/lib/payments/mercadopago";
import { PagarmeError } from "@/lib/payments/pagarme";
import { appUrl, sendEmail } from "@/lib/email";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { grantEntitlement, revokeEntitlement } from "./entitlements";
import { assertReauth, CORPORATE, recordFinancialAudit } from "./fin-audit";
import { getCatalogItem, toPriceRule, type CatalogItem } from "./nl-catalog";
import { clawbackOrder, recordSaleCommission, resolveAttribution } from "./corporate-commissions";

/**
 * Checkout rápido da NextLevel (D90): `nextlevel_corporate_finance`.
 * Só cobra itens e preços publicados pelo Master; pedido idempotente; o direito (tema, entrega de serviço) só é
 * liberado quando o gateway CONFIRMA o pagamento (consulta à API; o retorno do navegador e o corpo do webhook nunca valem).
 */
export type CorporateOrder = typeof corporateOrders.$inferSelect;
export type GatewayTx = typeof gatewayTransactions.$inferSelect;

const code = () => randomBytes(5).toString("hex").toUpperCase();
const PIX_MINUTES = 60;

export const checkoutSchema = z.object({
  productKey: z.string().min(3).max(40),
  method: z.enum(["PIX", "CARD"]),
  installments: z.number().int().min(1).max(12).default(1),
  /** Gerada pela tela ao abrir o checkout: duplo clique ou reenvio devolvem o mesmo pedido. */
  idempotencyKey: z.string().trim().min(8).max(80),
  guest: z.object({ name: z.string().trim().min(3).max(120), email: z.string().trim().toLowerCase().email(), taxId: z.string().trim().max(18).optional(), phone: z.string().trim().max(20).optional() }).optional(),
  refCode: z.string().trim().max(40).optional(),
  attribution: z.record(z.string().max(40), z.string().max(120)).optional(),
});

export type CheckoutResult = { orderId: string; code: string; txId: string; method: "PIX" | "CARD"; totalCents: number; installments: number; installmentCents: number; pixCode?: string; pixQrBase64?: string; checkoutUrl?: string; demo: boolean; gateway: GatewayCode; status: CorporateOrder["status"] };

type Buyer = { type: "STORE" | "SUPPLIER" | "GUEST"; storeId: string | null; supplierId: string | null; userId: string | null; name: string; email: string; taxId: string | null; phone: string | null };

async function buyerOf(db: Database, actor: Actor | null, guest: z.infer<typeof checkoutSchema>["guest"]): Promise<Buyer> {
  if (actor && actor.role === "STORE_OWNER" && actor.storeId) {
    if (actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da loja contrata produtos da NextLevel.");
    const s = await db.query.stores.findFirst({ where: eq(stores.id, actor.storeId) });
    const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId) });
    if (!s || !u) throw new NotFoundError("Loja não encontrada.");
    return { type: "STORE", storeId: s.id, supplierId: null, userId: u.id, name: u.name, email: u.email, taxId: s.taxId ?? s.cnpj ?? null, phone: s.whatsapp ?? null };
  }
  if (actor && actor.role === "SUPPLIER_ADMIN" && actor.supplierId) {
    const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId) });
    if (!u) throw new NotFoundError("Usuário não encontrado.");
    return { type: "SUPPLIER", storeId: null, supplierId: actor.supplierId, userId: u.id, name: u.name, email: u.email, taxId: null, phone: null };
  }
  if (actor && actor.role !== "AFFILIATE") throw new ForbiddenError("Este perfil não compra produtos da NextLevel.");
  if (!guest) throw new DomainError("BUYER", "Informe nome e e-mail para continuar.");
  return { type: "GUEST", storeId: null, supplierId: null, userId: actor?.userId ?? null, name: guest.name, email: guest.email, taxId: guest.taxId?.replace(/\D/g, "") || null, phone: guest.phone?.replace(/\D/g, "") || null };
}

/** Produto pode ser comprado direto por este comprador? (A jornada também usa: nunca esconde, só explica.) */
export function assertPurchasable(p: CatalogItem, buyer: { type: Buyer["type"] }) {
  if (p.status !== "PUBLISHED") throw new DomainError("NOT_AVAILABLE", "Este produto não está disponível para compra agora.");
  if (p.kind === "quote_required") throw new DomainError("QUOTE_REQUIRED", "Este produto é sob consulta: peça uma proposta.");
  if (p.family === "COMMERCE_PLAN") throw new DomainError("PLAN_FLOW", "Planos são contratados pela assinatura da loja.");
  const aud = buyer.type === "GUEST" ? "PUBLIC" : buyer.type;
  if (!p.audience.includes(aud as never)) throw new DomainError("NOT_FOR_YOU", "Este produto não está disponível para o seu perfil.");
  if (p.family === "TEMA" && buyer.type !== "STORE") throw new DomainError("NEEDS_STORE", "Temas são comprados por uma loja: entre na sua conta para comprar.");
}

/**
 * Cria (ou devolve, pela chave de idempotência) o pedido e a cobrança. `demo`: sem gateway real, cobrança fictícia
 * quitada só pelo botão de simulação (modo demonstração).
 */
export async function createCorporateCheckout(db: Database, actor: Actor | null, raw: z.input<typeof checkoutSchema>, opts: { demo?: boolean; publicBaseUrl?: string; returnPath: string; fetchImpl?: FetchLike; now?: Date; eligibility?: (p: CatalogItem) => Promise<void> }): Promise<CheckoutResult> {
  const input = checkoutSchema.parse(raw);
  const scopedKey = `${actor?.userId ?? input.guest?.email ?? "anon"}:${input.idempotencyKey}`;
  const existing = await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.idempotencyKey, scopedKey) });
  if (existing) return resumeCheckout(db, existing, opts);

  const product = await getCatalogItem(db, { key: input.productKey });
  if (!product) throw new NotFoundError("Produto não encontrado.");
  const buyer = await buyerOf(db, actor, input.guest);
  assertPurchasable(product, buyer);
  if (opts.eligibility) await opts.eligibility(product);
  const version = product.prices.ONE_TIME;
  if (!version) throw new DomainError("NO_PRICE", "Este produto ainda não tem preço publicado.");
  let q;
  try { q = quotePrice(toPriceRule(version), { method: input.method, installments: input.method === "CARD" ? input.installments : 1 }); }
  catch (e) { if (e instanceof PricingError) throw new DomainError(e.code, e.message); throw e; }

  const attribution = await resolveAttribution(db, { storeId: buyer.storeId, buyerEmail: buyer.email, buyerTaxId: buyer.taxId, buyerUserId: buyer.userId, refCode: input.refCode });
  const gateway = opts.demo ? "MERCADOPAGO" : await chooseGateway(db, product.gateway);
  const snapshot: PriceSnapshot = { productKey: product.key, productName: product.name, cycle: "ONE_TIME", priceVersionId: version.id, priceVersion: version.version, baseCents: q.baseCents, method: q.method, installments: q.installments, installmentCents: q.installmentCents, pixDiscountCents: q.pixDiscountCents, cardMarkupCents: q.cardMarkupCents, partnerDiscountCents: q.partnerDiscountCents, offerDiscountCents: 0, totalCents: q.totalCents, rule: q.rule };
  const orderId = newId("cor");
  const inserted = await db.insert(corporateOrders).values({
    id: orderId, idempotencyKey: scopedKey, code: code(), buyerType: buyer.type, storeId: buyer.storeId, supplierId: buyer.supplierId, buyerUserId: buyer.userId, buyerName: buyer.name, buyerEmail: buyer.email, buyerTaxId: buyer.taxId,
    productId: product.id, priceVersionId: version.id, cycle: "ONE_TIME", method: q.method, installments: q.installments, baseCents: q.baseCents, discountCents: q.pixDiscountCents + q.partnerDiscountCents, markupCents: q.cardMarkupCents, totalCents: q.totalCents, snapshot, gateway,
    partnerId: attribution && !attribution.flagged ? attribution.partnerId : null, attribution: { ...(input.attribution ?? {}), ...(attribution ? { partnerVia: attribution.via, ...(attribution.flagged ? { flag: "SELF_REFERRAL" } : {}) } : {}) },
  }).onConflictDoNothing().returning();
  // Corrida (duplo clique): outro processo criou primeiro; devolve o dele.
  const order = inserted[0] ?? (await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.idempotencyKey, scopedKey) }))!;
  if (!inserted[0]) return resumeCheckout(db, order, opts);
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "ORDER_CREATED", entityType: "corporate_order", entityId: order.id, storeId: buyer.storeId, supplierId: buyer.supplierId, partnerId: order.partnerId, after: { code: order.code, productKey: product.key, totalCents: q.totalCents, method: q.method, installments: q.installments, gateway, rule: q.rule } });
  return startCharge(db, order, product.name, buyer, opts);
}

/** Abre uma nova tentativa no MESMO gateway do pedido (nunca troca de gateway depois de criado). */
async function startCharge(db: Database, order: CorporateOrder, description: string, buyer: Pick<Buyer, "name" | "email" | "taxId" | "phone">, opts: { demo?: boolean; publicBaseUrl?: string; returnPath: string; fetchImpl?: FetchLike }): Promise<CheckoutResult> {
  const attempt = (await db.select({ id: gatewayTransactions.id }).from(gatewayTransactions).where(eq(gatewayTransactions.orderId, order.id))).length + 1;
  const txId = newId("gtx");
  const expiresAt = new Date(Date.now() + (order.method === "PIX" ? PIX_MINUTES : 24 * 60) * 60_000);
  await db.insert(gatewayTransactions).values({ id: txId, gateway: order.gateway, orderId: order.id, idempotencyKey: `${order.id}:${attempt}`, method: order.method, installments: order.installments, grossCents: order.totalCents, expiresAt: expiresAt.toISOString() });
  const base = { orderId: order.id, code: order.code, txId, method: order.method, totalCents: order.totalCents, installments: order.installments, installmentCents: order.snapshot.installmentCents, gateway: order.gateway, status: order.status };
  if (opts.demo) {
    const pix = order.method === "PIX" ? `00020126DEMO${txId}5204000053039865802BR` : undefined;
    await db.update(gatewayTransactions).set({ externalId: `demo_${txId}`, pixCode: pix ?? null, updatedAt: new Date().toISOString() }).where(eq(gatewayTransactions.id, txId));
    return { ...base, pixCode: pix, demo: true };
  }
  try {
    const r = await GATEWAY_IMPL[order.gateway].createCharge(db, { reference: txId, idempotencyKey: `${order.id}:${attempt}`, amountCents: order.totalCents, description: `${description} · ${order.code}`, method: order.method, maxInstallments: order.installments, customer: buyer, publicBaseUrl: opts.publicBaseUrl, returnPath: `${opts.returnPath}${opts.returnPath.includes("?") ? "&" : "?"}pedido=${order.code}`, expiresAt }, opts.fetchImpl);
    await db.update(gatewayTransactions).set({ externalId: r.externalId, pixCode: r.pixCode ?? null, pixQrBase64: r.pixQrBase64 ?? null, checkoutUrl: r.checkoutUrl ?? null, updatedAt: new Date().toISOString() }).where(eq(gatewayTransactions.id, txId));
    return { ...base, pixCode: r.pixCode, pixQrBase64: r.pixQrBase64, checkoutUrl: r.checkoutUrl, demo: false };
  } catch (e) {
    await db.update(gatewayTransactions).set({ status: "FAILED", providerStatus: "create_failed", updatedAt: new Date().toISOString() }).where(eq(gatewayTransactions.id, txId));
    if (e instanceof MercadoPagoError || e instanceof PagarmeError || e instanceof GatewayError) throw new DomainError("PAY_FAILED", e.message);
    if (e instanceof DomainError) throw e;
    throw e;
  }
}

/** Pedido já existente: devolve a cobrança pendente válida ou abre nova tentativa no mesmo gateway. */
async function resumeCheckout(db: Database, order: CorporateOrder, opts: { demo?: boolean; publicBaseUrl?: string; returnPath: string; fetchImpl?: FetchLike }): Promise<CheckoutResult> {
  const txs = await db.select().from(gatewayTransactions).where(eq(gatewayTransactions.orderId, order.id)).orderBy(desc(gatewayTransactions.createdAt));
  const base = { orderId: order.id, code: order.code, method: order.method, totalCents: order.totalCents, installments: order.installments, installmentCents: order.snapshot.installmentCents, gateway: order.gateway, status: order.status };
  const live = txs.find((t) => t.status === "PENDING" && (!t.expiresAt || new Date(t.expiresAt) > new Date()) && (t.pixCode || t.checkoutUrl || t.externalId?.startsWith("demo_")));
  if (live || order.status !== "PENDING_PAYMENT") {
    const t = live ?? txs[0]!;
    return { ...base, txId: t.id, pixCode: t.pixCode ?? undefined, pixQrBase64: t.pixQrBase64 ?? undefined, checkoutUrl: t.checkoutUrl ?? undefined, demo: !!t.externalId?.startsWith("demo_") };
  }
  return startCharge(db, order, order.snapshot.productName, { name: order.buyerName, email: order.buyerEmail, taxId: order.buyerTaxId, phone: null }, opts);
}

// ---------------------------------------------------------------------------
// Confirmação (webhook ou consulta da tela) — idempotente e tolerante a eventos fora de ordem
// ---------------------------------------------------------------------------
const FINAL: GatewayTxStatus[] = ["REFUNDED", "CHARGEBACK"];

/** Consulta o gateway e aplica o estado. Nunca confia no corpo do webhook nem no retorno do navegador. */
export async function syncTransaction(db: Database, txId: string, fetchImpl?: FetchLike, now = new Date()): Promise<{ status: GatewayTxStatus; orderStatus: CorporateOrder["status"] | null }> {
  const tx = await db.query.gatewayTransactions.findFirst({ where: eq(gatewayTransactions.id, txId) });
  if (!tx) throw new NotFoundError("Cobrança não encontrada.");
  const order = tx.orderId ? await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, tx.orderId) }) : null;
  if (tx.externalId?.startsWith("demo_")) return { status: tx.status, orderStatus: order?.status ?? null };
  if (FINAL.includes(tx.status)) return { status: tx.status, orderStatus: order?.status ?? null };
  const state = await GATEWAY_IMPL[tx.gateway].getState(db, { id: tx.id, externalId: tx.externalId, method: tx.method }, fetchImpl);
  if (!state) return { status: tx.status, orderStatus: order?.status ?? null };
  if (state.reference && state.reference !== tx.id) throw new DomainError("REFERENCE_MISMATCH", "O pagamento informado não pertence a esta cobrança.");
  if (state.status === "PAID" && state.paidCents < tx.grossCents) throw new DomainError("AMOUNT_MISMATCH", "Valor pago menor que o da cobrança.");
  await applyState(db, tx, order ?? null, state.status, { externalId: state.externalId, providerStatus: state.providerStatus, feeCents: state.feeCents, netCents: state.netCents, refundedCents: state.refundedCents }, now);
  const fresh = order ? await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, order.id) }) : null;
  return { status: state.status, orderStatus: fresh?.status ?? null };
}

/**
 * Transições permitidas (evento atrasado não volta estado): PENDING → PAID/FAILED/CANCELED/EXPIRED;
 * PAID → REFUNDED/CHARGEBACK. Tudo com atualização condicional (dois webhooks simultâneos não liberam duas vezes).
 */
async function applyState(db: Database, tx: GatewayTx, order: CorporateOrder | null, status: GatewayTxStatus, info: { externalId: string; providerStatus: string; feeCents: number | null; netCents: number | null; refundedCents: number }, now: Date) {
  const nowIso = now.toISOString();
  const allowedFrom: Record<GatewayTxStatus, GatewayTxStatus[]> = { PENDING: [], PAID: ["PENDING", "FAILED", "EXPIRED"], FAILED: ["PENDING"], CANCELED: ["PENDING"], EXPIRED: ["PENDING"], REFUNDED: ["PAID"], CHARGEBACK: ["PAID", "REFUNDED"] };
  const from = allowedFrom[status];
  if (!from.length) { await db.update(gatewayTransactions).set({ externalId: tx.externalId ?? info.externalId, providerStatus: info.providerStatus, updatedAt: nowIso }).where(eq(gatewayTransactions.id, tx.id)); return; }
  const moved = await db.update(gatewayTransactions).set({ status, externalId: tx.externalId ?? info.externalId, providerStatus: info.providerStatus, feeCents: info.feeCents, netCents: info.netCents, refundedCents: info.refundedCents, paidAt: status === "PAID" ? nowIso : tx.paidAt, updatedAt: nowIso }).where(and(eq(gatewayTransactions.id, tx.id), inArray(gatewayTransactions.status, from))).returning({ id: gatewayTransactions.id });
  if (!moved.length || !order) return;
  if (status === "PAID") await markOrderPaid(db, order, { ...tx, feeCents: info.feeCents }, now);
  else if (status === "REFUNDED" || status === "CHARGEBACK") await reverseOrder(db, order, status, now);
}

async function markOrderPaid(db: Database, order: CorporateOrder, tx: Pick<GatewayTx, "id" | "feeCents" | "grossCents">, now: Date) {
  const r = await db.update(corporateOrders).set({ status: "PAID", paidAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(corporateOrders.id, order.id), inArray(corporateOrders.status, ["PENDING_PAYMENT", "EXPIRED", "FAILED"]))).returning();
  if (!r.length) return;
  await recordFinancialAudit(db, null, { domain: CORPORATE, action: "ORDER_PAID", entityType: "corporate_order", entityId: order.id, storeId: order.storeId, supplierId: order.supplierId, partnerId: order.partnerId, after: { code: order.code, totalCents: order.totalCents, gateway: order.gateway, txId: tx.id, feeCents: tx.feeCents } });
  await fulfillOrder(db, r[0]!, now);
  if (order.partnerId) {
    const product = await getCatalogItem(db, { id: order.productId }, { includeUnpublished: true });
    if (product) await recordSaleCommission(db, { partnerId: order.partnerId, family: product.family, productKey: product.key, cycle: "ONE_TIME", paymentIndex: 1, paidCents: tx.grossCents, feeCents: tx.feeCents, storeId: order.storeId, orderId: order.id, dedupeKey: `SALE:${order.id}`, now });
  }
}

/** Libera o direito: tema (licença na loja) ou entrega do serviço (prazo, responsável, checklist, aceite). Idempotente. */
async function fulfillOrder(db: Database, order: CorporateOrder, now: Date) {
  const claimed = await db.update(corporateOrders).set({ fulfilledAt: now.toISOString() }).where(and(eq(corporateOrders.id, order.id), eq(corporateOrders.status, "PAID"), isNull(corporateOrders.fulfilledAt))).returning({ fulfilled: corporateOrders.fulfilledAt });
  if (!claimed.length) return;
  const product = await getCatalogItem(db, { id: order.productId }, { includeUnpublished: true });
  if (!product) return;
  if (product.grantsKey && order.storeId) await grantEntitlement(db, { type: "STORE", storeId: order.storeId }, { key: product.grantsKey, source: "ADD_ON", note: `Pedido ${order.code}`, now });
  if (product.grantsKey?.startsWith("THEME_")) await emitEvent(db, { type: "THEME_PURCHASED", storeId: order.storeId, payload: { key: product.grantsKey, orderId: order.id }, dedupeKey: `THEME_PURCHASED:${order.id}` });
  if (["LOJA_PRONTA", "MIGRACAO", "MARKETING", "CONSULTORIA"].includes(product.family)) {
    const due = product.deliveryDays ? new Date(now.getTime() + product.deliveryDays * 86_400_000).toISOString() : null;
    const checklist = [...product.content.scope.map((label) => ({ label, done: false })), { label: "Aceite de entrega (go-live) pelo cliente", done: false }];
    await db.insert(serviceDeliveries).values({ id: newId("sdl"), orderId: order.id, productKey: product.key, storeId: order.storeId, supplierId: order.supplierId, dueAt: due, checklist, details: product.family === "MIGRACAO" ? { sources: product.meta.sources ?? [], maxProducts: product.meta.maxProducts ?? null, source: null, scope: product.summary } : product.family === "MARKETING" ? { mediaSpendPaidByClient: true, minTermMonths: product.meta.minTermMonths ?? 3 } : {} }).onConflictDoNothing();
  }
  await sendEmail(db, { kind: "NL_CORPORATE_PAID", to: order.buyerEmail, dedupeKey: `NL_CORPORATE_PAID:${order.id}`, subject: `Pagamento confirmado: ${product.name}`, text: `Recebemos o pagamento do pedido ${order.code} (${product.name}).\n\nValor: R$ ${(order.totalCents / 100).toFixed(2).replace(".", ",")} · ${order.method === "PIX" ? "Pix" : `cartão em ${order.installments}x`}.\n\n${product.grantsKey?.startsWith("THEME_") ? "O tema já está liberado na sua loja." : "A equipe NextLevel entra em contato para começar a entrega."}`, cta: { label: "Acompanhar", url: order.storeId ? `${appUrl()}/merchant/services` : `${groupSiteUrl()}/solucoes` } });
}

/** Estorno ou chargeback: revoga o direito, cancela a entrega não iniciada e estorna a comissão (auditado). */
async function reverseOrder(db: Database, order: CorporateOrder, status: "REFUNDED" | "CHARGEBACK", now: Date) {
  const r = await db.update(corporateOrders).set({ status, updatedAt: now.toISOString() }).where(and(eq(corporateOrders.id, order.id), inArray(corporateOrders.status, status === "CHARGEBACK" ? ["PAID", "REFUNDED"] : ["PAID"]))).returning();
  if (!r.length) return;
  const product = await getCatalogItem(db, { id: order.productId }, { includeUnpublished: true });
  if (product?.grantsKey && order.storeId) await revokeEntitlement(db, { type: "STORE", storeId: order.storeId }, product.grantsKey);
  await db.update(serviceDeliveries).set({ status: "CANCELED", updatedAt: now.toISOString() }).where(and(eq(serviceDeliveries.orderId, order.id), inArray(serviceDeliveries.status, ["WAITING_BRIEFING", "IN_PROGRESS", "REVIEW"])));
  await clawbackOrder(db, order.id, status === "CHARGEBACK" ? "Chargeback" : "Reembolso", now);
  await recordFinancialAudit(db, null, { domain: CORPORATE, action: status === "CHARGEBACK" ? "ORDER_CHARGEBACK" : "ORDER_REFUNDED", entityType: "corporate_order", entityId: order.id, storeId: order.storeId, partnerId: order.partnerId, before: { status: order.status }, after: { status } });
}

// ---------------------------------------------------------------------------
// Webhook (registro do evento + consulta)
// ---------------------------------------------------------------------------
/**
 * Registra o evento com chave única (duplicado = ignorado) e só então consulta o gateway. O evento não carrega
 * estado confiável: só diz "olhe esta cobrança".
 */
export async function handleGatewayEvent(db: Database, e: { gateway: GatewayCode; eventKey: string; type: string; txId: string | null; externalId: string | null }, fetchImpl?: FetchLike): Promise<{ result: "PROCESSED" | "IGNORED" | "REJECTED" | "FAILED"; status?: GatewayTxStatus }> {
  const tx = e.txId ? await db.query.gatewayTransactions.findFirst({ where: eq(gatewayTransactions.id, e.txId) }) : e.externalId ? await db.query.gatewayTransactions.findFirst({ where: and(eq(gatewayTransactions.gateway, e.gateway), eq(gatewayTransactions.externalId, e.externalId)) }) : null;
  const ins = await db.insert(paymentEvents).values({ id: newId("pev"), gateway: e.gateway, eventKey: e.eventKey, type: e.type.slice(0, 60), externalId: e.externalId, transactionId: tx?.id ?? null, result: tx ? "PROCESSED" : "IGNORED", detail: tx ? null : "cobrança desconhecida" }).onConflictDoNothing().returning({ id: paymentEvents.id });
  if (!ins.length) return { result: "IGNORED" };
  if (!tx) return { result: "IGNORED" };
  if (tx.gateway !== e.gateway) { await db.update(paymentEvents).set({ result: "REJECTED", detail: "gateway diferente do da cobrança" }).where(eq(paymentEvents.id, ins[0]!.id)); return { result: "REJECTED" }; }
  try {
    const r = await syncTransaction(db, tx.id, fetchImpl);
    return { result: "PROCESSED", status: r.status };
  } catch (err) {
    // Libera a chave para o provedor tentar de novo (falha transitória), sem perder o registro do erro.
    await db.update(paymentEvents).set({ result: "FAILED", detail: err instanceof Error ? err.message.slice(0, 200) : "erro", eventKey: `${e.eventKey}:failed:${Date.now()}` }).where(eq(paymentEvents.id, ins[0]!.id));
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Tela do comprador: estado do próprio pedido
// ---------------------------------------------------------------------------
export async function checkOwnTransaction(db: Database, actor: Actor | null, txId: string, guestEmail?: string, fetchImpl?: FetchLike) {
  const tx = await db.query.gatewayTransactions.findFirst({ where: eq(gatewayTransactions.id, txId) });
  if (!tx?.orderId) throw new NotFoundError("Cobrança não encontrada.");
  const order = (await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, tx.orderId) }))!;
  const own = (actor && (isMaster(actor) || (order.storeId && actor.storeId === order.storeId) || (order.supplierId && actor.role === "SUPPLIER_ADMIN" && actor.supplierId === order.supplierId) || order.buyerUserId === actor.userId)) || (!actor && guestEmail && guestEmail.toLowerCase() === order.buyerEmail);
  if (!own) throw new ForbiddenError();
  if (tx.status === "PENDING" && !tx.externalId?.startsWith("demo_")) { try { await syncTransaction(db, tx.id, fetchImpl); } catch { /* a tela tenta de novo */ } }
  const fresh = (await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, order.id) }))!;
  return { code: fresh.code, status: fresh.status, paid: fresh.status === "PAID" };
}

/** Só demonstração: quita a cobrança fictícia pelo mesmo caminho de um pagamento real. */
export async function simulateCorporatePayment(db: Database, actor: Actor | null, txId: string, guestEmail?: string) {
  const tx = await db.query.gatewayTransactions.findFirst({ where: eq(gatewayTransactions.id, txId) });
  if (!tx?.externalId?.startsWith("demo_") || !tx.orderId) throw new NotFoundError("Cobrança de demonstração não encontrada.");
  await checkOwnTransaction(db, actor, txId, guestEmail);
  const order = (await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, tx.orderId) }))!;
  await applyState(db, tx, order, "PAID", { externalId: tx.externalId, providerStatus: "demo_approved", feeCents: 0, netCents: tx.grossCents, refundedCents: 0 }, new Date());
}

/** Pedidos da NextLevel do próprio comprador (Minha evolução com a NextLevel). */
export async function listOwnCorporateOrders(db: Database, actor: Actor) {
  if (actor.role === "STORE_OWNER" && actor.storeId) return db.select().from(corporateOrders).where(eq(corporateOrders.storeId, actor.storeId)).orderBy(desc(corporateOrders.createdAt));
  if (actor.role === "SUPPLIER_ADMIN" && actor.supplierId) return db.select().from(corporateOrders).where(eq(corporateOrders.supplierId, actor.supplierId)).orderBy(desc(corporateOrders.createdAt));
  return [];
}

export async function listOwnDeliveries(db: Database, actor: Actor) {
  if (actor.role === "STORE_OWNER" && actor.storeId) return db.select().from(serviceDeliveries).where(eq(serviceDeliveries.storeId, actor.storeId)).orderBy(desc(serviceDeliveries.createdAt));
  if (actor.role === "SUPPLIER_ADMIN" && actor.supplierId) return db.select().from(serviceDeliveries).where(eq(serviceDeliveries.supplierId, actor.supplierId)).orderBy(desc(serviceDeliveries.createdAt));
  return [];
}

/** Cliente dá o aceite de go-live da entrega dele. */
export async function acceptDelivery(db: Database, actor: Actor, deliveryId: string) {
  const d = await db.query.serviceDeliveries.findFirst({ where: eq(serviceDeliveries.id, deliveryId) });
  if (!d) throw new NotFoundError("Entrega não encontrada.");
  const own = (d.storeId && actor.role === "STORE_OWNER" && actor.storeId === d.storeId && actor.storeRole !== "STAFF") || (d.supplierId && actor.role === "SUPPLIER_ADMIN" && actor.supplierId === d.supplierId);
  if (!own) throw new ForbiddenError();
  if (d.status !== "DELIVERED") throw new DomainError("NOT_DELIVERED", "A entrega ainda não foi marcada como concluída pela equipe.");
  const now = new Date().toISOString();
  await db.update(serviceDeliveries).set({ status: "ACCEPTED", acceptedAt: now, updatedAt: now, checklist: d.checklist.map((c) => ({ ...c, done: true })) }).where(and(eq(serviceDeliveries.id, d.id), eq(serviceDeliveries.status, "DELIVERED")));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "DELIVERY_ACCEPTED", entityType: "service_delivery", entityId: d.id, storeId: d.storeId, supplierId: d.supplierId });
}

// ---------------------------------------------------------------------------
// Master: pagamentos, reembolso, entregas e conciliação
// ---------------------------------------------------------------------------
const requireMaster = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel."); };

export async function listCorporateOrders(db: Database, actor: Actor, opts: { limit?: number } = {}) {
  requireMaster(actor);
  return db.select().from(corporateOrders).orderBy(desc(corporateOrders.createdAt)).limit(opts.limit ?? 300);
}

export async function listTransactions(db: Database, actor: Actor, opts: { limit?: number } = {}) {
  requireMaster(actor);
  return db.select().from(gatewayTransactions).orderBy(desc(gatewayTransactions.createdAt)).limit(opts.limit ?? 300);
}

export async function listPaymentEvents(db: Database, actor: Actor, opts: { limit?: number } = {}) {
  requireMaster(actor);
  return db.select().from(paymentEvents).orderBy(desc(paymentEvents.receivedAt)).limit(opts.limit ?? 100);
}

/** Reembolso pedido pelo Master (com senha). O estado só muda quando o gateway confirma (consulta logo em seguida). */
export async function refundCorporateOrder(db: Database, actor: Actor, orderId: string, input: { password?: string; reason: string }, fetchImpl?: FetchLike) {
  requireMaster(actor);
  await assertReauth(db, actor, input.password);
  const why = z.string().trim().min(5, "Explique o motivo do reembolso").max(300).parse(input.reason);
  const order = await db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  if (order.status !== "PAID") throw new DomainError("ORDER_STATE", "Só pedidos pagos podem ser reembolsados.");
  const tx = (await db.select().from(gatewayTransactions).where(and(eq(gatewayTransactions.orderId, order.id), eq(gatewayTransactions.status, "PAID"))).limit(1))[0];
  if (!tx) throw new DomainError("NO_PAYMENT", "Pagamento confirmado não encontrado.");
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "REFUND_REQUESTED", entityType: "corporate_order", entityId: order.id, storeId: order.storeId, after: { totalCents: order.totalCents, gateway: tx.gateway }, reason: why });
  if (tx.externalId?.startsWith("demo_")) { await applyState(db, tx, order, "REFUNDED", { externalId: tx.externalId, providerStatus: "demo_refunded", feeCents: tx.feeCents, netCents: tx.netCents, refundedCents: tx.grossCents }, new Date()); return { status: "REFUNDED" as const }; }
  try { await GATEWAY_IMPL[tx.gateway].refund(db, { id: tx.id, externalId: tx.externalId, method: tx.method }, { idempotencyKey: `refund:${tx.id}` }, fetchImpl); }
  catch (e) { if (e instanceof MercadoPagoError || e instanceof PagarmeError || e instanceof GatewayError) throw new DomainError("REFUND_FAILED", e.message); throw e; }
  const r = await syncTransaction(db, tx.id, fetchImpl);
  return { status: r.status };
}

export async function listDeliveries(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(serviceDeliveries).orderBy(desc(serviceDeliveries.createdAt)).limit(300);
}

const deliveryPatch = z.object({ status: z.enum(["WAITING_BRIEFING", "IN_PROGRESS", "REVIEW", "DELIVERED", "CANCELED"]).optional(), ownerUserId: z.string().max(40).nullable().optional(), dueAt: z.string().datetime().nullable().optional(), checklist: z.array(z.object({ label: z.string().trim().min(1).max(200), done: z.boolean() })).max(40).optional(), details: z.record(z.string(), z.unknown()).optional() });

export async function updateDelivery(db: Database, actor: Actor, id: string, raw: z.input<typeof deliveryPatch>) {
  requireMaster(actor);
  const patch = deliveryPatch.parse(raw);
  const d = await db.query.serviceDeliveries.findFirst({ where: eq(serviceDeliveries.id, id) });
  if (!d) throw new NotFoundError("Entrega não encontrada.");
  if (d.status === "ACCEPTED" || d.status === "CANCELED") throw new DomainError("CLOSED", "Entrega encerrada.");
  await db.update(serviceDeliveries).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(serviceDeliveries.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "DELIVERY_UPDATED", entityType: "service_delivery", entityId: id, storeId: d.storeId, before: { status: d.status }, after: { status: patch.status ?? d.status } });
}

/**
 * Conciliação: para cada cobrança paga/estornada recente, compara o valor registrado com o que o gateway informa.
 * Divergência fica registrada para o Master (nada é corrigido automaticamente).
 */
export async function reconcile(db: Database, actor: Actor | null, opts: { limit?: number; fetchImpl?: FetchLike } = {}) {
  if (actor) requireMaster(actor);
  const txs = await db.select().from(gatewayTransactions).where(inArray(gatewayTransactions.status, ["PAID", "REFUNDED", "CHARGEBACK"])).orderBy(desc(gatewayTransactions.updatedAt)).limit(opts.limit ?? 100);
  let matched = 0, mismatched = 0, missing = 0;
  for (const tx of txs) {
    if (tx.externalId?.startsWith("demo_")) continue;
    try {
      const st = await GATEWAY_IMPL[tx.gateway].getState(db, { id: tx.id, externalId: tx.externalId, method: tx.method }, opts.fetchImpl);
      if (!st) { missing++; await db.insert(reconciliationRecords).values({ id: newId("rec"), gateway: tx.gateway, transactionId: tx.id, externalId: tx.externalId, expectedCents: tx.grossCents, status: "MISSING_GATEWAY", note: "não encontrado no gateway" }); continue; }
      const ok = st.status === tx.status && st.amountCents === tx.grossCents;
      if (ok) matched++; else mismatched++;
      await db.insert(reconciliationRecords).values({ id: newId("rec"), gateway: tx.gateway, transactionId: tx.id, externalId: st.externalId, expectedCents: tx.grossCents, gatewayCents: st.amountCents, status: ok ? "MATCHED" : "MISMATCH", note: ok ? null : `sistema ${tx.status} × gateway ${st.status}` });
    } catch (e) {
      await db.insert(reconciliationRecords).values({ id: newId("rec"), gateway: tx.gateway, transactionId: tx.id, externalId: tx.externalId, expectedCents: tx.grossCents, status: "PENDING", note: e instanceof Error ? e.message.slice(0, 160) : "erro" });
    }
  }
  return { checked: txs.length, matched, mismatched, missing };
}

export async function listReconciliation(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(reconciliationRecords).orderBy(desc(reconciliationRecords.checkedAt)).limit(200);
}
