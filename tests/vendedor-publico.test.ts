import { describe, expect, it } from "vitest";
import { assuntoDe, recomendarPlano, responder, responderTexto, type FatosVenda } from "@/lib/ia/vendedor-publico";

/** Vendedor 24h (D195): recomenda pelo custo real (mensalidade + taxa), usa só os fatos e entende o assunto. */
const fatos: FatosVenda = {
  marca: "NextLevel E-commerce", cadastro: "/cadastro", temasGratis: 4,
  planos: [
    { key: "COMMERCE_START", name: "Start", monthlyCents: 14900, feeBps: 100, quote: false },
    { key: "COMMERCE_PRO", name: "Pro", monthlyCents: 24900, feeBps: 70, quote: false },
    { key: "COMMERCE_SCALE", name: "Scale", monthlyCents: 49900, feeBps: 40, quote: false },
    { key: "COMMERCE_ENTERPRISE", name: "Enterprise", monthlyCents: null, feeBps: null, quote: true },
  ],
  oferta: { trialDays: 3, firstPeriodCents: 990, feeHolidayMonths: 3 },
  integracoes: [{ grupo: "frete", nomes: ["Melhor Envio", "Frenet"] }, { grupo: "gestao", nomes: ["Tiny", "Omie"] }],
};

describe("vendedor da home", () => {
  it("recomenda o plano mais barato para o volume, com a taxa incluída", () => {
    expect(recomendarPlano(fatos, 0)!.melhor.plano.key).toBe("COMMERCE_START");
    expect(recomendarPlano(fatos, 10_000_000)!.melhor.plano.key).toBe("COMMERCE_SCALE");
    const r = responder(fatos, "fx-100");
    expect(r.texto).toContain("**Scale**");
    expect(r.acoes[0]).toEqual({ rotulo: "Criar minha loja com este plano", href: "/cadastro?plano=COMMERCE_SCALE" });
  });

  it("preço vem dos planos e da oferta reais; Enterprise não ganha preço inventado", () => {
    const r = responder(fatos, "preco");
    expect(r.texto).toMatch(/Start: R\$\s*149,00\/mês \+ 1%/);
    expect(r.texto).toContain("3 dias grátis");
    expect(r.texto).not.toMatch(/Enterprise: R\$/);
  });

  it("entende o assunto da pergunta livre e não inventa quando não entende", () => {
    expect(assuntoDe("vocês integram com o Correios?")).toBe("frete");
    expect(assuntoDe("quanto custa por mês?")).toBe("preco");
    expect(assuntoDe("venho da Nuvemshop")).toBe("migrar");
    expect(assuntoDe("quero falar com um atendente")).toBe("pessoa");
    expect(responderTexto(fatos, "qual a capital da França?").assunto).toBe("nao-entendi");
  });
});
