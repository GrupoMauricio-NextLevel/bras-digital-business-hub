import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { categories, networks, orders, organizations, products, storeAcquisitions, storeProducts, stores, supplierContracts, suppliers } from "@/db/schema";
import { createStore } from "@/lib/domain/provisioning";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { newId } from "@/lib/ids";
import { customer, freshDb } from "./setup";

/**
 * D89: a migração 0041 converte as lojas da Commerce que ainda têm "Central oculta" (dados de produção) em lojas
 * independentes: catálogo, categorias, pedidos e plataforma de envio passam para a loja e o fornecedor oculto é apagado.
 * Monta o cenário antigo no banco atual e aplica só a parte de dados da migração.
 */
const dataStatements = () => {
  const file = readFileSync(path.resolve(process.cwd(), "drizzle/0041_loja_independente_dona_do_catalogo.sql"), "utf8");
  return file.slice(file.indexOf("CREATE TEMP TABLE")).split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
};

describe("migração da Central oculta para loja independente", () => {
  it("move catálogo, pedidos e envio para a loja, apaga o fornecedor oculto e não toca no SuperDrop", async () => {
    const { db, seed } = await freshDb();
    // Cenário antigo: fornecedor oculto com rede, contrato e uma loja da Commerce.
    const orgId = newId("org"); const supplierId = newId("sup"); const networkId = newId("net");
    await db.insert(organizations).values({ id: orgId, name: "Central de Loja Antiga", slug: `c-antiga-${orgId.slice(-5)}`, type: "SUPPLIER", brand: "NEXTLEVEL_COMMERCE" });
    await db.insert(suppliers).values({ id: supplierId, organizationId: orgId, name: "Loja Antiga", slug: `c-antiga-${supplierId.slice(-5)}`, hidden: true, businessModel: "WHITE_LABEL", platformFeePercent: 0, setupFeeCents: 0, shippingProvider: "ONLOG", shippingStatus: "CONNECTED", shippingTokenEnc: "cifrado", shippingAccount: "credencial Onlog", shippingOriginZip: "01001000" });
    await db.insert(networks).values({ id: networkId, supplierId, name: "Rede Loja Antiga", slug: `rede-antiga-${networkId.slice(-5)}` });
    const created = await createStore(db, supplierId, { name: "Loja Antiga", offer: "STORE_SUBDOMAIN", ownerName: "Bia", ownerEmail: "bia@antiga.com.br", brand: "NEXTLEVEL_COMMERCE" });
    const storeId = created.storeId;
    await db.update(stores).set({ status: "ACTIVE", kind: "SUPPLIER_OWN", paidUntil: "2099-01-01T00:00:00.000Z", trialEndsAt: null }).where(eq(stores.id, storeId));
    const { productId } = await createProduct(db, supplierId, { name: "Bolsa Antiga", sku: "ANT-1", categoryName: "Bolsas", costCents: 2000, suggestedPriceCents: 6000, minimumPriceCents: 4000, sizes: [{ size: "U", initialStock: 5 }] });
    await db.insert(storeProducts).values({ storeId, productId, priceCents: 6000, packPriceCents: null, active: true, featured: false });
    const variantId = (await db.query.productVariants.findFirst({ where: (v, { eq }) => eq(v.productId, productId) }))!.id;
    const order = await createOrder(db, { storeId, customer, items: [{ productId, variantId, quantity: 1 }], customerPaymentStatus: "PAID" });
    expect((await db.query.orders.findFirst({ where: eq(orders.id, order.orderId) }))!.supplierId).toBe(supplierId);
    const superdropProducts = (await db.select().from(products).where(eq(products.supplierId, seed.supplierId))).length;

    await db.transaction(async (tx) => { for (const stmt of dataStatements()) await tx.execute(sql.raw(stmt)); });

    const store = (await db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
    expect(store.networkId).toBeNull();
    expect(store).toMatchObject({ shippingProvider: "ONLOG", shippingStatus: "CONNECTED", shippingTokenEnc: "cifrado", shippingAccount: "credencial Onlog", shippingOriginZip: "01001000" });
    const p = (await db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    expect(p).toMatchObject({ storeId, supplierId: null, networkId: null });
    const cat = (await db.query.categories.findFirst({ where: eq(categories.id, p.categoryId!) }))!;
    expect(cat).toMatchObject({ storeId, supplierId: null });
    expect((await db.query.orders.findFirst({ where: eq(orders.id, order.orderId) }))!.supplierId).toBeNull();
    expect(await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) })).toBeUndefined();
    expect(await db.query.networks.findFirst({ where: eq(networks.id, networkId) })).toBeUndefined();
    expect(await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })).toBeUndefined();
    expect(await db.select().from(supplierContracts).where(eq(supplierContracts.supplierId, supplierId))).toHaveLength(0);
    expect(await db.select().from(storeAcquisitions).where(eq(storeAcquisitions.storeId, storeId))).toHaveLength(0);
    // A loja continua vendendo o próprio catálogo.
    expect((await listStoreCatalog(db, storeId)).map((c) => c.product.id)).toEqual([productId]);
    // SuperDrop intacto.
    expect((await db.select().from(products).where(eq(products.supplierId, seed.supplierId))).length).toBe(superdropProducts);
    expect((await db.query.suppliers.findFirst({ where: eq(suppliers.id, seed.supplierId) }))).toBeTruthy();
    expect(await db.select().from(suppliers).where(eq(suppliers.hidden, true))).toHaveLength(0);
  });
});
