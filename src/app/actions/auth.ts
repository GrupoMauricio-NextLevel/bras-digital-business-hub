"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { organizations, suppliers, users } from "@/db/schema";
import { accountBrandConflict, brandOfHostStrict, type BrandCode } from "@/lib/brand";
import { BRAND_PREVIEW_COOKIE } from "@/lib/brand-server";
import { clearSessionCookie, getSession, homeFor, isDemoMode, setSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { runAction } from "@/lib/action-result";
import { isDemoAccountEmail } from "@/lib/security/demo-accounts";
import { DomainError } from "@/lib/domain/errors";
import { requestPasswordReset, resetPassword } from "@/lib/domain/password-reset";
import { getBaseUrl } from "@/lib/base-url";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({ email: z.string().email("E-mail inválido"), password: z.string().min(1, "Informe a senha") });

export async function loginAction(input: z.input<typeof loginSchema>) {
  return runAction(async () => {
    const data = loginSchema.parse(input);
    const db = await getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, data.email.toLowerCase()) });
    if (!user || !verifyPassword(data.password, user.passwordHash) || (!isDemoMode() && isDemoAccountEmail(user.email))) throw new DomainError("INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    if (user.supplierId) {
      const sup = await db.query.suppliers.findFirst({ where: eq(suppliers.id, user.supplierId) });
      if (sup?.status === "CLOSED") throw new DomainError("ACCOUNT_CLOSED", "Conta encerrada. Entre em contato com a NextLevel.");
    }
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.organizationId) });
    const h = await headers();
    // Na prévia (/lojas) o endereço não manda; só vale a trava nos endereços oficiais de cada marca.
    const preview = !!(await cookies()).get(BRAND_PREVIEW_COOKIE)?.value;
    const conflict = accountBrandConflict({ role: user.role, brand: (org?.brand ?? "SUPERDROP") as BrandCode }, preview ? null : brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host")));
    if (conflict) throw new DomainError("WRONG_BRAND", conflict.message);
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

// ---------------------------------------------------------------------------
// Recuperar senha (por e-mail; o link vale 1 hora e só uma vez)
// ---------------------------------------------------------------------------
export async function requestPasswordResetAction(email: string) {
  return runAction(async () => {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`reset:${ip}`, 6, 15 * 60_000) || !rateLimit(`reset-mail:${email.trim().toLowerCase()}`, 3, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos pedidos. Tente de novo em alguns minutos.");
    const r = await requestPasswordReset(await getDb(), email, await getBaseUrl());
    // Só a demonstração mostra o link na tela (não há provedor de e-mail); em produção a resposta é sempre igual.
    return { demoLink: isDemoMode() ? r.link : null };
  });
}

export async function resetPasswordAction(token: string, password: string) {
  return runAction(async () => { await resetPassword(await getDb(), token, password); return undefined; });
}
