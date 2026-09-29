import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users, stores, suppliers, type User } from "@/db/schema";
import { actorFromUser, type Actor, type Role } from "@/lib/domain/access";
import { NAV } from "@/lib/nav";

export const SESSION_COOKIE = "nl_session";

export type Session = {
  user: User;
  actor: Actor;
  store: typeof stores.$inferSelect | null;
  supplier: typeof suppliers.$inferSelect | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;
  const store = user.storeId ? (await db.query.stores.findFirst({ where: eq(stores.id, user.storeId) })) ?? null : null;
  const supplier = user.supplierId ? (await db.query.suppliers.findFirst({ where: eq(suppliers.id, user.supplierId) })) ?? null : null;
  return { user, actor: actorFromUser(user), store, supplier };
});

export function homeFor(role: Role): string {
  return NAV[role].base;
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV !== "production";
}
