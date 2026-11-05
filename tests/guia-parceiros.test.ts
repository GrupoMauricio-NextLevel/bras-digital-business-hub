import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { buscarGuia, guias } from "@/lib/ia/manual";
import { ATALHOS_PARCEIROS, responderParceiro, responderTextoParceiro, type FatosParceiros } from "@/lib/ia/guia-parceiros-publico";
import { fatosDosParceiros } from "@/lib/domain/captacao-parceiros";
import { ehPaginaDeParceiros, enviarDoCliente, iniciarConversa } from "@/lib/domain/ia-conversas";
import { fatosDoVendedor } from "@/lib/ia/vendedor-fatos";

/** Maurício como guia do programa (páginas /parceiros) e como manual do dia a dia do parceiro (painel), D253. */
describe("guias do parceiro (offline)", () => {
  const F: FatosParceiros = {
    marca: "NextLevel E-commerce", plano: { nome: "Pro", mensalCents: 14_700 },
    regras: { criador: { primeiraBps: 5000, recorrenteBps: 2000, meses: 600 }, vendedor: { primeiraBps: 5000, recorrenteBps: 2000, meses: 600 }, agencia: { primeiraBps: 5000, recorrenteBps: 2500, meses: 600 } },
    bonus: { ativacaoCents: 3_000, metaCents: 10_000, metaAtivacoes: 10 }, atribuicaoDias: 30, saqueMinimoCents: 10_000, garantiaDias: 30, black: null, cadastro: "/parceiros/cadastro",
  };

  it("guia público: cada atalho tem resposta própria, com números das regras e sem promessa", () => {
    for (const a of ATALHOS_PARCEIROS) expect(responderParceiro(F, a.id).assunto).toBe(a.id);
    expect(responderParceiro(F, "p-ganho").texto).toContain("50% da 1ª mensalidade + 20% todo mês");
    expect(responderParceiro(F, "p-niveis").texto).toContain("agência 32%");
    expect(responderParceiro(F, "p-receber").texto.replace(/\s/g, " ")).toContain("R$ 100,00");
    const sim = responderParceiro(F, "sim-3").texto.replace(/\s/g, " ");
    expect(sim).toContain("R$ 220,50 no 1º mês"); // 3 × 147 × 50%
    expect(sim).toContain("não uma promessa");
    expect(responderParceiro({ ...F, black: { fim: "2026-11-30T23:59:00-03:00" } }, "p-black").texto).toContain("100% para você");
  });

  it("guia público: entende a pergunta livre e números de lojas", () => {
    expect(responderTextoParceiro(F, "quanto eu ganho por cliente?").assunto).toBe("p-ganho");
    expect(responderTextoParceiro(F, "como faço o saque no pix").assunto).toBe("p-receber");
    expect(responderTextoParceiro(F, "sou de agência, como funciona o selo?").assunto).toBe("p-agencia");
    expect(responderTextoParceiro(F, "se eu indicar 5 lojas").assunto).toBe("p-simular");
    expect(responderTextoParceiro(F, "posso indicar minha própria loja?").assunto).toBe("p-regras");
    expect(responderTextoParceiro(F, "xyz").assunto).toBe("nao-entendi");
  });

  it("manual do painel: guias completos e busca pelo jeito que o parceiro pergunta", () => {
    expect(guias("parceiro").length).toBeGreaterThanOrEqual(30);
    for (const g of guias("parceiro")) expect(g.passos.length).toBeGreaterThanOrEqual(2);
    const q = (t: string) => buscarGuia("parceiro", t).guia?.id;
    expect(q("como saco o meu dinheiro?")).toBe("saque");
    expect(q("o lojista disse que está caro, o que eu respondo?")).toBe("objecoes");
    expect(q("o que eu faço hoje?")).toBe("rotina");
    expect(q("teste do meu indicado acabando")).toBe("teste-acabando");
    expect(q("como subo para o nivel ouro")).toBe("niveis");
    expect(q("quero um plano de conteúdo para o instagram")).toBe("criador");
  });

  describe("conversa nas páginas /parceiros usa o guia do programa", () => {
    let ctx: Awaited<ReturnType<typeof freshDb>>;
    beforeEach(async () => { ctx = await freshDb(); });
    it("boas-vindas e respostas do guia; na home continua o vendedor", async () => {
      expect([ehPaginaDeParceiros("/parceiros"), ehPaginaDeParceiros("/parceiros/agencias"), ehPaginaDeParceiros("/parceirosx"), ehPaginaDeParceiros("/")]).toEqual([true, true, false, false]);
      const fv = await fatosDoVendedor(ctx.db);
      const fp = await fatosDosParceiros(ctx.db);
      const { responderParceiro: rp, responderTextoParceiro: rt } = await import("@/lib/ia/guia-parceiros-publico");
      const motor = { responder: (a: string | null) => rp(fp, a), responderTexto: (t: string) => rt(fp, t), cadastro: fp.cadastro, guiado: true };
      const c = await iniciarConversa(ctx.db, { brand: "NEXTLEVEL_COMMERCE", pagina: "/parceiros/vendedores" }, fv, motor);
      expect(c.mensagens.mensagens[0]!.texto).toContain("Programa de Parceiros");
      const r = await enviarDoCliente(ctx.db, { id: c.id, token: c.token, texto: "quanto eu ganho?" }, fv, undefined, async () => motor);
      expect(r.mensagens.at(-1)!.texto).toContain("todo mês");
      const h = await iniciarConversa(ctx.db, { brand: "NEXTLEVEL_COMMERCE", pagina: "/" }, fv, motor);
      expect(h.mensagens.mensagens[0]!.texto).not.toContain("Programa de Parceiros");
    });
  });
});
