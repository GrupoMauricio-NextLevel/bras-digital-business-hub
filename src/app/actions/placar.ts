"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { salvarSumula } from "@/lib/domain/placar";

/** Súmula do placar (D230): o dono atualiza os dados dos concorrentes; o placar do site se recalcula. */
export async function salvarSumulaAction(sumula: unknown) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    const r = await salvarSumula(await getDb(), s.actor, sumula);
    revalidatePath("/", "layout");
    return { sairamDoAr: r.sairamDoAr.map((j) => `${j.rival} (${j.plano}): ${j.nextlevel} × ${j.adversario}`) };
  });
}
