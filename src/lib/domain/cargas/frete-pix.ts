import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { trCarriers, trFreightPayments, trParcelEvents, trParcels, trTrips, trTrustedClients, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { createPixPayment, findApprovedPaymentId, getPayment, MercadoPagoError, verifyAccessToken, type FetchLike } from "@/lib/payments/mercadopago";
import { isMaster, requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { myCarrier } from "./cargas";
import { getExcursionRules } from "./regras-excursao";

/**
 * Frete do ônibus por Pix (D119, fase E7 do Club). O dinheiro do frete é do dono do ônibus: o Pix é gerado na conta
 * Mercado Pago DELE (token só criptografado) e só vale depois de conferido na API (o corpo do aviso nunca é confiável).
 * A NextLevel não segura o dinheiro; a taxa da plataforma vai em fatura mensal (cobrança desligada até o dono publicar).
 * Tudo isso só liga com `pixOnline` nas regras da Excursão; desligado, cliente e ônibus combinam (como antes).
 */
export { PAY_STATUS_LABEL, type PayStatus } from "@/lib/cargas/rotulos";
import type { PayStatus } from "@/lib/cargas/rotulos";
const PIX_MINUTES = 30;

async function parcelEvent(db: Pick<Database, "insert">, parcelId: string, kind: string, actor: string, note?: string | null) {
  await db.insert(trParcelEvents).values({ id: newId("trpe"), parcelId, kind, actor, note: note ?? null });
}

// ---------------------------------------------------------------------------
// Mercado Pago do dono do ônibus
// ---------------------------------------------------------------------------
const tokenSchema = z.object({ accessToken: z.string().trim().min(20, "Cole o Access Token completo") });

async function busOf(db: Database, actor: Actor, carrierId: string | null) {
  if (isMaster(actor)) {
    if (!carrierId) throw new DomainError("CARRIER", "Escolha o ônibus.");
    const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId) });
    if (!c) throw new NotFoundError("Ônibus não encontrado.");
    return c;
  }
  return myCarrier(db, actor);
}

/** O dono do ônibus conecta a conta Mercado Pago dele (o token é conferido na API e guardado criptografado). */
export async function connectCarrierMp(db: Database, actor: Actor, carrierId: string | null, raw: z.input<typeof tokenSchema>, fetchImpl: FetchLike = fetch) {
  const c = await busOf(db, actor, carrierId);
  const token = tokenSchema.parse(raw).accessToken;
  if (!/^(TEST|APP_USR)-/.test(token)) throw new DomainError("MP_TOKEN", "O Access Token começa com APP_USR- (produção) ou TEST- (teste).");
  let account;
  try { account = await verifyAccessToken(token, fetchImpl); } catch (e) { throw new DomainError("MP_TOKEN", e instanceof MercadoPagoError ? e.message : "Não foi possível conferir o token."); }
  await db.update(trCarriers).set({ mpAccessTokenEnc: encryptSecret(token), mpAccountId: String(account.id), mpConnectedAt: new Date().toISOString() }).where(eq(trCarriers.id, c.id));
  await recordAudit(db, actor, { action: "CARGAS_MP_CONNECTED", entityType: "tr_carrier", entityId: c.id, after: { accountId: String(account.id), test: account.isTest } });
  return { nickname: account.nickname, isTest: account.isTest };
}

export async function disconnectCarrierMp(db: Database, actor: Actor, carrierId: string | null) {
  const c = await busOf(db, actor, carrierId);
  await db.update(trCarriers).set({ mpAccessTokenEnc: null, mpAccountId: null, mpConnectedAt: null }).where(eq(trCarriers.id, c.id));
  await recordAudit(db, actor, { action: "CARGAS_MP_DISCONNECTED", entityType: "tr_carrier", entityId: c.id });
  return { ok: true as const };
}

/** Situação do recebimento por Pix do ônibus (para o perfil). Nunca devolve o token. */
export async function carrierPixStatus(db: Database, actor: Actor) {
  const c = await myCarrier(db, actor);
  const rules = await getExcursionRules(db);
  return { connected: !!c.mpAccessTokenEnc, accountId: c.mpAccountId, connectedAt: c.mpConnectedAt ? new Date(c.mpConnectedAt).toISOString() : null, pixOnline: rules.pixOnline };
}

/** Situação do pagamento de um fardo recém-aceito. */
export async function acceptPayStatus(db: Pick<Database, "query">, carrierId: string, clientUserId: string, pixOnline: boolean): Promise<PayStatus> {
  if (!pixOnline) return "COMBINAR";
  const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId), columns: { mpAccessTokenEnc: true } });
  if (!c?.mpAccessTokenEnc) return "COMBINAR";
  const trusted = await db.query.trTrustedClients.findFirst({ where: and(eq(trTrustedClients.carrierId, carrierId), eq(trTrustedClients.clientUserId, clientUserId)), columns: { id: true } });
  return trusted ? "NA_CHEGADA" : "A_PAGAR";
}

// ---------------------------------------------------------------------------
// Cliente: pagar o frete por Pix
// ---------------------------------------------------------------------------
/**
 * Gera (ou devolve, se ainda valer) o Pix dos fardos aceitos e a pagar do cliente numa viagem. Uma cobrança por vez:
 * se os fardos mudaram, a anterior expira e nasce outra. A referência externa é o id da cobrança (idempotência no MP).
 */
export async function createFreightPix(db: Database, actor: Actor, tripId: string, opts: { notificationBaseUrl?: string; fetchImpl?: FetchLike; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const t = await db.query.trTrips.findFirst({ where: eq(trTrips.id, tripId) });
  if (!t) throw new NotFoundError("Viagem não encontrada.");
  const parcels = await db.select().from(trParcels).where(and(eq(trParcels.tripId, t.id), eq(trParcels.clientUserId, actor.userId), eq(trParcels.payStatus, "A_PAGAR"), inArray(trParcels.status, ["ACEITO", "PRONTO"])));
  if (!parcels.length) throw new DomainError("NOTHING", "Nenhum fardo aceito esperando o Pix nesta viagem.");
  const ids = parcels.map((p) => p.id).sort();
  const amount = parcels.reduce((s, p) => s + p.priceCents, 0);
  const open = await db.select().from(trFreightPayments).where(and(eq(trFreightPayments.payerUserId, actor.userId), eq(trFreightPayments.tripId, t.id), eq(trFreightPayments.status, "PENDENTE"), gt(trFreightPayments.expiresAt, now.toISOString()))).orderBy(desc(trFreightPayments.createdAt));
  const same = open.find((x) => x.amountCents === amount && [...x.parcelIds].sort().join() === ids.join());
  if (same) return view(same);
  for (const x of open) await db.update(trFreightPayments).set({ status: "EXPIRADO" }).where(and(eq(trFreightPayments.id, x.id), eq(trFreightPayments.status, "PENDENTE")));
  const c = (await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, t.carrierId) }))!;
  const token = decryptSecret(c.mpAccessTokenEnc);
  if (!token) throw new DomainError("NO_MP", "O ônibus ainda não conectou o Mercado Pago. Combine o pagamento com ele.");
  const payer = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { email: true } });
  const id = newId("tfp");
  const expiresAt = new Date(now.getTime() + PIX_MINUTES * 60_000);
  try {
    const pix = await createPixPayment(token, { amountCents: amount, description: `Frete ${c.name} · viagem ${t.number} · ${parcels.length} fardo(s)`, payerEmail: payer?.email ?? "frete@nextlevel.app", externalReference: id, notificationUrl: opts.notificationBaseUrl ? `${opts.notificationBaseUrl}/api/webhooks/mercadopago-frete?pagamento=${id}` : undefined, expiresAt }, opts.fetchImpl);
    const [row] = await db.insert(trFreightPayments).values({ id, carrierId: c.id, tripId: t.id, payerUserId: actor.userId, parcelIds: ids, amountCents: amount, mpPaymentId: pix.paymentId, pixCode: pix.qrCode, expiresAt: expiresAt.toISOString() }).returning();
    return view(row!);
  } catch (e) {
    if (e instanceof MercadoPagoError) throw new DomainError("PIX_FAILED", e.message);
    throw e;
  }
}
const view = (x: typeof trFreightPayments.$inferSelect) => ({ id: x.id, amountCents: x.amountCents, pixCode: x.pixCode ?? "", expiresAt: new Date(x.expiresAt).toISOString(), status: x.status, parcels: x.parcelIds.length });

/**
 * Confere o pagamento na API do Mercado Pago com o token do ônibus (aviso ou consulta do cliente). Só vale aprovado,
 * com a referência desta cobrança e valor completo. Aplica uma única vez (atualização condicional).
 */
export async function syncFreightPayment(db: Database, paymentId: string, fetchImpl: FetchLike = fetch, opts: { lookup?: boolean } = {}): Promise<{ paid: boolean }> {
  const x = await db.query.trFreightPayments.findFirst({ where: eq(trFreightPayments.id, paymentId) });
  if (!x) return { paid: false };
  if (x.status === "PAGO") return { paid: true };
  const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, x.carrierId), columns: { mpAccessTokenEnc: true, name: true } });
  const token = decryptSecret(c?.mpAccessTokenEnc);
  if (!token) return { paid: false };
  const mpId = opts.lookup ? (await findApprovedPaymentId(token, x.id, fetchImpl)) ?? x.mpPaymentId : x.mpPaymentId;
  if (!mpId) return { paid: false };
  const p = await getPayment(token, mpId, fetchImpl);
  if (p.externalReference !== x.id || p.status !== "approved" || p.amountCents < x.amountCents) return { paid: false };
  await db.transaction(async (tx) => {
    const upd = await tx.update(trFreightPayments).set({ status: "PAGO", mpPaymentId: p.id, paidAt: new Date().toISOString() }).where(and(eq(trFreightPayments.id, x.id), sql`${trFreightPayments.status} <> 'PAGO'`)).returning({ id: trFreightPayments.id });
    if (!upd.length) return;
    const ps = await tx.update(trParcels).set({ payStatus: "PAGO", updatedAt: new Date().toISOString() }).where(and(inArray(trParcels.id, x.parcelIds), eq(trParcels.payStatus, "A_PAGAR"))).returning({ id: trParcels.id, status: trParcels.status });
    for (const q of ps) {
      await parcelEvent(tx, q.id, "PAGO", "Mercado Pago", null);
      // Pago depois que o fardo deixou de viajar (cancelado, não embarcou): fica para o ônibus devolver.
      if (!(["ACEITO", "PRONTO"] as string[]).includes(q.status)) await tx.update(trParcels).set({ payStatus: "DEVOLVER" }).where(eq(trParcels.id, q.id));
    }
  });
  return { paid: true };
}

/** "Já paguei": o cliente pede a conferência da cobrança dele. */
export async function checkMyFreightPayment(db: Database, actor: Actor, paymentId: string, fetchImpl: FetchLike = fetch) {
  const x = await db.query.trFreightPayments.findFirst({ where: and(eq(trFreightPayments.id, paymentId), eq(trFreightPayments.payerUserId, actor.userId)) });
  if (!x) throw new NotFoundError("Pagamento não encontrado.");
  return syncFreightPayment(db, x.id, fetchImpl, { lookup: true });
}

/** Cobranças em aberto do cliente (para mostrar o Pix de novo). */
export async function myOpenFreightPix(db: Database, actor: Actor, now = new Date()) {
  const rows = await db.select().from(trFreightPayments).where(and(eq(trFreightPayments.payerUserId, actor.userId), eq(trFreightPayments.status, "PENDENTE"), gt(trFreightPayments.expiresAt, now.toISOString())));
  return rows.map((r) => ({ tripId: r.tripId, ...view(r) }));
}

// ---------------------------------------------------------------------------
// Dono do ônibus: confiança, recebido na chegada, devolução
// ---------------------------------------------------------------------------
async function ownParcel(db: Database, actor: Actor, parcelId: string) {
  const c = await myCarrier(db, actor);
  const p = await db.query.trParcels.findFirst({ where: and(eq(trParcels.id, parcelId), eq(trParcels.carrierId, c.id)) });
  if (!p) throw new NotFoundError("Fardo não encontrado.");
  return { c, p };
}

/** Marca (ou desmarca) o cliente deste fardo como de confiança: os próximos fardos dele pagam na chegada. */
export async function trustClientOfParcel(db: Database, actor: Actor, parcelId: string, trusted: boolean) {
  const { c, p } = await ownParcel(db, actor, parcelId);
  if (trusted) {
    await db.insert(trTrustedClients).values({ id: newId("trtc"), carrierId: c.id, clientUserId: p.clientUserId }).onConflictDoNothing();
    // Fardos ainda não coletados e a pagar passam a pagar na chegada.
    await db.update(trParcels).set({ payStatus: "NA_CHEGADA" }).where(and(eq(trParcels.carrierId, c.id), eq(trParcels.clientUserId, p.clientUserId), eq(trParcels.payStatus, "A_PAGAR")));
  } else {
    await db.delete(trTrustedClients).where(and(eq(trTrustedClients.carrierId, c.id), eq(trTrustedClients.clientUserId, p.clientUserId)));
  }
  await recordAudit(db, actor, { action: trusted ? "CARGAS_CLIENT_TRUSTED" : "CARGAS_CLIENT_UNTRUSTED", entityType: "tr_parcel", entityId: p.id });
  return { ok: true as const };
}

/** "Recebi em dinheiro ou Pix" (cliente de confiança) e "Já devolvi o Pix". */
export async function registerParcelPayment(db: Database, actor: Actor, parcelId: string, what: "RECEBIDO" | "DEVOLVIDO") {
  const { c, p } = await ownParcel(db, actor, parcelId);
  const from: PayStatus = what === "RECEBIDO" ? "NA_CHEGADA" : "DEVOLVER";
  if (p.payStatus !== from) throw new DomainError("STATUS", what === "RECEBIDO" ? "Esse fardo não está marcado para pagar na chegada." : "Esse fardo não tem Pix a devolver.");
  await db.update(trParcels).set({ payStatus: what, updatedAt: new Date().toISOString() }).where(and(eq(trParcels.id, p.id), eq(trParcels.payStatus, from)));
  await parcelEvent(db, p.id, what, c.name, null);
  return { ok: true as const };
}

/** Fardo que deixou de viajar (cancelado, não embarcou, viagem cancelada): se já estava pago, o ônibus devolve. */
export async function markRefundDue(db: Pick<Database, "update">, parcelIds: string[]) {
  if (!parcelIds.length) return;
  await db.update(trParcels).set({ payStatus: "DEVOLVER" }).where(and(inArray(trParcels.id, parcelIds), eq(trParcels.payStatus, "PAGO")));
}

// ---------------------------------------------------------------------------
// Master: taxa da plataforma por ônibus e mês (fatura mensal; cobrança desligada até o dono publicar)
// ---------------------------------------------------------------------------
export async function excursionFeeReport(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ carrier: trCarriers.name, carrierId: trCarriers.id, at: trParcels.acceptedAt, fee: trParcels.feeCents, price: trParcels.priceCents, pay: trParcels.payStatus })
    .from(trParcels).innerJoin(trCarriers, eq(trCarriers.id, trParcels.carrierId)).where(inArray(trParcels.status, ["COLETADO", "EM_VIAGEM", "CHEGOU", "ENTREGUE"]));
  const by = new Map<string, { carrier: string; month: string; parcels: number; freightCents: number; pixCents: number; feeCents: number }>();
  for (const r of rows) {
    if (!r.at) continue;
    const month = new Date(new Date(r.at).getTime() - 3 * 3_600_000).toISOString().slice(0, 7);
    const k = `${r.carrierId}|${month}`;
    const x = by.get(k) ?? { carrier: r.carrier, month, parcels: 0, freightCents: 0, pixCents: 0, feeCents: 0 };
    x.parcels++; x.freightCents += r.price; x.feeCents += r.fee ?? 0; if (r.pay === "PAGO") x.pixCents += r.price;
    by.set(k, x);
  }
  return [...by.values()].sort((a, b) => b.month.localeCompare(a.month) || a.carrier.localeCompare(b.carrier, "pt-BR"));
}

/** Fila de pagamento do ônibus: pagar na chegada (registrar o recebido) e Pix a devolver. */
export async function carrierPaymentQueue(db: Database, actor: Actor) {
  const c = await myCarrier(db, actor);
  const rows = await db.select({ p: trParcels, n: trTrips.number }).from(trParcels).innerJoin(trTrips, eq(trTrips.id, trParcels.tripId)).where(and(eq(trParcels.carrierId, c.id), inArray(trParcels.payStatus, ["NA_CHEGADA", "DEVOLVER"]), inArray(trParcels.status, ["ACEITO", "PRONTO", "COLETADO", "EM_VIAGEM", "CHEGOU", "ENTREGUE", "NAO_EMBARCOU", "CANCELADO"]))).orderBy(desc(trParcels.updatedAt)).limit(200);
  const item = ({ p, n }: (typeof rows)[number]) => ({ id: p.id, label: `${n}-${String(p.seq).padStart(2, "0")}`, recipientName: p.recipientName, storeName: p.storeName, priceCents: p.priceCents, status: p.status });
  return { onArrival: rows.filter((r) => r.p.payStatus === "NA_CHEGADA" && r.p.status !== "CANCELADO" && r.p.status !== "NAO_EMBARCOU").map(item), toRefund: rows.filter((r) => r.p.payStatus === "DEVOLVER").map(item) };
}
