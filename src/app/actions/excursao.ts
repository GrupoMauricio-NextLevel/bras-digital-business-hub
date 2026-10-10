"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import {
  busCollectParcel, busDeliverParcel, cancelMyParcel, markParcelReady, createTrip, helperCollectParcel, helperDeliverParcel, reserveParcels, respondParcel, saveRoute, setParcelInvoice, tripAction,
  type RouteInput, type reserveSchema, type tripSchema,
} from "@/lib/domain/cargas/excursao";

/** Ações da Cargas Excursão (D114). `carrierId` vazio = o ônibus do usuário logado; preenchido = só o Master. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/transportadora", "layout"); revalidatePath("/meu-bras/fretes"); revalidatePath("/bras/excursao"); revalidatePath("/importadora/transportadoras"); };

export async function saveRouteAction(carrierId: string | null, routeId: string | null, input: RouteInput) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveRoute(db, actor, carrierId, routeId, input); refresh(); return r; });
}
export async function createTripAction(carrierId: string | null, input: z.input<typeof tripSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createTrip(db, actor, carrierId, input); refresh(); return r; });
}
export async function tripActionAction(tripId: string, action: "FECHAR" | "REABRIR" | "SAIR" | "CHEGAR" | "ENCERRAR" | "CANCELAR") {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await tripAction(db, actor, tripId, action); refresh(); return r; });
}
export async function respondParcelAction(parcelId: string, input: { accept: true } | { accept: false; reason: string }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await respondParcel(db, actor, parcelId, input); refresh(); return r; });
}
export async function busCollectAction(label: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await busCollectParcel(db, actor, label); refresh(); return r; });
}
export async function busDeliverAction(parcelId: string, code: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`bus-deliver:${actor.userId}`, 30, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas de código. Aguarde alguns minutos.");
    const r = await busDeliverParcel(db, actor, parcelId, code); refresh(); return r;
  });
}
export async function helperCollectAction(token: string, label: string) {
  return runAction(async () => {
    if (!rateLimit(`helper:${token.slice(0, 12)}`, 120, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.");
    const r = await helperCollectParcel(await getDb(), token, label); revalidatePath(`/motorista/${token}`); refresh(); return r;
  });
}
export async function helperDeliverAction(token: string, parcelId: string, code: string) {
  return runAction(async () => {
    if (!rateLimit(`helper-deliver:${token.slice(0, 12)}`, 30, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas de código. Aguarde alguns minutos.");
    const r = await helperDeliverParcel(await getDb(), token, parcelId, code); revalidatePath(`/motorista/${token}`); refresh(); return r;
  });
}
export async function reserveParcelsAction(input: z.input<typeof reserveSchema>) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`reserve:${actor.userId}`, 30, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas reservas seguidas. Tente de novo mais tarde.");
    const r = await reserveParcels(db, actor, input); refresh(); return r;
  });
}
export async function cancelMyParcelAction(parcelId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await cancelMyParcel(db, actor, parcelId); refresh(); return r; });
}
export async function setParcelInvoiceAction(parcelId: string, key: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await setParcelInvoice(db, actor, parcelId, key); refresh(); return r; });
}
export async function markParcelReadyAction(parcelId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await markParcelReady(db, actor, parcelId); refresh(); return r; });
}
