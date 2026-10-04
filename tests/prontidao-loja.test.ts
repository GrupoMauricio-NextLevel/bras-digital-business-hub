import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { getStoreReadiness } from "@/lib/domain/readiness";
import { signupMember } from "@/lib/domain/store-access";
import { storeProducts, stores } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

describe("F4: loja pronta para vender", () => {
  it("loja nova não está pronta e diz o que falta, sem olhar produtos de outra loja", async () => {
    const r = await signupMember(ctx.db, { storeName: "Loja Vazia", ownerName: "Beltrano", email: "beltrano@vazia.loja", password: "senha-forte-123", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
    const rd = await getStoreReadiness(ctx.db, r.storeId);
    expect(rd.ready).toBe(false);
    expect(rd.missingBlocking.map((i) => i.key)).toEqual(expect.arrayContaining(["products", "payment", "published"]));
    expect(rd.items.every((i) => i.fixHref.startsWith("/merchant/"))).toBe(true);
    expect(rd.hasFirstSale).toBe(false); expect(rd.percent).toBeLessThan(100);
  });
  it("loja com produto, estoque, pagamento conectado e publicada fica pronta; sem estoque deixa de ficar", async () => {
    const id = ctx.seed.stores.mantos.id;
    await ctx.db.update(stores).set({ paymentStatus: "CONNECTED", publishedAt: new Date().toISOString(), status: "ACTIVE", trialEndsAt: null, paidUntil: null }).where(eq(stores.id, id));
    const rd = await getStoreReadiness(ctx.db, id);
    expect(rd.missingBlocking).toEqual([]);
    expect(rd.ready).toBe(true); expect(rd.hasFirstSale).toBe(true);
    await ctx.db.update(storeProducts).set({ active: false }).where(eq(storeProducts.storeId, id));
    const rd2 = await getStoreReadiness(ctx.db, id);
    expect(rd2.ready).toBe(false);
    expect(rd2.missingBlocking.map((i) => i.key)).toEqual(["products"]);
  });
  it("pagamento em demonstração não conta como real", async () => {
    const id = ctx.seed.stores.mantos.id;
    await ctx.db.update(stores).set({ paymentStatus: "DEMO" }).where(eq(stores.id, id));
    const rd = await getStoreReadiness(ctx.db, id);
    expect(rd.items.find((i) => i.key === "payment")).toMatchObject({ ok: false });
  });
});
