import { beforeEach, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { adjustStock, consumeReservation, getLevel, receiveStock, releaseStock, reserveStock } from "@/lib/domain/inventory";
import { inventoryMovements } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
let v: string;
beforeEach(async () => {
  ctx = await freshDb();
  v = ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)![0]!.id;
  const l = await getLevel(ctx.db, v);
  if (l.reserved > 0) await releaseStock(ctx.db, v, l.reserved);
  await adjustStock(ctx.db, v, 5 - (await getLevel(ctx.db, v)).onHand); // onHand = 5, reserved = 0
});

describe("estoque: conferir e gravar numa instrução só (Constituição art. 10 e 23; 02 §34)", () => {
  it("reserva além do disponível recusa e não muda nada", async () => {
    await expect(reserveStock(ctx.db, v, 6)).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(await getLevel(ctx.db, v)).toMatchObject({ onHand: 5, reserved: 0, available: 5 });
  });
  it("reserva exata funciona e a seguinte recusa", async () => {
    await reserveStock(ctx.db, v, 5);
    expect(await getLevel(ctx.db, v)).toMatchObject({ onHand: 5, reserved: 5, available: 0 });
    await expect(reserveStock(ctx.db, v, 1)).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
  });
  it("12 reservas de 1 ao mesmo tempo para 5 peças: exatamente 5 passam, nunca mais", async () => {
    const r = await Promise.allSettled(Array.from({ length: 12 }, () => reserveStock(ctx.db, v, 1)));
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(5);
    expect(await getLevel(ctx.db, v)).toMatchObject({ onHand: 5, reserved: 5 });
  });
  it("liberar mais que o reservado recusa; liberar o reservado funciona", async () => {
    await reserveStock(ctx.db, v, 2);
    await expect(releaseStock(ctx.db, v, 3)).rejects.toMatchObject({ code: "INVALID_RELEASE" });
    await releaseStock(ctx.db, v, 2);
    expect((await getLevel(ctx.db, v)).reserved).toBe(0);
  });
  it("baixa consome reserva e estoque físico; sem reserva suficiente recusa", async () => {
    await reserveStock(ctx.db, v, 2);
    await consumeReservation(ctx.db, v, 2);
    expect(await getLevel(ctx.db, v)).toMatchObject({ onHand: 3, reserved: 0 });
    await expect(consumeReservation(ctx.db, v, 1)).rejects.toMatchObject({ code: "INVALID_SALE" });
  });
  it("ajuste negativo nunca deixa o físico abaixo do reservado", async () => {
    await reserveStock(ctx.db, v, 3);
    await expect(adjustStock(ctx.db, v, -3)).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    await adjustStock(ctx.db, v, -2);
    expect(await getLevel(ctx.db, v)).toMatchObject({ onHand: 3, reserved: 3 });
  });
  it("entrada soma ao físico", async () => {
    await receiveStock(ctx.db, v, 4);
    expect((await getLevel(ctx.db, v)).onHand).toBe(9);
  });
  it("cada movimento novo guarda saldo antes e depois, e quem fez; a soma fecha com o estoque", async () => {
    await reserveStock(ctx.db, v, 2, { referenceType: "ORDER", referenceId: "x" });
    await consumeReservation(ctx.db, v, 1, { actorUserId: "usr_teste" });
    await releaseStock(ctx.db, v, 1);
    await receiveStock(ctx.db, v, 3);
    const rows = (await ctx.db.select().from(inventoryMovements).where(eq(inventoryMovements.variantId, v)).orderBy(asc(inventoryMovements.createdAt))).filter((m) => m.onHandAfter !== null);
    const sale = rows.find((m) => m.type === "SALE")!;
    expect(sale).toMatchObject({ onHandBefore: 5, onHandAfter: 4, reservedBefore: 2, reservedAfter: 1, actorUserId: "usr_teste" });
    const last = (await getLevel(ctx.db, v));
    const fin = rows.find((m) => m.type === "IN" && m.quantity === 3)!;
    expect(fin.onHandAfter).toBe(last.onHand); expect(fin.reservedAfter).toBe(last.reserved);
  });
});
