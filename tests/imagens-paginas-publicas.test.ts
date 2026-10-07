import { afterAll, describe, expect, it } from "vitest";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatosDisponiveis } from "@/components/portal/imagem-em-criacao";

// Lista oficial das 18 fotos (pacotes imagens-superdrop.zip e imagens-commerce.zip).
const manifesto = JSON.parse(readFileSync(join(process.cwd(), "docs/imagens-paginas-publicas/MANIFESTO.json"), "utf8")) as { arquivo: string }[];
const marcaDe = (nome: string) => (nome.startsWith("sd-") ? "superdrop" : "commerce") as "superdrop" | "commerce";
const vazio = join(process.cwd(), "public/portal/superdrop/v3/__teste-vazio.webp");
afterAll(() => rmSync(vazio, { force: true }));

describe("fotos v3 das páginas públicas", () => {
  it("as 18 fotos do manifesto existem em pelo menos um formato válido, na pasta da sua marca", () => {
    expect(manifesto).toHaveLength(18);
    for (const { arquivo } of manifesto) expect(formatosDisponiveis(marcaDe(arquivo), arquivo), arquivo).not.toHaveLength(0);
    // nenhuma foto aparece na pasta da outra marca
    for (const { arquivo } of manifesto) expect(formatosDisponiveis(marcaDe(arquivo) === "superdrop" ? "commerce" : "superdrop", arquivo)).toHaveLength(0);
  });

  it("arquivo vazio não conta como formato (o navegador mostraria imagem quebrada)", () => {
    writeFileSync(vazio, "");
    expect(formatosDisponiveis("superdrop", "__teste-vazio")).toEqual([]);
    // os três arquivos que vieram vazios nos pacotes não foram instalados; os outros formatos seguem valendo
    expect(formatosDisponiveis("superdrop", "sd-hero-celular-venda")).toEqual(["avif", "png"]);
    expect(formatosDisponiveis("superdrop", "sd-fornecedor-parceiro")).toEqual(["avif", "png"]);
    expect(formatosDisponiveis("commerce", "cm-catalogo-fotografia")).toEqual(["webp", "png"]);
    expect(formatosDisponiveis("commerce", "cm-temas-ambiente")).toEqual(["avif", "webp", "png"]);
  });

  it("imagem inexistente não tem formato (a página mostra o aviso \"Imagem em criação\")", () => {
    expect(formatosDisponiveis("commerce", "cm-nao-existe")).toEqual([]);
  });
});
