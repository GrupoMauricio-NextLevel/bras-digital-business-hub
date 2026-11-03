"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { salvarCampanhaBlack } from "@/lib/domain/campanha-black";

/** Black NextLevel (D229): o Master liga, desliga ou prorroga a campanha. */
export async function salvarCampanhaBlackAction(input: { ativa: boolean; fim: string; chamada: string }) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    const r = await salvarCampanhaBlack(await getDb(), s.actor, input);
    revalidatePath("/", "layout");
    return { fim: r.fim, ativa: r.ativa };
  });
}
