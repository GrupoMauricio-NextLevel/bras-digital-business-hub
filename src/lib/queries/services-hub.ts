import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { networks, orders, products, services, storeProducts, stores, type Service } from "@/db/schema";
import type { Session } from "@/lib/auth";
import { listServiceOrders, recommendServices, type Audience } from "@/lib/domain/services";

export function audienceOf(session: Session): Audience {
  if (session.user.role === "SUPPLIER_ADMIN") return "supplier";
  return session.store?.offer === "STORE_OWN" ? "pro" : "lite";
}

export type HubService = Pick<Service, "id" | "key" | "name" | "description" | "category" | "priceFromCents" | "icon" | "kind" | "deliveryDays" | "highlights" | "featured">;
export type HubOrder = { id: string; serviceName: string; status: string; quotedCents: number | null; createdAt: string };

/** Catálogo do público, recomendações com motivo e pedidos do solicitante. */
export async function getServicesHub(session: Session) {
  const db = await getDb();
  const audience = audienceOf(session);
  const rank = { DROP_MANUAL: 0, STORE_SUBDOMAIN: 1, STORE_OWN: 2 } as const;
  const current = session.store ? rank[session.store.offer] : -1;
  // Upgrade para uma oferta que o lojista já tem (ou abaixo dela) não é oferecido.
  const catalog = (await db.select().from(services).where(eq(services.active, true))).filter((s) => s.audience.includes(audience) && !(s.kind === "UPGRADE" && s.upgradeOffer && rank[s.upgradeOffer] <= current));
  const mine = await listServiceOrders(db, session.actor);
  const requested = new Set(mine.filter((m) => !["DELIVERED", "CANCELED"].includes(m.order.status)).map((m) => m.order.serviceId));
  const requestedKeys = new Set(catalog.filter((c) => requested.has(c.id)).map((c) => c.key));
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  let ctx: Parameters<typeof recommendServices>[0];
  if (audience === "supplier") {
    const supplier = session.supplier!;
    const [{ n: activeProducts = 0 } = { n: 0 }] = await db.select({ n: count() }).from(products).where(and(eq(products.supplierId, supplier.id), eq(products.status, "ACTIVE")));
    const [{ n: networkStores = 0 } = { n: 0 }] = await db.select({ n: count() }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(and(eq(networks.supplierId, supplier.id), eq(stores.status, "ACTIVE")));
    ctx = { audience, ordersLast30: 0, activeProducts, networkStores, requested: requestedKeys };
  } else {
    const store = session.store!;
    const [{ n: ordersLast30 = 0 } = { n: 0 }] = await db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, store.id), gte(orders.createdAt, since)));
    const [{ n: activeProducts = 0 } = { n: 0 }] = await db.select({ n: count() }).from(storeProducts).where(and(eq(storeProducts.storeId, store.id), eq(storeProducts.active, true)));
    ctx = { audience, offer: store.offer, ordersLast30, activeProducts, hasLogo: !!(store.logoText || store.logoUrl), hasCustomDomain: !!store.customDomain, requested: requestedKeys };
  }
  const recommended = recommendServices(ctx, catalog).slice(0, 3).flatMap((r) => { const s = catalog.find((c) => c.key === r.key); return s ? [{ service: s as HubService, reason: r.reason }] : []; });
  const hubOrders: HubOrder[] = mine.map((m) => ({ id: m.order.id, serviceName: m.serviceName, status: m.order.status, quotedCents: m.order.quotedCents, createdAt: m.order.createdAt }));
  return { audience, catalog: catalog as HubService[], recommended, orders: hubOrders, openCount: hubOrders.filter((o) => !["DELIVERED", "CANCELED"].includes(o.status)).length };
}

