"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { dismissReferral, referCarrier, type carrierReferralSchema } from "@/lib/domain/club/indicacoes";

/** Ações do painel de frete e das indicações (D113). */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}

export async function referCarrierAction(input: z.input<typeof carrierReferralSchema>) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`refer:${actor.userId}`, 20, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas indicações seguidas. Tente de novo mais tarde.");
    const r = await referCarrier(db, actor, input);
    revalidatePath("/meu-bras/fretes"); revalidatePath("/bras/transportadoras");
    return r;
  });
}

export async function dismissReferralAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await dismissReferral(db, actor, id); revalidatePath("/bras/transportadoras"); return r; });
}
