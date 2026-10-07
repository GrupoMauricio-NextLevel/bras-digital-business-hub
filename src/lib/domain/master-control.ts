import { and, eq, gte, lt, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { financeInvoices, networks, orders, storeAcquisitions, stores, suppliers } from "@/db/schema";
import { volumeFee } from "@/lib/finance/engine";
import { isMaster, type Actor } from "./access";
import { ForbiddenError } from "./errors";
import { contractTerms, ensureContract, estimateClosing, getPriceBook, periodBounds, storeOrderFeeFor } from "./finance";

const need = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel acessa o controle de comissões."); };

export type SupplierControlRow = {
  supplierId: string; name: string; model: string; centralOrders: number; baseCents: number;
  /** Estimativa do que a NextLevel recebe do fornecedor no mês: taxa de volume + por pedido + complemento até o mínimo. */
  nextlevelFeeCents: number; volumeFeeBps: number; channelCommissionCents: number; netCents: number;
  invoiceStatus: string | null;
};

/** Pedidos dos fornecedores (compra na Central) e a comissão da NextLevel por fornecedor na competência. */
export async function supplierOrderControl(db: Database, actor: Actor, period: string) {
  need(actor);
  const list = await db.select().from(suppliers).where(and(ne(suppliers.status, "CLOSED"), eq(suppliers.hidden, false)));
  const rows: SupplierControlRow[] = [];
  for (const s of list) {
    const est = await estimateClosing(db, s.id, period);
    const inv = await db.query.financeInvoices.findFirst({ where: and(eq(financeInvoices.supplierId, s.id), eq(financeInvoices.kind, "SUPPLIER_CLOSING"), eq(financeInvoices.period, period)) });
    rows.push({ supplierId: s.id, name: s.name, model: s.businessModel, centralOrders: est.orders, baseCents: est.baseCents, nextlevelFeeCents: est.closing.fee.totalCents, volumeFeeBps: est.terms.volumeFeeBps, channelCommissionCents: est.closing.commissionCreditCents, netCents: est.closing.netCents, invoiceStatus: inv?.status ?? null });
  }
  rows.sort((a, b) => b.baseCents - a.baseCents);
  return { period, rows, totals: rows.reduce((t, r) => ({ orders: t.orders + r.centralOrders, base: t.base + r.baseCents, fee: t.fee + r.nextlevelFeeCents, channel: t.channel + r.channelCommissionCents }), { orders: 0, base: 0, fee: 0, channel: 0 }) };
}

export type StoreControlRow = {
  storeId: string; name: string; supplierName: string; offer: string; orders: number; salesCents: number; costCents: number; marginCents: number;
  /** Parcela da taxa do fornecedor à NextLevel atribuída a esta loja (taxa de volume + por pedido, sem o mínimo mensal). */
  nextlevelFeeCents: number; memberFeeCents: number; setupCommissionCents: number; setupCommissionStatus: string | null;
};

/** Pedidos das lojas (pagos pelo cliente na competência) com margem do lojista e a taxa atribuída à NextLevel. */
export async function storeOrderControl(db: Database, actor: Actor, period: string) {
  need(actor);
  const { start, end } = periodBounds(period);
  const [storeRows, supplierRows, orderRows, acqRows, netRows] = await Promise.all([
    db.select().from(stores),
    db.select().from(suppliers),
    db.select().from(orders).where(and(eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), gte(orders.createdAt, start.toISOString()), lt(orders.createdAt, end.toISOString()))),
    db.select().from(storeAcquisitions),
    db.select().from(networks),
  ]);
  const book = await getPriceBook(db);
  const terms = new Map<string, ReturnType<typeof contractTerms>>();
  for (const s of supplierRows) terms.set(s.id, contractTerms(await ensureContract(db, s.id), s.businessModel));
  const rows: StoreControlRow[] = [];
  for (const st of storeRows) {
    const mine = orderRows.filter((o) => o.storeId === st.id);
    const acq = acqRows.find((a) => a.storeId === st.id);
    const sup = supplierRows.find((s) => s.id === netRows.find((n) => n.id === st.networkId)?.supplierId);
    const central = mine.filter((o) => o.centralPaymentStatus === "PAID");
    const fee = sup && terms.get(sup.id) ? volumeFee({ ...terms.get(sup.id)!, minMonthlyFeeCents: 0 }, { baseCents: central.reduce((t, o) => t + o.costTotalCents, 0), orders: central.length }).totalCents : 0;
    const sales = mine.reduce((t, o) => t + o.subtotalCents, 0), cost = mine.reduce((t, o) => t + o.costTotalCents, 0);
    if (!mine.length && !acq) continue;
    rows.push({ storeId: st.id, name: st.name, supplierName: sup?.name ?? (st.networkId ? "—" : "Loja independente (Commerce)"), offer: st.offer, orders: mine.length, salesCents: sales, costCents: cost, marginCents: sales - cost, nextlevelFeeCents: fee, memberFeeCents: (await storeOrderFeeFor(db, st.id, period, book)).feeCents, setupCommissionCents: acq?.commissionCents ?? 0, setupCommissionStatus: acq?.status ?? null });
  }
  rows.sort((a, b) => b.salesCents - a.salesCents);
  return { period, rows, totals: rows.reduce((t, r) => ({ orders: t.orders + r.orders, sales: t.sales + r.salesCents, margin: t.margin + r.marginCents, fee: t.fee + r.nextlevelFeeCents, memberFee: t.memberFee + r.memberFeeCents }), { orders: 0, sales: 0, margin: 0, fee: 0, memberFee: 0 }) };
}
