import { beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { entitlements, financeInvoices, inventory, orders, productVariants, products, storeProducts, stores, storeThemes, themes, users } from "@/db/schema";
import { createOrder } from "@/lib/domain/orders";
import { markInvoicePaid } from "@/lib/domain/finance";
import { fulfillPaidInvoice } from "@/lib/domain/nextlevel-billing";
import { actorFromUser } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { THEME_BY_KEY, THEME_CATALOG } from "@/lib/themes/catalog";
import { publicTheme, publicThemes } from "@/lib/themes/gallery";
import { buyTheme, installTheme, themeCardsFor } from "@/lib/themes/install";
import { demoFamilyOf } from "@/lib/themes/families";
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
      expect((await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, s.id))).length).toBe(SHOWCASE_PRODUCTS.length);
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
  it("Casa sem imagem final: o banner fica pendente (fundo do tema), nunca com foto de outro segmento", async () => {
    const t = (await resolveTemplate(ctx.db, await demoStore("ninho"), "home")).template;
    const hero = Object.values(t.sections).find((s) => s.type === "hero-banner")!;
    const first = hero.blocks[hero.blockOrder[0]!]!;
    expect(first.settings.image).toBe(""); expect(first.settings.alt).toMatch(/Despensa/);
    expect((await demoStore("ninho")).name).toBe("Casa em Ordem");
  });
  it.each([["moda", ["trama", "lume", "editorial", "atelier"]], ["casa", ["lar", "ninho", "varanda", "morada"]], ["sport", ["lance", "torcida", "arena", "podio"]], ["beauty", ["petala", "brilho", "aura", "musa"]], ["conecta", ["sinal", "pulso", "circuito", "orbita"]], ["atacado", ["fardo", "lote", "galpao", "porto"]]] as const)("família %s: os quatro níveis usam o mesmo catálogo (12+ produtos, 4 categorias, variações e um esgotado)", async (family, keys) => {
    const skusOf = async (key: string) => {
      const rows = await ctx.db.select({ sku: products.sku, cat: products.categoryId, pid: products.id }).from(storeProducts).innerJoin(products, eq(products.id, storeProducts.productId)).where(and(eq(storeProducts.storeId, (await demoStore(key)).id), eq(storeProducts.active, true)));
      return rows;
    };
    const base = await skusOf(keys[0]);
    expect(base.length).toBeGreaterThanOrEqual(12);
    expect(new Set(base.map((r) => r.cat)).size).toBe(4);
    for (const key of keys.slice(1)) expect((await skusOf(key)).map((r) => r.sku).sort(), key).toEqual(base.map((r) => r.sku).sort());
    const variants = await ctx.db.select().from(productVariants).where(inArray(productVariants.productId, base.map((r) => r.pid)));
    expect(variants.length).toBeGreaterThan(base.length);
    const sold = demoFamilyOf(family)!.products.find((p) => p.soldOut)!;
    const soldPid = base.find((r) => r.sku === sold.sku)!.pid;
    const soldVars = variants.filter((v) => v.productId === soldPid).map((v) => v.id);
    const stock = await ctx.db.select().from(inventory).where(inArray(inventory.variantId, soldVars));
    expect(stock.reduce((t, r) => t + r.onHand, 0)).toBe(0);
    const other = await ctx.db.select().from(inventory).where(inArray(inventory.variantId, variants.filter((v) => v.productId !== soldPid).map((v) => v.id)));
    expect(other.every((r) => r.onHand > 0)).toBe(true);
    // N1 com banners fixos; N4 com campanha agendada; nenhum banner aponta para foto aleatória fora do manifesto
    const home = async (key: string) => (await resolveTemplate(ctx.db, await demoStore(key), "home")).template;
    const types = async (key: string) => Object.values((await home(key)).sections).map((x) => x.type);
    expect(await types(keys[0])).toContain("hero-banner");
    if (keys[2] !== "arena") expect(await types(keys[2])).toContain("banner-mosaic");
    expect(JSON.stringify(await home(keys[3]))).toMatch(/startsAt/);
  });
  it("não aceita pedido, mesmo com tudo certo", async () => {
    const s = await demoStore("ninho");
    const p = (await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, s.id)))[0]!;
    await expect(createOrder(ctx.db, { storeId: s.id, customer: { name: "Visitante", email: "v@exemplo.com", marketingOptIn: false }, shipping: { city: "São Paulo", state: "SP", costCents: 0 }, items: [{ productId: p.productId, variantId: "x", quantity: 1 }] } as never)).rejects.toMatchObject({ code: "SHOWCASE_STORE" });
    expect(await ctx.db.select().from(orders).where(eq(orders.storeId, s.id))).toHaveLength(0);
  });
});

describe("vitrine pública de temas", () => {
  it("só lista o que está à venda; um tema em aprovação abre por link, com preço do catálogo", async () => {
    expect((await publicThemes(ctx.db)).map((t) => t.key)).toEqual(THEME_CATALOG.filter((t) => t.release === "released").map((t) => t.key));
    // Todos estão à venda hoje (D84); um tema que volte para revisão sai da galeria e continua abrindo por link.
    const ninhoInfo = THEME_BY_KEY.ninho!; ninhoInfo.release = "review";
    try {
      const list = await publicThemes(ctx.db);
      expect(list.map((t) => t.key)).not.toContain("ninho");
      expect(list.find((t) => t.key === "arena")!.quote!.listCents).toBe(THEME_BY_KEY.arena!.priceCents);
      const ninho = (await publicTheme(ctx.db, "ninho"))!;
      expect(ninho.release).toBe("review"); expect(ninho.demoReady).toBe(true); expect(ninho.quote!.listCents).toBe(14900);
    } finally { ninhoInfo.release = "released"; }
    expect(await publicTheme(ctx.db, "nao-existe")).toBeNull();
  });
});

describe("lojista", () => {
  it("tema em aprovação não aparece na vitrine do lojista e não pode ser comprado", async () => {
    const r = await signupMember(ctx.db, { storeName: "Minha Loja", ownerName: "Ana", email: "ana@exemplo.com", password: "senha-forte-123", taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
    for (const inv of await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId))) await markInvoicePaid(ctx.db, inv.id);
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    // Simula um tema em aprovação (hoje todos estão à venda, D84).
    const ninho = THEME_BY_KEY.ninho!; ninho.release = "review";
    await ctx.db.update(themes).set({ available: false }).where(eq(themes.key, "ninho"));
    const cards = await themeCardsFor(ctx.db, owner);
    expect(cards.map((c) => c.key)).not.toContain("ninho");
    // Tentativa direta (sem passar pela vitrine): compra e instalação recusadas no servidor, sem fatura criada.
    await expect(buyTheme(ctx.db, owner, "ninho", "PIX")).rejects.toMatchObject({ code: "THEME_NOT_RELEASED" });
    await expect(installTheme(ctx.db, owner, "ninho")).rejects.toMatchObject({ code: "THEME_NOT_RELEASED" });
    expect((await ctx.db.select().from(financeInvoices).where(and(eq(financeInvoices.storeId, r.storeId), eq(financeInvoices.kind, "ADDON"))))).toHaveLength(0);
    // Quando o dono aprovar (released), a compra funciona e a instalação mantém os dados.
    ninho.release = "released";
    try {
      await ctx.db.update(themes).set({ available: true }).where(eq(themes.key, "ninho"));
      const bought = await buyTheme(ctx.db, owner, "ninho", "PIX");
      await fulfillPaidInvoice(ctx.db, await markInvoicePaid(ctx.db, bought.invoiceId));
      expect((await ctx.db.select().from(entitlements).where(and(eq(entitlements.storeId, r.storeId), eq(entitlements.key, "THEME_NINHO")))).length).toBe(1);
      await installTheme(ctx.db, owner, "ninho");
      const t = (await resolveTemplate(ctx.db, (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!, "home")).template;
      expect(Object.values(t.sections).some((s) => s.type === "hero-banner")).toBe(true);
      expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!.name).toBe("Minha Loja");
    } finally { ninho.release = "released"; }
  });
});
