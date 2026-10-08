/**
 * Camada única de gateway da NextLevel (D90). Regras de negócio falam só com esta interface; status, payloads e SDKs
 * de cada provedor ficam nos adaptadores. Mercado Pago é o padrão; Pagar.me é alternativo (por produto ou regra do Master).
 * Depois de criada, uma cobrança NUNCA troca de gateway sozinha (evita cobrança duplicada).
 */
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { platformSettings, type GatewayCode, type GatewayTxStatus } from "@/db/schema";
import { createInvoicePreference, createPixPayment, findApprovedPaymentId, getPayment, refundPayment, type FetchLike } from "./mercadopago";
import { createCardCheckout, createPixOrder, getOrder, pagarmeSecret, refundCharge } from "./pagarme";

export type ChargeRequest = {
  /** Id interno da tentativa (vai como referência externa e código). */
  reference: string;
  idempotencyKey: string;
  amountCents: number;
  description: string;
  method: "PIX" | "CARD";
  maxInstallments: number;
  customer: { name: string; email: string; taxId?: string | null; phone?: string | null };
  /** Endereço público https (webhook e retorno). Sem https, o pagamento é confirmado pela consulta da tela. */
  publicBaseUrl?: string;
  returnPath: string;
  expiresAt: Date;
};
export type ChargeResult = { externalId: string | null; pixCode?: string; pixQrBase64?: string; checkoutUrl?: string };
export type ChargeState = { externalId: string; reference: string | null; status: GatewayTxStatus; providerStatus: string; amountCents: number; paidCents: number; feeCents: number | null; netCents: number | null; installments: number; refundedCents: number };
export type TxRef = { id: string; externalId: string | null; method: "PIX" | "CARD" };

export interface PaymentGateway {
  code: GatewayCode;
  label: string;
  isConfigured(db: Database): Promise<boolean>;
  createCharge(db: Database, req: ChargeRequest, fetchImpl?: FetchLike): Promise<ChargeResult>;
  /** Consulta a fonte da verdade (API do provedor). Nulo = ainda não existe pagamento. */
  getState(db: Database, tx: TxRef, fetchImpl?: FetchLike): Promise<ChargeState | null>;
  refund(db: Database, tx: TxRef & { chargeId?: string | null }, input: { amountCents?: number; idempotencyKey: string }, fetchImpl?: FetchLike): Promise<void>;
}

export class GatewayError extends Error { constructor(message: string) { super(message); this.name = "GatewayError"; } }

// ---------------------------------------------------------------------------
// Mercado Pago (conta da NextLevel conectada no Master)
// ---------------------------------------------------------------------------
const MP_STATUS: Record<string, GatewayTxStatus> = { approved: "PAID", authorized: "PENDING", pending: "PENDING", in_process: "PENDING", in_mediation: "PENDING", rejected: "FAILED", cancelled: "CANCELED", refunded: "REFUNDED", charged_back: "CHARGEBACK" };

async function mpToken(db: Database) { const { nlToken } = await import("@/lib/domain/nextlevel-billing"); return nlToken(db); }

export const mercadoPagoGateway: PaymentGateway = {
  code: "MERCADOPAGO", label: "Mercado Pago",
  async isConfigured(db) { const { getNextLevelMp } = await import("@/lib/domain/nextlevel-billing"); return (await getNextLevelMp(db)).connected; },
  async createCharge(db, req, fetchImpl = fetch) {
    const token = await mpToken(db);
    const https = !!req.publicBaseUrl?.startsWith("https://");
    const notificationUrl = https ? `${req.publicBaseUrl}/api/webhooks/mercadopago-nextlevel?tx=${req.reference}` : undefined;
    if (req.method === "PIX") {
      const pix = await createPixPayment(token, { amountCents: req.amountCents, description: req.description, payerEmail: req.customer.email, externalReference: req.reference, notificationUrl, expiresAt: req.expiresAt }, fetchImpl);
      return { externalId: pix.paymentId, pixCode: pix.qrCode, pixQrBase64: pix.qrCodeBase64 };
    }
    const ret = https ? `${req.publicBaseUrl}${req.returnPath}` : undefined;
    const pref = await createInvoicePreference(token, { externalReference: req.reference, title: req.description, amountCents: req.amountCents, payerEmail: req.customer.email, maxInstallments: req.maxInstallments, notificationUrl, backUrls: ret ? { success: ret, failure: ret, pending: ret } : undefined, idempotencyKey: req.idempotencyKey }, fetchImpl);
    // O pagamento do cartão só nasce depois que o cliente paga; é achado pela referência.
    return { externalId: null, checkoutUrl: pref.checkoutUrl };
  },
  async getState(db, tx, fetchImpl = fetch) {
    const token = await mpToken(db);
    const id = tx.externalId ?? (await findApprovedPaymentId(token, tx.id, fetchImpl));
    if (!id) return null;
    const p = await getPayment(token, id, fetchImpl);
    const status = MP_STATUS[p.status] ?? "PENDING";
    return { externalId: p.id, reference: p.externalReference, status, providerStatus: p.status, amountCents: p.amountCents, paidCents: status === "PAID" ? p.amountCents : 0, feeCents: p.feeCents ?? null, netCents: p.netCents ?? null, installments: p.installments ?? 1, refundedCents: p.refundedCents ?? 0 };
  },
  async refund(db, tx, input, fetchImpl = fetch) {
    if (!tx.externalId) throw new GatewayError("Pagamento ainda não identificado no Mercado Pago.");
    await refundPayment(await mpToken(db), tx.externalId, input, fetchImpl);
  },
};

// ---------------------------------------------------------------------------
// Pagar.me (alternativo; chave só em variável de ambiente)
// ---------------------------------------------------------------------------
const PG_ORDER: Record<string, GatewayTxStatus> = { paid: "PAID", pending: "PENDING", processing: "PENDING", canceled: "CANCELED", failed: "FAILED" };
const PG_CHARGE: Record<string, GatewayTxStatus> = { paid: "PAID", overpaid: "PAID", underpaid: "PENDING", pending: "PENDING", processing: "PENDING", failed: "FAILED", canceled: "CANCELED", refunded: "REFUNDED", chargedback: "CHARGEBACK" };

function pgSecret() { const s = pagarmeSecret(); if (!s) throw new GatewayError("Pagar.me ainda não configurado (PAGARME_SECRET_KEY)."); return s; }

export const pagarmeGateway: PaymentGateway = {
  code: "PAGARME", label: "Pagar.me",
  async isConfigured() { return !!pagarmeSecret() && process.env.FIN_PAGARME === "true"; },
  async createCharge(_db, req, fetchImpl = fetch) {
    const secret = pgSecret();
    const customer = { name: req.customer.name, email: req.customer.email, document: req.customer.taxId, phone: req.customer.phone };
    if (req.method === "PIX") {
      const r = await createPixOrder(secret, { code: req.reference, amountCents: req.amountCents, description: req.description, customer, expiresInSeconds: Math.max(300, Math.round((req.expiresAt.getTime() - Date.now()) / 1000)), idempotencyKey: req.idempotencyKey }, fetchImpl);
      return { externalId: r.orderId, pixCode: r.qrCode, pixQrBase64: "" };
    }
    const base = req.publicBaseUrl ?? "";
    const r = await createCardCheckout(secret, { code: req.reference, amountCents: req.amountCents, description: req.description, customer, maxInstallments: req.maxInstallments, successUrl: `${base}${req.returnPath}`, idempotencyKey: req.idempotencyKey }, fetchImpl);
    return { externalId: r.orderId, checkoutUrl: r.checkoutUrl };
  },
  async getState(_db, tx, fetchImpl = fetch) {
    if (!tx.externalId) return null;
    const o = await getOrder(pgSecret(), tx.externalId, fetchImpl);
    const status = (o.chargeStatus && PG_CHARGE[o.chargeStatus]) || PG_ORDER[o.status] || "PENDING";
    return { externalId: o.orderId, reference: o.code, status, providerStatus: o.chargeStatus ?? o.status, amountCents: o.amountCents, paidCents: o.paidCents, feeCents: null, netCents: null, installments: o.installments, refundedCents: status === "REFUNDED" ? o.amountCents : 0 };
  },
  async refund(_db, tx, input, fetchImpl = fetch) {
    const secret = pgSecret();
    if (!tx.externalId) throw new GatewayError("Pedido ainda não identificado no Pagar.me.");
    const chargeId = tx.chargeId ?? (await getOrder(secret, tx.externalId, fetchImpl)).chargeId;
    if (!chargeId) throw new GatewayError("Cobrança não encontrada no Pagar.me.");
    await refundCharge(secret, chargeId, input, fetchImpl);
  },
};

export const GATEWAY_IMPL: Record<GatewayCode, PaymentGateway> = { MERCADOPAGO: mercadoPagoGateway, PAGARME: pagarmeGateway };

// ---------------------------------------------------------------------------
// Regra de escolha (Master)
// ---------------------------------------------------------------------------
const RULE_KEY = "nl_gateway_rule";
export type GatewayRule = { default: GatewayCode };

export async function getGatewayRule(db: Database): Promise<GatewayRule> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, RULE_KEY) });
  const v = row?.value as Partial<GatewayRule> | undefined;
  return { default: v?.default === "PAGARME" ? "PAGARME" : "MERCADOPAGO" };
}

export async function saveGatewayRule(db: Database, rule: GatewayRule, userId: string) {
  await db.insert(platformSettings).values({ key: RULE_KEY, value: rule, updatedBy: userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: rule, updatedBy: userId, updatedAt: new Date().toISOString() } });
}

/**
 * Gateway para uma NOVA cobrança: preferência do produto → regra global → Mercado Pago. Se o escolhido não estiver
 * configurado, usa o Mercado Pago (a cobrança ainda não existe, então não há risco de duplicar).
 */
export async function chooseGateway(db: Database, productPreference: GatewayCode | null): Promise<GatewayCode> {
  const wanted = productPreference ?? (await getGatewayRule(db)).default;
  if (wanted === "PAGARME" && (await pagarmeGateway.isConfigured(db))) return "PAGARME";
  return "MERCADOPAGO";
}
