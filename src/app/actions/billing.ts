"use server";
import { assertStoreAdmin } from "@/lib/domain/access";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { buyAddon, chargeInvoice, chargeInvoiceCard, chargeInvoiceCardDemo, chargeInvoiceDemo, checkPayment, connectNextLevelMp, simulateNextLevelPayment, switchInvoiceMethod } from "@/lib/domain/nextlevel-billing";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  assertStoreAdmin(s.actor);
  return { session: s, db: await getDb() };
}
const refresh = () => { for (const p of ["/master", "/supplier", "/merchant"]) revalidatePath(p, "layout"); };

export async function connectNextLevelMpAction(accessToken: string) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await connectNextLevelMp(db, session.actor, accessToken); refresh(); return r; });
}

/** Gera o Pix da fatura. Sem conta da NextLevel conectada, só a demonstração devolve Pix fictício. */
export async function chargeInvoiceAction(invoiceId: string) {
  return runAction(async () => {
    const { session, db } = await ctx();
    try {
      const url = await getBaseUrl();
      return { demo: false, ...(await chargeInvoice(db, session.actor, invoiceId, { notificationBaseUrl: isPublicHttps(url) ? url : undefined, payerEmail: session.user.email })) };
    } catch (e) {
      if (e instanceof DomainError && e.code === "NL_MP_NOT_CONFIGURED" && isDemoMode()) return { ...(await chargeInvoiceDemo(db, session.actor, invoiceId)), demo: true };
      throw e;
    }
  });
}

export async function checkPaymentAction(paymentId: string) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await checkPayment(db, session.actor, paymentId); if (r.paid) refresh(); return r; });
}

export async function simulatePaymentAction(paymentId: string) {
  return runAction(async () => {
    if (!isDemoMode()) throw new ForbiddenError("Disponível apenas na demonstração.");
    const { session, db } = await ctx();
    await simulateNextLevelPayment(db, session.actor, paymentId);
    refresh();
    return undefined;
  });
}

export async function buyAddonAction(key: string, cycle: "MONTHLY" | "ANNUAL") {
  return runAction(async () => {
    const { session, db } = await ctx();
    // Módulos do NextLevel Business (NB8, D310): passam pelas regras do plano (não comprar o caminho que já vem incluso).
    const r = key.startsWith("MODULO_") ? await (await import("@/lib/business/planos")).contratarModulo(db, session.actor, key, cycle) : await buyAddon(db, session.actor, key, cycle);
    refresh(); return r;
  });
}

/** Troca a fatura do tema entre Pix (com desconto) e cartão (valor cheio, em até 6x). */
export async function switchInvoiceMethodAction(invoiceId: string, method: "PIX" | "CARD") {
  return runAction(async () => { const { session, db } = await ctx(); const r = await switchInvoiceMethod(db, session.actor, invoiceId, method === "CARD" ? "CARD" : "PIX"); refresh(); return r; });
}

/** Cartão em até 6x: devolve o endereço do checkout do Mercado Pago (ou, em demonstração, uma cobrança simulada). */
export async function chargeInvoiceCardAction(invoiceId: string, returnPath?: string) {
  return runAction(async () => {
    const { session, db } = await ctx();
    try {
      const baseUrl = await getBaseUrl();
      const r = await chargeInvoiceCard(db, session.actor, invoiceId, { baseUrl, payerEmail: session.user.email, returnPath });
      return { id: r.id, checkoutUrl: r.checkoutUrl as string | null, demo: false };
    } catch (e) {
      if (e instanceof DomainError && e.code === "NL_MP_NOT_CONFIGURED" && isDemoMode()) { const r = await chargeInvoiceCardDemo(db, session.actor, invoiceId); return { id: r.id, checkoutUrl: null as string | null, demo: true }; }
      throw e;
    }
  });
}
