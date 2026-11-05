import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { categories, orderItems, productPackItems, productPacks, productVariants, products, storeProducts, storeWholesaleRules } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { LinhaPreco, RegraMix } from "@/lib/finance/atacado-preco";
import { DomainError, NotFoundError } from "./errors";
import { storeModality } from "./order-policy";
import type { StoreCatalogItem } from "./catalog";

/**
 * Atacado da loja (AT0, D257): regras de mix e preço de atacado por produto, lidos pelo motor único `precoDoCarrinho`.
 * Loja de rede do SuperDrop não tem atacado (D216): sem regras, sem preço de atacado (o comportamento dela não muda).
 */
export const MAX_REGRAS_MIX = 6;

export async function regrasDeAtacado(db: Database, storeId: string): Promise<RegraMix[]> {
  if ((await storeModality(db, storeId)) === "NETWORK") return [];
  const rows = await db.select().from(storeWholesaleRules).where(and(eq(storeWholesaleRules.storeId, storeId), eq(storeWholesaleRules.active, true))).orderBy(asc(storeWholesaleRules.position));
  const out: RegraMix[] = [];
  for (const r of rows) {
    if (r.kind === "MIX_PECAS" && r.minPieces) out.push({ kind: "MIX_PECAS", minPieces: r.minPieces });
    else if (r.kind === "MIX_VALOR" && r.minCents) out.push({ kind: "MIX_VALOR", minCents: r.minCents });
    else if (r.kind === "MIX_CATEGORIA" && r.minPieces && r.categoryId) out.push({ kind: "MIX_CATEGORIA", minPieces: r.minPieces, categoryId: r.categoryId });
  }
  return out;
}

const regraSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("MIX_PECAS"), minPieces: z.number().int().min(2, "O mix começa em 2 peças").max(10_000) }),
  z.object({ kind: z.literal("MIX_VALOR"), minCents: z.number().int().min(1_000, "O mix por valor começa em R$ 10").max(100_000_00) }),
  z.object({ kind: z.literal("MIX_CATEGORIA"), minPieces: z.number().int().min(2).max(10_000), categoryId: z.string().min(1) }),
]);

/** Substitui as regras de mix da loja. Uma regra por tipo (e por categoria). */
export async function salvarRegrasDeMix(db: Database, storeId: string, raw: unknown) {
  if ((await storeModality(db, storeId)) === "NETWORK") throw new DomainError("ATACADO_REDE", "Loja de rede não tem regras de atacado próprias.");
  const regras = z.array(regraSchema).max(MAX_REGRAS_MIX, `No máximo ${MAX_REGRAS_MIX} regras`).parse(raw);
  const chaves = regras.map((r) => (r.kind === "MIX_CATEGORIA" ? `${r.kind}:${r.categoryId}` : r.kind));
  if (new Set(chaves).size !== chaves.length) throw new DomainError("REGRA_REPETIDA", "Há duas regras iguais. Deixe uma por tipo (e por coleção).");
  await conferirLimiteDoMix(db, storeId, regras);
  for (const r of regras) if (r.kind === "MIX_CATEGORIA") {
    const c = await db.query.categories.findFirst({ where: and(eq(categories.id, r.categoryId), eq(categories.storeId, storeId)), columns: { id: true } });
    if (!c) throw new NotFoundError("Coleção não encontrada na sua loja.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(storeWholesaleRules).where(eq(storeWholesaleRules.storeId, storeId));
    if (regras.length) await tx.insert(storeWholesaleRules).values(regras.map((r, i) => ({ id: newId("swr"), storeId, kind: r.kind, minPieces: "minPieces" in r ? r.minPieces : null, minCents: "minCents" in r ? r.minCents : null, categoryId: "categoryId" in r ? r.categoryId : null, position: i })));
  });
  return regras;
}

/** Preço de atacado por peça do produto da loja (nulo apaga). Entre o piso (custo e mínimo) e o varejo. */
export async function salvarPrecoAtacado(db: Database, storeId: string, productId: string, cents: number | null) {
  if ((await storeModality(db, storeId)) === "NETWORK") throw new DomainError("ATACADO_REDE", "Loja de rede não tem preço de atacado próprio.");
  const sp = await db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId)) });
  const p = sp ? await db.query.products.findFirst({ where: eq(products.id, productId), columns: { costCents: true, minimumPriceCents: true } }) : null;
  if (!sp || !p) throw new NotFoundError("Produto não encontrado na sua loja.");
  if (cents !== null) {
    if (!Number.isInteger(cents) || cents <= 0) throw new DomainError("PRECO_ATACADO", "Informe o preço de atacado por peça.");
    if (cents >= sp.priceCents) throw new DomainError("PRECO_ATACADO", "O preço de atacado precisa ser menor que o de varejo.");
    if (cents < Math.max(p.costCents, p.minimumPriceCents)) throw new DomainError("PRECO_ATACADO", "O preço de atacado está abaixo do custo ou do preço mínimo do produto.");
  }
  await db.update(storeProducts).set({ wholesalePriceCents: cents }).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId)));
}

/** Linha do motor a partir do catálogo da loja e da linha pedida (o preço do navegador nunca entra). */
export function linhaDoCatalogo(item: StoreCatalogItem, line: { productId: string; variantId?: string | null; packId?: string | null; quantity: number }, key: string, rede: boolean): LinhaPreco {
  const piso = Math.max(item.product.costCents, item.product.minimumPriceCents);
  if (line.packId) {
    const pack = item.packs.find((p) => p.id === line.packId)!;
    return { key, productId: item.product.id, categoryId: item.product.categoryId, packId: pack.id, pecasPorUnidade: pack.totalQuantity, quantity: line.quantity, varejoCents: item.storeProduct.packPriceCents ?? pack.suggestedPriceCents };
  }
  return { key, productId: item.product.id, categoryId: item.product.categoryId, quantity: line.quantity, varejoCents: item.storeProduct.priceCents, atacadoCents: rede ? null : item.storeProduct.wholesalePriceCents, faixas: item.tiers, pisoCents: rede ? 0 : piso };
}

// ---------------------------------------------------------------------------------------------------------------------
// AT1 (D258): limites por plano e grades
// ---------------------------------------------------------------------------------------------------------------------
export type LimitesAtacado = { plano: string; faixas: number; gradesPorProduto: number; regrasMix: number; tiposMix: RegraMix["kind"][]; pacote: boolean };
/** Escada do atacado por plano (docs/prompts/atacado-nextlevel-ecommerce.md, seção 6). Fora da E-commerce: sem limite. */
export const LIMITES_ATACADO: Record<"COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE", LimitesAtacado> = {
  COMMERCE_START: { plano: "Start", faixas: 3, gradesPorProduto: 1, regrasMix: 1, tiposMix: ["MIX_PECAS"], pacote: false },
  COMMERCE_PRO: { plano: "Pro", faixas: 5, gradesPorProduto: 4, regrasMix: 3, tiposMix: ["MIX_PECAS", "MIX_VALOR"], pacote: true },
  COMMERCE_SCALE: { plano: "Scale", faixas: 5, gradesPorProduto: 99, regrasMix: MAX_REGRAS_MIX, tiposMix: ["MIX_PECAS", "MIX_VALOR", "MIX_CATEGORIA"], pacote: true },
};
export async function limitesDeAtacado(db: Database, storeId: string): Promise<LimitesAtacado> {
  const { ehLojaEcommerce, planoDaLoja } = await import("./beneficios-plano");
  if (!(await ehLojaEcommerce(db, storeId))) return { ...LIMITES_ATACADO.COMMERCE_SCALE, plano: "Sem limite" };
  return LIMITES_ATACADO[await planoDaLoja(db, storeId)];
}
const proximoPlano = (l: LimitesAtacado) => (l.plano === "Start" ? "Pro" : "Scale");

/** Trava do plano para as regras de mix: quem já tem mais do que o limite continua; só não aumenta (D247). */
export async function conferirLimiteDoMix(db: Database, storeId: string, regras: RegraMix[]) {
  const l = await limitesDeAtacado(db, storeId);
  const atuais = (await db.select({ id: storeWholesaleRules.id }).from(storeWholesaleRules).where(eq(storeWholesaleRules.storeId, storeId))).length;
  if (regras.length > l.regrasMix && regras.length > atuais) throw new DomainError("LIMITE_PLANO", `No plano ${l.plano}, até ${l.regrasMix} regra${l.regrasMix === 1 ? "" : "s"} de atacado. Mais regras no plano ${proximoPlano(l)}.`);
  const fora = regras.find((r) => !l.tiposMix.includes(r.kind));
  if (fora) throw new DomainError("LIMITE_PLANO", `${fora.kind === "MIX_VALOR" ? "O mix por valor" : "O mix por coleção"} vem no plano ${fora.kind === "MIX_VALOR" ? "Pro" : "Scale"}.`);
}

const gradeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Dê um nome à grade (ex.: Grade 12)").max(60),
  kind: z.enum(["GRADE_FECHADA", "PACOTE_SORTIDO"]).default("GRADE_FECHADA"),
  colorMode: z.enum(["FIXA", "SORTIDA", "POR_COR"]).default("FIXA"),
  color: z.string().trim().max(40).optional(),
  priceCents: z.number().int().positive("Informe o preço da grade"),
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(0).max(999) })).min(1),
});

/** Cria ou edita uma grade do produto da própria loja (E-commerce). O preço é por grade; nunca abaixo do piso × peças. */
export async function salvarGrade(db: Database, storeId: string, productId: string, raw: unknown) {
  const g = gradeSchema.parse(raw);
  if ((await storeModality(db, storeId)) !== "INDEPENDENT") throw new DomainError("ATACADO_REDE", "Grades próprias só na loja independente.");
  const p = await db.query.products.findFirst({ where: and(eq(products.id, productId), eq(products.storeId, storeId)) });
  if (!p) throw new NotFoundError("Produto não encontrado na sua loja.");
  const variantes = new Set((await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, productId))).map((v) => v.id));
  const itens = g.items.filter((i) => i.quantity > 0);
  if (!itens.length) throw new DomainError("GRADE", "Coloque a quantidade de pelo menos um tamanho.");
  if (itens.some((i) => !variantes.has(i.variantId))) throw new DomainError("GRADE", "Tamanho não pertence a este produto.");
  const pecas = itens.reduce((t, i) => t + i.quantity, 0);
  const piso = Math.max(p.costCents, p.minimumPriceCents) * pecas;
  if (g.priceCents < piso) throw new DomainError("GRADE", `O preço da grade está abaixo do custo ou do mínimo (${pecas} peças).`);
  const l = await limitesDeAtacado(db, storeId);
  if (g.kind === "PACOTE_SORTIDO" && !l.pacote) throw new DomainError("LIMITE_PLANO", "Pacote sortido vem no plano Pro.");
  const existentes = await db.select({ id: productPacks.id }).from(productPacks).where(eq(productPacks.productId, productId));
  if (!g.id && existentes.length >= l.gradesPorProduto) throw new DomainError("LIMITE_PLANO", `No plano ${l.plano}, até ${l.gradesPorProduto} grade${l.gradesPorProduto === 1 ? "" : "s"} por produto. Mais grades no plano ${proximoPlano(l)}.`);
  if (g.id && !existentes.some((e) => e.id === g.id)) throw new NotFoundError("Grade não encontrada.");
  const id = g.id ?? newId("pck");
  const valores = { name: g.name, totalQuantity: pecas, costCents: p.costCents * pecas, suggestedPriceCents: g.priceCents, minimumPriceCents: p.minimumPriceCents * pecas, kind: g.kind, colorMode: g.colorMode, color: g.colorMode === "FIXA" ? g.color || null : null };
  await db.transaction(async (tx) => {
    if (g.id) { await tx.update(productPacks).set(valores).where(eq(productPacks.id, id)); await tx.delete(productPackItems).where(eq(productPackItems.packId, id)); }
    else await tx.insert(productPacks).values({ id, productId, position: existentes.length, ...valores });
    await tx.insert(productPackItems).values(itens.map((i) => ({ packId: id, variantId: i.variantId, quantity: i.quantity })));
    await tx.update(products).set({ sellsPack: true }).where(eq(products.id, productId));
    // Cada grade com o próprio preço: o preço único antigo da loja deixa de valer por cima das grades.
    await tx.update(storeProducts).set({ packPriceCents: null }).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId)));
  });
  return id;
}

/** Remove a grade (pedidos antigos guardam o nome e o preço na linha). Sem grades, o produto deixa de vender grade. */
export async function removerGrade(db: Database, storeId: string, productId: string, packId: string) {
  const p = await db.query.products.findFirst({ where: and(eq(products.id, productId), eq(products.storeId, storeId)), columns: { id: true, sellsUnit: true } });
  if (!p) throw new NotFoundError("Produto não encontrado na sua loja.");
  const resto = (await db.select({ id: productPacks.id }).from(productPacks).where(eq(productPacks.productId, productId))).filter((x) => x.id !== packId);
  if (!resto.length && !p.sellsUnit) throw new DomainError("GRADE", "O produto só vende em grade: deixe ao menos uma ou ligue a venda por peça.");
  const usada = await db.query.orderItems.findFirst({ where: eq(orderItems.packId, packId), columns: { id: true } });
  if (usada) throw new DomainError("GRADE_EM_USO", "Esta grade já foi vendida: edite em vez de remover.");
  await db.transaction(async (tx) => {
    await tx.delete(productPackItems).where(eq(productPackItems.packId, packId));
    await tx.delete(productPacks).where(and(eq(productPacks.id, packId), eq(productPacks.productId, productId)));
    if (!resto.length) await tx.update(products).set({ sellsPack: false }).where(eq(products.id, productId));
  });
}

/** Tudo o que a tela Atacado do lojista mostra (AT1). Uma consulta por bloco. */
export async function painelDeAtacado(db: Database, storeId: string) {
  const { listStoreCatalog } = await import("./catalog");
  const [limites, regras, cats, catalogo, variantes] = await Promise.all([
    limitesDeAtacado(db, storeId),
    regrasDeAtacado(db, storeId),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.name)),
    listStoreCatalog(db, storeId),
    db.select({ id: productVariants.id, productId: productVariants.productId, size: productVariants.size, position: productVariants.position }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(eq(products.storeId, storeId)).orderBy(asc(productVariants.position)),
  ]);
  const porProduto = new Map<string, { id: string; size: string }[]>();
  for (const v of variantes) porProduto.set(v.productId, [...(porProduto.get(v.productId) ?? []), { id: v.id, size: v.size }]);
  return {
    limites, regras, categorias: cats,
    produtos: catalogo.map((c) => ({
      productId: c.product.id, name: c.product.name, categoryId: c.product.categoryId, propria: c.product.storeId === storeId,
      priceCents: c.storeProduct.priceCents, wholesalePriceCents: c.storeProduct.wholesalePriceCents, floorCents: Math.max(c.product.costCents, c.product.minimumPriceCents), tiers: c.tiers,
      variantes: porProduto.get(c.product.id) ?? [],
      grades: c.packs.map((p) => ({ id: p.id, name: p.name, kind: p.kind, colorMode: p.colorMode, color: p.color, pecas: p.totalQuantity, priceCents: c.storeProduct.packPriceCents ?? p.suggestedPriceCents, items: p.items.map((i) => ({ variantId: i.variantId, size: i.size, quantity: i.quantity })) })),
    })),
  };
}
export type PainelDeAtacado = Awaited<ReturnType<typeof painelDeAtacado>>;
