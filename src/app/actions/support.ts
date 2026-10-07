"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, homeFor, setSessionCookie, SUPPORT_COOKIE } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { checkSupport, endSupport, enableSupportActing, startSupport, SUPPORT_TOKEN_PURPOSE, SUPPORT_TTL_MS, type SupportGrant } from "@/lib/domain/support";
import { signToken, verifyToken } from "@/lib/security/crypto";

const cookieOpts = (maxAgeMs: number) => ({ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: Math.max(1, Math.floor(maxAgeMs / 1000)) });

async function writeGrant(grant: SupportGrant) {
  (await cookies()).set(SUPPORT_COOKIE, signToken(SUPPORT_TOKEN_PURPOSE, grant), cookieOpts(grant.exp - Date.now()));
}

/** Master entra no painel de um cliente (somente leitura), com motivo registrado. */
export async function enterSupportAction(input: { targetUserId: string; reason: string; back?: string }) {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new ForbiddenError("Sessão expirada.");
    if (session.support) throw new DomainError("SUPPORT_NESTED", "Saia do modo suporte atual antes de entrar em outro cliente.");
    const db = await getDb();
    const { grant, target } = await startSupport(db, session.actor, input);
    await writeGrant(grant);
    await setSessionCookie(target.id, { ttlMs: SUPPORT_TTL_MS, sup: session.user.id });
    return { redirectTo: homeFor(target.role) };
  });
}

async function activeSupport() {
  const session = await getSession();
  if (!session?.support) return null;
  const grant = verifyToken<SupportGrant>(SUPPORT_TOKEN_PURPOSE, (await cookies()).get(SUPPORT_COOKIE)?.value);
  const db = await getDb();
  const active = await checkSupport(db, grant, session.user.id);
  return active ? { db, active } : null;
}

/** Libera ações em nome do cliente (segundo passo explícito, registrado). Não passa pelo bloqueio de somente leitura. */
export async function enableSupportActingAfterConfirm() {
  const s = await activeSupport();
  if (!s) redirect("/login");
  const grant = await enableSupportActing(s.db, s.active);
  await writeGrant(grant);
  redirect(homeFor(s.active.target.role));
}

/** Sai do modo suporte e volta à conta Master, no ponto de onde saiu. */
export async function exitSupportAction() {
  const s = await activeSupport();
  const jar = await cookies();
  jar.delete(SUPPORT_COOKIE);
  if (!s) { jar.delete("nl_session"); redirect("/login"); }
  await endSupport(s.db, s.active);
  await setSessionCookie(s.active.operator.id);
  redirect(s.active.grant.back);
}


/** Atalho do console Commerce e da central de clientes: entra como o dono da loja. */
export async function enterStoreOwnerSupportAction(input: { storeId: string; reason: string; back?: string }) {
  const db = await getDb();
  const owner = await db.query.users.findFirst({ where: and(eq(users.storeId, input.storeId), eq(users.role, "STORE_OWNER"), eq(users.storeRole, "OWNER")) });
  if (!owner) return { ok: false as const, error: "Esta loja não tem um proprietário ativo para o modo suporte.", code: "OWNER_UNAVAILABLE" };
  return enterSupportAction({ targetUserId: owner.id, reason: input.reason, back: input.back });
}
