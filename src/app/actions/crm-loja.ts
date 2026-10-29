"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { salvarAcompanhamentoLoja } from "@/lib/domain/crm-loja";

/** CRM do lojista (D207): próxima ação, prazo e notas de cada cliente da loja. */
export async function salvarAcompanhamentoLojaAction(chave: string, d: { proximaAcao?: string; prazo?: string | null; notas?: string }) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await salvarAcompanhamentoLoja(await getDb(), s.actor, chave, d);
    revalidatePath("/merchant/crm", "layout");
    return undefined;
  });
}
