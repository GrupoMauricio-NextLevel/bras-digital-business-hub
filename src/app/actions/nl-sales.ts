"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { getNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { addNlNote, advanceNlOrder, createNlOrder, getNlOrderByToken, simulateNlPayment, syncNlOrder, updateDigitalProduct, type buySchema } from "@/lib/domain/nl-sales";
import type { NlOrderStatus } from "@/db/schema";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";

async function master() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, db: await getDb() };
}
const refreshCrm = () => { revalidatePath("/master", "layout"); };

/** Compra em 1 clique, sem login. Sem conta de recebimento conectada, só a demonstração devolve cobrança fictícia. */
export async function buyDigitalAction(input: z.input<typeof buySchema>) {
  return runAction(async () => {
    const db = await getDb();
    const base = await getBaseUrl();
    const demo = isDemoMode() && !(await getNextLevelMp(db)).connected;
    const r = await createNlOrder(db, input, { demo, baseUrl: base, publicHttps: isPublicHttps(base) });
    revalidatePath("/master", "layout");
    return r;
  });
}

/** Estado do pedido para a tela de acompanhamento (confere no Mercado Pago se ainda espera pagamento). */
export async function pollNlOrderAction(token: string) {
  return runAction(async () => {
    const db = await getDb();
    const found = await getNlOrderByToken(db, token);
    if (!found) throw new DomainError("NOT_FOUND", "Pedido não encontrado.");
    if (found.order.status === "AWAITING_PAYMENT") await syncNlOrder(db, found.order.id);
    const again = await getNlOrderByToken(db, token);
    return { status: again!.order.status };
  });
}

export async function simulateNlPaymentAction(token: string) {
  return runAction(async () => {
    if (!isDemoMode()) throw new ForbiddenError("Disponível apenas na demonstração.");
    await simulateNlPayment(await getDb(), token);
    refreshCrm();
    return undefined;
  });
}

export async function advanceNlOrderAction(id: string, next: NlOrderStatus) {
  return runAction(async () => { const { session, db } = await master(); await advanceNlOrder(db, session.actor, id, next); refreshCrm(); return undefined; });
}

export async function addNlNoteAction(id: string, body: string) {
  return runAction(async () => { const { session, db } = await master(); await addNlNote(db, session.actor, id, body); refreshCrm(); return undefined; });
}

export async function updateDigitalProductAction(id: string, patch: { priceCents?: number; active?: boolean; featured?: boolean }) {
  return runAction(async () => { const { session, db } = await master(); await updateDigitalProduct(db, session.actor, id, patch); refreshCrm(); revalidatePath("/loja-nextlevel"); return undefined; });
}
