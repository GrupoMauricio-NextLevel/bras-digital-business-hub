import { newId } from "@/lib/ids";
import { nextlevelPayments } from "@/db/schema";
import { chargeInvoiceCard, connectNextLevelMp, simulateNextLevelPayment, syncNextLevelPayment } from "@/lib/domain/nextlevel-billing";
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { entitlements, financeInvoices, stores, storeThemes, themes } from "@/db/schema";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { markInvoicePaid } from "@/lib/domain/finance";
import { fulfillPaidInvoice } from "@/lib/domain/nextlevel-billing";
import { syncThemeCatalog, THEME_CATALOG } from "@/lib/themes/catalog";
import { buyTheme, installTheme, ownedThemeKeys, themeCardsFor } from "@/lib/themes/install";
import { buildPreset, presetKeys, type PresetContext } from "@/lib/themes/presets";
import { sectionSchema } from "@/lib/themes/sections";
import { listVersions, resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import { normalizeGlobals, normalizeTemplate } from "@/lib/themes/template";
import { PAGE_KINDS } from "@/lib/themes/types";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); });
const store = async (id: string) => (await ctx.db.query.stores.findFirst({ where: eq(stores.id, id) }))!;
const pay = async (invoiceId: string) => { const inv = await markInvoicePaid(ctx.db, invoiceId); await fulfillPaidInvoice(ctx.db, inv); };
const ctxp: PresetContext = { storeName: "Loja Teste", tagline: "Slogan da loja", primary: "#0f172a", accent: "#16a34a", announcement: "", footerText: "", now: new Date("2026-05-10T12:00:00Z") };

describe("catálogo de temas", () => {
  it("tem os quatro temas com os preços do dono", () => {
    expect(THEME_CATALOG.map((t) => [t.key, t.priceCents])).toEqual([["starter", 0], ["arena", 29900], ["editorial", 69900], ["signature", 149900]]);
  });
  it("a semente já traz o catálogo novo e sincronizar de novo não muda nada", async () => {
    const rows = await ctx.db.select().from(themes); expect(rows.map((r) => r.key).sort()).toEqual(["arena", "editorial", "signature", "starter"]); expect(rows.every((r) => r.available)).toBe(true);
    expect(await syncThemeCatalog(ctx.db)).toEqual([]);
  });
  it("converte os temas antigos (pro e elite) mantendo o id das lojas ligadas", async () => {
    const { db } = await freshDb(); const arena = (await db.select().from(themes).where(eq(themes.key, "arena")))[0]!;
    await db.update(themes).set({ key: "pro", name: "Pro", priceCents: 29700, tier: "PRO", available: false }).where(eq(themes.id, arena.id));
    await db.delete(themes).where(eq(themes.key, "signature")).catch(() => {});
    const log = await syncThemeCatalog(db);
    const again = (await db.select().from(themes).where(eq(themes.id, arena.id)))[0]!;
    expect(again.key).toBe("arena"); expect(again.priceCents).toBe(29900); expect(again.available).toBe(true); expect(log.join()).toContain("arena");
  });
});

describe("modelos dos temas", () => {
  it("todos são válidos, sem nenhum aviso, e só usam seções que o próprio tema inclui", () => {
    for (const key of presetKeys) {
      const p = buildPreset(key, ctxp)!;
      for (const page of PAGE_KINDS) {
        const t = p.pages[page]; expect(normalizeTemplate(t, "content", page).issues, `${key}/${page}`).toEqual([]); expect(normalizeTemplate(t, "content", page).template).toEqual(t);
        for (const s of Object.values(t.sections)) { const themesOf = sectionSchema(s.type)!.themes; if (themesOf) expect(themesOf, `${key}/${page}: ${s.type}`).toContain(key); }
      }
      expect(normalizeGlobals(p.globals).issues, key).toEqual([]);
      for (const s of [...Object.values(p.globals.header.sections), ...Object.values(p.globals.footer.sections)]) { const themesOf = sectionSchema(s.type)!.themes; if (themesOf) expect(themesOf, `${key}: ${s.type}`).toContain(key); }
      expect(p.pages.product.order.some((id) => p.pages.product.sections[id]!.type === "product-main"), key).toBe(true);
      expect(p.pages.cart.order.some((id) => p.pages.cart.sections[id]!.type === "cart-main"), key).toBe(true);
    }
  });
  it("os temas pagos têm identidade própria e os recursos prometidos", () => {
    const a = buildPreset("arena", ctxp)!, e = buildPreset("editorial", ctxp)!, s = buildPreset("signature", ctxp)!;
    expect(a.globals.header.sections.header!.settings.tone).toBe("dark"); expect(a.style.quickView).toBe(true); expect(Object.values(a.pages.home.sections).some((x) => x.type === "slideshow")).toBe(true);
    expect(Object.values(a.pages.home.sections).find((x) => x.type === "countdown")!.settings.until).toBe("2026-05-17T23:59");
    expect(e.style.headingFont).toBe("elegante"); expect(e.style.radius).toBe(0); expect(Object.values(e.pages.product.sections).some((x) => x.type === "product-tabs")).toBe(true);
    expect(Object.values(s.globals.header.sections).some((x) => x.type === "header-plus")).toBe(true); expect(s.pages.product.sections.product!.settings.stickyBuyBar).toBe(true); expect(s.style.animations).toBe(true);
    expect(s.pages.home.sections.video!.hidden).toBe(true);
  });
  it("o Starter novo usa as cores da loja e traz mais do que o tema antigo", () => {
    const p = buildPreset("starter", { ...ctxp, primary: "#7c2d12", accent: "#ca8a04" })!;
    expect(p.style).toMatchObject({ primary: "#7c2d12", accent: "#ca8a04", radius: 20 }); expect(p.pages.home.order).toContain("about"); expect(p.pages.product.sections.product!.settings.gallery).toBe("thumbs");
  });
  it("carrega o texto do destaque e o nome da loja", () => {
    const p = buildPreset("arena", { ...ctxp, hero: { title: "Título antigo", subtitle: "Sub antigo", ctaLabel: "Comprar" }, announcement: "Aviso antigo" })!;
    const slide = p.pages.home.sections.slides!; expect(slide.blocks[slide.blockOrder[0]!]!.settings.heading).toBe("Título antigo"); expect(p.globals.header.sections.announcement!.settings.text).toBe("Aviso antigo");
    expect(buildPreset("signature", ctxp)!.pages.home.sections.slides!.blocks["slide-1"]!.settings.heading).toContain("Loja Teste");
  });
});

describe("compra e instalação com 1 clique", () => {
  const A = () => ctx.actors.arena; const id = () => ctx.seed.stores.arena.id;
  it("a vitrine mostra os quatro temas, com o Starter já disponível", async () => {
    const cards = await themeCardsFor(ctx.db, A()); expect(cards.map((c) => c.key)).toEqual(["starter", "arena", "editorial", "signature"]);
    expect(cards.find((c) => c.key === "starter")!.owned).toBe(true); expect(cards.find((c) => c.key === "arena")!.owned).toBe(false); expect(cards.find((c) => c.key === "starter")!.active).toBe(true);
  });
  it("tema pago não instala sem comprar", async () => { await expect(installTheme(ctx.db, A(), "arena")).rejects.toMatchObject({ code: "THEME_NOT_OWNED" }); });
  it("gera a fatura com o preço certo e repetir devolve a mesma", async () => {
    const r = await buyTheme(ctx.db, A(), "arena"); expect(r.amountCents).toBe(26910); // Pix: R$ 299,00 com 10% de desconto
    expect((await buyTheme(ctx.db, A(), "arena")).invoiceId).toBe(r.invoiceId);
    const inv = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.id, r.invoiceId)))[0]!; expect(inv.kind).toBe("ADDON"); expect(inv.storeId).toBe(id()); expect(inv.description).toContain("Arena");
    expect((await themeCardsFor(ctx.db, A())).find((c) => c.key === "arena")!.openInvoiceId).toBe(r.invoiceId);
    await expect(buyTheme(ctx.db, A(), "starter")).rejects.toMatchObject({ code: "FREE_THEME" });
  });
  it("pago, vira licença permanente e instala publicando as quatro páginas, com histórico para voltar", async () => {
    const r = await buyTheme(ctx.db, A(), "arena"); await pay(r.invoiceId);
    const ent = (await ctx.db.select().from(entitlements).where(eq(entitlements.storeId, id()))).find((e) => e.key === "THEME_ARENA")!; expect(ent.endsAt).toBeNull();
    expect((await ownedThemeKeys(ctx.db, id())).has("arena")).toBe(true);
    const before = (await resolveGlobals(ctx.db, await store(id()))).globals;
    expect((await installTheme(ctx.db, A(), "arena")).name).toBe("Arena");
    const s = await store(id());
    const home = await resolveTemplate(ctx.db, s, "home"); expect(home.source).toBe("published"); expect(Object.values(home.template.sections).some((x) => x.type === "slideshow")).toBe(true);
    for (const page of PAGE_KINDS) expect((await resolveTemplate(ctx.db, s, page)).source).toBe("published");
    const g = await resolveGlobals(ctx.db, s); expect(g.globals.style.headingFont).toBe("condensada"); expect(s.primaryColor).toBe("#0f1c16");
    const active = await ctx.db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, id())); expect(active[0]!.key).toBe("arena");
    const versions = await listVersions(ctx.db, A(), id(), "home"); expect(versions.map((v) => v.label)).toContain("Antes de instalar Arena");
    expect(before.style.primary).not.toBe("#0f1c16");
    expect((await themeCardsFor(ctx.db, A())).find((c) => c.key === "arena")).toMatchObject({ owned: true, active: true, openInvoiceId: null });
  });
  it("o lojista pode voltar ao Starter e o tema comprado continua dele", async () => {
    await installTheme(ctx.db, A(), "starter");
    const s = await store(id()); expect((await resolveGlobals(ctx.db, s)).globals.style.headingFont).toBe("display");
    expect((await ownedThemeKeys(ctx.db, id())).has("arena")).toBe(true);
    await installTheme(ctx.db, A(), "arena");
  });
  it("cortesia do Master libera o tema sem fatura", async () => {
    const { grantEntitlement } = await import("@/lib/domain/entitlements");
    await grantEntitlement(ctx.db, { type: "STORE", storeId: ctx.seed.stores.mantos.id }, { key: "THEME_SIGNATURE", source: "COURTESY" });
    expect((await installTheme(ctx.db, ctx.actors.mantos, "signature")).name).toBe("Signature");
    const g = await resolveGlobals(ctx.db, await store(ctx.seed.stores.mantos.id)); expect(Object.values(g.globals.header.sections).some((x) => x.type === "header-plus")).toBe(true);
  });
  it("só o dono da loja compra e instala; Drop manual não tem loja; fornecedor e Master não", async () => {
    await expect(buyTheme(ctx.db, ctx.actors.supplier, "arena")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(installTheme(ctx.db, ctx.actors.master, "starter")).rejects.toBeInstanceOf(ForbiddenError);
    const drop = { userId: "u", role: "STORE_OWNER", organizationId: "o", supplierId: null, storeId: ctx.seed.stores.classics.id } as const;
    await expect(buyTheme(ctx.db, drop, "arena")).rejects.toBeInstanceOf(DomainError);
    await expect(installTheme(ctx.db, ctx.actors.arena, "inexistente")).rejects.toMatchObject({ code: expect.stringMatching(/NOT_FOUND/) });
  });

  it("cartão cobra o valor cheio (em até 6x), Pix cobra com desconto, e trocar de método recalcula a mesma fatura", async () => {
    const card = await buyTheme(ctx.db, A(), "editorial", "CARD");
    expect(card.amountCents).toBe(69900);
    const pix = await buyTheme(ctx.db, A(), "editorial", "PIX");
    expect(pix.invoiceId).toBe(card.invoiceId); expect(pix.amountCents).toBe(62910);
    const c = (await themeCardsFor(ctx.db, A())).find((x) => x.key === "editorial")!;
    expect(c.quote).toMatchObject({ listCents: 69900, pixCents: 62910, installments: 6, installmentCents: 11650 }); expect(c.openMethod).toBe("PIX");
  });
  it("pagando no cartão a licença é liberada e o tema pode ser instalado na hora", async () => {
    const r = await buyTheme(ctx.db, A(), "signature", "CARD");
    const nlp = newId("nlp");
    await ctx.db.insert(nextlevelPayments).values({ id: nlp, invoiceId: r.invoiceId, method: "CARD", mpPaymentId: `demo_${nlp}`, amountCents: r.amountCents });
    await simulateNextLevelPayment(ctx.db, A(), nlp);
    expect((await ownedThemeKeys(ctx.db, id())).has("signature")).toBe(true);
    await expect(installTheme(ctx.db, A(), "signature")).resolves.toMatchObject({ installed: true });
  });
  it("cartão em produção: cria o checkout do Mercado Pago só com crédito e até 6 parcelas e confirma pela referência", async () => {
    await connectNextLevelMp(ctx.db, ctx.actors.master, "TEST-1234567890123456789012345", async () => new Response(JSON.stringify({ id: 1, nickname: "NL" }), { status: 200 }));
    const r = await buyTheme(ctx.db, A(), "editorial", "CARD");
    let body: Record<string, unknown> = {};
    const fetchImpl = async (url: string, init?: RequestInit) => { if (url.includes("/checkout/preferences")) { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ id: "pref1", init_point: "https://mp.example/checkout" }), { status: 200 }); } return new Response("{}", { status: 200 }); };
    const out = await chargeInvoiceCard(ctx.db, A(), r.invoiceId, { fetchImpl, baseUrl: "https://app.superdrop.com.br" });
    expect(out.checkoutUrl).toBe("https://mp.example/checkout");
    const pm = body.payment_methods as { installments: number; excluded_payment_types: { id: string }[] };
    expect(pm.installments).toBe(6); expect(pm.excluded_payment_types.map((x) => x.id)).toEqual(expect.arrayContaining(["bank_transfer", "debit_card", "ticket"]));
    expect(String((body.items as { unit_price: number }[])[0]!.unit_price)).toBe("699");
    const paidFetch = async (url: string) => {
      if (url.includes("/v1/payments/search")) return new Response(JSON.stringify({ results: [{ id: 777, status: "approved" }] }), { status: 200 });
      if (url.includes("/v1/payments/777")) return new Response(JSON.stringify({ id: 777, status: "approved", external_reference: out.id, transaction_amount: 699 }), { status: 200 });
      return new Response("{}", { status: 200 });
    };
    expect((await syncNextLevelPayment(ctx.db, out.id, paidFetch)).paid).toBe(true);
    expect((await ownedThemeKeys(ctx.db, id())).has("editorial")).toBe(true);
    expect((await syncNextLevelPayment(ctx.db, out.id, paidFetch)).paid).toBe(true); // idempotente
  });
});
