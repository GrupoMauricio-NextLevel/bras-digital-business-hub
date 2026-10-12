"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { createMasterMember, updateMasterMember, type memberSchema } from "@/lib/domain/equipe-master";

/** Equipe do Master (D138). */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }
export async function createMasterMemberAction(input: z.input<typeof memberSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createMasterMember(db, actor, input); revalidatePath("/master/equipe"); return r; });
}
export async function updateMasterMemberAction(userId: string, patch: Parameters<typeof updateMasterMember>[3]) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await updateMasterMember(db, actor, userId, patch); revalidatePath("/master/equipe"); return r; });
}
