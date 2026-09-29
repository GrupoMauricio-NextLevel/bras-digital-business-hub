import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./setup";
import { listOrdersForActor, confirmCentralPayment, cancelOrder } from "@/lib/domain/orders";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { assertCanAccess, requireMaster, requireStoreId, requireSupplierId } from "@/lib/domain/access";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => {
  ctx = await freshDb();
});

describe("isolamento multi-tenant", () => {
  it("lojista lista apenas os próprios pedidos", async () => {
    const mantos = await listOrdersForActor(ctx.db, ctx.actors.mantos);
    const arena = await listOrdersForActor(ctx.db, ctx.actors.arena);
    expect(mantos.length).toBeGreaterThan(0);
    expect(arena.length).toBeGreaterThan(0);
    expect(mantos.every((r) => r.order.storeId === ctx.seed.stores.mantos.id)).toBe(true);
    expect(arena.every((r) => r.order.storeId === ctx.seed.stores.arena.id)).toBe(true);
  });

  it("fornecedor vê pedidos de toda a rede; master vê tudo", async () => {
    const supplier = await listOrdersForActor(ctx.db, ctx.actors.supplier);
    const master = await listOrdersForActor(ctx.db, ctx.actors.master);
    const storeIds = new Set(supplier.map((r) => r.order.storeId));
    expect(storeIds.has(ctx.seed.stores.mantos.id)).toBe(true);
    expect(storeIds.has(ctx.seed.stores.arena.id)).toBe(true);
    expect(master.length).toBe(supplier.length);
  });

  it("lojista não altera pedido de outra loja", async () => {
    const arenaOrder = (await listOrdersForActor(ctx.db, ctx.actors.arena))[0]!.order;
    await expect(confirmCentralPayment(ctx.db, ctx.actors.mantos, arenaOrder.id)).rejects.toThrow(/não permitido/);
    await expect(cancelOrder(ctx.db, ctx.actors.mantos, arenaOrder.id)).rejects.toThrow(/não permitido/);
  });

  it("catálogo respeita distribuição SELECTED_STORES", async () => {
    const mantos = await listStoreCatalog(ctx.db, ctx.seed.stores.mantos.id);
    const arena = await listStoreCatalog(ctx.db, ctx.seed.stores.arena.id);
    const blaugrana = ctx.seed.productIds[8]!;
    expect(mantos.some((i) => i.product.id === blaugrana)).toBe(true);
    expect(arena.some((i) => i.product.id === blaugrana)).toBe(false);
  });
});

describe("permissões", () => {
  it("assertCanAccess por papel", () => {
    const target = { storeId: ctx.seed.stores.mantos.id, supplierId: ctx.seed.supplierId };
    expect(() => assertCanAccess(ctx.actors.master, target)).not.toThrow();
    expect(() => assertCanAccess(ctx.actors.supplier, target)).not.toThrow();
    expect(() => assertCanAccess(ctx.actors.mantos, target)).not.toThrow();
    expect(() => assertCanAccess(ctx.actors.arena, target)).toThrow();
    expect(() => assertCanAccess({ ...ctx.actors.supplier, supplierId: "outro" }, target)).toThrow();
  });

  it("guards de papel", () => {
    expect(requireStoreId(ctx.actors.mantos)).toBe(ctx.seed.stores.mantos.id);
    expect(() => requireStoreId(ctx.actors.supplier)).toThrow();
    expect(requireSupplierId(ctx.actors.supplier)).toBe(ctx.seed.supplierId);
    expect(() => requireSupplierId(ctx.actors.mantos)).toThrow();
    expect(() => requireMaster(ctx.actors.master)).not.toThrow();
    expect(() => requireMaster(ctx.actors.arena)).toThrow();
  });
});
