import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { orders, productVariants, storeProducts, stores, suppliers, users } from "@/db/schema";
import { createOwnStore, getOwnStore, ownStoreUserFor, supplierAdminForOwnStore, syncOwnStoreMp, OWN_STORE_EMAIL } from "@/lib/domain/own-store";
import { createOrder } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { remindStoreAboutOrder, stockHolds } from "@/lib/domain/operations";
import { verifyShippingToken, ShippingError } from "@/lib/shipping/providers";
import { encryptSecret } from "@/lib/security/crypto";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe("loja própria do fornecedor", () => {
  it("cria a loja com o catálogo, o mesmo Mercado Pago e um usuário interno; é idempotente", async () => {
    await ctx.db.update(suppliers).set({ walletMpTokenEnc: encryptSecret("TEST-1234567890123456789012") }).where(eq(suppliers.id, ctx.seed.supplierId));
    const r = await createOwnStore(ctx.db, ctx.actors.supplier);
    expect(r.created).toBe(true);
    const again = await createOwnStore(ctx.db, ctx.actors.supplier);
    expect(again).toMatchObject({ created: false, storeId: r.storeId });
    const own = (await getOwnStore(ctx.db, ctx.seed.supplierId))!;
    expect(own.kind).toBe("SUPPLIER_OWN"); expect(own.paymentStatus).toBe("CONNECTED"); expect(own.mpAccessTokenEnc).toBeTruthy();
    expect(own.trialEndsAt).toBeNull(); expect(own.paidUntil).toBeNull();
    const listed = await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, own.id));
    expect(listed.length).toBeGreaterThan(0); expect(listed.every((l) => !l.active)).toBe(true);
    const owner = await ownStoreUserFor(ctx.db, ctx.actors.supplier);
    expect(owner.role).toBe("STORE_OWNER");
    const sup = (await ctx.db.query.suppliers.findFirst({ where: eq(suppliers.id, ctx.seed.supplierId) }))!;
    expect(owner.email).toBe(OWN_STORE_EMAIL(sup.slug));
    expect((await supplierAdminForOwnStore(ctx.db, owner.id)).role).toBe("SUPPLIER_ADMIN");
  });
  it("só o gestor cria e um lojista não vira gestor pela troca de contexto", async () => {
    await expect(createOwnStore(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await expect(supplierAdminForOwnStore(ctx.db, ctx.actors.mantos.userId)).rejects.toThrow();
    const owners = await ctx.db.select().from(users).where(eq(users.role, "STORE_OWNER"));
    expect(owners.length).toBeGreaterThan(0);
  });
  it("sincroniza o Mercado Pago ao conectar e ao desconectar", async () => {
    await createOwnStore(ctx.db, ctx.actors.supplier);
    expect((await getOwnStore(ctx.db, ctx.seed.supplierId))!.paymentStatus).toBe("NOT_CONFIGURED");
    await ctx.db.update(suppliers).set({ walletMpTokenEnc: encryptSecret("TEST-abcdefghijklmnopqrstuvwx") }).where(eq(suppliers.id, ctx.seed.supplierId));
    await syncOwnStoreMp(ctx.db, ctx.seed.supplierId);
    expect((await getOwnStore(ctx.db, ctx.seed.supplierId))!.paymentStatus).toBe("CONNECTED");
    await ctx.db.update(suppliers).set({ walletMpTokenEnc: null }).where(eq(suppliers.id, ctx.seed.supplierId));
    await syncOwnStoreMp(ctx.db, ctx.seed.supplierId);
    expect((await getOwnStore(ctx.db, ctx.seed.supplierId))!.mpAccessTokenEnc).toBeNull();
  });
  it("pedido da loja própria baixa o estoque central, não debita carteira e segue para etiqueta", async () => {
    const { storeId } = await createOwnStore(ctx.db, ctx.actors.supplier);
    const pid = ctx.seed.productIds[0]!;
    await ctx.db.update(storeProducts).set({ active: true }).where(eq(storeProducts.storeId, storeId));
    const variant = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, pid)))[0]!;
    const before = (await getLevel(ctx.db, variant.id)).available;
    const o = await createOrder(ctx.db, { storeId, customer, items: [{ productId: pid, variantId: variant.id, quantity: 1 }], customerPaymentStatus: "PAID" });
    expect((await getLevel(ctx.db, variant.id)).available).toBe(before - 1);
    const row = (await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!;
    expect(row.centralPaymentStatus).toBe("PAID"); expect(row.status).toBe("AWAITING_LABEL");
  });
  it("loja de membro e loja própria descontam do mesmo estoque", async () => {
    const own = await createOwnStore(ctx.db, ctx.actors.supplier);
    await ctx.db.update(storeProducts).set({ active: true }).where(eq(storeProducts.storeId, own.storeId));
    const pid = ctx.seed.productIds[0]!;
    const variant = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, pid)))[0]!;
    const start = (await getLevel(ctx.db, variant.id)).available;
    await createOrder(ctx.db, { storeId: own.storeId, customer, items: [{ productId: pid, variantId: variant.id, quantity: 2 }], customerPaymentStatus: "PAID" });
    await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: pid, variantId: variant.id, quantity: 1 }], customerPaymentStatus: "PAID" });
    expect((await getLevel(ctx.db, variant.id)).available).toBe(start - 3);
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, ctx.seed.stores.mantos.id) }))?.kind).toBe("MEMBER");
  });
});

describe("pendências que seguram estoque", () => {
  it("lista pedidos pagos sem etiqueta ou saldo, cobra o lojista sem repetir em 6 horas", async () => {
    const pid = ctx.seed.productIds[0]!;
    const variant = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, pid)))[0]!;
    const o = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: pid, variantId: variant.id, quantity: 2 }], customerPaymentStatus: "PAID" });
    const now = new Date(Date.now() + 14 * 3_600_000);
    const holds = await stockHolds(ctx.db, ctx.seed.supplierId, now);
    const h = holds.find((x) => x.orderId === o.orderId);
    expect(h).toBeTruthy();
    expect(h!.pieces).toBe(2); expect(h!.late).toBe(true);
    expect((await remindStoreAboutOrder(ctx.db, ctx.actors.supplier, o.orderId, now)).sent).toBe(true);
    expect((await remindStoreAboutOrder(ctx.db, ctx.actors.supplier, o.orderId, now)).sent).toBe(false);
    await expect(remindStoreAboutOrder(ctx.db, ctx.actors.mantos, o.orderId, now)).rejects.toThrow();
  });
});

describe("plataforma de envio", () => {
  it("valida o token na plataforma e mostra a conta", async () => {
    const seen: string[] = [];
    const r = await verifyShippingToken("SUPERFRETE", "tok", (url, init) => { seen.push(url + " " + (init?.headers as Record<string, string>)?.Authorization); return ok({ email: "ana@loja.com" }); });
    expect(r.account).toBe("ana@loja.com"); expect(seen[0]).toContain("Bearer tok");
    await expect(verifyShippingToken("MELHOR_ENVIO", "x", () => Promise.resolve(new Response("", { status: 401 })))).rejects.toBeInstanceOf(ShippingError);
    await expect(verifyShippingToken("MELHOR_ENVIO", "x", () => Promise.reject(new Error("rede")))).rejects.toThrow(/Não foi possível falar/);
  });
});
