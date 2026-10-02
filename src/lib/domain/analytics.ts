/** Análise de vendas do lojista: funções puras sobre pedidos e itens já carregados. */
export type AnalyticsOrder = { id: string; status: string; customerPaymentStatus: string; channel: string; customerEmail: string; subtotalCents: number; costTotalCents: number; createdAt: string };
export type AnalyticsItem = { orderId: string; productName: string; quantity: number; lineTotalCents: number; unitCostCents: number };

export type StoreAnalytics = {
  days: { label: string; date: string; salesCents: number; orders: number }[];
  salesCents: number; marginCents: number; marginPercent: number; orders: number; avgTicketCents: number;
  byChannel: { channel: string; orders: number; salesCents: number }[];
  topProducts: { name: string; units: number; salesCents: number; marginCents: number }[];
  repeatCustomers: number; totalCustomers: number; repeatRate: number;
  previousSalesCents: number; changePercent: number | null;
};

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Vendas válidas: apenas pedidos pagos e não cancelados. Janela em dias corridos até `now` (UTC). */
export function computeStoreAnalytics(orders: AnalyticsOrder[], items: AnalyticsItem[], now: Date, windowDays = 30): StoreAnalytics {
  const start = new Date(now.getTime() - (windowDays - 1) * DAY); start.setUTCHours(0, 0, 0, 0);
  const prevStart = new Date(start.getTime() - windowDays * DAY);
  const valid = orders.filter((o) => o.status !== "CANCELED" && o.customerPaymentStatus === "PAID");
  const inWindow = valid.filter((o) => new Date(o.createdAt) >= start);
  const previous = valid.filter((o) => { const t = new Date(o.createdAt); return t >= prevStart && t < start; });

  const days = Array.from({ length: windowDays }, (_, i) => { const d = new Date(start.getTime() + i * DAY); return { date: dayKey(d), label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, salesCents: 0, orders: 0 }; });
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const o of inWindow) { const d = byDate.get(o.createdAt.slice(0, 10)); if (d) { d.salesCents += o.subtotalCents; d.orders += 1; } }

  const salesCents = inWindow.reduce((s, o) => s + o.subtotalCents, 0);
  const marginCents = inWindow.reduce((s, o) => s + o.subtotalCents - o.costTotalCents, 0);
  const previousSalesCents = previous.reduce((s, o) => s + o.subtotalCents, 0);

  const channels = new Map<string, { orders: number; salesCents: number }>();
  for (const o of inWindow) { const c = channels.get(o.channel) ?? { orders: 0, salesCents: 0 }; c.orders += 1; c.salesCents += o.subtotalCents; channels.set(o.channel, c); }

  const ids = new Set(inWindow.map((o) => o.id));
  const prods = new Map<string, { units: number; salesCents: number; marginCents: number }>();
  for (const it of items) { if (!ids.has(it.orderId)) continue; const p = prods.get(it.productName) ?? { units: 0, salesCents: 0, marginCents: 0 }; p.units += it.quantity; p.salesCents += it.lineTotalCents; p.marginCents += it.lineTotalCents - it.unitCostCents * it.quantity; prods.set(it.productName, p); }

  const perCustomer = new Map<string, number>();
  for (const o of inWindow) { const k = o.customerEmail.trim().toLowerCase(); perCustomer.set(k, (perCustomer.get(k) ?? 0) + 1); }
  const repeatCustomers = [...perCustomer.values()].filter((n) => n > 1).length;

  return {
    days, salesCents, marginCents, marginPercent: salesCents ? Math.round((marginCents / salesCents) * 1000) / 10 : 0,
    orders: inWindow.length, avgTicketCents: inWindow.length ? Math.round(salesCents / inWindow.length) : 0,
    byChannel: [...channels].map(([channel, v]) => ({ channel, ...v })).sort((a, b) => b.salesCents - a.salesCents),
    topProducts: [...prods].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.salesCents - a.salesCents).slice(0, 5),
    repeatCustomers, totalCustomers: perCustomer.size, repeatRate: perCustomer.size ? Math.round((repeatCustomers / perCustomer.size) * 100) : 0,
    previousSalesCents, changePercent: previousSalesCents ? Math.round(((salesCents - previousSalesCents) / previousSalesCents) * 100) : null,
  };
}
