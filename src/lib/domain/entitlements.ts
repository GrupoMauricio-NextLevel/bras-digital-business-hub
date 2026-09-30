import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { Database } from "@/db/client";
import { entitlements } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError } from "./errors";
import type { Actor } from "./access";

export type Tenant = { type: "STORE"; storeId: string } | { type: "SUPPLIER"; supplierId: string };

/** Tenant do ator (lojista ou fornecedor); null para master/expedição sem tenant próprio. */
export function tenantOf(actor: Actor): Tenant | null {
  if (actor.role === "STORE_OWNER" && actor.storeId) return { type: "STORE", storeId: actor.storeId };
  if ((actor.role === "SUPPLIER_ADMIN" || actor.role === "SUPPLIER_DISPATCH") && actor.supplierId) return { type: "SUPPLIER", supplierId: actor.supplierId };
  return null;
}

const where = (t: Tenant) => (t.type === "STORE" ? eq(entitlements.storeId, t.storeId) : eq(entitlements.supplierId, t.supplierId));

export async function activeEntitlementKeys(db: Database, t: Tenant, now = new Date()): Promise<Set<string>> {
  const rows = await db.select().from(entitlements).where(and(where(t), or(isNull(entitlements.endsAt), gt(entitlements.endsAt, now.toISOString()))));
  return new Set(rows.filter((r) => new Date(r.startsAt) <= now).map((r) => r.key));
}

export const hasEntitlement = async (db: Database, t: Tenant, key: string, now = new Date()) => (await activeEntitlementKeys(db, t, now)).has(key);

export async function requireEntitlement(db: Database, t: Tenant, key: string, label: string): Promise<void> {
  if (!(await hasEntitlement(db, t, key))) throw new DomainError("ENTITLEMENT_REQUIRED", `${label} é um add-on. Ative na Loja NextLevel para liberar.`);
}

/** Concede (ou estende) um direito. Renovação soma o período ao fim atual quando ainda vigente. */
export async function grantEntitlement(db: Database, t: Tenant, input: { key: string; source: "ADD_ON" | "COURTESY" | "PLAN"; months?: number; invoiceId?: string; note?: string; now?: Date }) {
  const now = input.now ?? new Date();
  const existing = await db.select().from(entitlements).where(and(where(t), eq(entitlements.key, input.key)));
  if (input.invoiceId && existing.some((e) => e.invoiceId === input.invoiceId)) return; // idempotente por fatura
  const current = existing.filter((e) => e.endsAt === null || new Date(e.endsAt) > now).sort((a, b) => (a.endsAt ?? "9").localeCompare(b.endsAt ?? "9")).pop();
  if (current && current.endsAt === null) return; // já vitalício
  let endsAt: string | null = null;
  if (input.months) {
    const base = current?.endsAt ? new Date(current.endsAt) : now;
    const end = new Date(base); end.setUTCMonth(end.getUTCMonth() + input.months);
    endsAt = end.toISOString();
  }
  await db.insert(entitlements).values({ id: newId("ent"), tenantType: t.type, storeId: t.type === "STORE" ? t.storeId : null, supplierId: t.type === "SUPPLIER" ? t.supplierId : null, key: input.key, source: input.source, startsAt: now.toISOString(), endsAt, invoiceId: input.invoiceId ?? null, note: input.note ?? null });
}

export async function revokeEntitlement(db: Database, t: Tenant, key: string) {
  await db.delete(entitlements).where(and(where(t), eq(entitlements.key, key)));
}
