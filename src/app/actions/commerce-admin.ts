"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { organizations, stores, users } from "@/db/schema";
import { getSession, setSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { extendTrial } from "@/lib/domain/store-access";

const MASTER_RETURN_COOKIE = "nl_master_return";

async function master() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  requireMaster(session.actor);
  return session;
}

async function commerceStore(storeId: string) {
  const db = await getDb();
  const row = await db.select({ store: stores, brand: organizations.brand }).from(stores)
    .innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(eq(stores.id, storeId)).limit(1);
  if (!row[0] || row[0].brand !== "NEXTLEVEL_COMMERCE") throw new NotFoundError("Loja Commerce não encontrada.");
  return { db, store: row[0].store };
}

export async function setCommerceStoreStatusAction(storeId: string, status: "ACTIVE" | "SUSPENDED") {
  return runAction(async () => {
    await master();
    const { db } = await commerceStore(storeId);
    await db.update(stores).set({ status, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    revalidatePath("/commerce/stores"); revalidatePath("/commerce");
    return { status };
  });
}

export async function extendCommerceTrialAction(storeId: string, days: number) {
  return runAction(async () => {
    const session = await master();
    const { db } = await commerceStore(storeId);
    const result = await extendTrial(db, session.actor, storeId, days);
    revalidatePath("/commerce/stores"); revalidatePath("/commerce");
    return { trialEndsAt: result.trialEndsAt.toISOString() };
  });
}

/**
 * Suporte assistido: troca a sessão atual pela do dono da loja.
 * É intencionalmente explícito e só aceita lojas Commerce.
 * Para voltar ao Master, o operador encerra a sessão e entra novamente.
 */
export async function enterCommerceStoreAction(storeId: string) {
  const session = await master();
  const { db } = await commerceStore(storeId);
  const owner = await db.query.users.findFirst({ where: and(eq(users.storeId, storeId), eq(users.role, "STORE_OWNER"), eq(users.storeRole, "OWNER")) });
  if (!owner || owner.disabledAt) throw new DomainError("OWNER_UNAVAILABLE", "Esta loja não possui um proprietário ativo para acesso assistido.");
  const jar = await cookies();
  jar.set(MASTER_RETURN_COOKIE, session.user.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 });
  await setSessionCookie(owner.id);
  redirect("/merchant");
}


export async function returnToCommerceMasterAction() {
  const session = await getSession();
  if (!session?.store) redirect("/login");
  const jar = await cookies();
  const masterId = jar.get(MASTER_RETURN_COOKIE)?.value;
  if (!masterId) redirect("/login");
  const db = await getDb();
  const operator = await db.query.users.findFirst({ where: eq(users.id, masterId) });
  if (!operator || operator.role !== "NEXTLEVEL_MASTER" || operator.disabledAt) {
    jar.delete(MASTER_RETURN_COOKIE);
    redirect("/login");
  }
  jar.delete(MASTER_RETURN_COOKIE);
  await setSessionCookie(operator.id);
  redirect("/commerce/stores");
}

export async function hasCommerceMasterReturn(): Promise<boolean> {
  const session = await getSession();
  if (!session?.store) return false;
  return !!(await cookies()).get(MASTER_RETURN_COOKIE)?.value;
}
