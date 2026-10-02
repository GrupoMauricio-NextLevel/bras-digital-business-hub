import { describe, expect, it } from "vitest";
import { computeStoreAnalytics, type AnalyticsItem, type AnalyticsOrder } from "@/lib/domain/analytics";

const now = new Date("2026-03-30T15:00:00Z");
const o = (id: string, date: string, subtotal: number, cost: number, extra: Partial<AnalyticsOrder> = {}): AnalyticsOrder => ({ id, status: "DELIVERED", customerPaymentStatus: "PAID", channel: "ONLINE_STORE", customerEmail: `${id}@x.com`, subtotalCents: subtotal, discountCents: 0, costTotalCents: cost, createdAt: `${date}T12:00:00Z`, ...extra });

describe("analytics da loja", () => {
  it("soma vendas e margem da janela e ignora cancelados", () => {
    const a = computeStoreAnalytics([o("1", "2026-03-29", 12000, 8000), o("2", "2026-03-30", 12000, 8000), o("3", "2026-03-30", 5000, 3000, { status: "CANCELED" })], [], now);
    expect(a.salesCents).toBe(24000); expect(a.marginCents).toBe(8000); expect(a.marginPercent).toBe(33.3); expect(a.orders).toBe(2); expect(a.avgTicketCents).toBe(12000);
    expect(a.days).toHaveLength(30); expect(a.days.at(-1)).toMatchObject({ date: "2026-03-30", salesCents: 12000, orders: 1 });
  });
  it("compara com o período anterior", () => {
    const a = computeStoreAnalytics([o("1", "2026-03-20", 20000, 10000), o("2", "2026-02-10", 10000, 5000)], [], now);
    expect(a.previousSalesCents).toBe(10000); expect(a.changePercent).toBe(100);
    expect(computeStoreAnalytics([o("1", "2026-03-20", 20000, 10000)], [], now).changePercent).toBeNull();
  });
  it("agrupa canais, produtos campeões e clientes recorrentes", () => {
    const orders = [o("1", "2026-03-10", 12000, 8000, { customerEmail: "A@x.com" }), o("2", "2026-03-11", 12000, 8000, { customerEmail: "a@x.com", channel: "WHATSAPP" }), o("3", "2026-03-12", 12000, 8000)];
    const items: AnalyticsItem[] = orders.map((x) => ({ orderId: x.id, productName: x.id === "3" ? "Camisa B" : "Camisa A", quantity: 1, lineTotalCents: 12000, unitCostCents: 8000 }));
    const a = computeStoreAnalytics(orders, items, now);
    expect(a.byChannel.map((c) => c.channel)).toEqual(["ONLINE_STORE", "WHATSAPP"]);
    expect(a.topProducts[0]).toMatchObject({ name: "Camisa A", units: 2, marginCents: 8000 });
    expect(a.repeatCustomers).toBe(1); expect(a.totalCustomers).toBe(2); expect(a.repeatRate).toBe(50);
  });
  it("não quebra sem pedidos", () => {
    const a = computeStoreAnalytics([], [], now);
    expect(a.salesCents).toBe(0); expect(a.marginPercent).toBe(0); expect(a.avgTicketCents).toBe(0); expect(a.repeatRate).toBe(0);
  });
});

describe("estado e mapa de calor", () => {
  const base = { channel: "ONLINE_STORE", subtotalCents: 10_000, discountCents: 0, costTotalCents: 6_000, status: "PAID", customerPaymentStatus: "PAID" };
  it("agrupa vendas e clientes por UF e ignora pedidos sem estado", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const a = computeStoreAnalytics([
      { ...base, id: "1", customerEmail: "a@x.com", createdAt: "2026-06-10T15:00:00Z", shippingState: "sp" },
      { ...base, id: "2", customerEmail: "a@x.com", createdAt: "2026-06-11T15:00:00Z", shippingState: "SP" },
      { ...base, id: "3", customerEmail: "b@x.com", createdAt: "2026-06-12T15:00:00Z", shippingState: "MG", subtotalCents: 5_000 },
      { ...base, id: "4", customerEmail: "c@x.com", createdAt: "2026-06-12T15:00:00Z", shippingState: null },
    ], [], now);
    expect(a.byState).toEqual([{ state: "SP", orders: 2, salesCents: 20_000, customers: 1 }, { state: "MG", orders: 1, salesCents: 5_000, customers: 1 }]);
  });
  it("mapa de calor usa o horário de Brasília e acha o pico", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    // 2026-06-10 é quarta; 15:00Z = 12h em Brasília
    const a = computeStoreAnalytics([
      { ...base, id: "1", customerEmail: "a@x.com", createdAt: "2026-06-10T15:00:00Z" },
      { ...base, id: "2", customerEmail: "b@x.com", createdAt: "2026-06-10T15:30:00Z" },
      { ...base, id: "3", customerEmail: "c@x.com", createdAt: "2026-06-11T02:00:00Z" },
    ], [], now);
    expect(a.heatmap.grid[3]![12]).toBe(2);
    expect(a.heatmap.grid[3]![23]).toBe(1);
    expect(a.heatmap.peak).toEqual({ weekday: 3, hour: 12, orders: 2 });
    expect(a.heatmap.max).toBe(2);
  });
});

describe("contrato único de venda (Onda 5)", () => {
  it("pedido pendente, estornado ou cancelado não entra em vendas nem margem; frete fica de fora", () => {
    const now = new Date("2026-03-30T18:00:00Z");
    const a = computeStoreAnalytics([
      o("pago", "2026-03-30", 10000, 6000),
      o("pendente", "2026-03-30", 9000, 5000, { customerPaymentStatus: "PENDING" }),
      o("estornado", "2026-03-30", 8000, 4000, { customerPaymentStatus: "REFUNDED" }),
      o("cancelado", "2026-03-30", 7000, 3000, { status: "CANCELED" }),
    ], [], now);
    expect(a.orders).toBe(1);
    expect(a.salesCents).toBe(10000);
    expect(a.marginCents).toBe(4000);
  });
});
