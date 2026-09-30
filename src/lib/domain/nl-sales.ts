import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { digitalProducts, nlOrderNotes, nlOrders, NL_ORDER_STATUSES, type NlOrderStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { amountFor, CARD_MAX_INSTALLMENTS, quote, type PaymentMethod } from "@/lib/finance/pricing";
import { createInvoicePreference, createPixPayment, findApprovedPaymentId, getPayment, MercadoPagoError, type FetchLike } from "@/lib/payments/mercadopago";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { getPriceBook } from "./finance";
import { nlToken } from "./nextlevel-billing";

// ---------------------------------------------------------------------------
// Vitrine pública (Loja NextLevel): produtos digitais e serviços de compra em 1 clique
// ---------------------------------------------------------------------------
export async function listDigitalProducts(db: Database, opts: { all?: boolean } = {}) {
  const rows = await db.select().from(digitalProducts).where(opts.all ? undefined : eq(digitalProducts.active, true)).orderBy(asc(digitalProducts.sortOrder), asc(digitalProducts.priceCents));
  const book = await getPriceBook(db);
  return rows.map((p) => ({ ...p, quote: quote(p.priceCents, book.billing.pixDiscountBps) }));
}

export async function getDigitalProduct(db: Database, slug: string) {
  const p = await db.query.digitalProducts.findFirst({ where: eq(digitalProducts.slug, slug) });
  if (!p || !p.active) return null;
  const book = await getPriceBook(db);
  return { ...p, quote: quote(p.priceCents, book.billing.pixDiscountBps) };
}

const productEditSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  tagline: z.string().trim().min(5).max(140).optional(),
  description: z.string().trim().min(10).max(1200).optional(),
  priceCents: z.number().int().min(100).max(100_000_00).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  badge: z.string().trim().max(24).nullable().optional(),
});

/** Master edita a vitrine pública: nome, preço cheio (cartão), destaque e visibilidade. */
export async function updateDigitalProduct(db: Database, actor: Actor, productId: string, raw: z.input<typeof productEditSchema>) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel edita a vitrine.");
  const patch = productEditSchema.parse(raw);
  const p = await db.query.digitalProducts.findFirst({ where: eq(digitalProducts.id, productId) });
  if (!p) throw new NotFoundError("Produto não encontrado.");
  await db.update(digitalProducts).set(patch).where(eq(digitalProducts.id, productId));
}

// ---------------------------------------------------------------------------
// Compra em 1 clique (sem login): cria o pedido e a cobrança
// ---------------------------------------------------------------------------
const phoneDigits = (raw: string) => raw.replace(/\D/g, "");
export const buySchema = z.object({
  slug: z.string().min(1),
  method: z.enum(["PIX", "CARD"]),
  name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: z.string().transform(phoneDigits).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido (com DDD)"),
  affiliateRef: z.string().trim().max(60).optional(),
});

const newToken = () => randomBytes(18).toString("base64url");

export type NlCharge = { orderId: string; token: string; method: PaymentMethod; chargedCents: number; pixCode?: string; pixQrBase64?: string; checkoutUrl?: string; demo: boolean };

/**
 * Cria (ou reaproveita, se o mesmo comprador ainda tem a cobrança válida) o pedido e a cobrança do método escolhido.
 * `demo`: sem conta de recebimento conectada, gera cobrança fictícia quitada só pelo botão de simulação.
 */
export async function createNlOrder(db: Database, raw: z.input<typeof buySchema>, opts: { demo?: boolean; baseUrl: string; publicHttps?: boolean; fetchImpl?: FetchLike }): Promise<NlCharge> {
  const input = buySchema.parse(raw);
  const product = await getDigitalProduct(db, input.slug);
  if (!product) throw new NotFoundError("Produto não encontrado.");
  const amount = amountFor(product.quote, input.method);

  const reusable = (await db.select().from(nlOrders).where(and(eq(nlOrders.productId, product.id), eq(nlOrders.buyerEmail, input.email), eq(nlOrders.method, input.method), eq(nlOrders.status, "AWAITING_PAYMENT"), eq(nlOrders.chargedCents, amount), gt(nlOrders.expiresAt, new Date().toISOString())))).at(0);
  if (reusable && (reusable.pixCode || reusable.checkoutUrl)) return { orderId: reusable.id, token: reusable.token, method: input.method, chargedCents: amount, pixCode: reusable.pixCode ?? undefined, pixQrBase64: reusable.pixQrBase64 ?? undefined, checkoutUrl: reusable.checkoutUrl ?? undefined, demo: !!reusable.mpPaymentId?.startsWith("demo_") };

  const id = newId("nlo");
  const token = newToken();
  const expiresAt = new Date(Date.now() + (input.method === "PIX" ? 60 : 24 * 60) * 60_000);
  let pay: { mpPaymentId: string | null; pixCode: string | null; pixQrBase64: string | null; checkoutUrl: string | null };
  if (opts.demo) {
    pay = { mpPaymentId: `demo_${id}`, pixCode: input.method === "PIX" ? `00020126DEMO${id}5204000053039865802BR` : null, pixQrBase64: input.method === "PIX" ? "" : null, checkoutUrl: null };
  } else {
    const mp = await nlToken(db);
    const notificationUrl = opts.publicHttps ? `${opts.baseUrl}/api/webhooks/mercadopago-nextlevel?order=${id}` : undefined;
    try {
      if (input.method === "PIX") {
        const pix = await createPixPayment(mp, { amountCents: amount, description: product.name, payerEmail: input.email, externalReference: id, notificationUrl, expiresAt }, opts.fetchImpl);
        pay = { mpPaymentId: pix.paymentId, pixCode: pix.qrCode, pixQrBase64: pix.qrCodeBase64, checkoutUrl: null };
      } else {
        const ret = `${opts.baseUrl}/loja-nextlevel/pedido/${token}`;
        const pref = await createInvoicePreference(mp, { externalReference: id, title: product.name, amountCents: amount, payerEmail: input.email, maxInstallments: CARD_MAX_INSTALLMENTS, notificationUrl, backUrls: opts.publicHttps ? { success: ret, failure: ret, pending: ret } : undefined }, opts.fetchImpl);
        pay = { mpPaymentId: null, pixCode: null, pixQrBase64: null, checkoutUrl: pref.checkoutUrl };
      }
    } catch (e) { if (e instanceof MercadoPagoError) throw new DomainError("PAY_FAILED", e.message); throw e; }
  }
  await db.transaction(async (tx) => {
    const n = Number(((await tx.execute(sql`select coalesce(max(number), 1000)::int + 1 as n from nl_orders`)) as { rows: { n: number }[] }).rows[0]!.n);
    await tx.insert(nlOrders).values({ id, number: n, token, productId: product.id, productName: product.name, listCents: product.priceCents, chargedCents: amount, method: input.method, buyerName: input.name, buyerEmail: input.email, buyerPhone: input.phone, affiliateRef: input.affiliateRef || null, expiresAt: expiresAt.toISOString(), ...pay });
    await tx.insert(nlOrderNotes).values({ id: newId("nln"), orderId: id, kind: "SYSTEM", body: `Pedido criado (${input.method === "PIX" ? "Pix" : "cartão em até 6x"}).` });
  });
  return { orderId: id, token, method: input.method, chargedCents: amount, pixCode: pay.pixCode ?? undefined, pixQrBase64: pay.pixQrBase64 ?? undefined, checkoutUrl: pay.checkoutUrl ?? undefined, demo: !!opts.demo };
}

/** Acompanhamento público pelo link secreto do pedido. */
export async function getNlOrderByToken(db: Database, token: string) {
  const o = await db.query.nlOrders.findFirst({ where: eq(nlOrders.token, token) });
  if (!o) return null;
  const product = await db.query.digitalProducts.findFirst({ where: eq(digitalProducts.id, o.productId) });
  return { order: o, deliverable: product?.deliverable ?? "" };
}

async function markPaid(db: Database, orderId: string, mpPaymentId: string | null) {
  const now = new Date().toISOString();
  const r = await db.update(nlOrders).set({ status: "PAID", paidAt: now, updatedAt: now, ...(mpPaymentId ? { mpPaymentId } : {}) }).where(and(eq(nlOrders.id, orderId), eq(nlOrders.status, "AWAITING_PAYMENT"))).returning({ id: nlOrders.id });
  if (r.length) await db.insert(nlOrderNotes).values({ id: newId("nln"), orderId, kind: "SYSTEM", body: "Pagamento confirmado." });
  return r.length > 0;
}

/** Confere o pagamento na API do Mercado Pago (o corpo do webhook nunca é confiável). Idempotente. */
export async function syncNlOrder(db: Database, orderId: string, fetchImpl: FetchLike = fetch): Promise<{ paid: boolean }> {
  const o = await db.query.nlOrders.findFirst({ where: eq(nlOrders.id, orderId) });
  if (!o) return { paid: false };
  if (o.status !== "AWAITING_PAYMENT") return { paid: o.status !== "CANCELED" };
  if (o.mpPaymentId?.startsWith("demo_")) return { paid: false };
  const mp = await nlToken(db);
  const paymentId = o.mpPaymentId ?? (o.method === "CARD" ? await findApprovedPaymentId(mp, o.id, fetchImpl) : null);
  if (!paymentId) return { paid: false };
  const p = await getPayment(mp, paymentId, fetchImpl);
  if (p.externalReference !== o.id || p.status !== "approved") return { paid: false };
  if (p.amountCents < o.chargedCents) throw new DomainError("AMOUNT_MISMATCH", "Valor pago menor que o do pedido.");
  await markPaid(db, o.id, paymentId);
  return { paid: true };
}

/** Só demonstração: quita a cobrança fictícia. */
export async function simulateNlPayment(db: Database, token: string) {
  const o = await db.query.nlOrders.findFirst({ where: eq(nlOrders.token, token) });
  if (!o || !o.mpPaymentId?.startsWith("demo_")) throw new NotFoundError("Pedido não encontrado.");
  await markPaid(db, o.id, null);
}

// ---------------------------------------------------------------------------
// CRM (Master)
// ---------------------------------------------------------------------------
/** Etapas do funil, na ordem das colunas. AWAITING_PAYMENT é a entrada; CANCELED fica fora do quadro. */
export const CRM_STAGES: { status: NlOrderStatus; label: string; hint: string }[] = [
  { status: "AWAITING_PAYMENT", label: "Aguardando pagamento", hint: "Checkout iniciado, ainda sem pagamento" },
  { status: "PAID", label: "Pago · novo", hint: "Pagamento confirmado: fazer o primeiro contato" },
  { status: "CONTACTED", label: "Em contato", hint: "Briefing e alinhamento com o cliente" },
  { status: "IN_PROGRESS", label: "Em execução", hint: "Entrega em andamento" },
  { status: "DELIVERED", label: "Entregue", hint: "Concluído" },
];

const NEXT: Record<NlOrderStatus, NlOrderStatus[]> = {
  AWAITING_PAYMENT: ["CANCELED"],
  PAID: ["CONTACTED", "IN_PROGRESS", "DELIVERED", "CANCELED"],
  CONTACTED: ["IN_PROGRESS", "DELIVERED", "CANCELED"],
  IN_PROGRESS: ["DELIVERED", "CONTACTED", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

function requireMaster(actor: Actor) { if (!isMaster(actor)) throw new ForbiddenError("Apenas a equipe NextLevel acessa o CRM."); }

export async function listNlOrders(db: Database, actor: Actor, opts: { status?: NlOrderStatus } = {}) {
  requireMaster(actor);
  return db.select().from(nlOrders).where(opts.status ? eq(nlOrders.status, opts.status) : undefined).orderBy(desc(nlOrders.createdAt));
}

export async function getNlOrder(db: Database, actor: Actor, id: string) {
  requireMaster(actor);
  const order = await db.query.nlOrders.findFirst({ where: eq(nlOrders.id, id) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  const notes = await db.select().from(nlOrderNotes).where(eq(nlOrderNotes.orderId, id)).orderBy(asc(nlOrderNotes.createdAt));
  return { order, notes };
}

export async function advanceNlOrder(db: Database, actor: Actor, id: string, next: NlOrderStatus) {
  requireMaster(actor);
  if (!NL_ORDER_STATUSES.includes(next)) throw new DomainError("STATUS", "Etapa inválida.");
  const o = await db.query.nlOrders.findFirst({ where: eq(nlOrders.id, id) });
  if (!o) throw new NotFoundError("Pedido não encontrado.");
  if (!NEXT[o.status].includes(next)) throw new DomainError("INVALID_TRANSITION", "Esta mudança de etapa não é permitida.");
  const label = CRM_STAGES.find((s) => s.status === next)?.label ?? "Cancelado";
  await db.transaction(async (tx) => {
    await tx.update(nlOrders).set({ status: next, updatedAt: new Date().toISOString() }).where(eq(nlOrders.id, id));
    await tx.insert(nlOrderNotes).values({ id: newId("nln"), orderId: id, kind: "STATUS", authorUserId: actor.userId, body: `Etapa: ${label}` });
  });
}

export async function addNlNote(db: Database, actor: Actor, id: string, body: string) {
  requireMaster(actor);
  const text = z.string().trim().min(1, "Escreva a anotação").max(1500).parse(body);
  if (!(await db.query.nlOrders.findFirst({ where: eq(nlOrders.id, id) }))) throw new NotFoundError("Pedido não encontrado.");
  await db.insert(nlOrderNotes).values({ id: newId("nln"), orderId: id, kind: "NOTE", authorUserId: actor.userId, body: text });
}

export async function nlSalesSummary(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select().from(nlOrders);
  const paid = rows.filter((r) => r.status !== "AWAITING_PAYMENT" && r.status !== "CANCELED");
  const month = new Date().toISOString().slice(0, 7);
  return {
    total: rows.length,
    awaiting: rows.filter((r) => r.status === "AWAITING_PAYMENT").length,
    toContact: rows.filter((r) => r.status === "PAID").length,
    active: rows.filter((r) => r.status === "CONTACTED" || r.status === "IN_PROGRESS").length,
    revenueCents: paid.reduce((s, r) => s + r.chargedCents, 0),
    revenueMonthCents: paid.filter((r) => r.paidAt?.startsWith(month)).reduce((s, r) => s + r.chargedCents, 0),
  };
}

export const NL_STATUS_LABEL: Record<NlOrderStatus, string> = { AWAITING_PAYMENT: "Aguardando pagamento", PAID: "Pago", CONTACTED: "Em contato", IN_PROGRESS: "Em execução", DELIVERED: "Entregue", CANCELED: "Cancelado" };
