"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { assertStoreAdmin, requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { removerGrade, salvarGrade, salvarPrecoAtacado, salvarRegrasDeMix } from "@/lib/domain/atacado";

/** Atacado do lojista (AT1, D258). Só o dono da loja; regras e travas no domínio. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  assertStoreAdmin(s.actor);
  return { s, db: await getDb(), storeId: requireStoreId(s.actor) };
}
const refresh = (slug?: string | null) => { revalidatePath("/merchant/atacado"); if (slug) revalidatePath(`/store/${slug}`, "layout"); };

export async function salvarPrecoAtacadoAction(productId: string, cents: number | null) {
  return runAction(async () => { const { s, db, storeId } = await ctx(); await salvarPrecoAtacado(db, storeId, productId, cents); refresh(s.store?.slug); return undefined; });
}
export async function salvarRegrasDeMixAction(regras: unknown) {
  return runAction(async () => { const { s, db, storeId } = await ctx(); await salvarRegrasDeMix(db, storeId, regras); refresh(s.store?.slug); return undefined; });
}
export async function salvarGradeAction(productId: string, grade: unknown) {
  return runAction(async () => { const { s, db, storeId } = await ctx(); const id = await salvarGrade(db, storeId, productId, grade); refresh(s.store?.slug); return id; });
}
export async function removerGradeAction(productId: string, packId: string) {
  return runAction(async () => { const { s, db, storeId } = await ctx(); await removerGrade(db, storeId, productId, packId); refresh(s.store?.slug); return undefined; });
}
