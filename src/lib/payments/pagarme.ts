/**
 * Cliente da API v5 do Pagar.me (https://docs.pagar.me/reference). Gateway ALTERNATIVO da NextLevel (D90).
 * Credenciais só por variável de ambiente (PAGARME_SECRET_KEY); nunca no banco, em log ou na tela.
 * POST nunca é repetido aqui (evita cobrança duplicada); usa o cabeçalho Idempotency-Key.
 */
import { isRetryableStatus, isTimeoutError, retryDelayMs, sleep, timeoutSignal } from "@/lib/http-timeout";
import type { FetchLike } from "./mercadopago";

const API = () => process.env.PAGARME_API_URL ?? "https://api.pagar.me/core/v5";

export class PagarmeError extends Error {
  constructor(message: string, readonly status?: number) { super(message); this.name = "PagarmeError"; }
}

export function pagarmeSecret(env: Record<string, string | undefined> = process.env): string | null {
  const k = env.PAGARME_SECRET_KEY?.trim();
  return k && /^sk_(test_)?[A-Za-z0-9]+$/.test(k) ? k : null;
}

async function call<T>(fetchImpl: FetchLike, secret: string, path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const isRead = !init.method || init.method.toUpperCase() === "GET";
  const attempts = isRead ? 3 : 1;
  const auth = `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let res: Response;
    try {
      const headers: Record<string, string> = { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" };
      if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
      res = await fetchImpl(`${API()}${path}`, { method: init.method, body: init.body, signal: init.signal ?? timeoutSignal(), headers });
    } catch (e) {
      lastError = isTimeoutError(e) ? new PagarmeError("O Pagar.me demorou demais para responder. Tente de novo em instantes.", 504) : e;
      if (attempt < attempts) { await sleep(retryDelayMs(attempt)); continue; }
      throw lastError;
    }
    if (isRead && attempt < attempts && isRetryableStatus(res.status)) { await sleep(retryDelayMs(attempt)); continue; }
    const text = await res.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* não JSON */ }
    if (!res.ok) {
      const msg = (body as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
      throw new PagarmeError(res.status === 401 ? "Chave do Pagar.me inválida." : `Pagar.me: ${msg}`, res.status);
    }
    return body as T;
  }
  throw lastError;
}

export type PagarmeCustomer = { name: string; email: string; document?: string | null; phone?: string | null };
type PgCharge = { id: string; status: string; amount: number; paid_amount?: number; payment_method?: string; last_transaction?: { qr_code?: string; qr_code_url?: string; installments?: number; status?: string; gateway_response?: unknown } };
type PgOrder = { id: string; code?: string; status: string; amount: number; closed?: boolean; charges?: PgCharge[]; checkouts?: { id: string; payment_url?: string; status?: string }[] };

const customerBody = (c: PagarmeCustomer) => {
  const doc = c.document?.replace(/\D/g, "") ?? "";
  const phone = c.phone?.replace(/\D/g, "") ?? "";
  return {
    name: c.name.slice(0, 64), email: c.email,
    ...(doc ? { document: doc, document_type: doc.length === 14 ? "CNPJ" : "CPF", type: doc.length === 14 ? "company" : "individual" } : { type: "individual" }),
    ...(phone.length >= 10 ? { phones: { mobile_phone: { country_code: "55", area_code: phone.slice(-11, -9) || phone.slice(0, 2), number: phone.slice(-9) } } } : {}),
  };
};

/** Pedido com Pix (QR copia e cola). */
export async function createPixOrder(secret: string, input: { code: string; amountCents: number; description: string; customer: PagarmeCustomer; expiresInSeconds: number; idempotencyKey: string }, fetchImpl: FetchLike = fetch) {
  const o = await call<PgOrder>(fetchImpl, secret, "/orders", { method: "POST", idempotencyKey: input.idempotencyKey, body: JSON.stringify({
    code: input.code, closed: true, customer: customerBody(input.customer),
    items: [{ code: input.code, description: input.description.slice(0, 250), amount: input.amountCents, quantity: 1 }],
    payments: [{ payment_method: "pix", pix: { expires_in: input.expiresInSeconds } }],
  }) });
  const charge = o.charges?.[0];
  const qr = charge?.last_transaction?.qr_code;
  if (!qr) throw new PagarmeError("Pagar.me não devolveu o código Pix.");
  return { orderId: o.id, chargeId: charge!.id, qrCode: qr, qrCodeUrl: charge?.last_transaction?.qr_code_url ?? null, status: o.status };
}

/**
 * Checkout hospedado do Pagar.me só com cartão: o cartão é digitado na página deles (nunca guardamos PAN/CVV).
 * As parcelas mostram o mesmo total (o acréscimo já está no valor) para 1x..N.
 */
export async function createCardCheckout(secret: string, input: { code: string; amountCents: number; description: string; customer: PagarmeCustomer; maxInstallments: number; successUrl: string; idempotencyKey: string }, fetchImpl: FetchLike = fetch) {
  const installments = Array.from({ length: Math.max(1, input.maxInstallments) }, (_, i) => ({ number: i + 1, total: input.amountCents }));
  const o = await call<PgOrder>(fetchImpl, secret, "/orders", { method: "POST", idempotencyKey: input.idempotencyKey, body: JSON.stringify({
    code: input.code, closed: true, customer: customerBody(input.customer),
    items: [{ code: input.code, description: input.description.slice(0, 250), amount: input.amountCents, quantity: 1 }],
    payments: [{ payment_method: "checkout", checkout: { expires_in: 86_400, accepted_payment_methods: ["credit_card"], success_url: input.successUrl, skip_checkout_success_page: false, customer_editable: true, credit_card: { installments } } }],
  }) });
  const url = o.checkouts?.[0]?.payment_url;
  if (!url) throw new PagarmeError("Pagar.me não devolveu o link do checkout.");
  return { orderId: o.id, checkoutUrl: url, status: o.status };
}

export type PagarmeOrderState = { orderId: string; code: string | null; status: string; amountCents: number; paidCents: number; chargeId: string | null; chargeStatus: string | null; installments: number };

export async function getOrder(secret: string, orderId: string, fetchImpl: FetchLike = fetch): Promise<PagarmeOrderState> {
  if (!/^or_[A-Za-z0-9]+$/.test(orderId)) throw new PagarmeError("Identificador de pedido inválido.");
  const o = await call<PgOrder>(fetchImpl, secret, `/orders/${orderId}`);
  const c = o.charges?.[0];
  return { orderId: o.id, code: o.code ?? null, status: o.status, amountCents: o.amount, paidCents: (o.charges ?? []).reduce((s, ch) => s + (ch.paid_amount ?? (ch.status === "paid" ? ch.amount : 0)), 0), chargeId: c?.id ?? null, chargeStatus: c?.status ?? null, installments: c?.last_transaction?.installments ?? 1 };
}

/** Cancela/estorna a cobrança (total ou parcial). */
export async function refundCharge(secret: string, chargeId: string, input: { amountCents?: number; idempotencyKey: string }, fetchImpl: FetchLike = fetch) {
  if (!/^ch_[A-Za-z0-9]+$/.test(chargeId)) throw new PagarmeError("Identificador de cobrança inválido.");
  const c = await call<PgCharge>(fetchImpl, secret, `/charges/${chargeId}`, { method: "DELETE", idempotencyKey: input.idempotencyKey, body: JSON.stringify(input.amountCents ? { amount: input.amountCents } : {}) });
  return { status: c.status };
}

/**
 * Autenticação do webhook: o Pagar.me envia Basic Auth configurado no cadastro do webhook (PAGARME_WEBHOOK_USER/PASSWORD).
 * Mesmo autenticado, o estado é sempre reconsultado na API antes de valer.
 */
export function verifyWebhookAuth(header: string | null, env: Record<string, string | undefined> = process.env): boolean {
  const user = env.PAGARME_WEBHOOK_USER; const pass = env.PAGARME_WEBHOOK_PASSWORD;
  if (!user || !pass || !header?.startsWith("Basic ")) return false;
  const expected = Buffer.from(`${user}:${pass}`);
  const got = Buffer.from(Buffer.from(header.slice(6), "base64").toString("utf8"));
  if (got.length !== expected.length) return false;
  // Comparação em tempo constante.
  let diff = 0; for (let i = 0; i < got.length; i++) diff |= got[i]! ^ expected[i]!;
  return diff === 0;
}
