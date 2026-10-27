"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { definirLancamento, importarRedirecionamentos, removerRedirecionamento, salvarPixel } from "@/lib/domain/migrar";
import { salvarIntegracoes, type EntradaIntegracoes } from "@/lib/domain/integracoes";

async function ator() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}
const atualizar = () => revalidatePath("/merchant/migrar");

export async function importarRedirecionamentosAction(texto: string) {
  return runAction(async () => { const r = await importarRedirecionamentos(await getDb(), await ator(), texto); atualizar(); return r; });
}
export async function removerRedirecionamentoAction(fromPath: string) {
  return runAction(async () => { await removerRedirecionamento(await getDb(), await ator(), fromPath); atualizar(); return undefined; });
}
export async function salvarPixelAction(input: { pixelId: string; token?: string }) {
  return runAction(async () => { await salvarPixel(await getDb(), await ator(), input); atualizar(); return undefined; });
}
export async function definirLancamentoAction(ligado: boolean) {
  return runAction(async () => { await definirLancamento(await getDb(), await ator(), ligado); atualizar(); return undefined; });
}
export async function salvarIntegracoesAction(entrada: EntradaIntegracoes) {
  return runAction(async () => { await salvarIntegracoes(await getDb(), await ator(), entrada); atualizar(); revalidatePath("/merchant/aplicativos"); return undefined; });
}
