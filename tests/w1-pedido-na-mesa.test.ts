import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { financeInvoices, orderEvents, orders, productVariants, proposals, storeProducts, stores, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { advanceOrder, createOrder, marcarEnviado } from "@/lib/domain/orders";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import {
  ajustarEnderecoDoPedido, marcarEstrela, marcarImpresso, mudarSituacaoNaLinha, previsaoDeEntrega, proximaNaLinha, retirarFraude, sinalizarFraude,
} from "@/lib/domain/pedido-mesa";
import { acceptProposal, createProposal, reabrirPropostaAposFalha } from "@/lib/domain/proposals";

/** W1 das melhorias (D184): pedido na mesa e link de pagamento na Commerce; o SuperDrop não muda. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function lojaEcommerce() {
  const r = await signupMember(ctx.db, { storeName: "Ateliê Mesa", ownerName: "Bia Teste", email: "bia@atelie.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const owner: Actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plan.id);
  const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Saia midi", sku: "SM-1", categoryName: "Saias", costCents: 4000, suggestedPriceCents: 9900, minimumPriceCents: 8900, sizes: [{ size: "M", initialStock: 10 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 9900, packPriceCents: null, active: true, featured: false })
    .onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 9900, active: true } });
  const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
  return { storeId: r.storeId, owner, productId, variantId };
}
const ENDERECO = { address: "Rua das Flores, 10", city: "São Paulo", state: "SP", zip: "01001-000" };
async function pedidoPago(l: Awaited<ReturnType<typeof lojaEcommerce>>) {
  return createOrder(ctx.db, { storeId: l.storeId, customer, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }], customerPaymentStatus: "PAID", shipping: { costCents: 1500, ...ENDERECO, serviceName: "PAC", days: 5 } }, { paymentProvider: "DEMO" });
}
const pedido = async (id: string) => (await ctx.db.query.orders.findFirst({ where: eq(orders.id, id) }))!;

describe("previsão de entrega em dias úteis", () => {
  it("pula fim de semana e feriado nacional fixo", () => {
    // Sexta 13/11/2026 às 15h (Brasília) + 2 dias úteis = terça 17/11.
    expect(previsaoDeEntrega(new Date("2026-11-13T18:00:00Z"), 2)!.toISOString().slice(0, 10)).toBe("2026-11-17");
    // Quinta 19/11 + 1 dia útil: sexta 20/11 é feriado (Consciência Negra) → segunda 23/11.
    expect(previsaoDeEntrega(new Date("2026-11-19T15:00:00Z"), 1)!.toISOString().slice(0, 10)).toBe("2026-11-23");
    expect(previsaoDeEntrega(new Date("2026-11-19T15:00:00Z"), 1, 2)!.toISOString().slice(0, 10)).toBe("2026-11-25");
    expect(previsaoDeEntrega(new Date(), null)).toBeNull();
  });

  it("pedido pago da loja independente ganha a previsão; o do SuperDrop não", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    expect((await pedido(o.orderId)).expectedDeliveryAt).not.toBeNull();
    const sd = await ctx.db.select().from(orders).where(eq(orders.storeId, ctx.seed.stores.arena.id));
    expect(sd.every((x) => x.expectedDeliveryAt === null)).toBe(true);
  });
});

describe("situação na própria linha", () => {
  it("só os passos sem dados; o envio continua pedindo o rastreio", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    expect((await pedido(o.orderId)).status).toBe("READY_TO_PICK");
    await mudarSituacaoNaLinha(ctx.db, l.owner, o.orderId, "PICKING");
    await mudarSituacaoNaLinha(ctx.db, l.owner, o.orderId, "READY_TO_SHIP");
    await expect(mudarSituacaoNaLinha(ctx.db, l.owner, o.orderId, "SHIPPED")).rejects.toThrow(/Abra o pedido/);
    expect((await pedido(o.orderId)).status).toBe("READY_TO_SHIP");
  });

  it("loja do SuperDrop não muda situação pela lista (quem avança é a Central)", async () => {
    expect(proximaNaLinha("READY_TO_PICK", false)).toBeNull();
    const [o] = await ctx.db.select().from(orders).where(eq(orders.storeId, ctx.seed.stores.arena.id)).limit(1);
    await expect(mudarSituacaoNaLinha(ctx.db, ctx.actors.arena, o!.id, "PICKING")).rejects.toThrow(/Central/);
    await expect(sinalizarFraude(ctx.db, ctx.actors.arena, o!.id, "endereço estranho")).rejects.toThrow(/Central/);
  });

  it("outra loja não mexe no pedido", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    await expect(marcarEstrela(ctx.db, ctx.actors.arena, o.orderId, true)).rejects.toThrow();
  });
});

describe("estrela, impresso e suspeita de fraude", () => {
  it("estrela liga e desliga; impresso guarda a primeira vez", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    await marcarEstrela(ctx.db, l.owner, o.orderId, true);
    expect((await pedido(o.orderId)).starred).toBe(true);
    await marcarImpresso(ctx.db, l.owner, o.orderId, new Date("2026-10-27T10:00:00Z"));
    await marcarImpresso(ctx.db, l.owner, o.orderId, new Date("2026-10-28T10:00:00Z"));
    expect((await pedido(o.orderId)).printedAt).toMatch(/^2026-10-27/);
  });

  it("suspeita segura o envio até ser retirada, e fica no histórico", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    await advanceOrder(ctx.db, l.owner, o.orderId, "PICKING");
    await advanceOrder(ctx.db, l.owner, o.orderId, "READY_TO_SHIP");
    await expect(sinalizarFraude(ctx.db, l.owner, o.orderId, "oi")).rejects.toThrow(/5 letras/);
    await sinalizarFraude(ctx.db, l.owner, o.orderId, "CPF e nome não batem");
    await expect(marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: "QB123456789BR" })).rejects.toThrow(/suspeita/);
    await retirarFraude(ctx.db, l.owner, o.orderId);
    await marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: "QB123456789BR" });
    expect((await pedido(o.orderId)).status).toBe("SHIPPED");
    const tipos = (await ctx.db.select().from(orderEvents).where(eq(orderEvents.orderId, o.orderId))).map((e) => e.type);
    expect(tipos).toEqual(expect.arrayContaining(["FRAUD_FLAG", "FRAUD_CLEARED"]));
  });
});

describe("ajustar endereço", () => {
  it("antes do envio, com o antes e o depois no histórico; depois do envio, não", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    await expect(ajustarEnderecoDoPedido(ctx.db, l.owner, o.orderId, { ...ENDERECO, zip: "123" })).rejects.toThrow(/CEP/);
    await ajustarEnderecoDoPedido(ctx.db, l.owner, o.orderId, { address: "Rua das Flores, 100 ap 2", city: "São Paulo", state: "sp", zip: "01001000" });
    const p = await pedido(o.orderId);
    expect(p.shippingAddress).toBe("Rua das Flores, 100 ap 2");
    expect(p.shippingState).toBe("SP");
    const ev = await ctx.db.select().from(orderEvents).where(and(eq(orderEvents.orderId, o.orderId), eq(orderEvents.type, "ADDRESS_CHANGED")));
    expect(ev[0]!.message).toMatch(/Antes: Rua das Flores, 10,/);
    await advanceOrder(ctx.db, l.owner, o.orderId, "PICKING");
    await advanceOrder(ctx.db, l.owner, o.orderId, "READY_TO_SHIP");
    await marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: "QB123456789BR" });
    await expect(ajustarEnderecoDoPedido(ctx.db, l.owner, o.orderId, ENDERECO)).rejects.toThrow(/não muda mais/);
  });
});

describe("link de pagamento (proposta)", () => {
  it("com Mercado Pago, o pedido nasce para pagar no Mercado Pago; se a cobrança falhar, o pedido cai e a proposta reabre", async () => {
    const l = await lojaEcommerce();
    const p = await createProposal(ctx.db, l.storeId, { customer: { name: "Carla Cliente", email: "carla@cliente.com", phone: "11999990000" }, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }] });
    const r = await acceptProposal(ctx.db, p.token, new Date(), { pagamento: "MERCADO_PAGO" });
    expect((await pedido(r.orderId)).paymentProvider).toBe("MERCADO_PAGO");
    await reabrirPropostaAposFalha(ctx.db, p.token, r.orderId);
    expect((await pedido(r.orderId)).status).toBe("CANCELED");
    const reaberta = (await ctx.db.select().from(proposals).where(eq(proposals.token, p.token)))[0]!;
    expect(reaberta.status).toBe("OPEN");
    expect(reaberta.orderId).toBeNull();
    // De novo pelo mesmo link: novo pedido.
    const de_novo = await acceptProposal(ctx.db, p.token, new Date(), { pagamento: "MERCADO_PAGO" });
    expect(de_novo.orderId).not.toBe(r.orderId);
  });

  it("sem dizer nada continua como antes (pedido para combinar o pagamento)", async () => {
    const l = await lojaEcommerce();
    const p = await createProposal(ctx.db, l.storeId, { customer: { name: "Davi Cliente", email: "davi@cliente.com" }, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }] });
    const r = await acceptProposal(ctx.db, p.token);
    expect((await pedido(r.orderId)).paymentProvider).toBe("MANUAL");
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, l.storeId) }))!.id).toBe(l.storeId);
  });
});
