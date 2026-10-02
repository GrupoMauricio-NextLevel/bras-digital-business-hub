import type { User } from "@/db/schema";
import { ForbiddenError } from "./errors";

export type Role = User["role"];

/** Contexto de acesso resolvido a partir do usuário autenticado. */
export type Actor = {
  userId: string;
  role: Role;
  organizationId: string;
  supplierId: string | null;
  storeId: string | null;
  /** Dentro da loja: ausente ou OWNER = dono; STAFF = equipe com acesso operacional. */
  storeRole?: "OWNER" | "STAFF";
};

export function actorFromUser(user: User): Actor {
  return { userId: user.id, role: user.role, organizationId: user.organizationId, supplierId: user.supplierId, storeId: user.storeId, storeRole: user.storeRole };
}

/** Funções de dono (finanças, configurações, equipe, preços e publicação). Equipe da loja não passa. */
export function assertStoreAdmin(actor: Actor): void {
  if (actor.role === "STORE_OWNER" && actor.storeRole === "STAFF") throw new ForbiddenError("Esta função é só do dono da loja.");
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
