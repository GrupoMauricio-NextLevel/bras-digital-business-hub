import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { coupons, organizations, products, stores } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { assertCanAccess } from "@/lib/domain/access";
import { isClosedCommerceOrganization, isClosedCommerceSupplier } from "@/lib/domain/bras/fronteira";
import { listStoreCatalog, listSupplierCatalog } from "@/lib/domain/catalog";
import { listOrdersForActor } from "@/lib/domain/orders";
import { createProduct } from "@/lib/domain/products";
import { createStore, createSupplier } from "@/lib/domain/provisioning";
import { listSignupSuppliers, signupMember } from "@/lib/domain/store-access";
import { getPublicSupplierPage } from "@/lib/domain/supplier-page";
import { newId } from "@/lib/ids";

/**
 * Fronteira da Brás Digital (operação fechada) no motor compartilhado:
 * importadora de marca fechada não aparece em superfície pública, e a marca não afrouxa o isolamento por tenant.
 * SuperDrop e Commerce seguem iguais (casos de controle em cada teste).
 */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let bras: { supplierId: string; slug: string; productId: string; actor: Actor };

const produto = { name: "Caixa Garrafa Térmica 24un", sku: "bd-cx-01", categoryName: "Utilidades", costCents: 30000, suggestedPriceCents: 48000, minimumPriceCents: 42000, sizes: [{ size: "UN", initialStock: 37 }] };

beforeEach(async () => {
  ctx = await freshDb();
  const { supplierId } = await createSupplier(ctx.db, { name: "Importadora Teste Brás", adminName: "Responsável Brás", adminEmail: "importadora@bras.teste", brand: "BRAS_DIGITAL" });
  const sup = (await ctx.db.query.suppliers.findFirst({ where: (s, { eq: e }) => e(s.id, supplierId) }))!;
  const { productId } = await createProduct(ctx.db, supplierId, produto);
  await ctx.db.update(products).set({ status: "ACTIVE", distribution: "ALL_NETWORK" }).where(eq(products.id, productId));
  const admin = (await ctx.db.query.users.findFirst({ where: (u, { eq: e }) => e(u.supplierId, supplierId) }))!;
  bras = { supplierId, slug: sup.slug, productId, actor: { userId: admin.id, role: "SUPPLIER_ADMIN", organizationId: admin.organizationId, supplierId, storeId: null } };
});

describe("importadora da Brás Digital fora das superfícies públicas", () => {
  it("a organização da importadora é de marca fechada; a do SuperDrop não", async () => {
    expect(await isClosedCommerceSupplier(ctx.db, bras.supplierId)).toBe(true);
    expect(await isClosedCommerceSupplier(ctx.db, ctx.seed.supplierId)).toBe(false);
    expect(await isClosedCommerceSupplier(ctx.db, "sup_inexistente")).toBe(false);
    expect(await isClosedCommerceOrganization(ctx.db, "org_inexistente")).toBe(false);
  });

  it("não tem página pública de vendas (sem nome, produto nem preço); a do SuperDrop continua no ar", async () => {
    expect(await getPublicSupplierPage(ctx.db, bras.slug)).toBeNull();
    const superdrop = await getPublicSupplierPage(ctx.db, "central-sports");
    expect(superdrop?.name).toBe("Central Sports");
    expect(superdrop?.products.length).toBeGreaterThan(0);
  });

  it("não aparece na lista pública de fornecedores do cadastro de loja", async () => {
    const lista = await listSignupSuppliers(ctx.db);
    expect(lista.map((s) => s.slug)).toContain("central-sports");
    expect(lista.map((s) => s.slug)).not.toContain(bras.slug);
    expect(JSON.stringify(lista)).not.toContain("Importadora Teste Brás");
  });

  it("cadastro público não abre loja abastecida pela importadora, nem pelo endereço nem por cupom, sem revelar que ela existe", async () => {
    const base = { storeName: "Loja Curiosa", ownerName: "Pessoa Curiosa", password: "senha-forte-1", offer: "STORE_SUBDOMAIN" as const };
    await expect(signupMember(ctx.db, { ...base, email: "curiosa@teste.com", taxId: "52998224725", supplierSlug: bras.slug })).rejects.toThrow("Escolha o fornecedor que vai abastecer a sua loja.");
    await ctx.db.insert(coupons).values({ id: newId("cpn"), code: "BRAS7", supplierId: bras.supplierId });
    await expect(signupMember(ctx.db, { ...base, email: "cupom@teste.com", taxId: "11144477735", code: "BRAS7" })).rejects.toThrow("Escolha o fornecedor que vai abastecer a sua loja.");
    // Nada foi criado pela tentativa.
    expect(await ctx.db.query.users.findFirst({ where: (u, { eq: e }) => e(u.email, "curiosa@teste.com") })).toBeUndefined();
    expect(await ctx.db.query.users.findFirst({ where: (u, { eq: e }) => e(u.email, "cupom@teste.com") })).toBeUndefined();
    // Controle: o cadastro do SuperDrop segue igual.
    const ok = await signupMember(ctx.db, { ...base, email: "lojista@teste.com", taxId: "39053344705", supplierSlug: "central-sports" });
    const org = await ctx.db.select({ brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, ok.storeId));
    expect(org[0]?.brand).toBe("SUPERDROP");
  });
});

describe("isolamento por tenant com a Brás Digital no mesmo banco", () => {
  it("importadora da Brás vê só o próprio catálogo e pedidos; o SuperDrop não vê o catálogo dela", async () => {
    const proprio = await listSupplierCatalog(ctx.db, bras.supplierId);
    expect(proprio.map((c) => c.product.id)).toEqual([bras.productId]);
    const superdrop = await listSupplierCatalog(ctx.db, ctx.seed.supplierId);
    expect(superdrop.some((c) => c.product.id === bras.productId)).toBe(false);
    expect(await listOrdersForActor(ctx.db, bras.actor)).toEqual([]);
    expect((await listOrdersForActor(ctx.db, ctx.actors.supplier)).length).toBeGreaterThan(0);
  });

  it("importadora da Brás não acessa registro de outro fornecedor nem de loja de outra rede (e vice-versa)", () => {
    expect(() => assertCanAccess(bras.actor, { supplierId: ctx.seed.supplierId })).toThrow();
    expect(() => assertCanAccess(bras.actor, { storeId: ctx.seed.stores.mantos.id, supplierId: ctx.seed.supplierId })).toThrow();
    expect(() => assertCanAccess(ctx.actors.supplier, { supplierId: bras.supplierId })).toThrow();
    expect(() => assertCanAccess(ctx.actors.mantos, { supplierId: bras.supplierId })).toThrow();
    expect(() => assertCanAccess(bras.actor, { supplierId: bras.supplierId })).not.toThrow();
  });

  it("conta de membro com marca Brás não lê pedidos nem catálogo de outra loja", async () => {
    const membro = await createStore(ctx.db, null, { name: "Membro Brás Teste", ownerName: "Membro Teste", ownerEmail: "membro@bras.teste", brand: "BRAS_DIGITAL" });
    const user = (await ctx.db.query.users.findFirst({ where: (u, { eq: e }) => e(u.email, "membro@bras.teste") }))!;
    const actor: Actor = { userId: user.id, role: "STORE_OWNER", organizationId: user.organizationId, supplierId: null, storeId: membro.storeId };
    expect(await listOrdersForActor(ctx.db, actor)).toEqual([]);
    expect(() => assertCanAccess(actor, { storeId: ctx.seed.stores.mantos.id })).toThrow();
    expect(() => assertCanAccess(actor, { supplierId: bras.supplierId })).toThrow();
    expect(() => assertCanAccess(ctx.actors.mantos, { storeId: membro.storeId })).toThrow();
    // Loja independente: o catálogo dela não traz produto da importadora nem da rede do SuperDrop.
    const catalogo = await listStoreCatalog(ctx.db, membro.storeId);
    expect(catalogo.some((c) => c.product.id === bras.productId || c.product.supplierId === ctx.seed.supplierId)).toBe(false);
  });
});
