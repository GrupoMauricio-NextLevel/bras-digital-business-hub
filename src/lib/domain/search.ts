import { and, desc, eq, ilike, ne, or } from "drizzle-orm";
import type { Database } from "@/db/client";
import { networks, orders, products, storeCustomers, customers, stores, suppliers } from "@/db/schema";
import type { Actor } from "./access";

export type SearchHit = { id: string; kind: "order" | "store" | "product" | "supplier" | "customer" | "peca" | "oportunidade"; title: string; subtitle: string; href: string };

const like = (q: string) => `%${q.replace(/[%_]/g, "")}%`;

/**
 * Busca global com escopo do ator. Resultados nunca cruzam tenants e não incluem valores monetários.
 */
export async function globalSearch(db: Database, actor: Actor, raw: string, limit = 6): Promise<SearchHit[]> {
  const q = raw.trim();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  const num = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;

  const orderWhere = (scope: ReturnType<typeof eq> | undefined) => and(scope, or(num !== null ? eq(orders.number, num) : undefined, ilike(orders.customerName, like(q))));

  if (actor.role === "NEXTLEVEL_MASTER") {
    const base = "/master";
    const o = await db.select({ id: orders.id, number: orders.number, name: orders.customerName, store: stores.name }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(orderWhere(undefined)).orderBy(desc(orders.createdAt)).limit(limit);
    hits.push(...o.map((r) => ({ id: r.id, kind: "order" as const, title: `Pedido #${r.number}`, subtitle: `${r.store} · ${r.name}`, href: `${base}/orders/${r.id}` })));
    const s = await db.select({ id: stores.id, name: stores.name, slug: stores.slug }).from(stores).where(or(ilike(stores.name, like(q)), ilike(stores.slug, like(q)))).limit(limit);
    hits.push(...s.map((r) => ({ id: r.id, kind: "store" as const, title: r.name, subtitle: `Loja · /store/${r.slug}`, href: `${base}/stores?q=${encodeURIComponent(r.name)}` })));
    const f = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(ilike(suppliers.name, like(q))).limit(limit);
    hits.push(...f.map((r) => ({ id: r.id, kind: "supplier" as const, title: r.name, subtitle: "Fornecedor", href: `${base}/finance?tab=contracts` })));
  } else if (actor.role === "SUPPLIER_ADMIN" && actor.supplierId) {
    const base = "/supplier";
    const o = await db.select({ id: orders.id, number: orders.number, name: orders.customerName, store: stores.name }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(orderWhere(eq(orders.supplierId, actor.supplierId))).orderBy(desc(orders.createdAt)).limit(limit);
    hits.push(...o.map((r) => ({ id: r.id, kind: "order" as const, title: `Pedido #${r.number}`, subtitle: `${r.store} · ${r.name}`, href: `${base}/orders/${r.id}` })));
    const s = await db.select({ id: stores.id, name: stores.name }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(and(eq(networks.supplierId, actor.supplierId), ilike(stores.name, like(q)))).limit(limit);
    hits.push(...s.map((r) => ({ id: r.id, kind: "store" as const, title: r.name, subtitle: "Lojista da rede", href: `${base}/stores` })));
    const p = await db.select({ id: products.id, name: products.name, sku: products.sku }).from(products).where(and(eq(products.supplierId, actor.supplierId), ne(products.status, "DELETED"), or(ilike(products.name, like(q)), ilike(products.sku, like(q))))).limit(limit);
    hits.push(...p.map((r) => ({ id: r.id, kind: "product" as const, title: r.name, subtitle: `SKU ${r.sku}`, href: `${base}/products/${r.id}` })));
  } else if (actor.role === "STORE_OWNER" && actor.storeId) {
    const base = "/merchant";
    const o = await db.select({ id: orders.id, number: orders.number, name: orders.customerName }).from(orders).where(orderWhere(eq(orders.storeId, actor.storeId))).orderBy(desc(orders.createdAt)).limit(limit);
    hits.push(...o.map((r) => ({ id: r.id, kind: "order" as const, title: `Pedido #${r.number}`, subtitle: r.name, href: `${base}/orders/${r.id}` })));
    const c = await db.select({ id: storeCustomers.id, name: customers.name, email: customers.email }).from(storeCustomers).innerJoin(customers, eq(customers.id, storeCustomers.customerId)).where(and(eq(storeCustomers.storeId, actor.storeId), or(ilike(customers.name, like(q)), ilike(customers.email, like(q))))).limit(limit);
    hits.push(...c.map((r) => ({ id: r.id, kind: "customer" as const, title: r.name, subtitle: r.email, href: `${base}/customers` })));
  } else if (actor.role === "AGENCY") {
    // Painel da Agência (D317): clientes e peças que a pessoa pode ver; oportunidades do CRM para quem vê a carteira.
    const { buscarNaAgencia } = await import("@/lib/agencias/producao");
    hits.push(...(await buscarNaAgencia(db, actor, q, limit)));
  }
  return hits.slice(0, limit * 3);
}

