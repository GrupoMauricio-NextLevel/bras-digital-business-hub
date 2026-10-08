import { describe, expect, it } from "vitest";
import {
  BRAS_COMMERCIAL_FIELDS, BRAS_LOCKED_FIELDS, BRAS_NO_COMMERCIAL_ACCESS,
  brasCommercialAccessFromSession, canViewBrasCommercialData, projectBrasCommercial, projectBrasCommercialList,
} from "@/lib/bras/access";

const VISITANTE = { authenticated: false, approvedMember: false };
const NAO_APROVADO = { authenticated: true, approvedMember: false };
const APROVADO = { authenticated: true, approvedMember: true };

/** Registro com todos os campos comerciais e um campo interno que nunca deveria sair para quem não está aprovado. */
const caixa = { id: "sku_1", title: "Caixa de garrafas térmicas", priceCents: 48000, stockBoxes: 37, importerId: "sup_x", importerName: "Importadora X", fullVideoUrl: "https://video.exemplo/completo", notaInterna: "margem alta" };

describe("acesso comercial da Brás Digital", () => {
  it.each([
    [{ authenticated: false, approvedMember: false }, false],
    [{ authenticated: false, approvedMember: true }, false],
    [{ authenticated: true, approvedMember: false }, false],
    [{ authenticated: true, approvedMember: true }, true],
  ] as const)("só libera membro autenticado e aprovado: %o", (access, expected) => {
    expect(canViewBrasCommercialData(access)).toBe(expected);
  });

  it("estado de partida e sessão do servidor falham fechado enquanto não existe aprovação de membro", () => {
    expect(canViewBrasCommercialData(BRAS_NO_COMMERCIAL_ACCESS)).toBe(false);
    expect(brasCommercialAccessFromSession(null)).toEqual(VISITANTE);
    expect(brasCommercialAccessFromSession(undefined)).toEqual(VISITANTE);
    // Logado, mas sem modelo de aprovação ainda: não vê preço (pendência do dono: membro B2B, CNPJ e aprovação).
    expect(brasCommercialAccessFromSession({ user: { id: "usr_1" } })).toEqual(NAO_APROVADO);
    expect(canViewBrasCommercialData(brasCommercialAccessFromSession({ user: { id: "usr_1" } }))).toBe(false);
  });
});

describe("projeção na fronteira de dados", () => {
  it.each([["visitante", VISITANTE], ["membro não aprovado", NAO_APROVADO]] as const)("%s não recebe preço, estoque, importadora nem vídeo completo", (_, access) => {
    const view = projectBrasCommercial(caixa, access);
    expect(view).toEqual({ id: "sku_1", title: "Caixa de garrafas térmicas", locked: true });
    const json = JSON.stringify(view);
    for (const campo of BRAS_COMMERCIAL_FIELDS) expect(view).not.toHaveProperty(campo);
    for (const valor of ["48000", "37", "Importadora X", "sup_x", "video.exemplo", "margem alta"]) expect(json).not.toContain(valor);
  });

  it("a visão fechada usa lista de permissão: campo novo no registro não vaza por esquecimento", () => {
    const view = projectBrasCommercial({ ...caixa, campoNovoQualquer: "segredo" }, NAO_APROVADO);
    expect(Object.keys(view).sort()).toEqual([...BRAS_LOCKED_FIELDS, "locked"].sort());
  });

  it("membro aprovado recebe preço, estoque, importadora e vídeo completo", () => {
    const view = projectBrasCommercial(caixa, APROVADO);
    expect(view.locked).toBe(false);
    expect(view).toMatchObject({ priceCents: 48000, stockBoxes: 37, importerName: "Importadora X", fullVideoUrl: "https://video.exemplo/completo" });
  });

  it("listas aplicam a mesma regra a cada item", () => {
    const outra = { ...caixa, id: "sku_2", title: "Caixa de copos" };
    expect(projectBrasCommercialList([caixa, outra], VISITANTE).every((v) => v.locked && !("priceCents" in v))).toBe(true);
    expect(projectBrasCommercialList([caixa, outra], APROVADO).every((v) => !v.locked && "priceCents" in v)).toBe(true);
  });
});
