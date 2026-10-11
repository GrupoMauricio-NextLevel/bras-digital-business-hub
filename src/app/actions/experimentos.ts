"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { createExperiment, setExperimentStatus, type experimentSchema } from "@/lib/domain/experimentos";

/** Experimentos (D136). */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }
const refresh = () => revalidatePath("/master/financeiro/experimentos");
export async function createExperimentAction(input: z.input<typeof experimentSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createExperiment(db, actor, input); refresh(); return r; });
}
export async function startExperimentAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await setExperimentStatus(db, actor, id, { start: true }); refresh(); return r; });
}
export async function endExperimentAction(id: string, reading: string, decision: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await setExperimentStatus(db, actor, id, { end: true, reading, decision }); refresh(); return r; });
}
