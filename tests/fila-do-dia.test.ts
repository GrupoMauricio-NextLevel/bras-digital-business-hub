import { describe, expect, it } from "vitest";
import { filaDaTransportadora, filaDoLojista, filaDoMembroBras, pedidosParados, pulsoDaLoja, type EntradaFila } from "@/lib/domain/fila-do-dia";
import { textoConvite } from "@/lib/parceiros/convite";

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

describe("fila do dia do membro da Brás e da transportadora (D168)", () => {
  it("membro: pagamento pendente vem antes de retirada e descobertas; cadastro em análise aparece primeiro", () => {
    const fila = filaDoMembroBras({ ativo: true, respostas: 0, novas: 2, pedidos: [{ status: "PAID" }, { status: "CONFIRMED" }, { status: "CONFIRMED" }, { status: "PICKED_UP" }] });
    expect(fila.map((i) => i.key)).toEqual(["pagar", "retirar", "novas"]);
    expect(fila[0]).toMatchObject({ count: 2, tone: "danger", title: "Pedidos confirmados: falta o pagamento" });
    expect(filaDoMembroBras({ ativo: false, respostas: 1, novas: 0, pedidos: [] }).map((i) => i.key)).toEqual(["cadastro", "respostas"]);
    expect(filaDoMembroBras({ ativo: true, respostas: 0, novas: 0, pedidos: [{ status: "PICKED_UP" }, { status: "CANCELED" }] })).toEqual([]);
  });

  it("transportadora: chamadas e Pix a devolver primeiro, cada item leva ao bloco da tela", () => {
    const fila = filaDaTransportadora({ chamadas: 2, coletar: 1, transito: 3, fixasHoje: 1, pagarNaChegada: 0, devolver: 1, semLinkMotorista: true });
    expect(fila.map((i) => i.key)).toEqual(["chamadas", "devolver", "fixas", "coletar", "transito", "motorista"]);
    expect(fila.find((i) => i.key === "chamadas")).toMatchObject({ href: "#t-cham", tone: "danger", title: "Chamadas para responder" });
    expect(filaDaTransportadora({ chamadas: 0, coletar: 0, transito: 0, fixasHoje: 0, pagarNaChegada: 0, devolver: 0, semLinkMotorista: false })).toEqual([]);
  });
});

describe("convite do parceiro (D168)", () => {
  it("usa a marca do endereço, nunca SuperDrop fixo, e não promete prazo de teste", () => {
    const ec = { name: "NextLevel E-commerce", tagline: "A loja virtual feita para quem vende moda no Brasil" };
    expect(textoConvite(ec, "https://x/r/ana")).toBe("Conheça NextLevel E-commerce: A loja virtual feita para quem vende moda no Brasil. Teste aqui: https://x/r/ana");
    const cupom = textoConvite(ec, "https://x/r/ana?c=ANA10", "ANA10");
    expect(cupom).toContain("cupom ANA10");
    expect(cupom).not.toMatch(/SuperDrop|7 dias/);
  });
});

describe("pulso da loja (D169)", () => {
  const base = { hoje: { salesCents: 0, orders: 0 }, parados: 0, commerce: true, faltaParaVender: 0, publicada: true, precisaRecarga: false };
  it("E-commerce: o que falta para vender vem antes de tudo; em dia quando nada falta", () => {
    expect(pulsoDaLoja({ ...base, faltaParaVender: 2, parados: 3 }).situacao).toEqual({ rotulo: "Faltam 2 itens para vender", tom: "warning" });
    expect(pulsoDaLoja({ ...base, publicada: false }).situacao.rotulo).toBe("Vitrine não publicada");
    expect(pulsoDaLoja(base).situacao).toEqual({ rotulo: "Loja em dia", tom: "success" });
    expect(JSON.stringify(pulsoDaLoja({ ...base, faltaParaVender: 1 }))).not.toMatch(/recarga|Central/i);
  });
  it("SuperDrop: recarga é vermelha; vendas de hoje e parados com rótulo certo", () => {
    const p = pulsoDaLoja({ ...base, commerce: false, precisaRecarga: true, parados: 1, hoje: { salesCents: 12_990, orders: 2 } });
    expect(p.situacao).toEqual({ rotulo: "Recarga necessária", tom: "danger" });
    expect(p.hoje).toEqual({ salesCents: 12_990, rotulo: "2 vendas hoje" });
    expect(p.parados).toEqual({ count: 1, rotulo: "1 pedido parado" });
    expect(pulsoDaLoja({ ...base, commerce: false }).hoje.rotulo).toBe("Nenhuma venda hoje ainda");
  });
});
