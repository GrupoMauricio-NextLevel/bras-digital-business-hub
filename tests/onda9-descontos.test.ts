import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { financeInvoices, orders, productVariants, storeDiscounts, storeProducts, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogSupplierId } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { cancelOrder, createOrder } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { createDiscount } from "@/lib/domain/discounts";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function independent(n = 1) {
  const r = await signupMember(ctx.db, { storeName: `Moda ${n}`, ownerName: "Maria Souza", email: `maria${n}@moda.com.br`, password: "senha-segura-1", taxId: n === 1 ? "529.982.247-25" : "111.444.777-35", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
  const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const { productId } = await createProduct(ctx.db, await catalogSupplierId(ctx.db, owner), { name: "Vestido", sku: `V-${n}`, categoryName: "Vestidos", costCents: 4000, suggestedPriceCents: 10000, minimumPriceCents: 5000, sizes: [{ size: "M", initialStock: 20 }] });
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
