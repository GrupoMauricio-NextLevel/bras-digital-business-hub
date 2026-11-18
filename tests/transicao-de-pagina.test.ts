import { describe, expect, it } from "vitest";
import { chaveDoEndereco, cliqueAbreCarga, INTERACAO_LIBERA_MS, LIMITE_CARGA_MS } from "@/components/transicao-de-pagina";

// D330: o carregamento da troca de página (logo girando) ficava preso em pastas, filtros e abas (?pasta=, ?nivel=).
const normal = { botao: 0, atalho: false, novaAba: false, download: false };
const aqui = "https://nextlevelcommerce.com.br/temas";

describe("carregamento da troca de página", () => {
  it("considera os parâmetros do endereço como mudança de página", () => {
    expect(chaveDoEndereco("https://a.com/master/caixa-de-entrada?pasta=spam")).not.toBe(chaveDoEndereco("https://a.com/master/caixa-de-entrada"));
    expect(chaveDoEndereco("/master/caixa-de-entrada?pasta=spam")).toBe("/master/caixa-de-entrada?pasta=spam");
  });
  it("ignora a âncora (#), que não carrega página nova", () => {
    expect(chaveDoEndereco("https://a.com/x?y=1#topo")).toBe(chaveDoEndereco("https://a.com/x?y=1"));
  });
  it("abre no clique de filtro e de outra página interna", () => {
    expect(cliqueAbreCarga("/temas?nivel=3", aqui, normal)).toBe(true);
    expect(cliqueAbreCarga("/temas?nivel=3&familia=CELULAR", aqui + "?nivel=3", normal)).toBe(true);
    expect(cliqueAbreCarga("/planos", aqui, normal)).toBe(true);
  });
  it("não abre quando nada vai carregar", () => {
    expect(cliqueAbreCarga("/temas", aqui, normal)).toBe(false); // mesmo endereço
    expect(cliqueAbreCarga("/temas#lista", aqui, normal)).toBe(false); // só âncora
    expect(cliqueAbreCarga("https://wa.me/5511", aqui, normal)).toBe(false); // outro site
    expect(cliqueAbreCarga("mailto:a@b.com", aqui, normal)).toBe(false);
    expect(cliqueAbreCarga("javascript:void(0)", aqui, normal)).toBe(false);
    expect(cliqueAbreCarga("/planos", aqui, { ...normal, novaAba: true })).toBe(false);
    expect(cliqueAbreCarga("/planos", aqui, { ...normal, atalho: true })).toBe(false);
    expect(cliqueAbreCarga("/planos", aqui, { ...normal, botao: 1 })).toBe(false);
    expect(cliqueAbreCarga("/arquivo.pdf", aqui, { ...normal, download: true })).toBe(false);
  });
  it("tem limite de tempo curto para nunca ficar preso", () => {
    expect(LIMITE_CARGA_MS).toBeGreaterThan(INTERACAO_LIBERA_MS);
    expect(LIMITE_CARGA_MS).toBeLessThanOrEqual(6_000);
  });
});
