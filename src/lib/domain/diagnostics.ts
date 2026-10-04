import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { auditLog, domainEvents, errorEvents, orders, stores } from "@/db/schema";
import { requireMaster, type Actor } from "./access";
import { NotFoundError } from "./errors";
import { getStoreReadiness } from "./readiness";
import { storeAccess } from "./store-access";

/**
 * Diagnóstico de UMA loja para a equipe da plataforma (Master): estado, prontidão, integrações, erros recentes ligados à loja,
 * mudanças recentes e fluxo de pedidos. Só leitura; nada de dado pessoal nem segredo (segredos nunca são lidos aqui).
 */
export async function getStoreDiagnostics(db: Database, actor: Actor, slug: string, now = new Date()) {
  requireMaster(actor);
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const staleBefore = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const [readiness, errors, audit, events, byStatus, stale] = await Promise.all([
    getStoreReadiness(db, store.id, now),
    db.select().from(errorEvents).where(eq(errorEvents.lastStoreSlug, slug)).orderBy(desc(errorEvents.lastAt)).limit(10),
    db.select().from(auditLog).where(eq(auditLog.storeId, store.id)).orderBy(desc(auditLog.createdAt)).limit(10),
    db.select({ type: domainEvents.type, n: sql<number>`count(*)::int` }).from(domainEvents).where(and(eq(domainEvents.storeId, store.id), gte(domainEvents.createdAt, since))).groupBy(domainEvents.type),
    db.select({ status: orders.status, n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.storeId, store.id)).groupBy(orders.status),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.customerPaymentStatus, "PENDING"), eq(orders.status, "PENDING"), sql`${orders.createdAt} < ${staleBefore}`)),
  ]);
  const access = storeAccess(store, now);
  return {
    store: { id: store.id, name: store.name, slug: store.slug, status: store.status, offer: store.offer, published: !!store.publishedAt, createdAt: store.createdAt },
    access: { state: access.state, daysLeft: access.daysLeft },
    integrations: {
      payment: { status: store.paymentStatus, provider: store.paymentProvider, hasToken: !!store.mpAccessTokenEnc },
      shipping: { status: store.shippingStatus, provider: store.shippingProvider, hasOwnRules: store.shippingConfig != null },
      domain: { status: store.domainStatus, custom: store.customDomain },
    },
    readiness,
    errors: errors.map((e) => ({ id: e.id, message: e.message, route: e.route, context: e.context, count: e.count, lastAt: e.lastAt, ref: e.lastRef, resolved: !!e.resolvedAt })),
    audit: audit.map((a) => ({ action: a.action, entityType: a.entityType, createdAt: a.createdAt, actorRole: a.actorRole })),
    events7d: Object.fromEntries(events.map((e) => [e.type, e.n])),
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.n])),
    stalePendingOrders: stale[0]?.n ?? 0,
  };
}
