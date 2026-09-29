import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { orders, stores } from "@/db/schema";
import { createOrder, expireStaleReservations, markCustomerPaidBySystem } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { encryptSecret } from "@/lib/security/crypto";
import { syncMercadoPagoPayment, syncOrderPayment } from "@/lib/payments/service";
import { createPreference, type FetchLike } from "@/lib/payments/mercadopago";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;

/** Mercado Pago simulado: pagamentos por id e busca por referência. */
function mpFetch(payments: Record<string, { status: string; external_reference: string; transaction_amount: number }>): FetchLike {
  return async (input) => {
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
    const m = input.match(/\/v1\/payments\/(\d+)$/);
    if (m) { const p = payments[m[1]!]; return p ? json({ id: Number(m[1]), ...p }) : json({ message: "not found" }, 404); }
    if (input.includes("/v1/payments/search")) {
      const ref = new URL(input).searchParams.get("external_reference");
      return json({ results: Object.entries(payments).filter(([, p]) => p.external_reference === ref).map(([id, p]) => ({ id: Number(id), status: p.status })) });
    }
    return json({}, 404);
  };
}

async function connectStore(slug: "mantos" | "arena") {
  const store = ctx.seed.stores[slug];
  await ctx.db.update(stores).set({ mpAccessTokenEnc: encryptSecret(`TEST-token-${slug}-0123456789`), paymentStatus: "CONNECTED" }).where(eq(stores.id, store.id));
  return store;
}
async function pendingOrder(slug: "mantos" | "arena" = "mantos", qty = 1) {
  const store = await connectStore(slug);
  const r = await createOrder(ctx.db, { storeId: store.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: qty }], customerPaymentStatus: "PENDING" }, { paymentProvider: "MERCADO_PAGO", reservationMinutes: 30 });
  return { store, ...r };
}

beforeEach(async () => { ctx = await freshDb(); });

describe("Mercado Pago — confirmação de pagamento", () => {
  it("pedido online nasce PENDING com reserva de estoque e validade", async () => {
    const before = await getLevel(ctx.db, v(11, "M"));
    const o = await pendingOrder();
    expect(o.status).toBe("PENDING");
    expect((await getLevel(ctx.db, v(11, "M"))).reserved).toBe(before.reserved + 1);
    const row = await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) });
    expect(row?.reservationExpiresAt).toBeTruthy();
    expect(row?.paymentProvider).toBe("MERCADO_PAGO");
  });

  it("webhook aprovado marca cliente como pago, avança o status e é idempotente", async () => {
    const o = await pendingOrder();
    const fetchImpl = mpFetch({ "111": { status: "approved", external_reference: o.orderId, transaction_amount: o.totalCents / 100 } });
    const first = await syncMercadoPagoPayment(ctx.db, { storeSlug: o.store.slug, paymentId: "111" }, fetchImpl);
    expect(first.outcome).toBe("PAID");
    const paid = await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) });
    expect(paid?.customerPaymentStatus).toBe("PAID");
    expect(paid?.status).toBe("AWAITING_LABEL"); // custo debitado do saldo da loja
    expect(paid?.paymentReference).toBe("111");
    expect(paid?.reservationExpiresAt).toBeNull();
    await syncMercadoPagoPayment(ctx.db, { storeSlug: o.store.slug, paymentId: "111" }, fetchImpl);
    const events = await ctx.db.query.orderEvents.findMany({ where: (e, { eq, and }) => and(eq(e.orderId, o.orderId), eq(e.type, "CUSTOMER_PAID")) });
    expect(events).toHaveLength(1);
  });

  it("pagamento pendente ou recusado não confirma o pedido", async () => {
    const o = await pendingOrder();
    const r = await syncMercadoPagoPayment(ctx.db, { storeSlug: o.store.slug, paymentId: "222" }, mpFetch({ "222": { status: "pending", external_reference: o.orderId, transaction_amount: o.totalCents / 100 } }));
    expect(r.outcome).toBe("PENDING");
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))?.customerPaymentStatus).toBe("PENDING");
  });

  it("não aceita pagamento de valor menor que o total", async () => {
    const o = await pendingOrder();
    await expect(syncMercadoPagoPayment(ctx.db, { storeSlug: o.store.slug, paymentId: "333" }, mpFetch({ "333": { status: "approved", external_reference: o.orderId, transaction_amount: 1 } }))).rejects.toThrow(/menor que o total/);
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))?.customerPaymentStatus).toBe("PENDING");
  });

  it("isolamento: token de uma loja não confirma pedido de outra", async () => {
    const o = await pendingOrder("mantos");
    await connectStore("arena");
    const fetchImpl = mpFetch({ "444": { status: "approved", external_reference: o.orderId, transaction_amount: o.totalCents / 100 } });
    const r = await syncMercadoPagoPayment(ctx.db, { storeSlug: ctx.seed.stores.arena.slug, paymentId: "444" }, fetchImpl);
    expect(r.outcome).toBe("IGNORED");
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))?.customerPaymentStatus).toBe("PENDING");
  });

  it("loja sem token conectado ignora a notificação", async () => {
    const r = await syncMercadoPagoPayment(ctx.db, { storeSlug: ctx.seed.stores.mantos.slug, paymentId: "1" }, mpFetch({}));
    expect(r.outcome).toBe("IGNORED");
  });

  it("polling por pedido encontra pagamento aprovado pela referência externa", async () => {
    const o = await pendingOrder();
    const fetchImpl = mpFetch({ "555": { status: "approved", external_reference: o.orderId, transaction_amount: o.totalCents / 100 } });
    expect((await syncOrderPayment(ctx.db, o.orderId, fetchImpl)).paid).toBe(true);
  });

  it("pago + Central + etiqueta segue a regra normal até READY_TO_PICK", async () => {
    const o = await pendingOrder();
    await markCustomerPaidBySystem(ctx.db, o.orderId, { provider: "MERCADO_PAGO", reference: "9", amountCents: o.totalCents });
    const { registerShippingLabel } = await import("@/lib/domain/orders");
    const r = await registerShippingLabel(ctx.db, ctx.actors.mantos, o.orderId, { code: "ME123456BR", carrier: "Melhor Envio" });
    expect(r.status).toBe("READY_TO_PICK");
  });
});

describe("expiração de reservas", () => {
  it("cancela pedido não pago vencido e devolve o estoque", async () => {
    const before = await getLevel(ctx.db, v(11, "M"));
    const o = await pendingOrder("mantos", 2);
    expect((await getLevel(ctx.db, v(11, "M"))).reserved).toBe(before.reserved + 2);
    const r = await expireStaleReservations(ctx.db, new Date(Date.now() + 31 * 60_000));
    expect(r.expired).toBe(1);
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))?.status).toBe("CANCELED");
    expect((await getLevel(ctx.db, v(11, "M"))).reserved).toBe(before.reserved);
  });

  it("não cancela pedido ainda dentro do prazo nem pedido já pago", async () => {
    const a = await pendingOrder("mantos");
    const b = await pendingOrder("mantos");
    await markCustomerPaidBySystem(ctx.db, b.orderId, { provider: "MERCADO_PAGO", reference: "77", amountCents: b.totalCents });
    expect((await expireStaleReservations(ctx.db)).expired).toBe(0);
    const later = await expireStaleReservations(ctx.db, new Date(Date.now() + 31 * 60_000));
    expect(later.expired).toBe(1);
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, a.orderId) }))?.status).toBe("CANCELED");
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, b.orderId) }))?.status).not.toBe("CANCELED");
  });

  it("pagamento aprovado após o cancelamento não reabre o pedido e gera alerta", async () => {
    const o = await pendingOrder();
    await expireStaleReservations(ctx.db, new Date(Date.now() + 31 * 60_000));
    const r = await markCustomerPaidBySystem(ctx.db, o.orderId, { provider: "MERCADO_PAGO", reference: "88", amountCents: o.totalCents });
    expect(r.changed).toBe(false);
    const row = await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) });
    expect(row?.status).toBe("CANCELED");
    const ev = await ctx.db.query.orderEvents.findMany({ where: (e, { eq, and }) => and(eq(e.orderId, o.orderId), eq(e.type, "PAID_AFTER_CANCEL")) });
    expect(ev).toHaveLength(1);
  });
});

describe("preferência do Checkout Pro", () => {
  it("envia referência do pedido, itens em reais, frete e expiração", async () => {
    let sent: Record<string, unknown> = {};
    const fetchImpl: FetchLike = async (_url, init) => { sent = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ id: "pref-1", init_point: "https://mp.test/checkout/pref-1" }), { status: 201 }); };
    const pref = await createPreference("TEST-x", {
      orderId: "ord_1", orderNumber: 1001, storeName: "Mantos Shop", items: [{ id: "i1", title: "Manto", quantity: 2, unitPriceCents: 14990 }], shippingCents: 2490,
      payer: { name: "Ana Souza", email: "ana@x.com" }, notificationUrl: "https://app.test/api/webhooks/mercadopago?store=mantos-shop",
      backUrls: { success: "https://app.test/ok", failure: "https://app.test/ok", pending: "https://app.test/ok" }, expiresAt: new Date("2030-01-01T00:00:00Z"),
    }, fetchImpl);
    expect(pref.checkoutUrl).toBe("https://mp.test/checkout/pref-1");
    expect(sent.external_reference).toBe("ord_1");
    expect((sent.items as { unit_price: number }[])[0]?.unit_price).toBe(149.9);
    expect((sent.items as { id: string; unit_price: number }[]).find((i) => i.id === "frete")?.unit_price).toBe(24.9);
    expect(sent.notification_url).toContain("store=mantos-shop");
    expect(sent.auto_return).toBe("approved");
    expect(sent.expires).toBe(true);
  });

  it("token inválido devolve mensagem clara", async () => {
    const fetchImpl: FetchLike = async () => new Response(JSON.stringify({ message: "invalid_token" }), { status: 401 });
    await expect(createPreference("x", { orderId: "o", orderNumber: 1, storeName: "L", items: [], shippingCents: 0, payer: { name: "A", email: "a@a.com" } }, fetchImpl)).rejects.toThrow(/inválido ou expirado/);
  });
});
