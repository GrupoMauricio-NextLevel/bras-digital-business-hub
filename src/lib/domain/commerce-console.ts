import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { brandLeads, financeInvoices, orders, organizations, products, storeProducts, stores } from "@/db/schema";
import { requireMaster, type Actor } from "./access";
import { storeAccess } from "./store-access";

const BRAND = "NEXTLEVEL_COMMERCE" as const;

async function commerceStoreRows(db: Database) {
  return db.select({ store: stores }).from(stores)
    .innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(eq(organizations.brand, BRAND))
    .orderBy(desc(stores.createdAt));
}

export async function getCommerceConsole(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await commerceStoreRows(db);
  const storeIds = rows.map((r) => r.store.id);
  const orderRows = storeIds.length ? await db.select().from(orders).where(inArray(orders.storeId, storeIds)).orderBy(desc(orders.createdAt)) : [];
  const leadRows = await db.select().from(brandLeads).where(eq(brandLeads.brand, BRAND)).orderBy(desc(brandLeads.createdAt));
  const invoices = storeIds.length ? await db.select().from(financeInvoices).where(and(inArray(financeInvoices.storeId, storeIds), eq(financeInvoices.kind, "STORE_PLAN"))).orderBy(desc(financeInvoices.createdAt)) : [];
  const catalogRows = storeIds.length ? await db.select({
    storeId: storeProducts.storeId, productId: products.id, name: products.name, sku: products.sku,
    priceCents: storeProducts.priceCents, active: storeProducts.active, featured: storeProducts.featured,
  }).from(storeProducts).innerJoin(products, eq(products.id, storeProducts.productId)).where(inArray(storeProducts.storeId, storeIds)) : [];

  const paidOrders = orderRows.filter((o) => o.customerPaymentStatus === "PAID" && o.status !== "CANCELED");
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const monthOrders = paidOrders.filter((o) => o.createdAt.slice(0, 7) === month);
  const monthPlans = invoices.filter((i) => i.status === "PAID" && i.paidAt?.slice(0, 7) === month);
  const access = rows.map(({ store }) => ({ store, access: storeAccess(store, now) }));

  return {
    kpis: {
      stores: rows.length,
      published: rows.filter((r) => !!r.store.publishedAt).length,
      paying: access.filter((r) => r.access.state === "PAID").length,
      trial: access.filter((r) => r.access.state === "TRIAL").length,
      blocked: access.filter((r) => r.access.state === "BLOCKED").length,
      salesMonthCents: monthOrders.reduce((sum, o) => sum + o.totalCents, 0),
      ordersMonth: monthOrders.length,
      planRevenueMonthCents: monthPlans.reduce((sum, i) => sum + i.amountCents, 0),
      leadsNew: leadRows.filter((l) => l.status === "NEW").length,
      leadsTotal: leadRows.length,
      activeProducts: catalogRows.filter((p) => p.active).length,
    },
    stores: access,
    orders: orderRows,
    leads: leadRows,
    invoices,
    catalog: catalogRows,
  };
}
