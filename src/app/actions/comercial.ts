"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { salvarAcompanhamento } from "@/lib/domain/comercial";
import { salvarConfigComercial } from "@/lib/domain/comercial-config";

/** Comercial (D202): responsável, próxima ação, prazo e notas de cada pessoa do funil. */
export async function salvarAcompanhamentoAction(chave: string, d: { proximaAcao?: string; prazo?: string | null; notas?: string; assumir?: boolean; perdido?: boolean }) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await salvarAcompanhamento(await getDb(), s.actor, chave, s.user.name, d);
    revalidatePath("/master/comercial", "layout");
    return undefined;
  });
}

/** Ajustes do Comercial (D205): meta, tempos de espera e mensagens prontas. */
export async function salvarConfigComercialAction(entrada: unknown) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await salvarConfigComercial(await getDb(), s.actor, entrada);
    revalidatePath("/master", "layout");
    return undefined;
  });
}
