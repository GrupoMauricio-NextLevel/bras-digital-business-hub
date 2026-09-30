import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { passwordResets, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { emails, sendEmail } from "@/lib/email";
import { DomainError } from "./errors";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const HOUR = 3_600_000;

/**
 * Pede a redefinição: gera um token de uso único (1 hora) e manda o link por e-mail.
 * Resposta igual exista o e-mail ou não (não revela quem tem conta). Devolve o link só para a demonstração.
 */
export async function requestPasswordReset(db: Database, rawEmail: string, baseUrl: string, now = new Date()): Promise<{ link: string | null }> {
  const email = rawEmail.trim().toLowerCase();
  const user = email ? await db.query.users.findFirst({ where: eq(users.email, email) }) : undefined;
  if (!user) return { link: null };
  const token = randomBytes(32).toString("base64url");
  await db.update(passwordResets).set({ usedAt: now.toISOString() }).where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));
  await db.insert(passwordResets).values({ id: newId("prs"), userId: user.id, tokenHash: hash(token), expiresAt: new Date(now.getTime() + HOUR).toISOString() });
  const link = `${baseUrl}/redefinir-senha/${token}`;
  const m = emails.passwordReset(link);
  await sendEmail(db, { kind: "PASSWORD_RESET", to: user.email, ...m });
  return { link };
}

export async function checkResetToken(db: Database, token: string, now = new Date()): Promise<boolean> {
  const r = await db.query.passwordResets.findFirst({ where: and(eq(passwordResets.tokenHash, hash(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, now.toISOString())) });
  return !!r;
}

export async function resetPassword(db: Database, token: string, newPassword: string, now = new Date()) {
  if (newPassword.length < 8) throw new DomainError("PASSWORD", "A nova senha precisa ter ao menos 8 caracteres.");
  const r = await db.query.passwordResets.findFirst({ where: and(eq(passwordResets.tokenHash, hash(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, now.toISOString())) });
  if (!r) throw new DomainError("RESET_INVALID", "Este link expirou ou já foi usado. Peça um novo.");
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: hashPassword(newPassword), mustChangePassword: false }).where(eq(users.id, r.userId));
    await tx.update(passwordResets).set({ usedAt: now.toISOString() }).where(eq(passwordResets.userId, r.userId));
  });
  return { userId: r.userId };
}
