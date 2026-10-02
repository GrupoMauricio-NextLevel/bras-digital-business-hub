import { and, count, desc, eq, isNull, ne, sum } from "drizzle-orm";
import { getDb } from "@/db/client";
import { financeOverview, periodOf } from "@/lib/domain/finance";
import { supplierContracts } from "@/db/schema";
import { activities, invoices, networks, orders, organizations, plans, products, serviceLeads, services, stores, subscriptions, suppliers, themes, users } from "@/db/schema";

export async function getPlatformOverview() {
  const db = (await getDb());
  const [supplierCount] = await db.select({ n: count() }).from(suppliers).where(eq(suppliers.hidden, false));
  const storeRows = await db.select({ status: stores.status, n: count() }).from(stores).where(isNull(stores.showcaseTheme)).groupBy(stores.status);
  const [orderStats] = await db.select({ n: count(), gmv: sum(orders.totalCents) }).from(orders).where(ne(orders.status, "CANCELED"));
  const fin = await financeOverview(db, periodOf(new Date()));
  const recent = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(10);
  const byStatus = Object.fromEntries(storeRows.map((r) => [r.status, r.n]));
  const gmv = Number(orderStats?.gmv ?? 0);
  const feeRevenue = fin.estimatedVolumeFees;
  return {
    suppliers: supplierCount?.n ?? 0,
    stores: storeRows.reduce((s, r) => s + r.n, 0),
    activeStores: byStatus.ACTIVE ?? 0,
    suspendedStores: byStatus.SUSPENDED ?? 0,
    orders: orderStats?.n ?? 0,
    gmv,
    platformRevenue: fin.mrr.total + feeRevenue,
    feeRevenue,
    subscriptionRevenue: fin.mrr.total,
    recent,
  };
}

export async function listSuppliers() {
  const db = (await getDb());
  const rows = await db.select().from(suppliers).where(eq(suppliers.hidden, false));
  const storeCounts = await db.select({ supplierId: networks.supplierId, n: count(stores.id) }).from(networks).leftJoin(stores, eq(stores.networkId, networks.id)).groupBy(networks.supplierId);
  const productCounts = await db.select({ supplierId: products.supplierId, n: count() }).from(products).groupBy(products.supplierId);
  const gmv = await db.select({ supplierId: orders.supplierId, total: sum(orders.totalCents) }).from(orders).where(ne(orders.status, "CANCELED")).groupBy(orders.supplierId);
  const contracts = await db.select().from(supplierContracts);
  return rows.map((s) => ({
    ...s,
    contract: contracts.find((c) => c.supplierId === s.id) ?? null,
    storeCount: storeCounts.find((c) => c.supplierId === s.id)?.n ?? 0,
    productCount: productCounts.find((c) => c.supplierId === s.id)?.n ?? 0,
    gmv: Number(gmv.find((g) => g.supplierId === s.id)?.total ?? 0),
  }));
}

export async function listNetworks() {
  const db = (await getDb());
  return db
    .select({ network: networks, supplierName: suppliers.name, storeCount: count(stores.id) })
    .from(networks)
    .innerJoin(suppliers, eq(suppliers.id, networks.supplierId))
    .leftJoin(stores, eq(stores.networkId, networks.id))
    .groupBy(networks.id, suppliers.name);
}

export async function listStoresWithPlan(filter: { q?: string; status?: string; offer?: string; marca?: string } = {}) {
  const db = (await getDb());
  const rows = await db
    .select({ store: stores, brand: organizations.brand, networkName: networks.name, supplierName: suppliers.name, planName: plans.name, subscriptionStatus: subscriptions.status, periodEnd: subscriptions.currentPeriodEnd })
    .from(stores)
    .innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .innerJoin(networks, eq(networks.id, stores.networkId))
    .innerJoin(suppliers, eq(suppliers.id, networks.supplierId))
    .leftJoin(subscriptions, eq(subscriptions.storeId, stores.id))
    .leftJoin(plans, eq(plans.id, subscriptions.planId))
    .where(and(isNull(stores.showcaseTheme), filter.status ? eq(stores.status, filter.status as "ACTIVE") : undefined, filter.offer ? eq(stores.offer, filter.offer as "DROP_MANUAL") : undefined, filter.marca ? eq(organizations.brand, filter.marca as "SUPERDROP") : undefined))
    .orderBy(stores.name);
  const orderCounts = await db.select({ storeId: orders.storeId, n: count(), total: sum(orders.totalCents) }).from(orders).where(ne(orders.status, "CANCELED")).groupBy(orders.storeId);
  const q = filter.q?.toLowerCase();
  return rows
    .filter((r) => !q || r.store.name.toLowerCase().includes(q) || r.store.slug.includes(q))
    .map((r) => ({ ...r, orderCount: orderCounts.find((o) => o.storeId === r.store.id)?.n ?? 0, gmv: Number(orderCounts.find((o) => o.storeId === r.store.id)?.total ?? 0) }));
}

export async function listAllProducts() {
  const db = (await getDb());
  return db.select({ product: products, supplierName: suppliers.name }).from(products).innerJoin(suppliers, eq(suppliers.id, products.supplierId)).orderBy(products.name);
}

export async function listThemes() {
  const db = (await getDb());
  return db.select().from(themes).orderBy(themes.priceCents);
}

export async function listServicesWithLeads() {
  const db = (await getDb());
  const svc = await db.select().from(services);
  const leads = await db.select({ lead: serviceLeads, storeName: stores.name, serviceName: services.name }).from(serviceLeads).innerJoin(stores, eq(stores.id, serviceLeads.storeId)).innerJoin(services, eq(services.id, serviceLeads.serviceId)).orderBy(desc(serviceLeads.createdAt));
  return { services: svc, leads };
}

export async function listPlansWithSubs() {
  const db = (await getDb());
  const p = await db.select().from(plans).orderBy(plans.priceCents);
  const subs = await db.select({ sub: subscriptions, storeName: stores.name, planName: plans.name, planPrice: plans.priceCents }).from(subscriptions).innerJoin(stores, eq(stores.id, subscriptions.storeId)).innerJoin(plans, eq(plans.id, subscriptions.planId));
  const inv = await db.select({ status: invoices.status, n: count(), total: sum(invoices.amountCents) }).from(invoices).groupBy(invoices.status);
  return { plans: p, subs, invoices: inv };
}

export async function listUsers() {
  const db = (await getDb());
  return db.select().from(users);
}

