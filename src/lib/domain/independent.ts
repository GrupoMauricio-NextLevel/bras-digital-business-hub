import { and, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/client";
import { networks, stores } from "@/db/schema";
import { BRAND_CODES, type BrandCode } from "@/lib/brand";
import type { Actor } from "./access";
import { ForbiddenError, NotFoundError } from "./errors";

/**
 * Loja independente da NextLevel Commerce (D89): não tem fornecedor nem rede. É dona do próprio catálogo
 * (`products.store_id`, `categories.store_id`) e dos próprios pedidos (`orders.supplier_id` vazio).
 * Lojas de membros do SuperDrop continuam numa rede de fornecedor, com o catálogo do fornecedor.
 * Só a tecnologia e os temas são compartilhados entre os dois produtos; não há relação entre os dados.
 */

/** Dono de um catálogo: um fornecedor do SuperDrop ou uma loja independente da Commerce. */
export type CatalogOwner = { supplierId: string; storeId?: undefined } | { storeId: string; supplierId?: undefined };
/** Aceita o id do fornecedor (forma antiga, SuperDrop) ou o dono explícito. */
export type OwnerRef = CatalogOwner | string;
export const toOwner = (o: OwnerRef): CatalogOwner => (typeof o === "string" ? { supplierId: o } : o);
/** Colunas de dono para gravar numa linha de catálogo. */
export const ownerColumns = (o: OwnerRef) => { const x = toOwner(o); return x.supplierId ? { supplierId: x.supplierId, storeId: null } : { supplierId: null, storeId: x.storeId! }; };
/** Condição "pertence a este dono" para tabelas com `supplierId` e `storeId`. */
export function ownedBy(table: { supplierId: Parameters<typeof eq>[0]; storeId: Parameters<typeof eq>[0] }, o: OwnerRef): SQL {
  const x = toOwner(o);
  return x.supplierId ? eq(table.supplierId, x.supplierId) : eq(table.storeId, x.storeId!);
}
/** Dono de uma linha já lida do banco. */
export const ownerOfRow = (r: { supplierId: string | null; storeId: string | null }): CatalogOwner => (r.supplierId ? { supplierId: r.supplierId } : { storeId: r.storeId! });
export const ownerKey = (o: OwnerRef) => { const x = toOwner(o); return x.supplierId ? `sup:${x.supplierId}` : `sto:${x.storeId}`; };

/** A loja é independente (Commerce, sem fornecedor)? */
export async function isIndependentStore(db: Database, storeId: string | null | undefined): Promise<boolean> {
  if (!storeId) return false;
  const s = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { networkId: true } });
  return !!s && !s.networkId;
}

/** Fornecedor da rede de uma loja do SuperDrop (null para loja independente). */
export async function supplierOfStore(db: Database, storeId: string): Promise<string | null> {
  const r = await db.select({ supplierId: networks.supplierId }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(and(eq(stores.id, storeId))).limit(1);
  return r[0]?.supplierId ?? null;
}

/** Catálogo que o ator mantém: o do fornecedor, ou o da própria loja quando ela é independente. */
export async function catalogOwner(db: Database, actor: Actor): Promise<CatalogOwner> {
  if (actor.role === "SUPPLIER_ADMIN" && actor.supplierId) return { supplierId: actor.supplierId };
  if (actor.role === "STORE_OWNER" && actor.storeId) {
    const s = await db.query.stores.findFirst({ where: eq(stores.id, actor.storeId), columns: { id: true, networkId: true } });
    if (!s) throw new NotFoundError("Loja não encontrada.");
    if (!s.networkId) return { storeId: s.id };
  }
  throw new ForbiddenError("Ação disponível apenas para o fornecedor ou para a loja independente.");
}

export { BRAND_CODES };
export type { BrandCode };
