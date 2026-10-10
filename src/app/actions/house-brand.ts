"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { createHouseBrandAdmin, ensureHouseBrand, type houseBrandAdminSchema } from "@/lib/domain/house-brand";
import type { z } from "zod";

async function masterSession() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  requireMaster(s.actor);
  return s;
}

/** Cria (ou completa) a Mega Tron no banco. O bootstrap já faz isso a cada deploy; aqui é o atalho manual. */
export async function ensureHouseBrandAction() {
  return runAction(async () => {
    await masterSession();
    const r = await ensureHouseBrand(await getDb());
    revalidatePath("/master", "layout");
    return r;
  });
}

export async function createHouseBrandAdminAction(input: z.input<typeof houseBrandAdminSchema>) {
  return runAction(async () => {
    await masterSession();
    const r = await createHouseBrandAdmin(await getDb(), input);
    revalidatePath("/master/megatron");
    return r;
  });
}
