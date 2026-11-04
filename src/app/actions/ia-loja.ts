"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { assertStoreAdmin, requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { removerChaveDaLoja, salvarChaveDaLoja } from "@/lib/domain/ia-por-plano";

/** Chave própria da OpenAI do lojista (D243). Só o dono da loja; a chave nunca volta para a tela. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  assertStoreAdmin(s.actor);
  if (s.actor.role !== "STORE_OWNER") throw new ForbiddenError("Só o dono da loja cadastra a chave.");
  return { db: await getDb(), storeId: requireStoreId(s.actor) };
}
export async function salvarChaveIaLojaAction(chave: string) {
  return runAction(async () => { const { db, storeId } = await ctx(); const r = await salvarChaveDaLoja(db, storeId, String(chave)); revalidatePath("/merchant/ia"); return r; });
}
export async function removerChaveIaLojaAction() {
  return runAction(async () => { const { db, storeId } = await ctx(); await removerChaveDaLoja(db, storeId); revalidatePath("/merchant/ia"); return undefined; });
}
