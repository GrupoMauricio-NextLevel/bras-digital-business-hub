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
    marca: "NextLevel Commerce", plano: { nome: "Pro", mensalCents: 14_700 },
    regras: { indicacao: { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 }, criador: { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 }, vendedor: { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 }, agencia: { primeiraBps: 2000, recorrenteBps: 2000, meses: 600 } },
    atribuicaoDias: 90, saqueMinimoCents: 5_000, garantiaDias: 30, cadastro: "/parceiros/cadastro",
  };

  it("guia público: cada atalho tem resposta própria, com números das regras e sem promessa", () => {
    for (const a of ATALHOS_PARCEIROS) expect(responderParceiro(F, a.id).assunto).toBe(a.id);
    const ganho = responderParceiro(F, "p-ganho").texto;
    expect(ganho).toContain("**Parceiro com CNPJ** (criador, vendedor, agência): 20% desde o 1º cliente, 24% com 10+, 28% com 25+");
    expect(ganho).toContain("**Indicação pelo CPF** (qualquer pessoa): 15% desde o 1º cliente, 19% com 10+, 23% com 25+");
    expect(ganho).not.toMatch(/50%|b[oô]nus/);
    expect(responderParceiro(F, "p-niveis").texto).toContain("Ouro** (25+ clientes ativos): 28% com CNPJ, 23% pelo CPF");
    expect(responderParceiro(F, "p-receber").texto.replace(/\s/g, " ")).toContain("R$ 50,00");
    const sim = responderParceiro(F, "sim-3").texto.replace(/\s/g, " ");
    expect(sim).toContain("**1º mês:** R$ 88,20"); // 3 × 147 × 20%
    expect(sim).toContain("não uma promessa");
    expect(responderParceiro(F, "p-black").texto).not.toContain("100%");
    expect(responderParceiro(F, "p-concorrentes").texto).toContain("nota fiscal");
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
