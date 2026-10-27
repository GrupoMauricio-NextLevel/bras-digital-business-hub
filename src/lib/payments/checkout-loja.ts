import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orderItems, orders, type stores } from "@/db/schema";
import { createPreference } from "@/lib/payments/mercadopago";
import { decryptSecret } from "@/lib/security/crypto";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";
import { parcelasDaLoja } from "@/lib/pagamento-loja";
import { brandCodeOfStore } from "@/lib/store-brand";

/**
 * Cobrança do pedido no Mercado Pago da loja (Checkout Pro). Usada pelo checkout da loja e pelo link de pagamento
 * (proposta aceita, D184): o valor vem do pedido gravado no servidor, nunca do navegador. Devolve o endereço de
 * pagamento e grava a referência no pedido. Falha do provedor sobe como `MercadoPagoError`.
 */
export async function iniciarPagamentoDaLoja(db: Database, store: typeof stores.$inferSelect, orderId: string, validadeMin: number): Promise<string> {
  const token = decryptSecret(store.mpAccessTokenEnc);
  if (!token) throw new Error("Loja sem Mercado Pago conectado.");
  const placed = (await db.query.orders.findFirst({ where: eq(orders.id, orderId) }))!;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const url = await getBaseUrl();
  const https = isPublicHttps(url);
  const back = `${url}/store/${store.slug}/order/${orderId}`;
  const pref = await createPreference(token, {
    orderId, orderNumber: placed.number, storeName: store.name,
    // Com cupom, um único item com o valor líquido: o Mercado Pago cobra exatamente subtotal − desconto + frete.
    items: placed.discountCents > 0
      ? [{ id: placed.id, title: `Pedido #${placed.number} (cupom ${placed.discountCode})`, quantity: 1, unitPriceCents: placed.subtotalCents - placed.discountCents }]
      : items.map((i) => ({ id: i.id, title: `${i.productName} · ${i.label.split(" (")[0]}`, quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
    shippingCents: placed.shippingCents,
    payer: { name: placed.customerName, email: placed.customerEmail },
    notificationUrl: https ? `${url}/api/webhooks/mercadopago?store=${store.slug}` : undefined,
    backUrls: https ? { success: back, failure: back, pending: back } : undefined,
    expiresAt: new Date(Date.now() + validadeMin * 60_000),
    maxParcelas: parcelasDaLoja(await brandCodeOfStore(db, store)),
  });
  await db.update(orders).set({ paymentReference: pref.id, paymentCheckoutUrl: pref.checkoutUrl }).where(eq(orders.id, orderId));
  return pref.checkoutUrl;
}
