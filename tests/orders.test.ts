import { describe, it, expect, beforeEach } from "vitest";
import { freshDb, customer } from "./setup";
import { createOrder, registerShippingLabel, advanceOrder, cancelOrder, confirmCustomerPayment, getOrderForActor } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { resolveFulfillmentStatus, canTransition } from "@/lib/domain/order-status";

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

  it("pedido manual sem pagamento do cliente fica PENDING e só entra no LTV depois de pago", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, channel: "MANUAL", customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "G"), quantity: 1 }] });
    expect(r.status).toBe("PENDING");
    const order = (await getOrderForActor(ctx.db, ctx.actors.mantos, r.orderId)).order;
    const before = await ctx.db.query.storeCustomers.findFirst({ where: (sc, { eq }) => eq(sc.id, order.storeCustomerId!) });
    expect(before).toMatchObject({ ordersCount: 0, totalSpentCents: 0 });

    await confirmCustomerPayment(ctx.db, ctx.actors.mantos, r.orderId);
    const paid = await ctx.db.query.storeCustomers.findFirst({ where: (sc, { eq }) => eq(sc.id, order.storeCustomerId!) });
    expect(paid?.ordersCount).toBe(1);
    expect(paid?.totalSpentCents).toBe(r.totalCents);

    await confirmCustomerPayment(ctx.db, ctx.actors.mantos, r.orderId);
    const afterRetry = await ctx.db.query.storeCustomers.findFirst({ where: (sc, { eq }) => eq(sc.id, order.storeCustomerId!) });
    expect(afterRetry?.ordersCount).toBe(1);
    expect(afterRetry?.totalSpentCents).toBe(r.totalCents);
  });

  it("gera números sequenciais por loja usando o contador atômico", async () => {
    const a = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer: { ...customer, email: "seq-a@teste.com" }, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "G"), quantity: 1 }] });
    const b = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer: { ...customer, email: "seq-b@teste.com" }, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "G"), quantity: 1 }] });
    expect(b.number).toBe(a.number + 1);
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

  it("cancelamento de pedido não pago libera a reserva; pedido pago exige estorno", async () => {
    const variantId = v(11, "GG");
    const before = await getLevel(ctx.db, variantId);
    const unpaid = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer: { ...customer, email: "cancel-unpaid@teste.com" }, items: [{ productId: ctx.seed.productIds[11]!, variantId, quantity: 1 }] });
    await cancelOrder(ctx.db, ctx.actors.mantos, unpaid.orderId);
    expect((await getLevel(ctx.db, variantId)).reserved).toBe(before.reserved);

    const paid = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer: { ...customer, email: "cancel-paid@teste.com" }, items: [{ productId: ctx.seed.productIds[11]!, variantId, quantity: 1 }], customerPaymentStatus: "PAID" });
    await expect(cancelOrder(ctx.db, ctx.actors.mantos, paid.orderId)).rejects.toThrow(/estorno/);
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

describe("permissões de ações do pedido", () => {
  it("somente lojista confirma pagamento manual e anexa etiqueta; só a Central avança expedição", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, channel: "MANUAL", customer: { ...customer, email: "roles@teste.com" }, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }] });
    await expect(confirmCustomerPayment(ctx.db, ctx.actors.supplier, r.orderId)).rejects.toThrow(/Apenas o lojista/);
    await expect(registerShippingLabel(ctx.db, ctx.actors.supplier, r.orderId, { code: "X1234", carrier: "Teste" })).rejects.toThrow(/responsabilidade do lojista/);
    await expect(advanceOrder(ctx.db, ctx.actors.mantos, r.orderId, "AWAITING_CENTRAL_PAYMENT")).rejects.toThrow(/Apenas a Central/);
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
