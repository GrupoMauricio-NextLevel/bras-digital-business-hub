import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { financialAuditLog, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { verifyPassword } from "@/lib/security/password";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError } from "./errors";

/** Domínios financeiros separados (D90). Toda API, tela e exportação diz a qual pertence. */
export const CORPORATE = "nextlevel_corporate_finance" as const;
export const OPERATIONAL = "tenant_operational_finance" as const;
export type FinanceDomain = typeof CORPORATE | typeof OPERATIONAL;

const SECRET = /token|secret|senha|password|hash|chave|key_enc|pix_key|card|cartao|cvv/i;

/** Remove campos sensíveis antes de gravar na trilha. */
function scrub(v: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!v) return null;
  return Object.fromEntries(Object.entries(v).filter(([k]) => !SECRET.test(k)));
}

export type FinancialAuditInput = {
  domain: FinanceDomain; action: string; entityType: string; entityId?: string | null;
  storeId?: string | null; supplierId?: string | null; partnerId?: string | null;
  before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; reason?: string | null;
};

/** Grava na trilha só-inserção. `actor` nulo = sistema (webhook, rotina). */
export async function recordFinancialAudit(db: Database, actor: Actor | null, e: FinancialAuditInput) {
  await db.insert(financialAuditLog).values({ id: newId("fal"), domain: e.domain, actorUserId: actor?.userId ?? null, actorRole: actor?.role ?? "SYSTEM", action: e.action, entityType: e.entityType, entityId: e.entityId ?? null, storeId: e.storeId ?? null, supplierId: e.supplierId ?? null, partnerId: e.partnerId ?? null, before: scrub(e.before), after: scrub(e.after), reason: e.reason ?? null });
}

/** Trilha corporativa: só o Master lê. */
export async function listFinancialAudit(db: Database, actor: Actor, opts: { limit?: number; entityType?: string } = {}) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel acessa a auditoria financeira.");
  return db.select().from(financialAuditLog).where(opts.entityType ? eq(financialAuditLog.entityType, opts.entityType) : undefined).orderBy(desc(financialAuditLog.createdAt)).limit(Math.min(opts.limit ?? 200, 1000));
}

/**
 * Reautenticação para operação sensível (preço, comissão, gateway, reembolso, exportação): o Master confirma a senha
 * na própria ação. 2FA ainda não existe no sistema (pendência registrada em docs/financeiro-master.md).
 */
export async function assertReauth(db: Database, actor: Actor, password: string | undefined) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel.");
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId) });
  if (!password || !u || !verifyPassword(password, u.passwordHash)) throw new DomainError("REAUTH", "Confirme a sua senha para esta operação.");
}
