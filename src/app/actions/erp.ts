"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { conectarErp, desconectarErp, tentarDeNovoErp, type EntradaErp } from "@/lib/domain/erp";

async function ator() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}
const atualizar = () => { revalidatePath("/merchant/erp"); revalidatePath("/merchant/aplicativos"); };

export async function conectarErpAction(entrada: EntradaErp) {
  return runAction(async () => { const r = await conectarErp(await getDb(), await ator(), entrada); atualizar(); return r; });
}
export async function desconectarErpAction() {
  return runAction(async () => { await desconectarErp(await getDb(), await ator()); atualizar(); return undefined; });
}
export async function tentarDeNovoErpAction(envioId: string) {
  return runAction(async () => { await tentarDeNovoErp(await getDb(), await ator(), envioId); atualizar(); return undefined; });
}
