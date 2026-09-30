import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./setup";
import { computeAvailable, getLevel, reserveStock, releaseStock, consumeReservation, adjustStock, listMovements } from "@/lib/domain/inventory";

let ctx: Awaited<ReturnType<typeof freshDb>>;
let variantId: string;

beforeEach(async () => {
  ctx = await freshDb();
  variantId = ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)!.find((v) => v.size === "P")!.id;
});

describe("estoque central", () => {
  it("available = on_hand - reserved, nunca negativo", () => {
    expect(computeAvailable(10, 3)).toBe(7);
    expect(computeAvailable(2, 5)).toBe(0);
  });

  it("reserva reduz o disponível e registra movimentação", async () => {
    const before = await getLevel(ctx.db, variantId);
    await reserveStock(ctx.db, variantId, 3, { referenceType: "TEST" });
    const after = await getLevel(ctx.db, variantId);
    expect(after.onHand).toBe(before.onHand);
    expect(after.reserved).toBe(before.reserved + 3);
    expect(after.available).toBe(before.available - 3);
    const movements = await listMovements(ctx.db, variantId, 1);
    expect(movements[0]?.type).toBe("RESERVE");
  });

  it("não permite reservar além do disponível", async () => {
    const level = await getLevel(ctx.db, variantId);
    await expect(reserveStock(ctx.db, variantId, level.available + 1)).rejects.toThrow(/Estoque insuficiente/);
    const after = await getLevel(ctx.db, variantId);
    expect(after.reserved).toBe(level.reserved);
  });

  it("libera reserva e não permite liberar mais que o reservado", async () => {
    await reserveStock(ctx.db, variantId, 2);
    await releaseStock(ctx.db, variantId, 2);
    const level = await getLevel(ctx.db, variantId);
    await expect(releaseStock(ctx.db, variantId, level.reserved + 1)).rejects.toThrow();
  });

  it("venda consome reserva e físico", async () => {
    const before = await getLevel(ctx.db, variantId);
    await reserveStock(ctx.db, variantId, 2);
    await consumeReservation(ctx.db, variantId, 2);
    const after = await getLevel(ctx.db, variantId);
    expect(after.onHand).toBe(before.onHand - 2);
    expect(after.reserved).toBe(before.reserved);
  });

  it("ajuste não pode deixar físico abaixo do reservado", async () => {
    await reserveStock(ctx.db, variantId, 4);
    const level = await getLevel(ctx.db, variantId);
    await expect(adjustStock(ctx.db, variantId, -(level.onHand - 3))).rejects.toThrow(/abaixo do reservado/);
  });
});
