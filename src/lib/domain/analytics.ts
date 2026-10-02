/** Análise de vendas do lojista: funções puras sobre pedidos e itens já carregados. */
export type AnalyticsOrder = { id: string; status: string; customerPaymentStatus: string; channel: string; customerEmail: string; subtotalCents: number; costTotalCents: number; createdAt: string; shippingState?: string | null };
export type AnalyticsItem = { orderId: string; productName: string; quantity: number; lineTotalCents: number; unitCostCents: number };

export type StoreAnalytics = {
  days: { label: string; date: string; salesCents: number; orders: number }[];
  salesCents: number; marginCents: number; marginPercent: number; orders: number; avgTicketCents: number;
  byChannel: { channel: string; orders: number; salesCents: number }[];
  topProducts: { name: string; units: number; salesCents: number; marginCents: number }[];
  repeatCustomers: number; totalCustomers: number; repeatRate: number;
  previousSalesCents: number; changePercent: number | null;
  /** Vendas e clientes por estado de entrega (UF), do maior para o menor. */
  byState: { state: string; orders: number; salesCents: number; customers: number }[];
  /** Pedidos por dia da semana (0 = domingo) e hora (0–23), no fuso de Brasília. */
  heatmap: { grid: number[][]; max: number; peak: { weekday: number; hour: number; orders: number } | null };
};

/**
 * Contrato único de "venda" (painel inicial, análise e exportações):
 * pedido NÃO cancelado e com pagamento do cliente CONFIRMADO (não conta pedido pendente nem estornado).
 * O valor da venda é o subtotal dos produtos (sem frete); margem = subtotal − custo dos produtos.
 */
export const isEligibleSale = (o: { status: string; customerPaymentStatus: string }) => o.status !== "CANCELED" && o.customerPaymentStatus === "PAID";

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Vendas elegíveis (`isEligibleSale`). Janela em dias corridos até `now` (UTC). */
export function computeStoreAnalytics(orders: AnalyticsOrder[], items: AnalyticsItem[], now: Date, windowDays = 30): StoreAnalytics {
  const start = new Date(now.getTime() - (windowDays - 1) * DAY); start.setUTCHours(0, 0, 0, 0);
  const prevStart = new Date(start.getTime() - windowDays * DAY);
  const valid = orders.filter(isEligibleSale);
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

  const states = new Map<string, { orders: number; salesCents: number; customers: Set<string> }>();
  for (const o of inWindow) { const uf = (o.shippingState ?? "").trim().toUpperCase().slice(0, 2); if (!uf) continue; const c = states.get(uf) ?? { orders: 0, salesCents: 0, customers: new Set<string>() }; c.orders += 1; c.salesCents += o.subtotalCents; c.customers.add(o.customerEmail.trim().toLowerCase()); states.set(uf, c); }
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const o of inWindow) { const br = new Date(new Date(o.createdAt).getTime() - 3 * 3_600_000); grid[br.getUTCDay()]![br.getUTCHours()]! += 1; }
  let peak: StoreAnalytics["heatmap"]["peak"] = null; let max = 0;
  grid.forEach((row, weekday) => row.forEach((n, hour) => { if (n > max) { max = n; peak = { weekday, hour, orders: n }; } }));

  return {
    days, salesCents, marginCents, marginPercent: salesCents ? Math.round((marginCents / salesCents) * 1000) / 10 : 0,
    orders: inWindow.length, avgTicketCents: inWindow.length ? Math.round(salesCents / inWindow.length) : 0,
    byChannel: [...channels].map(([channel, v]) => ({ channel, ...v })).sort((a, b) => b.salesCents - a.salesCents),
    topProducts: [...prods].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.salesCents - a.salesCents).slice(0, 5),
    repeatCustomers, totalCustomers: perCustomer.size, repeatRate: perCustomer.size ? Math.round((repeatCustomers / perCustomer.size) * 100) : 0,
    byState: [...states].map(([state, v]) => ({ state, orders: v.orders, salesCents: v.salesCents, customers: v.customers.size })).sort((a, b) => b.salesCents - a.salesCents),
    heatmap: { grid, max, peak },
    previousSalesCents, changePercent: previousSalesCents ? Math.round(((salesCents - previousSalesCents) / previousSalesCents) * 100) : null,
  };
}
