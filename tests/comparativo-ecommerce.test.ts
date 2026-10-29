import { describe, expect, it } from "vitest";
import { CONCORRENTES, custosPorFaixa, degraus, melhorPlano, nextlevelComoPlataforma } from "@/lib/marcas/comparativo-ecommerce";

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
  it("com taxa zero (D220), a partir de R$ 3 mil por mês a NextLevel é a mais barata entre as comparáveis", () => {
    const nl0 = nextlevelComoPlataforma([{ name: "Start", monthlyCents: 5_700, feeBps: 0, quote: false }, { name: "Pro", monthlyCents: 14_700, feeBps: 0, quote: false }, { name: "Scale", monthlyCents: 34_700, feeBps: 0, quote: false }]);
    for (const f of [300_000, 1_000_000, 5_000_000, 10_000_000]) {
      const [l] = custosPorFaixa(nl0, [f]);
      expect(l!.outras.every((o) => o.melhor!.totalCents > l!.nextlevel!.totalCents)).toBe(true);
    }
  });
  it("mais barata em todos os degraus, no mensal e no anual (D220)", () => {
    for (const d of degraus([{ nome: "Start", mensalCents: 5_700, anualMesCents: 3_700 }, { nome: "Pro", mensalCents: 14_700, anualMesCents: 11_900 }, { nome: "Scale", mensalCents: 34_700, anualMesCents: 29_700 }])) {
      for (const o of d.outras) { expect(d.nextlevel!.mensalCents).toBeLessThan(o.mensalCents); expect(d.nextlevel!.anualMesCents).toBeLessThan(o.anualMesCents!); }
    }
  });
});
