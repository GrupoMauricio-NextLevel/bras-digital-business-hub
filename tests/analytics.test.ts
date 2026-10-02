import { describe, expect, it } from "vitest";
import { computeStoreAnalytics, type AnalyticsItem, type AnalyticsOrder } from "@/lib/domain/analytics";

const now = new Date("2026-03-30T15:00:00Z");
const o = (id: string, date: string, subtotal: number, cost: number, extra: Partial<AnalyticsOrder> = {}): AnalyticsOrder => ({ id, status: "DELIVERED", customerPaymentStatus: "PAID", channel: "ONLINE_STORE", customerEmail: `${id}@x.com`, subtotalCents: subtotal, costTotalCents: cost, createdAt: `${date}T12:00:00Z`, ...extra });

describe("analytics da loja", () => {
  it("soma vendas e margem da janela e ignora cancelados ou não pagos", () => {
    const a = computeStoreAnalytics([o("1", "2026-03-29", 12000, 8000), o("2", "2026-03-30", 12000, 8000), o("3", "2026-03-30", 5000, 3000, { status: "CANCELED" }), o("4", "2026-03-30", 9000, 4000, { customerPaymentStatus: "PENDING" })], [], now);
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
