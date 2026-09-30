"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { createOwnStore, ownStoreUserFor, supplierAdminForOwnStore } from "@/lib/domain/own-store";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, db: await getDb() };
}

export async function createOwnStoreAction() {
  return runAction(async () => {
    const { session, db } = await ctx();
    const r = await createOwnStore(db, session.actor);
    revalidatePath("/supplier", "layout");
    return r;
  });
}

/** Gestor entra no painel da loja própria (troca de contexto, sem senha extra). */
export async function enterOwnStoreAction() {
  const { session, db } = await ctx();
  const u = await ownStoreUserFor(db, session.actor);
  await setSessionCookie(u.id);
  redirect("/merchant");
}

/** Volta ao painel do fornecedor a partir da loja própria. */
export async function leaveOwnStoreAction() {
  const { session, db } = await ctx();
  const admin = await supplierAdminForOwnStore(db, session.user.id);
  await setSessionCookie(admin.id);
  redirect("/supplier");
}
