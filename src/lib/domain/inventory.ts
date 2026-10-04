import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { inventory, inventoryMovements, productVariants } from "@/db/schema";
import { emitEvent } from "./events";
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

type MovementRef = { referenceType?: string; referenceId?: string; note?: string; actorUserId?: string };
type Balances = { onHand: number; reserved: number };

/** Garante a linha de estoque da variante (sem erro se duas chamadas criarem ao mesmo tempo). */
async function ensureRow(db: Database, variantId: string) {
  const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, variantId) });
  if (!variant) throw new DomainError("VARIANT_NOT_FOUND", "Variante não encontrada.");
  await db.insert(inventory).values({ variantId, onHand: 0, reserved: 0 }).onConflictDoNothing({ target: inventory.variantId });
}

async function logMovement(db: Database, variantId: string, type: MovementType, quantity: number, ref: MovementRef, before: Balances, after: Balances) {
  await db.insert(inventoryMovements).values({
    id: newId("mov"), variantId, type, quantity, referenceType: ref.referenceType, referenceId: ref.referenceId, note: ref.note,
    onHandBefore: before.onHand, onHandAfter: after.onHand, reservedBefore: before.reserved, reservedAfter: after.reserved, actorUserId: ref.actorUserId,
  });
}

/**
 * Toda alteração de saldo é UMA instrução condicional no banco (confere e grava juntas): duas operações simultâneas
 * não leem o mesmo saldo, e a condição impede vender mais do que existe. Sem linha devolvida = regra violada.
 */
async function apply(db: Database, variantId: string, set: { onHand?: ReturnType<typeof sql>; reserved?: ReturnType<typeof sql> }, guard: ReturnType<typeof sql>) {
  const rows = await db.update(inventory).set({ ...set, updatedAt: new Date().toISOString() }).where(and(eq(inventory.variantId, variantId), guard)).returning();
  return rows[0] ?? null;
}

/** Entrada de estoque (compra/produção). */
export async function receiveStock(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  await ensureRow(db, variantId);
  const row = (await apply(db, variantId, { onHand: sql`${inventory.onHand} + ${quantity}` }, sql`true`))!;
  await logMovement(db, variantId, "IN", quantity, ref, { onHand: row.onHand - quantity, reserved: row.reserved }, row);
}

/** Ajuste manual (pode ser negativo, mas nunca abaixo do reservado). */
export async function adjustStock(db: Database, variantId: string, delta: number, ref: MovementRef = {}) {
  if (delta === 0) return;
  await ensureRow(db, variantId);
  const row = await apply(db, variantId, { onHand: sql`${inventory.onHand} + ${delta}` }, sql`${inventory.onHand} + ${delta} >= ${inventory.reserved}`);
  if (!row) throw new DomainError("INSUFFICIENT_STOCK", "Ajuste deixaria o estoque físico abaixo do reservado.");
  await logMovement(db, variantId, "ADJUSTMENT", delta, ref, { onHand: row.onHand - delta, reserved: row.reserved }, row);
}

/** Reserva estoque para um pedido. Falha se não houver disponível (conferência e gravação numa instrução só). */
export async function reserveStock(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  await ensureRow(db, variantId);
  const row = await apply(db, variantId, { reserved: sql`${inventory.reserved} + ${quantity}` }, sql`${inventory.onHand} - ${inventory.reserved} >= ${quantity}`);
  if (!row) {
    const { available } = await getLevel(db, variantId);
    throw new DomainError("INSUFFICIENT_STOCK", `Estoque insuficiente (disponível: ${available}, solicitado: ${quantity}).`);
  }
  await logMovement(db, variantId, "RESERVE", quantity, ref, { onHand: row.onHand, reserved: row.reserved - quantity }, row);
  // Esgotou com esta reserva (a atualização condicional garante uma única transição por vez). Só ids e números.
  if (row.onHand - row.reserved === 0) await emitEvent(db, { type: "STOCK_OUT", payload: { variantId, onHand: row.onHand } });
}

/** Libera reserva (cancelamento/expiração). */
export async function releaseStock(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  await ensureRow(db, variantId);
  const row = await apply(db, variantId, { reserved: sql`${inventory.reserved} - ${quantity}` }, sql`${inventory.reserved} >= ${quantity}`);
  if (!row) throw new DomainError("INVALID_RELEASE", "Liberação maior que o reservado.");
  await logMovement(db, variantId, "RELEASE", quantity, ref, { onHand: row.onHand, reserved: row.reserved + quantity }, row);
}

/** Consome a reserva definitivamente (expedição). */
export async function consumeReservation(db: Database, variantId: string, quantity: number, ref: MovementRef = {}) {
  if (quantity <= 0) throw new DomainError("INVALID_QUANTITY", "Quantidade deve ser positiva.");
  await ensureRow(db, variantId);
  const row = await apply(db, variantId, { reserved: sql`${inventory.reserved} - ${quantity}`, onHand: sql`${inventory.onHand} - ${quantity}` }, sql`${inventory.reserved} >= ${quantity} and ${inventory.onHand} >= ${quantity}`);
  if (!row) throw new DomainError("INVALID_SALE", "Venda maior que o reservado/físico.");
  await logMovement(db, variantId, "SALE", quantity, ref, { onHand: row.onHand + quantity, reserved: row.reserved + quantity }, row);
}

export async function listMovements(db: Database, variantId: string, limit = 20) {
  return db.select().from(inventoryMovements).where(eq(inventoryMovements.variantId, variantId)).orderBy(desc(inventoryMovements.createdAt)).limit(limit);
}
