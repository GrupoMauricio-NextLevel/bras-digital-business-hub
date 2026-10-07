import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { financeInvoices, orders, productVariants, storeDiscounts, storeProducts, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { advanceOrder, cancelOrder, createOrder, registerShippingLabel } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { createDiscount } from "@/lib/domain/discounts";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function independent(n = 1) {
  const r = await signupMember(ctx.db, { storeName: `Moda ${n}`, ownerName: "Maria Souza", email: `maria${n}@moda.com.br`, password: "senha-segura-1", taxId: n === 1 ? "529.982.247-25" : "111.444.777-35", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
  const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Vestido", sku: `V-${n}`, categoryName: "Vestidos", costCents: 4000, suggestedPriceCents: 10000, minimumPriceCents: 5000, sizes: [{ size: "M", initialStock: 100 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 10000, packPriceCents: null, active: true, featured: false });
  const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
  return { ...r, owner, productId, variantId };
}
const buy = (i: Awaited<ReturnType<typeof independent>>, code?: string, qty = 1, paid = false) => createOrder(ctx.db, { storeId: i.storeId, customer, items: [{ productId: i.productId, variantId: i.variantId, quantity: qty }], customerPaymentStatus: paid ? "PAID" : "PENDING", discountCode: code }, { paymentProvider: "MANUAL", reservationMinutes: 30 });

describe("Onda 9 — cupom de desconto do consumidor", () => {
  it("percentual e fixo reduzem o total; o subtotal bruto e o desconto ficam registrados", async () => {
    const i = await independent();
    await createDiscount(ctx.db, i.storeId, { code: "dez", kind: "PERCENT", value: 10 });
    await createDiscount(ctx.db, i.storeId, { code: "CINCO", kind: "FIXED", value: 500 });
    const a = await buy(i, "DEZ", 2);
    const oa = (await ctx.db.query.orders.findFirst({ where: eq(orders.id, a.orderId) }))!;
    expect([oa.subtotalCents, oa.discountCents, oa.totalCents, oa.discountCode]).toEqual([20000, 2000, 18000, "DEZ"]);
    const b = await buy(i, "cinco");
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, b.orderId) }))!.totalCents).toBe(9500);
  });

  it("nunca abaixo do custo; código inválido, vencido, sem mínimo ou de outra loja é recusado", async () => {
    const i = await independent(1);
    const j = await independent(2);
    await createDiscount(ctx.db, i.storeId, { code: "TUDO", kind: "PERCENT", value: 90 });
    const o = await buy(i, "TUDO"); // custo 4000, bruto 10000: desconto limitado a 6000
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!.discountCents).toBe(6000);
    await expect(buy(i, "NAOEXISTE")).rejects.toThrow(/inválido/);
    await expect(buy(j, "TUDO")).rejects.toThrow(/inválido/); // cupom é da loja i
    await createDiscount(ctx.db, i.storeId, { code: "VELHO", kind: "FIXED", value: 100, startsAt: "2020-01-01T00:00:00Z", expiresAt: "2020-02-01T00:00:00Z" });
    await expect(buy(i, "VELHO")).rejects.toThrow(/prazo/);
    await createDiscount(ctx.db, i.storeId, { code: "MIN", kind: "FIXED", value: 100, minSubtotalCents: 50000 });
    await expect(buy(i, "MIN")).rejects.toThrow(/mínimo/);
  });

  it("limite de usos vale mesmo em compras simultâneas e o cancelamento devolve o uso", async () => {
    const i = await independent();
    const { id } = await createDiscount(ctx.db, i.storeId, { code: "UNICO", kind: "FIXED", value: 100, maxRedemptions: 1 });
    const rs = await Promise.allSettled([buy(i, "UNICO"), buy(i, "UNICO")]);
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await ctx.db.query.storeDiscounts.findFirst({ where: eq(storeDiscounts.id, id) }))!.redemptions).toBe(1);
    const ok = rs.find((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ orderId: string }>;
    await cancelOrder(ctx.db, i.owner, ok.value.orderId);
    expect((await ctx.db.query.storeDiscounts.findFirst({ where: eq(storeDiscounts.id, id) }))!.redemptions).toBe(0);
    await expect(buy(i, "UNICO")).resolves.toBeTruthy();
  });

  it("loja de rede (SuperDrop) não cria nem usa cupom", async () => {
    await expect(createDiscount(ctx.db, ctx.seed.stores.mantos.id, { code: "REDE", kind: "PERCENT", value: 10 })).rejects.toThrow(/rede/);
  });
});

describe("Onda 9 — preço por quantidade", () => {
  it("faixa vale pela soma dos tamanhos, respeita custo/ordem e é recalculada no servidor", async () => {
    const { setPriceTiers } = await import("@/lib/domain/price-tiers");
    const { createProposal } = await import("@/lib/domain/proposals");
    const i = await independent();
    await expect(setPriceTiers(ctx.db, i.storeId, i.productId, [{ minQty: 6, priceCents: 3000 }])).rejects.toThrow(/abaixo do custo/); // custo 4000
    await expect(setPriceTiers(ctx.db, i.storeId, i.productId, [{ minQty: 6, priceCents: 9000 }, { minQty: 12, priceCents: 9500 }])).rejects.toThrow(/menor/);
    await setPriceTiers(ctx.db, i.storeId, i.productId, [{ minQty: 6, priceCents: 9000 }, { minQty: 12, priceCents: 8000 }]);
    const row = async (q: number) => (await ctx.db.query.orders.findFirst({ where: eq(orders.id, (await buy(i, undefined, q)).orderId) }))!;
    expect((await row(5)).subtotalCents).toBe(5 * 10000);
    expect((await row(6)).subtotalCents).toBe(6 * 9000);
    expect((await row(12)).subtotalCents).toBe(12 * 8000);
    const p = await createProposal(ctx.db, i.storeId, { customer: { name: "Cliente Atacado", email: "at@x.com" }, items: [{ productId: i.productId, variantId: i.variantId, quantity: 6 }] });
    expect((await ctx.db.query.proposals.findFirst({ where: (t, { eq: e }) => e(t.token, p.token) }))!.subtotalCents).toBe(54000);
  });

  it("loja de rede não cria faixa; outra loja não altera as faixas alheias", async () => {
    const { setPriceTiers } = await import("@/lib/domain/price-tiers");
    await expect(setPriceTiers(ctx.db, ctx.seed.stores.mantos.id, ctx.seed.productIds[11]!, [{ minQty: 6, priceCents: 1 }])).rejects.toThrow(/rede/);
    const a = await independent(1);
    const b = await independent(2);
    await expect(setPriceTiers(ctx.db, b.storeId, a.productId, [{ minQty: 6, priceCents: 9000 }])).rejects.toThrow(/não encontrado/);
  });
});

describe("Onda 9 — avaliações de clientes", () => {
  it("só avalia quem comprou (pago e enviado); uma por produto; moderação publica; outra loja não modera", async () => {
    const { reviewableItems, submitReview, approvedReviews, listReviewsForStore, moderateReview } = await import("@/lib/domain/reviews");
    const a = await independent(1);
    const b = await independent(2);
    const o = await buy(a, undefined, 1, true);
    const who = { number: String((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!.number), email: customer.email };
    // antes do envio: não pode avaliar
    expect(await reviewableItems(ctx.db, a.storeId, who)).toEqual([]);
    await expect(submitReview(ctx.db, a.storeId, { ...who, productId: a.productId, rating: 5 })).rejects.toThrow(/pago e enviado/);
    await registerShippingLabel(ctx.db, a.owner, o.orderId, { code: "ME123456BR", carrier: "Correios" });
    for (const st of ["PICKING", "READY_TO_SHIP", "SHIPPED"] as const) await advanceOrder(ctx.db, a.owner, o.orderId, st);
    expect((await reviewableItems(ctx.db, a.storeId, who)).map((i) => i.productId)).toEqual([a.productId]);
    await expect(submitReview(ctx.db, a.storeId, { ...who, email: "outro@x.com", productId: a.productId, rating: 5 })).rejects.toThrow(/pago e enviado/);
    await expect(submitReview(ctx.db, a.storeId, { ...who, productId: a.productId, rating: 9 })).rejects.toThrow();
    await submitReview(ctx.db, a.storeId, { ...who, productId: a.productId, rating: 4, body: "Chegou rápido" });
    await expect(submitReview(ctx.db, a.storeId, { ...who, productId: a.productId, rating: 5 })).rejects.toThrow(/já avaliou/);
    expect((await approvedReviews(ctx.db, a.storeId, a.productId)).count).toBe(0); // pendente não aparece
    const rev = (await listReviewsForStore(ctx.db, a.storeId))[0]!.r;
    await expect(moderateReview(ctx.db, b.storeId, rev.id, "APPROVED")).rejects.toThrow(/não encontrada/);
    await moderateReview(ctx.db, a.storeId, rev.id, "APPROVED");
    const pub = await approvedReviews(ctx.db, a.storeId, a.productId);
    expect([pub.count, pub.avg, pub.items[0]!.author]).toEqual([1, 4, "Cliente"]);
  });
});
