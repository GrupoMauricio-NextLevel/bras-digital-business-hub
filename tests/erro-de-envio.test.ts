import { describe, expect, it } from "vitest";
import { mensagemDeEnvio } from "@/lib/erro-de-envio";

describe("mensagem de erro no envio de imagem", () => {
  it("publicação nova com a tela aberta: pede para recarregar", () => {
    expect(mensagemDeEnvio(new Error('Failed to find Server Action "00c7". This request might be from an older or newer deployment.'))).toMatch(/Recarregue a página/);
    expect(mensagemDeEnvio(new Error("An unexpected response was received from the server."))).toMatch(/Recarregue/);
  });
  it("mensagem clara do sistema passa como está; erro técnico vira o texto padrão", () => {
    expect(mensagemDeEnvio(new Error("A imagem deve ter no máximo 3 MB."))).toBe("A imagem deve ter no máximo 3 MB.");
    expect(mensagemDeEnvio(new Error("TypeError: x is undefined"))).toBe("Não foi possível enviar a imagem.");
    expect(mensagemDeEnvio("??")).toBe("Não foi possível enviar a imagem.");
  });
});
