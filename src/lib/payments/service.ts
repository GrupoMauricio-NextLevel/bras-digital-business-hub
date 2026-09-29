import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, stores } from "@/db/schema";
import { markCustomerPaidBySystem } from "@/lib/domain/orders";
import { decryptSecret } from "@/lib/security/crypto";
import { findApprovedPaymentId, getPayment, MercadoPagoError, type FetchLike } from "./mercadopago";

export type SyncOutcome = "PAID" | "PENDING" | "IGNORED";

/**
 * Consulta o pagamento direto na API do Mercado Pago (com o token da loja) e aplica no pedido.
 * O corpo do webhook nunca é confiável: só o resultado da API vale.
 */
export async function syncMercadoPagoPayment(db: Database, params: { storeSlug: string; paymentId: string }, fetchImpl: FetchLike = fetch): Promise<{ outcome: SyncOutcome; orderId?: string }> {
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, params.storeSlug) });
  const token = decryptSecret(store?.mpAccessTokenEnc);
  if (!store || !token) return { outcome: "IGNORED" };
  const payment = await getPayment(token, params.paymentId, fetchImpl);
  if (!payment.externalReference) return { outcome: "IGNORED" };
  const order = await db.query.orders.findFirst({ where: eq(orders.id, payment.externalReference) });
  // Isolamento: o pedido precisa pertencer à loja cujo token consultou o pagamento.
  if (!order || order.storeId !== store.id) return { outcome: "IGNORED" };
  if (payment.status === "approved") {
    await markCustomerPaidBySystem(db, order.id, { provider: "MERCADO_PAGO", reference: payment.id, amountCents: payment.amountCents });
    return { outcome: "PAID", orderId: order.id };
  }
  return { outcome: "PENDING", orderId: order.id };
}

export { MercadoPagoError };

/** Sincroniza um pedido sem conhecer o id do pagamento (polling da página de confirmação). */
export async function syncOrderPayment(db: Database, orderId: string, fetchImpl: FetchLike = fetch): Promise<{ paid: boolean }> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return { paid: false };
  if (order.customerPaymentStatus === "PAID") return { paid: true };
  if (order.paymentProvider !== "MERCADO_PAGO") return { paid: false };
  const store = await db.query.stores.findFirst({ where: eq(stores.id, order.storeId) });
  const token = decryptSecret(store?.mpAccessTokenEnc);
  if (!store || !token) return { paid: false };
  const paymentId = await findApprovedPaymentId(token, order.id, fetchImpl);
  if (!paymentId) return { paid: false };
  const r = await syncMercadoPagoPayment(db, { storeSlug: store.slug, paymentId }, fetchImpl);
  return { paid: r.outcome === "PAID" };
}
