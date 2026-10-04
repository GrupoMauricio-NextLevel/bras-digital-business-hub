import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { anonymizeCustomer, exportCustomerData, exportStoreCsv } from "@/lib/domain/privacy";
import { activities, orders, storeCustomers } from "@/db/schema";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);
const mantos = () => ctx.actors.mantos; const arena = () => ctx.actors.arena;

describe("F6: exportação e exclusão de dados", () => {
  it("exporta só os dados da própria loja e registra a ação", async () => {
    const csv = await exportStoreCsv(ctx.db, mantos(), "orders");
    const own = await ctx.db.select().from(orders).where(eq(orders.storeId, ctx.seed.stores.mantos.id));
    expect(csv.trim().split("\n")).toHaveLength(own.length + 1);
    expect((await ctx.db.select().from(activities).where(and(eq(activities.storeId, ctx.seed.stores.mantos.id), eq(activities.type, "DATA_EXPORT")))).length).toBeGreaterThan(0);
  });
  it("fornecedor e equipe da loja não exportam; produtos e clientes exportam para o dono", async () => {
    await expect(exportStoreCsv(ctx.db, ctx.actors.supplier, "orders")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(exportStoreCsv(ctx.db, { ...mantos(), storeRole: "STAFF" }, "customers")).rejects.toBeInstanceOf(ForbiddenError);
    expect((await exportStoreCsv(ctx.db, mantos(), "products")).startsWith("nome,sku")).toBe(true);
    expect((await exportStoreCsv(ctx.db, mantos(), "customers")).startsWith("nome,email")).toBe(true);
  });
  it("anonimiza um cliente mantendo o pedido; outra loja não alcança esse cliente", async () => {
    const sc = (await ctx.db.select().from(storeCustomers).where(eq(storeCustomers.storeId, ctx.seed.stores.mantos.id)))[0]!;
    await expect(anonymizeCustomer(ctx.db, arena(), sc.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(exportCustomerData(ctx.db, arena(), sc.id)).rejects.toBeInstanceOf(NotFoundError);
    const before = await ctx.db.select().from(orders).where(eq(orders.storeCustomerId, sc.id));
    const data = await exportCustomerData(ctx.db, mantos(), sc.id);
    expect(data.orders).toHaveLength(before.length);
    await anonymizeCustomer(ctx.db, mantos(), sc.id);
    const after = await ctx.db.select().from(orders).where(eq(orders.storeCustomerId, sc.id));
    expect(after).toHaveLength(before.length);
    for (const o of after) { expect(o.customerName).toBe("Cliente removido"); expect(o.customerEmail).toContain("anonimo.invalid"); expect(o.customerPhone).toBeNull(); expect(o.shippingAddress).toBeNull(); }
    expect(after.map((o) => o.totalCents).sort()).toEqual(before.map((o) => o.totalCents).sort());
    expect((await ctx.db.select().from(activities).where(eq(activities.type, "CUSTOMER_ANONYMIZED"))).length).toBe(1);
  });
});
