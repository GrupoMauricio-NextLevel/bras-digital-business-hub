import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { users, type User } from "@/db/schema";
import { requireMaster, type Actor } from "./access";
import { recordAudit } from "./audit";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

/**
 * Modo suporte: a equipe NextLevel (Master) vê o painel de um cliente exatamente como ele vê.
 * Regras: só o Master entra; nunca em outra conta Master; motivo obrigatório; dura no máximo 1 hora;
 * começa em somente leitura (agir em nome do cliente é um segundo passo, também registrado);
 * tudo fica na trilha de auditoria, que o dono da loja também enxerga.
 */
export const SUPPORT_TTL_MS = 60 * 60 * 1000;
export const SUPPORT_TOKEN_PURPOSE = "support-v1";

export type SupportGrant = {
  /** usuário Master que está dando suporte */ op: string;
  /** cliente que está sendo visto */ target: string;
  reason: string;
  /** false = somente leitura */ act: boolean;
  /** para onde voltar ao sair */ back: string;
  exp: number;
};

function cleanReason(reason: string): string {
  const r = reason.trim().replace(/\s+/g, " ");
  if (r.length < 5) throw new DomainError("SUPPORT_REASON", "Escreva o motivo do acesso (mínimo de 5 letras). Ele fica registrado para o cliente.");
  return r.slice(0, 300);
}

const tenantOf = (u: User) => ({ storeId: u.storeId ?? null, supplierId: u.supplierId ?? null });

export async function startSupport(db: Database, operator: Actor, input: { targetUserId: string; reason: string; back?: string; now?: number }): Promise<{ grant: SupportGrant; target: User }> {
  requireMaster(operator);
  const reason = cleanReason(input.reason);
  const target = await db.query.users.findFirst({ where: eq(users.id, input.targetUserId) });
  if (!target) throw new NotFoundError("Cliente não encontrado.");
  if (target.disabledAt) throw new DomainError("SUPPORT_TARGET_DISABLED", "Este acesso está encerrado; reative a pessoa antes de entrar como ela.");
  if (target.role === "NEXTLEVEL_MASTER") throw new ForbiddenError("Não é possível entrar como outra conta da NextLevel.");
  const back = input.back && input.back.startsWith("/") && !input.back.startsWith("//") ? input.back : "/master/clientes";
  const grant: SupportGrant = { op: operator.userId, target: target.id, reason, act: false, back, exp: (input.now ?? Date.now()) + SUPPORT_TTL_MS };
  await recordAudit(db, operator, { action: "SUPPORT_START", entityType: "user", entityId: target.id, ...tenantOf(target), after: { motivo: reason, modo: "somente leitura" } }, { force: true });
  return { grant, target };
}

/** Confere a permissão de suporte em vigor: assinatura já validada fora; aqui, prazo, cliente atual e operador ainda Master ativo. */
export async function checkSupport(db: Database, grant: SupportGrant | null, currentUserId: string | null | undefined, now = Date.now()): Promise<{ grant: SupportGrant; operator: User; target: User } | null> {
  if (!grant || grant.exp < now || !currentUserId || grant.target !== currentUserId) return null;
  const [operator, target] = await Promise.all([db.query.users.findFirst({ where: eq(users.id, grant.op) }), db.query.users.findFirst({ where: eq(users.id, grant.target) })]);
  if (!operator || operator.role !== "NEXTLEVEL_MASTER" || operator.disabledAt || !target) return null;
  return { grant, operator, target };
}

export async function enableSupportActing(db: Database, active: { grant: SupportGrant; operator: User; target: User }): Promise<SupportGrant> {
  if (active.grant.act) return active.grant;
  await recordAudit(db, { userId: active.operator.id, role: "NEXTLEVEL_MASTER", organizationId: active.operator.organizationId, supplierId: null, storeId: null }, { action: "SUPPORT_ACT_ENABLED", entityType: "user", entityId: active.target.id, ...tenantOf(active.target), after: { motivo: active.grant.reason } }, { force: true });
  return { ...active.grant, act: true };
}

export async function endSupport(db: Database, active: { grant: SupportGrant; operator: User; target: User }): Promise<void> {
  await recordAudit(db, { userId: active.operator.id, role: "NEXTLEVEL_MASTER", organizationId: active.operator.organizationId, supplierId: null, storeId: null }, { action: "SUPPORT_END", entityType: "user", entityId: active.target.id, ...tenantOf(active.target), after: { modo: active.grant.act ? "agiu em nome do cliente" : "somente leitura" } }, { force: true });
}

// ---------------------------------------------------------------------------
// Central de clientes (Master): todos os acessos de clientes, de todas as marcas, para suporte.
// ---------------------------------------------------------------------------
export type ClientRow = {
  userId: string; name: string; email: string; role: User["role"]; storeRole: User["storeRole"];
  brand: string; tenantName: string | null; tenantKind: "loja" | "fornecedor" | "parceiro";
  storeId: string | null; storeSlug: string | null; storeStatus: string | null; supplierId: string | null; supplierStatus: string | null;
  disabled: boolean; lastLoginAt: string | null; alerts: string[];
};

export const CLIENT_ROLE_LABEL: Record<string, string> = { STORE_OWNER: "Lojista", SUPPLIER_ADMIN: "Fornecedor", SUPPLIER_DISPATCH: "Expedição", AFFILIATE: "Parceiro" };

export async function listClients(db: Database, actor: Actor, f: { q?: string; brand?: string; role?: string; limit?: number } = {}): Promise<ClientRow[]> {
  requireMaster(actor);
  const { organizations, stores, suppliers } = await import("@/db/schema");
  const { and, desc, eq, ilike, ne, or, sql } = await import("drizzle-orm");
  const conds = [ne(users.role, "NEXTLEVEL_MASTER")];
  if (f.brand) conds.push(eq(organizations.brand, f.brand as never));
  if (f.role && CLIENT_ROLE_LABEL[f.role]) conds.push(eq(users.role, f.role as never));
  const q = f.q?.trim();
  if (q) { const like = `%${q}%`; conds.push(or(ilike(users.name, like), ilike(users.email, like), ilike(stores.name, like), ilike(stores.slug, like), ilike(suppliers.name, like))!); }
  const rows = await db.select({ u: users, brand: organizations.brand, store: { id: stores.id, name: stores.name, slug: stores.slug, status: stores.status }, supplier: { id: suppliers.id, name: suppliers.name, status: suppliers.status } })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.organizationId))
    .leftJoin(stores, eq(stores.id, users.storeId))
    .leftJoin(suppliers, eq(suppliers.id, users.supplierId))
    .where(and(...conds))
    .orderBy(sql`${users.lastLoginAt} desc nulls last`, desc(users.createdAt))
    .limit(Math.min(f.limit ?? 150, 300));
  return rows.map(({ u, brand, store, supplier }) => {
    const alerts: string[] = [];
    if (u.disabledAt) alerts.push("Acesso encerrado");
    if (store?.status === "SUSPENDED") alerts.push("Loja suspensa");
    if (store?.status === "PENDING_PAYMENT") alerts.push("Aguardando pagamento");
    if (supplier && supplier.status !== "ACTIVE") alerts.push(supplier.status === "CLOSED" ? "Fornecedor encerrado" : "Fornecedor com restrição");
    return {
      userId: u.id, name: u.name, email: u.email, role: u.role, storeRole: u.storeRole, brand,
      tenantName: store?.name ?? supplier?.name ?? null, tenantKind: u.role === "AFFILIATE" ? "parceiro" : store?.id ? "loja" : "fornecedor",
      storeId: store?.id ?? null, storeSlug: store?.slug ?? null, storeStatus: store?.status ?? null, supplierId: supplier?.id ?? null, supplierStatus: supplier?.status ?? null,
      disabled: !!u.disabledAt, lastLoginAt: u.lastLoginAt ?? null, alerts,
    };
  });
}

/** Últimos acessos de suporte (entrada, ação liberada, saída), para o Master acompanhar. */
export async function listSupportHistory(db: Database, actor: Actor, limit = 20) {
  requireMaster(actor);
  const { auditLog } = await import("@/db/schema");
  const { desc, inArray } = await import("drizzle-orm");
  return db.select().from(auditLog).where(inArray(auditLog.action, ["SUPPORT_START", "SUPPORT_ACT_ENABLED", "SUPPORT_END"])).orderBy(desc(auditLog.createdAt)).limit(Math.min(limit, 100));
}
