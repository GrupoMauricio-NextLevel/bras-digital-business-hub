"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { suppliers, users } from "@/db/schema";
import { clearSessionCookie, getSession, homeFor, isDemoMode, setSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { runAction } from "@/lib/action-result";
import { DomainError } from "@/lib/domain/errors";

const loginSchema = z.object({ email: z.string().email("E-mail inválido"), password: z.string().min(1, "Informe a senha") });

export async function loginAction(input: z.input<typeof loginSchema>) {
  return runAction(async () => {
    const data = loginSchema.parse(input);
    const db = await getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, data.email.toLowerCase()) });
    if (!user || !verifyPassword(data.password, user.passwordHash)) throw new DomainError("INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    if (user.supplierId) {
      const sup = await db.query.suppliers.findFirst({ where: eq(suppliers.id, user.supplierId) });
      if (sup?.status === "CLOSED") throw new DomainError("ACCOUNT_CLOSED", "Conta encerrada. Entre em contato com a NextLevel.");
    }
    await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));
    await setSessionCookie(user.id);
    return { redirectTo: user.mustChangePassword ? "/account/password" : homeFor(user.role) };
  });
}

/** Login sem senha — apenas em demo mode. */
export async function loginAs(email: string) {
  if (!isDemoMode()) redirect("/login?error=demo_off");
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) redirect("/login?error=user");
  await setSessionCookie(user.id);
  redirect(homeFor(user.role));
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}

export async function listDemoUsers() {
  if (!isDemoMode()) return [];
  const db = await getDb();
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
}

const passwordSchema = z.object({ current: z.string().optional(), next: z.string().min(8, "A nova senha precisa de pelo menos 8 caracteres") });

export async function changePasswordAction(input: z.input<typeof passwordSchema>) {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new DomainError("UNAUTHENTICATED", "Sessão expirada.");
    const data = passwordSchema.parse(input);
    if (session.user.passwordHash && !session.user.mustChangePassword && !verifyPassword(data.current ?? "", session.user.passwordHash)) {
      throw new DomainError("INVALID_CREDENTIALS", "Senha atual incorreta.");
    }
    const db = await getDb();
    await db.update(users).set({ passwordHash: hashPassword(data.next), mustChangePassword: false }).where(eq(users.id, session.user.id));
    return { redirectTo: homeFor(session.user.role) };
  });
}
