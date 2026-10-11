"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { cancelTicket, closeTicket, openTicket, saveMeuContadorSettings, takeTicket, ticketMessage, type meuContadorSettingsSchema, type ticketSchema } from "@/lib/domain/fiscal/meu-contador";

/** Ações do Meu Contador (D117). */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/meu-bras/meu-contador"); revalidatePath("/meu-bras/fretes"); revalidatePath("/bras/meu-contador"); };

export async function openTicketAction(input: z.input<typeof ticketSchema>) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`ticket:${actor.userId}`, 10, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos chamados seguidos. Fale com a equipe.");
    const r = await openTicket(db, actor, input); refresh(); return r;
  });
}
export async function ticketMessageAction(id: string, body: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await ticketMessage(db, actor, id, body); refresh(); return r; });
}
export async function takeTicketAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await takeTicket(db, actor, id); refresh(); return r; });
}
export async function closeTicketAction(id: string, input: { resolved: true; invoiceKey: string; note?: string } | { resolved: false; note: string }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await closeTicket(db, actor, id, input); refresh(); return r; });
}
export async function cancelTicketAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await cancelTicket(db, actor, id); refresh(); return r; });
}
export async function saveMeuContadorSettingsAction(input: z.input<typeof meuContadorSettingsSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveMeuContadorSettings(db, actor, input); refresh(); return r; });
}
