import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { inventory } from "@/db/schema";
import { markAlertsNotified, parseContact, stockDemand, subscribeStockAlert } from "@/lib/domain/stock-alerts";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const mantos = () => ctx.seed.stores.mantos.id;
const variant = () => ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)![0]!.id;
const soldOut = async () => { await ctx.db.update(inventory).set({ onHand: 0, reserved: 0 }).where(eq(inventory.variantId, variant())); };

describe("Avise-me", () => {
  it("normaliza contato e recusa inválido", () => {
    expect(parseContact(" Ana@X.com ")).toEqual({ kind: "EMAIL", value: "ana@x.com" });
    expect(parseContact("(11) 98888-7777")).toEqual({ kind: "WHATSAPP", value: "11988887777" });
    expect(parseContact("abc")).toBeNull();
  });

  it("só aceita tamanho realmente esgotado; não duplica; lojista vê a demanda só da própria loja e marca como avisado", async () => {
    const input = { productId: ctx.seed.productIds[11]!, variantId: variant(), contact: "ana@x.com" };
    await expect(subscribeStockAlert(ctx.db, mantos(), input)).rejects.toThrow(/disponível/); // ainda tem estoque
    await soldOut();
    expect((await subscribeStockAlert(ctx.db, mantos(), input)).created).toBe(true);
    expect((await subscribeStockAlert(ctx.db, mantos(), input)).created).toBe(false);
    await subscribeStockAlert(ctx.db, mantos(), { ...input, contact: "11988887777" });
    await expect(subscribeStockAlert(ctx.db, mantos(), { ...input, contact: "xx" })).rejects.toThrow(/válido/);
    await expect(subscribeStockAlert(ctx.db, ctx.seed.stores.arena.id, input)).rejects.toThrow(/indisponível/); // produto não é da loja arena
    const g = await stockDemand(ctx.db, mantos());
    expect(g).toHaveLength(1);
    expect(g[0]!.contacts).toHaveLength(2);
    expect(await stockDemand(ctx.db, ctx.seed.stores.arena.id)).toHaveLength(0);
    await expect(markAlertsNotified(ctx.db, ctx.seed.stores.arena.id, variant())).rejects.toThrow(/Nenhum aviso/);
    expect((await markAlertsNotified(ctx.db, mantos(), variant())).marked).toBe(2);
    expect(await stockDemand(ctx.db, mantos())).toHaveLength(0);
  });
});
