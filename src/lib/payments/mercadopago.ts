/**
 * Adaptador do Mercado Pago (Checkout Pro). Cada loja usa o próprio access token,
 * pois o cliente paga direto para o lojista (sem split no MVP).
 * `fetchImpl` é injetável para testes.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Sobrescrevível (MERCADOPAGO_API_URL) para apontar a um servidor simulado em testes ponta a ponta. */
const API = process.env.MERCADOPAGO_API_URL ?? "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "MercadoPagoError";
  }
}

async function call<T>(fetchImpl: FetchLike, token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchImpl(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* corpo não JSON */ }
  if (!res.ok) {
    const msg = (body as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
    throw new MercadoPagoError(res.status === 401 ? "Access token do Mercado Pago inválido ou expirado." : `Mercado Pago: ${msg}`, res.status);
  }
  return body as T;
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
  };
  if (input.notificationUrl) body.notification_url = input.notificationUrl;
  if (input.backUrls) { body.back_urls = input.backUrls; body.auto_return = "approved"; }
  if (input.expiresAt) { body.expires = true; body.expiration_date_to = input.expiresAt.toISOString(); }
  const pref = await call<{ id: string; init_point: string }>(fetchImpl, token, "/checkout/preferences", { method: "POST", body: JSON.stringify(body) });
  return { id: pref.id, checkoutUrl: pref.init_point };
}

export type MpPayment = { id: string; status: string; statusDetail: string | null; externalReference: string | null; amountCents: number };

export async function getPayment(token: string, paymentId: string, fetchImpl: FetchLike = fetch): Promise<MpPayment> {
  if (!/^\d+$/.test(paymentId)) throw new MercadoPagoError("Identificador de pagamento inválido.");
  const p = await call<{ id: number; status: string; status_detail?: string; external_reference?: string; transaction_amount: number }>(fetchImpl, token, `/v1/payments/${paymentId}`);
  return { id: String(p.id), status: p.status, statusDetail: p.status_detail ?? null, externalReference: p.external_reference ?? null, amountCents: Math.round(p.transaction_amount * 100) };
}

/** Busca pagamentos de um pedido pela referência externa e devolve o id do primeiro aprovado (fallback quando o id não é conhecido). */
export async function findApprovedPaymentId(token: string, externalReference: string, fetchImpl: FetchLike = fetch): Promise<string | null> {
  const r = await call<{ results?: { id: number; status: string }[] }>(fetchImpl, token, `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(externalReference)}`);
  const hit = r.results?.find((p) => p.status === "approved");
  return hit ? String(hit.id) : null;
}
