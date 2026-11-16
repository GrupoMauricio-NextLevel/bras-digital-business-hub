import { describe, expect, it } from "vitest";
import { COMMERCE_STORE_NAV, navDoNegocio } from "@/lib/nav";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";

const B = NOME_GERENCIADOR.nome;
const nav = (...ativos: string[]) => navDoNegocio({ ativos: new Set(ativos) }, B);
const grupos = (itens: { group?: string }[]) => [...new Set(itens.map((i) => i.group))];

describe("menu do lojista com o NextLevel Business (NB1, D306)", () => {
  it("loja: nenhum endereço do menu de hoje some", () => {
    const hrefs = new Set(nav("painel", "contatos", "loja").map((i) => i.href));
    for (const i of COMMERCE_STORE_NAV) expect(hrefs, `${i.label} (${i.href})`).toContain(i.href);
  });
  it("loja: grupos NextLevel Business, Loja virtual e Ajustes, sem endereço repetido", () => {
    const itens = nav("painel", "contatos", "loja");
    expect(grupos(itens)).toEqual([B, "Loja virtual", "Ajustes"]);
    expect(new Set(itens.map((i) => i.href)).size).toBe(itens.length);
  });
  it("site: grupo Site com Páginas, Serviços, Aparência e Domínio, e um cartão só para ligar a loja", () => {
    const itens = nav("painel", "contatos", "site");
    expect(grupos(itens)).toEqual([B, "Site", "Loja virtual", "Ajustes"]);
    expect(itens.filter((i) => i.group === "Site").map((i) => i.label)).toEqual(["Páginas", "Serviços", "Aparência", "Domínio"]);
    const loja = itens.filter((i) => i.group === "Loja virtual");
    expect(loja).toHaveLength(1);
    expect(loja[0]).toMatchObject({ label: "Ligar loja virtual", locked: true });
    expect(itens.some((i) => i.href === "/merchant/catalogo")).toBe(false);
  });
  it("site e loja juntos: Aparência aparece uma vez só", () => {
    const itens = nav("painel", "contatos", "site", "loja");
    expect(itens.filter((i) => i.href === "/theme-editor")).toHaveLength(1);
  });
  it("barra do celular: Agora, Atendimento, Clientes, Pedidos e vendas", () => {
    expect(nav("loja").filter((i) => i.bottom).map((i) => i.label)).toEqual(["Agora", "Atendimento", "Clientes", "Pedidos e vendas"]);
  });
});
