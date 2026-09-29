import { and, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activities } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";

export type Notice = { id: string; message: string; createdAt: string; type: string };

/** Atividades recentes visíveis ao ator, usadas na central de avisos. Sempre com escopo do tenant. */
export async function recentNotices(actor: Actor, limit = 8): Promise<Notice[]> {
  const db = await getDb();
  const scope =
    actor.role === "NEXTLEVEL_MASTER" ? eq(activities.scope, "PLATFORM")
    : actor.role === "STORE_OWNER" ? and(eq(activities.scope, "STORE"), eq(activities.storeId, actor.storeId ?? "__none__"))
    : and(eq(activities.scope, "SUPPLIER"), eq(activities.supplierId, actor.supplierId ?? "__none__"));
  const rows = await db.select({ id: activities.id, message: activities.message, createdAt: activities.createdAt, type: activities.type }).from(activities).where(or(scope)).orderBy(desc(activities.createdAt)).limit(limit);
  return rows;
}
