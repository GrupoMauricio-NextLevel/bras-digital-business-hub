import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { orders, products, storeVisitsDaily } from "@/db/schema";
import {
  aparelhoDe, conversao, diaDeBrasilia, ehRobo, origemDe, origemDoPedido, produtoDaPagina, registrarVisita, resumoDeVisitas, vendasPorOrigem,
} from "@/lib/domain/visitas";
import { exportStoreCsv } from "@/lib/domain/privacy";

/** W2 das melhorias (D185): visitas sem cookie, conversão, mais visitados, origem das vendas e planilha. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const CEL = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

describe("quem conta e como", () => {
  it("robôs e ferramentas não contam; aparelho pelo navegador", () => {
    expect(ehRobo("Googlebot/2.1")).toBe(true);
    expect(ehRobo("facebookexternalhit/1.1")).toBe(true);
    expect(ehRobo("Mozilla/5.0 HeadlessChrome/120")).toBe(true);
    expect(ehRobo(null)).toBe(true);
    expect(ehRobo(CEL)).toBe(false);
    expect(aparelhoDe(CEL)).toBe("MOBILE");
    expect(aparelhoDe(PC)).toBe("DESKTOP");
    expect(aparelhoDe("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("TABLET");
  });

  it("origem: campanha primeiro, depois o site de onde veio, senão direto", () => {
    expect(origemDe({ utmSource: "Instagram", referrer: "https://www.google.com/" })).toBe("instagram");
    expect(origemDe({ referrer: "https://www.google.com.br/search?q=x" })).toBe("google");
    expect(origemDe({ referrer: "https://l.instagram.com/?u=x" })).toBe("instagram");
    expect(origemDe({ referrer: "https://wa.me/551199" })).toBe("whatsapp");
    expect(origemDe({ referrer: "https://minhaloja.com.br/produto", hostDaLoja: "minhaloja.com.br" })).toBe("direto");
    expect(origemDe({})).toBe("direto");
    expect(origemDe({ utmSource: "<script>" })).toBe("script");
  });

  it("dia no fuso de Brasília", () => {
    expect(diaDeBrasilia(new Date("2026-10-28T02:00:00Z"))).toBe("2026-10-27");
  });
});

describe("contagem e resumo", () => {
  it("soma por dia, produto, origem e aparelho; hoje e mais visitados", async () => {
    const storeId = ctx.seed.stores.arena.id;
    const [p] = await ctx.db.select().from(products).where(eq(products.id, ctx.seed.productIds[0]!));
    const agora = new Date("2026-10-27T15:00:00Z");
    const produto = await produtoDaPagina(ctx.db, storeId, `/store/x/product/${p!.slug}`);
    expect(produto).toBe(p!.id);
    expect(await produtoDaPagina(ctx.db, storeId, "/store/x/catalog")).toBe("");
    for (let i = 0; i < 3; i++) await registrarVisita(ctx.db, { storeId, productId: produto, source: "instagram", device: "MOBILE" }, agora);
    await registrarVisita(ctx.db, { storeId, source: "direto", device: "DESKTOP" }, agora);
    await registrarVisita(ctx.db, { storeId, source: "google", device: "DESKTOP" }, new Date("2026-10-26T15:00:00Z"));
    expect((await ctx.db.select().from(storeVisitsDaily).where(eq(storeVisitsDaily.storeId, storeId))).length).toBe(3);
    const r = await resumoDeVisitas(ctx.db, storeId, 30, agora);
    expect(r.total).toBe(5);
    expect(r.hoje).toBe(4);
    expect(r.maisVisitados[0]).toMatchObject({ productId: p!.id, name: p!.name, views: 3 });
    expect(r.porOrigem[0]).toMatchObject({ source: "instagram", views: 3 });
    expect(r.porAparelho.find((x) => x.device === "MOBILE")?.views).toBe(3);
    // Outra loja não vê.
    expect((await resumoDeVisitas(ctx.db, ctx.seed.stores.mantos.id, 30, agora)).total).toBe(0);
  });

  it("conversão não inventa número sem visita", () => {
    expect(conversao(3, 0)).toBeNull();
    expect(conversao(3, 200)).toBe(1.5);
  });
});

describe("origem das vendas", () => {
  it("aparelho e campanha do checkout; vendas pagas agrupadas no período", () => {
    expect(origemDoPedido(CEL, { source: " Instagram ", campaign: "black-friday" })).toEqual({ device: "MOBILE", utmSource: "instagram", utmMedium: null, utmCampaign: "black-friday" });
    expect(origemDoPedido(PC, undefined)).toMatchObject({ device: "DESKTOP", utmSource: null });
    const agora = new Date("2026-10-27T12:00:00Z");
    const base = { status: "READY_TO_PICK", subtotalCents: 10000, discountCents: 0, channel: "ONLINE_STORE", createdAt: "2026-10-20T10:00:00Z" };
    const r = vendasPorOrigem([
      { ...base, customerPaymentStatus: "PAID", utmSource: "instagram", device: "MOBILE" },
      { ...base, customerPaymentStatus: "PAID", utmSource: "instagram", device: "MOBILE", discountCents: 1000 },
      { ...base, customerPaymentStatus: "PAID", utmSource: null, device: "DESKTOP" },
      { ...base, customerPaymentStatus: "PENDING", utmSource: "google", device: "DESKTOP" },
      { ...base, customerPaymentStatus: "PAID", utmSource: "google", device: "DESKTOP", createdAt: "2026-08-01T10:00:00Z" },
    ], 30, agora);
    expect(r.pagos).toBe(3);
    expect(r.origem[0]).toEqual({ nome: "instagram", pedidos: 2, vendasCents: 19000 });
    expect(r.origem.map((o) => o.nome)).toContain("sem campanha");
    expect(r.aparelho.find((a) => a.nome === "celular")?.pedidos).toBe(2);
  });

  it("planilha de pedidos ganha origem, aparelho e rastreio no fim, só da própria loja", async () => {
    const [o] = await ctx.db.select().from(orders).where(eq(orders.storeId, ctx.seed.stores.mantos.id)).limit(1);
    await ctx.db.update(orders).set({ utmSource: "instagram", device: "MOBILE" }).where(eq(orders.id, o!.id));
    const csv = await exportStoreCsv(ctx.db, ctx.actors.mantos, "orders");
    const [cabecalho, ...linhas] = csv.trim().split("\n");
    expect(cabecalho).toBe("numero,data,status,pagamento,cliente,email,telefone,total_centavos,origem,aparelho,rastreio,cidade,uf");
    expect(linhas.some((l) => l.includes('"instagram","MOBILE"'))).toBe(true);
    const arena = (await ctx.db.select().from(orders).where(eq(orders.storeId, ctx.seed.stores.arena.id))).map((x) => x.customerEmail);
    const mantos = (await ctx.db.select().from(orders).where(eq(orders.storeId, ctx.seed.stores.mantos.id))).map((x) => x.customerEmail);
    expect(linhas.length).toBe(mantos.length);
    expect(arena.filter((e) => !mantos.includes(e)).some((e) => csv.includes(e))).toBe(false);
  });
});
