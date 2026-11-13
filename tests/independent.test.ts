import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { categories, financeInvoices, networks, orders, productVariants, products, storeAcquisitions, storeProducts, stores, suppliers, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner, isIndependentStore } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { financeOverview, closeMonth, markInvoicePaid } from "@/lib/domain/finance";
import { listSignupSuppliers } from "@/lib/domain/store-access";
import { getLevel } from "@/lib/domain/inventory";
import { assertProductListable, listStoreCatalog } from "@/lib/domain/catalog";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const CPF = "529.982.247-25";
const CPF2 = "111.444.777-35";

const open = (over: Record<string, unknown> = {}) => signupMember(ctx.db, { storeName: "Moda Brás Atacado", ownerName: "Maria Souza", email: "maria@modabras.com.br", password: "senha-segura-1", taxId: CPF, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, ...over } as never);

const product = (sku: string) => ({ name: `Vestido ${sku}`, sku, categoryName: "Vestidos", costCents: 3000, suggestedPriceCents: 9000, minimumPriceCents: 5000, sizes: [{ size: "M", initialStock: 10 }] });

describe("loja independente da NextLevel Commerce (D89: sem fornecedor, sem rede)", () => {
  it("abre sem fornecedor nem rede: loja, usuário dono e fatura do plano paga à NextLevel, sem comissão de canal", async () => {
    const supBefore = (await ctx.db.select().from(suppliers)).length; const netBefore = (await ctx.db.select().from(networks)).length;
    const r = await open();
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(store.networkId).toBeNull();
    expect(await isIndependentStore(ctx.db, r.storeId)).toBe(true);
    // Nenhum fornecedor, rede ou comissão é criado para a loja.
    expect((await ctx.db.select().from(suppliers)).length).toBe(supBefore);
    expect((await ctx.db.select().from(networks)).length).toBe(netBefore);
    expect(await ctx.db.select().from(storeAcquisitions).where(eq(storeAcquisitions.storeId, r.storeId))).toHaveLength(0);
    const user = (await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!;
    expect(user.role).toBe("STORE_OWNER"); expect(user.supplierId).toBeNull();
    const invs = await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId));
    expect(invs.length).toBeGreaterThan(0);
    expect(invs.every((i) => i.payerType === "STORE" && i.supplierId === null)).toBe(true);
  });

  it("não aparece entre os fornecedores nem no fechamento dos fornecedores", async () => {
    await open();
    expect((await listSignupSuppliers(ctx.db)).every((s) => !s.slug.startsWith("c-"))).toBe(true);
    const all = await ctx.db.select().from(suppliers);
    expect(all.every((s) => !s.hidden)).toBe(true);
    const ov = await financeOverview(ctx.db, "2026-10");
    expect(ov.perSupplier.length).toBe(all.length);
    await closeMonth(ctx.db, "2026-10");
  });

  it("e-mail repetido é recusado", async () => {
    await open();
    await expect(open({ taxId: CPF2 })).rejects.toThrow(/e-mail/i);
  });

  it("o catálogo é da própria loja: produto e categoria com store_id, sem fornecedor; vende sem carteira", async () => {
    const r = await open();
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const catalog = await catalogOwner(ctx.db, owner);
    expect(catalog).toEqual({ storeId: r.storeId });
    // Antes do pagamento do plano a loja não vende (bloqueada); pago o Pix, libera.
    await expect(createOrder(ctx.db, { storeId: r.storeId, customer, items: [], customerPaymentStatus: "PAID" })).rejects.toThrow();
    const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
    await markInvoicePaid(ctx.db, plan.id);
    const { productId } = await createProduct(ctx.db, catalog, product("VST-1"));
    const p = (await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    expect(p.storeId).toBe(r.storeId); expect(p.supplierId).toBeNull();
    const cat = (await ctx.db.query.categories.findFirst({ where: eq(categories.id, p.categoryId!) }))!;
    expect(cat.storeId).toBe(r.storeId); expect(cat.supplierId).toBeNull();
    await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 9000, packPriceCents: null, active: true, featured: false }).onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 9000, active: true } });
    expect((await listStoreCatalog(ctx.db, r.storeId)).map((c) => c.product.id)).toEqual([productId]);
    const variant = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!;
    const before = (await getLevel(ctx.db, variant.id)).available;
    const o = await createOrder(ctx.db, { storeId: r.storeId, customer, items: [{ productId, variantId: variant.id, quantity: 2 }], customerPaymentStatus: "PAID" });
    expect((await getLevel(ctx.db, variant.id)).available).toBe(before - 2);
    const row = (await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!;
    expect(row.supplierId).toBeNull();
    expect(row.centralPaymentStatus).toBe("PAID");
    expect(row.status).toBe("READY_TO_PICK"); // D180: a loja independente separa sem esperar etiqueta
  });

  it("isolamento: uma loja independente não vê nem vende o catálogo de outra, e membro de fornecedor não mexe no catálogo dela", async () => {
    const a = await open();
    const b = await open({ email: "joao@loja.com.br", storeName: "Loja do João", taxId: CPF2 });
    const ownerA = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, a.userId) }))!);
    const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, ownerA), product("VST-A"));
    const pa = (await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    await ctx.db.update(products).set({ status: "ACTIVE" }).where(eq(products.id, productId));
    await expect(assertProductListable(ctx.db, b.storeId, { ...pa, status: "ACTIVE" })).rejects.toThrow();
    expect(await listStoreCatalog(ctx.db, b.storeId)).toHaveLength(0);
    // Loja de membro (SuperDrop) não ganha acesso ao catálogo de ninguém pelo caminho da loja independente.
    await expect(catalogOwner(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    // O mesmo SKU pode existir em lojas diferentes (cada loja tem o seu catálogo).
    const ownerB = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, b.userId) }))!);
    await expect(createProduct(ctx.db, await catalogOwner(ctx.db, ownerB), product("VST-A"))).resolves.toBeTruthy();
  });

  it("sem o modo independente, o cadastro continua exigindo fornecedor (SuperDrop)", async () => {
    await expect(signupMember(ctx.db, { storeName: "Outra", ownerName: "Ana Lima", email: "ana@x.com.br", password: "senha-segura-1", taxId: CPF, offer: "STORE_SUBDOMAIN" })).rejects.toThrow(/fornecedor/i);
  });
});
