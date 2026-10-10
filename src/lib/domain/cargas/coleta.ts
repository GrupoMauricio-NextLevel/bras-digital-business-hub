import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdRequests, trLoadEvents, trLoadRequests, trLoads } from "@/db/schema";
import { newId } from "@/lib/ids";

/**
 * Coleta concluída (D111): quando todos os pedidos de uma carga aceita saem do balcão com o código, a carga vira
 * "coletada". Módulo separado (só banco) para o pedido da Brás e o Balcão chamarem sem dependência circular.
 */
/** Coletada: quando todos os pedidos da carga saíram do balcão com o código (chamado na confirmação da retirada). */
export async function syncLoadCollected(db: Database, requestId: string, now = new Date()) {
  const [lr] = await db.select({ loadId: trLoadRequests.loadId }).from(trLoadRequests).innerJoin(trLoads, eq(trLoads.id, trLoadRequests.loadId)).where(and(eq(trLoadRequests.requestId, requestId), eq(trLoads.status, "ACEITA"))).limit(1);
  if (!lr) return false;
  const rs = await db.select({ status: bdRequests.status }).from(trLoadRequests).innerJoin(bdRequests, eq(bdRequests.id, trLoadRequests.requestId)).where(eq(trLoadRequests.loadId, lr.loadId));
  if (!rs.every((r) => r.status === "PICKED_UP")) return false;
  const upd = await db.update(trLoads).set({ status: "COLETADA", collectedAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(trLoads.id, lr.loadId), eq(trLoads.status, "ACEITA"))).returning({ id: trLoads.id });
  if (upd.length) await db.insert(trLoadEvents).values({ id: newId("trle"), loadId: lr.loadId, kind: "COLETADA", actor: "Balcão da importadora", note: null });
  return upd.length > 0;
}

