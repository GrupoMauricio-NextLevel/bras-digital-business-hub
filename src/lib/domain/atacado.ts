import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { categories, products, storeProducts, storeWholesaleRules } from "@/db/schema";
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
