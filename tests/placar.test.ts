import { describe, expect, it } from "vitest";
import { jogo, rodada, selecao, textoSumula, valorSumula } from "@/lib/domain/placar";
import { SUMULA_PADRAO } from "@/lib/marcas/placar-seed";

/** Placar da goleada (D230): calculado da súmula, honesto com o que o concorrente não divulga. */
describe("placar da goleada", () => {
  it("entende a súmula escrita à mão", () => {
    expect(valorSumula("0,99")).toBe(0.99);
    expect(valorSumula("1.500")).toBe(1500);
    expect(valorSumula("sem limite")).toBe(Number.POSITIVE_INFINITY);
    expect(valorSumula("sim")).toBe(1);
    expect(valorSumula("não")).toBe(0);
    expect(valorSumula("")).toBeNull();
    expect(textoSumula({ key: "taxa", unidade: "%" }, "0,99")).toBe("0,99%");
    expect(textoSumula({ key: "suporte" }, "4")).toBe("telefone e gerente");
    expect(textoSumula({ key: "x" }, "")).toBe("não divulga");
  });

  it("com a súmula de 03/11, a NextLevel vence todos os jogos, em todos os planos", () => {
    const r = rodada(SUMULA_PADRAO);
    expect(r.jogos).toHaveLength(15);
    expect(r.foraDoAr.map((j) => `${j.rival} ${j.degrau} ${j.nextlevel}x${j.adversario}`)).toEqual([]);
  });

  it("placares de referência e regra do não divulgado", () => {
    const tray = jogo(SUMULA_PADRAO, "tray", "entrada");
    expect([tray.nextlevel, tray.adversario, tray.goleada]).toEqual([7, 0, true]);
    const nuvem = jogo(SUMULA_PADRAO, "nuvemshop", "entrada");
    expect([nuvem.nextlevel, nuvem.adversario, nuvem.goleada]).toEqual([4, 1, true]); // atacado nativo confirmado (D231)
    expect(nuvem.lances.find((l) => l.key === "produtos")!.quem).toBe("rival"); // a derrota aparece, sem destaque
    expect(nuvem.lances.find((l) => l.key === "atacado")!.quem).toBe("nextlevel");
    expect(nuvem.lances.find((l) => l.key === "balcao")!.quem).toBe("nd"); // não divulga: não vale gol
    const sel = selecao(SUMULA_PADRAO, "entrada");
    expect(sel.vitoria).toBe(true);
    expect(sel.lances.find((l) => l.key === "taxa")).toMatchObject({ quem: "nextlevel", deles: "2%", rival: "Nuvemshop" }); // ponto fraco com nome
    expect(sel.lances.find((l) => l.key === "produtos")).toMatchObject({ quem: "rival", deles: "sem limite", rival: "Nuvemshop" }); // derrota: quem de fato venceu
  });

  it("se o concorrente melhorar, o jogo vira e sai do ar", () => {
    const s = structuredClone(SUMULA_PADRAO);
    for (const i of s.itens) i.rivais.tray = { entrada: i.key === "taxa" ? "0" : "sem limite", intermediario: "", avancado: "" };
    s.itens.find((i) => i.key === "pessoas")!.rivais.tray!.entrada = "99";
    s.itens.find((i) => i.key === "suporte")!.rivais.tray!.entrada = "4";
    expect(jogo(s, "tray", "entrada").vitoria).toBe(false);
    expect(rodada(s).foraDoAr.some((j) => j.rivalKey === "tray" && j.degrau === "entrada")).toBe(true);
  });
});
