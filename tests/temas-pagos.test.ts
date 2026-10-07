import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { entitlements, financeInvoices, orders, storeProducts, stores, storeThemes, themes, users } from "@/db/schema";
import { createOrder } from "@/lib/domain/orders";
import { markInvoicePaid } from "@/lib/domain/finance";
import { fulfillPaidInvoice } from "@/lib/domain/nextlevel-billing";
import { actorFromUser } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { THEME_BY_KEY, THEME_CATALOG } from "@/lib/themes/catalog";
import { publicTheme, publicThemes } from "@/lib/themes/gallery";
import { buyTheme, installTheme, themeCardsFor } from "@/lib/themes/install";
import { ensureShowcaseStores, SHOWCASE_PRODUCTS, showcaseSlug } from "@/lib/themes/showcase";
import { resolveTemplate } from "@/lib/themes/store";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); await ensureShowcaseStores(ctx.db); }, 120_000);
const demoStore = async (key: string) => (await ctx.db.query.stores.findFirst({ where: eq(stores.slug, showcaseSlug(key)) }))!;

describe("lojas de demonstração dos temas", () => {
  it("existe uma por tema, com os produtos de exemplo do segmento, o tema instalado e sem dono com acesso", async () => {
    for (const t of THEME_CATALOG) {
      const s = await demoStore(t.key);
      expect(s.showcaseTheme, t.key).toBe(t.key);
      expect(s.status).toBe("CLOSED");
      expect((await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, s.id))).length).toBe(t.key === "ninho" ? 6 : SHOWCASE_PRODUCTS.length);
      const applied = await ctx.db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, s.id));
      expect(applied[0]?.key, t.key).toBe(t.key);
    }
    const owners = await ctx.db.select().from(users).where(eq(users.organizationId, (await demoStore("ninho")).organizationId));
    expect(owners.length).toBeGreaterThan(0); expect(owners.every((u) => !!u.disabledAt)).toBe(true);
  });
  it("rodar de novo não duplica nada nem refaz o que já está atual", async () => {
    const before = (await ctx.db.select().from(stores)).length;
    expect(await ensureShowcaseStores(ctx.db)).toEqual([]);
    expect((await ctx.db.select().from(stores)).length).toBe(before);
  });
  it("a home da demonstração do Ninho usa as fotos de exemplo", async () => {
    const t = (await resolveTemplate(ctx.db, await demoStore("ninho"), "home")).template;
    const hero = Object.values(t.sections).find((s) => s.type === "image-hero")!;
    expect(String(hero.settings.image)).toMatch(/^\/portal\/commerce\/.+\.webp$/);
  });
  it("não aceita pedido, mesmo com tudo certo", async () => {
    const s = await demoStore("ninho");
    const p = (await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, s.id)))[0]!;
    await expect(createOrder(ctx.db, { storeId: s.id, customer: { name: "Visitante", email: "v@exemplo.com", marketingOptIn: false }, shipping: { city: "São Paulo", state: "SP", costCents: 0 }, items: [{ productId: p.productId, variantId: "x", quantity: 1 }] } as never)).rejects.toMatchObject({ code: "SHOWCASE_STORE" });
    expect(await ctx.db.select().from(orders).where(eq(orders.storeId, s.id))).toHaveLength(0);
  });
});

describe("vitrine pública de temas", () => {
  it("só lista o que está à venda; o tema em aprovação abre por link, com preço do catálogo", async () => {
    const list = await publicThemes(ctx.db);
    expect(list.map((t) => t.key)).toEqual(["starter", "lume", "arena", "editorial", "signature"]);
    expect(list.find((t) => t.key === "arena")!.quote!.listCents).toBe(THEME_BY_KEY.arena!.priceCents);
    const ninho = (await publicTheme(ctx.db, "ninho"))!;
    expect(ninho.release).toBe("review"); expect(ninho.demoReady).toBe(true); expect(ninho.quote!.listCents).toBe(14900);
    expect(await publicTheme(ctx.db, "nao-existe")).toBeNull();
  });
});

describe("lojista", () => {
  it("tema em aprovação não aparece na vitrine do lojista e não pode ser comprado", async () => {
    const r = await signupMember(ctx.db, { storeName: "Minha Loja", ownerName: "Ana", email: "ana@exemplo.com", password: "senha-forte-123", taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
    for (const inv of await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId))) await markInvoicePaid(ctx.db, inv.id);
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const cards = await themeCardsFor(ctx.db, owner);
    expect(cards.map((c) => c.key)).not.toContain("ninho");
    // Tentativa direta (sem passar pela vitrine): compra e instalação recusadas no servidor, sem fatura criada.
    await expect(buyTheme(ctx.db, owner, "ninho", "PIX")).rejects.toMatchObject({ code: "THEME_NOT_RELEASED" });
    await expect(installTheme(ctx.db, owner, "ninho")).rejects.toMatchObject({ code: "THEME_NOT_RELEASED" });
    expect((await ctx.db.select().from(financeInvoices).where(and(eq(financeInvoices.storeId, r.storeId), eq(financeInvoices.kind, "ADDON"))))).toHaveLength(0);
    // Quando o dono aprovar (released), a compra funciona e a instalação mantém os dados.
    const ninho = THEME_BY_KEY.ninho!; ninho.release = "released";
    try {
      await ctx.db.update(themes).set({ available: true }).where(eq(themes.key, "ninho"));
      const bought = await buyTheme(ctx.db, owner, "ninho", "PIX");
      await fulfillPaidInvoice(ctx.db, await markInvoicePaid(ctx.db, bought.invoiceId));
      expect((await ctx.db.select().from(entitlements).where(and(eq(entitlements.storeId, r.storeId), eq(entitlements.key, "THEME_NINHO")))).length).toBe(1);
      await installTheme(ctx.db, owner, "ninho");
      const t = (await resolveTemplate(ctx.db, (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!, "home")).template;
      expect(Object.values(t.sections).some((s) => s.type === "image-hero")).toBe(true);
      expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!.name).toBe("Minha Loja");
    } finally { ninho.release = "review"; }
  });
});
