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

export function grantForAreaRole(
  actor: Actor,
  area: ProductArea,
  roles: EcosystemAccessRole | EcosystemAccessRole[],
): AccessGrant | null {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return grantsForActor(actor).find(
    (grant) => grant.area === area && allowed.includes(grant.role) && grant.active !== false,
  ) ?? null;
}

export function isMaster(actor: Actor): boolean {
  return actor.role === "NEXTLEVEL_MASTER";
}

/** Garante que o ator pode enxergar um registro pertencente a (storeId, supplierId). */
export function assertCanAccess(actor: Actor, target: { storeId?: string | null; supplierId?: string | null }): void {
  if (isMaster(actor)) return;

  const supplierGrant = grantForAreaRole(actor, "SUPERDROP", ["SUPPLIER_ADMIN", "OPERATOR"]);
  if (supplierGrant?.supplierId && target.supplierId && supplierGrant.supplierId === target.supplierId) return;

  const merchantGrant = grantForAreaRole(actor, "SUPERDROP", "MERCHANT_OWNER");
  if (merchantGrant?.storeId && target.storeId && merchantGrant.storeId === target.storeId) return;

  // Ponte defensiva para sessões antigas sem grants persistidos.
  if ((actor.role === "SUPPLIER_ADMIN" || actor.role === "SUPPLIER_DISPATCH") && target.supplierId && actor.supplierId === target.supplierId) return;
  if (actor.role === "STORE_OWNER" && target.storeId && actor.storeId === target.storeId) return;

  throw new ForbiddenError();
}

export function requireStoreId(actor: Actor): string {
  const grant = grantForAreaRole(actor, "SUPERDROP", "MERCHANT_OWNER");
  const storeId = grant?.storeId ?? actor.storeId;
  const legacyOk = actor.role === "STORE_OWNER";
  if ((!grant && !legacyOk) || !storeId) throw new ForbiddenError("Ação disponível apenas para lojistas.");
  return storeId;
}

/** Expedição enxerga só a operação (sem valores); o ADM enxerga tudo do fornecedor. */
export function isSupplierSide(actor: Actor): boolean {
  return !!grantForAreaRole(actor, "SUPERDROP", ["SUPPLIER_ADMIN", "OPERATOR"])
    || actor.role === "SUPPLIER_ADMIN"
    || actor.role === "SUPPLIER_DISPATCH";
}

export function requireSupplierId(actor: Actor): string {
  const grant = grantForAreaRole(actor, "SUPERDROP", "SUPPLIER_ADMIN");
  const supplierId = grant?.supplierId ?? actor.supplierId;
  const legacyOk = actor.role === "SUPPLIER_ADMIN";
  if ((!grant && !legacyOk) || !supplierId) throw new ForbiddenError("Ação disponível apenas para o fornecedor.");
  return supplierId;
}

export function requireSupplierOperationalId(actor: Actor): string {
  const grant = grantForAreaRole(actor, "SUPERDROP", ["SUPPLIER_ADMIN", "OPERATOR"]);
  const supplierId = grant?.supplierId ?? actor.supplierId;
  const legacyOk = actor.role === "SUPPLIER_ADMIN" || actor.role === "SUPPLIER_DISPATCH";
  if ((!grant && !legacyOk) || !supplierId) throw new ForbiddenError("Ação disponível apenas para a operação do fornecedor.");
  return supplierId;
}

export function requireMaster(actor: Actor): void {
  if (!isMaster(actor)) throw new ForbiddenError("Ação disponível apenas para a NextLevel.");
}
