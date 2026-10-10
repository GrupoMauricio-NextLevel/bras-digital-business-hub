"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import {
  callCarrier, cancelLoad, carrierFromLead, carrierMarkDelivered, createCarrier, createCarrierAccess, createDriverLink, driverMarkDelivered,
  respondLoad, revokeDriverLink, updateCarrierProfile, saveCarrierDocument, reviewCarrierDocument, deleteCarrierDocument, type CarrierInput, type callSchema, type carrierDocSchema,
} from "@/lib/domain/cargas/cargas";
import { saveExcursionRules, type excursionRulesSchema } from "@/lib/domain/cargas/regras-excursao";
import { saveGroupCompanies, type groupCompanySchema } from "@/lib/domain/grupo";

/**
 * Ações da NextLevel Cargas (D111): importadora chama a transportadora, a transportadora aceita ou recusa, o motorista
 * marca a entrega pelo link. `carrierId` vazio = a transportadora do usuário logado; preenchido = só o Master.
 */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/importadora", "layout"); revalidatePath("/transportadora", "layout"); revalidatePath("/bras/transportadoras"); revalidatePath("/bras/excursao"); revalidatePath("/bras/grupo"); };

export async function createCarrierAction(input: CarrierInput) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createCarrier(db, actor, input); refresh(); return r; });
}
export async function callCarrierAction(input: z.input<typeof callSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await callCarrier(db, actor, input); refresh(); return r; });
}
export async function cancelLoadAction(loadId: string, reason?: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await cancelLoad(db, actor, loadId, reason); refresh(); return r; });
}
export async function respondLoadAction(loadId: string, input: { accept: true; freightCents: number } | { accept: false; reason: string }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await respondLoad(db, actor, loadId, input); refresh(); return r; });
}
export async function carrierDeliveredAction(loadId: string, note?: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await carrierMarkDelivered(db, actor, loadId, note); refresh(); return r; });
}
export async function updateCarrierProfileAction(carrierId: string | null, input: Parameters<typeof updateCarrierProfile>[3]) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await updateCarrierProfile(db, actor, carrierId, input); refresh(); return r; });
}
export async function createDriverLinkAction(carrierId: string | null) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createDriverLink(db, actor, carrierId); refresh(); return r; });
}
export async function revokeDriverLinkAction(carrierId: string | null) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await revokeDriverLink(db, actor, carrierId); refresh(); return r; });
}
export async function createCarrierAccessAction(carrierId: string, input: { name: string; email: string; password: string }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createCarrierAccess(db, actor, carrierId, input); refresh(); return r; });
}
export async function carrierFromLeadAction(leadId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await carrierFromLead(db, actor, leadId); refresh(); return r; });
}

/** Motorista (sem login): limite por link para não virar porta de tentativa. */
export async function driverDeliveredAction(token: string, loadId: string, note?: string) {
  return runAction(async () => {
    if (!rateLimit(`driver:${token.slice(0, 12)}`, 20, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.");
    const r = await driverMarkDelivered(await getDb(), token, loadId, note);
    revalidatePath(`/motorista/${token}`); refresh();
    return r;
  });
}

export async function saveCarrierDocumentAction(carrierId: string | null, input: z.input<typeof carrierDocSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveCarrierDocument(db, actor, carrierId, input); refresh(); return r; });
}
export async function reviewCarrierDocumentAction(docId: string, decision: "VERIFICADA" | "RECUSADA") {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await reviewCarrierDocument(db, actor, docId, decision); refresh(); return r; });
}
export async function deleteCarrierDocumentAction(docId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await deleteCarrierDocument(db, actor, docId); refresh(); return r; });
}
export async function saveExcursionRulesAction(patch: Partial<z.input<typeof excursionRulesSchema>>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveExcursionRules(db, actor, patch); refresh(); return { version: r.version }; });
}
export async function saveGroupCompaniesAction(list: z.input<typeof groupCompanySchema>[]) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveGroupCompanies(db, actor, list); refresh(); return { count: r.length }; });
}
