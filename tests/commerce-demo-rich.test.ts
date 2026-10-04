import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { COMMERCE_RICH_EMAIL, seedCommerceRichDemo } from "@/db/commerce-demo-rich";
import { isDemoAccountEmail } from "@/lib/security/demo-accounts";
import { orders, storeProducts, productReviews, stockAlerts, storeCampaigns, storeCustomers, storeDiscounts, storePriceTiers, proposals, users, stores, auditLog } from "@/db/schema";

describe("loja de teste completa da Commerce (Casa Aurora)", () => {
  it("gera catálogo, clientes e pedidos em todas as situações, só como conta de demonstração, e não repete", async () => {
    expect(isDemoAccountEmail(COMMERCE_RICH_EMAIL)).toBe(true); // nunca entra fora do modo de demonstração
    const { db } = await freshDb();
    expect(await seedCommerceRichDemo(db)).toBe(true);
    const user = (await db.query.users.findFirst({ where: eq(users.email, COMMERCE_RICH_EMAIL) }))!;
    expect(user.role).toBe("STORE_OWNER");
    const store = (await db.query.stores.findFirst({ where: eq(stores.id, user.storeId!) }))!;
    expect(store.offer).toBe("STORE_OWN");
    expect(store.publishedAt).toBeTruthy();

    const rows = await db.select().from(orders).where(eq(orders.storeId, store.id));
    expect(rows.length).toBeGreaterThanOrEqual(100);
    const statuses = new Set(rows.map((o) => o.status));
    for (const st of ["PENDING", "SHIPPED", "DELIVERED", "CANCELED"]) expect(statuses.has(st as never)).toBe(true);
    expect(new Set(rows.map((o) => o.channel)).size).toBeGreaterThanOrEqual(4);
    const span = (Date.now() - Math.min(...rows.map((o) => new Date(o.createdAt).getTime()))) / 86_400_000;
    expect(span).toBeGreaterThan(60); // movimento em ~90 dias, para a análise comparar períodos

    expect((await db.select().from(storeCustomers).where(eq(storeCustomers.storeId, store.id))).length).toBeGreaterThanOrEqual(40);
    const catalog = await db.select().from(storeProducts).where(eq(storeProducts.storeId, store.id));
    expect(catalog.length).toBe(34);
    expect(catalog.filter((c) => !c.active).length).toBe(2); // rascunhos
    expect((await db.select().from(storeDiscounts).where(eq(storeDiscounts.storeId, store.id))).length).toBe(7);
    expect((await db.select().from(storeCampaigns).where(eq(storeCampaigns.storeId, store.id))).length).toBe(3);
    expect((await db.select().from(storePriceTiers).where(eq(storePriceTiers.storeId, store.id))).length).toBeGreaterThan(0);
    expect((await db.select().from(proposals).where(eq(proposals.storeId, store.id))).length).toBe(3);
    expect((await db.select().from(stockAlerts).where(eq(stockAlerts.storeId, store.id))).length).toBeGreaterThan(0);
    const reviewStatuses = new Set((await db.select().from(productReviews).where(eq(productReviews.storeId, store.id))).map((r) => r.status));
    expect(reviewStatuses.size).toBeGreaterThanOrEqual(2);
    expect((await db.select().from(auditLog).where(eq(auditLog.storeId, store.id))).length).toBeGreaterThanOrEqual(6);
    expect((await db.query.users.findFirst({ where: eq(users.email, "paulo@casaaurora.demo") }))!.storeRole).toBe("STAFF");

    expect(await seedCommerceRichDemo(db)).toBe(false);
  }, 120_000);
});
