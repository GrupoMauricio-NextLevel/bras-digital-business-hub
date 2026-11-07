import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * D264 (pedido do dono): toda atualização alimenta a base de conhecimento da equipe. A partir da D257 (quando a base
 * nasceu), cada decisão registrada em DECISIONS.md precisa estar citada no inventário da base.
 */
describe("base de conhecimento ao vivo", () => {
  it("toda decisão desde a D257 está na base de conhecimento", () => {
    const decisoes = readFileSync("docs/design/DECISIONS.md", "utf8");
    const base = readFileSync("docs/conhecimento/BC0-INVENTARIO.md", "utf8");
    const numeros = [...decisoes.matchAll(/^## D(\d+)\b/gm)].map((m) => Number(m[1])).filter((n) => n >= 257);
    expect(numeros.length).toBeGreaterThan(0);
    const faltam = numeros.filter((n) => !new RegExp(`\\bD${n}\\b`).test(base));
    expect(faltam, `Decisões sem registro na base de conhecimento: ${faltam.map((n) => `D${n}`).join(", ")}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// BC1 (D266): tela "Aprender" com aulas ao vivo, trilhas por função e Novidades geradas das decisões.
// ---------------------------------------------------------------------------------------------------------------------
import { beforeEach } from "vitest";
import { freshDb } from "./setup";
import { aulas, buscarAulas, TRILHAS, TRILHAS_POR_FUNCAO, trilhasDa } from "@/lib/conhecimento/aulas";
import { fatosAoVivo, type Fatos } from "@/lib/conhecimento/fatos";
import { masterPathAllowed, MASTER_FUNCTIONS } from "@/lib/master-equipe";
// @ts-expect-error script em JavaScript puro (sem tipos)
import { novidadesDe } from "../scripts/gerar-novidades.mjs";
import novidades from "@/lib/conhecimento/novidades.json";

const fatosFalsos = (mult = 1): Fatos => ({
  planos: ["Start", "Pro", "Scale"].map((nome, i) => ({ key: `K${i}`, nome, mensalCents: 1_111 * (i + 1) * mult, anualMesCents: 999 * (i + 1) * mult, depoisDaBlackMensalCents: 1_313 * (i + 1), depoisDaBlackAnualMesCents: 1_212 * (i + 1), produtos: i === 2 ? null : 123 * (i + 1), pessoas: 7 + i, temaPago: i > 0, suporte: "Suporte X", migracao: "Migração Y", ia: 77 * (i + 1), atacado: { plano: nome, faixas: 3 + i, gradesPorProduto: i === 2 ? 99 : 2 + i, regrasMix: 1 + i, tiposMix: ["MIX_PECAS"], pacote: i > 0, gradeLivre: i > 0 } })),
  diasDeTeste: 9, black: { ativa: true, fim: "2026-12-01T02:59:59.000Z", mesesGratisAnual: 4 },
  parceiros: { niveis: [{ nome: "Inicial", minimo: 0, cnpjBps: 2_100 * mult, cpfBps: 1_600 }, { nome: "Prata", minimo: 11, cnpjBps: 2_500, cpfBps: 2_000 }, { nome: "Ouro", minimo: 27, cnpjBps: 2_900, cpfBps: 2_400 }], mesesParaDescer: 3, saqueMinimoCents: 4_321, atribuicaoDias: 77, garantiaDias: 31, inativoMeses: 8 },
  concorrentes: { consulta: "01/01/2030", programas: [], barreiras: [{ nome: "Rival", barreira: "Exige carimbo." }], shopifyUsd: 31, taxas: [{ nome: "Rival", maxBps: 333 }] },
});

describe("Aprender (BC1): aulas ao vivo", () => {
  it("nenhum valor em reais ou percentual escrito à mão nas aulas", () => {
    const src = readFileSync("src/lib/conhecimento/aulas.ts", "utf8");
    expect(src.match(/\d+(?:,\d+)?\s?%|R\$\s?\d/g) ?? []).toEqual([]);
  });

  it("as aulas mostram os números dos fatos e mudam junto com eles", () => {
    const a = aulas(fatosFalsos()), b = aulas(fatosFalsos(2));
    const txt = (l: ReturnType<typeof aulas>) => l.map((x) => [x.oQue, ...x.regra, x.exemplo ?? ""].join(" ")).join(" ").replace(/\u00a0/g, " ");
    expect(txt(a)).toContain("R$ 11,11"); // mensal do Start vindo dos fatos
    expect(txt(a)).toContain("21%"); // 1º nível CNPJ vindo dos fatos
    expect(txt(a)).toContain("R$ 43,21"); // saque mínimo
    expect(txt(a)).toContain("Exige carimbo.");
    expect(txt(a)).not.toMatch(/undefined|NaN/);
    expect(txt(b)).toContain("R$ 22,22");
    expect(txt(b)).not.toContain("R$ 11,11");
    for (const t of TRILHAS) expect(a.filter((x) => x.trilha === t.id).length, t.id).toBeGreaterThan(0);
    expect(new Set(a.map((x) => x.id)).size).toBe(a.length);
  });

  it("busca sem acento e trilhas por função (D265); a tela é liberada para toda a equipe", () => {
    const a = aulas(fatosFalsos());
    expect(buscarAulas(a, "comissao cpf").map((x) => x.id)).toContain("duas-frentes");
    expect(buscarAulas(a, "x")).toEqual([]);
    expect(TRILHAS_POR_FUNCAO).toEqual({ COMERCIAL: ["base", "venda", "parceiros", "atacado"], SUPORTE: ["base", "atacado", "suporte"], FINANCEIRO: ["base", "parceiros", "financeiro"], CONTADOR: ["base", "parceiros", "financeiro"], CONTEUDO: ["base", "conteudo"] });
    expect(trilhasDa(null)).toHaveLength(TRILHAS.length);
    for (const fn of MASTER_FUNCTIONS) { expect(trilhasDa(fn)[0]).toBe("base"); expect(masterPathAllowed(fn, "/master/aprender")).toBe(true); }
  });

  it("Novidades estão em dia com as decisões (rode `node scripts/gerar-novidades.mjs`)", () => {
    expect(novidades).toEqual(novidadesDe(readFileSync("docs/design/DECISIONS.md", "utf8")));
    expect(novidades[0]!.numero).toBeGreaterThanOrEqual(266);
  });

  describe("fatos lidos do sistema", () => {
    let ctx: Awaited<ReturnType<typeof freshDb>>;
    beforeEach(async () => { ctx = await freshDb(); });
    it("planos, parceiros e atacado vêm do banco e das regras", async () => {
      const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog");
      await ensureCatalogSeed(ctx.db);
      const f = await fatosAoVivo(ctx.db);
      expect(f.planos.map((p) => p.nome)).toEqual(["Start", "Pro", "Scale"]);
      for (const p of f.planos) expect(p.mensalCents).toBeGreaterThan(0);
      expect(f.parceiros.niveis.map((n) => [n.cnpjBps, n.cpfBps])).toEqual([[2000, 1500], [2400, 1900], [2800, 2300]]);
      expect(f.parceiros.saqueMinimoCents).toBe(5_000);
      expect(f.parceiros.garantiaDias).toBe(30);
      const lista = aulas(f);
      expect(lista.find((a) => a.id === "duas-frentes")!.regra.join(" ")).toContain("20%");
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// BC2 (D267): perguntas por aula, progresso por pessoa e o painel do dono ("quem está pronto").
// ---------------------------------------------------------------------------------------------------------------------
import { corrigir, perguntasDa } from "@/lib/conhecimento/perguntas";
import { painelDaEquipe, pendenteDoAprender, progressoDe, responderAula } from "@/lib/domain/aprender";
import { createMasterMember } from "@/lib/domain/equipe-master";

describe("Aprender (BC2): perguntas e progresso", () => {
  it("nenhum valor em reais ou percentual escrito à mão nas perguntas", () => {
    const src = readFileSync("src/lib/conhecimento/perguntas.ts", "utf8");
    expect(src.match(/\d+(?:,\d+)?\s?%|R\$\s?\d/g) ?? []).toEqual([]);
  });

  it("toda aula tem 3 perguntas, com a certa válida, sem opção repetida e com os números dos fatos", () => {
    const f = fatosFalsos();
    for (const a of aulas(f)) {
      const ps = perguntasDa(a.id, f);
      expect(ps, a.id).toHaveLength(3);
      for (const p of ps) {
        expect(p.opcoes.length, `${a.id}: ${p.pergunta}`).toBeGreaterThanOrEqual(2);
        expect(new Set(p.opcoes).size, `${a.id}: ${p.pergunta}`).toBe(p.opcoes.length);
        expect(p.certa).toBeGreaterThanOrEqual(0);
        expect(p.certa).toBeLessThan(p.opcoes.length);
        expect(p.opcoes.join(" ")).not.toMatch(/undefined|NaN/);
      }
    }
    const certaDoPro = (k: number) => { const p = perguntasDa("planos", fatosFalsos(k))[0]!; return p.opcoes[p.certa]!.replace(/ /g, " "); };
    expect(certaDoPro(1)).toBe("R$ 22,22");
    expect(certaDoPro(2)).toBe("R$ 44,44");
  });

  it("corrige: concluída só com todas certas", () => {
    const ps = perguntasDa("taxa-zero", fatosFalsos());
    expect(corrigir(ps, ps.map((p) => p.certa))).toMatchObject({ acertos: 3, total: 3, concluida: true });
    expect(corrigir(ps, [ps[0]!.certa, (ps[1]!.certa + 1) % ps[1]!.opcoes.length, ps[2]!.certa])).toMatchObject({ acertos: 2, concluida: false, certas: [true, false, true] });
    expect(corrigir(ps, [])).toMatchObject({ acertos: 0, concluida: false });
  });

  describe("no banco", () => {
    let ctx: Awaited<ReturnType<typeof freshDb>>;
    beforeEach(async () => { ctx = await freshDb(); });
    const f = fatosFalsos();
    async function pessoa(fn: "SUPORTE" | "CONTEUDO", email: string) {
      const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: `Pessoa ${fn}`, email, password: "provisoria-123", masterFunction: fn });
      return { ...ctx.actors.master, userId: id, masterFunction: fn };
    }

    it("grava o progresso, conta tentativas e não desfaz a conclusão", async () => {
      const sup = await pessoa("SUPORTE", "sup@nl.teste");
      const ps = perguntasDa("o-que-e", f);
      const errado = await responderAula(ctx.db, sup, { aulaId: "o-que-e", respostas: ps.map((p) => (p.certa + 1) % p.opcoes.length) }, f);
      expect(errado.concluida).toBe(false);
      expect((await progressoDe(ctx.db, sup.userId)).has("o-que-e")).toBe(false);
      expect((await responderAula(ctx.db, sup, { aulaId: "o-que-e", respostas: ps.map((p) => p.certa) }, f)).concluida).toBe(true);
      const quando = (await progressoDe(ctx.db, sup.userId)).get("o-que-e");
      expect(quando).toBeTruthy();
      await responderAula(ctx.db, sup, { aulaId: "o-que-e", respostas: [0, 0, 0] }, f);
      expect((await progressoDe(ctx.db, sup.userId)).get("o-que-e")).toBe(quando);
      const { aprenderProgresso } = await import("@/db/schema");
      const rows = await ctx.db.select().from(aprenderProgresso);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ tentativas: 3, acertos: 3, trilha: "base" });
    });

    it("aula fora das trilhas da função não pode ser respondida; quem não é do Master também não", async () => {
      const cont = await pessoa("CONTEUDO", "cont@nl.teste");
      await expect(responderAula(ctx.db, cont, { aulaId: "comissoes", respostas: [0, 0, 0] }, f)).rejects.toThrow(/não encontrada/);
      await expect(responderAula(ctx.db, ctx.actors.mantos, { aulaId: "o-que-e", respostas: [0, 0, 0] }, f)).rejects.toThrow();
    });

    it("painel do dono: só o dono vê; pronto quando todas as aulas das trilhas da função estão feitas", async () => {
      const cont = await pessoa("CONTEUDO", "cont@nl.teste");
      await expect(painelDaEquipe(ctx.db, cont, f)).rejects.toThrow(/dono/);
      let painel = await painelDaEquipe(ctx.db, ctx.actors.master, f);
      expect(painel.map((p) => [p.funcao, p.pronto, p.feitas])).toEqual([["CONTEUDO", false, 0]]);
      expect(await pendenteDoAprender(ctx.db, cont, f)).toEqual({ feitas: 0, total: painel[0]!.total });
      for (const a of aulas(f).filter((x) => trilhasDa("CONTEUDO").includes(x.trilha))) {
        await responderAula(ctx.db, cont, { aulaId: a.id, respostas: perguntasDa(a.id, f).map((p) => p.certa) }, f);
      }
      painel = await painelDaEquipe(ctx.db, ctx.actors.master, f);
      expect(painel[0]).toMatchObject({ pronto: true });
      expect(painel[0]!.trilhas.map((t) => t.trilha)).toEqual(["base", "conteudo"]);
      expect(await pendenteDoAprender(ctx.db, cont, f)).toBeNull();
      expect(await pendenteDoAprender(ctx.db, ctx.actors.master, f)).toBeNull();
    });
  });
});
