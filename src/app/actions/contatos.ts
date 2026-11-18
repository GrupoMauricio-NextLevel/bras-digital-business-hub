"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { requireModulo } from "@/lib/business/modulos";
import { atualizarContato, registrarContatoManual, type atualizacaoSchema, type manualSchema } from "@/lib/business/contatos";

/** Contatos e orçamentos (NextLevel Business, NB3, D309): dono e equipe do negócio; módulo conferido no servidor. */
async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  const storeId = requireStoreId(session.actor);
  const db = await getDb();
  await requireModulo(db, session.actor, "contatos");
  return { session, storeId, db };
}
const idContato = z.string().regex(/^ctn_[a-z0-9]+$/i);

export async function atualizarContatoAction(id: string, input: z.input<typeof atualizacaoSchema>) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); await atualizarContato(db, session.actor, storeId, idContato.parse(id), input); revalidatePath("/merchant/contatos", "layout"); revalidatePath("/merchant"); return undefined; });
}
export async function registrarContatoManualAction(input: z.input<typeof manualSchema>) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); const r = await registrarContatoManual(db, session.actor, storeId, input); revalidatePath("/merchant/contatos", "layout"); return r; });
}
/** Maurício no contato (D337): resumo, próxima ação e resposta sugerida. Usa a cota de IA do plano; sem ela, regras. */
export async function sugestaoDoContatoAction(id: string) {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    const { sugestaoDoContato } = await import("@/lib/business/assistente-contato");
    return sugestaoDoContato(db, session.actor, storeId, idContato.parse(id), session.store?.name ?? "nossa empresa");
  });
}
