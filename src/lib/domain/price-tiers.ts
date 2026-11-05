import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { products, storePriceTiers, storeProducts, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { storeModality } from "./order-policy";

export type Tier = { minQty: number; priceCents: number };

/**
 * Preço unitário para a quantidade total do MESMO produto no pedido (soma dos tamanhos; grades/packs ficam fora).
 * Pega a faixa de maior quantidade mínima atingida; nunca sobe o preço base.
 */
/** Pedido mínimo da loja (0 = sem mínimo). Não existe em loja de rede (SuperDrop). */
export async function setMinOrder(db: Database, storeId: string, cents: number) {
  if (!Number.isInteger(cents) || cents < 0 || cents > 100_000_00) throw new DomainError("INVALID_MIN_ORDER", "Informe um valor entre R$ 0 e R$ 100.000.");
  if ((await storeModality(db, storeId)) === "NETWORK") throw new DomainError("MIN_ORDER_NOT_ALLOWED", "Pedido mínimo não está disponível para lojas de rede.");
  await db.update(stores).set({ minOrderCents: cents }).where(eq(stores.id, storeId));
}

export function unitPriceForQty(baseCents: number, tiers: Tier[], totalQty: number): number {
  let price = baseCents;
  let best = 0;
  for (const t of tiers) if (totalQty >= t.minQty && t.minQty > best) { best = t.minQty; price = Math.min(baseCents, t.priceCents); }
  return price;
}

const tiersSchema = z.array(z.object({ minQty: z.number().int().min(2, "A quantidade mínima começa em 2"), priceCents: z.number().int().positive() })).max(5, "No máximo 5 faixas");

/** Substitui as faixas de um produto da loja. Regras: preços decrescentes, abaixo do preço da loja e nunca abaixo do custo nem do mínimo do produto. */
export async function setPriceTiers(db: Database, storeId: string, productId: string, raw: z.input<typeof tiersSchema>) {
  const tiers = tiersSchema.parse(raw).sort((a, b) => a.minQty - b.minQty);
  if ((await storeModality(db, storeId)) === "NETWORK") throw new DomainError("TIERS_NOT_ALLOWED", "Preço por quantidade não está disponível para lojas de rede.");
  // AT1 (D258): faixas por plano; quem já tem mais continua, só não aumenta.
  const { limitesDeAtacado } = await import("./atacado");
  const lim = await limitesDeAtacado(db, storeId);
  const atuais = (await db.select({ id: storePriceTiers.id }).from(storePriceTiers).where(and(eq(storePriceTiers.storeId, storeId), eq(storePriceTiers.productId, productId)))).length;
  if (tiers.length > lim.faixas && tiers.length > atuais) throw new DomainError("LIMITE_PLANO", `No plano ${lim.plano}, até ${lim.faixas} faixas por produto. Mais faixas no plano Pro.`);
  const sp = await db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId)) });
  const product = sp ? await db.query.products.findFirst({ where: eq(products.id, productId) }) : null;
  if (!sp || !product) throw new NotFoundError("Produto não encontrado na sua loja.");
  const floor = Math.max(product.costCents, product.minimumPriceCents);
  let prev = sp.priceCents;
  const seen = new Set<number>();
  for (const t of tiers) {
    if (seen.has(t.minQty)) throw new DomainError("INVALID_TIER", "Há duas faixas com a mesma quantidade.");
    seen.add(t.minQty);
    if (t.priceCents >= prev) throw new DomainError("INVALID_TIER", "Cada faixa precisa ter preço menor que a anterior e menor que o preço da loja.");
    if (t.priceCents < floor) throw new DomainError("INVALID_TIER", "Uma faixa está abaixo do custo ou do preço mínimo do produto.");
    prev = t.priceCents;
  }
  await db.transaction(async (tx) => {
    await tx.delete(storePriceTiers).where(and(eq(storePriceTiers.storeId, storeId), eq(storePriceTiers.productId, productId)));
    if (tiers.length) await tx.insert(storePriceTiers).values(tiers.map((t) => ({ id: newId("tier"), storeId, productId, ...t })));
  });
}

export async function loadTiers(db: Database, storeIds: string[], productIds: string[]): Promise<Map<string, Tier[]>> {
  const out = new Map<string, Tier[]>();
  if (!storeIds.length || !productIds.length) return out;
  const rows = await db.select().from(storePriceTiers).where(and(inArray(storePriceTiers.storeId, storeIds), inArray(storePriceTiers.productId, productIds)));
  for (const r of rows) { const k = `${r.storeId}:${r.productId}`; out.set(k, [...(out.get(k) ?? []), { minQty: r.minQty, priceCents: r.priceCents }]); }
  return out;
}
