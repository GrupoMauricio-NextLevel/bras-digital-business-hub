import { and, count, desc, eq, inArray, ne, sum } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activities, contentItems, inventory, inventoryMovements, networks, orders, productPackItems, productPacks, productStoreAccess, productVariants, products, storeProducts, stores, categories } from "@/db/schema";
import { listSupplierCatalog } from "@/lib/domain/catalog";

export async function getSupplierOverview(supplierId: string) {
  const db = (await getDb());
  const [sales] = await db.select({ n: count(), total: sum(orders.totalCents), cost: sum(orders.costTotalCents) }).from(orders).where(and(eq(orders.supplierId, supplierId), ne(orders.status, "CANCELED")));
  const statusRows = await db.select({ status: orders.status, n: count() }).from(orders).where(eq(orders.supplierId, supplierId)).groupBy(orders.status);
  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.n])) as Record<string, number>;
  const storeRows = await db.select({ status: stores.status, n: count() }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(networks.supplierId, supplierId)).groupBy(stores.status);
  const [productCount] = await db.select({ n: count() }).from(products).where(eq(products.supplierId, supplierId));
  const [stock] = await db.select({ onHand: sum(inventory.onHand), reserved: sum(inventory.reserved) }).from(inventory).innerJoin(productVariants, eq(productVariants.id, inventory.variantId)).innerJoin(products, eq(products.id, productVariants.productId)).where(eq(products.supplierId, supplierId));
  const recent = await db.select().from(activities).where(and(eq(activities.supplierId, supplierId), eq(activities.scope, "SUPPLIER"))).orderBy(desc(activities.createdAt)).limit(8);
  const awaiting = (byStatus.AWAITING_CENTRAL_PAYMENT ?? 0) + (byStatus.AWAITING_LABEL ?? 0) + (byStatus.PENDING ?? 0);
  const readyToShip = (byStatus.READY_TO_PICK ?? 0) + (byStatus.PICKING ?? 0) + (byStatus.READY_TO_SHIP ?? 0);
  const onHand = Number(stock?.onHand ?? 0);
  const reserved = Number(stock?.reserved ?? 0);
  return {
    ordersCount: sales?.n ?? 0,
    salesCents: Number(sales?.total ?? 0),
    costCents: Number(sales?.cost ?? 0),
    byStatus,
    stores: storeRows.reduce((s, r) => s + r.n, 0),
    activeStores: storeRows.find((r) => r.status === "ACTIVE")?.n ?? 0,
    products: productCount?.n ?? 0,
    onHand,
    reserved,
    available: Math.max(0, onHand - reserved),
    awaiting,
    readyToShip,
    recent,
  };
}

export async function getSupplierProducts(supplierId: string, filter: { q?: string; category?: string } = {}) {
  const db = (await getDb());
  const rows = await listSupplierCatalog(db, supplierId);
  const cats = await db.select().from(categories).where(eq(categories.supplierId, supplierId));
  const catById = new Map(cats.map((c) => [c.id, c.name]));
  const q = filter.q?.toLowerCase();
  return {
    categories: cats,
    items: rows
      .map((r) => ({ ...r, categoryName: r.product.categoryId ? catById.get(r.product.categoryId) ?? "" : "" }))
      .filter((r) => (!q || r.product.name.toLowerCase().includes(q) || r.product.sku.toLowerCase().includes(q)) && (!filter.category || r.product.categoryId === filter.category)),
  };
}

export async function getSupplierProduct(supplierId: string, productId: string) {
  const db = (await getDb());
  const product = await db.query.products.findFirst({ where: and(eq(products.id, productId), eq(products.supplierId, supplierId)) });
  if (!product) return null;
  const variants = await db.select({ variant: productVariants, inv: inventory }).from(productVariants).leftJoin(inventory, eq(inventory.variantId, productVariants.id)).where(eq(productVariants.productId, productId)).orderBy(productVariants.position);
  const packs = await db.select().from(productPacks).where(eq(productPacks.productId, productId));
  const packItems = packs.length ? await db.select().from(productPackItems).where(inArray(productPackItems.packId, packs.map((p) => p.id))) : [];
  const access = await db.select({ storeId: productStoreAccess.storeId }).from(productStoreAccess).where(eq(productStoreAccess.productId, productId));
  const networkStores = await db.select({ id: stores.id, name: stores.name, slug: stores.slug, status: stores.status }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(networks.supplierId, supplierId));
  const listings = await db.select().from(storeProducts).where(eq(storeProducts.productId, productId));
  const movements = await db.select({ m: inventoryMovements, size: productVariants.size }).from(inventoryMovements).innerJoin(productVariants, eq(productVariants.id, inventoryMovements.variantId)).where(eq(productVariants.productId, productId)).orderBy(desc(inventoryMovements.createdAt)).limit(15);
  const category = product.categoryId ? await db.query.categories.findFirst({ where: eq(categories.id, product.categoryId) }) : null;
  return {
    product,
    category,
    variants: variants.map((v) => ({ ...v.variant, onHand: v.inv?.onHand ?? 0, reserved: v.inv?.reserved ?? 0, available: Math.max(0, (v.inv?.onHand ?? 0) - (v.inv?.reserved ?? 0)) })),
    packs: packs.map((p) => ({ ...p, items: packItems.filter((i) => i.packId === p.id).map((i) => { const v = variants.find((x) => x.variant.id === i.variantId); return { ...i, size: v?.variant.size ?? "?", position: v?.variant.position ?? 0 }; }).sort((a, b) => a.position - b.position) })),
    accessStoreIds: access.map((a) => a.storeId),
    networkStores,
    listings,
    movements,
  };
}

export async function getSupplierInventory(supplierId: string) {
  const db = (await getDb());
  const rows = await db
    .select({ variant: productVariants, product: products, inv: inventory })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(products.supplierId, supplierId))
    .orderBy(products.name, productVariants.position);
  return rows.map((r) => {
    const onHand = r.inv?.onHand ?? 0;
    const reserved = r.inv?.reserved ?? 0;
    return { ...r, onHand, reserved, available: Math.max(0, onHand - reserved) };
  });
}

export async function getSupplierStores(supplierId: string) {
  const db = (await getDb());
  const rows = await db.select({ store: stores, networkName: networks.name }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(eq(networks.supplierId, supplierId)).orderBy(stores.name);
  const stats = await db.select({ storeId: orders.storeId, n: count(), total: sum(orders.totalCents), cost: sum(orders.costTotalCents) }).from(orders).where(and(eq(orders.supplierId, supplierId), ne(orders.status, "CANCELED"))).groupBy(orders.storeId);
  const listings = await db.select({ storeId: storeProducts.storeId, n: count() }).from(storeProducts).where(eq(storeProducts.active, true)).groupBy(storeProducts.storeId);
  return rows.map((r) => {
    const st = stats.find((s) => s.storeId === r.store.id);
    return { ...r, orders: st?.n ?? 0, gmv: Number(st?.total ?? 0), cost: Number(st?.cost ?? 0), products: listings.find((l) => l.storeId === r.store.id)?.n ?? 0 };
  });
}

export async function getSupplierContent(supplierId: string) {
  const db = (await getDb());
  return db.select().from(contentItems).where(eq(contentItems.supplierId, supplierId));
}

export async function getSupplierFinance(supplierId: string) {
  const db = (await getDb());
  const rows = await db.select({ order: orders, storeName: stores.name }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(and(eq(orders.supplierId, supplierId), ne(orders.status, "CANCELED"))).orderBy(desc(orders.createdAt));
  const received = rows.filter((r) => r.order.centralPaymentStatus === "PAID").reduce((s, r) => s + r.order.costTotalCents, 0);
  const pending = rows.filter((r) => r.order.centralPaymentStatus !== "PAID").reduce((s, r) => s + r.order.costTotalCents, 0);
  const gmv = rows.reduce((s, r) => s + r.order.totalCents, 0);
  return { rows, received, pending, gmv };
}
