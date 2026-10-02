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

describe("Onda 7 — campanhas agendadas", () => {
  it("só aparece dentro da janela, recusa link inseguro e outra loja não apaga", async () => {
    const { createCampaign, currentCampaign, deleteCampaign, isSafeLink } = await import("@/lib/domain/campaigns");
    const mantos = ctx.seed.stores.mantos.id;
    const t0 = new Date("2026-10-10T12:00:00Z");
    const { id } = await createCampaign(ctx.db, mantos, { text: "Frete grátis no fim de semana", startsAt: "2026-10-11T03:00:00.000Z", endsAt: "2026-10-12T03:00:00.000Z", linkUrl: "/store/mantos/catalog" });
    expect(await currentCampaign(ctx.db, mantos, t0)).toBeNull();
    expect((await currentCampaign(ctx.db, mantos, new Date("2026-10-11T15:00:00Z")))?.text).toMatch(/Frete/);
    expect(await currentCampaign(ctx.db, mantos, new Date("2026-10-12T03:00:00Z"))).toBeNull();
    expect(await currentCampaign(ctx.db, ctx.seed.stores.arena.id, new Date("2026-10-11T15:00:00Z"))).toBeNull();
    expect(["javascript:alert(1)", "//evil.com", "http://x.com", "data:text/html,x"].some(isSafeLink)).toBe(false);
    await expect(createCampaign(ctx.db, mantos, { text: "Aviso ok", startsAt: "2026-10-11T03:00:00Z", endsAt: "2026-10-12T03:00:00Z", linkUrl: "javascript:alert(1)" })).rejects.toThrow(/link/i);
    await expect(createCampaign(ctx.db, mantos, { text: "Aviso ok", startsAt: "2026-10-12T03:00:00Z", endsAt: "2026-10-11T03:00:00Z" })).rejects.toThrow(/depois do início/);
    await expect(deleteCampaign(ctx.db, ctx.seed.stores.arena.id, id)).rejects.toThrow(/não encontrada/);
  });
});
