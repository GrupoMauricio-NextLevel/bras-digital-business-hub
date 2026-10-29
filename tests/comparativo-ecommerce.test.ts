import { describe, expect, it } from "vitest";
import { CONCORRENTES, FAT_REFERENCIA_CENTS, custosPorFaixa, degraus, melhorPlano, nextlevelComoPlataforma, taxasNoMercadoPago } from "@/lib/marcas/comparativo-ecommerce";

// Preços dos planos da NextLevel em 2026-10-29 (no site vêm do Master).
const nl = nextlevelComoPlataforma([{ name: "Start", monthlyCents: 14_900, feeBps: 100, quote: false }, { name: "Pro", monthlyCents: 24_900, feeBps: 70, quote: false }, { name: "Scale", monthlyCents: 49_900, feeBps: 40, quote: false }, { name: "Enterprise", monthlyCents: null, feeBps: null, quote: true }]);
const pl = (k: string) => CONCORRENTES.find((c) => c.key === k)!;

describe("comparativo da E-commerce (D219)", () => {
  it("escolhe o plano mais barato que comporta o faturamento", () => {
    expect(melhorPlano(nl, 5_000_000)).toEqual({ nome: "Pro", totalCents: 59_900 });
    expect(melhorPlano(pl("nuvemshop"), 5_000_000)).toEqual({ nome: "Impulso", totalCents: 66_400 });
    expect(melhorPlano(pl("tray"), 5_000_000)).toEqual({ nome: "Crescimento", totalCents: 65_900 });
  });
  it("dólar fica fora da conta; Loja Integrada e WBuy entram com a tarifa no Mercado Pago", () => {
    expect(melhorPlano(pl("shopify"), 5_000_000)).toBeNull();
    expect(melhorPlano(pl("loja-integrada"), 5_000_000)).toEqual({ nome: "Aceleração", totalCents: 53_300 });
    expect(melhorPlano(pl("wbuy"), 5_000_000)).toEqual({ nome: "Turbo", totalCents: 77_400 });
  });
  it("todas as comparadas cobram tarifa quando o lojista usa o Mercado Pago", () => {
    const t = taxasNoMercadoPago();
    expect(t.map((x) => x.key)).toEqual(["nuvemshop", "loja-integrada", "wbuy", "tray", "shopify"]);
    expect(t.every((x) => x.maxBps > 0)).toBe(true);
  });
  it("com taxa zero (D220), a partir de R$ 3 mil por mês a NextLevel é a mais barata entre as comparáveis", () => {
    const nl0 = nextlevelComoPlataforma([{ name: "Start", monthlyCents: 5_700, feeBps: 0, quote: false }, { name: "Pro", monthlyCents: 14_700, feeBps: 0, quote: false }, { name: "Scale", monthlyCents: 34_700, feeBps: 0, quote: false }]);
    for (const f of [300_000, 1_000_000, 5_000_000, 10_000_000]) {
      const [l] = custosPorFaixa(nl0, [f]);
      expect(l!.outras.every((o) => o.melhor!.totalCents > l!.nextlevel!.totalCents)).toBe(true);
    }
  });
  it("contra quatro plataformas, plano a plano, o custo total da NextLevel é menor para quem vende R$ 30 mil por mês (D220)", () => {
    expect(FAT_REFERENCIA_CENTS).toBe(3_000_000);
    const ds = degraus([{ nome: "Start", mensalCents: 5_700, anualMesCents: 3_700 }, { nome: "Pro", mensalCents: 14_700, anualMesCents: 11_900 }, { nome: "Scale", mensalCents: 34_700, anualMesCents: 29_700 }]);
    for (const d of ds) {
      expect(d.outras.map((o) => o.nome)).toEqual(["Nuvemshop", "Loja Integrada", "WBuy", "Tray"]);
      for (const o of d.outras) expect(d.nextlevel!.totalCents).toBeLessThan(o.totalCents);
    }
  });
});
