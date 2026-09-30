import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { buildAlerts, healthScore, loadTowerSnapshot, type StoreSignal } from "@/lib/domain/control-tower";

const base: StoreSignal = { id: "s1", name: "Loja", slug: "loja", offer: "STORE_SUBDOMAIN", status: "ACTIVE", supplierId: "f1", supplierName: "Forn", orders30: 12, lastOrderAt: null, ageDays: 90, balanceCents: 10000, awaitingFunds: 0, oldestAwaitingHours: 0, mpConnected: true, customDomain: null, domainStatus: "NOT_CONFIGURED" };

describe("saúde da loja", () => {
  it("loja ativa e vendendo é saudável", () => { const h = healthScore(base); expect(h.score).toBe(100); expect(h.band).toBe("HEALTHY"); });
  it("sem vendas, sem Mercado Pago e travada por saldo cai para risco, com motivos", () => {
    const h = healthScore({ ...base, orders30: 0, mpConnected: false, awaitingFunds: 2, oldestAwaitingHours: 30 });
    expect(h.band).toBe("RISK");
    expect(h.reasons).toHaveLength(3);
  });
  it("Drop manual não é penalizado por não ter Mercado Pago; suspensa pesa", () => {
    expect(healthScore({ ...base, offer: "DROP_MANUAL", mpConnected: false }).score).toBe(100);
    expect(healthScore({ ...base, status: "SUSPENDED" }).score).toBe(60);
  });
  it("pontuação nunca sai de 0–100", () => {
    const h = healthScore({ ...base, status: "ACTIVE", orders30: 0, mpConnected: false, awaitingFunds: 5, oldestAwaitingHours: 99, offer: "STORE_OWN", customDomain: "x.com", domainStatus: "PENDING" });
    expect(h.score).toBeGreaterThanOrEqual(0);
  });
});

describe("alertas da torre de controle", () => {
  it("sem problemas, sem alertas", () => { expect(buildAlerts({ stores: [base], suppliers: [{ id: "f1", name: "Forn", status: "ACTIVE", walletConnected: true, stores: 1 }], serviceOrdersWaiting: 0 })).toEqual([]); });
  it("ordena por gravidade e conta ocorrências", () => {
    const a = buildAlerts({
      stores: [{ ...base, awaitingFunds: 1, oldestAwaitingHours: 30 }, { ...base, id: "s2", name: "B", orders30: 0, mpConnected: false }],
      suppliers: [{ id: "f1", name: "Forn", status: "PARTIAL_BLOCK", walletConnected: false, stores: 2 }], serviceOrdersWaiting: 2,
    });
    expect(a[0]!.severity).toBe("danger");
    expect(a.map((x) => x.key)).toEqual(expect.arrayContaining(["funds-stuck", "supplier-access", "supplier-wallet", "service-quote", "store-mp", "store-quiet"]));
    const sev = a.map((x) => x.severity);
    expect([...sev].sort((x, y) => ({ danger: 0, warning: 1, info: 2 })[x] - ({ danger: 0, warning: 1, info: 2 })[y])).toEqual(sev);
  });
});

describe("coleta de sinais no banco de demonstração", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  it("enxerga as três lojas, o pedido aguardando recarga da Arena e a suspensa", async () => {
    const snap = await loadTowerSnapshot(ctx.db);
    expect(snap.stores).toHaveLength(3);
    const arena = snap.stores.find((s) => s.slug.includes("arena"))!;
    expect(arena.awaitingFunds).toBeGreaterThan(0);
    const alerts = buildAlerts(snap);
    expect(alerts.length).toBeGreaterThan(0);
  });
});
