import { and, eq, gte, inArray, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { networks, orders, serviceOrders, stores, suppliers, walletAccounts } from "@/db/schema";

export type Severity = "danger" | "warning" | "info";
export type Alert = { key: string; severity: Severity; title: string; detail: string; href: string; count: number };
export type HealthBand = "HEALTHY" | "ATTENTION" | "RISK";

export type StoreSignal = {
  id: string; name: string; slug: string; offer: "DROP_MANUAL" | "STORE_SUBDOMAIN" | "STORE_OWN";
  status: "PENDING_PAYMENT" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  /** Vazio na loja independente da Commerce (D89). */
  supplierId: string | null; supplierName: string | null;
  orders30: number; lastOrderAt: string | null; ageDays: number;
  balanceCents: number; awaitingFunds: number; oldestAwaitingHours: number;
  mpConnected: boolean; customDomain: string | null; domainStatus: "NOT_CONFIGURED" | "PENDING" | "CONNECTED";
};
export type SupplierSignal = { id: string; name: string; status: string; walletConnected: boolean; stores: number };
export type TowerSnapshot = { stores: StoreSignal[]; suppliers: SupplierSignal[]; serviceOrdersWaiting: number };

/**
 * Pontuação 0–100 de SAÚDE de uma loja: só o estado da infraestrutura comercial (pagamento, domínio, recarga, suspensão).
 * Poucas vendas é desempenho, não defeito: isso vai para `opportunities` (documento 12 §14).
 */
export function healthScore(s: StoreSignal): { score: number; band: HealthBand; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];
  const hit = (pts: number, why: string) => { score -= pts; reasons.push(why); };
  if (s.status === "SUSPENDED") hit(40, "Loja suspensa por inadimplência");
  if (s.status === "PENDING_PAYMENT") hit(20, "Setup ainda não pago");
  if (s.status === "ACTIVE") {
    if (s.offer !== "DROP_MANUAL" && !s.mpConnected) hit(15, "Mercado Pago da loja não conectado");
    if (s.awaitingFunds > 0) hit(s.oldestAwaitingHours >= 24 ? 20 : 10, `${s.awaitingFunds} pedido(s) aguardando recarga`);
    if (s.offer === "STORE_OWN" && s.customDomain && s.domainStatus !== "CONNECTED") hit(10, "Domínio próprio pendente");
  }
  score = Math.max(0, Math.min(100, score));
  return { score, band: score >= 75 ? "HEALTHY" : score >= 50 ? "ATTENTION" : "RISK", reasons };
}

/** Oportunidades comerciais (desempenho), separadas da saúde: nunca derrubam a nota. */
export function opportunities(s: StoreSignal): string[] {
  const out: string[] = [];
  if (s.status !== "ACTIVE") return out;
  if (s.orders30 === 0 && s.ageDays > 14) out.push("Sem pedidos nos últimos 30 dias: vale revisar catálogo, preços e divulgação");
  else if (s.orders30 < 3 && s.ageDays > 30) out.push("Poucos pedidos no mês: há espaço para crescer");
  return out;
}

export const BAND_LABEL: Record<HealthBand, string> = { HEALTHY: "Saudável", ATTENTION: "Atenção", RISK: "Risco" };

/** Regras da fila de alertas da torre de controle (puras, testáveis). Ordenadas por gravidade e volume. */
export function buildAlerts(snap: TowerSnapshot): Alert[] {
  const out: Alert[] = [];
  const add = (a: Omit<Alert, "count"> & { count: number }) => { if (a.count > 0) out.push(a); };

  const stuck = snap.stores.filter((s) => s.awaitingFunds > 0 && s.oldestAwaitingHours >= 24);
  add({ key: "funds-stuck", severity: "danger", count: stuck.length, title: "Pedidos travados por falta de saldo há mais de 24h", detail: stuck.slice(0, 3).map((s) => s.name).join(", ") + (stuck.length > 3 ? "…" : "") + ". Cancelam sozinhos em 72h.", href: "/master/orders" });

  const badSuppliers = snap.suppliers.filter((s) => s.status !== "ACTIVE");
  add({ key: "supplier-access", severity: "danger", count: badSuppliers.length, title: "Fornecedores com acesso restrito por atraso", detail: badSuppliers.map((s) => s.name).join(", "), href: "/master/financeiro/operacao?tab=invoices" });

  const noWallet = snap.suppliers.filter((s) => !s.walletConnected && s.stores > 0);
  add({ key: "supplier-wallet", severity: "warning", count: noWallet.length, title: "Fornecedores sem Mercado Pago para receber recargas", detail: "Os lojistas não conseguem recarregar: " + noWallet.map((s) => s.name).join(", "), href: "/master/suppliers" });

  const pending = snap.stores.filter((s) => s.status === "PENDING_PAYMENT");
  add({ key: "setup-pending", severity: "warning", count: pending.length, title: "Lojas aguardando o pagamento do setup", detail: pending.map((s) => s.name).join(", "), href: "/master/financeiro/operacao?tab=invoices" });

  add({ key: "service-quote", severity: "warning", count: snap.serviceOrdersWaiting, title: "Pedidos de serviço aguardando orçamento", detail: "Cada pedido parado é receita adiada na Loja NextLevel.", href: "/master/services" });

  const noMp = snap.stores.filter((s) => s.status === "ACTIVE" && s.offer !== "DROP_MANUAL" && !s.mpConnected);
  add({ key: "store-mp", severity: "warning", count: noMp.length, title: "Lojas ativas sem Mercado Pago conectado", detail: "Não conseguem receber dos clientes: " + noMp.slice(0, 3).map((s) => s.name).join(", "), href: "/master/stores" });

  const quiet = snap.stores.filter((s) => s.status === "ACTIVE" && s.orders30 === 0 && s.ageDays > 14);
  add({ key: "store-quiet", severity: "info", count: quiet.length, title: "Lojas sem venda em 30 dias (risco de cancelamento)", detail: "Boa hora para oferecer tráfego pago ou conteúdo: " + quiet.slice(0, 3).map((s) => s.name).join(", "), href: "/master/stores" });

  const dom = snap.stores.filter((s) => s.offer === "STORE_OWN" && s.customDomain && s.domainStatus === "PENDING");
  add({ key: "domain-pending", severity: "info", count: dom.length, title: "Domínios próprios aguardando conexão", detail: dom.map((s) => s.customDomain).join(", "), href: "/master/stores" });

  const rank = { danger: 0, warning: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
}

/** Coleta os sinais do banco para a torre de controle. */
export async function loadTowerSnapshot(db: Database, now = new Date()): Promise<TowerSnapshot> {
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const rows = await db.select({ store: stores, supplierId: suppliers.id, supplierName: suppliers.name }).from(stores).leftJoin(networks, eq(networks.id, stores.networkId)).leftJoin(suppliers, eq(suppliers.id, networks.supplierId));
  const ord = await db.select({ storeId: orders.storeId, n: sql<number>`count(*)`, last: sql<string>`max(${orders.createdAt})` }).from(orders).where(and(ne(orders.status, "CANCELED"), gte(orders.createdAt, since))).groupBy(orders.storeId);
  const lastAny = await db.select({ storeId: orders.storeId, last: sql<string>`max(${orders.createdAt})` }).from(orders).groupBy(orders.storeId);
  const waiting = await db.select({ storeId: orders.storeId, n: sql<number>`count(*)`, oldest: sql<string>`min(${orders.awaitingFundsSince})` }).from(orders).where(and(eq(orders.status, "AWAITING_CENTRAL_PAYMENT"), eq(orders.centralPaymentStatus, "PENDING"))).groupBy(orders.storeId);
  const wallets = await db.select().from(walletAccounts);
  const sup = await db.select().from(suppliers);
  const svcWaiting = await db.select({ n: sql<number>`count(*)` }).from(serviceOrders).where(inArray(serviceOrders.status, ["REQUESTED", "IN_ANALYSIS"]));

  const storeSignals: StoreSignal[] = rows.map((r) => {
    const o = ord.find((x) => x.storeId === r.store.id);
    const w = waiting.find((x) => x.storeId === r.store.id);
    return {
      id: r.store.id, name: r.store.name, slug: r.store.slug, offer: r.store.offer, status: r.store.status, supplierId: r.supplierId, supplierName: r.supplierName,
      orders30: Number(o?.n ?? 0), lastOrderAt: lastAny.find((x) => x.storeId === r.store.id)?.last ?? null,
      ageDays: Math.floor((now.getTime() - new Date(r.store.createdAt).getTime()) / 86_400_000),
      balanceCents: wallets.find((x) => x.storeId === r.store.id)?.balanceCents ?? 0,
      awaitingFunds: Number(w?.n ?? 0), oldestAwaitingHours: w?.oldest ? Math.floor((now.getTime() - new Date(w.oldest).getTime()) / 3_600_000) : 0,
      mpConnected: r.store.paymentStatus === "CONNECTED", customDomain: r.store.customDomain, domainStatus: r.store.domainStatus,
    };
  });
  const supplierSignals: SupplierSignal[] = sup.map((s) => ({ id: s.id, name: s.name, status: s.status, walletConnected: Boolean(s.walletMpTokenEnc), stores: storeSignals.filter((x) => x.supplierId === s.id).length }));
  return { stores: storeSignals, suppliers: supplierSignals, serviceOrdersWaiting: Number(svcWaiting[0]?.n ?? 0) };
}
