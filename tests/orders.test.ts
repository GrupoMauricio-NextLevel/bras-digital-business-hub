import { describe, it, expect, beforeEach } from "vitest";
import { freshDb, customer } from "./setup";
import { createOrder, registerShippingLabel, advanceOrder, cancelOrder, getOrderForActor, listOrdersForActor } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { resolveFulfillmentStatus, canTransition } from "@/lib/domain/order-status";
import { and, eq } from "drizzle-orm";
import { orders, productChannels } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;

beforeEach(async () => {
  ctx = await freshDb();
});

describe("pedido — golden path", () => {
  it("cria pedido, reserva estoque e segue pagamento Central → etiqueta → separação → envio", async () => {
    const variantId = v(11, "M");
    const before = await getLevel(ctx.db, variantId);
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId, quantity: 2 }], customerPaymentStatus: "PAID" });
    // Mantos tem saldo: o custo é debitado na criação e o pedido espera só a etiqueta.
    expect(r.status).toBe("AWAITING_LABEL");
    expect((await getLevel(ctx.db, variantId)).reserved).toBe(before.reserved + 2);

    const afterLabel = await registerShippingLabel(ctx.db, ctx.actors.mantos, r.orderId, { code: "ME123456BR", carrier: "Melhor Envio" });
    expect(afterLabel.status).toBe("READY_TO_PICK");

    await advanceOrder(ctx.db, ctx.actors.supplier, r.orderId, "PICKING");
    await advanceOrder(ctx.db, ctx.actors.supplier, r.orderId, "READY_TO_SHIP");
    await advanceOrder(ctx.db, ctx.actors.supplier, r.orderId, "SHIPPED");
    const after = await getLevel(ctx.db, variantId);
    expect(after.onHand).toBe(before.onHand - 2);
    expect(after.reserved).toBe(before.reserved);
  });

  it("custo debitado do saldo sem etiqueta fica AWAITING_LABEL", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "G"), quantity: 1 }], customerPaymentStatus: "PAID" });
    expect(r.status).toBe("AWAITING_LABEL");
  });

  it("pedido manual sem pagamento do cliente fica PENDING", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, channel: "MANUAL", customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "G"), quantity: 1 }] });
    expect(r.status).toBe("PENDING");
  });

  it("grade de 12 reserva a distribuição por tamanho", async () => {
    const productId = ctx.seed.productIds[0]!;
    const packId = ctx.seed.packByProduct.get(productId)!;
    const p = await getLevel(ctx.db, v(0, "P"));
    const m = await getLevel(ctx.db, v(0, "M"));
    await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, saleType: "WHOLESALE", customer, items: [{ productId, packId, quantity: 1 }], customerPaymentStatus: "PAID" });
    expect((await getLevel(ctx.db, v(0, "P"))).reserved).toBe(p.reserved + 2);
    expect((await getLevel(ctx.db, v(0, "M"))).reserved).toBe(m.reserved + 4);
  });

  it("cancelamento libera a reserva", async () => {
    const variantId = v(11, "GG");
    const before = await getLevel(ctx.db, variantId);
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId, quantity: 1 }], customerPaymentStatus: "PAID" });
    await cancelOrder(ctx.db, ctx.actors.mantos, r.orderId);
    expect((await getLevel(ctx.db, variantId)).reserved).toBe(before.reserved);
  });

  it("falha sem estoque e não grava pedido parcial", async () => {
    const variantId = v(6, "P");
    const level = await getLevel(ctx.db, variantId);
    await expect(createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[6]!, variantId, quantity: level.available + 1 }] })).rejects.toThrow(/Estoque insuficiente/);
    expect((await getLevel(ctx.db, variantId)).reserved).toBe(level.reserved);
  });

  it("não vende produto não distribuído para a loja", async () => {
    await expect(createOrder(ctx.db, { storeId: ctx.seed.stores.arena.id, customer, items: [{ productId: ctx.seed.productIds[8]!, variantId: v(8, "M"), quantity: 1 }] })).rejects.toThrow(/não disponível/);
  });

  it("transições inválidas são rejeitadas", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }], customerPaymentStatus: "PAID" });
    await expect(advanceOrder(ctx.db, ctx.actors.supplier, r.orderId, "SHIPPED")).rejects.toThrow(/não permitida/);
    await expect(advanceOrder(ctx.db, ctx.actors.supplier, r.orderId, "READY_TO_PICK")).rejects.toThrow();
    expect(canTransition("DELIVERED", "CANCELED")).toBe(false);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });
});

describe("regra pagamento + etiqueta", () => {
  it("só fica READY_TO_PICK com Central paga e etiqueta pronta", () => {
    const base = { status: "PENDING" as const, customerPaymentStatus: "PAID" as const };
    expect(resolveFulfillmentStatus({ ...base, centralPaymentStatus: "PENDING", shippingLabelStatus: "PENDING" })).toBe("AWAITING_CENTRAL_PAYMENT");
    expect(resolveFulfillmentStatus({ ...base, centralPaymentStatus: "PENDING", shippingLabelStatus: "READY" })).toBe("AWAITING_CENTRAL_PAYMENT");
    expect(resolveFulfillmentStatus({ ...base, centralPaymentStatus: "PAID", shippingLabelStatus: "PENDING" })).toBe("AWAITING_LABEL");
    expect(resolveFulfillmentStatus({ ...base, centralPaymentStatus: "PAID", shippingLabelStatus: "READY" })).toBe("READY_TO_PICK");
    expect(resolveFulfillmentStatus({ status: "PICKING", customerPaymentStatus: "PAID", centralPaymentStatus: "PAID", shippingLabelStatus: "READY" })).toBe("PICKING");
  });
});

describe("pedido aparece para lojista e fornecedor corretos", () => {
  it("lojista e fornecedor enxergam; outro lojista não", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }] });
    await expect(getOrderForActor(ctx.db, ctx.actors.mantos, r.orderId)).resolves.toBeTruthy();
    await expect(getOrderForActor(ctx.db, ctx.actors.supplier, r.orderId)).resolves.toBeTruthy();
    await expect(getOrderForActor(ctx.db, ctx.actors.master, r.orderId)).resolves.toBeTruthy();
    await expect(getOrderForActor(ctx.db, ctx.actors.arena, r.orderId)).rejects.toThrow(/não permitido/);
  });
});


describe("SuperDrop — canais e grants", () => {
  it("grava SUPERDROP como origem padrão do pedido", async () => {
    const r = await createOrder(ctx.db, {
      storeId: ctx.seed.stores.mantos.id,
      customer,
      items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }],
    });
    const order = await ctx.db.query.orders.findFirst({ where: eq(orders.id, r.orderId) });
    expect(order?.sourceArea).toBe("SUPERDROP");
  });

  it("não vende no SuperDrop produto cujo canal foi desativado", async () => {
    const productId = ctx.seed.productIds[11]!;
    await ctx.db.update(productChannels)
      .set({ active: false })
      .where(and(eq(productChannels.productId, productId), eq(productChannels.area, "SUPERDROP")));

    await expect(createOrder(ctx.db, {
      storeId: ctx.seed.stores.mantos.id,
      customer,
      items: [{ productId, variantId: v(11, "M"), quantity: 1 }],
    })).rejects.toThrow(/não disponível/);
  });

  it("lista pedidos pelo grant MERCHANT_OWNER mesmo sem papel legado de lojista", async () => {
    const actor: Actor = {
      userId: "grant-user",
      role: "NEXTLEVEL_MASTER",
      organizationId: "org-grant",
      supplierId: null,
      storeId: null,
      grants: [{
        area: "SUPERDROP",
        role: "MERCHANT_OWNER",
        organizationId: "org-grant",
        storeId: ctx.seed.stores.mantos.id,
      }],
    };

    const rows = await listOrdersForActor(ctx.db, actor);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.order.storeId === ctx.seed.stores.mantos.id)).toBe(true);
    await expect(getOrderForActor(ctx.db, actor, rows[0]!.order.id)).resolves.toBeTruthy();
  });
});
