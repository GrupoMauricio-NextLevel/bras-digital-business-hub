import { describe, expect, it } from "vitest";
import { CONCORRENTES, custosPorFaixa, melhorPlano, nextlevelComoPlataforma } from "@/lib/marcas/comparativo-ecommerce";

// Preços dos planos da NextLevel em 2026-10-29 (no site vêm do Master).
const nl = nextlevelComoPlataforma([{ name: "Start", monthlyCents: 14_900, feeBps: 100, quote: false }, { name: "Pro", monthlyCents: 24_900, feeBps: 70, quote: false }, { name: "Scale", monthlyCents: 49_900, feeBps: 40, quote: false }, { name: "Enterprise", monthlyCents: null, feeBps: null, quote: true }]);
const pl = (k: string) => CONCORRENTES.find((c) => c.key === k)!;

describe("comparativo da E-commerce (D219)", () => {
  it("escolhe o plano mais barato que comporta o faturamento", () => {
    expect(melhorPlano(nl, 5_000_000)).toEqual({ nome: "Pro", totalCents: 59_900 });
    expect(melhorPlano(pl("nuvemshop"), 5_000_000)).toEqual({ nome: "Impulso", totalCents: 66_400 });
    expect(melhorPlano(pl("tray"), 5_000_000)).toEqual({ nome: "Crescimento", totalCents: 65_900 });
  });
  it("dólar e tarifa não divulgada ficam fora da conta", () => {
    expect(melhorPlano(pl("shopify"), 5_000_000)).toBeNull();
    expect(melhorPlano(pl("loja-integrada"), 5_000_000)).toBeNull();
  });
  it("a partir de R$ 30 mil por mês a NextLevel é a mais barata entre as comparáveis; abaixo disso, não sempre", () => {
    for (const f of [3_000_000, 5_000_000, 10_000_000, 20_000_000]) {
      const [linha] = custosPorFaixa(nl, [f]);
      expect(linha!.outras.every((o) => o.melhor!.totalCents > linha!.nextlevel!.totalCents)).toBe(true);
    }
    const [dez] = custosPorFaixa(nl, [1_000_000]);
    expect(dez!.outras.some((o) => o.melhor!.totalCents < dez!.nextlevel!.totalCents)).toBe(true);
  });
});
