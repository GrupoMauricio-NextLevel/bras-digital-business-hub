"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { salvarCampanha, type campanhaSchema } from "@/lib/domain/bonus";
import type { z } from "zod";

/** Bônus gamificado (BG1, D271): só o dono e o Financeiro editam; o teto é conferido no domínio. */
export async function salvarCampanhaAction(id: string, input: z.input<typeof campanhaSchema>) {
  return runAction(async () => {
    const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada.");
    await salvarCampanha(await getDb(), s.actor, id, input);
    revalidatePath("/master/partners/bonus"); revalidatePath("/partner");
    return undefined;
  });
}
