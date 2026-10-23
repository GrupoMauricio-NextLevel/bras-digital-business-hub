import { describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { brandLeads, orders, organizations, products, stores, suppliers, users } from "@/db/schema";
import { activateMasterScenario, clearMasterScenario, getMasterScenarioSummary } from "@/lib/master-scenario";

async function totals(db: Awaited<ReturnType<typeof freshDb>>["db"]) {
  const [userCount] = await db.select({ n: count() }).from(users);
  const [storeCount] = await db.select({ n: count() }).from(stores);
  const [supplierCount] = await db.select({ n: count() }).from(suppliers);
  const [productCount] = await db.select({ n: count() }).from(products);
  const [orderCount] = await db.select({ n: count() }).from(orders);
  const [organizationCount] = await db.select({ n: count() }).from(organizations);
  const [leadCount] = await db.select({ n: count() }).from(brandLeads);
  return {
    users: userCount?.n ?? 0,
    stores: storeCount?.n ?? 0,
    suppliers: supplierCount?.n ?? 0,
    products: productCount?.n ?? 0,
    orders: orderCount?.n ?? 0,
    organizations: organizationCount?.n ?? 0,
    leads: leadCount?.n ?? 0,
  };
}

describe("gerador de cenários fictícios do ecossistema", () => {
  it("preenche SuperDrop + Commerce, troca densidade sem duplicar e limpa somente o cenário", async () => {
    const { db, actors } = await freshDb();
    const before = await totals(db);

    const light = await activateMasterScenario(db, actors.master.userId, { level: "LIGHT", scope: "ALL" });
    expect(light.active).toBe(true);
    expect(light.level).toBe("LIGHT");
    expect(light.superdropStores).toBe(2);
    expect(light.commerceStores).toBe(2);
    expect(light.stores).toBe(4);
    expect(light.products).toBe(20);
    expect(light.orders).toBe(28);
    expect(light.users).toBe(6);
    expect(light.leads).toBe(6);

    const same = await activateMasterScenario(db, actors.master.userId, { level: "LIGHT", scope: "ALL" });
    expect(same).toEqual(light);
    expect((await db.select().from(suppliers).where(eq(suppliers.slug, "cenario-sd-atlas-central"))).length).toBe(1);

    const scaleCommerce = await activateMasterScenario(db, actors.master.userId, { level: "SCALE", scope: "COMMERCE" });
    expect(scaleCommerce.superdropStores).toBe(0);
    expect(scaleCommerce.commerceStores).toBe(8);
    expect(scaleCommerce.stores).toBe(8);
    expect(scaleCommerce.products).toBe(112);
    expect(scaleCommerce.orders).toBe(120);
    expect(scaleCommerce.leads).toBe(40);

    const cleared = await clearMasterScenario(db);
    expect(cleared.active).toBe(false);
    expect(await getMasterScenarioSummary(db)).toEqual(cleared);
    expect(await totals(db)).toEqual(before);
  });

  it("consegue preencher somente o SuperDrop no nível operação", async () => {
    const { db, actors } = await freshDb();
    const scenario = await activateMasterScenario(db, actors.master.userId, { level: "ACTIVE", scope: "SUPERDROP" });
    expect(scenario.superdropStores).toBe(5);
    expect(scenario.commerceStores).toBe(0);
    expect(scenario.products).toBe(16);
    expect(scenario.orders).toBe(60);
    expect(scenario.content).toBe(10);
    expect(scenario.leads).toBe(0);
  });
});
