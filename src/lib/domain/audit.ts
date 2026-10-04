import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { auditLog } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { Actor } from "./access";
import { ForbiddenError } from "./errors";

/** Campos cujo valor nunca é gravado na trilha (só o fato de que mudaram). */
const SENSITIVE = /token|secret|senha|password|hash|chave|key|pix|iban|card|cartao/i;

export type AuditInput = { action: string; entityType: string; entityId?: string | null; storeId?: string | null; supplierId?: string | null; before?: Record<string, unknown>; after?: Record<string, unknown> };

/** Diferença campo a campo entre antes e depois; campos sensíveis ficam sem valor. */
export function diffFields(before: Record<string, unknown> = {}, after: Record<string, unknown> = {}): Record<string, { from?: unknown; to?: unknown }> {
  const out: Record<string, { from?: unknown; to?: unknown }> = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[k]; const b = after[k];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    out[k] = SENSITIVE.test(k) ? {} : { from: a ?? null, to: b ?? null };
  }
  return out;
}

/** Registra uma mudança sensível. Nunca derruba a ação que a originou. Sem diferença e sem `force`, não grava. */
export async function recordAudit(db: Database, actor: Actor, e: AuditInput, opts: { force?: boolean } = {}): Promise<boolean> {
  try {
    const changes = diffFields(e.before, e.after);
    if (!opts.force && !Object.keys(changes).length && (e.before || e.after)) return false;
    await db.insert(auditLog).values({ id: newId("aud"), storeId: e.storeId ?? actor.storeId ?? null, supplierId: e.supplierId ?? actor.supplierId ?? null, actorUserId: actor.userId, actorRole: actor.role, action: e.action, entityType: e.entityType, entityId: e.entityId ?? null, changes });
    return true;
  } catch (err) {
    console.error("[audit]", e.action, err);
    return false;
  }
}

/** Últimas mudanças da própria loja (só o dono). */
export async function listAudit(db: Database, actor: Actor, limit = 100) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da loja vê o histórico de mudanças.");
  return db.select().from(auditLog).where(eq(auditLog.storeId, actor.storeId)).orderBy(desc(auditLog.createdAt)).limit(Math.min(limit, 200));
}
