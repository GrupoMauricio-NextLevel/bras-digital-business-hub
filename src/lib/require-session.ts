import { redirect } from "next/navigation";
import { getSession, type Session } from "./auth";
import type { Role } from "./domain/access";
import { homeFor } from "./auth";

/** Garante sessão com o papel esperado; redireciona caso contrário. */
export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== role) redirect(homeFor(session.user.role));
  return session;
}
