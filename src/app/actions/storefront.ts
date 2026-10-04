"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orderItems, orders, stores } from "@/db/schema";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { recordError } from "@/lib/domain/error-log";
import { cancelOrderBySystem, createOrder, expireStaleReservations, type CreateOrderInput } from "@/lib/domain/orders";
import { createPreference, MercadoPagoError } from "@/lib/payments/mercadopago";
import { syncOrderPayment } from "@/lib/payments/service";
import { decryptSecret } from "@/lib/security/crypto";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";
import { quoteShipping, resolveShipping, type QuoteItem } from "@/lib/shipping/quote";

const RESERVATION_MINUTES_ONLINE = 30;
const RESERVATION_MINUTES_MANUAL = 60 * 48;

export type PlacedOrder = { orderId: string; number: number; checkoutUrl: string | null; mode: "MERCADO_PAGO" | "DEMO" | "MANUAL" };

/**
 * Checkout da loja:
 *  - loja com Mercado Pago conectado → pedido PENDING + reserva com validade + preferência do Checkout Pro
 *  - sem Mercado Pago em demo mode  → pagamento simulado como aprovado
 *  - sem Mercado Pago em produção   → pedido PENDING para o lojista combinar o pagamento (reserva de 48h)
 */
/** Cotação de frete por CEP para o carrinho (o valor é sempre calculado aqui, no servidor). */
export async function quoteShippingAction(slug: string, input: { zip: string; items: QuoteItem[] }) {
  return runAction(async () => {
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    const q = await quoteShipping(db, { storeId: store.id, toZip: input.zip, items: input.items });
    return { options: q.options, degraded: q.degraded, freeApplied: q.freeApplied };
  });
}

export async function placeStorefrontOrderAction(slug: string, rawInput: Omit<CreateOrderInput, "storeId" | "channel" | "customerPaymentStatus"> & { shippingServiceId?: string }) {
  return runAction(async (): Promise<PlacedOrder> => {
    const db = await getDb();
    await expireStaleReservations(db);
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    if (!store.publishedAt) {
      const s = await getSession();
      if (!s || (s.store?.id !== store.id && s.user.role !== "NEXTLEVEL_MASTER")) throw new DomainError("STORE_UNPUBLISHED", "Esta loja ainda não está publicada.");
    }
    const { shippingServiceId, ...rest } = rawInput;
    if (!shippingServiceId) throw new DomainError("SHIPPING_REQUIRED", "Escolha a forma de entrega.");
    // O frete vem de uma cotação nova feita aqui; o valor enviado pelo navegador é descartado.
    const pick = await resolveShipping(db, { storeId: store.id, toZip: rest.shipping?.zip ?? "", serviceId: shippingServiceId, items: rest.items.map((i) => ({ productId: i.productId, variantId: i.variantId, packId: i.packId, quantity: i.quantity })) });
    const input = { ...rest, shipping: { ...rest.shipping, costCents: pick.priceCents, serviceName: pick.name, days: pick.days } };
    const token = decryptSecret(store.mpAccessTokenEnc);
    const base = { ...input, storeId: store.id, channel: "ONLINE_STORE" as const };
    // Mesma tentativa reenviada (duplo clique, volta e reenvia): devolve o pedido que já existe, sem novo pedido nem nova cobrança.
    const replayed = async (r: { orderId: string; number: number; replayed?: boolean }): Promise<PlacedOrder | null> => {
      if (!r.replayed) return null;
      const o = await db.query.orders.findFirst({ where: eq(orders.id, r.orderId) });
      return { orderId: r.orderId, number: r.number, checkoutUrl: o?.paymentCheckoutUrl ?? null, mode: (o?.paymentProvider ?? "MANUAL") as PlacedOrder["mode"] };
    };

    if (!token) {
      if (isDemoMode()) {
        const r = await createOrder(db, { ...base, customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
        const again = await replayed(r); if (again) return again;
        revalidateAll(slug);
        return { orderId: r.orderId, number: r.number, checkoutUrl: null, mode: "DEMO" };
      }
      const r = await createOrder(db, { ...base, customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL", reservationMinutes: RESERVATION_MINUTES_MANUAL });
      const again = await replayed(r); if (again) return again;
      revalidateAll(slug);
      return { orderId: r.orderId, number: r.number, checkoutUrl: null, mode: "MANUAL" };
    }

    const r = await createOrder(db, { ...base, customerPaymentStatus: "PENDING" }, { paymentProvider: "MERCADO_PAGO", reservationMinutes: RESERVATION_MINUTES_ONLINE });
    const again = await replayed(r); if (again) return again;
    try {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, r.orderId));
      const placed = (await db.query.orders.findFirst({ where: eq(orders.id, r.orderId) }))!;
      const url = await getBaseUrl();
      const https = isPublicHttps(url);
      const back = `${url}/store/${slug}/order/${r.orderId}`;
      const pref = await createPreference(token, {
        orderId: r.orderId, orderNumber: r.number, storeName: store.name,
        // Com cupom, um único item com o valor líquido: o Mercado Pago cobra exatamente subtotal − desconto + frete.
        items: placed.discountCents > 0
          ? [{ id: placed.id, title: `Pedido #${r.number} (cupom ${placed.discountCode})`, quantity: 1, unitPriceCents: placed.subtotalCents - placed.discountCents }]
          : items.map((i) => ({ id: i.id, title: `${i.productName} · ${i.label.split(" (")[0]}`, quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
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
      if (e instanceof MercadoPagoError) {
        // O cliente vê uma mensagem simples; o Master vê o que o provedor respondeu, para qual loja e com que código.
        const ref = Math.random().toString(36).slice(2, 8).toUpperCase();
        await recordError(db, { origin: "SERVER", route: `/store/${slug}/checkout`, message: `Mercado Pago (HTTP ${e.status ?? "?"}): ${e.message}`, context: "mercadopago", storeSlug: slug, ref });
        throw new DomainError("PAYMENT_PROVIDER", `Não foi possível iniciar o pagamento. Tente novamente em instantes (código ${ref}).`);
      }
      throw e;
    }
  });
}

/** Prévia do desconto no carrinho (o valor final é recalculado ao criar o pedido). */
export async function previewDiscountAction(slug: string, code: string, items: QuoteItem[]) {
  return runAction(async () => {
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    const { priceLines } = await import("@/lib/domain/proposals");
    const lines = await priceLines(db, store.id, items);
    const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
    const { priceDiscount } = await import("@/lib/domain/discounts");
    const d = await priceDiscount(db, store.id, code, subtotal, null);
    return { code: d.code, cents: d.cents };
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

