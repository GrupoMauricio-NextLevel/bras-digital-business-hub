"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { cancelVoucher, redeemVoucher, reviewPoints, applyVoucher } from "@/lib/domain/club/pontos";
import { activateReferralManually } from "@/lib/domain/club/indicacoes";
import { saveClubRules, type clubRulesSchema } from "@/lib/domain/club/regras";
import { setRankingOptIn, type rankingOptInSchema } from "@/lib/domain/club/ranking";

/** Ações do Brás Digital Club (D115): vales, revisão e regras. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/meu-bras/club"); revalidatePath("/transportadora/indicacoes"); revalidatePath("/importadora/indicacoes"); revalidatePath("/bras/club"); };

export async function redeemVoucherAction(points: number) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`voucher:${actor.userId}`, 10, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos vales seguidos. Tente de novo mais tarde.");
    const r = await redeemVoucher(db, actor, points); refresh(); return r;
  });
}
export async function cancelVoucherAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await cancelVoucher(db, actor, id); refresh(); return r; });
}
export async function applyVoucherAction(code: string, company: string, note?: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await applyVoucher(db, actor, code, company, note); refresh(); return r; });
}
export async function reviewPointsAction(ledgerId: string, approve: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await reviewPoints(db, actor, ledgerId, approve); refresh(); return r; });
}
export async function activateReferralAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await activateReferralManually(db, actor, id); refresh(); revalidatePath("/bras/transportadoras"); return r; });
}
export async function saveClubRulesAction(patch: Partial<z.input<typeof clubRulesSchema>>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveClubRules(db, actor, patch); refresh(); return { version: r.version }; });
}

export async function setRankingOptInAction(input: { show: boolean; city: string; uf: string }) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    const r = await setRankingOptIn(db, actor, input as z.input<typeof rankingOptInSchema>);
    refresh();
    return r;
  });
}
