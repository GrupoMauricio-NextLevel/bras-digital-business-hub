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
import { allowLoginAttempt } from "@/lib/security/login-limit";
import { profileForHost } from "@/lib/domain/conta-grupo";
import { bilheteCodigoEmail, bilheteSegundaEtapa, codigoEmailLigado, conferirCodigoEmail, conferirSegundaEtapa, lerBilheteCodigoEmail, lerBilheteSegundaEtapa, novoCodigoEmail, temDuasEtapas } from "@/lib/domain/seguranca-conta";
import { brandOfUser, sendEmail } from "@/lib/email";

const loginSchema = z.object({ email: z.string().email("E-mail inválido"), password: z.string().min(1, "Informe a senha") });

export async function loginAction(input: z.input<typeof loginSchema>) {
  return runAction(async () => {
    const data = loginSchema.parse(input);
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!allowLoginAttempt(ip, data.email)) throw new DomainError("RATE_LIMIT", "Muitas tentativas de entrada. Aguarde alguns minutos e tente de novo.");
    const db = await getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, data.email.toLowerCase()) });
    if (!user || user.disabledAt || !verifyPassword(data.password, user.passwordHash) || (!isDemoMode() && isDemoAccountEmail(user.email))) throw new DomainError("INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    if (user.supplierId) {
      const sup = await db.query.suppliers.findFirst({ where: eq(suppliers.id, user.supplierId) });
      if (sup?.status === "CLOSED") throw new DomainError("ACCOUNT_CLOSED", "Conta encerrada. Entre em contato com a NextLevel.");
    }
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.organizationId) });
    const h = await headers();
    // Na prévia (/lojas) o endereço não manda; só vale a trava nos endereços oficiais de cada marca.
    const preview = !!(await cookies()).get(BRAND_PREVIEW_COOKIE)?.value;
    const hostBrand = preview ? null : brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host"));
    const conflict = accountBrandConflict({ role: user.role, brand: (org?.brand ?? "SUPERDROP") as BrandCode }, hostBrand);
    // Conta do grupo (D141): a senha de um perfil abre o perfil da mesma pessoa que é da marca deste endereço.
    const target = conflict ? await profileForHost(db, user, hostBrand) : user;
    if (!target) throw new DomainError("WRONG_BRAND", conflict!.message);
    // Duas etapas (D183): a senha certa só gera um bilhete de 5 minutos; a sessão abre depois do código do aplicativo.
    if (temDuasEtapas(target)) return { segundaEtapa: bilheteSegundaEtapa(target.id), via: "app" as const, redirectTo: "" };
    // Código por e-mail a cada entrada (D286) para quem não tem o aplicativo. Se o e-mail não sair, entra só com a senha
    // (ninguém fica trancado para fora por falha do provedor de e-mail); a falha fica registrada.
    if (codigoEmailLigado(isDemoMode())) {
      const enviado = await enviarCodigoEmail(db, target);
      if (enviado) return { segundaEtapa: enviado, via: "email" as const, emailMascarado: mascarar(target.email), redirectTo: "" };
      console.error("[código por e-mail] não enviado; entrada só com a senha", target.id);
    }
    await abrirSessao(db, target, ip);
    return { redirectTo: target.mustChangePassword ? "/account/password" : homeFor(target.role) };
  });
}

const mascarar = (e: string) => { const [u, d] = e.split("@"); return `${u!.slice(0, 2)}${"•".repeat(Math.max(2, u!.length - 2))}@${d}`; };

/** Gera e manda o código por e-mail; devolve o bilhete, ou null se o e-mail não saiu. */
async function enviarCodigoEmail(db: Awaited<ReturnType<typeof getDb>>, user: typeof users.$inferSelect): Promise<string | null> {
  const codigo = novoCodigoEmail();
  const status = await sendEmail(db, {
    kind: "LOGIN_CODIGO", to: user.email, brand: await brandOfUser(db, user.id),
    subject: `${codigo} é o seu código de acesso {marca}`,
    text: `Use o código ${codigo} para entrar na sua conta. Ele vale por 10 minutos.\n\nSe não foi você que tentou entrar, troque a sua senha agora: alguém sabe a sua senha atual.`,
  });
  return status === "SENT" ? bilheteCodigoEmail(user.id, codigo) : null;
}

async function abrirSessao(db: Awaited<ReturnType<typeof getDb>>, user: typeof users.$inferSelect, ip: string) {
  await db.update(users).set({ lastLoginAt: new Date().toISOString(), lastLoginIp: ip === "0.0.0.0" ? null : ip }).where(eq(users.id, user.id));
  await setSessionCookie(user.id);
}

const segundaEtapaSchema = z.object({ bilhete: z.string().min(10), codigo: z.string().min(6, "Digite o código de 6 números").max(20) });

/** Segunda etapa da entrada: código do aplicativo autenticador (ou um código de recuperação). */
export async function loginSegundaEtapaAction(input: z.input<typeof segundaEtapaSchema>) {
  return runAction(async () => {
    const data = segundaEtapaSchema.parse(input);
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    const porEmail = lerBilheteCodigoEmail(data.bilhete);
    const uid = porEmail ?? lerBilheteSegundaEtapa(data.bilhete);
    if (!uid) throw new DomainError("EXPIRED", "O tempo para digitar o código acabou. Entre de novo com a senha.");
    if (!allowLoginAttempt(ip, `2fa:${uid}`)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    const db = await getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, uid) });
    if (!user || user.disabledAt) throw new DomainError("INVALID_CREDENTIALS", "Conta indisponível.");
    if (porEmail) { if (conferirCodigoEmail(data.bilhete, data.codigo) !== uid) throw new DomainError("INVALID_CODE", "Código incorreto. Confira o último e-mail que enviamos."); }
    else if (!(await conferirSegundaEtapa(db, uid, data.codigo))) throw new DomainError("INVALID_CODE", "Código incorreto. Use o código que aparece agora no aplicativo.");
    await abrirSessao(db, user, ip);
    return { redirectTo: user.mustChangePassword ? "/account/password" : homeFor(user.role) };
  });
}

/** Reenvia o código por e-mail (D286): um bilhete válido de código por e-mail gera um código novo. */
export async function reenviarCodigoAction(bilhete: string) {
  return runAction(async () => {
    const uid = lerBilheteCodigoEmail(bilhete);
    if (!uid) throw new DomainError("EXPIRED", "O tempo acabou. Entre de novo com a senha.");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`reenvio:${uid}:${ip}`, 3, 10 * 60_000)) throw new DomainError("RATE_LIMIT", "Já enviamos alguns códigos. Aguarde alguns minutos.");
    const db = await getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, uid) });
    if (!user || user.disabledAt) throw new DomainError("INVALID_CREDENTIALS", "Conta indisponível.");
    const novo = await enviarCodigoEmail(db, user);
    if (!novo) throw new DomainError("EMAIL", "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.");
    return { bilhete: novo };
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
  // Sair durante o modo suporte encerra o suporte (registrado) e volta à conta Master.
  const session = await getSession();
  if (session?.support) { const { exitSupportAction } = await import("./support"); await exitSupportAction(); }
  await clearSessionCookie();
  redirect("/login");
}

/** Perfis de demonstração do endereço atual (D164): cada marca lista só as próprias contas; sem marca no endereço, todas. */
export async function listDemoUsers() {
  if (!isDemoMode()) return [];
  const db = await getDb();
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, brand: organizations.brand }).from(users).leftJoin(organizations, eq(organizations.id, users.organizationId));
  const h = await headers();
  const preview = !!(await cookies()).get(BRAND_PREVIEW_COOKIE)?.value;
  const hostBrand = preview ? null : brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host"));
  return rows.filter((u) => !accountBrandConflict({ role: u.role, brand: (u.brand ?? "SUPERDROP") as BrandCode }, hostBrand)).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
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
