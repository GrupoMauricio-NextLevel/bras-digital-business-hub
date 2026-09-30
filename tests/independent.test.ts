import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { financeInvoices, networks, orders, productVariants, storeProducts, stores, suppliers, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogSupplierId, independentSupplierOfStore } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser } from "@/lib/domain/access";
import { financeOverview, closeMonth, markInvoicePaid } from "@/lib/domain/finance";
import { listSignupSuppliers } from "@/lib/domain/store-access";
import { getLevel } from "@/lib/domain/inventory";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const CPF = "529.982.247-25";
const CPF2 = "111.444.777-35";

const open = (over: Record<string, unknown> = {}) => signupMember(ctx.db, { storeName: "Moda Brás Atacado", ownerName: "Maria Souza", email: "maria@modabras.com.br", password: "senha-segura-1", taxId: CPF, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, ...over } as never);

const product = (sku: string) => ({ name: `Vestido ${sku}`, sku, categoryName: "Vestidos", costCents: 3000, suggestedPriceCents: 9000, minimumPriceCents: 5000, sizes: [{ size: "M", initialStock: 10 }] });

describe("conta simples (abrir loja sem fornecedor)", () => {
  it("cria Central oculta, loja própria, usuário dono e fatura do plano, sem taxa de Central", async () => {
    const r = await open();
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(store.kind).toBe("SUPPLIER_OWN");
    const hidden = await independentSupplierOfStore(ctx.db, r.storeId);
    expect(hidden).toBeTruthy();
    const sup = (await ctx.db.query.suppliers.findFirst({ where: eq(suppliers.id, hidden!) }))!;
    expect(sup.hidden).toBe(true); expect(sup.platformFeePercent).toBe(0);
    const user = (await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!;
    expect(user.role).toBe("STORE_OWNER");
    // Só um usuário: não há gestor de fornecedor para a Central oculta.
    expect((await ctx.db.select().from(users).where(eq(users.supplierId, hidden!))).length).toBe(0);
    const invs = await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId));
    expect(invs.every((i) => i.payerType === "STORE")).toBe(true);
    expect(invs.length).toBeGreaterThan(0);
  });

  it("a Central oculta não aparece na lista de fornecedores nem no Master", async () => {
    await open();
    expect((await listSignupSuppliers(ctx.db)).every((s) => !s.slug.startsWith("c-"))).toBe(true);
    const visible = await ctx.db.select().from(suppliers).where(eq(suppliers.hidden, false));
    const ov = await financeOverview(ctx.db, "2026-10");
    expect(ov.perSupplier.length).toBe(visible.length);
  });

  it("fechamento mensal não cobra a Central oculta", async () => {
    const r = await open();
    const hidden = (await independentSupplierOfStore(ctx.db, r.storeId))!;
    await closeMonth(ctx.db, "2026-10");
    const invs = await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.supplierId, hidden));
    expect(invs.filter((i) => i.payerType === "SUPPLIER")).toHaveLength(0);
  });

  it("e-mail repetido é recusado e cupom de fornecedor não vale na conta simples", async () => {
    await open();
    await expect(open({ taxId: CPF2 })).rejects.toThrow(/e-mail/i);
  });

  it("cadastra produto na própria Central oculta e vende sem carteira", async () => {
    const r = await open();
    const owner = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
    const supplierId = await catalogSupplierId(ctx.db, owner);
    // Antes do pagamento do plano a loja não vende (bloqueada); pago o Pix, libera.
    await expect(createOrder(ctx.db, { storeId: r.storeId, customer, items: [], customerPaymentStatus: "PAID" })).rejects.toThrow();
    const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
    await markInvoicePaid(ctx.db, plan.id);
    const { productId } = await createProduct(ctx.db, supplierId, product("VST-1"));
    await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 9000, packPriceCents: null, active: true, featured: false });
    const variant = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!;
    const before = (await getLevel(ctx.db, variant.id)).available;
    const o = await createOrder(ctx.db, { storeId: r.storeId, customer, items: [{ productId, variantId: variant.id, quantity: 2 }], customerPaymentStatus: "PAID" });
    expect((await getLevel(ctx.db, variant.id)).available).toBe(before - 2);
    const row = (await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))!;
    expect(row.centralPaymentStatus).toBe("PAID");
    expect(row.status).toBe("AWAITING_LABEL");
  });

  it("isolamento: uma conta simples não mexe no catálogo da outra nem no de fornecedor", async () => {
    const a = await open();
    const b = await open({ email: "joao@loja.com.br", storeName: "Loja do João", taxId: CPF2 });
    const ownerA = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, a.userId) }))!);
    const supA = await catalogSupplierId(ctx.db, ownerA);
    const supB = (await independentSupplierOfStore(ctx.db, b.storeId))!;
    expect(supA).not.toBe(supB);
    const nets = await ctx.db.select().from(networks);
    expect(nets.find((n) => n.supplierId === supA)?.id).not.toBe(nets.find((n) => n.supplierId === supB)?.id);
    // Lojista membro de fornecedor comum não ganha acesso ao catálogo.
    await expect(catalogSupplierId(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });

  it("sem o modo independente, o cadastro continua exigindo fornecedor", async () => {
    await expect(signupMember(ctx.db, { storeName: "Outra", ownerName: "Ana Lima", email: "ana@x.com.br", password: "senha-segura-1", taxId: CPF, offer: "STORE_SUBDOMAIN" })).rejects.toThrow(/fornecedor/i);
  });
});
