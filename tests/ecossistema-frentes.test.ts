import { describe, expect, it } from "vitest";
import { CHAVES_FRENTE, FRENTES, pontes } from "@/lib/marcas/frentes";
import { comDesconto, niveisDoBusiness, nivelDoPlano, precoDoSiteParaLojista, precosDoSites, scaleTrazBusiness } from "@/lib/business/precos-frentes";
import { chaveDoModulo, modulosDe } from "@/lib/business/modulos";
import { linhasDoEcossistema } from "@/components/business/cartao-ecossistema";
import { navDoNegocio } from "@/lib/nav";
import { DEFAULT_PRICE_BOOK, priceBookSchema } from "@/lib/finance/price-book";

const planos = [
  { key: "COMMERCE_START", monthlyCents: 14_900, annualCents: 134_100 },
  { key: "COMMERCE_PRO", monthlyCents: 24_900, annualCents: 224_100 },
  { key: "COMMERCE_SCALE", monthlyCents: 49_900, annualCents: 449_100 },
];
const book = DEFAULT_PRICE_BOOK;

describe("quatro frentes (D336)", () => {
  it("quatro frentes, endereços únicos e cada uma liga às outras três", () => {
    expect(CHAVES_FRENTE).toHaveLength(4);
    expect(new Set(Object.values(FRENTES).map((f) => f.href)).size).toBe(4);
    for (const k of CHAVES_FRENTE) {
      const p = pontes(k);
      expect(p).toHaveLength(3);
      expect(p.some((f) => f.chave === k)).toBe(false);
    }
  });
  it("copy sem preço nem promessa de ganho", () => {
    const texto = JSON.stringify(FRENTES);
    expect(texto).not.toMatch(/R\$\s?\d/);
    expect(texto).not.toMatch(/garant|lucro certo|fature mais/i);
  });
});

describe("preços das frentes (tabela do Master)", () => {
  it("Sites Start da tabela; Pro e Scale iguais aos planos da loja; anual na mesma proporção", () => {
    const s = precosDoSites(book, planos);
    expect(s.START).toEqual({ monthlyCents: 7_900, annualCents: 71_100 });
    expect(s.PRO).toEqual({ monthlyCents: 24_900, annualCents: 224_100 });
    expect(s.SCALE?.monthlyCents).toBe(49_900);
  });
  it("site para quem tem loja: Sites do mesmo nível com 50% de desconto", () => {
    expect(precoDoSiteParaLojista(book, planos, "COMMERCE_START").monthlyCents).toBe(3_950);
    expect(precoDoSiteParaLojista(book, planos, "COMMERCE_PRO").monthlyCents).toBe(12_450);
    expect(precoDoSiteParaLojista(book, planos, "COMMERCE_SCALE").annualCents).toBe(224_550);
    expect(precoDoSiteParaLojista(book, planos, null).nivel).toBe("START");
  });
  it("desconto fica entre 0 e 100%", () => {
    expect(comDesconto(10_000, 5000)).toBe(5_000);
    expect(comDesconto(10_000, 20_000)).toBe(0);
    expect(comDesconto(10_000, -5)).toBe(10_000);
  });
  it("níveis do Business vêm da tabela; Scale traz o Essencial", () => {
    expect(niveisDoBusiness(book).map((n) => n.monthlyCents)).toEqual([19_900, 49_900, 99_900]);
    expect(nivelDoPlano("COMMERCE_PRO")).toBe("PRO");
    expect(scaleTrazBusiness("COMMERCE_SCALE")).toBe(true);
    expect(scaleTrazBusiness("COMMERCE_PRO")).toBe(false);
  });
  it("tabela salva antes das frentes continua valendo, com os valores padrão", () => {
    const antiga: Record<string, unknown> = { ...DEFAULT_PRICE_BOOK }; delete antiga.frentes;
    const r = priceBookSchema.safeParse(antiga);
    expect(r.success).toBe(true);
    expect(r.success && r.data.frentes.sitesStartCents).toBe(7_900);
  });
});

describe("Business no painel", () => {
  const base = { marca: "NEXTLEVEL_COMMERCE", formato: "LOJA" as const, direitos: new Set<string>(), ligado: true };
  it("Scale liga o Business; direito também; chave desligada não", () => {
    expect(modulosDe({ ...base, plano: "COMMERCE_SCALE" }).ativos.has("business")).toBe(true);
    expect(modulosDe({ ...base, plano: "COMMERCE_PRO" }).ativos.has("business")).toBe(false);
    expect(modulosDe({ ...base, direitos: new Set([chaveDoModulo("business")]) }).ativos.has("business")).toBe(true);
    expect(modulosDe({ ...base, ligado: false, plano: "COMMERCE_SCALE" }).ativos.has("business")).toBe(false);
  });
  it("cartão do ecossistema: o que está ligado e o próximo passo", () => {
    const l = linhasDoEcossistema({ temSite: false, temLoja: true, temBusiness: false, formato: "LOJA" });
    expect(l.map((x) => x.estado)).toEqual(["ligado", "ligar", "ligar", "servico"]);
    expect(l[1]!.acao?.href).toBe("/merchant/negocio/plano#site");
  });
  it("menu: NextLevel Business com cadeado para quem não tem, e a ponte para a equipe", () => {
    const sem = navDoNegocio({ ativos: new Set(["loja"]) }, "Meu negócio");
    expect(sem.find((i) => i.label === "NextLevel Business")).toMatchObject({ locked: true });
    const com = navDoNegocio({ ativos: new Set(["loja", "business"]) }, "Meu negócio");
    expect(com.find((i) => i.label === "NextLevel Business")?.locked).toBeUndefined();
    expect(com.some((i) => i.href === "/merchant/services")).toBe(true);
  });
});

describe("Sites Start na assinatura (D336)", () => {
  it("caminho Site no Start paga o Sites Start; ao ligar a loja, passa ao Start da loja", async () => {
    const { freshDb } = await import("./setup");
    const { signupMember } = await import("@/lib/domain/store-access");
    const { subscriptionOf } = await import("@/lib/domain/commerce-plans");
    const { ligarLojaVirtual } = await import("@/lib/business/planos");
    const { savePriceBook } = await import("@/lib/domain/finance");
    const ctx = await freshDb();
    // Banco de teste tem o Start da loja a R$ 57: o Sites Start da tabela fica abaixo dele.
    await savePriceBook(ctx.db, { ...DEFAULT_PRICE_BOOK, frentes: { ...DEFAULT_PRICE_BOOK.frentes, sitesStartCents: 3_900 } }, "usr_teste");
    const r = await signupMember(ctx.db, { storeName: "Vidraçaria Start", ownerName: "Rita Lima", email: "rita@start.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, formato: "SITE", plan: "COMMERCE_START", cycle: "MONTHLY" });
    expect((await subscriptionOf(ctx.db, r.storeId))?.amountCents).toBe(3_900);
    process.env.BUSINESS_V1 = "true";
    try {
      const ator = { userId: r.userId, role: "STORE_OWNER" as const, organizationId: "x", supplierId: null, storeId: r.storeId };
      expect((await ligarLojaVirtual(ctx.db, ator)).nova).toBe(true);
      const sub = await subscriptionOf(ctx.db, r.storeId);
      expect(sub?.productKey).toBe("COMMERCE_START");
      expect(sub!.amountCents).toBeGreaterThan(3_900);
      // Loja no Start comum (não Site) continua com o preço do catálogo.
      const l = await signupMember(ctx.db, { storeName: "Moda Start", ownerName: "Ana Lima", email: "ana@start.com.br", password: "senha-segura-1", taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_START", cycle: "MONTHLY" });
      expect((await subscriptionOf(ctx.db, l.storeId))?.amountCents).toBe(sub!.amountCents);
    } finally { delete process.env.BUSINESS_V1; }
  });
});
