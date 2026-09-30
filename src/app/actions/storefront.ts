"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orderItems, orders, stores } from "@/db/schema";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { cancelOrderBySystem, createOrder, expireStaleReservations, type CreateOrderInput } from "@/lib/domain/orders";
import { createPreference, MercadoPagoError } from "@/lib/payments/mercadopago";
import { syncOrderPayment } from "@/lib/payments/service";
import { decryptSecret } from "@/lib/security/crypto";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";

const RESERVATION_MINUTES_ONLINE = 30;
const RESERVATION_MINUTES_MANUAL = 60 * 48;

export type PlacedOrder = { orderId: string; number: number; checkoutUrl: string | null; mode: "MERCADO_PAGO" | "DEMO" | "MANUAL" };

/**
 * Checkout da loja:
 *  - loja com Mercado Pago conectado → pedido PENDING + reserva com validade + preferência do Checkout Pro
 *  - sem Mercado Pago em demo mode  → pagamento simulado como aprovado
 *  - sem Mercado Pago em produção   → pedido PENDING para o lojista combinar o pagamento (reserva de 48h)
 */
export async function placeStorefrontOrderAction(slug: string, input: Omit<CreateOrderInput, "storeId" | "channel" | "customerPaymentStatus">) {
  return runAction(async (): Promise<PlacedOrder> => {
    const db = await getDb();
    await expireStaleReservations(db);
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    if (!store.publishedAt) {
      const s = await getSession();
      if (!s || (s.store?.id !== store.id && s.user.role !== "NEXTLEVEL_MASTER")) throw new DomainError("STORE_UNPUBLISHED", "Esta loja ainda não está publicada.");
    }
    const token = decryptSecret(store.mpAccessTokenEnc);
    const base = { ...input, storeId: store.id, channel: "ONLINE_STORE" as const };

    if (!token) {
      if (isDemoMode()) {
        const r = await createOrder(db, { ...base, customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
        revalidateAll(slug);
        return { orderId: r.orderId, number: r.number, checkoutUrl: null, mode: "DEMO" };
      }
      const r = await createOrder(db, { ...base, customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL", reservationMinutes: RESERVATION_MINUTES_MANUAL });
      revalidateAll(slug);
      return { orderId: r.orderId, number: r.number, checkoutUrl: null, mode: "MANUAL" };
    }

    const r = await createOrder(db, { ...base, customerPaymentStatus: "PENDING" }, { paymentProvider: "MERCADO_PAGO", reservationMinutes: RESERVATION_MINUTES_ONLINE });
    try {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, r.orderId));
      const url = await getBaseUrl();
      const https = isPublicHttps(url);
      const back = `${url}/store/${slug}/order/${r.orderId}`;
      const pref = await createPreference(token, {
        orderId: r.orderId, orderNumber: r.number, storeName: store.name,
        items: items.map((i) => ({ id: i.id, title: `${i.productName} · ${i.label.split(" (")[0]}`, quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
        shippingCents: input.shipping?.costCents ?? 0,
        payer: { name: input.customer.name, email: input.customer.email },
        notificationUrl: https ? `${url}/api/webhooks/mercadopago?store=${slug}` : undefined,
        backUrls: https ? { success: back, failure: back, pending: back } : undefined,
        expiresAt: new Date(Date.now() + RESERVATION_MINUTES_ONLINE * 60_000),
      });
      await db.update(orders).set({ paymentReference: pref.id, paymentCheckoutUrl: pref.checkoutUrl }).where(eq(orders.id, r.orderId));
      revalidateAll(slug);
      return { orderId: r.orderId, number: r.number, checkoutUrl: pref.checkoutUrl, mode: "MERCADO_PAGO" };
    } catch (e) {
      await cancelOrderBySystem(db, r.orderId, "falha ao iniciar o pagamento");
      if (e instanceof MercadoPagoError) throw new DomainError("PAYMENT_PROVIDER", "Não foi possível iniciar o pagamento. Tente novamente em instantes.");
      throw e;
    }
  });
}

/** Chamada pela página de confirmação enquanto o pagamento está pendente. */
export async function refreshOrderPaymentAction(slug: string, orderId: string) {
  return runAction(async () => {
    const db = await getDb();
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!order || !store || order.storeId !== store.id) throw new NotFoundError("Pedido não encontrado.");
    const r = await syncOrderPayment(db, orderId);
    if (r.paid) revalidateAll(slug);
    return r;
  });
}

function revalidateAll(slug: string) {
  revalidatePath("/merchant", "layout");
  revalidatePath("/supplier", "layout");
  revalidatePath("/master", "layout");
  revalidatePath(`/store/${slug}`, "layout");
}

