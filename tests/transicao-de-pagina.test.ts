import { describe, expect, it } from "vitest";
import { chaveDoEndereco, LIMITE_CARGA_MS } from "@/components/transicao-de-pagina";

// D327: o carregamento da troca de página só sumia quando o caminho mudava; em pastas e filtros (?pasta=...) ficava preso.
describe("carregamento da troca de página", () => {
  it("considera os parâmetros do endereço como mudança de página", () => {
    expect(chaveDoEndereco("https://a.com/master/caixa-de-entrada?pasta=spam")).not.toBe(chaveDoEndereco("https://a.com/master/caixa-de-entrada"));
    expect(chaveDoEndereco("/master/caixa-de-entrada?pasta=spam")).toBe("/master/caixa-de-entrada?pasta=spam");
  });
  it("ignora a âncora (#), que não carrega página nova", () => {
    expect(chaveDoEndereco("https://a.com/x?y=1#topo")).toBe(chaveDoEndereco("https://a.com/x?y=1"));
  });
  it("tem limite de tempo para nunca ficar preso", () => {
    expect(LIMITE_CARGA_MS).toBeGreaterThan(0);
    expect(LIMITE_CARGA_MS).toBeLessThanOrEqual(10_000);
  });
});
