"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { removerChaveIa, salvarAjustesIa, salvarChaveIa, testarConexaoIa } from "@/lib/domain/ia";

async function ator() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}
const atualizar = () => { revalidatePath("/master/ia"); revalidatePath("/merchant", "layout"); };

export async function salvarChaveIaAction(chave: string) {
  return runAction(async () => { await salvarChaveIa(await getDb(), await ator(), chave); atualizar(); return undefined; });
}
export async function removerChaveIaAction() {
  return runAction(async () => { await removerChaveIa(await getDb(), await ator()); atualizar(); return undefined; });
}
export async function testarConexaoIaAction() {
  return runAction(async () => { const r = await testarConexaoIa(await getDb(), await ator()); atualizar(); return r; });
}
export async function salvarAjustesIaAction(entrada: Parameters<typeof salvarAjustesIa>[2]) {
  return runAction(async () => { await salvarAjustesIa(await getDb(), await ator(), entrada); atualizar(); return undefined; });
}
