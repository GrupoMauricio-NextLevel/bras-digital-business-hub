import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { financeInvoices, orderItems, productVariants, products, storeProducts } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { createProduct, setProductsStatus } from "@/lib/domain/products";
import { excluirProdutos, salvarProduto, type SalvarProdutoInput } from "@/lib/domain/produto-edicao";
import { listStoreCatalog, listSupplierCatalog } from "@/lib/domain/catalog";
import { createOrder } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { parseSizeGrid } from "@/lib/domain/size-grids";
import type { CatalogOwner } from "@/lib/domain/independent";

/** D328: edição completa do produto, vitrine sincronizada, variações editáveis e excluir. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let loja: { storeId: string; owner: CatalogOwner };
beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupMember(ctx.db, { storeName: "Pé de Ouro Calçados", ownerName: "Ana Lima", email: "ana@pedeouro.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const plano = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plano.id);
  loja = { storeId: r.storeId, owner: { storeId: r.storeId } };
});

const novo = (sku = "TEN-1", status: "ACTIVE" | "DRAFT" = "ACTIVE") => createProduct(ctx.db, loja.owner, { name: `Tênis ${sku}`, sku, categoryName: "Tênis", costCents: 8000, suggestedPriceCents: 19990, minimumPriceCents: 15000, status, sizeGrid: "SHOES", images: ["/assets/ast_foto1", "https://cdn.exemplo.com/2.jpg"], sizes: [{ size: "38", initialStock: 3 }, { size: "39", initialStock: 3 }] });

async function base(productId: string): Promise<SalvarProdutoInput> {
  const p = (await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))!;
  const vs = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(productVariants.position);
  const variacoes = await Promise.all(vs.map(async (v) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, barcode: v.barcode, estoque: (await getLevel(ctx.db, v.id)).onHand })));
  return { productId, name: p.name, description: p.description, categoryName: "Tênis", sku: p.sku, slug: p.slug, costCents: p.costCents, suggestedPriceCents: p.suggestedPriceCents, minimumPriceCents: p.minimumPriceCents, status: p.status as "ACTIVE", sellsUnit: p.sellsUnit, sellsPack: p.sellsPack, seoTitle: p.seoTitle, seoDescription: p.seoDescription, images: p.images, variacoes };
}
const vitrine = (productId: string) => ctx.db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, loja.storeId), eq(storeProducts.productId, productId)) });
const vender = async (productId: string) => {
  const v = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!;
  await createOrder(ctx.db, { storeId: loja.storeId, customer, items: [{ productId, variantId: v.id, quantity: 1 }], customerPaymentStatus: "PAID" });
  return v;
};

describe("edição do produto da loja (D328)", () => {
  it("preço editado vai para a loja e o painel e a vitrine ficam iguais", async () => {
    const { productId } = await novo();
    await salvarProduto(ctx.db, loja.owner, { ...(await base(productId)), suggestedPriceCents: 24990, minimumPriceCents: 0 });
    expect((await vitrine(productId))?.priceCents).toBe(24990);
    expect((await listStoreCatalog(ctx.db, loja.storeId)).find((c) => c.product.id === productId)?.storeProduct.priceCents).toBe(24990);
  });

  it("rascunho ativado (na edição ou em lote) entra na loja; rascunho e arquivado saem", async () => {
    const { productId } = await novo("TEN-R", "DRAFT");
    expect(await vitrine(productId)).toBeUndefined();
    await setProductsStatus(ctx.db, loja.owner, [productId], "ACTIVE");
    expect((await vitrine(productId))?.active).toBe(true);
    await setProductsStatus(ctx.db, loja.owner, [productId], "DRAFT");
    expect((await vitrine(productId))?.active).toBe(false);
    await salvarProduto(ctx.db, loja.owner, { ...(await base(productId)), status: "ACTIVE" });
    expect((await vitrine(productId))?.active).toBe(true);
  });

  it("muda categoria, SKU (os tamanhos acompanham) e endereço; recusa SKU e endereço de outro produto", async () => {
    const a = await novo("TEN-A"); await novo("TEN-B");
    await salvarProduto(ctx.db, loja.owner, { ...(await base(a.productId)), categoryName: "Sandálias", sku: "SND-9", slug: "Sandália Verão" });
    const p = (await listSupplierCatalog(ctx.db, loja.owner)).find((c) => c.product.id === a.productId)!;
    expect(p.product.sku).toBe("SND-9"); expect(p.product.slug).toBe("sandalia-verao");
    expect(p.variants.map((v) => v.sku)).toEqual(["SND-9-38", "SND-9-39"]);
    const cat = await ctx.db.query.categories.findFirst({ where: (c, { eq: e }) => e(c.id, p.product.categoryId!) });
    expect(cat?.name).toBe("Sandálias");
    await expect(salvarProduto(ctx.db, loja.owner, { ...(await base(a.productId)), sku: "TEN-B" })).rejects.toThrow(/SKU TEN-B/);
    await expect(salvarProduto(ctx.db, loja.owner, { ...(await base(a.productId)), slug: "tenis-ten-b" })).rejects.toThrow(/endereço/);
  });

  it("guarda fotos de qualquer origem (biblioteca, migração, link) e permite apagar todas", async () => {
    const { productId } = await novo();
    await salvarProduto(ctx.db, loja.owner, { ...(await base(productId)), images: ["https://cdn.exemplo.com/2.jpg", "/assets/ast_foto1", "/portal/commerce/moda-1.webp"] });
    expect((await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))?.images).toEqual(["https://cdn.exemplo.com/2.jpg", "/assets/ast_foto1", "/portal/commerce/moda-1.webp"]);
    await salvarProduto(ctx.db, loja.owner, { ...(await base(productId)), images: [] });
    expect((await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))?.images[0]).toMatch(/^art:/);
  });

  it("variações: adiciona tamanho e cor com estoque, renomeia, reordena, código de barras e remove o que nunca vendeu", async () => {
    const { productId } = await novo();
    const b = await base(productId);
    const [v38, v39] = b.variacoes!;
    await salvarProduto(ctx.db, loja.owner, { ...b, variacoes: [
      { ...v39!, estoque: 10, barcode: "7891234567895" },
      { ...v38!, size: "37", estoque: 1 },
      { size: "40", color: null, sku: "", barcode: "", estoque: 4 },
    ] });
    const vs = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(productVariants.position);
    expect(vs.map((v) => v.size)).toEqual(["39", "37", "40"]);
    expect(vs[0]!.barcode).toBe("7891234567895");
    expect((await getLevel(ctx.db, vs[0]!.id)).onHand).toBe(10);
    expect((await getLevel(ctx.db, vs[1]!.id)).onHand).toBe(1);
    expect((await getLevel(ctx.db, vs[2]!.id)).onHand).toBe(4);
    expect(vs[2]!.sku).toBe("TEN-1-40");
    // Remove o 37 (nunca vendido) e cria a cor Azul.
    const b2 = await base(productId);
    await salvarProduto(ctx.db, loja.owner, { ...b2, variacoes: [b2.variacoes![0]!, b2.variacoes![2]!, { size: "39", color: "azul", sku: "", barcode: "", estoque: 2 }] });
    const depois = await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(productVariants.position);
    expect(depois.map((v) => `${v.color ?? ""}${v.size}`)).toEqual(["39", "40", "Azul39"]);
    expect(depois[2]!.sku).toBe("TEN-1-39-AZUL");
  });

  it("não remove tamanho já vendido nem deixa estoque abaixo do reservado; recusa tamanho repetido", async () => {
    const { productId } = await novo();
    const vendido = await vender(productId);
    const b = await base(productId);
    await expect(salvarProduto(ctx.db, loja.owner, { ...b, variacoes: b.variacoes!.filter((v) => v.id !== vendido.id) })).rejects.toThrow(/já foi vendido/);
    await expect(salvarProduto(ctx.db, loja.owner, { ...b, variacoes: [...b.variacoes!, { size: "38", color: null, sku: "", barcode: "", estoque: 0 }] })).rejects.toThrow(/repetido/);
  });

  it("excluir: sem venda apaga de verdade; com venda some de tudo, libera o SKU e o pedido continua legível", async () => {
    const semVenda = await novo("TEN-X");
    const comVenda = await novo("TEN-V");
    await vender(comVenda.productId);
    expect(await excluirProdutos(ctx.db, loja.owner, [semVenda.productId, comVenda.productId])).toEqual({ apagados: 1, escondidos: 1 });
    expect(await ctx.db.query.products.findFirst({ where: eq(products.id, semVenda.productId) })).toBeUndefined();
    const escondido = (await ctx.db.query.products.findFirst({ where: eq(products.id, comVenda.productId) }))!;
    expect(escondido.status).toBe("DELETED");
    expect((await listSupplierCatalog(ctx.db, loja.owner)).map((c) => c.product.id)).toEqual([]);
    expect((await listStoreCatalog(ctx.db, loja.storeId)).map((c) => c.product.id)).toEqual([]);
    expect((await ctx.db.select().from(orderItems).where(eq(orderItems.productId, comVenda.productId)))[0]?.productName).toBe("Tênis TEN-V");
    await expect(novo("TEN-V")).resolves.toBeTruthy();
    // Excluído não volta pelo "Ativar" em lote.
    expect(await setProductsStatus(ctx.db, loja.owner, [comVenda.productId], "ACTIVE")).toBe(0);
  });

  it("não edita nem exclui produto de outra loja", async () => {
    const { productId } = await novo();
    const outra = { storeId: "outra-loja" };
    await expect(salvarProduto(ctx.db, outra, await base(productId))).rejects.toThrow(/não encontrado/);
    expect(await excluirProdutos(ctx.db, outra, [productId])).toEqual({ apagados: 0, escondidos: 0 });
  });

  it("modelos de grade de calçado, calça e tamanho único na planilha", () => {
    expect(parseSizeGrid("Calçado")).toBe("SHOES"); expect(parseSizeGrid("calça")).toBe("PANTS"); expect(parseSizeGrid("Tamanho único")).toBe("UNIQUE");
  });
});
