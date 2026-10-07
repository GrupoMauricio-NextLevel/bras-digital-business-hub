import { describe, expect, it } from "vitest";
import { variantLabel } from "@/lib/variant-label";

describe("nome do seletor de variação", () => {
  it("roupa e calçado continuam como Tamanho (SuperDrop não muda)", () => {
    expect(variantLabel(["P", "M", "G", "GG"])).toBe("Tamanho");
    expect(variantLabel(["34", "35", "36"])).toBe("Tamanho");
    expect(variantLabel(["Único"])).toBe("Tamanho");
    expect(variantLabel(["33-38", "39-44"])).toBe("Tamanho");
    expect(variantLabel([])).toBe("Tamanho");
  });
  it("caixa fechada vira Caixa; cor, modelo e tela viram Opção", () => {
    expect(variantLabel(["Cx 12"])).toBe("Caixa");
    expect(variantLabel(["Azul", "Verde"])).toBe("Opção");
    expect(variantLabel(['6,1"', '6,7"'])).toBe("Opção");
    expect(variantLabel(["P", "Rosa"])).toBe("Opção");
  });
});
