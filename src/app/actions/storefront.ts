"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, stores } from "@/db/schema";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { recordError } from "@/lib/domain/error-log";
import { cancelOrderBySystem, createOrder, expireStaleReservations, type CreateOrderInput } from "@/lib/domain/orders";
import { MercadoPagoError } from "@/lib/payments/mercadopago";
import { iniciarPagamentoDaLoja } from "@/lib/payments/checkout-loja";
import { origemDoPedido } from "@/lib/domain/visitas";
import { marcarCarrinhoRecuperado, sairDosLembretes, salvarCarrinho } from "@/lib/domain/carrinho-abandonado";
import { rateLimit } from "@/lib/rate-limit";
import { syncOrderPayment } from "@/lib/payments/service";
import { decryptSecret } from "@/lib/security/crypto";
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

export async function placeStorefrontOrderAction(slug: string, rawInput: Omit<CreateOrderInput, "storeId" | "channel" | "customerPaymentStatus"> & { shippingServiceId?: string; origem?: { source?: string; medium?: string; campaign?: string } }) {
  return runAction(async (): Promise<PlacedOrder> => {
    const db = await getDb();
    await expireStaleReservations(db);
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    if (!store.publishedAt) {
      const s = await getSession();
      if (!s || (s.store?.id !== store.id && s.user.role !== "NEXTLEVEL_MASTER")) throw new DomainError("STORE_UNPUBLISHED", "Esta loja ainda não está publicada.");
    }
    if (store.launchMode) {
      // Loja em lançamento (D187): só o dono (testando) compra; o público ainda vê a lista de espera.
      const s = await getSession();
      if (s?.store?.id !== store.id) throw new DomainError("STORE_LAUNCHING", "A loja ainda não abriu. Deixe o seu e-mail para ser avisado.");
    }
    const { shippingServiceId, origem, ...rest } = rawInput;
    // Origem da venda (D185): aparelho pelo navegador e campanha guardada na chegada; nada pessoal.
    const ua = (await headers()).get("user-agent");
    // O pedido saiu: origem da venda (D185) e o carrinho guardado deste e-mail deixa de receber lembrete (D186).
    const marcarOrigem = async (orderId: string) => {
      await db.update(orders).set(origemDoPedido(ua, origem)).where(eq(orders.id, orderId));
      await marcarCarrinhoRecuperado(db, store.id, rest.customer.email, orderId);
    };
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
      await marcarOrigem(r.orderId);
        const again = await replayed(r); if (again) return again;
        revalidateAll(slug);
        return { orderId: r.orderId, number: r.number, checkoutUrl: null, mode: "DEMO" };
      }
      const r = await createOrder(db, { ...base, customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL", reservationMinutes: RESERVATION_MINUTES_MANUAL });
      await marcarOrigem(r.orderId);
      const again = await replayed(r); if (again) return again;
      revalidateAll(slug);
      return { orderId: r.orderId, number: r.number, checkoutUrl: null, mode: "MANUAL" };
    }

    const r = await createOrder(db, { ...base, customerPaymentStatus: "PENDING" }, { paymentProvider: "MERCADO_PAGO", reservationMinutes: RESERVATION_MINUTES_ONLINE });
    await marcarOrigem(r.orderId);
    const again = await replayed(r); if (again) return again;
    try {
      const checkoutUrl = await iniciarPagamentoDaLoja(db, store, r.orderId, RESERVATION_MINUTES_ONLINE);
      revalidateAll(slug);
      return { orderId: r.orderId, number: r.number, checkoutUrl, mode: "MERCADO_PAGO" };
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


/**
 * Cupom de boas-vindas (pública): o código vem do tema publicado da loja, nunca do navegador, e só é revelado com
 * e-mail e consentimento. Limite por IP para frear coleta automática.
 */
export async function claimWelcomeCouponAction(slug: string, input: { email: string; consent: boolean }) {
  return runAction(async () => {
    const { headers } = await import("next/headers");
    const { rateLimit } = await import("@/lib/rate-limit");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`welcome:${ip}`, 8, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    const { resolveTemplate } = await import("@/lib/themes/store");
    const { template } = await resolveTemplate(db, store, "home");
    const section = Object.values(template.sections).find((s) => s.type === "welcome-coupon" && !s.hidden);
    const code = typeof section?.settings.code === "string" ? section.settings.code : "";
    if (!code) throw new DomainError("DISCOUNT_INVALID", "Este cupom não está mais disponível.");
    const { claimWelcomeCoupon } = await import("@/lib/domain/welcome-coupon");
    return claimWelcomeCoupon(db, store.id, code, input as { email: string; consent: true });
  });
}

// ---------------------------------------------------------------------------
// Carrinho abandonado (W3, D186)
// ---------------------------------------------------------------------------
/** O cliente marcou "pode me lembrar" no checkout: guarda o carrinho (sem preço). Nunca falha para o cliente. */
export async function salvarCarrinhoAction(slug: string, input: { email: string; name?: string; consent: boolean; items: { productId: string; variantId?: string; packId?: string; quantity: number }[] }) {
  try {
    if (!rateLimit(`carrinho:${(await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0"}`, 30, 60 * 60_000)) return { salvo: false };
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug), columns: { id: true, publishedAt: true } });
    if (!store?.publishedAt) return { salvo: false };
    return await salvarCarrinho(db, store.id, input);
  } catch { return { salvo: false }; }
}

export async function sairDosLembretesAction(token: string) {
  try { await sairDosLembretes(await getDb(), token); } catch { /* resposta igual sempre */ }
  return { ok: true };
}

/** Lista de espera da loja em lançamento (D187). */
export async function entrarNaListaDeEsperaAction(slug: string, input: { email: string; consent: boolean }) {
  return runAction(async () => {
    if (!rateLimit(`espera:${(await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0"}`, 10, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo mais tarde.");
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug), columns: { id: true } });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    await (await import("@/lib/domain/migrar")).entrarNaListaDeEspera(db, store.id, input);
    return undefined;
  });
}
