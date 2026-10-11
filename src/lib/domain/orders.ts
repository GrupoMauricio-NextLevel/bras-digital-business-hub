import { emailOrderCustomer } from "./order-emails";
import { applyTrialMilestone } from "./precos/porta-entrada";
import { isBlocked } from "./store-access";
import { and, desc, eq, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, customers, orderEvents, orderLabelFiles, orderItems, orders, storeCustomers, stores, networks, marketingConsents, type OrderStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { emitEvent } from "./events";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { assertCanAccess, isSupplierSide, type Actor } from "./access";
import { listStoreCatalog } from "./catalog";
import { consumeReservation, releaseStock, reserveStock } from "./inventory";
import { CANCELABLE, canTransition, resolveFulfillmentStatus } from "./order-status";
import { capabilitiesForSupplier } from "./finance";
import { assertCanFulfilOrder, assertManualPaymentConfirmable, isIndependentStore, storeModality } from "./order-policy";
import { tryDebitOrder } from "./wallet";
import { unitPriceForQty } from "./price-tiers";
import { priceDiscount, redeemDiscount, releaseDiscount } from "./discounts";

export const orderLineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  packId: z.string().optional(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  storeId: z.string().min(1),
  channel: z.enum(["ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "MANUAL"]).default("ONLINE_STORE"),
  saleType: z.enum(["RETAIL", "WHOLESALE"]).default("RETAIL"),
  customer: z.object({
    name: z.string().min(2, "Informe o nome"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().optional(),
    marketingOptIn: z.boolean().default(false),
  }),
  shipping: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    costCents: z.number().int().nonnegative().default(0),
    serviceName: z.string().max(120).optional(),
    days: z.number().int().nonnegative().nullable().optional(),
  }).superRefine((shipping, ctx) => {
    // Frete cobrado exige para onde enviar (ajuste vindo da auditoria de usabilidade).
    if (shipping.costCents <= 0) return;
    if (!shipping.address?.trim()) ctx.addIssue({ code: "custom", path: ["address"], message: "Informe o endereço quando houver frete." });
    if (!shipping.city?.trim()) ctx.addIssue({ code: "custom", path: ["city"], message: "Informe a cidade quando houver frete." });
    if (!shipping.state?.trim()) ctx.addIssue({ code: "custom", path: ["state"], message: "Informe a UF quando houver frete." });
    if (!shipping.zip?.trim()) ctx.addIssue({ code: "custom", path: ["zip"], message: "Informe o CEP quando houver frete." });
  }).default({ costCents: 0 }),
  items: z.array(orderLineSchema).min(1, "Adicione ao menos um item"),
  customerPaymentStatus: z.enum(["PENDING", "PAID"]).default("PENDING"),
  notes: z.string().optional(),
  discountCode: z.string().trim().max(24).optional(),
  /** Gerada pelo checkout a cada tentativa de compra: repetir a mesma chave devolve o pedido já criado. */
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;

type Reservation = { variantId: string; quantity: number };

/**
 * Cria um pedido usando o catálogo/estoque central. Reserva estoque de cada
 * variante (packs expandem para suas variantes). Falha antes de gravar se
 * qualquer item não tiver estoque disponível.
 */
export type CreateOrderOptions = {
  /** Definidos apenas pelo servidor (nunca vindos do cliente). */
  paymentProvider?: "DEMO" | "MERCADO_PAGO" | "MANUAL";
  /** Minutos até a reserva de estoque expirar se o cliente não pagar. */
  reservationMinutes?: number;
};

export async function createOrder(db: Database, rawInput: CreateOrderInput, options: CreateOrderOptions = {}) {
  const input = createOrderSchema.parse(rawInput);
  const store = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const replayOf = async () => {
    if (!input.idempotencyKey) return null;
    const prior = await db.query.orders.findFirst({ where: and(eq(orders.storeId, store.id), eq(orders.idempotencyKey, input.idempotencyKey)) });
    // Tentativa que o sistema cancelou (falha ao iniciar o pagamento, reserva vencida): não é mais "a mesma compra".
    // Libera a chave para o cliente poder tentar de novo, em vez de devolver um pedido cancelado.
    if (prior?.status === "CANCELED") {
      await db.update(orders).set({ idempotencyKey: null }).where(eq(orders.id, prior.id));
      return null;
    }
    return prior ? { orderId: prior.id, number: prior.number, status: prior.status, totalCents: prior.totalCents, replayed: true as boolean } : null;
  };
  const already = await replayOf();
  if (already) return already;
  if (store.showcaseTheme) throw new DomainError("SHOWCASE_STORE", "Esta é uma loja de demonstração do tema: não recebe pedidos.");
  if (store.status !== "ACTIVE") throw new DomainError("STORE_INACTIVE", "Loja não está ativa.");
  if (isBlocked(store)) throw new DomainError("STORE_BLOCKED", "Esta loja está temporariamente indisponível.");
  // Loja do SuperDrop: o pedido é do fornecedor da rede. Loja independente da Commerce (D89): sem fornecedor.
  let supplierId: string | null = null;
  if (store.networkId) {
    const network = await db.query.networks.findFirst({ where: eq(networks.id, store.networkId) });
    if (!network) throw new NotFoundError("Rede não encontrada.");
    supplierId = network.supplierId;
    const access = await capabilitiesForSupplier(db, network.supplierId);
    if (!access.caps.canCreateOrders) throw new DomainError("SUPPLIER_BLOCKED", "Esta loja não pode receber novos pedidos no momento. Entre em contato com a loja.");
  }

  const catalog = await listStoreCatalog(db, store.id);
  const byProduct = new Map(catalog.map((c) => [c.product.id, c]));

  const lines: (typeof orderItems.$inferInsert)[] = [];
  const reservations: Reservation[] = [];
  const orderId = newId("ord");
  // Quantidade total por produto (só unidades; grades/packs têm preço próprio) para o preço por quantidade.
  const unitQtyByProduct = new Map<string, number>();
  for (const l of input.items) if (!l.packId) unitQtyByProduct.set(l.productId, (unitQtyByProduct.get(l.productId) ?? 0) + l.quantity);

  for (const line of input.items) {
    const item = byProduct.get(line.productId);
    if (!item) throw new DomainError("PRODUCT_NOT_AVAILABLE", "Produto não disponível para esta loja.");
    if (line.packId) {
      const pack = item.packs.find((p) => p.id === line.packId);
      if (!pack || !item.product.sellsPack) throw new DomainError("PACK_NOT_AVAILABLE", "Grade não disponível.");
      const unitPrice = item.storeProduct.packPriceCents ?? pack.suggestedPriceCents;
      for (const pi of pack.items) reservations.push({ variantId: pi.variantId, quantity: pi.quantity * line.quantity });
      lines.push({ id: newId("oi"), orderId, productId: item.product.id, packId: pack.id, productName: item.product.name, label: `${pack.name} (${pack.items.map((i) => `${i.size}:${i.quantity}`).join(" ")})`, quantity: line.quantity, unitPriceCents: unitPrice, unitCostCents: pack.costCents, lineTotalCents: unitPrice * line.quantity });
    } else {
      const variant = item.variants.find((v) => v.id === line.variantId);
      if (!variant || !item.product.sellsUnit) throw new DomainError("VARIANT_NOT_AVAILABLE", "Tamanho não disponível.");
      const unitPrice = unitPriceForQty(item.storeProduct.priceCents, item.tiers, unitQtyByProduct.get(item.product.id) ?? line.quantity);
      reservations.push({ variantId: variant.id, quantity: line.quantity });
      lines.push({ id: newId("oi"), orderId, productId: item.product.id, variantId: variant.id, productName: item.product.name, label: `Tam. ${variant.size}`, quantity: line.quantity, unitPriceCents: unitPrice, unitCostCents: item.product.costCents, lineTotalCents: unitPrice * line.quantity });
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const costTotal = lines.reduce((s, l) => s + l.unitCostCents * l.quantity, 0);
  const discount = input.discountCode ? await priceDiscount(db, store.id, input.discountCode, subtotal, costTotal) : null;
  const discountCents = discount?.cents ?? 0;
  // Pedido mínimo da loja (atacado): vale só para compra pela loja virtual; venda manual do próprio lojista não é barrada.
  if (input.channel === "ONLINE_STORE" && store.minOrderCents > 0 && subtotal - discountCents < store.minOrderCents) {
    throw new DomainError("MIN_ORDER", `Pedido mínimo desta loja: R$ ${(store.minOrderCents / 100).toFixed(2).replace(".", ",")} em produtos.`);
  }
  const total = subtotal - discountCents + input.shipping.costCents;

  // Consolida reservas por variante para validar disponibilidade agregada.
  const merged = new Map<string, number>();
  for (const r of reservations) merged.set(r.variantId, (merged.get(r.variantId) ?? 0) + r.quantity);

  try {
  return await db.transaction(async (tx) => {
    if (discount) await redeemDiscount(tx, discount.id);
    for (const [variantId, quantity] of merged) {
      await reserveStock(tx, variantId, quantity, { referenceType: "ORDER", referenceId: orderId });
    }

    const storeCustomerId = await upsertStoreCustomer(tx, store.id, input.customer, total);

    const numberRow = await tx.select({ nextNumber: sql<number>`coalesce(max(${orders.number}), 1000) + 1` }).from(orders).where(eq(orders.storeId, store.id));
    const nextNumber = Number(numberRow[0]?.nextNumber ?? 1001);

    const status = resolveFulfillmentStatus({ status: "PENDING", customerPaymentStatus: input.customerPaymentStatus, centralPaymentStatus: "PENDING", shippingLabelStatus: "PENDING" });

    await tx.insert(orders).values({
      id: orderId,
      number: nextNumber,
      storeId: store.id,
      supplierId: supplierId,
      storeCustomerId,
      idempotencyKey: input.idempotencyKey,
      channel: input.channel,
      saleType: input.saleType,
      status,
      customerPaymentStatus: input.customerPaymentStatus,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      shippingAddress: input.shipping.address,
      shippingCity: input.shipping.city,
      shippingState: input.shipping.state,
      shippingZip: input.shipping.zip,
      paymentProvider: options.paymentProvider ?? "MANUAL",
      reservationExpiresAt: options.reservationMinutes && input.customerPaymentStatus !== "PAID" ? new Date(Date.now() + options.reservationMinutes * 60_000).toISOString() : null,
      subtotalCents: subtotal,
      discountCents,
      discountId: discount?.id ?? null,
      discountCode: discount?.code ?? null,
      shippingCents: input.shipping.costCents,
      shippingService: input.shipping.serviceName ?? null,
      shippingDays: input.shipping.days ?? null,
      totalCents: total,
      costTotalCents: costTotal,
      notes: input.notes,
    });
    await tx.insert(orderItems).values(lines);
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CREATED", message: `Pedido criado via ${channelLabel(input.channel)}. Estoque reservado.`, actorRole: "SYSTEM" });
    if (input.customerPaymentStatus === "PAID") {
      await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CUSTOMER_PAID", message: "Pagamento do cliente confirmado (demonstração).", actorRole: "SYSTEM" });
    }
    await tx.insert(activities).values([
      { id: newId("act"), scope: "STORE", storeId: store.id, supplierId: supplierId, type: "ORDER_CREATED", message: `Novo pedido #${nextNumber} de ${input.customer.name}` },
      { id: newId("act"), scope: "SUPPLIER", storeId: store.id, supplierId: supplierId, type: "ORDER_CREATED", message: `${store.name} recebeu o pedido #${nextNumber}` },
    ]);

    let finalStatus = status;
    if (input.customerPaymentStatus === "PAID") {
      await tryDebitOrder(tx, orderId);
      finalStatus = (await tx.query.orders.findFirst({ where: eq(orders.id, orderId) }))!.status;
    }
    await emitEvent(tx as unknown as Database, { type: "ORDER_CREATED", storeId: store.id, supplierId: supplierId, payload: { orderId, number: nextNumber, totalCents: total }, dedupeKey: `ORDER_CREATED:${orderId}` });
    if (input.customerPaymentStatus === "PAID") await emitEvent(tx as unknown as Database, { type: "PAYMENT_APPROVED", storeId: store.id, supplierId: supplierId, payload: { orderId, totalCents: total }, dedupeKey: `PAYMENT_APPROVED:${orderId}` });
    return { orderId, number: nextNumber, status: finalStatus, totalCents: total, replayed: false as boolean };
  });
  } catch (e) {
    // Duas requisições com a mesma chave ao mesmo tempo: o índice único deixa passar uma só; a outra devolve o pedido da primeira.
    if (input.idempotencyKey && /orders_store_idempotency/.test(`${String(e)} ${String((e as { cause?: unknown }).cause ?? "")}`)) {
      const prior = await replayOf();
      if (prior) return prior;
    }
    throw e;
  }
}

function channelLabel(c: string) {
  return { ONLINE_STORE: "loja virtual", WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", MANUAL: "venda manual" }[c] ?? c;
}

async function upsertStoreCustomer(db: Database, storeId: string, c: { name: string; email: string; phone?: string; marketingOptIn: boolean }, totalCents: number) {
  const email = c.email.toLowerCase();
  let customer = await db.query.customers.findFirst({ where: eq(customers.email, email) });
  if (!customer) {
    const id = newId("cus");
    await db.insert(customers).values({ id, name: c.name, email, phone: c.phone });
    customer = { id, name: c.name, email, phone: c.phone ?? null, createdAt: new Date().toISOString() };
  }
  const sc = await db.query.storeCustomers.findFirst({ where: and(eq(storeCustomers.storeId, storeId), eq(storeCustomers.customerId, customer.id)) });
  let storeCustomerId: string;
  if (!sc) {
    storeCustomerId = newId("sc");
    await db.insert(storeCustomers).values({ id: storeCustomerId, storeId, customerId: customer.id, ordersCount: 1, totalSpentCents: totalCents, lastOrderAt: new Date().toISOString() });
  } else {
    storeCustomerId = sc.id;
    await db.update(storeCustomers).set({ ordersCount: sc.ordersCount + 1, totalSpentCents: sc.totalSpentCents + totalCents, lastOrderAt: new Date().toISOString() }).where(eq(storeCustomers.id, sc.id));
  }
  if (c.marketingOptIn) {
    await db.insert(marketingConsents).values({ id: newId("mc"), storeCustomerId, purpose: "WHATSAPP_MARKETING", source: "CHECKOUT" });
  }
  return storeCustomerId;
}

// ---------------------------------------------------------------------------
// Leitura com isolamento
// ---------------------------------------------------------------------------
export async function getOrderForActor(db: Database, actor: Actor, orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, order);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, orderId)).orderBy(desc(orderEvents.createdAt));
  const store = await db.query.stores.findFirst({ where: eq(stores.id, order.storeId) });
  const labels = await db.select({ id: orderLabelFiles.id, filename: orderLabelFiles.filename, sizeBytes: orderLabelFiles.sizeBytes, createdAt: orderLabelFiles.createdAt }).from(orderLabelFiles).where(eq(orderLabelFiles.orderId, orderId)).orderBy(orderLabelFiles.createdAt);
  return { order, items, events, store, labels };
}

export async function listOrdersForActor(db: Database, actor: Actor, opts: { status?: OrderStatus; limit?: number } = {}) {
  const scope =
    actor.role === "STORE_OWNER" ? eq(orders.storeId, actor.storeId ?? "__none__") : isSupplierSide(actor) ? eq(orders.supplierId, actor.supplierId ?? "__none__") : undefined;
  const where = and(scope, opts.status ? eq(orders.status, opts.status) : undefined);
  const rows = await db.select({ order: orders, storeName: stores.name, storeSlug: stores.slug }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(where).orderBy(desc(orders.createdAt)).limit(opts.limit ?? 100);
  return rows;
}

// ---------------------------------------------------------------------------
// Transições
// ---------------------------------------------------------------------------
async function loadOwned(db: Database, actor: Actor, orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, order);
  return order;
}

async function applyStatus(db: Database, order: typeof orders.$inferSelect, next: OrderStatus, message: string, actor: Actor) {
  await db.update(orders).set({ status: next, updatedAt: new Date().toISOString() }).where(eq(orders.id, order.id));
  await db.insert(orderEvents).values({ id: newId("evt"), orderId: order.id, type: `STATUS_${next}`, message, actorRole: actor.role });
}

/**
 * Lojista confirma que o cliente pagou (somente vendas manuais). Pedido de gateway só é confirmado
 * pela consulta ao provedor. Idempotente e seguro contra cliques/abas duplicadas: só um vence a corrida.
 */
export async function confirmCustomerPayment(db: Database, actor: Actor, orderId: string) {
  const order = await loadOwned(db, actor, orderId);
  if (order.customerPaymentStatus === "PAID") return order;
  assertManualPaymentConfirmable(order);
  const won = await db.transaction(async (tx) => {
    const claimed = await tx.update(orders).set({ customerPaymentStatus: "PAID", updatedAt: new Date().toISOString() }).where(and(eq(orders.id, orderId), eq(orders.customerPaymentStatus, "PENDING"), ne(orders.status, "CANCELED"))).returning({ id: orders.id });
    if (claimed.length === 0) return null;
    const next = resolveFulfillmentStatus({ ...order, customerPaymentStatus: "PAID" });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CUSTOMER_PAID", message: "Pagamento do cliente confirmado.", actorRole: actor.role });
    await emitEvent(tx as unknown as Database, { type: "PAYMENT_APPROVED", storeId: order.storeId, supplierId: order.supplierId, actorRole: actor.role, payload: { orderId, totalCents: order.totalCents }, dedupeKey: `PAYMENT_APPROVED:${orderId}` });
    if (next !== order.status) await applyStatus(tx, order, next, statusMessage(next, await isIndependentStore(tx as unknown as Database, order.storeId)), actor);
    await tryDebitOrder(tx, orderId);
    return (await tx.query.orders.findFirst({ where: eq(orders.id, orderId) }))!;
  });
  if (!won) {
    const fresh = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (fresh?.customerPaymentStatus === "PAID") return fresh;
    throw new DomainError("STATE_CONFLICT", "O pedido mudou enquanto você confirmava. Atualize a página e confira.");
  }
  await emailOrderCustomer(db, orderId, "PAID");
  await applyTrialMilestone(db, won.storeId, "FIRST_SALE");
  return won;
}

export const labelSchema = z.object({ code: z.string().min(4, "Informe o código da etiqueta"), carrier: z.string().min(2, "Informe a transportadora") });

/** Lojista registra a etiqueta (SuperFrete/Melhor Envio — demonstração). */
export async function registerShippingLabel(db: Database, actor: Actor, orderId: string, raw: z.input<typeof labelSchema>) {
  const data = labelSchema.parse(raw);
  const order = await loadOwned(db, actor, orderId);
  if (order.status === "CANCELED") throw new DomainError("ORDER_CANCELED", "Pedido cancelado.");
  return db.transaction(async (tx) => {
    await tx.update(orders).set({ shippingLabelStatus: "READY", shippingLabelCode: data.code, shippingCarrier: data.carrier }).where(eq(orders.id, orderId));
    const next = resolveFulfillmentStatus({ ...order, shippingLabelStatus: "READY" });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "LABEL_READY", message: `Etiqueta ${data.code} (${data.carrier}) registrada.`, actorRole: actor.role });
    if (next !== order.status) await applyStatus(tx, order, next, statusMessage(next, await isIndependentStore(tx as unknown as Database, order.storeId)), actor);
    if (next === "READY_TO_PICK") {
      await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId: order.supplierId, storeId: order.storeId, type: "READY_TO_PICK", message: `Pedido #${order.number} pronto para separação` });
    }
    return { ...order, shippingLabelStatus: "READY" as const, status: next };
  });
}

/** Nota interna do pedido: aparece só no histórico dos painéis (nunca na página do cliente). */
export async function addOrderNote(db: Database, actor: Actor, orderId: string, raw: string) {
  const text = raw.trim();
  if (text.length < 2) throw new DomainError("INVALID_NOTE", "Escreva a nota (mínimo 2 letras).");
  if (text.length > 500) throw new DomainError("INVALID_NOTE", "A nota pode ter no máximo 500 caracteres.");
  await loadOwned(db, actor, orderId);
  await db.insert(orderEvents).values({ id: newId("evt"), orderId, type: "NOTE_INTERNAL", message: text, actorRole: actor.role });
}

/**
 * Avanço operacional. Quem pode: fornecedor/expedição (da Central do pedido), Master e, em conta simples,
 * o dono da própria loja. A mudança de status é condicional: repetir o mesmo avanço não baixa estoque duas vezes.
 */
export async function advanceOrder(db: Database, actor: Actor, orderId: string, next: OrderStatus) {
  const order = await loadOwned(db, actor, orderId);
  if (next === "CANCELED") return cancelOrder(db, actor, orderId);
  if (order.status === next) return { ...order, status: next }; // repetição: sucesso idempotente, sem efeitos
  if (!canTransition(order.status, next)) throw new DomainError("INVALID_TRANSITION", `Transição ${order.status} → ${next} não permitida.`);
  const modality = await assertCanFulfilOrder(db, actor, order);
  if (order.supplierId && (modality !== "INDEPENDENT" || actor.role !== "STORE_OWNER")) {
    const access = await capabilitiesForSupplier(db, order.supplierId);
    if (!access.caps.canExpedite) throw new DomainError("SUPPLIER_BLOCKED", "Expedição indisponível por pendência financeira com a NextLevel.");
  }
  if (next === "READY_TO_PICK" && (order.centralPaymentStatus !== "PAID" || order.shippingLabelStatus !== "READY")) {
    throw new DomainError("NOT_READY", modality === "INDEPENDENT" ? "O pedido só fica pronto para separação com pagamento do cliente e etiqueta." : "Pedido só fica pronto para separação com pagamento à Central e etiqueta.");
  }
  const result = await db.transaction(async (tx) => {
    const claimed = await tx.update(orders).set({ status: next, updatedAt: new Date().toISOString() }).where(and(eq(orders.id, orderId), eq(orders.status, order.status))).returning({ id: orders.id });
    if (claimed.length === 0) return "LOST" as const;
    if (next === "SHIPPED") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      const merged = await expandReservations(tx, items);
      for (const [variantId, quantity] of merged) await consumeReservation(tx, variantId, quantity, { referenceType: "ORDER", referenceId: orderId, actorUserId: actor.userId });
    }
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: `STATUS_${next}`, message: statusMessage(next, await isIndependentStore(tx as unknown as Database, order.storeId)), actorRole: actor.role });
    if (next === "SHIPPED") await emitEvent(tx as unknown as Database, { type: "ORDER_SHIPPED", storeId: order.storeId, supplierId: order.supplierId, actorRole: actor.role, payload: { orderId }, dedupeKey: `ORDER_SHIPPED:${orderId}` });
    await tx.insert(activities).values({ id: newId("act"), scope: "STORE", supplierId: order.supplierId, storeId: order.storeId, type: `STATUS_${next}`, message: `Pedido #${order.number}: ${statusMessage(next, await isIndependentStore(tx as unknown as Database, order.storeId))}` });
    return "WON" as const;
  });
  if (result === "LOST") {
    const fresh = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (fresh?.status === next) return fresh;
    throw new DomainError("STATE_CONFLICT", "O pedido mudou de etapa enquanto você agia. Atualize a página e confira.");
  }
  if (next === "SHIPPED") await emailOrderCustomer(db, orderId, "SHIPPED");
  return { ...order, status: next };
}

/** Cancela o pedido e libera a reserva uma única vez (repetir o cancelamento não devolve estoque de novo). */
export async function cancelOrder(db: Database, actor: Actor, orderId: string) {
  if (actor.role === "SUPPLIER_DISPATCH") throw new ForbiddenError("A expedição não cancela pedidos.");
  const order = await loadOwned(db, actor, orderId);
  if (order.status === "CANCELED") return { ...order, status: "CANCELED" as const };
  if (!CANCELABLE.includes(order.status)) throw new DomainError("INVALID_TRANSITION", "Pedido não pode mais ser cancelado.");
  if (actor.role === "STORE_OWNER") await assertCanFulfilOrder(db, actor, order).catch(async (e) => {
    // dono de loja de rede/própria cancelava antes da Onda 1: mantém esse comportamento; só a conta simples passa pela política de plano
    if ((await storeModality(db, order.storeId)) === "INDEPENDENT") throw e;
  });
  const result = await db.transaction(async (tx) => {
    const claimed = await tx.update(orders).set({ status: "CANCELED", reservationExpiresAt: null, updatedAt: new Date().toISOString() }).where(and(eq(orders.id, orderId), eq(orders.status, order.status))).returning({ id: orders.id });
    if (claimed.length === 0) return "LOST" as const;
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const merged = await expandReservations(tx, items);
    for (const [variantId, quantity] of merged) await releaseStock(tx, variantId, quantity, { referenceType: "ORDER", referenceId: orderId, actorUserId: actor.userId });
    if (order.customerPaymentStatus !== "PAID") await releaseDiscount(tx, order.discountId);
    await emitEvent(tx as unknown as Database, { type: "ORDER_CANCELED", storeId: order.storeId, supplierId: order.supplierId, actorRole: actor.role, payload: { orderId }, dedupeKey: `ORDER_CANCELED:${orderId}` });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "STATUS_CANCELED", message: "Pedido cancelado. Reserva de estoque liberada.", actorRole: actor.role });
    return "WON" as const;
  });
  if (result === "LOST") {
    const fresh = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (fresh?.status === "CANCELED") return fresh;
    throw new DomainError("STATE_CONFLICT", "O pedido mudou de etapa enquanto você agia. Atualize a página e confira.");
  }
  return { ...order, status: "CANCELED" as const };
}

async function expandReservations(db: Database, items: (typeof orderItems.$inferSelect)[]) {
  const merged = new Map<string, number>();
  for (const it of items) {
    if (it.variantId) merged.set(it.variantId, (merged.get(it.variantId) ?? 0) + it.quantity);
    else if (it.packId) {
      const packItems = await db.query.productPackItems.findMany({ where: (p, { eq }) => eq(p.packId, it.packId!) });
      for (const pi of packItems) merged.set(pi.variantId, (merged.get(pi.variantId) ?? 0) + pi.quantity * it.quantity);
    }
  }
  return merged;
}

function statusMessage(s: OrderStatus, independent = false): string {
  const map: Record<OrderStatus, string> = {
    PENDING: "Aguardando pagamento do cliente.",
    AWAITING_CENTRAL_PAYMENT: "Aguardando recarga de saldo do lojista.",
    AWAITING_LABEL: "Aguardando etiqueta de envio.",
    READY_TO_PICK: "Pronto para separação na Central.",
    PICKING: "Separação iniciada.",
    READY_TO_SHIP: "Separação concluída. Pronto para envio.",
    SHIPPED: "Pedido enviado. Estoque baixado.",
    DELIVERED: "Pedido entregue.",
    CANCELED: "Pedido cancelado.",
  };
  // Conta simples (independente) não tem Central nem saldo de recarga: o texto fala do que ela realmente vê.
  if (independent) {
    map.AWAITING_CENTRAL_PAYMENT = "Pagamento confirmado. Liberando o pedido para separação.";
    map.READY_TO_PICK = "Pronto para separação.";
  }
  return map[s];
}


// ---------------------------------------------------------------------------
// Operações de sistema (webhooks, jobs) — sem ator humano
// ---------------------------------------------------------------------------
const SYSTEM_ACTOR = "SYSTEM";

/**
 * Marca o pagamento do cliente como confirmado (ex.: webhook do Mercado Pago).
 * Idempotente: repetir a notificação não altera nada.
 */
export async function markCustomerPaidBySystem(db: Database, orderId: string, info: { provider: "MERCADO_PAGO" | "DEMO"; reference: string; amountCents?: number }) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  if (info.amountCents !== undefined && info.amountCents < order.totalCents) {
    throw new DomainError("AMOUNT_MISMATCH", `Valor pago (${info.amountCents}) menor que o total do pedido (${order.totalCents}).`);
  }
  if (order.customerPaymentStatus === "PAID") return { changed: false as const, status: order.status };

  if (order.status === "CANCELED") {
    // Pagamento aprovado depois da expiração/cancelamento: não reabre o pedido; sinaliza para tratamento manual (estorno ou reativação).
    await db.insert(orderEvents).values({ id: newId("evt"), orderId, type: "PAID_AFTER_CANCEL", message: `Pagamento ${info.reference} aprovado após o cancelamento do pedido. Requer estorno ou nova venda.`, actorRole: SYSTEM_ACTOR });
    await db.insert(activities).values({ id: newId("act"), scope: "STORE", supplierId: order.supplierId, storeId: order.storeId, type: "PAID_AFTER_CANCEL", message: `Atenção: pedido #${order.number} foi pago após cancelado (${info.reference})` });
    return { changed: false as const, status: order.status };
  }

  const result = await db.transaction(async (tx) => {
    await tx.update(orders).set({ customerPaymentStatus: "PAID", paymentProvider: info.provider, paymentReference: info.reference, reservationExpiresAt: null, updatedAt: new Date().toISOString() }).where(eq(orders.id, orderId));
    const next = resolveFulfillmentStatus({ ...order, customerPaymentStatus: "PAID" });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CUSTOMER_PAID", message: `Pagamento do cliente aprovado (${info.provider === "MERCADO_PAGO" ? "Mercado Pago" : "demonstração"} · ${info.reference}).`, actorRole: SYSTEM_ACTOR });
    if (next !== order.status) {
      await tx.update(orders).set({ status: next }).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: `STATUS_${next}`, message: statusMessage(next, await isIndependentStore(tx as unknown as Database, order.storeId)), actorRole: SYSTEM_ACTOR });
    }
    await emitEvent(tx as unknown as Database, { type: "PAYMENT_APPROVED", storeId: order.storeId, supplierId: order.supplierId, payload: { orderId, totalCents: order.totalCents, provider: info.provider }, dedupeKey: `PAYMENT_APPROVED:${orderId}` });
    await tx.insert(activities).values([
      { id: newId("act"), scope: "STORE", supplierId: order.supplierId, storeId: order.storeId, type: "CUSTOMER_PAID", message: `Pedido #${order.number} pago pelo cliente` },
      { id: newId("act"), scope: "SUPPLIER", supplierId: order.supplierId, storeId: order.storeId, type: "CUSTOMER_PAID", message: `Pedido #${order.number} de ${order.customerName} foi pago` },
    ]);
    await tryDebitOrder(tx, orderId);
    const fresh = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    return { changed: true as const, status: fresh!.status };
  });
  await emailOrderCustomer(db, orderId, "PAID");
  await applyTrialMilestone(db, order.storeId, "FIRST_SALE");
  return result;
}

/**
 * Cancela pedidos não pagos cuja reserva expirou e devolve o estoque.
 * Seguro para rodar em paralelo/repetido: só age em PENDING + cliente não pago.
 */
export async function expireStaleReservations(db: Database, now = new Date()): Promise<{ expired: number }> {
  const stale = await db.select().from(orders).where(and(eq(orders.status, "PENDING"), eq(orders.customerPaymentStatus, "PENDING"), lt(orders.reservationExpiresAt, now.toISOString())));
  let expired = 0;
  for (const order of stale) {
    await db.transaction(async (tx) => {
      const fresh = await tx.query.orders.findFirst({ where: eq(orders.id, order.id) });
      if (!fresh || fresh.status !== "PENDING" || fresh.customerPaymentStatus !== "PENDING") return;
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const [variantId, quantity] of await expandReservations(tx, items)) await releaseStock(tx, variantId, quantity, { referenceType: "ORDER", referenceId: order.id, note: "Reserva expirada" });
      await releaseDiscount(tx, order.discountId);
      await tx.update(orders).set({ status: "CANCELED", reservationExpiresAt: null, updatedAt: new Date().toISOString() }).where(eq(orders.id, order.id));
      await emitEvent(tx as unknown as Database, { type: "ORDER_CANCELED", storeId: order.storeId, supplierId: order.supplierId, payload: { orderId: order.id, reason: "RESERVATION_EXPIRED" }, dedupeKey: `ORDER_CANCELED:${order.id}` });
      await tx.insert(orderEvents).values({ id: newId("evt"), orderId: order.id, type: "RESERVATION_EXPIRED", message: "Pagamento não realizado a tempo. Pedido cancelado e estoque liberado.", actorRole: SYSTEM_ACTOR });
      expired++;
    });
  }
  return { expired };
}

/** Cancela um pedido por decisão do sistema (ex.: falha ao criar a cobrança), liberando o estoque reservado. */
export async function cancelOrderBySystem(db: Database, orderId: string, reason: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || !CANCELABLE.includes(order.status)) return;
  await db.transaction(async (tx) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const [variantId, quantity] of await expandReservations(tx, items)) await releaseStock(tx, variantId, quantity, { referenceType: "ORDER", referenceId: orderId, note: reason });
    if (order.customerPaymentStatus !== "PAID") await releaseDiscount(tx, order.discountId);
    await tx.update(orders).set({ status: "CANCELED", reservationExpiresAt: null, updatedAt: new Date().toISOString() }).where(eq(orders.id, orderId));
    await emitEvent(tx as unknown as Database, { type: "ORDER_CANCELED", storeId: order.storeId, supplierId: order.supplierId, payload: { orderId, reason: "SYSTEM" }, dedupeKey: `ORDER_CANCELED:${orderId}` });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "STATUS_CANCELED", message: `Pedido cancelado: ${reason}`, actorRole: SYSTEM_ACTOR });
  });
}
