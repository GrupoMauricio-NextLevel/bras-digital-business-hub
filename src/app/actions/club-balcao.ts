"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { counterLookup, createCounter, markSettled, registerPurchase, renewClubCard, revokeCounter } from "@/lib/domain/club/balcao";

/** Ações do cartão do Club e do balcão das empresas do grupo (D120). O balcão não tem login: limite por link. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const counterGate = (token: string, max: number) => {
  if (!brasPanelsEnabled()) throw new DomainError("PANELS_OFF", "Balcão indisponível.");
  if (!rateLimit(`clubbalcao:${token.slice(0, 16)}`, max, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
};

export async function counterLookupAction(token: string, card: string) {
  return runAction(async () => { counterGate(token, 60); return counterLookup(await getDb(), token, card); });
}
export async function registerPurchaseAction(token: string, input: { card: string; valueCents: number; receipt?: string; voucherCode?: string; guideCard?: string }) {
  return runAction(async () => { counterGate(token, 40); const r = await registerPurchase(await getDb(), token, input); revalidatePath("/bras/club"); return r; });
}
export async function renewClubCardAction() {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await renewClubCard(db, actor); revalidatePath("/meu-bras/club"); return r; });
}
export async function createCounterAction(input: { company: string; name: string }) {
  return runAction(async () => {
    if (!brasPanelsEnabled()) throw new DomainError("PANELS_OFF", "O balcão do Club está desligado (BRAS_PANELS).");
    const { actor, db } = await ctx(); const r = await createCounter(db, actor, input); revalidatePath("/bras/club"); return r;
  });
}
export async function revokeCounterAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await revokeCounter(db, actor, id); revalidatePath("/bras/club"); return r; });
}
export async function markSettledAction(month: string, debtor: string, creditor: string, note?: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await markSettled(db, actor, month, debtor, creditor, note); revalidatePath("/bras/club"); return r; });
}
