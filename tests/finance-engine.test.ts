import { describe, it, expect } from "vitest";
import { ACCESS_CAPABILITIES, accessStateForOverdue, closeSupplierMonth, defaultContract, DEFAULT_SIM, isWaived, simulate, storeSetupCommission, volumeFee, type SimInput } from "@/lib/finance/engine";
import { DEFAULT_PRICE_BOOK as book } from "@/lib/finance/price-book";

const sd = defaultContract(book, "SUPERDROP");
const wl = defaultContract(book, "WHITE_LABEL");

describe("contratos de lista", () => {
  it("SuperDrop: mensalidade Growth, 3% e mínima de R$ 300, sem setup", () => {
    expect(sd).toMatchObject({ monthlyFeeCents: 99_700, volumeFeeBps: 300, minMonthlyFeeCents: 30_000, setupFeeCents: 0, storeSetupCommissionBps: 2500 });
  });
  it("White Label: setup de R$ 15.000, 1,5% e mínima de R$ 500", () => {
    expect(wl).toMatchObject({ setupFeeCents: 1_500_000, volumeFeeBps: 150, minMonthlyFeeCents: 50_000 });
  });
  it("isenção vale apenas antes da data limite", () => {
    const at = new Date("2026-10-01T00:00:00Z");
    expect(isWaived("2026-12-01T00:00:00Z", at)).toBe(true);
    expect(isWaived("2026-09-30T00:00:00Z", at)).toBe(false);
    expect(isWaived(null, at)).toBe(false);
  });
});

describe("taxa de volume", () => {
  it("3% sobre R$ 240.000 pagos à Central = R$ 7.200", () => {
    expect(volumeFee(sd, { baseCents: 24_000_000, orders: 0 })).toEqual({ percentCents: 720_000, perOrderCents: 0, minAdjustmentCents: 0, totalCents: 720_000 });
  });
  it("aplica o piso mensal quando o volume é baixo", () => {
    const f = volumeFee(sd, { baseCents: 500_000, orders: 0 });
    expect(f.percentCents).toBe(15_000);
    expect(f.minAdjustmentCents).toBe(15_000);
    expect(f.totalCents).toBe(30_000);
  });
  it("sem volume cobra o piso inteiro", () => {
    expect(volumeFee(sd, { baseCents: 0, orders: 0 }).totalCents).toBe(30_000);
  });
  it("soma taxa por pedido antes de decidir o complemento do piso", () => {
    const c = { ...wl, perOrderFeeCents: 200 };
    const f = volumeFee(c, { baseCents: 1_000_000, orders: 100 });
    expect(f.percentCents).toBe(15_000);
    expect(f.perOrderCents).toBe(20_000);
    expect(f.minAdjustmentCents).toBe(15_000);
    expect(f.totalCents).toBe(50_000);
  });
});

describe("comissão de canal", () => {
  it("25% do setup de R$ 2.000 = R$ 500", () => {
    expect(storeSetupCommission(200_000, 2500)).toBe(50_000);
  });
  it("arredonda ao centavo", () => {
    expect(storeSetupCommission(19_999, 2500)).toBe(5_000);
  });
});

describe("fechamento mensal", () => {
  const commissions = [{ label: "Loja A", cents: 50_000 }, { label: "Loja B", cents: 50_000 }];
  it("abate comissões da taxa de volume", () => {
    const c = closeSupplierMonth({ contract: sd, baseCents: 24_000_000, orders: 0, commissions });
    expect(c.fee.totalCents).toBe(720_000);
    expect(c.commissionCreditCents).toBe(100_000);
    expect(c.netCents).toBe(620_000);
    expect(c.carryOutCents).toBe(0);
    expect(c.lines.filter((l) => l.kind === "COMMISSION_CREDIT")).toHaveLength(2);
  });
  it("comissão maior que a taxa zera a fatura e vira saldo a favor", () => {
    const c = closeSupplierMonth({ contract: sd, baseCents: 500_000, orders: 0, commissions });
    expect(c.netCents).toBe(0);
    expect(c.carryOutCents).toBe(70_000);
    expect(c.lines.reduce((s, l) => s + l.amountCents, 0)).toBe(0);
    expect(c.lines.some((l) => l.kind === "CARRY_FORWARD" && l.amountCents === 70_000)).toBe(true);
  });
  it("saldo a favor anterior é consumido no mês seguinte", () => {
    const c = closeSupplierMonth({ contract: { ...sd, creditBalanceCents: 70_000 }, baseCents: 500_000, orders: 0, commissions: [] });
    expect(c.netCents).toBe(0);
    expect(c.carryOutCents).toBe(40_000);
  });
  it("saldo em débito é cobrado", () => {
    const c = closeSupplierMonth({ contract: { ...sd, creditBalanceCents: -20_000 }, baseCents: 500_000, orders: 0, commissions: [] });
    expect(c.netCents).toBe(50_000);
    expect(c.lines.some((l) => l.kind === "BALANCE_ADJUSTMENT" && l.amountCents === 20_000)).toBe(true);
  });
  it("as linhas somam o valor da fatura", () => {
    const c = closeSupplierMonth({ contract: sd, baseCents: 24_000_000, orders: 0, commissions });
    expect(c.lines.reduce((s, l) => s + l.amountCents, 0)).toBe(c.netCents);
  });
});

describe("acesso por inadimplência", () => {
  const r = book.dunning;
  it("estados por dias de atraso", () => {
    expect(accessStateForOverdue(0, r)).toBe("ACTIVE");
    expect(accessStateForOverdue(1, r)).toBe("WARNING");
    expect(accessStateForOverdue(10, r)).toBe("PARTIAL_BLOCK");
    expect(accessStateForOverdue(15, r)).toBe("SUSPENDED");
    expect(accessStateForOverdue(30, r)).toBe("CLOSED");
  });
  it("bloqueio parcial impede pedidos e lojas novas mas mantém a expedição", () => {
    expect(ACCESS_CAPABILITIES.PARTIAL_BLOCK).toMatchObject({ canCreateOrders: false, canCreateStores: false, canExpedite: true, canLogin: true });
  });
  it("suspenso ainda entra para pagar; encerrado não", () => {
    expect(ACCESS_CAPABILITIES.SUSPENDED.canLogin).toBe(true);
    expect(ACCESS_CAPABILITIES.SUSPENDED.canExpedite).toBe(false);
    expect(ACCESS_CAPABILITIES.CLOSED.canLogin).toBe(false);
  });
});

describe("simulador", () => {
  const base: SimInput = { ...DEFAULT_SIM, months: 12, churnBps: 0, templateAttachBps: 0, serviceAttachBps: 0, mix: { DROP_MANUAL: 0, STORE_SUBDOMAIN: 0, STORE_OWN: 100 }, suppliers: [{ name: "F1", model: "SUPERDROP", tier: "GROWTH", waived: false, startingStores: 10, newStoresPerMonth: 0, volumePerStoreCents: 600_000 }] };

  it("mês 1 de um fornecedor estável bate com o cálculo manual", () => {
    const m = simulate(base, book).months[0]!;
    expect(m.revenue.supplierMonthly).toBe(99_700);
    expect(m.revenue.volumeFee).toBe(1_800_000 / 10);
    expect(m.revenue.storeMonthly).toBe(197_000);
    expect(m.grossRevenue).toBe(99_700 + 180_000 + 197_000);
    expect(m.costs).toBe(9_534 + 8_000 + 50_000);
    expect(m.net).toBe(476_700 - 67_534);
  });

  it("fornecedor isento não paga mensalidade nos 3 primeiros meses", () => {
    const r = simulate({ ...base, suppliers: [{ ...base.suppliers[0]!, waived: true }] }, book);
    expect(r.months.slice(0, 3).every((x) => x.revenue.supplierMonthly === 0)).toBe(true);
    expect(r.months[3]!.revenue.supplierMonthly).toBe(99_700);
    expect(r.months[0]!.revenue.volumeFee).toBe(180_000);
  });

  it("lojas novas geram setup e a comissão de 25% ao fornecedor", () => {
    const r = simulate({ ...base, suppliers: [{ ...base.suppliers[0]!, startingStores: 0, newStoresPerMonth: 4 }] }, book);
    expect(r.months[0]!.revenue.storeSetup).toBe(800_000);
    expect(r.months[0]!.commissions).toBe(200_000);
    expect(r.payoutToSuppliers).toBe(200_000 * 12);
  });

  it("White Label cobra setup de R$ 15.000 no mês 1 salvo isenção", () => {
    const s = { ...base.suppliers[0]!, model: "WHITE_LABEL" as const };
    expect(simulate({ ...base, suppliers: [s] }, book).months[0]!.supplierSetup).toBe(1_500_000);
    expect(simulate({ ...base, suppliers: [{ ...s, waived: true }] }, book).months[0]!.supplierSetup).toBe(0);
  });

  it("churn reduz a base e o total acumulado é a soma mensal", () => {
    const r = simulate({ ...base, churnBps: 500 }, book);
    expect(r.months[11]!.stores).toBeLessThan(r.months[0]!.stores);
    expect(r.totals.net).toBe(r.months.reduce((s, m) => s + m.net, 0));
    expect(r.months[11]!.cumulativeNet).toBe(r.totals.net);
  });

  it("dois fornecedores dobram a receita de um", () => {
    const one = simulate(base, book).months[0]!;
    const two = simulate({ ...base, suppliers: [base.suppliers[0]!, base.suppliers[0]!] }, book).months[0]!;
    expect(two.grossRevenue).toBe(one.grossRevenue * 2);
  });

  it("mix que não soma 100 é normalizado", () => {
    const a = simulate({ ...base, mix: { DROP_MANUAL: 0, STORE_SUBDOMAIN: 0, STORE_OWN: 100 } }, book).months[0]!;
    const b = simulate({ ...base, mix: { DROP_MANUAL: 0, STORE_SUBDOMAIN: 0, STORE_OWN: 5 } }, book).months[0]!;
    expect(b.revenue.storeMonthly).toBe(a.revenue.storeMonthly);
  });
});
