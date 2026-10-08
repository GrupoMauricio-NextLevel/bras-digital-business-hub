import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { corporateOrders, financeInvoices, gatewayTransactions, nlOrders, nlSubscriptions, partners, stores, supplierContracts, suppliers } from "@/db/schema";
import { isMaster, type Actor } from "./access";
import { ForbiddenError } from "./errors";
import { getPriceBook } from "./finance";

/**
 * Visão executiva do financeiro corporativo da NextLevel (só Master). Só números com fonte no banco; quando não há
 * dado suficiente (CAC, LTV sem churn), o campo vem nulo e a tela diz "sem dados".
 */
const DAY = 86_400_000;
const KIND_LABEL: Record<string, string> = { SUPPLIER_SETUP: "Setup de fornecedor", SUPPLIER_SUBSCRIPTION: "Mensalidade de fornecedor", SUPPLIER_CLOSING: "Taxa de volume (fechamento)", STORE_SETUP: "Ativação de loja", STORE_PLAN: "Planos de loja", ADDON: "Add-ons e temas", SERVICE: "Serviços", PARTNER_FEE: "Taxa de parceiro", STORE_ORDER_FEES: "Taxa por pedido / plataforma" };

export async function corporateOverview(db: Database, actor: Actor, now = new Date()) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel acessa o financeiro corporativo.");
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  const since365 = new Date(now.getTime() - 365 * DAY).toISOString();
  const book = await getPriceBook(db);

  // MRR: assinaturas Commerce ativas (anual ÷ 12) + lojas SuperDrop pagas sem assinatura Commerce + mensalidades de fornecedor não isentas.
  const subs = await db.select().from(nlSubscriptions);
  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "past_due");
  const commerceMrr = activeSubs.reduce((t, s) => t + (s.cycle === "ANNUAL" ? Math.round(s.amountCents / 12) : s.amountCents), 0);
  const subStores = new Set(subs.map((s) => s.storeId));
  const paidStores = await db.select({ id: stores.id, offer: stores.offer, partnerId: stores.partnerId }).from(stores).where(and(gte(stores.paidUntil, now.toISOString()), eq(stores.status, "ACTIVE")));
  const superdropMrr = paidStores.filter((s) => !subStores.has(s.id)).reduce((t, s) => t + (book.offers[s.offer]?.monthlyCents ?? 0), 0);
  const contracts = await db.select({ fee: supplierContracts.monthlyFeeCents, waived: supplierContracts.monthlyWaivedUntil, status: suppliers.status, hidden: suppliers.hidden }).from(supplierContracts).innerJoin(suppliers, eq(suppliers.id, supplierContracts.supplierId));
  const supplierMrr = contracts.filter((c) => !c.hidden && c.status !== "CLOSED" && (!c.waived || new Date(c.waived) <= now)).reduce((t, c) => t + c.fee, 0);
  const mrr = commerceMrr + superdropMrr + supplierMrr;

  // Recebido: faturas pagas + pedidos do catálogo pagos + Loja NextLevel pública paga.
  const invPaid = await db.select({ kind: financeInvoices.kind, amount: financeInvoices.amountCents, paidAt: financeInvoices.paidAt }).from(financeInvoices).where(and(eq(financeInvoices.status, "PAID"), gte(financeInvoices.paidAt, since365)));
  const ordPaid = await db.select({ total: corporateOrders.totalCents, paidAt: corporateOrders.paidAt, gateway: corporateOrders.gateway, partnerId: corporateOrders.partnerId, name: sql<string>`${corporateOrders.snapshot}->>'productName'` }).from(corporateOrders).where(and(eq(corporateOrders.status, "PAID"), gte(corporateOrders.paidAt, since365)));
  const nlPaid = await db.select({ total: nlOrders.chargedCents, paidAt: nlOrders.paidAt, name: nlOrders.productName, ref: nlOrders.affiliateRef }).from(nlOrders).where(and(inArray(nlOrders.status, ["PAID", "CONTACTED", "IN_PROGRESS", "DELIVERED"]), gte(nlOrders.paidAt, since365)));
  const in30 = (d: string | null) => !!d && d >= since30;
  const received30 = invPaid.filter((i) => in30(i.paidAt)).reduce((t, i) => t + i.amount, 0) + ordPaid.filter((o) => in30(o.paidAt)).reduce((t, o) => t + o.total, 0) + nlPaid.filter((o) => in30(o.paidAt)).reduce((t, o) => t + o.total, 0);
  const received365 = invPaid.reduce((t, i) => t + i.amount, 0) + ordPaid.reduce((t, o) => t + o.total, 0) + nlPaid.reduce((t, o) => t + o.total, 0);
  const paymentsCount = invPaid.length + ordPaid.length + nlPaid.length;

  // Previsto (faturas em aberto a vencer) e inadimplência (vencidas).
  const open = await db.select({ amount: financeInvoices.amountCents, status: financeInvoices.status, due: financeInvoices.dueDate }).from(financeInvoices).where(inArray(financeInvoices.status, ["OPEN", "OVERDUE"]));
  const overdue = open.filter((i) => i.status === "OVERDUE" || new Date(i.due) < now);
  const forecastCents = open.filter((i) => !overdue.includes(i)).reduce((t, i) => t + i.amount, 0) + mrr;

  // Churn (assinaturas Commerce): canceladas/expiradas nos últimos 30 dias ÷ (ativas + as que saíram).
  const churned = subs.filter((s) => (s.status === "cancelled" || s.status === "expired") && s.updatedAt >= since30).length;
  const base = activeSubs.length + churned;
  const churnBps = base ? Math.round((churned / base) * 10_000) : null;
  const arpa = activeSubs.length ? Math.round(commerceMrr / activeSubs.length) : null;
  const ltvCents = churnBps && churnBps > 0 && arpa ? Math.round(arpa / (churnBps / 10_000)) : null;

  // Receita por produto, canal, parceiro e gateway (12 meses).
  const byProduct = new Map<string, number>();
  for (const i of invPaid) byProduct.set(KIND_LABEL[i.kind] ?? i.kind, (byProduct.get(KIND_LABEL[i.kind] ?? i.kind) ?? 0) + i.amount);
  for (const o of ordPaid) byProduct.set(o.name, (byProduct.get(o.name) ?? 0) + o.total);
  for (const o of nlPaid) byProduct.set(`${o.name} (Loja NextLevel pública)`, (byProduct.get(`${o.name} (Loja NextLevel pública)`) ?? 0) + o.total);
  const partnerOrders = ordPaid.filter((o) => o.partnerId);
  const partnerIds = [...new Set(partnerOrders.map((o) => o.partnerId!))];
  const partnerNames = partnerIds.length ? new Map((await db.select({ id: partners.id, name: partners.displayName }).from(partners).where(inArray(partners.id, partnerIds))).map((p) => [p.id, p.name])) : new Map<string, string>();
  const byPartner = new Map<string, number>();
  for (const o of partnerOrders) byPartner.set(partnerNames.get(o.partnerId!) ?? "Parceiro", (byPartner.get(partnerNames.get(o.partnerId!) ?? "Parceiro") ?? 0) + o.total);
  const txs = await db.select({ gateway: gatewayTransactions.gateway, gross: gatewayTransactions.grossCents, fee: gatewayTransactions.feeCents }).from(gatewayTransactions).where(and(eq(gatewayTransactions.status, "PAID"), gte(gatewayTransactions.paidAt, since365)));
  const byGateway = new Map<string, { gross: number; fee: number }>();
  for (const t of txs) { const g = byGateway.get(t.gateway) ?? { gross: 0, fee: 0 }; g.gross += t.gross; g.fee += t.fee ?? 0; byGateway.set(t.gateway, g); }
  // Faturas (planos, setup, fornecedores) são cobradas pelo Mercado Pago da NextLevel.
  const invoiceTotal = invPaid.reduce((t, i) => t + i.amount, 0);
  if (invoiceTotal) { const g = byGateway.get("MERCADOPAGO") ?? { gross: 0, fee: 0 }; g.gross += invoiceTotal; byGateway.set("MERCADOPAGO", g); }
  const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, cents]) => ({ label, cents }));

  return {
    mrrCents: mrr, arrCents: mrr * 12, mrrParts: { commerce: commerceMrr, superdropStores: superdropMrr, suppliers: supplierMrr },
    received30Cents: received30, received365Cents: received365, forecastCents, overdueCents: overdue.reduce((t, i) => t + i.amount, 0), overdueCount: overdue.length,
    activeSubscriptions: activeSubs.length, trialSubscriptions: subs.filter((s) => s.status === "trial").length, churnBps, ltvCents, cacCents: null as number | null,
    avgTicketCents: paymentsCount ? Math.round(received365 / paymentsCount) : null,
    byProduct: sort(byProduct).slice(0, 12),
    byChannel: [{ label: "Parceiros", cents: partnerOrders.reduce((t, o) => t + o.total, 0) + nlPaid.filter((o) => o.ref).reduce((t, o) => t + o.total, 0) }, { label: "Direto", cents: received365 - partnerOrders.reduce((t, o) => t + o.total, 0) - nlPaid.filter((o) => o.ref).reduce((t, o) => t + o.total, 0) }],
    byPartner: sort(byPartner).slice(0, 10),
    byGateway: [...byGateway.entries()].map(([label, v]) => ({ label: label === "MERCADOPAGO" ? "Mercado Pago" : "Pagar.me", cents: v.gross, feeCents: v.fee })),
  };
}
