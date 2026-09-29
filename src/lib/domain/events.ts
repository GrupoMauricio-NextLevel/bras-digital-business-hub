import type { Database } from "@/db/client";
import { domainEvents } from "@/db/schema";
import { newId } from "@/lib/ids";

export type EventInput = { type: string; supplierId?: string | null; storeId?: string | null; actorRole?: string | null; payload?: Record<string, unknown>; dedupeKey?: string };

/** Grava um evento de domínio. Com `dedupeKey`, repetir a emissão é inofensivo. Devolve true se gravou (false se duplicado). Nunca derruba a ação que o originou. */
export async function emitEvent(db: Database, e: EventInput): Promise<boolean> {
  try {
    const r = await db.insert(domainEvents).values({ id: newId("evt"), type: e.type, supplierId: e.supplierId ?? null, storeId: e.storeId ?? null, actorRole: e.actorRole ?? null, payload: e.payload ?? {}, dedupeKey: e.dedupeKey ?? null }).onConflictDoNothing().returning({ id: domainEvents.id });
    return r.length > 0;
  } catch (err) {
    console.error("[domain event]", e.type, err);
    return false;
  }
}
