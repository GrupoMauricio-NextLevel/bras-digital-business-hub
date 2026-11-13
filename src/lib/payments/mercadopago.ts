/**
 * Adaptador do Mercado Pago (Checkout Pro). Cada loja usa o próprio access token,
 * pois o cliente paga direto para o lojista (sem split no MVP).
 * `fetchImpl` é injetável para testes.
 */
import { isRetryableStatus, isTimeoutError, retryDelayMs, sleep, timeoutSignal } from "@/lib/http-timeout";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Sobrescrevível (MERCADOPAGO_API_URL) para apontar a um servidor simulado em testes ponta a ponta. */
const API = process.env.MERCADOPAGO_API_URL ?? "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "MercadoPagoError";
  }
}

/**
 * Chamada ao Mercado Pago. Leituras (GET) tentam até 3 vezes em falha temporária (sem resposta, 429, 5xx);
 * cobranças e criações (POST) nunca são repetidas aqui, para não cobrar duas vezes.
 */
async function call<T>(fetchImpl: FetchLike, token: string, path: string, init: RequestInit = {}): Promise<T> {
  const isRead = !init.method || init.method.toUpperCase() === "GET";
  const attempts = isRead ? 3 : 1;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let res: Response;
    try {
      res = await fetchImpl(`${API}${path}`, { ...init, signal: init.signal ?? timeoutSignal(), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    } catch (e) {
      lastError = isTimeoutError(e) ? new MercadoPagoError("O Mercado Pago demorou demais para responder. Tente de novo em instantes.", 504) : e;
      if (attempt < attempts) { await sleep(retryDelayMs(attempt)); continue; }
      throw lastError;
    }
    if (isRead && attempt < attempts && isRetryableStatus(res.status)) { await sleep(retryDelayMs(attempt)); continue; }
    const text = await res.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* corpo não JSON */ }
    if (!res.ok) {
      const msg = (body as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
      throw new MercadoPagoError(res.status === 401 ? "Access token do Mercado Pago inválido ou expirado." : `Mercado Pago: ${msg}`, res.status);
    }
    return body as T;
  }
  throw lastError;
}

export type MpAccount = { id: number; nickname: string; siteId: string; isTest: boolean };

/** Valida o token consultando a conta. */
export async function verifyAccessToken(token: string, fetchImpl: FetchLike = fetch): Promise<MpAccount> {
  const me = await call<{ id: number; nickname?: string; site_id?: string }>(fetchImpl, token, "/users/me");
  return { id: me.id, nickname: me.nickname ?? String(me.id), siteId: me.site_id ?? "MLB", isTest: token.startsWith("TEST-") };
}

export type PreferenceInput = {
  orderId: string;
  orderNumber: number;
  storeName: string;
  items: { id: string; title: string; quantity: number; unitPriceCents: number }[];
  shippingCents: number;
  payer: { name: string; email: string };
  /** URLs absolutas https (Mercado Pago recusa http/localhost em notification_url e auto_return). */
  notificationUrl?: string;
  backUrls?: { success: string; failure: string; pending: string };
  expiresAt?: Date;
  /** Com valor, libera cartão de crédito em até N parcelas além do Pix (Commerce, D178); sem valor, só Pix. */
  maxParcelas?: number;
};

export type Preference = { id: string; checkoutUrl: string };

export async function createPreference(token: string, input: PreferenceInput, fetchImpl: FetchLike = fetch): Promise<Preference> {
  const items = input.items.map((i) => ({ id: i.id, title: i.title.slice(0, 250), quantity: i.quantity, unit_price: i.unitPriceCents / 100, currency_id: "BRL" }));
  if (input.shippingCents > 0) items.push({ id: "frete", title: "Frete", quantity: 1, unit_price: input.shippingCents / 100, currency_id: "BRL" });
  const [firstName, ...rest] = input.payer.name.trim().split(/\s+/);
  const body: Record<string, unknown> = {
    items,
    payer: { name: firstName, surname: rest.join(" ") || undefined, email: input.payer.email },
    external_reference: input.orderId,
    statement_descriptor: input.storeName.replace(/[^\w ]/g, "").slice(0, 22) || "LOJA",
    metadata: { order_id: input.orderId, order_number: input.orderNumber },
    /** Sem `maxParcelas`, somente Pix: exclui cartão, boleto, caixa eletrônico e saldo em conta. Com ele, Pix e cartão de crédito parcelado. */
    payment_methods: input.maxParcelas
      ? { installments: input.maxParcelas, excluded_payment_types: ["debit_card", "ticket", "atm", "prepaid_card", "account_money"].map((id) => ({ id })) }
      : { excluded_payment_types: ["credit_card", "debit_card", "ticket", "atm", "prepaid_card", "account_money"].map((id) => ({ id })) },
  };
  if (input.notificationUrl) body.notification_url = input.notificationUrl;
  if (input.backUrls) { body.back_urls = input.backUrls; body.auto_return = "approved"; }
  if (input.expiresAt) { body.expires = true; body.expiration_date_to = input.expiresAt.toISOString(); }
  const pref = await call<{ id: string; init_point: string }>(fetchImpl, token, "/checkout/preferences", { method: "POST", body: JSON.stringify(body) });
  return { id: pref.id, checkoutUrl: pref.init_point };
}

export type MpPayment = { id: string; status: string; statusDetail: string | null; externalReference: string | null; amountCents: number; feeCents?: number; netCents?: number | null; installments?: number; refundedCents?: number; method?: string | null };

export async function getPayment(token: string, paymentId: string, fetchImpl: FetchLike = fetch): Promise<MpPayment> {
  if (!/^\d+$/.test(paymentId)) throw new MercadoPagoError("Identificador de pagamento inválido.");
  const p = await call<{ id: number; status: string; status_detail?: string; external_reference?: string; transaction_amount: number; fee_details?: { amount: number }[]; transaction_details?: { net_received_amount?: number }; installments?: number; transaction_amount_refunded?: number; payment_type_id?: string }>(fetchImpl, token, `/v1/payments/${paymentId}`);
  const fee = (p.fee_details ?? []).reduce((s, f) => s + Math.round((f.amount ?? 0) * 100), 0);
  return { id: String(p.id), status: p.status, statusDetail: p.status_detail ?? null, externalReference: p.external_reference ?? null, amountCents: Math.round(p.transaction_amount * 100), feeCents: fee, netCents: p.transaction_details?.net_received_amount !== undefined ? Math.round(p.transaction_details.net_received_amount * 100) : null, installments: p.installments ?? 1, refundedCents: Math.round((p.transaction_amount_refunded ?? 0) * 100), method: p.payment_type_id ?? null };
}

/** Reembolso total (sem valor) ou parcial. Idempotente pela chave informada. */
export async function refundPayment(token: string, paymentId: string, input: { amountCents?: number; idempotencyKey: string }, fetchImpl: FetchLike = fetch): Promise<{ id: string; amountCents: number }> {
  if (!/^\d+$/.test(paymentId)) throw new MercadoPagoError("Identificador de pagamento inválido.");
  const r = await call<{ id: number; amount: number }>(fetchImpl, token, `/v1/payments/${paymentId}/refunds`, { method: "POST", body: JSON.stringify(input.amountCents ? { amount: input.amountCents / 100 } : {}), headers: { "X-Idempotency-Key": input.idempotencyKey } });
  return { id: String(r.id), amountCents: Math.round((r.amount ?? 0) * 100) };
}

/** Busca pagamentos de um pedido pela referência externa e devolve o id do primeiro aprovado (fallback quando o id não é conhecido). */
export async function findApprovedPaymentId(token: string, externalReference: string, fetchImpl: FetchLike = fetch): Promise<string | null> {
  const r = await call<{ results?: { id: number; status: string }[] }>(fetchImpl, token, `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(externalReference)}`);
  const hit = r.results?.find((p) => p.status === "approved");
  return hit ? String(hit.id) : null;
}

export type PixPayment = { paymentId: string; qrCode: string; qrCodeBase64: string };

/** Cria uma cobrança Pix (recarga de saldo) na conta Mercado Pago do fornecedor. */
export async function createPixPayment(token: string, input: { amountCents: number; description: string; payerEmail: string; externalReference: string; notificationUrl?: string; expiresAt?: Date }, fetchImpl: FetchLike = fetch): Promise<PixPayment> {
  const body: Record<string, unknown> = {
    transaction_amount: input.amountCents / 100,
    description: input.description.slice(0, 200),
    payment_method_id: "pix",
    payer: { email: input.payerEmail },
    external_reference: input.externalReference,
  };
  if (input.notificationUrl) body.notification_url = input.notificationUrl;
  if (input.expiresAt) body.date_of_expiration = input.expiresAt.toISOString();
  const r = await call<{ id: number; point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } } }>(fetchImpl, token, "/v1/payments", { method: "POST", body: JSON.stringify(body), headers: { "X-Idempotency-Key": input.externalReference } });
  const td = r.point_of_interaction?.transaction_data;
  if (!td?.qr_code) throw new MercadoPagoError("Mercado Pago não devolveu o código Pix.");
  return { paymentId: String(r.id), qrCode: td.qr_code, qrCodeBase64: td.qr_code_base64 ?? "" };
}

export type InvoicePreferenceInput = { externalReference: string; title: string; amountCents: number; payerEmail: string; notificationUrl?: string; backUrls?: { success: string; failure: string; pending: string }; maxInstallments: number; idempotencyKey?: string };

/** Checkout Pro só com cartão de crédito, em até N parcelas, para faturas da NextLevel (o valor cheio da lista). */
export async function createInvoicePreference(token: string, input: InvoicePreferenceInput, fetchImpl: FetchLike = fetch): Promise<Preference> {
  const body: Record<string, unknown> = {
    items: [{ id: input.externalReference, title: input.title.slice(0, 250), quantity: 1, unit_price: input.amountCents / 100, currency_id: "BRL" }],
    payer: { email: input.payerEmail },
    external_reference: input.externalReference,
    statement_descriptor: "NEXTLEVEL",
    payment_methods: { installments: input.maxInstallments, excluded_payment_types: ["debit_card", "ticket", "atm", "bank_transfer", "prepaid_card", "account_money"].map((id) => ({ id })) },
  };
  if (input.notificationUrl) body.notification_url = input.notificationUrl;
  if (input.backUrls) { body.back_urls = input.backUrls; body.auto_return = "approved"; }
  const pref = await call<{ id: string; init_point: string }>(fetchImpl, token, "/checkout/preferences", { method: "POST", body: JSON.stringify(body), headers: input.idempotencyKey ? { "X-Idempotency-Key": input.idempotencyKey } : {} });
  return { id: pref.id, checkoutUrl: pref.init_point };
}
