"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { updateOpportunity, type oppUpdateSchema } from "@/lib/domain/ecossistema/torre";

/** Fila de oportunidades cruzadas (D135). */
export async function updateOpportunityAction(id: string, input: z.input<typeof oppUpdateSchema>) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    const r = await updateOpportunity(await getDb(), s.actor, id, input);
    revalidatePath("/master/ecossistema");
    return r;
  });
}

/** Regras da reputação de parceiros (D134/D139). */
export async function saveReputationRulesAction(input: import("zod").input<typeof import("@/lib/domain/cargas/reputacao").reputationRulesSchema>) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    const { saveReputationRules } = await import("@/lib/domain/cargas/reputacao");
    const r = await saveReputationRules(await getDb(), s.actor, input);
    revalidatePath("/master/financeiro/descoberta");
    return r;
  });
}
