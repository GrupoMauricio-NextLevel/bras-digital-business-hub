import { redirect } from "next/navigation";
import { getSession, type Session } from "./auth";
import type { Role } from "./domain/access";
import { homeFor } from "./auth";

/** Páginas de dono (finanças, configurações, equipe…): a equipe da loja volta para os pedidos. */
export async function requireStoreAdmin(): Promise<Session> {
  const session = await requireRole("STORE_OWNER");
  if (session.user.storeRole === "STAFF") redirect("/merchant/orders");
  return session;
}

/** Garante sessão com o papel esperado; redireciona caso contrário. */
export async function requireRole(role: Role | Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/account/password");
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role)) redirect(homeFor(session.user.role));
  return session;
}
