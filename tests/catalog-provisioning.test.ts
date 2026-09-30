import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { createProduct, parseProductsCsv, CSV_TEMPLATE } from "@/lib/domain/products";
import { createStore, createSupplier, resetUserPassword } from "@/lib/domain/provisioning";
import { getLevel } from "@/lib/domain/inventory";
import { listStoreCatalog, listSupplierCatalog } from "@/lib/domain/catalog";
import { verifyPassword } from "@/lib/security/password";
import { listOrdersForActor } from "@/lib/domain/orders";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const base = { name: "Manto Teste 2026", sku: "tst-01", categoryName: "Times Brasileiros", costCents: 5900, suggestedPriceCents: 14990, minimumPriceCents: 11990, sizes: [{ size: "p", initialStock: 5 }, { size: "m", initialStock: 10 }, { size: "g", initialStock: 10 }] };

describe("cadastro de produto", () => {
  it("cria produto com variantes, estoque inicial e SKU normalizado", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, base);
    const catalog = await listSupplierCatalog(ctx.db, ctx.seed.supplierId);
    const item = catalog.find((c) => c.product.id === productId)!;
    expect(item.product.sku).toBe("TST-01");
    expect(item.variants.map((v) => v.size)).toEqual(["P", "M", "G"]);
    expect(item.onHand).toBe(25);
    expect((await getLevel(ctx.db, item.variants[0]!.id)).available).toBe(5);
  });

  it("cria grade configurável e rejeita grade sem quantidades", async () => {
    const withPack = { ...base, sku: "TST-02", name: "Manto Grade", sellsPack: true, pack: { name: "Grade 10", costCents: 50000, suggestedPriceCents: 110000, minimumPriceCents: 90000 }, sizes: [{ size: "P", initialStock: 20, packQuantity: 3 }, { size: "M", initialStock: 20, packQuantity: 4 }, { size: "G", initialStock: 20, packQuantity: 3 }] };
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, withPack);
    const packs = await ctx.db.query.productPacks.findMany({ where: (p, { eq }) => eq(p.productId, productId) });
    expect(packs[0]?.totalQuantity).toBe(10);
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...withPack, sku: "TST-03", name: "Sem quantidades", sizes: withPack.sizes.map((s) => ({ ...s, packQuantity: 0 })) })).rejects.toThrow(/quantidade por tamanho/);
  });

  it("rejeita SKU repetido, tamanhos repetidos e preços incoerentes", async () => {
    await createProduct(ctx.db, ctx.seed.supplierId, base);
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...base, name: "Outro nome" })).rejects.toThrow(/SKU/);
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...base, sku: "X1", name: "Repetido", sizes: [{ size: "P", initialStock: 1 }, { size: "p", initialStock: 1 }] })).rejects.toThrow(/repetidos/);
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...base, sku: "X2", name: "Preço ruim", minimumPriceCents: 20000 })).rejects.toThrow(/mínimo/);
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...base, sku: "X3", name: "Abaixo do custo", minimumPriceCents: 1000 })).rejects.toThrow(/custo/);
  });

  it("produto novo aparece no painel do lojista como não ativado e só entra na vitrine depois de ativado", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, { ...base, sku: "TST-04", name: "Produto Vitrine" });
    const panel = await listStoreCatalog(ctx.db, ctx.seed.stores.arena.id, { onlyActive: false });
    const mine = panel.find((i) => i.product.id === productId)!;
    expect(mine.storeProduct.active).toBe(false);
    expect((await listStoreCatalog(ctx.db, ctx.seed.stores.arena.id)).some((i) => i.product.id === productId)).toBe(false);
  });

  it("distribuição SELECTED_STORES esconde o produto das outras lojas", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, { ...base, sku: "TST-05", name: "Exclusivo", distribution: "SELECTED_STORES", storeIds: [ctx.seed.stores.mantos.id] });
    expect((await listStoreCatalog(ctx.db, ctx.seed.stores.mantos.id, { onlyActive: false })).some((i) => i.product.id === productId)).toBe(true);
    expect((await listStoreCatalog(ctx.db, ctx.seed.stores.arena.id, { onlyActive: false })).some((i) => i.product.id === productId)).toBe(false);
  });
});

describe("importação CSV", () => {
  it("interpreta o modelo oficial (reais, tamanhos, estoque, grade)", () => {
    const rows = parseProductsCsv(CSV_TEMPLATE);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);
    const first = rows[0]!.input!;
    expect(first.costCents).toBe(5900);
    expect(first.suggestedPriceCents).toBe(14990);
    expect(first.sellsPack).toBe(true);
    expect(first.sizeGrid).toBe("ADULT_MALE");
    // público masculino preenche P, M, G, GG, XX1, 2XL; estoque único vale para todos os tamanhos
    expect(first.sizes.map((s) => [s.size, s.initialStock, s.packQuantity])).toEqual([["P", 10, 2], ["M", 10, 4], ["G", 10, 4], ["GG", 10, 2], ["XX1", 10, 1], ["2XL", 10, 1]]);
    expect(rows[1]!.input!.sellsPack).toBe(false);
    expect(rows[1]!.input!.sizes.map((s) => [s.size, s.initialStock])).toEqual([["P", 10], ["M", 20], ["G", 20], ["GG", 10], ["XX1", 5], ["2XL", 5]]);
    expect(rows[2]!.input!.sizes.map((s) => s.size)).toEqual(["18", "20", "22", "24", "26", "28"]);
    expect(rows[2]!.input!.status).toBe("DRAFT");
  });
  it("aponta a linha com erro e aceita vírgula como separador e aspas", () => {
    const rows = parseProductsCsv('nome,sku,categoria,custo,preco_sugerido\n"Manto, Especial",A1,Retrô,"59,00","149,90"\n,,,,');
    expect(rows[0]!.input?.name).toBe("Manto, Especial");
    expect(rows[0]!.input?.costCents).toBe(5900);
    expect(rows[1]!.errors.join()).toMatch(/nome vazio/);
    expect(rows[1]!.line).toBe(3);
  });
});

describe("provisionamento de fornecedor e loja", () => {
  it("master cria fornecedor com admin de senha temporária que precisa ser trocada", async () => {
    const r = await createSupplier(ctx.db, { name: "Fornecedor Novo", adminName: "Maria", adminEmail: "Maria@Novo.com", businessModel: "WHITE_LABEL" });
    const u = await ctx.db.query.users.findFirst({ where: eq(users.email, "maria@novo.com") });
    expect(u?.role).toBe("SUPPLIER_ADMIN");
    expect(u?.mustChangePassword).toBe(true);
    expect(verifyPassword(r.credentials.temporaryPassword, u?.passwordHash)).toBe(true);
    const sup = await ctx.db.query.suppliers.findFirst({ where: (s, { eq }) => eq(s.id, r.supplierId) });
    expect(sup?.setupFeeCents).toBe(1_500_000);
    const contract = await ctx.db.query.supplierContracts.findFirst({ where: (c, { eq }) => eq(c.supplierId, r.supplierId) });
    expect(contract).toMatchObject({ volumeFeeBps: 150, setupFeeCents: 1_500_000, minMonthlyFeeCents: 50_000 });
    await expect(createSupplier(ctx.db, { name: "Outro", adminName: "Maria 2", adminEmail: "maria@novo.com" })).rejects.toThrow(/e-mail/);
  });

  it("fornecedor cria loja na própria rede; dados ficam isolados de outros fornecedores", async () => {
    const other = await createSupplier(ctx.db, { name: "Fornecedor B", adminName: "Beto", adminEmail: "beto@b.com" });
    const s = await createStore(ctx.db, other.supplierId, { name: "Loja do Beto", ownerName: "Beto Dono", ownerEmail: "dono@lojabeto.com" });
    expect(s.slug).toBe("loja-do-beto");
    const owner = await ctx.db.query.users.findFirst({ where: eq(users.email, "dono@lojabeto.com") });
    expect(owner?.storeId).toBe(s.storeId);
    const theme = await ctx.db.query.storeThemes.findFirst({ where: (t, { eq }) => eq(t.storeId, s.storeId) });
    expect(theme).toBeTruthy();
    // loja nova não enxerga catálogo de outro fornecedor
    expect(await listStoreCatalog(ctx.db, s.storeId, { onlyActive: false })).toHaveLength(0);
    // ator do fornecedor original não vê pedidos nem loja do outro
    expect((await listOrdersForActor(ctx.db, ctx.actors.supplier)).every((o) => o.order.supplierId === ctx.seed.supplierId)).toBe(true);
  });

  it("slug de loja é único e redefinição de senha gera nova temporária", async () => {
    const a = await createStore(ctx.db, ctx.seed.supplierId, { name: "Mantos Shop", ownerName: "X Um", ownerEmail: "x1@a.com" });
    expect(a.slug).toBe("mantos-shop-2");
    const owner = await ctx.db.query.users.findFirst({ where: eq(users.email, "x1@a.com") });
    const pwd = await resetUserPassword(ctx.db, owner!.id);
    const after = await ctx.db.query.users.findFirst({ where: eq(users.id, owner!.id) });
    expect(verifyPassword(pwd, after?.passwordHash)).toBe(true);
    expect(after?.mustChangePassword).toBe(true);
  });
});
