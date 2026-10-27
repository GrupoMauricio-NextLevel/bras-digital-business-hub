import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { emailOutbox, financeInvoices, orderEvents, orders, productVariants, storeProducts, stores, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { advanceOrder, cancelOrder, createOrder, marcarEnviado, markCustomerPaidBySystem } from "@/lib/domain/orders";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { getLevel } from "@/lib/domain/inventory";
import { toTracked } from "@/lib/domain/tracking";
import { encryptSecret } from "@/lib/security/crypto";
import type { FetchLike } from "@/lib/payments/mercadopago";

/** D180: depois da venda na loja independente da NextLevel E-commerce (separar, enviar com rastreio, cancelar devolvendo). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function lojaEcommerce() {
  const r = await signupMember(ctx.db, { storeName: "Ateliê Pós", ownerName: "Larissa Teste", email: "larissa@atelie.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const owner: Actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plan.id);
  const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Blusa de linho", sku: "BL-1", categoryName: "Blusas", costCents: 5900, suggestedPriceCents: 14990, minimumPriceCents: 11990, sizes: [{ size: "M", initialStock: 10 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 14990, packPriceCents: null, active: true, featured: false })
    .onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 14990, active: true } });
  const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
  await ctx.db.update(stores).set({ mpAccessTokenEnc: encryptSecret("TEST-token-atelie-0123456789"), paymentStatus: "CONNECTED" }).where(eq(stores.id, r.storeId));
  return { storeId: r.storeId, owner, productId, variantId };
}

/** Pedido pago: na demonstração (aprovado na hora) ou pelo Mercado Pago (pagamento 987654321 confirmado). */
async function pedidoPago(l: Awaited<ReturnType<typeof lojaEcommerce>>, via: "DEMO" | "MERCADO_PAGO" = "DEMO") {
  const items = [{ productId: l.productId, variantId: l.variantId, quantity: 1 }];
  if (via === "DEMO") return createOrder(ctx.db, { storeId: l.storeId, customer, items, customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
  const o = await createOrder(ctx.db, { storeId: l.storeId, customer, items, customerPaymentStatus: "PENDING" }, { paymentProvider: "MERCADO_PAGO", reservationMinutes: 30 });
  await markCustomerPaidBySystem(ctx.db, o.orderId, { provider: "MERCADO_PAGO", reference: "987654321" });
  return o;
}
const pedido = async (id: string) => (await ctx.db.query.orders.findFirst({ where: eq(orders.id, id) }))!;
const emails = async (kind: string, orderId: string) => ctx.db.select().from(emailOutbox).where(and(eq(emailOutbox.kind, kind), eq(emailOutbox.dedupeKey, `${kind}:${orderId}`)));

describe("pós-venda da loja independente (D180)", () => {
  it("pedido pago já fica pronto para separar, sem exigir etiqueta", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    expect((await pedido(o.orderId)).status).toBe("READY_TO_PICK");
    const mp = await pedidoPago(l, "MERCADO_PAGO");
    expect((await pedido(mp.orderId)).status).toBe("READY_TO_PICK");
  });

  it("separa, envia com rastreio (código obrigatório, salvo entrega própria) e o cliente recebe o código", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    await advanceOrder(ctx.db, l.owner, o.orderId, "PICKING");
    await expect(marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: "QB123456789BR" })).rejects.toThrow(/separação/);
    await advanceOrder(ctx.db, l.owner, o.orderId, "READY_TO_SHIP");
    await expect(marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: "" })).rejects.toThrow(/rastreio/);
    await expect(marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "TRANSPORTADORA", codigo: "ABC123456" })).rejects.toThrow(/transportadora/);
    await marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: " qb 123456789 br " });
    const p = await pedido(o.orderId);
    expect(p.status).toBe("SHIPPED");
    expect(p.shippingLabelCode).toBe("QB123456789BR");
    expect(p.shippingCarrier).toBe("Correios");
    const enviado = await emails("ORDER_SHIPPED", o.orderId);
    expect(enviado).toHaveLength(1);
    expect(enviado[0]!.body).toContain("QB123456789BR");
    expect((await toTracked(ctx.db, p)).trackingCode).toBe("QB123456789BR");
    // Repetir não reenvia nem muda nada.
    await marcarEnviado(ctx.db, l.owner, o.orderId, { forma: "CORREIOS", codigo: "QB999999999BR" });
    expect((await pedido(o.orderId)).shippingLabelCode).toBe("QB123456789BR");
    await advanceOrder(ctx.db, l.owner, o.orderId, "DELIVERED");
    expect((await pedido(o.orderId)).status).toBe("DELIVERED");

    const b = await pedidoPago(l);
    await advanceOrder(ctx.db, l.owner, b.orderId, "PICKING");
    await advanceOrder(ctx.db, l.owner, b.orderId, "READY_TO_SHIP");
    await marcarEnviado(ctx.db, l.owner, b.orderId, { forma: "ENTREGA_PROPRIA" });
    expect((await pedido(b.orderId)).shippingLabelCode).toBeNull();
  });

  it("pedido antigo parado em 'aguardando etiqueta' pode ser liberado para separação", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l);
    await ctx.db.update(orders).set({ status: "AWAITING_LABEL" }).where(eq(orders.id, o.orderId));
    await advanceOrder(ctx.db, l.owner, o.orderId, "READY_TO_PICK");
    expect((await pedido(o.orderId)).status).toBe("READY_TO_PICK");
  });

  it("cancelar pedido pago pelo Mercado Pago devolve o valor, libera o estoque e avisa o cliente", async () => {
    const l = await lojaEcommerce();
    const antes = (await getLevel(ctx.db, l.variantId)).available;
    const o = await pedidoPago(l, "MERCADO_PAGO");
    const chamadas: { url: string; chave: string | null }[] = [];
    const fetchImpl: FetchLike = async (url, init) => {
      chamadas.push({ url, chave: new Headers(init?.headers).get("X-Idempotency-Key") });
      return new Response(JSON.stringify({ id: 555, amount: 149.9 }), { status: 201 });
    };
    await cancelOrder(ctx.db, l.owner, o.orderId, fetchImpl);
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]!.url).toContain("/v1/payments/987654321/refunds");
    expect(chamadas[0]!.chave).toBe(`devolucao-pedido-${o.orderId}`);
    const p = await pedido(o.orderId);
    expect(p.status).toBe("CANCELED");
    expect(p.customerPaymentStatus).toBe("REFUNDED");
    expect((await getLevel(ctx.db, l.variantId)).available).toBe(antes);
    const aviso = await emails("ORDER_CANCELED", o.orderId);
    expect(aviso).toHaveLength(1);
    expect(aviso[0]!.body).toMatch(/devolvido pelo Mercado Pago/);
    expect((await toTracked(ctx.db, p)).refunded).toBe(true);
  });

  it("se o Mercado Pago recusar a devolução, nada é cancelado", async () => {
    const l = await lojaEcommerce();
    const o = await pedidoPago(l, "MERCADO_PAGO");
    const fetchImpl: FetchLike = async () => new Response(JSON.stringify({ message: "refund not allowed" }), { status: 400 });
    await expect(cancelOrder(ctx.db, l.owner, o.orderId, fetchImpl)).rejects.toThrow(/Nada foi cancelado/);
    const p = await pedido(o.orderId);
    expect(p.status).toBe("READY_TO_PICK");
    expect(p.customerPaymentStatus).toBe("PAID");
    expect(await emails("ORDER_CANCELED", o.orderId)).toHaveLength(0);
  });

  it("pagamento de demonstração: devolução simulada; pagamento confirmado à mão: o lojista devolve e o pedido registra", async () => {
    const l = await lojaEcommerce();
    const nunca: FetchLike = async () => { throw new Error("não deveria chamar o Mercado Pago"); };
    const demo = await pedidoPago(l);
    await cancelOrder(ctx.db, l.owner, demo.orderId, nunca);
    expect((await pedido(demo.orderId)).customerPaymentStatus).toBe("REFUNDED");
    const manual = await createOrder(ctx.db, { storeId: l.storeId, customer, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }], customerPaymentStatus: "PAID" }, { paymentProvider: "MANUAL" });
    await cancelOrder(ctx.db, l.owner, manual.orderId, nunca);
    const p = await pedido(manual.orderId);
    expect(p.status).toBe("CANCELED");
    expect(p.customerPaymentStatus).toBe("PAID");
    expect(await ctx.db.select().from(orderEvents).where(and(eq(orderEvents.orderId, manual.orderId), eq(orderEvents.type, "REFUND_MANUAL")))).toHaveLength(1);
  });
});

describe("SuperDrop não muda (D180)", () => {
  const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;

  it("pedido pago continua esperando etiqueta; cancelar não chama o Mercado Pago nem avisa o cliente; envio com rastreio é só da loja independente", async () => {
    const store = ctx.seed.stores.mantos;
    const o = await createOrder(ctx.db, { storeId: store.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }], customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
    expect(["AWAITING_LABEL", "AWAITING_CENTRAL_PAYMENT"]).toContain((await pedido(o.orderId)).status);
    await expect(marcarEnviado(ctx.db, ctx.actors.mantos, o.orderId, { forma: "CORREIOS", codigo: "QB123456789BR" })).rejects.toThrow();
    const nunca: FetchLike = async () => { throw new Error("não deveria chamar o Mercado Pago"); };
    await cancelOrder(ctx.db, ctx.actors.mantos, o.orderId, nunca);
    const p = await pedido(o.orderId);
    expect(p.status).toBe("CANCELED");
    expect(p.customerPaymentStatus).toBe("PAID");
    expect(await emails("ORDER_CANCELED", o.orderId)).toHaveLength(0);
  });
});
