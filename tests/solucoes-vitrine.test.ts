import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { listCatalog } from "@/lib/domain/nl-catalog";
import { getJourneyConfig } from "@/lib/domain/journey";
import { diagnosticoDaSelecao, projetarVitrine, totalSelecao } from "@/lib/solucoes/vitrine";
import { filtrarPorIntencao } from "@/lib/solucoes/intencoes";
import { finFlag } from "@/lib/finance/flags";

/** Vitrine imersiva de Soluções (D162): projeção do catálogo, seleção, diagnóstico e busca por intenção. */
async function vitrine(oferta: Parameters<typeof projetarVitrine>[0]["oferta"] = null) {
  const { db } = await freshDb();
  const [itens, journey] = await Promise.all([listCatalog(db), getJourneyConfig(db)]);
  return { itens, v: projetarVitrine({ itens, fases: journey.phases, oferta, link: (p) => `${p}${p.includes("?") ? "&" : "?"}ref=X`, commerce: { base: "https://cm.test", signupOpen: true }, superdrop: { base: "https://sd.test", tagline: "Sua loja sem estoque" } }) };
}

describe("vitrine de Soluções", () => {
  it("só itens públicos, sem temas no cardápio, fases na ordem da jornada, preço do catálogo e links com atribuição", async () => {
    const { itens, v } = await vitrine();
    const publicos = itens.filter((i) => i.audience.includes("PUBLIC") && i.family !== "TEMA");
    expect(v.itens.map((i) => i.key).sort()).toEqual(publicos.map((i) => i.key).sort());
    expect(v.fases.map((f) => f.key)).toEqual(["FUNDACAO", "LANCAMENTO", "AQUISICAO", "OTIMIZACAO", "ESCALA"]);
    const start = v.itens.find((i) => i.key === "COMMERCE_START")!;
    expect(start.preco).toMatchObject({ tipo: "MENSAL", cents: itens.find((i) => i.key === "COMMERCE_START")!.prices.MONTHLY!.amountCents });
    expect(start.contratar.href).toBe("https://cm.test/cadastro?plano=COMMERCE_START&ref=X");
    const enterprise = v.itens.find((i) => i.key === "COMMERCE_ENTERPRISE")!;
    expect(enterprise.preco.tipo).toBe("CONSULTA");
    expect(enterprise.contratar.href).toBe("#diagnostico");
    expect(v.familias.find((f) => f.key === "SUPERDROP")!.itens[0]!.contratar.href).toBe("https://sd.test/?ref=X");
    expect(v.temas.every((t) => t.precoCents > 0 && t.demoHref.startsWith("https://cm.test/demo/"))).toBe(true);
  });

  it("campanha só com oferta ativa", async () => {
    expect((await vitrine()).v.campanhas).toEqual([]);
    const { v } = await vitrine({ trialDays: 7, firstPeriodCents: 990, feeHolidayMonths: 3 });
    expect(v.campanhas[0]!.texto).toMatch(/R\$\s9,90/);
  });

  it("seleção: soma em centavos só o que tem preço fixo; diagnóstico com até 6 necessidades e a lista de itens", async () => {
    const { v } = await vitrine();
    const pega = (k: string) => v.itens.find((i) => i.key === k)!;
    const sel = [pega("COMMERCE_START"), pega("LOJA_PRONTA_ESSENCIAL"), pega("COMMERCE_ENTERPRISE")];
    const t = totalSelecao(sel);
    expect(t).toEqual({ unicoCents: pega("LOJA_PRONTA_ESSENCIAL").preco.cents, mensalCents: pega("COMMERCE_START").preco.cents, consulta: 1 });
    const d = diagnosticoDaSelecao(v.itens);
    expect(d.needs.length).toBeLessThanOrEqual(6);
    expect(new Set(d.needs).size).toBe(d.needs.length);
    expect(diagnosticoDaSelecao(sel).mensagem).toBe(`Tenho interesse em: ${sel.map((i) => i.nome).join(", ")}.`);
  });

  it("busca por intenção: plataforma de origem leva à Migração, rede social ao marketing, sem acento também", async () => {
    const { v } = await vitrine();
    expect(filtrarPorIntencao(v.busca, "nuvemshop").map((i) => i.grupo)).toContain("Migração");
    expect(filtrarPorIntencao(v.busca, "anuncio instagram").every((i) => i.grupo === "Marketing")).toBe(true);
    expect(filtrarPorIntencao(v.busca, "sem estoque")[0]!.rotulo).toBe("SuperDrop");
    expect(filtrarPorIntencao(v.busca, "x")).toEqual([]);
  });

  it("chave FIN_SOLUTIONS_V2 ligada por padrão (liberada pelo dono) e desligável por variável", () => {
    expect(finFlag("FIN_SOLUTIONS_V2", {})).toBe(true);
    expect(finFlag("FIN_SOLUTIONS_V2", { FIN_SOLUTIONS_V2: "false" })).toBe(false);
  });
});
