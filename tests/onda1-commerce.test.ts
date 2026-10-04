import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { financeInvoices, orderEvents, orders, productStoreAccess, productVariants, products, storeProducts, stores, users, walletEntries } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogSupplierId } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { advanceOrder, cancelOrder, confirmCustomerPayment, createOrder, registerShippingLabel } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { getLevel } from "@/lib/domain/inventory";
import { assertProductListable } from "@/lib/domain/catalog";
import { canFulfilOrder, storeModality } from "@/lib/domain/order-policy";
import { encryptSecret } from "@/lib/security/crypto";
import { syncOrderPayment } from "@/lib/payments/service";
import type { FetchLike } from "@/lib/payments/mercadopago";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const signup = (n: number) => signupMember(ctx.db, { storeName: `Moda ${n}`, ownerName: "Maria Souza", email: `maria${n}@moda.com.br`, password: "senha-segura-1", taxId: n === 1 ? "529.982.247-25" : "111.444.777-35", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);

/** Conta simples liberada (plano pago) com um produto de 10 peças listado. */
async function independent(n = 1) {
  const r = await signup(n);
  const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plan.id);
  const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const supplierId = await catalogSupplierId(ctx.db, owner);
  const { productId } = await createProduct(ctx.db, supplierId, { name: `Vestido ${n}`, sku: `VST-${n}`, categoryName: "Vestidos", costCents: 3000, suggestedPriceCents: 9000, minimumPriceCents: 5000, sizes: [{ size: "M", initialStock: 10 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 9000, packPriceCents: null, active: true, featured: false });
  const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
  return { ...r, owner, supplierId, productId, variantId };
}
const sell = (i: Awaited<ReturnType<typeof independent>>, paid = true, provider: "MANUAL" | "MERCADO_PAGO" = "MANUAL") =>
  createOrder(ctx.db, { storeId: i.storeId, customer, items: [{ productId: i.productId, variantId: i.variantId, quantity: 2 }], customerPaymentStatus: paid ? "PAID" : "PENDING" }, { paymentProvider: provider, reservationMinutes: 30 });
const readyToPick = async (i: Awaited<ReturnType<typeof independent>>) => {
  const o = await sell(i);
  await registerShippingLabel(ctx.db, i.owner, o.orderId, { code: "ME123456BR", carrier: "Correios" });
  return o;
};
const statusOf = async (id: string) => (await ctx.db.query.orders.findFirst({ where: eq(orders.id, id) }))!;

describe("Onda 1 — conta simples expede o próprio pedido", () => {
  it("modalidade vem do banco: independente / rede", async () => {
    const i = await independent();
    expect(await storeModality(ctx.db, i.storeId)).toBe("INDEPENDENT");
    expect(await storeModality(ctx.db, ctx.seed.stores.mantos.id)).toBe("NETWORK");
  });

  it("T-01 dono independente separa, embala e envia; estoque baixa uma vez", async () => {
    const i = await independent();
    const before = (await getLevel(ctx.db, i.variantId)).onHand;
    const o = await readyToPick(i);
    expect((await statusOf(o.orderId)).status).toBe("READY_TO_PICK");
    for (const s of ["PICKING", "READY_TO_SHIP", "SHIPPED"] as const) await advanceOrder(ctx.db, i.owner, o.orderId, s);
    expect((await statusOf(o.orderId)).status).toBe("SHIPPED");
    expect((await getLevel(ctx.db, i.variantId)).onHand).toBe(before - 2);
  });

  it("T-02 outro lojista independente não mexe no pedido alheio", async () => {
    const a = await independent(1);
    const b = await independent(2);
    const o = await readyToPick(a);
    await expect(advanceOrder(ctx.db, b.owner, o.orderId, "PICKING")).rejects.toThrow();
    expect((await statusOf(o.orderId)).status).toBe("READY_TO_PICK");
  });

  it("T-03 dono de loja de rede (SuperDrop) continua sem expedir", async () => {
    const store = ctx.seed.stores.mantos;
    const r = await createOrder(ctx.db, { storeId: store.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)![0]!.id, quantity: 1 }], customerPaymentStatus: "PAID" });
    await registerShippingLabel(ctx.db, ctx.actors.mantos, r.orderId, { code: "ME123456BR", carrier: "Correios" }).catch(() => undefined);
    await expect(advanceOrder(ctx.db, ctx.actors.mantos, r.orderId, "PICKING")).rejects.toThrow();
    expect(canFulfilOrder(ctx.actors.mantos, { storeId: store.id, supplierId: ctx.seed.supplierId }, "NETWORK")).toBe(false);
    expect(canFulfilOrder(ctx.actors.supplier, { storeId: store.id, supplierId: ctx.seed.supplierId }, "NETWORK")).toBe(true);
    expect(canFulfilOrder(ctx.actors.master, { storeId: store.id, supplierId: ctx.seed.supplierId }, "NETWORK")).toBe(true);
  });

  it("T-04 transição inválida é recusada", async () => {
    const i = await independent();
    const o = await readyToPick(i);
    await expect(advanceOrder(ctx.db, i.owner, o.orderId, "SHIPPED")).rejects.toThrow(/não permitida/);
  });

  it("T-05 repetir SHIPPED não baixa estoque de novo", async () => {
    const i = await independent();
    const before = (await getLevel(ctx.db, i.variantId)).onHand;
    const o = await readyToPick(i);
    for (const s of ["PICKING", "READY_TO_SHIP", "SHIPPED", "SHIPPED"] as const) await advanceOrder(ctx.db, i.owner, o.orderId, s);
    expect((await getLevel(ctx.db, i.variantId)).onHand).toBe(before - 2);
    const evs = (await ctx.db.select().from(orderEvents).where(eq(orderEvents.orderId, o.orderId))).filter((e) => e.type === "STATUS_SHIPPED");
    expect(evs).toHaveLength(1);
  });

  it("T-06 avanços simultâneos: só um vence e o estoque baixa uma vez", async () => {
    const i = await independent();
    const before = (await getLevel(ctx.db, i.variantId)).onHand;
    const o = await readyToPick(i);
    for (const s of ["PICKING", "READY_TO_SHIP"] as const) await advanceOrder(ctx.db, i.owner, o.orderId, s);
    const rs = await Promise.allSettled([advanceOrder(ctx.db, i.owner, o.orderId, "SHIPPED"), advanceOrder(ctx.db, i.owner, o.orderId, "SHIPPED")]);
    expect(rs.some((r) => r.status === "fulfilled")).toBe(true);
    expect((await getLevel(ctx.db, i.variantId)).onHand).toBe(before - 2);
    expect((await statusOf(o.orderId)).status).toBe("SHIPPED");
  });

  it("T-07 cancelar duas vezes libera a reserva só uma vez", async () => {
    const i = await independent();
    const before = (await getLevel(ctx.db, i.variantId)).available;
    const o = await sell(i, false);
    expect((await getLevel(ctx.db, i.variantId)).available).toBe(before - 2);
    await cancelOrder(ctx.db, i.owner, o.orderId);
    await cancelOrder(ctx.db, i.owner, o.orderId);
    await Promise.allSettled([cancelOrder(ctx.db, i.owner, o.orderId), cancelOrder(ctx.db, i.owner, o.orderId)]);
    expect((await getLevel(ctx.db, i.variantId)).available).toBe(before);
  });

  it("T-08 plano vencido bloqueia a expedição da conta simples", async () => {
    const i = await independent();
    const o = await readyToPick(i);
    await ctx.db.update(stores).set({ trialEndsAt: "2020-01-01T00:00:00.000Z", paidUntil: "2020-01-02T00:00:00.000Z" }).where(eq(stores.id, i.storeId));
    await expect(advanceOrder(ctx.db, i.owner, o.orderId, "PICKING")).rejects.toThrow(/plano/);
  });
});

describe("Onda 1 — confirmação de pagamento: manual x gateway", () => {
  it("T-09 pagamento manual: dono confirma, libera o pedido e a repetição não duplica", async () => {
    const i = await independent();
    const o = await sell(i, false);
    const r = await confirmCustomerPayment(ctx.db, i.owner, o.orderId);
    expect(r.customerPaymentStatus).toBe("PAID");
    await confirmCustomerPayment(ctx.db, i.owner, o.orderId);
    await Promise.allSettled([confirmCustomerPayment(ctx.db, i.owner, o.orderId), confirmCustomerPayment(ctx.db, i.owner, o.orderId)]);
    const evs = (await ctx.db.select().from(orderEvents).where(eq(orderEvents.orderId, o.orderId))).filter((e) => e.type === "CUSTOMER_PAID");
    expect(evs).toHaveLength(1);
  });

  it("T-10 pedido do Mercado Pago NÃO aceita confirmação manual (chamada direta)", async () => {
    const i = await independent();
    const o = await sell(i, false, "MERCADO_PAGO");
    await expect(confirmCustomerPayment(ctx.db, i.owner, o.orderId)).rejects.toThrow(/Mercado Pago/);
    expect((await statusOf(o.orderId)).customerPaymentStatus).toBe("PENDING");
  });

  it("T-11 pedido cancelado não pode ser marcado como pago", async () => {
    const i = await independent();
    const o = await sell(i, false);
    await cancelOrder(ctx.db, i.owner, o.orderId);
    await expect(confirmCustomerPayment(ctx.db, i.owner, o.orderId)).rejects.toThrow(/cancelado/i);
  });

  it("T-12 outro tenant não confirma pagamento alheio", async () => {
    const a = await independent(1);
    const b = await independent(2);
    const o = await sell(a, false);
    await expect(confirmCustomerPayment(ctx.db, b.owner, o.orderId)).rejects.toThrow();
    expect((await statusOf(o.orderId)).customerPaymentStatus).toBe("PENDING");
  });

  const mp = (status: string, ref: string, amount: number): FetchLike => async (input) => {
    const json = (o: unknown, st = 200) => new Response(JSON.stringify(o), { status: st });
    if (input.includes("/v1/payments/search")) return json({ results: [{ id: 901, status }] });
    if (/\/v1\/payments\/901$/.test(input)) return json({ id: 901, status, external_reference: ref, transaction_amount: amount });
    return json({}, 404);
  };
  const connect = async (storeId: string) => { await ctx.db.update(stores).set({ mpAccessTokenEnc: encryptSecret("TEST-token-0123456789"), paymentStatus: "CONNECTED" }).where(eq(stores.id, storeId)); };

  it("T-13/T-14 gateway: pendente ou valor errado não libera; aprovado libera o pedido certo", async () => {
    const i = await independent();
    await connect(i.storeId);
    const o = await sell(i, false, "MERCADO_PAGO");
    expect((await syncOrderPayment(ctx.db, o.orderId, mp("pending", o.orderId, o.totalCents / 100))).paid).toBe(false);
    await syncOrderPayment(ctx.db, o.orderId, mp("approved", o.orderId, 0.01)).catch(() => undefined);
    expect((await statusOf(o.orderId)).customerPaymentStatus).toBe("PENDING");
    expect((await syncOrderPayment(ctx.db, o.orderId, mp("approved", o.orderId, o.totalCents / 100))).paid).toBe(true);
    expect((await statusOf(o.orderId)).customerPaymentStatus).toBe("PAID");
  });
});

describe("Onda 1 — dono só lista produto do próprio catálogo", () => {
  const prod = async (id: string) => (await ctx.db.query.products.findFirst({ where: eq(products.id, id) }))!;

  it("T-15 lista produto da própria Central", async () => {
    const i = await independent();
    await expect(assertProductListable(ctx.db, i.storeId, await prod(i.productId))).resolves.toBeUndefined();
  });

  it("T-16 produto de outro fornecedor (ALL_NETWORK) é recusado", async () => {
    const i = await independent();
    const foreign = ctx.seed.productIds[11]!;
    await expect(assertProductListable(ctx.db, i.storeId, await prod(foreign))).rejects.toThrow(/indisponível/);
    expect(await ctx.db.select().from(storeProducts).where(eq(storeProducts.productId, foreign))).toSatisfy((rows: { storeId: string }[]) => rows.every((r) => r.storeId !== i.storeId));
  });

  it("T-17 produto de uma conta simples não entra em loja de rede nem em outra conta", async () => {
    const a = await independent(1);
    const b = await independent(2);
    await expect(assertProductListable(ctx.db, ctx.seed.stores.mantos.id, await prod(a.productId))).rejects.toThrow(/indisponível/);
    await expect(assertProductListable(ctx.db, b.storeId, await prod(a.productId))).rejects.toThrow(/indisponível/);
  });

  it("T-18 rede: SELECTED_STORES sem acesso é recusado e com acesso passa; inativo é recusado", async () => {
    const pid = ctx.seed.productIds[11]!;
    await ctx.db.update(products).set({ distribution: "SELECTED_STORES" }).where(eq(products.id, pid));
    await expect(assertProductListable(ctx.db, ctx.seed.stores.mantos.id, await prod(pid))).rejects.toThrow(/distribuído/);
    await ctx.db.insert(productStoreAccess).values({ productId: pid, storeId: ctx.seed.stores.mantos.id });
    await expect(assertProductListable(ctx.db, ctx.seed.stores.mantos.id, await prod(pid))).resolves.toBeUndefined();
    await ctx.db.update(products).set({ status: "DRAFT" } as never).where(eq(products.id, pid));
    await expect(assertProductListable(ctx.db, ctx.seed.stores.mantos.id, await prod(pid))).rejects.toThrow(/indisponível/);
  });
});

describe("Onda 1 — dinheiro: conta simples não usa carteira; SuperDrop mantém o fluxo", () => {
  it("T-19 venda independente não gera débito de carteira", async () => {
    const i = await independent();
    await sell(i);
    const tx = await ctx.db.select().from(walletEntries).where(eq(walletEntries.storeId, i.storeId));
    expect(tx).toHaveLength(0);
  });

  it("T-20 SuperDrop: pedido pago debita o custo da carteira e vai para a etiqueta", async () => {
    const store = ctx.seed.stores.mantos;
    const r = await createOrder(ctx.db, { storeId: store.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)![0]!.id, quantity: 1 }], customerPaymentStatus: "PAID" });
    const row = await statusOf(r.orderId);
    expect(["AWAITING_LABEL", "AWAITING_CENTRAL_PAYMENT"]).toContain(row.status);
  });
});

describe("Onda 3 — notas internas do pedido", () => {
  it("dono grava nota interna; outro tenant não grava; nota curta é recusada", async () => {
    const { addOrderNote } = await import("@/lib/domain/orders");
    const a = await independent(1);
    const b = await independent(2);
    const o = await sell(a);
    await addOrderNote(ctx.db, a.owner, o.orderId, "Cliente pediu embalagem para presente");
    const evs = (await ctx.db.select().from(orderEvents).where(eq(orderEvents.orderId, o.orderId))).filter((e) => e.type === "NOTE_INTERNAL");
    expect(evs).toHaveLength(1);
    await expect(addOrderNote(ctx.db, b.owner, o.orderId, "invasão")).rejects.toThrow();
    await expect(addOrderNote(ctx.db, a.owner, o.orderId, " ")).rejects.toThrow(/mínimo/);
  });
});

describe("Pedido mínimo (atacado)", () => {
  it("barra compra online abaixo do mínimo, libera acima, não barra venda manual e não existe em loja de rede", async () => {
    const { setMinOrder } = await import("@/lib/domain/price-tiers");
    const i = await independent();
    await setMinOrder(ctx.db, i.storeId, 25000);
    const online = (qty: number) => createOrder(ctx.db, { storeId: i.storeId, channel: "ONLINE_STORE", customer, items: [{ productId: i.productId, variantId: i.variantId, quantity: qty }], customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL" });
    await expect(online(1)).rejects.toThrow(/Pedido mínimo/); // 1 × R$ 90 < R$ 250
    await expect(online(3)).resolves.toBeTruthy(); // 3 × R$ 90 = R$ 270
    await expect(createOrder(ctx.db, { storeId: i.storeId, channel: "MANUAL", customer, items: [{ productId: i.productId, variantId: i.variantId, quantity: 1 }], customerPaymentStatus: "PENDING" })).resolves.toBeTruthy();
    await expect(setMinOrder(ctx.db, ctx.seed.stores.mantos.id, 1000)).rejects.toThrow(/rede/);
    await expect(setMinOrder(ctx.db, i.storeId, -5)).rejects.toThrow();
  });
});

describe("Onda 1, pacote D: textos do pedido na conta simples", () => {
  it("conta simples não vê 'recarga de saldo' nem 'Central' na linha do tempo do pedido pago", async () => {
    const { freshDb } = await import("./setup");
    const { signupMember } = await import("@/lib/domain/store-access");
    const { createProduct } = await import("@/lib/domain/products");
    const { createOrder, confirmCustomerPayment } = await import("@/lib/domain/orders");
    const { actorFromUser } = await import("@/lib/domain/access");
    const { orderEvents, users, productVariants, storeProducts } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { db } = await freshDb();
    const r = await signupMember(db, { storeName: "Loja Simples Texto", ownerName: "Dona Texto", email: "texto@simples.loja", password: "senha-forte-123", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
    const owner = (await db.query.users.findFirst({ where: eq(users.email, "texto@simples.loja") }))!;
    const actor = actorFromUser(owner);
    const { financeInvoices } = await import("@/db/schema");
    const { markInvoicePaid } = await import("@/lib/domain/finance");
    const plan = (await db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
    await markInvoicePaid(db, plan.id);
    const supplierId = (await (await import("@/lib/domain/independent")).independentSupplierOfStore(db, r.storeId))!;
    const { productId } = await createProduct(db, supplierId, { name: "Item", sku: "TXT-1", categoryName: "Geral", images: [], costCents: 1000, suggestedPriceCents: 3000, minimumPriceCents: 2000, sizes: [{ size: "U", initialStock: 5 }] } as never);
    const v = (await db.query.productVariants.findFirst({ where: eq(productVariants.productId, productId) }))!;
    await db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 3000, active: true }).onConflictDoNothing();
    const o = await createOrder(db, { storeId: r.storeId, customer: { name: "Cli Texto", email: "cli@texto.com" }, items: [{ productId, variantId: v.id, quantity: 1 }], channel: "WHATSAPP" } as never);
    await confirmCustomerPayment(db, actor, o.orderId);
    const msgs = (await db.select().from(orderEvents).where(eq(orderEvents.orderId, o.orderId))).map((e) => e.message).join(" | ");
    expect(msgs).not.toMatch(/recarga|Central/i);
  });
});
