"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { callCarrier } from "@/lib/domain/cargas/cargas";
import { answerPreferred, askPreferred, loadMessage, markPreferred, rateLoad, setFixedPickup, type fixedPickupSchema, type ratingSchema } from "@/lib/domain/cargas/vias";

/** Ações das duas vias entre importadoras e transportadoras (D118). */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/transportadora/importadoras"); revalidatePath("/transportadora"); revalidatePath("/importadora/transportadoras"); };

export async function askPreferredAction(importerId: string, message?: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`pref:${actor.userId}`, 30, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos pedidos seguidos. Tente de novo mais tarde.");
    const r = await askPreferred(db, actor, importerId, message); refresh(); return r;
  });
}
export async function answerPreferredAction(id: string, accept: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await answerPreferred(db, actor, id, accept); refresh(); return r; });
}
export async function markPreferredAction(carrierId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await markPreferred(db, actor, carrierId); refresh(); return r; });
}
export async function setFixedPickupAction(id: string, input: z.input<typeof fixedPickupSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await setFixedPickup(db, actor, id, input); refresh(); return r; });
}
export async function rateLoadAction(loadId: string, input: z.input<typeof ratingSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await rateLoad(db, actor, loadId, input); refresh(); return r; });
}
export async function loadMessageAction(loadId: string, text: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`loadmsg:${actor.userId}`, 60, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas mensagens seguidas. Tente de novo mais tarde.");
    const r = await loadMessage(db, actor, loadId, text); refresh(); revalidatePath("/transportadora/cargas"); return r;
  });
}
export async function callFixedPickupAction(input: { carrierId: string; requestIds: string[]; pickupDate: string; period: "MANHA" | "TARDE" }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await callCarrier(db, actor, { ...input, notes: "Coleta fixa combinada" }); refresh(); return r; });
}
