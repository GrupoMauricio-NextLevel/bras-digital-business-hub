import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { financeInvoices, orders, productVariants, storeProducts, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { faltaParaMix, precoDaFaixa, precoDoCarrinho, type LinhaPreco, type RegraMix } from "@/lib/finance/atacado-preco";
import { priceCartLines, type CartLine } from "@/components/storefront/cart-context";

/** Motor único de preço do atacado (AT0, D257). */
describe("motor de preço do atacado (puro)", () => {
  const avulsa = (k: string, p: string, q: number, extra: Partial<LinhaPreco> = {}): LinhaPreco => ({ key: k, productId: p, quantity: q, varejoCents: 10_000, atacadoCents: 7_000, pisoCents: 5_000, ...extra });

  it("sem regra: idêntico ao preço por quantidade (faixa do modelo, grade com preço próprio)", () => {
    const faixas = [{ minQty: 6, priceCents: 9_000 }, { minQty: 12, priceCents: 8_000 }];
    const r = precoDoCarrinho([avulsa("a", "P1", 4, { faixas }), avulsa("b", "P1", 3, { faixas }), { key: "g", productId: "P2", packId: "G", pecasPorUnidade: 12, quantity: 1, varejoCents: 90_000 }]);
    expect(r.linhas.map((l) => [l.unitCents, l.modo])).toEqual([[9_000, "FAIXA"], [9_000, "FAIXA"], [90_000, "GRADE"]]);
    expect(r.atacadoGeral).toBe(false);
    expect(r.pecas).toBe(19);
  });

  it("mix da loja toda (peças): liberou, todas as avulsas vão ao atacado; caiu abaixo, volta ao varejo", () => {
    const regras: RegraMix[] = [{ kind: "MIX_PECAS", minPieces: 6 }];
    const ok = precoDoCarrinho([avulsa("a", "P1", 2), avulsa("b", "P2", 2), avulsa("c", "P3", 2)], regras);
    expect(ok.linhas.every((l) => l.modo === "ATACADO" && l.unitCents === 7_000)).toBe(true);
    expect(ok.economiaCents).toBe(6 * 3_000);
    const falta = precoDoCarrinho([avulsa("a", "P1", 2), avulsa("b", "P2", 2), avulsa("c", "P3", 1)], regras);
    expect(falta.linhas.every((l) => l.modo === "VAREJO")).toBe(true);
    expect(faltaParaMix(falta.mix[0]!, (c) => `R$ ${c / 100}`)).toBe("Faltam 1 peça para o preço de atacado em tudo");
  });

  it("as peças da grade contam para o mix e liberam o atacado nas avulsas", () => {
    const r = precoDoCarrinho([{ key: "g", productId: "P9", packId: "G", pecasPorUnidade: 12, quantity: 1, varejoCents: 90_000 }, avulsa("a", "P1", 1)], [{ kind: "MIX_PECAS", minPieces: 6 }]);
    expect(r.linhas[1]).toMatchObject({ modo: "ATACADO", unitCents: 7_000 });
  });

  it("mix por valor usa o subtotal de varejo; mix por coleção vale só para a coleção", () => {
    const v = precoDoCarrinho([avulsa("a", "P1", 3)], [{ kind: "MIX_VALOR", minCents: 30_000 }]);
    expect(v.linhas[0]!.unitCents).toBe(7_000);
    const c = precoDoCarrinho([avulsa("a", "P1", 6, { categoryId: "JEANS" }), avulsa("b", "P2", 1, { categoryId: "BLUSAS" })], [{ kind: "MIX_CATEGORIA", minPieces: 6, categoryId: "JEANS" }]);
    expect(c.linhas.map((l) => l.modo)).toEqual(["ATACADO", "VAREJO"]);
    expect(c.atacadoGeral).toBe(false);
  });

  it("cliente aprovado vê o atacado; nunca abaixo do piso nem acima do varejo; sem preço de atacado fica a faixa", () => {
    expect(precoDoCarrinho([avulsa("a", "P1", 1)], [], { clienteAtacado: true }).linhas[0]!.unitCents).toBe(7_000);
    expect(precoDoCarrinho([avulsa("a", "P1", 1, { atacadoCents: 3_000 })], [], { clienteAtacado: true }).linhas[0]!.unitCents).toBe(5_000);
    expect(precoDoCarrinho([avulsa("a", "P1", 1, { atacadoCents: 12_000 })], [], { clienteAtacado: true }).linhas[0]!.unitCents).toBe(10_000);
    expect(precoDoCarrinho([avulsa("a", "P1", 6, { atacadoCents: null, faixas: [{ minQty: 6, priceCents: 9_500 }] })], [{ kind: "MIX_PECAS", minPieces: 2 }]).linhas[0]!.unitCents).toBe(9_500);
  });

  it("propriedade: 500 carrinhos aleatórios — navegador = motor; sem regra = faixa antiga; preço entre piso e varejo", () => {
    let seed = 7; const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % n; };
    for (let i = 0; i < 500; i++) {
      const linhas: CartLine[] = Array.from({ length: 1 + rnd(5) }, (_, k) => {
        const pack = rnd(5) === 0;
        const varejo = 2_000 + rnd(20_000);
        return { key: `k${k}`, productId: `P${rnd(3)}`, packId: pack ? "G" : undefined, pecasPorUnidade: pack ? 12 : 1, name: "x", label: "x", unitPriceCents: varejo, quantity: 1 + rnd(8), images: [], max: 99,
          tiers: rnd(2) ? [{ minQty: 3, priceCents: Math.round(varejo * 0.9) }] : undefined, atacadoCents: rnd(2) ? Math.round(varejo * 0.7) : null, categoryId: rnd(2) ? "C1" : "C2", pisoCents: Math.round(varejo * 0.5) };
      });
      const regras: RegraMix[] = rnd(2) ? [{ kind: "MIX_PECAS", minPieces: 1 + rnd(20) }] : [];
      const motor = precoDoCarrinho(linhas.map((l) => ({ key: l.key, productId: l.productId, categoryId: l.categoryId, packId: l.packId, pecasPorUnidade: l.pecasPorUnidade, quantity: l.quantity, varejoCents: l.unitPriceCents, atacadoCents: l.atacadoCents, faixas: l.tiers, pisoCents: l.pisoCents })), regras);
      const nav = priceCartLines(linhas, regras);
      expect(nav.reduce((t, l) => t + l.unitPriceCents * l.quantity, 0)).toBe(motor.subtotalCents);
      linhas.forEach((l, j) => {
        const u = motor.linhas[j]!.unitCents;
        expect(u).toBeLessThanOrEqual(l.unitPriceCents);
        if (!l.packId) expect(u).toBeGreaterThanOrEqual(Math.min(l.unitPriceCents, l.pisoCents!));
        if (!regras.length && !l.packId) {
          const qtd = linhas.filter((x) => !x.packId && x.productId === l.productId).reduce((t, x) => t + x.quantity, 0);
          expect(u).toBe(Math.max(precoDaFaixa(l.unitPriceCents, l.tiers, qtd), Math.min(l.unitPriceCents, l.pisoCents!)));
        }
      });
    }
  });
});

describe("atacado na loja: pedido, proposta e regras", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  async function independente() {
    const r = await signupMember(ctx.db, { storeName: "Atacado Brás", ownerName: "Maria Souza", email: "maria@atacado.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const novo = async (sku: string) => {
      const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: `Peça ${sku}`, sku, categoryName: "Moda", costCents: 4000, suggestedPriceCents: 10000, minimumPriceCents: 5000, sizes: [{ size: "M", initialStock: 100 }] });
      await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 10000, active: true, featured: false }).onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 10000, active: true } });
      return { productId, variantId: (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id };
    };
    return { ...r, a: await novo("A1"), b: await novo("B1") };
  }
  const pedir = (storeId: string, items: { productId: string; variantId: string; quantity: number }[]) => createOrder(ctx.db, { storeId, customer, items, customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL", reservationMinutes: 30 });
  const subtotal = async (orderId: string) => (await ctx.db.query.orders.findFirst({ where: eq(orders.id, orderId) }))!.subtotalCents;

  it("preço de atacado validado; mix de 6 peças da loja toda vale no pedido e na proposta", async () => {
    const { salvarPrecoAtacado, salvarRegrasDeMix } = await import("@/lib/domain/atacado");
    const { createProposal } = await import("@/lib/domain/proposals");
    const s = await independente();
    await expect(salvarPrecoAtacado(ctx.db, s.storeId, s.a.productId, 3_000)).rejects.toThrow(/abaixo do custo/);
    await expect(salvarPrecoAtacado(ctx.db, s.storeId, s.a.productId, 10_000)).rejects.toThrow(/menor que o de varejo/);
    await salvarPrecoAtacado(ctx.db, s.storeId, s.a.productId, 7_000);
    await salvarPrecoAtacado(ctx.db, s.storeId, s.b.productId, 8_000);
    await expect(salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_PECAS", minPieces: 6 }, { kind: "MIX_PECAS", minPieces: 8 }])).rejects.toThrow(/duas regras/);
    await salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_PECAS", minPieces: 6 }]);
    expect(await subtotal((await pedir(s.storeId, [{ ...s.a, quantity: 3 }, { ...s.b, quantity: 2 }])).orderId)).toBe(5 * 10_000);
    expect(await subtotal((await pedir(s.storeId, [{ ...s.a, quantity: 3 }, { ...s.b, quantity: 3 }])).orderId)).toBe(3 * 7_000 + 3 * 8_000);
    const p = await createProposal(ctx.db, s.storeId, { customer: { name: "Cliente Atacado", email: "at@x.com" }, items: [{ ...s.a, quantity: 3 }, { ...s.b, quantity: 3 }] });
    expect((await ctx.db.query.proposals.findFirst({ where: (t, { eq: e }) => e(t.token, p.token) }))!.subtotalCents).toBe(45_000);
  });

  it("SuperDrop (loja de rede) não tem atacado: sem regras, sem preço de atacado, pedido igual a antes", async () => {
    const { regrasDeAtacado, salvarPrecoAtacado, salvarRegrasDeMix } = await import("@/lib/domain/atacado");
    const rede = ctx.seed.stores.mantos.id;
    await expect(salvarRegrasDeMix(ctx.db, rede, [{ kind: "MIX_PECAS", minPieces: 2 }])).rejects.toThrow(/rede/);
    await expect(salvarPrecoAtacado(ctx.db, rede, ctx.seed.productIds[11]!, 1_000)).rejects.toThrow(/rede/);
    expect(await regrasDeAtacado(ctx.db, rede)).toEqual([]);
  });
});

describe("AT1: travas por plano e grades (D258)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  async function loja() {
    const r = await signupMember(ctx.db, { storeName: "Grade Brás", ownerName: "Maria Souza", email: "maria@grade.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Camiseta", sku: "CAM", categoryName: "Moda", costCents: 2000, suggestedPriceCents: 5000, minimumPriceCents: 2500, sizes: [{ size: "P", initialStock: 100 }, { size: "M", initialStock: 100 }, { size: "G", initialStock: 100 }] });
    const vs = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(productVariants.position);
    return { storeId: r.storeId, productId, vs };
  }
  const plano = async (storeId: string, key: string) => {
    const { nlSubscriptions } = await import("@/db/schema");
    const sub = await ctx.db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, storeId) });
    if (sub) await ctx.db.update(nlSubscriptions).set({ productKey: key, status: "active" }).where(eq(nlSubscriptions.storeId, storeId));
    else {
      const { catalogPriceVersions } = await import("@/db/schema");
      const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog"); await ensureCatalogSeed(ctx.db);
      const pv = (await ctx.db.select({ id: catalogPriceVersions.id }).from(catalogPriceVersions).limit(1))[0]!.id;
      await ctx.db.insert(nlSubscriptions).values({ id: `sub-${storeId}`, storeId, productKey: key, cycle: "MONTHLY", status: "active", priceVersionId: pv, amountCents: 5700, platformFeeBps: 0 });
    }
  };

  it("Start: 1 regra só de peças, 1 grade por produto, 3 faixas; Pro libera valor, pacote e 4 grades", async () => {
    const { salvarRegrasDeMix, salvarGrade, limitesDeAtacado } = await import("@/lib/domain/atacado");
    const { setPriceTiers } = await import("@/lib/domain/price-tiers");
    const s = await loja();
    await plano(s.storeId, "COMMERCE_START");
    expect((await limitesDeAtacado(ctx.db, s.storeId)).plano).toBe("Start");
    await expect(salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_VALOR", minCents: 30_000 }])).rejects.toThrow(/plano Pro/);
    await expect(salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_PECAS", minPieces: 6 }, { kind: "MIX_VALOR", minCents: 30_000 }])).rejects.toThrow(/até 1 regra/);
    await salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_PECAS", minPieces: 6 }]);
    await expect(setPriceTiers(ctx.db, s.storeId, s.productId, [{ minQty: 3, priceCents: 4800 }, { minQty: 6, priceCents: 4600 }, { minQty: 9, priceCents: 4400 }, { minQty: 12, priceCents: 4200 }])).rejects.toThrow(/até 3 faixas/);
    const itens = (q: number[]) => s.vs.map((v, i) => ({ variantId: v.id, quantity: q[i]! }));
    await expect(salvarGrade(ctx.db, s.storeId, s.productId, { name: "Grade 12", priceCents: 12 * 2000, items: itens([4, 4, 4]) })).rejects.toThrow(/abaixo do custo/);
    await salvarGrade(ctx.db, s.storeId, s.productId, { name: "Grade 12", priceCents: 12 * 4000, items: itens([3, 5, 4]) });
    await expect(salvarGrade(ctx.db, s.storeId, s.productId, { name: "Grade 6", priceCents: 6 * 4200, items: itens([2, 2, 2]) })).rejects.toThrow(/até 1 grade/);
    await expect(salvarGrade(ctx.db, s.storeId, s.productId, { name: "Pacote", kind: "PACOTE_SORTIDO", priceCents: 30_000, items: itens([0, 10, 0]) })).rejects.toThrow(/Pro/);
    await plano(s.storeId, "COMMERCE_PRO");
    await salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_PECAS", minPieces: 6 }, { kind: "MIX_VALOR", minCents: 30_000 }]);
    await salvarGrade(ctx.db, s.storeId, s.productId, { name: "Grade 6", colorMode: "SORTIDA", priceCents: 6 * 4200, items: itens([2, 2, 2]) });
    await expect(salvarRegrasDeMix(ctx.db, s.storeId, [{ kind: "MIX_CATEGORIA", minPieces: 6, categoryId: "x" }])).rejects.toThrow(/Scale/);
  });

  it("cada grade com o próprio preço no pedido; remover grade vendida é recusado", async () => {
    const { salvarGrade, removerGrade } = await import("@/lib/domain/atacado");
    const s = await loja();
    await plano(s.storeId, "COMMERCE_PRO");
    const itens = (q: number[]) => s.vs.map((v, i) => ({ variantId: v.id, quantity: q[i]! }));
    const g12 = await salvarGrade(ctx.db, s.storeId, s.productId, { name: "Grade 12", priceCents: 48_000, items: itens([3, 5, 4]) });
    const g6 = await salvarGrade(ctx.db, s.storeId, s.productId, { name: "Grade 6", priceCents: 25_200, items: itens([2, 2, 2]) });
    const o = await createOrder(ctx.db, { storeId: s.storeId, customer, items: [{ productId: s.productId, packId: g12, quantity: 1 }, { productId: s.productId, packId: g6, quantity: 2 }], customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL", reservationMinutes: 30 });
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!.subtotalCents).toBe(48_000 + 2 * 25_200);
    await expect(removerGrade(ctx.db, s.storeId, s.productId, g12)).rejects.toThrow(/já foi vendida/);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// AT3 (D268): grade livre (mínimo por modelo e múltiplos) e cores (matriz cor × tamanho)
// ---------------------------------------------------------------------------------------------------------------------
import { conferirModelo, pendenciasDoCarrinho, rotuloDaVariacao, temRegraDoModelo, textoDaRegra } from "@/lib/finance/atacado-modelo";

describe("AT3: grade livre (puro)", () => {
  it("mínimo do modelo e múltiplos: quanto falta para fechar", () => {
    expect(conferirModelo({ minimo: 12, multiplo: 1 }, 0)).toMatchObject({ ok: true, falta: 0 });
    expect(conferirModelo({ minimo: 12, multiplo: 1 }, 8)).toMatchObject({ ok: false, falta: 4, mensagem: "Mínimo de 12 peças deste modelo: faltam 4 peças" });
    expect(conferirModelo({ minimo: 12, multiplo: 1 }, 13)).toMatchObject({ ok: true });
    expect(conferirModelo({ minimo: 0, multiplo: 6 }, 7)).toMatchObject({ ok: false, falta: 5, mensagem: "Vendido de 6 em 6: faltam 5 peças para fechar" });
    expect(conferirModelo({ minimo: 12, multiplo: 6 }, 6)).toMatchObject({ ok: false, falta: 6 });
    expect(conferirModelo({ minimo: 12, multiplo: 6 }, 18)).toMatchObject({ ok: true });
    expect(conferirModelo({ minimo: 12, multiplo: 6 }, 19)).toMatchObject({ ok: false, falta: 5 });
    for (let n = 1; n < 60; n++) { const c = conferirModelo({ minimo: 12, multiplo: 6 }, n); expect((n + c.falta) % 6).toBe(0); expect(n + c.falta).toBeGreaterThanOrEqual(12); }
    expect(temRegraDoModelo({ minimo: 0, multiplo: 1 })).toBe(false);
    expect(textoDaRegra({ minimo: 12, multiplo: 6 })).toBe("Mínimo de 12 peças por modelo, em qualquer tamanho e cor, vendido de 6 em 6");
    expect(rotuloDaVariacao({ size: "M", color: "Azul" })).toBe("Azul · Tam. M");
    expect(rotuloDaVariacao({ size: "M", color: null })).toBe("Tam. M");
  });

  it("carrinho: soma tamanhos e cores do mesmo modelo; grades não contam", () => {
    const regras = { A: { minimo: 12, multiplo: 1 } };
    expect(pendenciasDoCarrinho([{ productId: "A", quantity: 5 }, { productId: "A", quantity: 7 }], regras)).toEqual([]);
    expect(pendenciasDoCarrinho([{ productId: "A", quantity: 5 }, { productId: "A", packId: "g", quantity: 3 }, { productId: "B", quantity: 1 }], regras).map((p) => [p.productId, p.falta])).toEqual([["A", 7]]);
  });
});

describe("AT3: grade livre e cores na loja (D268)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  async function loja(key: string) {
    const r = await signupMember(ctx.db, { storeName: "Livre Brás", ownerName: "Maria Souza", email: "maria@livre.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Camiseta", sku: "CAM", categoryName: "Moda", costCents: 2000, suggestedPriceCents: 5000, minimumPriceCents: 2500, sizes: [{ size: "P", initialStock: 50 }, { size: "M", initialStock: 50 }] });
    await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 5000, active: true, featured: false }).onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 5000, active: true } });
    const { nlSubscriptions, catalogPriceVersions } = await import("@/db/schema");
    const sub = await ctx.db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, r.storeId) });
    if (sub) await ctx.db.update(nlSubscriptions).set({ productKey: key, status: "active" }).where(eq(nlSubscriptions.storeId, r.storeId));
    else {
      const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog"); await ensureCatalogSeed(ctx.db);
      const pv = (await ctx.db.select({ id: catalogPriceVersions.id }).from(catalogPriceVersions).limit(1))[0]!.id;
      await ctx.db.insert(nlSubscriptions).values({ id: `sub-${r.storeId}`, storeId: r.storeId, productKey: key, cycle: "MONTHLY", status: "active", priceVersionId: pv, amountCents: 5700, platformFeeBps: 0 });
    }
    return { storeId: r.storeId, productId };
  }
  const pedir = (storeId: string, items: { productId: string; variantId: string; quantity: number }[], channel?: "MANUAL") => createOrder(ctx.db, { storeId, customer, items, customerPaymentStatus: "PENDING", channel }, { paymentProvider: "MANUAL", reservationMinutes: 30 });

  it("Start não liga a grade livre; Pro liga; mínimo precisa fechar no múltiplo", async () => {
    const { salvarRegraDoModelo } = await import("@/lib/domain/atacado");
    const s = await loja("COMMERCE_START");
    await expect(salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 12, multiplo: 1 })).rejects.toThrow(/plano Pro/);
    await salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 0, multiplo: 1 }); // desligar sempre pode
    const { nlSubscriptions } = await import("@/db/schema");
    await ctx.db.update(nlSubscriptions).set({ productKey: "COMMERCE_PRO" }).where(eq(nlSubscriptions.storeId, s.storeId));
    await expect(salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 10, multiplo: 6 })).rejects.toThrow(/use 12 peças/);
    expect(await salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 12, multiplo: 6 })).toEqual({ minimo: 12, multiplo: 6 });
    // Caiu para o Start: quem já tem continua (não perde a regra), só não aumenta.
    await ctx.db.update(nlSubscriptions).set({ productKey: "COMMERCE_START" }).where(eq(nlSubscriptions.storeId, s.storeId));
    await salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 12, multiplo: 6 });
    await expect(salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 24, multiplo: 6 })).rejects.toThrow(/plano Pro/);
  });

  it("cores: nomeia as peças de hoje, cria os tamanhos da cor nova e o pedido grava cor e tamanho", async () => {
    const { salvarCoresDoProduto } = await import("@/lib/domain/atacado");
    const s = await loja("COMMERCE_START");
    await expect(salvarCoresDoProduto(ctx.db, s.storeId, s.productId, { novas: ["Azul"] })).rejects.toThrow(/cor das peças que você já tem/);
    const r = await salvarCoresDoProduto(ctx.db, s.storeId, s.productId, { corAtual: "preto", novas: ["Azul", "azul", "Preto"] });
    expect(r.criadas).toBe(2);
    expect(r.cores).toEqual(["Preto", "Azul"]);
    const vs = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, s.productId)).orderBy(productVariants.position);
    expect(vs.map((v) => `${v.color}:${v.size}`)).toEqual(["Preto:P", "Preto:M", "Azul:P", "Azul:M"]);
    expect(new Set(vs.map((v) => v.sku)).size).toBe(4);
    const o = await pedir(s.storeId, [{ productId: s.productId, variantId: vs[1]!.id, quantity: 1 }]);
    const { orderItems } = await import("@/db/schema");
    expect((await ctx.db.select().from(orderItems).where(eq(orderItems.orderId, o.orderId)))[0]!.label).toBe("Preto · Tam. M");
    await expect(salvarCoresDoProduto(ctx.db, ctx.seed.stores.mantos.id, ctx.seed.productIds[11]!, { novas: ["Azul"] })).rejects.toThrow(/independente/);
  });

  it("pedido da loja virtual só sai com a grade fechada (soma tamanhos e cores); balcão não é barrado", async () => {
    const { salvarRegraDoModelo } = await import("@/lib/domain/atacado");
    const s = await loja("COMMERCE_PRO");
    await salvarRegraDoModelo(ctx.db, s.storeId, s.productId, { minimo: 12, multiplo: 6 });
    const vs = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, s.productId)).orderBy(productVariants.position);
    await expect(pedir(s.storeId, [{ productId: s.productId, variantId: vs[0]!.id, quantity: 4 }, { productId: s.productId, variantId: vs[1]!.id, quantity: 4 }])).rejects.toThrow(/Camiseta: Mínimo de 12 peças deste modelo: faltam 4 peças/);
    await expect(pedir(s.storeId, [{ productId: s.productId, variantId: vs[0]!.id, quantity: 7 }, { productId: s.productId, variantId: vs[1]!.id, quantity: 6 }])).rejects.toThrow(/de 6 em 6/);
    const ok = await pedir(s.storeId, [{ productId: s.productId, variantId: vs[0]!.id, quantity: 7 }, { productId: s.productId, variantId: vs[1]!.id, quantity: 5 }]);
    expect(ok.orderId).toBeTruthy();
    expect((await pedir(s.storeId, [{ productId: s.productId, variantId: vs[0]!.id, quantity: 1 }], "MANUAL")).orderId).toBeTruthy();
  });
});
