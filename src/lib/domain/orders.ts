import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, customers, orderEvents, orderItems, orders, storeCustomers, stores, networks, marketingConsents, type OrderStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { assertCanAccess, type Actor } from "./access";
import { listStoreCatalog } from "./catalog";
import { consumeReservation, releaseStock, reserveStock } from "./inventory";
import { CANCELABLE, canTransition, resolveFulfillmentStatus } from "./order-status";

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
  }).default({ costCents: 0 }),
  items: z.array(orderLineSchema).min(1, "Adicione ao menos um item"),
  customerPaymentStatus: z.enum(["PENDING", "PAID"]).default("PENDING"),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;

type Reservation = { variantId: string; quantity: number };

/**
 * Cria um pedido usando o catálogo/estoque central. Reserva estoque de cada
 * variante (packs expandem para suas variantes). Falha antes de gravar se
 * qualquer item não tiver estoque disponível.
 */
export async function createOrder(db: Database, rawInput: CreateOrderInput) {
  const input = createOrderSchema.parse(rawInput);
  const store = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  if (store.status !== "ACTIVE") throw new DomainError("STORE_INACTIVE", "Loja não está ativa.");
  const network = await db.query.networks.findFirst({ where: eq(networks.id, store.networkId) });
  if (!network) throw new NotFoundError("Rede não encontrada.");

  const catalog = await listStoreCatalog(db, store.id);
  const byProduct = new Map(catalog.map((c) => [c.product.id, c]));

  const lines: (typeof orderItems.$inferInsert)[] = [];
  const reservations: Reservation[] = [];
  const orderId = newId("ord");

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
      const unitPrice = item.storeProduct.priceCents;
      reservations.push({ variantId: variant.id, quantity: line.quantity });
      lines.push({ id: newId("oi"), orderId, productId: item.product.id, variantId: variant.id, productName: item.product.name, label: `Tam. ${variant.size}`, quantity: line.quantity, unitPriceCents: unitPrice, unitCostCents: item.product.costCents, lineTotalCents: unitPrice * line.quantity });
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const costTotal = lines.reduce((s, l) => s + l.unitCostCents * l.quantity, 0);
  const total = subtotal + input.shipping.costCents;

  // Consolida reservas por variante para validar disponibilidade agregada.
  const merged = new Map<string, number>();
  for (const r of reservations) merged.set(r.variantId, (merged.get(r.variantId) ?? 0) + r.quantity);

  return db.transaction(async (tx) => {
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
      supplierId: network.supplierId,
      storeCustomerId,
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
      subtotalCents: subtotal,
      shippingCents: input.shipping.costCents,
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
      { id: newId("act"), scope: "STORE", storeId: store.id, supplierId: network.supplierId, type: "ORDER_CREATED", message: `Novo pedido #${nextNumber} de ${input.customer.name}` },
      { id: newId("act"), scope: "SUPPLIER", storeId: store.id, supplierId: network.supplierId, type: "ORDER_CREATED", message: `${store.name} recebeu o pedido #${nextNumber}` },
    ]);

    return { orderId, number: nextNumber, status, totalCents: total };
  });
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
  return { order, items, events, store };
}

export async function listOrdersForActor(db: Database, actor: Actor, opts: { status?: OrderStatus; limit?: number } = {}) {
  const scope =
    actor.role === "STORE_OWNER" ? eq(orders.storeId, actor.storeId ?? "__none__") : actor.role === "SUPPLIER_ADMIN" ? eq(orders.supplierId, actor.supplierId ?? "__none__") : undefined;
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

/** Lojista confirma o pagamento do custo dos produtos à Central (demonstração). */
export async function confirmCentralPayment(db: Database, actor: Actor, orderId: string) {
  const order = await loadOwned(db, actor, orderId);
  if (order.status === "CANCELED") throw new DomainError("ORDER_CANCELED", "Pedido cancelado.");
  if (order.centralPaymentStatus === "PAID") return order;
  return db.transaction(async (tx) => {
    await tx.update(orders).set({ centralPaymentStatus: "PAID" }).where(eq(orders.id, orderId));
    const next = resolveFulfillmentStatus({ ...order, centralPaymentStatus: "PAID" });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CENTRAL_PAID", message: "Pagamento à Central confirmado.", actorRole: actor.role });
    if (next !== order.status) await applyStatus(tx, order, next, statusMessage(next), actor);
    await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId: order.supplierId, storeId: order.storeId, type: "CENTRAL_PAID", message: `Pedido #${order.number} pago à Central` });
    return { ...order, centralPaymentStatus: "PAID" as const, status: next };
  });
}

/** Lojista confirma que o cliente pagou (vendas manuais). */
export async function confirmCustomerPayment(db: Database, actor: Actor, orderId: string) {
  const order = await loadOwned(db, actor, orderId);
  if (order.status === "CANCELED") throw new DomainError("ORDER_CANCELED", "Pedido cancelado.");
  if (order.customerPaymentStatus === "PAID") return order;
  return db.transaction(async (tx) => {
    await tx.update(orders).set({ customerPaymentStatus: "PAID" }).where(eq(orders.id, orderId));
    const next = resolveFulfillmentStatus({ ...order, customerPaymentStatus: "PAID" });
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "CUSTOMER_PAID", message: "Pagamento do cliente confirmado.", actorRole: actor.role });
    if (next !== order.status) await applyStatus(tx, order, next, statusMessage(next), actor);
    return { ...order, customerPaymentStatus: "PAID" as const, status: next };
  });
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
    if (next !== order.status) await applyStatus(tx, order, next, statusMessage(next), actor);
    if (next === "READY_TO_PICK") {
      await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId: order.supplierId, storeId: order.storeId, type: "READY_TO_PICK", message: `Pedido #${order.number} pronto para separação` });
    }
    return { ...order, shippingLabelStatus: "READY" as const, status: next };
  });
}

/** Avanço operacional (fornecedor/expedição). */
export async function advanceOrder(db: Database, actor: Actor, orderId: string, next: OrderStatus) {
  const order = await loadOwned(db, actor, orderId);
  if (!canTransition(order.status, next)) throw new DomainError("INVALID_TRANSITION", `Transição ${order.status} → ${next} não permitida.`);
  if (next === "CANCELED") return cancelOrder(db, actor, orderId);
  if (next === "READY_TO_PICK" && (order.centralPaymentStatus !== "PAID" || order.shippingLabelStatus !== "READY")) {
    throw new DomainError("NOT_READY", "Pedido só fica pronto para separação com pagamento à Central e etiqueta.");
  }
  return db.transaction(async (tx) => {
    if (next === "SHIPPED") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      const merged = await expandReservations(tx, items);
      for (const [variantId, quantity] of merged) await consumeReservation(tx, variantId, quantity, { referenceType: "ORDER", referenceId: orderId });
    }
    await applyStatus(tx, order, next, statusMessage(next), actor);
    await tx.insert(activities).values({ id: newId("act"), scope: "STORE", supplierId: order.supplierId, storeId: order.storeId, type: `STATUS_${next}`, message: `Pedido #${order.number}: ${statusMessage(next)}` });
    return { ...order, status: next };
  });
}

export async function cancelOrder(db: Database, actor: Actor, orderId: string) {
  const order = await loadOwned(db, actor, orderId);
  if (!CANCELABLE.includes(order.status)) throw new DomainError("INVALID_TRANSITION", "Pedido não pode mais ser cancelado.");
  return db.transaction(async (tx) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const merged = await expandReservations(tx, items);
    for (const [variantId, quantity] of merged) await releaseStock(tx, variantId, quantity, { referenceType: "ORDER", referenceId: orderId });
    await applyStatus(tx, order, "CANCELED", "Pedido cancelado. Reserva de estoque liberada.", actor);
    return { ...order, status: "CANCELED" as const };
  });
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

function statusMessage(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING: "Aguardando pagamento do cliente.",
    AWAITING_CENTRAL_PAYMENT: "Aguardando pagamento do lojista à Central.",
    AWAITING_LABEL: "Aguardando etiqueta de envio.",
    READY_TO_PICK: "Pronto para separação na Central.",
    PICKING: "Separação iniciada.",
    READY_TO_SHIP: "Separação concluída. Pronto para envio.",
    SHIPPED: "Pedido enviado. Estoque baixado.",
    DELIVERED: "Pedido entregue.",
    CANCELED: "Pedido cancelado.",
  };
  return map[s];
}
