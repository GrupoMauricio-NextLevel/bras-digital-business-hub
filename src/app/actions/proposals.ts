"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { acceptProposal, cancelProposal, createProposal, reabrirPropostaAposFalha } from "@/lib/domain/proposals";
import { eq } from "drizzle-orm";
import { orders, proposals, stores } from "@/db/schema";
import { decryptSecret } from "@/lib/security/crypto";
import { iniciarPagamentoDaLoja } from "@/lib/payments/checkout-loja";
import { MercadoPagoError } from "@/lib/payments/mercadopago";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { storeId: requireStoreId(session.actor), db: await getDb() };
}

type CreateInput = Parameters<typeof createProposal>[2];

export async function createProposalAction(input: CreateInput) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    const r = await createProposal(db, storeId, input);
    revalidatePath("/merchant/orders/propostas");
    return { token: r.token, expiresAt: r.expiresAt };
  });
}

export async function cancelProposalAction(id: string) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    await cancelProposal(db, storeId, id);
    revalidatePath("/merchant/orders/propostas");
    return undefined;
  });
}

/** Pública: quem tem o link aceita. O código do link é a credencial; o servidor reprecifica tudo. */
/**
 * Cliente aceita a proposta. Loja com Mercado Pago conectado (D184, link de pagamento): o pedido nasce para pagar no
 * Mercado Pago e o cliente segue direto para a cobrança; sem Mercado Pago, vira pedido para combinar o pagamento.
 */
export async function acceptProposalAction(token: string) {
  return runAction(async (): Promise<{ orderId: string; number: number; checkoutUrl: string | null }> => {
    const db = await getDb();
    const p = await db.query.proposals.findFirst({ where: eq(proposals.token, token) });
    const store = p ? await db.query.stores.findFirst({ where: eq(stores.id, p.storeId) }) : null;
    const comMp = !!store && !!decryptSecret(store.mpAccessTokenEnc);
    const r = await acceptProposal(db, token, new Date(), { pagamento: comMp ? "MERCADO_PAGO" : "MANUAL" });
    const pedido = await db.query.orders.findFirst({ where: eq(orders.id, r.orderId) });
    if (!comMp || !store || pedido?.paymentProvider !== "MERCADO_PAGO" || pedido.customerPaymentStatus === "PAID") return { ...r, checkoutUrl: null };
    if (!r.created && pedido.paymentCheckoutUrl) return { ...r, checkoutUrl: pedido.paymentCheckoutUrl };
    try {
      return { ...r, checkoutUrl: await iniciarPagamentoDaLoja(db, store, r.orderId, 60 * 24) };
    } catch (e) {
      await reabrirPropostaAposFalha(db, token, r.orderId);
      if (e instanceof MercadoPagoError) throw new DomainError("PAYMENT_PROVIDER", "Não foi possível abrir o pagamento agora. Tente de novo em instantes.");
      throw e;
    }
  });
}
