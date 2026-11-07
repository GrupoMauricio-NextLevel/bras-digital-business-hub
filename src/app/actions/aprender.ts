"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { responderAula, type respostaSchema } from "@/lib/domain/aprender";

/** Aprender (BC2, D267): manda as respostas de uma aula; a correção é no servidor. */
export async function responderAulaAction(input: z.input<typeof respostaSchema>) {
  return runAction(async () => {
    const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada.");
    const r = await responderAula(await getDb(), s.actor, input);
    revalidatePath("/master/aprender");
    return r;
  });
}
