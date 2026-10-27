import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { orderItems, storeProducts } from "@/db/schema";
import { DomainError, ForbiddenError } from "./errors";
import { assertStoreAdmin, type Actor } from "./access";
import { storeModality } from "./order-policy";

/**
 * "Compre junto" e dias de produção (W3, D186), por produto da loja independente. Os relacionados aparecem na página do
 * produto (seção "Produtos relacionados", antes por categoria); os dias de produção entram na previsão de entrega.
 */
export const MAX_RELACIONADOS = 4;
const schema = z.object({
  relatedIds: z.array(z.string().min(1)).max(MAX_RELACIONADOS, `Escolha no máximo ${MAX_RELACIONADOS} produtos.`),
  productionDays: z.number().int().min(0, "Dias de produção não pode ser negativo.").max(60, "No máximo 60 dias de produção."),
});

export async function salvarVendaJunto(db: Database, actor: Actor, productId: string, raw: z.input<typeof schema>) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Só a loja ajusta os próprios produtos.");
  assertStoreAdmin(actor);
  if ((await storeModality(db, actor.storeId)) !== "INDEPENDENT") throw new DomainError("NOT_ALLOWED", "Disponível na loja da NextLevel E-commerce.");
  const v = schema.parse(raw);
  const ids = [...new Set(v.relatedIds.filter((x) => x !== productId))];
  const daLoja = await db.select({ productId: storeProducts.productId }).from(storeProducts).where(and(eq(storeProducts.storeId, actor.storeId), inArray(storeProducts.productId, [productId, ...ids])));
  const conhecidos = new Set(daLoja.map((r) => r.productId));
  if (!conhecidos.has(productId)) throw new DomainError("NOT_FOUND", "Produto não está na sua loja.");
  if (ids.some((x) => !conhecidos.has(x))) throw new DomainError("INVALID", "Escolha só produtos da sua loja.");
  await db.update(storeProducts).set({ relatedIds: ids, productionDays: v.productionDays }).where(and(eq(storeProducts.storeId, actor.storeId), eq(storeProducts.productId, productId)));
}

/** Maior prazo de produção entre os itens do pedido (a peça mais demorada segura o envio). */
export async function diasDeProducaoDoPedido(db: Database, storeId: string, orderId: string): Promise<number> {
  const itens = await db.select({ productId: orderItems.productId }).from(orderItems).where(eq(orderItems.orderId, orderId));
  if (!itens.length) return 0;
  const sp = await db.select({ d: storeProducts.productionDays }).from(storeProducts).where(and(eq(storeProducts.storeId, storeId), inArray(storeProducts.productId, itens.map((i) => i.productId))));
  return sp.reduce((m, x) => Math.max(m, x.d), 0);
}

/** Relacionados para a página: os escolhidos primeiro (na ordem), depois os da mesma categoria, até `limite`. */
export function escolherRelacionados<T extends { id: string; categoryId: string | null }>(todos: T[], atual: T, escolhidos: string[], limite = 8): T[] {
  const porId = new Map(todos.map((p) => [p.id, p]));
  const primeiro = escolhidos.map((id) => porId.get(id)).filter((p): p is T => !!p && p.id !== atual.id);
  const resto = todos.filter((p) => p.id !== atual.id && p.categoryId === atual.categoryId && !escolhidos.includes(p.id));
  return [...primeiro, ...resto].slice(0, limite);
}
