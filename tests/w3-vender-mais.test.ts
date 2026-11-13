import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { abandonedCarts, emailOutbox, financeInvoices, orders, productVariants, storeProducts, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { lembrarCarrinhos, marcarCarrinhoRecuperado, refazerCarrinho, resumoCarrinhos, sairDosLembretes, salvarCarrinho } from "@/lib/domain/carrinho-abandonado";
import { escolherRelacionados, salvarVendaJunto } from "@/lib/domain/venda-junto";

/** W3 das melhorias (D186): carrinho abandonado por e-mail e "compre junto" com prazo de produção. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function lojaEcommerce() {
  const r = await signupMember(ctx.db, { storeName: "Ateliê Junto", ownerName: "Lia Teste", email: "lia@atelie.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const owner: Actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plan.id);
  const produto = async (name: string, sku: string, preco: number) => {
    const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name, sku, categoryName: "Vestidos", costCents: 3000, suggestedPriceCents: preco, minimumPriceCents: preco - 500, sizes: [{ size: "M", initialStock: 5 }] });
    await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: preco, packPriceCents: null, active: true, featured: false })
      .onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: preco, active: true } });
    const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
    return { productId, variantId };
  };
  const a = await produto("Vestido longo", "VL-1", 15000);
  const b = await produto("Cinto de couro", "CC-1", 5000);
  return { storeId: r.storeId, owner, a, b };
}

describe("carrinho abandonado", () => {
  it("só guarda com o sim do cliente e na loja independente", async () => {
    const l = await lojaEcommerce();
    const items = [{ productId: l.a.productId, variantId: l.a.variantId, quantity: 1 }];
    expect((await salvarCarrinho(ctx.db, l.storeId, { email: "ana@cliente.com", consent: false, items })).salvo).toBe(false);
    expect((await salvarCarrinho(ctx.db, ctx.seed.stores.arena.id, { email: "ana@cliente.com", consent: true, items })).salvo).toBe(false);
    expect((await salvarCarrinho(ctx.db, l.storeId, { email: "Ana@Cliente.com", name: "Ana Souza", consent: true, items })).salvo).toBe(true);
    // Mesmo e-mail atualiza o mesmo carrinho.
    await salvarCarrinho(ctx.db, l.storeId, { email: "ana@cliente.com", consent: true, items: [...items, { productId: l.b.productId, variantId: l.b.variantId, quantity: 2 }] });
    const lista = await ctx.db.select().from(abandonedCarts).where(eq(abandonedCarts.storeId, l.storeId));
    expect(lista).toHaveLength(1);
    expect(lista[0]!.items).toHaveLength(2);
  });

  it("lembra 1 h e 24 h depois, uma vez cada, e para quando vira pedido", async () => {
    const l = await lojaEcommerce();
    const t0 = new Date("2026-10-27T10:00:00Z");
    await salvarCarrinho(ctx.db, l.storeId, { email: "bia@cliente.com", name: "Bia", consent: true, items: [{ productId: l.a.productId, variantId: l.a.variantId, quantity: 1 }] }, t0);
    await salvarCarrinho(ctx.db, l.storeId, { email: "caio@cliente.com", consent: true, items: [{ productId: l.b.productId, variantId: l.b.variantId, quantity: 1 }] }, t0);
    expect(await lembrarCarrinhos(ctx.db, new Date("2026-10-27T10:30:00Z"))).toEqual({ primeiro: 0, segundo: 0 });
    expect(await lembrarCarrinhos(ctx.db, new Date("2026-10-27T11:05:00Z"))).toEqual({ primeiro: 2, segundo: 0 });
    expect(await lembrarCarrinhos(ctx.db, new Date("2026-10-27T11:10:00Z"))).toEqual({ primeiro: 0, segundo: 0 });
    // Caio comprou: não recebe o segundo.
    const o = await createOrder(ctx.db, { storeId: l.storeId, customer: { ...customer, email: "caio@cliente.com" }, items: [{ productId: l.b.productId, variantId: l.b.variantId, quantity: 1 }], customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
    await marcarCarrinhoRecuperado(ctx.db, l.storeId, "Caio@cliente.com", o.orderId);
    expect(await lembrarCarrinhos(ctx.db, new Date("2026-10-28T10:30:00Z"))).toEqual({ primeiro: 0, segundo: 1 });
    expect(await lembrarCarrinhos(ctx.db, new Date("2026-10-29T10:30:00Z"))).toEqual({ primeiro: 0, segundo: 0 });
    const enviados = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "ABANDONED_CART"));
    expect(enviados.filter((e) => e.toEmail === "bia@cliente.com")).toHaveLength(2);
    expect(enviados.filter((e) => e.toEmail === "caio@cliente.com")).toHaveLength(1);
    expect(enviados[0]!.body).toMatch(/preço e o estoque de agora/);
    expect(enviados[0]!.body).toMatch(/\/carrinho\/sair\//);
    expect(enviados.map((e) => e.body).join(" ")).not.toMatch(/desconto|garant|ganh/i);
    const r = await resumoCarrinhos(ctx.db, l.storeId, 30, new Date("2026-10-29T12:00:00Z"));
    expect(r).toMatchObject({ guardados: 2, lembrados: 2, voltaram: 1, valorCents: 5000 });
  });

  it("sair da lista para os lembretes; o link refaz o carrinho com o preço de agora", async () => {
    const l = await lojaEcommerce();
    const t0 = new Date("2026-10-27T10:00:00Z");
    await salvarCarrinho(ctx.db, l.storeId, { email: "dani@cliente.com", consent: true, items: [{ productId: l.a.productId, variantId: l.a.variantId, quantity: 9 }] }, t0);
    const c = (await ctx.db.select().from(abandonedCarts).where(eq(abandonedCarts.email, "dani@cliente.com")))[0]!;
    await ctx.db.update(storeProducts).set({ priceCents: 13900 }).where(and(eq(storeProducts.storeId, l.storeId), eq(storeProducts.productId, l.a.productId)));
    const refeito = await refazerCarrinho(ctx.db, c.token);
    expect(refeito!.linhas[0]).toMatchObject({ productId: l.a.productId, unitPriceCents: 13900, quantity: 5, max: 5 });
    expect(await refazerCarrinho(ctx.db, "nao-existe")).toBeNull();
    expect(await sairDosLembretes(ctx.db, c.token)).toBe(true);
    expect(await lembrarCarrinhos(ctx.db, new Date("2026-10-27T12:00:00Z"))).toEqual({ primeiro: 0, segundo: 0 });
    expect((await salvarCarrinho(ctx.db, l.storeId, { email: "dani@cliente.com", consent: true, items: [{ productId: l.a.productId, variantId: l.a.variantId, quantity: 1 }] })).salvo).toBe(false);
  });
});

describe("compre junto e prazo de produção", () => {
  it("até 4 da própria loja; os escolhidos vêm primeiro na página", async () => {
    const l = await lojaEcommerce();
    await salvarVendaJunto(ctx.db, l.owner, l.a.productId, { relatedIds: [l.b.productId, l.a.productId], productionDays: 3 });
    const sp = (await ctx.db.select().from(storeProducts).where(and(eq(storeProducts.storeId, l.storeId), eq(storeProducts.productId, l.a.productId))))[0]!;
    expect(sp.relatedIds).toEqual([l.b.productId]);
    expect(sp.productionDays).toBe(3);
    await expect(salvarVendaJunto(ctx.db, l.owner, l.a.productId, { relatedIds: [ctx.seed.productIds[0]!], productionDays: 0 })).rejects.toThrow(/só produtos da sua loja/);
    await expect(salvarVendaJunto(ctx.db, l.owner, l.a.productId, { relatedIds: ["a", "b", "c", "d", "e"], productionDays: 0 })).rejects.toThrow(/no máximo 4/);
    await expect(salvarVendaJunto(ctx.db, ctx.actors.arena, ctx.seed.productIds[0]!, { relatedIds: [], productionDays: 1 })).rejects.toThrow(/Commerce/);
    const todos = [{ id: "1", categoryId: "x" }, { id: "2", categoryId: "x" }, { id: "3", categoryId: "y" }, { id: "4", categoryId: "x" }];
    expect(escolherRelacionados(todos, todos[0]!, ["3"]).map((p) => p.id)).toEqual(["3", "2", "4"]);
  });

  it("a previsão de entrega soma os dias de produção do item mais demorado", async () => {
    const l = await lojaEcommerce();
    const items = [{ productId: l.a.productId, variantId: l.a.variantId, quantity: 1 }];
    const ship = { costCents: 1500, address: "Rua A, 1", city: "São Paulo", state: "SP", zip: "01001-000", serviceName: "PAC", days: 2 };
    const sem = await createOrder(ctx.db, { storeId: l.storeId, customer, items, customerPaymentStatus: "PAID", shipping: ship }, { paymentProvider: "DEMO" });
    await salvarVendaJunto(ctx.db, l.owner, l.a.productId, { relatedIds: [], productionDays: 5 });
    const com = await createOrder(ctx.db, { storeId: l.storeId, customer, items, customerPaymentStatus: "PAID", shipping: ship }, { paymentProvider: "DEMO" });
    const d = async (id: string) => new Date((await ctx.db.query.orders.findFirst({ where: eq(orders.id, id) }))!.expectedDeliveryAt!).getTime();
    expect(await d(com.orderId)).toBeGreaterThan(await d(sem.orderId));
  });
});
