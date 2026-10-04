import { and, eq, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { activities, customers, marketingConsents, orderItems, orders, products, storeCustomers, storeProducts } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ForbiddenError, NotFoundError } from "./errors";
import { assertStoreAdmin, type Actor } from "./access";
import { csvCell } from "./crm";

/**
 * Privacidade e exportação (Constituição arts. 21 e 29). Tudo filtrado pela loja do ator; só o dono da loja.
 * A política de retenção (por quanto tempo guardar pedido e nota) é decisão do dono e jurídica: aqui só se
 * anonimiza o que a lei não exige guardar e se preserva o registro financeiro do pedido.
 */
function ownerStore(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Só o dono da loja pode exportar ou excluir dados.");
  assertStoreAdmin(actor);
  return actor.storeId;
}

const toCsv = (header: string[], rows: string[][]) => [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n") + "\n";
const audit = (db: Database, storeId: string, type: string, message: string) => db.insert(activities).values({ id: newId("act"), scope: "STORE", storeId, type, message });

export async function exportStoreCsv(db: Database, actor: Actor, kind: "orders" | "products" | "customers"): Promise<string> {
  const storeId = ownerStore(actor);
  let csv: string;
  if (kind === "orders") {
    const rows = await db.select().from(orders).where(eq(orders.storeId, storeId));
    csv = toCsv(["numero", "data", "status", "pagamento", "cliente", "email", "telefone", "total_centavos"], rows.map((o) => [String(o.number), o.createdAt, o.status, o.customerPaymentStatus, o.customerName, o.customerEmail, o.customerPhone ?? "", String(o.totalCents)]));
  } else if (kind === "products") {
    const rows = await db.select({ name: products.name, sku: products.sku, price: storeProducts.priceCents, active: storeProducts.active }).from(storeProducts).innerJoin(products, eq(products.id, storeProducts.productId)).where(eq(storeProducts.storeId, storeId));
    csv = toCsv(["nome", "sku", "preco_centavos", "ativo"], rows.map((p) => [p.name, p.sku, String(p.price), p.active ? "sim" : "nao"]));
  } else {
    const rows = await db.select({ sc: storeCustomers, c: customers }).from(storeCustomers).innerJoin(customers, eq(customers.id, storeCustomers.customerId)).where(eq(storeCustomers.storeId, storeId));
    csv = toCsv(["nome", "email", "telefone", "pedidos", "total_gasto_centavos", "etiquetas"], rows.map((r) => [r.c.name, r.c.email, r.c.phone ?? "", String(r.sc.ordersCount), String(r.sc.totalSpentCents), r.sc.tags.join(" ")]));
  }
  await audit(db, storeId, "DATA_EXPORT", `Exportação de ${kind === "orders" ? "pedidos" : kind === "products" ? "produtos" : "clientes"} em CSV.`);
  return csv;
}

async function loadOwn(db: Database, storeId: string, storeCustomerId: string) {
  const sc = await db.query.storeCustomers.findFirst({ where: and(eq(storeCustomers.id, storeCustomerId), eq(storeCustomers.storeId, storeId)) });
  if (!sc) throw new NotFoundError("Cliente não encontrado nesta loja.");
  return sc;
}

/** Todos os dados de UM cliente nesta loja (direito de acesso do titular). */
export async function exportCustomerData(db: Database, actor: Actor, storeCustomerId: string) {
  const storeId = ownerStore(actor);
  const sc = await loadOwn(db, storeId, storeCustomerId);
  const customer = (await db.query.customers.findFirst({ where: eq(customers.id, sc.customerId) }))!;
  const consents = await db.select().from(marketingConsents).where(eq(marketingConsents.storeCustomerId, sc.id));
  const orderRows = await db.select().from(orders).where(and(eq(orders.storeId, storeId), eq(orders.storeCustomerId, sc.id)));
  const items: (typeof orderItems.$inferSelect)[] = [];
  for (const o of orderRows) items.push(...(await db.select().from(orderItems).where(eq(orderItems.orderId, o.id))));
  await audit(db, storeId, "DATA_EXPORT", "Exportação dos dados de um cliente.");
  return { customer: { name: customer.name, email: customer.email, phone: customer.phone, createdAt: customer.createdAt }, notes: sc.notes, tags: sc.tags, consents, orders: orderRows.map((o) => ({ number: o.number, createdAt: o.createdAt, status: o.status, totalCents: o.totalCents, shippingAddress: o.shippingAddress, shippingCity: o.shippingCity, shippingState: o.shippingState, shippingZip: o.shippingZip, items: items.filter((i) => i.orderId === o.id).map((i) => ({ productName: i.productName, label: i.label, quantity: i.quantity, lineTotalCents: i.lineTotalCents })) })) };
}

/**
 * Exclusão de UM cliente nesta loja: remove identificação (nome, e-mail, telefone, endereço, anotações, consentimentos)
 * e mantém o pedido com valores, itens e datas (registro financeiro). A pessoa em outra loja não é afetada.
 */
export async function anonymizeCustomer(db: Database, actor: Actor, storeCustomerId: string) {
  const storeId = ownerStore(actor);
  const sc = await loadOwn(db, storeId, storeCustomerId);
  const tag = sc.id.slice(-8);
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ customerName: "Cliente removido", customerEmail: `removido-${tag}@anonimo.invalid`, customerPhone: null, shippingAddress: null, shippingCity: null, shippingState: null, shippingZip: null, updatedAt: now }).where(and(eq(orders.storeId, storeId), eq(orders.storeCustomerId, sc.id)));
    await tx.delete(marketingConsents).where(eq(marketingConsents.storeCustomerId, sc.id));
    await tx.update(storeCustomers).set({ notes: null, tags: [] }).where(eq(storeCustomers.id, sc.id));
    const others = await tx.select({ id: storeCustomers.id }).from(storeCustomers).where(and(eq(storeCustomers.customerId, sc.customerId), ne(storeCustomers.id, sc.id))).limit(1);
    if (!others.length) await tx.update(customers).set({ name: "Cliente removido", email: `removido-${tag}@anonimo.invalid`, phone: null }).where(eq(customers.id, sc.customerId));
    await audit(tx as unknown as Database, storeId, "CUSTOMER_ANONYMIZED", "Dados pessoais de um cliente foram removidos a pedido do titular.");
  });
}
