"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { saveProposal, type proposalSchema } from "@/lib/domain/precos/proposta";

/** Proposta de preço em rascunho (D125). */
export async function saveProposalAction(input: z.input<typeof proposalSchema>) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    const r = await saveProposal(await getDb(), s.actor, input);
    revalidatePath("/master/financeiro/proposta");
    return r;
  });
}
