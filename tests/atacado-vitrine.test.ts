import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { financeInvoices, orders, products, productVariants, storeProducts, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { toPublicProduct } from "@/lib/queries/storefront";
import { aPartirDe, atacadoAtivo, corDoPacote, degrauDoModo, escadaDePreco, gatilhosDoProduto, type ProdutoDaVitrine } from "@/lib/finance/atacado-vitrine";
import { precoDoCarrinho, type RegraMix } from "@/lib/finance/atacado-preco";
import { priceCartLines, type CartLine } from "@/components/storefront/cart-context";
import { formatBRL } from "@/lib/money";

const base: ProdutoDaVitrine = {
  priceCents: 3990, atacadoCents: 2990, categoryId: "moda", sellsUnit: true, sellsPack: true,
  tiers: [{ minQty: 3, priceCents: 3490 }],
  packs: [{ id: "g12", name: "Grade de 12", kind: "GRADE_FECHADA", colorMode: "SORTIDA", color: null, totalQuantity: 12, priceCents: 32_280, available: 4 }],
};
const mix6: RegraMix = { kind: "MIX_PECAS", minPieces: 6 };

describe("vitrine do atacado (puro)", () => {
  it("escada: varejo, faixa do modelo, atacado (só com regra) e grade por peça", () => {
    const e = escadaDePreco(base, [mix6], formatBRL);
    expect(e.map((d) => [d.chave, d.porPecaCents])).toEqual([["VAREJO", 3990], ["FAIXA:3", 3490], ["ATACADO", 2990], ["GRADE:g12", 2690]]);
    expect(e.find((d) => d.chave === "ATACADO")!.detalhe).toBe("a partir de 6 peças na loja");
    expect(e.find((d) => d.chave === "GRADE:g12")!.detalhe).toMatch(/o lote · Cores sortidas/);
    // Sem regra de mix ninguém chega no atacado: ele não aparece (promessa honesta).
    expect(escadaDePreco(base, [], formatBRL).some((d) => d.chave === "ATACADO")).toBe(false);
    expect(atacadoAtivo(base, [])).toBe(false);
  });

  it("mix da coleção vale só para a coleção do produto", () => {
    const col: RegraMix = { kind: "MIX_CATEGORIA", minPieces: 10, categoryId: "outra" };
    expect(gatilhosDoProduto(base, [col])).toEqual([]);
    expect(gatilhosDoProduto(base, [col, { kind: "MIX_VALOR", minCents: 50_000 }])).toHaveLength(1);
    expect(escadaDePreco(base, [{ kind: "MIX_VALOR", minCents: 50_000 }], formatBRL).find((d) => d.chave === "ATACADO")!.detalhe).toBe(`a partir de ${formatBRL(50_000)} em produtos`);
  });

  it("card: menor preço por peça e o selo do formato", () => {
    expect(aPartirDe(base, [mix6])).toEqual({ porPecaCents: 2690, selo: "Grade 12" });
    expect(aPartirDe({ ...base, sellsPack: false }, [mix6])).toEqual({ porPecaCents: 2990, selo: "Mix 6 peças" });
    expect(aPartirDe({ ...base, sellsPack: false }, [])).toEqual({ porPecaCents: 3490, selo: "3+ peças" });
    expect(aPartirDe({ ...base, sellsPack: false, tiers: [] }, [])).toBeNull();
    expect(aPartirDe({ ...base, packs: [{ ...base.packs[0]!, kind: "PACOTE_SORTIDO", totalQuantity: 20, priceCents: 50_000 }] }, [mix6])!.selo).toBe("Pacote 20");
  });

  it("cor da grade e degrau atual vindo do motor", () => {
    expect(corDoPacote({ kind: "GRADE_FECHADA", colorMode: "FIXA", color: "Azul" })).toBe("Azul");
    expect(corDoPacote({ kind: "PACOTE_SORTIDO", colorMode: "FIXA", color: "Azul" })).toBe("Modelos e cores sortidos");
    const r = precoDoCarrinho([{ key: "a", productId: "p", categoryId: "moda", quantity: 3, varejoCents: 3990, atacadoCents: 2990, faixas: base.tiers }], [mix6]);
    expect(degrauDoModo(r.linhas[0]!.modo, r.linhas[0]!.unitCents, base)).toBe("FAIXA:3");
    const r6 = precoDoCarrinho([{ key: "a", productId: "p", categoryId: "moda", quantity: 6, varejoCents: 3990, atacadoCents: 2990, faixas: base.tiers }], [mix6]);
    expect(degrauDoModo(r6.linhas[0]!.modo, r6.linhas[0]!.unitCents, base)).toBe("ATACADO");
  });
});

describe("vitrine do atacado = pedido cobrado (D259)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("o carrinho montado com os dados da vitrine dá o mesmo total do pedido, inclusive com o piso subindo", async () => {
    const { salvarPrecoAtacado, salvarRegrasDeMix, salvarGrade, regrasDeAtacado } = await import("@/lib/domain/atacado");
    const r = await signupMember(ctx.db, { storeName: "Vitrine Brás", ownerName: "Ana Lima", email: "ana@vitrine.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Blusa", sku: "BL1", categoryName: "Moda", costCents: 4000, suggestedPriceCents: 10000, minimumPriceCents: 5000, sizes: [{ size: "P", initialStock: 200 }, { size: "M", initialStock: 200 }] });
    await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 10000, active: true, featured: false }).onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 10000, active: true } });
    const vs = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId));
    await salvarPrecoAtacado(ctx.db, r.storeId, productId, 7_000);
    await salvarRegrasDeMix(ctx.db, r.storeId, [{ kind: "MIX_PECAS", minPieces: 6 }]);
    await salvarGrade(ctx.db, r.storeId, productId, { name: "Grade de 4", kind: "GRADE_FECHADA", colorMode: "SORTIDA", priceCents: 24_000, items: vs.map((v) => ({ variantId: v.id, quantity: 2 })) });

    const totalNoNavegador = async (qAvulsa: number, qGrade: number) => {
      const item = (await listStoreCatalog(ctx.db, r.storeId)).find((c) => c.product.id === productId)!;
      const p = toPublicProduct(item);
      const pk = p.packs[0]!;
      expect(pk.colorMode).toBe("SORTIDA");
      const linhas: CartLine[] = [
        { key: "u", productId, variantId: vs[0]!.id, name: p.name, label: "P", unitPriceCents: p.priceCents, quantity: qAvulsa, images: [], max: 99, tiers: p.tiers, atacadoCents: p.atacadoCents, categoryId: p.categoryId },
        ...(qGrade ? [{ key: "g", productId, packId: pk.id, name: p.name, label: pk.name, unitPriceCents: pk.priceCents, quantity: qGrade, images: [], max: 99, categoryId: p.categoryId, pecasPorUnidade: pk.totalQuantity }] : []),
      ];
      return { p, total: priceCartLines(linhas, await regrasDeAtacado(ctx.db, r.storeId)).reduce((t, l) => t + l.unitPriceCents * l.quantity, 0) };
    };
    const cobrado = async (qAvulsa: number, qGrade: number) => {
      const pk = (await listStoreCatalog(ctx.db, r.storeId)).find((c) => c.product.id === productId)!.packs[0]!;
      const o = await createOrder(ctx.db, { storeId: r.storeId, customer, items: [{ productId, variantId: vs[0]!.id, quantity: qAvulsa }, ...(qGrade ? [{ productId, packId: pk.id, quantity: qGrade }] : [])], customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL", reservationMinutes: 30 });
      return (await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!.subtotalCents;
    };

    // 2 avulsas: varejo. 2 avulsas + 1 grade de 4 = 6 peças: atacado nas avulsas.
    for (const [a, g] of [[2, 0], [2, 1], [6, 0]] as const) {
      const n = await totalNoNavegador(a, g);
      expect(n.total).toBe(await cobrado(a, g));
    }
    expect((await totalNoNavegador(2, 1)).total).toBe(2 * 7_000 + 24_000);

    // O custo subiu depois: a vitrine mostra o piso (nunca o custo cru) e continua igual ao pedido.
    await ctx.db.update(products).set({ costCents: 7_500 }).where(eq(products.id, productId));
    const depois = await totalNoNavegador(6, 0);
    expect(depois.p.atacadoCents).toBe(7_500);
    expect(depois.total).toBe(await cobrado(6, 0));
    expect(Object.keys(depois.p)).not.toContain("costCents");
  });
});
