import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { COMMERCE_DEMO_EMAIL, seedCommerceDemo } from "@/db/commerce-demo";
import { organizations, orders, stores, users } from "@/db/schema";

describe("conta de demonstração da Commerce", () => {
  it("cria a conta simples da marca Commerce com produtos e pedidos em canais variados, e não repete", async () => {
    const { db } = await freshDb();
    expect(await seedCommerceDemo(db)).toBe(true);
    const user = (await db.query.users.findFirst({ where: eq(users.email, COMMERCE_DEMO_EMAIL) }))!;
    expect(user.role).toBe("STORE_OWNER");
    const store = (await db.query.stores.findFirst({ where: eq(stores.id, user.storeId!) }))!;
    expect(store.kind).toBe("SUPPLIER_OWN");
    const org = (await db.query.organizations.findFirst({ where: eq(organizations.id, store.organizationId) }))!;
    expect(org.brand).toBe("NEXTLEVEL_COMMERCE");
    const rows = await db.select().from(orders).where(eq(orders.storeId, store.id));
    expect(rows.length).toBe(8);
    expect(new Set(rows.map((o) => o.channel)).size).toBeGreaterThanOrEqual(3);
    expect(await seedCommerceDemo(db)).toBe(false);
  });
});
