"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { checkMyFreightPayment, connectCarrierMp, createFreightPix, disconnectCarrierMp, registerParcelPayment, trustClientOfParcel } from "@/lib/domain/cargas/frete-pix";

/** Ações do frete por Pix do ônibus (D119). */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/transportadora"); revalidatePath("/transportadora/perfil"); revalidatePath("/meu-bras/fretes"); };

export async function connectCarrierMpAction(accessToken: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`mpconn:${actor.userId}`, 10, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo mais tarde.");
    const r = await connectCarrierMp(db, actor, null, { accessToken }); refresh(); return r;
  });
}
export async function disconnectCarrierMpAction() {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await disconnectCarrierMp(db, actor, null); refresh(); return r; });
}
export async function createFreightPixAction(tripId: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`fpix:${actor.userId}`, 20, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas cobranças seguidas. Tente de novo mais tarde.");
    const url = await getBaseUrl();
    return createFreightPix(db, actor, tripId, { notificationBaseUrl: isPublicHttps(url) ? url : undefined });
  });
}
export async function checkFreightPixAction(paymentId: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`fpixchk:${actor.userId}`, 60, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Aguarde um pouco e confira de novo.");
    const r = await checkMyFreightPayment(db, actor, paymentId); if (r.paid) refresh(); return r;
  });
}
export async function trustClientAction(parcelId: string, trusted: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await trustClientOfParcel(db, actor, parcelId, trusted); refresh(); return r; });
}
export async function registerParcelPaymentAction(parcelId: string, what: "RECEBIDO" | "DEVOLVIDO") {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await registerParcelPayment(db, actor, parcelId, what); refresh(); return r; });
}
