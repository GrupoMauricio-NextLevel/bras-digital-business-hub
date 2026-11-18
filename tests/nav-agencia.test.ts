import { describe, expect, it } from "vitest";
import { NAV } from "@/lib/nav";

/** Painel da Agência em gavetas (D327): cada gaveta responde uma pergunta do dia, na ordem do dia. */
const itens = NAV.AGENCY.items;
const grupos = [...new Set(itens.filter((i) => !i.rodape).map((i) => i.group))];

describe("menu do Painel da Agência em gavetas (D327)", () => {
  it("as gavetas seguem a ordem do dia", () => {
    expect(grupos).toEqual(["Hoje", "Conversas", "Vendas", "Clientes", "Dinheiro", "Crescer", "Minha vitrine"]);
  });
  it("nenhum endereço antigo some do menu, exceto Aprender e Maurício, que foram para botões do topo", () => {
    const hrefs = new Set(itens.map((i) => i.href));
    for (const h of ["/agencia", "/agencia/fila", "/agencia/semana", "/agencia/producao", "/agencia/clientes", "/agencia/comercial", "/agencia/financeiro", "/agencia/equipe", "/agencia/solucoes", "/agencia/atendimento", "/agencia/placar", "/agencia/crescimento", "/agencia/trafego", "/agencia/contratos"]) expect(hrefs, h).toContain(h);
    expect(hrefs.has("/agencia/aprender")).toBe(false);
    expect(hrefs.has("/agencia/agente")).toBe(false);
  });
  it("Conversas é o Atendimento (pedidos e respostas do portal)", () => {
    expect(itens.filter((i) => i.group === "Conversas").map((i) => i.href)).toEqual(["/agencia/atendimento"]);
  });
  it("Equipe fica na gaveta Ajustes, no rodapé recolhido", () => {
    const rodape = itens.filter((i) => i.rodape);
    expect(rodape.map((i) => [i.href, i.group])).toEqual([["/agencia/equipe", "Ajustes"]]);
  });
  it("a barra do celular tem até 4 atalhos e começa pelo Agora", () => {
    const bottom = itens.filter((i) => i.bottom);
    expect(bottom.length).toBeLessThanOrEqual(4);
    expect(bottom[0]!.href).toBe("/agencia");
  });
  it("nenhuma gaveta passa de 3 itens", () => {
    for (const g of grupos) expect(itens.filter((i) => i.group === g).length, g).toBeLessThanOrEqual(3);
  });
});
