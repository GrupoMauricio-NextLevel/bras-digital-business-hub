import { eq, desc, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { inventory, inventoryMovements, productVariants } from "@/db/schema";
import { DomainError } from "./errors";
import { newId } from "@/lib/ids";

export type MovementType = "IN" | "RESERVE" | "RELEASE" | "SALE" | "ADJUSTMENT";

export type InventoryLevel = { variantId: string; onHand: number; reserved: number; available: number };

export function computeAvailable(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

export async function getLevel(db: Database, variantId: string): Promise<InventoryLevel> {
  const row = await db.query.inventory.findFirst({ where: eq(inventory.variantId, variantId) });
  const onHand = row?.onHand ?? 0;
  const reserved = row?.reserved ?? 0;
  return { variantId, onHand, reserved, available: computeAvailable(onHand, reserved) };
}

export async function getLevels(db: Database, variantIds: string[]): Promise<Map<string, InventoryLevel>> {
  const map = new Map<string, InventoryLevel>();
  if (variantIds.length === 0) return map;
  const rows = await db.select().from(inventory).where(inArray(inventory.variantId, variantIds));
  for (const id of variantIds) map.set(id, { variantId: id, onHand: 0, reserved: 0, available: 0 });
  for (const r of rows) map.set(r.variantId, { variantId: r.variantId, onHand: r.onHand, reserved: r.reserved, available: computeAvailable(r.onHand, r.reserved) });
  return map;
}

type MovementRef = { referenceType?: string; referenceId?: string; note?: string };

async function ensureRow(db: Database, variantId: string) {
  const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, variantId) });
  if (!variant) throw new DomainError("VARIANT_NOT_FOUND", "Variante não encontrada.");
  const existing = await db.query.inventory.findFirst({ where: eq(inventory.variantId, variantId) });
  if (!existing) {
    await db.insert(inventory).values({ variantId, onHand: 0, reserved: 0 });
    return { onHand: 0, reserved: 0 };
  }
  return existing;
}

async function logMovement(db: Database, variantId: string, type: MovementType, quantity: number, ref: MovementRef) {
  await db.insert(inventoryMovements).values({ id: newId("mov"), variantId, type, quantity, referenceType: ref.referenceType, referenceId: ref.referenceId, note: ref.note });
}

/** Entrada de estoque (compra/produção). */
export async function receiveStock(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  const row = await ensureRow(db, variantId);
  await db.update(inventory).set({ onHand: row.onHand + quantity }).where(eq(inventory.variantId, variantId));
  await logMovement(db, variantId, "IN", quantity, ref);
}

/** Ajuste manual (pode ser negativo, mas nunca abaixo do reservado). */
export async function adjustStock(db: Database, variantId: string, delta: number, ref: MovementRef = {}) {
  if (delta === 0) return;
  const row = await ensureRow(db, variantId);
  const next = row.onHand + delta;
  if (next < row.reserved) throw new DomainError("INSUFFICIENT_STOCK", "Ajuste deixaria o estoque físico abaixo do reservado.");
  await db.update(inventory).set({ onHand: next }).where(eq(inventory.variantId, variantId));
  await logMovement(db, variantId, "ADJUSTMENT", delta, ref);
}

/** Reserva estoque para um pedido. Falha se não houver disponível. */
export async function reserveStock(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  const row = await ensureRow(db, variantId);
  const available = computeAvailable(row.onHand, row.reserved);
  if (available < quantity) throw new DomainError("INSUFFICIENT_STOCK", `Estoque insuficiente (disponível: ${available}, solicitado: ${quantity}).`);
  await db.update(inventory).set({ reserved: row.reserved + quantity }).where(eq(inventory.variantId, variantId));
  await logMovement(db, variantId, "RESERVE", quantity, ref);
}

/** Libera reserva (cancelamento/expiração). */
export async function releaseStock(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  const row = await ensureRow(db, variantId);
  if (row.reserved < quantity) throw new DomainError("INVALID_RELEASE", "Liberação maior que o reservado.");
  await db.update(inventory).set({ reserved: row.reserved - quantity }).where(eq(inventory.variantId, variantId));
  await logMovement(db, variantId, "RELEASE", quantity, ref);
}

/** Consome a reserva definitivamente (expedição). */
export async function consumeReservation(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  const row = await ensureRow(db, variantId);
  if (row.reserved < quantity || row.onHand < quantity) throw new DomainError("INVALID_SALE", "Venda maior que o reservado/físico.");
  await db.update(inventory).set({ reserved: row.reserved - quantity, onHand: row.onHand - quantity }).where(eq(inventory.variantId, variantId));
  await logMovement(db, variantId, "SALE", quantity, ref);
}

export async function listMovements(db: Database, variantId: string, limit = 20) {
  return db.select().from(inventoryMovements).where(eq(inventoryMovements.variantId, variantId)).orderBy(desc(inventoryMovements.createdAt)).limit(limit);
}
