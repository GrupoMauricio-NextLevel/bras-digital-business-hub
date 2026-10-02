import { redirect } from "next/navigation";
import { getSession, type Session } from "./auth";
import type { Role } from "./domain/access";
import { homeFor } from "./auth";
import { canAccessArea, grantForAreaRole } from "./domain/access";
import type { EcosystemAccessRole, ProductArea } from "./ecosystem";

/** Garante sessão com o papel legado esperado; usar apenas enquanto a migração não terminar. */
export async function requireRole(role: Role | Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/account/password");
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role)) redirect(homeFor(session.user.role));
  return session;
}

/** Garante sessão autenticada e acesso explícito à vertical/produto solicitado. */
export async function requireProductArea(area: ProductArea): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/account/password");
  if (!canAccessArea(session.actor, area)) redirect(homeFor(session.user.role));
  return session;
}

/** Garante acesso a uma vertical com um dos papéis multi-produto esperados. */
export async function requireAreaRole(
  area: ProductArea,
  roles: EcosystemAccessRole | EcosystemAccessRole[],
): Promise<Session> {
  const session = await requireProductArea(area);
  if (!grantForAreaRole(session.actor, area, roles)) redirect(homeFor(session.user.role));
  return session;
}
