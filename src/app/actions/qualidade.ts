"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { checkDomains, checkPages, markScreen, resetScreens, type markSchema } from "@/lib/domain/qualidade";

/** Central de qualidade (D142): só o dono. */
async function ctx() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return { actor: s.actor, db: await getDb() }; }

export async function markScreenAction(route: string, patch: z.input<typeof markSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); return markScreen(db, actor, route, patch); });
}
export async function resetScreensAction(routes: string[]) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await resetScreens(db, actor, routes.slice(0, 500)); revalidatePath("/master/qualidade"); return r; });
}
export async function checkDomainsAction() {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await checkDomains(db, actor); revalidatePath("/master/qualidade"); return r; });
}
export async function checkPagesAction() {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await checkPages(db, actor); revalidatePath("/master/qualidade"); return { ok: r.ok, failed: r.failed }; });
}
