import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users, stores, suppliers, type User } from "@/db/schema";
import { actorFromUser, type Actor, type Role } from "@/lib/domain/access";
import { NAV } from "@/lib/nav";
import { signSession, verifySession } from "@/lib/security/crypto";
import { isDemoAccountEmail } from "@/lib/security/demo-accounts";

export const SESSION_COOKIE = "nl_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type Session = {
  user: User;
  actor: Actor;
  store: typeof stores.$inferSelect | null;
  supplier: typeof suppliers.$inferSelect | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const payload = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(users.id, payload.uid) });
  if (!user) return null;
  // Conta de demonstração (senha conhecida) não vale fora do modo de demonstração, nem com sessão antiga.
  if (!isDemoMode() && isDemoAccountEmail(user.email)) return null;
  const store = user.storeId ? (await db.query.stores.findFirst({ where: eq(stores.id, user.storeId) })) ?? null : null;
  const supplier = user.supplierId ? (await db.query.suppliers.findFirst({ where: eq(suppliers.id, user.supplierId) })) ?? null : null;
  return { user, actor: actorFromUser(user), store, supplier };
});

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession({ uid: userId, exp: Date.now() + SESSION_TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function homeFor(role: Role): string {
  return NAV[role].base;
}

/** Demo mode libera login sem senha e o seletor de perfis. Nunca em produção sem opt-in explícito. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
