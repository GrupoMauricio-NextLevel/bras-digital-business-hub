import * as React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => ({ useCart: () => ({ count: 0, ready: true, lines: [], add() {}, update() {}, remove() {}, clear() {}, subtotal: 0 }) }));
vi.mock("@/app/actions/storefront", () => ({ claimWelcomeCouponAction: async () => ({ ok: false, error: "x" }) }));
import { and, eq } from "drizzle-orm";
import { customers, marketingConsents, storeCustomers, storeDiscounts, stores } from "@/db/schema";
import { SectionList, type SectionCtx } from "@/components/storefront/sections";
import { createDiscount } from "@/lib/domain/discounts";
import { claimWelcomeCoupon, welcomeOffer } from "@/lib/domain/welcome-coupon";
import { signupMember } from "@/lib/domain/store-access";
import { CAPABILITY_LEVEL } from "@/lib/themes/levels";
import { buildPreset, type PresetContext } from "@/lib/themes/presets";
import { sectionSchema } from "@/lib/themes/sections";
import type { Template } from "@/lib/themes/types";
import { freshDb } from "./setup";

const ctxBase = (over: Partial<PresetContext> = {}): PresetContext => ({ storeName: "Loja", tagline: null, primary: "#111111", accent: "#b45309", announcement: "", footerText: "", now: new Date("2026-10-07T12:00:00Z"), ...over });
const types = (t: Template) => t.order.map((id) => t.sections[id]!.type);

describe("banners de navegação por nível (D88)", () => {
  it("nível de cada peça: cartões e cupom no N2, camadas e banner de categoria no N3, imersivo no N4", () => {
    expect(CAPABILITY_LEVEL[sectionSchema("nav-cards")!.requires!]).toBe(2);
    expect(CAPABILITY_LEVEL[sectionSchema("welcome-coupon")!.requires!]).toBe(2);
    expect(CAPABILITY_LEVEL[sectionSchema("hero-layers")!.requires!]).toBe(3);
    expect(CAPABILITY_LEVEL[sectionSchema("category-banner")!.requires!]).toBe(3);
    expect(CAPABILITY_LEVEL[sectionSchema("hero-immersive")!.requires!]).toBe(4);
    expect(sectionSchema("nav-cards")!.blocks![0]!.maxByLevel).toEqual([0, 2, 4, 4]);
  });

  it.each([["moda", ["trama", "lume", "editorial", "atelier"]], ["casa", ["lar", "ninho", "varanda", "morada"]], ["beauty", ["petala", "brilho", "aura", "musa"]], ["conecta", ["sinal", "pulso", "circuito", "orbita"]], ["atacado", ["fardo", "lote", "galpao", "porto"]]] as const)("família %s: N1 simples, N2 com cartões e cupom, N3 com camadas, N4 imersivo", (_f, [n1, n2, n3, n4]) => {
    const p = (k: string) => buildPreset(k, ctxBase({ welcomeCode: "BEMVINDO10" }))!;
    const h1 = types(p(n1).pages.home);
    for (const t of ["nav-cards", "welcome-coupon", "hero-layers", "hero-immersive"]) expect(h1, n1).not.toContain(t);
    const two = p(n2).pages.home; const nav2 = Object.values(two.sections).find((s) => s.type === "nav-cards")!;
    expect(nav2.blockOrder).toHaveLength(2); expect(types(two)).toContain("welcome-coupon");
    expect(Object.values(two.sections).find((s) => s.type === "welcome-coupon")!.settings.code).toBe("BEMVINDO10");
    const three = p(n3);
    expect(types(three.pages.home)[0]).toBe("hero-layers");
    expect(Object.values(three.pages.home.sections).find((s) => s.type === "nav-cards")!.blockOrder).toHaveLength(4);
    expect(types(three.pages.collection)[0]).toBe("category-banner");
    const four = p(n4);
    expect(types(four.pages.home)[0]).toBe("hero-immersive");
    expect(Object.values(four.pages.home.sections).find((s) => s.type === "hero-immersive")!.blockOrder).toHaveLength(3);
    expect(types(four.pages.collection)[0]).toBe("category-banner");
  });

  it("sem imagem própria, o destaque em camadas usa a foto do destaque principal (nunca fica vazio à toa)", () => {
    const media = { "moda-hero-1": { image: "/demos/h.webp", imageMobile: "/demos/hm.webp", alt: "" } };
    const s = Object.values(buildPreset("editorial", ctxBase({ media }))!.pages.home.sections).find((x) => x.type === "hero-layers")!;
    expect(s.settings.background).toBe("/demos/h.webp"); expect(s.settings.backgroundMobile).toBe("/demos/hm.webp");
    const own = { ...media, "moda-camadas-fundo": { image: "/demos/f.webp", alt: "" }, "moda-camadas-recorte": { image: "/demos/r.png", alt: "Modelo" } };
    const t = Object.values(buildPreset("editorial", ctxBase({ media: own }))!.pages.home.sections).find((x) => x.type === "hero-layers")!;
    expect(t.settings.background).toBe("/demos/f.webp"); expect(t.settings.cutout).toBe("/demos/r.png");
  });
});

const store = { id: "st_1", slug: "loja", name: "Loja" } as unknown as SectionCtx["store"];
const sctx = (over: Partial<SectionCtx> = {}): SectionCtx => ({ slug: "loja", base: "/store/loja", store, categories: [{ id: "cat_1", name: "Básicos", slug: "basicos" }], products: [], planned: {}, hero: undefined, globals: {} as SectionCtx["globals"], page: "home", now: new Date(), ...over });
const tpl = (type: string, settings: Record<string, unknown>, blocks: { type: string; settings: Record<string, unknown> }[] = []): Template => ({ v: 1, order: ["s"], sections: { s: { type, settings: settings as never, blocks: Object.fromEntries(blocks.map((b, i) => [`b${i}`, { type: b.type, settings: b.settings as never }])), blockOrder: blocks.map((_, i) => `b${i}`) } } });
const html = (t: Template, c: SectionCtx) => renderToStaticMarkup(<SectionList template={t} ctx={c} />);

describe("desenho das seções novas", () => {
  it("destaque em camadas: título com destaque, recorte, dois links e h1 na abertura", () => {
    const out = html(tpl("hero-layers", { background: "/demos/f.webp", cutout: "/demos/r.png", alt: "Modelo de costas", title: "O *básico* que virou assinatura", ctaLabel: "Comprar", link: "/catalog", secondaryLabel: "Ver lookbook", secondaryLink: "/catalog", motion: true }), sctx({ firstId: "s" }));
    expect(out).toMatch(/<h1[^>]*>O <em[^>]*>básico<\/em> que virou assinatura<\/h1>/);
    expect(out).toContain('alt="Modelo de costas"'); expect(out).toContain("/store/loja/catalog"); expect(out).toContain("Ver lookbook");
    expect(out).toContain('aria-label="O básico que virou assinatura"');
  });
  it("destaque imersivo: um texto por passo; sem JavaScript o último (com o botão) é o que aparece", () => {
    const out = html(tpl("hero-immersive", { background: "/demos/f.webp", frame1: "/demos/1.webp", frame2: "/demos/2.webp", frame3: "/demos/3.webp", ctaLabel: "Montar meu look", link: "/catalog" }, [{ type: "step", settings: { title: "Toda cidade tem um *ritmo*." } }, { type: "step", settings: { title: "Toda peça tem um motivo." } }, { type: "step", settings: { title: "Vista o seu", eyebrow: "TEMPORADA 01" } }]), sctx({ firstId: "s" }));
    expect(out).toContain('data-step="2"'); expect(out).toContain('data-immersive="off"');
    expect((out.match(/Montar meu look/g) ?? []).length).toBe(1);
    expect(out).toMatch(/<h1[^>]*>Toda cidade tem um <em/);
  });
  it("cartões de navegação levam aos endereços da loja; sem imagem nem título, não aparecem", () => {
    const out = html(tpl("nav-cards", {}, [{ type: "card", settings: { title: "Novidades", ctaLabel: "Ver", link: "/catalog?sort=newest" } }, { type: "card", settings: { title: "", image: "" } }]), sctx());
    expect(out).toContain('href="/store/loja/catalog?sort=newest"'); expect((out.match(/data-nav-card/g) ?? []).length).toBe(1);
  });
  it("banner da categoria: mostra o da categoria aberta (por id ou endereço) e o geral em todos os produtos", () => {
    const t = tpl("category-banner", {}, [{ type: "banner", settings: { category: "", image: "/demos/g.webp", title: "Toda a coleção" } }, { type: "banner", settings: { category: "basicos", image: "/demos/b.webp", subtitle: "Algodão que não deforma" } }]);
    const open = html(t, sctx({ page: "collection", categoryId: "cat_1" }));
    expect(open).toContain("Básicos"); expect(open).toContain("Algodão que não deforma"); expect(open).not.toContain("Toda a coleção");
    expect(html(t, sctx({ page: "collection", categoryId: null }))).toContain("Toda a coleção");
  });
  it("cupom de boas-vindas só aparece com cupom válido; o código nunca vai para a página", () => {
    const t = tpl("welcome-coupon", { code: "SEGREDO10", title: "Bem-vindo" });
    expect(html(t, sctx({ welcome: null }))).not.toMatch(/data-welcome|Bem-vindo/);
    const prev = html(t, sctx({ welcome: { label: "10% de desconto", minText: null }, editing: true }));
    expect(prev).toContain("10% de desconto"); expect(prev).not.toContain("SEGREDO10");
  });
});

describe("cupom de boas-vindas (domínio)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>; let storeId: string;
  beforeAll(async () => {
    ctx = await freshDb();
    storeId = (await signupMember(ctx.db, { storeName: "Loja Cupom", ownerName: "Ana", email: "ana-cupom@exemplo.com", password: "senha-forte-123", taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" })).storeId;
    await createDiscount(ctx.db, storeId, { code: "BEMVINDO10", kind: "PERCENT", value: 10, minSubtotalCents: 10000 });
  }, 120_000);

  it("oferece só cupom ativo, no prazo e com uso sobrando", async () => {
    const offer = (await welcomeOffer(ctx.db, storeId, "bemvindo10"))!;
    expect(offer.label).toBe("10% de desconto"); expect(offer.minText).toMatch(/^Em compras a partir de R\$\s100,00\.$/);
    expect(await welcomeOffer(ctx.db, storeId, "NAOEXISTE")).toBeNull();
    await ctx.db.update(storeDiscounts).set({ active: false }).where(eq(storeDiscounts.storeId, storeId));
    expect(await welcomeOffer(ctx.db, storeId, "BEMVINDO10")).toBeNull();
    await ctx.db.update(storeDiscounts).set({ active: true, maxRedemptions: 1, redemptions: 1 }).where(eq(storeDiscounts.storeId, storeId));
    expect(await welcomeOffer(ctx.db, storeId, "BEMVINDO10")).toBeNull();
    await ctx.db.update(storeDiscounts).set({ maxRedemptions: null, redemptions: 0 }).where(eq(storeDiscounts.storeId, storeId));
  });

  it("sem consentimento não entrega; com consentimento grava o contato uma vez só", async () => {
    await expect(claimWelcomeCoupon(ctx.db, storeId, "BEMVINDO10", { email: "cli@exemplo.com", consent: false as never })).rejects.toThrow();
    await expect(claimWelcomeCoupon(ctx.db, storeId, "BEMVINDO10", { email: "nao-e-email", consent: true })).rejects.toThrow();
    const r = await claimWelcomeCoupon(ctx.db, storeId, "BEMVINDO10", { email: "Cli@Exemplo.com", consent: true });
    expect(r).toMatchObject({ code: "BEMVINDO10", demo: false });
    await claimWelcomeCoupon(ctx.db, storeId, "BEMVINDO10", { email: "cli@exemplo.com", consent: true });
    const cus = (await ctx.db.select().from(customers).where(eq(customers.email, "cli@exemplo.com")));
    expect(cus).toHaveLength(1);
    const sc = await ctx.db.select().from(storeCustomers).where(and(eq(storeCustomers.storeId, storeId), eq(storeCustomers.customerId, cus[0]!.id)));
    expect(sc).toHaveLength(1); expect(sc[0]!.tags).toEqual(["cupom-boas-vindas"]); expect(sc[0]!.ordersCount).toBe(0);
    const consents = await ctx.db.select().from(marketingConsents).where(eq(marketingConsents.storeCustomerId, sc[0]!.id));
    expect(consents).toHaveLength(1); expect(consents[0]).toMatchObject({ purpose: "EMAIL_MARKETING", source: "WELCOME_COUPON" });
  });

  it("loja de demonstração mostra o código sem guardar contato", async () => {
    await ctx.db.update(stores).set({ showcaseTheme: "lume" }).where(eq(stores.id, storeId));
    try {
      const r = await claimWelcomeCoupon(ctx.db, storeId, "BEMVINDO10", { email: "visitante@exemplo.com", consent: true });
      expect(r.demo).toBe(true);
      expect(await ctx.db.select().from(customers).where(eq(customers.email, "visitante@exemplo.com"))).toHaveLength(0);
    } finally { await ctx.db.update(stores).set({ showcaseTheme: null }).where(eq(stores.id, storeId)); }
  });
});
