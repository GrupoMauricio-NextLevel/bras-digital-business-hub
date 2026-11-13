import { describe, expect, it } from "vitest";
import {
  calendarioComercial, freteGratisAPartirDe, lucroPorPeca, pontoDeEquilibrio, precoComMargem, precoParceladoSemJuros, retornoDoAnuncio, simularPromocao,
} from "@/lib/ferramentas/calculadoras";
import { aplicativosDaLoja } from "@/lib/domain/aplicativos";
import { novidadesDa } from "@/lib/domain/novidades";

/** W5 das melhorias (D188): calculadoras puras, calendário do varejo e central de aplicativos honesta. */
describe("calculadoras", () => {
  it("preço com margem fecha a conta e recusa o impossível", () => {
    const r = precoComMargem({ custoCents: 4000, fixoPorPecaCents: 500, taxasBps: 500, margemBps: 3000 })!;
    expect(r.precoCents).toBe(6923);
    expect(r.taxasCents).toBe(346);
    expect(r.lucroCents).toBe(6923 - 346 - 4500);
    expect(precoComMargem({ custoCents: 4000, taxasBps: 5000, margemBps: 5000 })).toBeNull();
    expect(lucroPorPeca({ precoCents: 10000, custoCents: 6000, taxasBps: 1000 })).toEqual({ taxasCents: 1000, lucroCents: 3000, margemBps: 3000 });
  });

  it("promoção: lucro menor e vendas necessárias; desconto que zera o lucro não tem quantidade que compense", () => {
    const r = simularPromocao({ precoCents: 12000, custoCents: 5000, taxasBps: 500, descontoBps: 1500, vendasHoje: 20 });
    expect(r.novoPrecoCents).toBe(10200);
    expect(r.lucroAntesCents).toBe(6400);
    expect(r.lucroDepoisCents).toBe(4690);
    expect(r.vendasNecessarias).toBe(28);
    expect(simularPromocao({ precoCents: 10000, custoCents: 9000, taxasBps: 500, descontoBps: 5000, vendasHoje: 10 }).vendasNecessarias).toBeNull();
  });

  it("parcelado, frete grátis, equilíbrio e anúncio", () => {
    expect(precoParceladoSemJuros({ precoCents: 20000, taxaParcelasBps: 800 })).toBe(21739);
    expect(precoParceladoSemJuros({ precoCents: 20000, taxaParcelasBps: 10000 })).toBeNull();
    expect(freteGratisAPartirDe({ freteMedioCents: 2500, margemBps: 3000 })).toBe(8333);
    expect(freteGratisAPartirDe({ freteMedioCents: 2500, margemBps: 0 })).toBeNull();
    expect(pontoDeEquilibrio({ custosFixosMesCents: 300000, lucroPorPecaCents: 6400 })).toBe(47);
    expect(pontoDeEquilibrio({ custosFixosMesCents: 300000, lucroPorPecaCents: 0 })).toBeNull();
    expect(retornoDoAnuncio({ gastoCents: 50000, vendasCents: 200000, clientesNovos: 10 })).toEqual({ roas: 4, cacCents: 5000 });
    expect(retornoDoAnuncio({ gastoCents: 0, vendasCents: 1000, clientesNovos: 0 })).toEqual({ roas: null, cacCents: null });
  });

  it("calendário: datas móveis certas", () => {
    const c = Object.fromEntries(calendarioComercial(2026).map((d) => [d.nome, d.data]));
    expect(c["Dia das Mães"]).toBe("2026-05-10");
    expect(c["Dia dos Pais"]).toBe("2026-08-09");
    expect(c["Black Friday"]).toBe("2026-11-27");
    expect(Object.fromEntries(calendarioComercial(2027).map((d) => [d.nome, d.data]))["Black Friday"]).toBe("2027-11-26");
  });
});

describe("central de aplicativos", () => {
  it("estado real da loja; o que não existe aparece como em breve, nunca ligado", () => {
    const base = { paymentStatus: "NOT_CONFIGURED", metaPixelId: null, launchMode: false, domainStatus: "NOT_CONFIGURED", publishedAt: null, shippingProvider: null } as const;
    const off = aplicativosDaLoja(base, { redirecionamentos: 0 });
    expect(off.find((a) => a.key === "mercado-pago")!.estado).toBe("desligado");
    expect(off.find((a) => a.key === "pixel")!.estado).toBe("desligado");
    const on = aplicativosDaLoja({ ...base, paymentStatus: "CONNECTED", metaPixelId: "123", domainStatus: "CONNECTED", publishedAt: "2026-10-01T00:00:00Z" }, { redirecionamentos: 3 });
    for (const k of ["mercado-pago", "link-pagamento", "pixel", "dominio", "google", "redirecionamentos"]) expect(on.find((a) => a.key === k)!.estado).toBe("ligado");
    for (const k of ["pix-direto", "na-entrega", "balcao", "api", "afiliados-loja"]) { const a = on.find((x) => x.key === k)!; expect(a.estado).toBe("em-breve"); expect(a.href).toBeUndefined(); }
    expect(on.map((a) => `${a.nome} ${a.descricao}`).join(" ")).not.toMatch(/garant|lucro certo|ganhe/i);
  });

  it("novidades da Commerce trazem as ondas novas; o SuperDrop não vê as que não tem", () => {
    expect(novidadesDa("NEXTLEVEL_COMMERCE").map((n) => n.titulo)).toContain("Migrar e anunciar");
    expect(novidadesDa("SUPERDROP").map((n) => n.titulo)).not.toContain("Migrar e anunciar");
  });
});
