"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { SESSION_COOKIE, homeFor } from "@/lib/auth";

export async function loginAs(email: string) {
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) redirect("/login?error=user");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect(homeFor(user.role));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function listDemoUsers() {
  const db = getDb();
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
}
