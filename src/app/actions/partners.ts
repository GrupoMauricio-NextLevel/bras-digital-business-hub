"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { adjustCommission, createLink, createPartnerCoupon, decidePayout, ensureReactivationInvoice, reactivateFromBalance, registerPartner, requestPayout, reviewAttribution, savePartnerProfile, savePartnerSettings, setPartnerCouponActive, setPartnerStatus, type partnerSignupSchema } from "@/lib/domain/partners";
import { rateLimit } from "@/lib/rate-limit";
import { emails, sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, db: await getDb() };
}
const refresh = () => { revalidatePath("/partner", "layout"); revalidatePath("/master", "layout"); };

/** Cadastro público do parceiro: cria a conta AFFILIATE, aceita os termos e entra direto no escritório virtual. */
export async function registerPartnerAction(input: z.input<typeof partnerSignupSchema>) {
  const r = await runAction(async () => {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`partner-signup:${ip}`, 8, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const db = await getDb();
    const created = await registerPartner(db, input);
    await setSessionCookie(created.userId);
    const m = emails.welcomePartner(input.name.split(" ")[0]!, `${await getBaseUrl()}/partner`);
    await sendEmail(db, { kind: "WELCOME_PARTNER", to: input.email.toLowerCase(), ...m });
    return { ok: true as const };
  });
  if (r.ok) redirect("/partner");
  return r;
}

export async function createLinkAction(input: Parameters<typeof createLink>[2]) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await createLink(db, session.actor, input); refresh(); return r; });
}
export async function createPartnerCouponAction(input: { code: string; maxRedemptions?: number | null }) {
  return runAction(async () => {
    const { session, db } = await ctx();
    if (!rateLimit(`partner-coupon:${session.user.id}`, 20, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos cupons em pouco tempo.");
    const r = await createPartnerCoupon(db, session.actor, input); refresh(); return r;
  });
}
export async function togglePartnerCouponAction(id: string, active: boolean) {
  return runAction(async () => { const { session, db } = await ctx(); await setPartnerCouponActive(db, session.actor, id, active); refresh(); return undefined; });
}
export async function requestPayoutAction(ownerConfirmed: boolean) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await requestPayout(db, session.actor, { ownerConfirmed }); refresh(); return r; });
}
export async function savePartnerProfileAction(input: { phone?: string; pixKey?: string; displayName?: string }) {
  return runAction(async () => { const { session, db } = await ctx(); await savePartnerProfile(db, session.actor, input); refresh(); return undefined; });
}
export async function reactivationInvoiceAction() {
  return runAction(async () => { const { session, db } = await ctx(); return ensureReactivationInvoice(db, session.actor); });
}
export async function reactivateFromBalanceAction() {
  return runAction(async () => { const { session, db } = await ctx(); await reactivateFromBalance(db, session.actor); refresh(); return undefined; });
}

// Master
export async function decidePayoutAction(id: string, decision: "APPROVE" | "PAY" | "REJECT", note?: string) {
  return runAction(async () => { const { session, db } = await ctx(); await decidePayout(db, session.actor, id, decision, note); refresh(); return undefined; });
}
export async function setPartnerStatusAction(id: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED", reason: string) {
  return runAction(async () => { const { session, db } = await ctx(); await setPartnerStatus(db, session.actor, id, status, reason); refresh(); return undefined; });
}
export async function adjustCommissionAction(id: string, amountCents: number, reason: string) {
  return runAction(async () => { const { session, db } = await ctx(); await adjustCommission(db, session.actor, id, amountCents, reason); refresh(); return undefined; });
}
export async function savePartnerSettingsAction(raw: unknown) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await savePartnerSettings(db, session.actor, raw); refresh(); return r; });
}
export async function reviewAttributionAction(storeId: string, release: boolean) {
  return runAction(async () => { const { session, db } = await ctx(); await reviewAttribution(db, session.actor, storeId, release); refresh(); return undefined; });
}
