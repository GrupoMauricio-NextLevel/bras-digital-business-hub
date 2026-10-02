import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { orders, proposals, storeProducts } from "@/db/schema";
import { acceptProposal, cancelProposal, createProposal, getPublicProposal } from "@/lib/domain/proposals";
import { getLevel } from "@/lib/domain/inventory";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const v = (i: number) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)![0]!.id;
const make = (qty = 1, storeId = ctx.seed.stores.mantos.id) => createProposal(ctx.db, storeId, { customer: { name: "Cliente PDV", email: "pdv@x.com" }, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11), quantity: qty }] });

describe("Onda 6 — propostas comerciais", () => {
  it("aceite cria um único pedido, mesmo com cliques simultâneos e repetição", async () => {
    const p = await make(1);
    const before = (await getLevel(ctx.db, v(11))).available;
    const rs = await Promise.allSettled([acceptProposal(ctx.db, p.token), acceptProposal(ctx.db, p.token)]);
    expect(rs.some((r) => r.status === "fulfilled")).toBe(true);
    const again = await acceptProposal(ctx.db, p.token);
    expect(again.created).toBe(false);
    const made = await ctx.db.select().from(orders).where(eq(orders.customerEmail, "pdv@x.com"));
    expect(made).toHaveLength(1);
    expect((await getLevel(ctx.db, v(11))).available).toBe(before - 1);
  });

  it("proposta expirada ou cancelada não vira pedido; falta de estoque deixa a proposta aberta", async () => {
    const p = await make(1);
    await expect(acceptProposal(ctx.db, p.token, new Date(Date.now() + 4 * 86_400_000))).rejects.toThrow(/expirou/);
    expect((await getPublicProposal(ctx.db, p.token, new Date(Date.now() + 4 * 86_400_000)))!.state).toBe("EXPIRED");
    const c = await make(1);
    await cancelProposal(ctx.db, ctx.seed.stores.mantos.id, (await ctx.db.query.proposals.findFirst({ where: eq(proposals.token, c.token) }))!.id);
    await expect(acceptProposal(ctx.db, c.token)).rejects.toThrow(/cancelada/);
    const big = await make(1);
    const unit = (await ctx.db.query.storeProducts.findFirst({ where: eq(storeProducts.productId, ctx.seed.productIds[11]!) }))!.priceCents;
    await ctx.db.update(proposals).set({ items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11), quantity: 100000, label: "x", unitPriceCents: unit }], subtotalCents: unit * 100000 }).where(eq(proposals.token, big.token));
    await expect(acceptProposal(ctx.db, big.token)).rejects.toThrow();
    expect((await ctx.db.query.proposals.findFirst({ where: eq(proposals.token, big.token) }))!.status).toBe("OPEN");
  });

  it("preço adulterado/alterado depois da proposta é recusado; outra loja não cancela", async () => {
    const p = await make(2);
    await ctx.db.update(storeProducts).set({ priceCents: 1 }).where(eq(storeProducts.productId, ctx.seed.productIds[11]!));
    await expect(acceptProposal(ctx.db, p.token)).rejects.toThrow(/preços mudaram/);
    const row = (await ctx.db.query.proposals.findFirst({ where: eq(proposals.token, p.token) }))!;
    await expect(cancelProposal(ctx.db, ctx.seed.stores.arena.id, row.id)).rejects.toThrow(/não encontrada/);
  });
});
