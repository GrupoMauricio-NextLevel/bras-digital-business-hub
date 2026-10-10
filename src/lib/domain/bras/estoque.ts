import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdProducts, bdStockMovements } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "../errors";

/**
 * Estoque em caixas da Brás (D110, seção 6 do prompt v2). Um só caminho para mexer no saldo: `applyStockDelta`, com
 * atualização CONDICIONAL ("só baixa se ainda houver"), para pedido, ajuste manual, planilha e (fase F7) Bling não
 * venderem a mesma caixa duas vezes. O banco ainda tem a trava `stock_boxes >= 0`.
 */
export type StockKind = (typeof bdStockMovements.$inferInsert)["kind"];
export type StockSource = (typeof bdStockMovements.$inferInsert)["source"];
type Tx = Pick<Database, "update" | "insert" | "select" | "query">;

export async function applyStockDelta(db: Tx, m: { productId: string; importerId: string; delta: number; kind: StockKind; source: StockSource; note?: string | null; actorUserId?: string | null; requestId?: string | null }, now = new Date()) {
  if (!Number.isInteger(m.delta)) throw new DomainError("BOXES", "Use números inteiros de caixas.");
  const [row] = await db.update(bdProducts)
    .set({ stockBoxes: sql`${bdProducts.stockBoxes} + ${m.delta}`, stockUpdatedAt: now.toISOString(), updatedAt: now.toISOString() })
    .where(and(eq(bdProducts.id, m.productId), eq(bdProducts.importerId, m.importerId), sql`${bdProducts.stockBoxes} + ${m.delta} >= 0`))
    .returning({ stockBoxes: bdProducts.stockBoxes, status: bdProducts.status });
  if (!row) {
    const p = await db.query.bdProducts.findFirst({ where: and(eq(bdProducts.id, m.productId), eq(bdProducts.importerId, m.importerId)), columns: { stockBoxes: true } });
    if (!p) throw new NotFoundError("Produto não encontrado.");
    throw new DomainError("NO_STOCK", p.stockBoxes === 0 ? "Sem caixas no estoque deste produto." : `Só há ${p.stockBoxes} caixa(s) no estoque deste produto.`);
  }
  // Esgotou: sai da venda. Voltou caixa: volta a ativo. Rascunho e alto mar não mudam sozinhos.
  const status = row.stockBoxes === 0 && row.status === "ATIVO" ? "ESGOTADO" : row.stockBoxes > 0 && row.status === "ESGOTADO" ? "ATIVO" : null;
  if (status) await db.update(bdProducts).set({ status }).where(eq(bdProducts.id, m.productId));
  await db.insert(bdStockMovements).values({ id: newId("bdsk"), productId: m.productId, importerId: m.importerId, kind: m.kind, boxes: m.delta, balanceAfter: row.stockBoxes, source: m.source, note: m.note ?? null, actorUserId: m.actorUserId ?? null, requestId: m.requestId ?? null });
  return { balance: row.stockBoxes };
}

/** Saldo que o membro vê: o do produto ligado (se o estoque estiver em dia) ou o informado na oferta. Velho = "consultar" (null). */
export function brasEffectiveBoxes(offerBoxes: number | null, product: { stockBoxes: number; stockUpdatedAt: string | null; status: string } | null | undefined, freshnessHours: number, now = new Date()): number | null {
  if (!product) return offerBoxes;
  if (product.status === "RASCUNHO" || product.status === "ALTO_MAR") return 0;
  if (!product.stockUpdatedAt || now.getTime() - new Date(product.stockUpdatedAt).getTime() > freshnessHours * 3_600_000) return null;
  return product.stockBoxes;
}

/** "Atualizado há 12 min" (frescor do saldo). */
export function brasStockAge(stockUpdatedAt: string | null, now = new Date()): string {
  if (!stockUpdatedAt) return "nunca atualizado";
  const min = Math.max(0, Math.round((now.getTime() - new Date(stockUpdatedAt).getTime()) / 60_000));
  if (min < 1) return "atualizado agora";
  if (min < 60) return `atualizado há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `atualizado há ${h} h`;
  return `atualizado há ${Math.round(h / 24)} dias`;
}
