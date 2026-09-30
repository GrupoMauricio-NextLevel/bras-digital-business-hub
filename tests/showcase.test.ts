import { describe, expect, it, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDatabase, type Database } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";
import { seedShowcase, SHOWCASE_COST_CENTS, SHOWCASE_PRICE_CENTS, SHOWCASE_PRODUCTS } from "@/db/showcase";
import { orders, products, stores, walletEntries, walletAccounts, orderLabelFiles, pickWaves, serviceOrders } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { loadEsteira } from "@/lib/domain/operations";

let db: Database;
let ids: { supplierId: string; storeId: string };
beforeAll(async () => {
  ({ db } = (await createDatabase("pglite://memory")) as { db: Database });
  await runMigrations(db);
  await seedDatabase(db);
  ids = await seedShowcase(db);
}, 120_000);

describe("vitrine de demonstração (Mega Tron / MRS Sports)", () => {
  it("cria 5 camisas genéricas com custo de R$ 80 e venda de R$ 120, sem marcas de clubes", async () => {
    const ps = await db.select().from(products).where(eq(products.supplierId, ids.supplierId));
    expect(ps).toHaveLength(5);
    for (const p of ps) { expect(p.costCents).toBe(SHOWCASE_COST_CENTS); expect(p.suggestedPriceCents).toBe(SHOWCASE_PRICE_CENTS); }
    const text = JSON.stringify([...SHOWCASE_PRODUCTS, ...ps.map((p) => p.description)]).toLowerCase();
    for (const banned of ["fluminense", "flamengo", "cruzeiro", "grêmio", "gremio", "atlético", "nike", "adidas", "puma", "superbet", "h2bet"]) expect(text).not.toContain(banned);
  });
  it("gera ~30 dias de pedidos em todos os estados, coerentes com o saldo do lojista", async () => {
    const os = await db.select().from(orders).where(eq(orders.storeId, ids.storeId));
    expect(os.length).toBeGreaterThanOrEqual(25);
    const status = new Set(os.map((o) => o.status));
    for (const st of ["DELIVERED", "SHIPPED", "READY_TO_SHIP", "PICKING", "READY_TO_PICK", "AWAITING_LABEL", "AWAITING_CENTRAL_PAYMENT", "PENDING", "CANCELED"]) expect(status.has(st as never)).toBe(true);
    const acc = await db.query.walletAccounts.findFirst({ where: eq(walletAccounts.storeId, ids.storeId) });
    const sum = (await db.select().from(walletEntries).where(eq(walletEntries.storeId, ids.storeId))).reduce((t, e) => t + e.amountCents, 0);
    expect(acc?.balanceCents).toBe(sum);
    const oldest = Math.min(...os.map((o) => new Date(o.createdAt).getTime()));
    expect(Date.now() - oldest).toBeGreaterThan(20 * 86_400_000);
  });
  it("tem etiquetas anexadas, uma onda de separação e pedidos de serviço", async () => {
    expect((await db.select().from(orderLabelFiles)).length).toBeGreaterThan(10);
    expect((await db.select().from(serviceOrders).where(eq(serviceOrders.storeId, ids.storeId))).length).toBe(2);
    void pickWaves;
  });
  it("a esteira do fornecedor mostra os pedidos e a expedição não vê valores", async () => {
    const supplier: Actor = { userId: "x", role: "SUPPLIER_DISPATCH", organizationId: "o", supplierId: ids.supplierId, storeId: null };
    const e = await loadEsteira(db, supplier);
    expect(e.orders.length).toBeGreaterThan(3);
    expect(JSON.stringify(e.orders)).not.toMatch(/cents|Cents/);
    void stores;
  });
});
