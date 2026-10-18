import { describe, expect, it } from "vitest";
import { filaDoLojista, pedidosParados, type EntradaFila } from "@/lib/domain/fila-do-dia";

const now = new Date("2026-10-17T12:00:00.000Z");
const horasAtras = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
const pedido = (status: string, h: number, extra: Partial<{ customerPaymentStatus: string; costTotalCents: number }> = {}) => ({ status, createdAt: horasAtras(h), customerPaymentStatus: "PAID", costTotalCents: 5_000, ...extra });

const base: EntradaFila = {
  commerce: true, independent: true, published: true, readinessMissing: [], onboarding: { percent: 100, missing: 0 },
  pendingCustomer: [], pendingCentral: [], pendingLabel: [], inProgress: [], inTransit: [], balanceCents: 0, stockBack: 0, now,
};

describe("fila do dia do lojista (D166)", () => {
  it("loja em dia não tem fila", () => {
    expect(filaDoLojista(base)).toEqual([]);
  });

  it("E-commerce: configuração vem antes da operação e nunca fala de saldo, Central ou etiqueta da Central", () => {
    const fila = filaDoLojista({ ...base, published: false, readinessMissing: [{ label: "Forma de pagamento", detail: "Conecte o Mercado Pago.", fixHref: "/merchant/settings" }],
      inProgress: [pedido("READY_TO_PICK", 2)], pendingCustomer: [pedido("PENDING", 1, { customerPaymentStatus: "PENDING" })] });
    expect(fila.map((i) => i.key)).toEqual(["readiness", "publish", "customer", "progress"]);
    const texto = JSON.stringify(fila);
    expect(texto).not.toMatch(/Central|saldo|recarg/i);
  });

  it("conta os pedidos parados com a mesma régua do pós-venda", () => {
    const e = { ...base, pendingCustomer: [pedido("PENDING", 30, { customerPaymentStatus: "PENDING" }), pedido("PENDING", 2, { customerPaymentStatus: "PENDING" })], inProgress: [pedido("PICKING", 60)], inTransit: [pedido("SHIPPED", 24 * 8), pedido("SHIPPED", 24)] };
    expect(pedidosParados(e)).toBe(3);
    const late = filaDoLojista(e).find((i) => i.key === "late")!;
    expect(late).toMatchObject({ count: 3, tone: "danger", href: "/merchant/after-sales", title: "Pedidos parados além do normal" });
    expect(late.detail).not.toMatch(/Central/);
  });

  it("tamanho de volta ao estoque com cliente esperando vira ação de avisar", () => {
    const fila = filaDoLojista({ ...base, stockBack: 1 });
    expect(fila).toEqual([expect.objectContaining({ key: "stock", title: "Tamanho voltou ao estoque", href: "/merchant/avise-me", action: "Avisar clientes" })]);
  });

  it("SuperDrop: saldo curto é o primeiro item, com o valor que falta", () => {
    const fila = filaDoLojista({ ...base, commerce: false, independent: false, balanceCents: 2_000, pendingCentral: [pedido("AWAITING_CENTRAL_PAYMENT", 3)], pendingLabel: [pedido("AWAITING_LABEL", 1)] });
    expect(fila.map((i) => i.key)).toEqual(["funds", "labels"]);
    expect(fila[0]).toMatchObject({ title: "Saldo insuficiente para liberar pedidos", action: "Recarregar", tone: "danger" });
    expect(fila[0]!.detail).toMatch(/Faltam R\$\s?30,00/);
  });

  it("SuperDrop com saldo suficiente não pede recarga", () => {
    const [funds] = filaDoLojista({ ...base, commerce: false, independent: false, balanceCents: 9_000, pendingCentral: [pedido("AWAITING_CENTRAL_PAYMENT", 3)] });
    expect(funds).toMatchObject({ title: "Pedidos aguardando liberação", action: "Ver saldo", tone: "warning" });
  });
});
