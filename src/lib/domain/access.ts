import type { User } from "@/db/schema";
import { ForbiddenError } from "./errors";
import {
  hasAreaAccess,
  legacyRoleDefaultGrants,
  type AccessGrant,
  type EcosystemAccessRole,
  type ProductArea,
} from "@/lib/ecosystem";

export type Role = User["role"];

/** Contexto de acesso resolvido a partir do usuário autenticado. */
export type Actor = {
  userId: string;
  role: Role;
  organizationId: string;
  supplierId: string | null;
  storeId: string | null;
  /** Grants multi-produto. Ausente = usa a ponte de compatibilidade do papel legado. */
  grants?: AccessGrant[];
};

export function actorFromUser(user: User, grants?: AccessGrant[]): Actor {
  return {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    supplierId: user.supplierId,
    storeId: user.storeId,
    grants,
  };
}

export function grantsForActor(actor: Actor): AccessGrant[] {
  if (actor.grants && actor.grants.length > 0) return actor.grants;
  return legacyRoleDefaultGrants({
    role: actor.role,
    organizationId: actor.organizationId,
    supplierId: actor.supplierId,
    storeId: actor.storeId,
  });
}

export function canAccessArea(actor: Actor, area: ProductArea): boolean {
  return hasAreaAccess(grantsForActor(actor), area);
}

export function requireAreaAccess(actor: Actor, area: ProductArea): void {
  if (!canAccessArea(actor, area)) {
    throw new ForbiddenError("Você não tem acesso a este produto da plataforma.");
  }
}

export function hasAreaRole(actor: Actor, area: ProductArea, role: EcosystemAccessRole): boolean {
  return grantsForActor(actor).some(
    (grant) => grant.area === area && grant.role === role && grant.active !== false,
  );
}

export function isMaster(actor: Actor): boolean {
  return actor.role === "NEXTLEVEL_MASTER";
}

/** Garante que o ator pode enxergar um registro pertencente a (storeId, supplierId). */
export function assertCanAccess(actor: Actor, target: { storeId?: string | null; supplierId?: string | null }): void {
  if (isMaster(actor)) return;
  if (actor.role === "SUPPLIER_ADMIN" || actor.role === "SUPPLIER_DISPATCH") {
    if (target.supplierId && actor.supplierId === target.supplierId) return;
    throw new ForbiddenError();
  }
  if (actor.role === "STORE_OWNER") {
    if (target.storeId && actor.storeId === target.storeId) return;
    throw new ForbiddenError();
  }
  throw new ForbiddenError();
}

export function requireStoreId(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Ação disponível apenas para lojistas.");
  return actor.storeId;
}

/** Expedição enxerga só a operação (sem valores); o ADM enxerga tudo do fornecedor. */
export function isSupplierSide(actor: Actor): boolean {
  return actor.role === "SUPPLIER_ADMIN" || actor.role === "SUPPLIER_DISPATCH";
}

export function requireSupplierId(actor: Actor): string {
  if (actor.role !== "SUPPLIER_ADMIN" || !actor.supplierId) throw new ForbiddenError("Ação disponível apenas para o fornecedor.");
  return actor.supplierId;
}

export function requireMaster(actor: Actor): void {
  if (!isMaster(actor)) throw new ForbiddenError("Ação disponível apenas para a NextLevel.");
}
