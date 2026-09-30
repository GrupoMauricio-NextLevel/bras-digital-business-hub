import { describe, expect, it } from "vitest";
import { estimateSale } from "@/lib/portal/calculator";

describe("calculadora do portal", () => {
  it("exemplo do dono: cliente paga 100, membro paga 70 ao fornecedor", () => {
    const a = estimateSale({ customerPaysCents: 10000, memberPaysSupplierCents: 7000, storeType: "STORE_SUBDOMAIN", supplierPlan: "SUPERDROP" });
    expect(a.memberFeeCents).toBe(500);      // 5% de 100
    expect(a.supplierFeeCents).toBe(210);    // 3% de 70
    expect(a.memberNetCents).toBe(2500);     // 100 - 70 - 5
    expect(a.supplierReceivesCents).toBe(6790);
    expect(a.memberMarginPercent).toBe(25);
  });
  it("Loja própria paga 3% e White Label 1,5%", () => {
    const a = estimateSale({ customerPaysCents: 12000, memberPaysSupplierCents: 8000, storeType: "STORE_OWN", supplierPlan: "WHITE_LABEL" });
    expect(a.memberFeeCents).toBe(360); expect(a.supplierFeeCents).toBe(120);
  });
  it("Drop manual paga 5% como a loja básica", () => {
    expect(estimateSale({ customerPaysCents: 10000, memberPaysSupplierCents: 7000, storeType: "DROP_MANUAL", supplierPlan: "SUPERDROP" }).memberFeeCents).toBe(500);
  });
  it("aceita prejuízo e valores inválidos sem quebrar", () => {
    const a = estimateSale({ customerPaysCents: 5000, memberPaysSupplierCents: 8000, storeType: "STORE_SUBDOMAIN", supplierPlan: "SUPERDROP" });
    expect(a.memberNetCents).toBeLessThan(0);
    expect(estimateSale({ customerPaysCents: -5, memberPaysSupplierCents: 0, storeType: "STORE_OWN", supplierPlan: "SUPERDROP" }).memberMarginPercent).toBe(0);
  });
});
