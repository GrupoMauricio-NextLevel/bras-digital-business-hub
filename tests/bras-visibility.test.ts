import { describe, expect, it } from "vitest";
import { BRAND_CODES, brandByCode, closedCommerceBrandCodes, isClosedCommerceBrand } from "@/lib/brand";
import { robotsForBrandPortal } from "@/lib/bras/visibility";

describe("visibilidade pública da Brás Digital", () => {
  it("impede indexação enquanto a Brás está \"em breve\"", () => {
    expect(robotsForBrandPortal(brandByCode("BRAS_DIGITAL", {}))).toEqual({ index: false, follow: false });
  });

  it("com o cadastro aberto (D91) a apresentação pode ser indexada e a marca deixa de ser \"em breve\"", () => {
    const aberta = brandByCode("BRAS_DIGITAL", { BRAND_SIGNUP_BRAS_DIGITAL: "true" });
    expect(aberta.soon).toBeNull();
    expect(aberta.signupOpen).toBe(true);
    expect(isClosedCommerceBrand(aberta)).toBe(true);
    expect(robotsForBrandPortal(aberta)).toBeUndefined();
    expect(brandByCode("BRAS_DIGITAL", { BRAND_SIGNUP_BRAS_DIGITAL: "1" }).signupOpen).toBe(false);
  });

  it("não muda a política dos produtos já públicos", () => {
    for (const code of BRAND_CODES.filter((c) => c !== "BRAS_DIGITAL")) expect(robotsForBrandPortal(brandByCode(code, {}))).toBeUndefined();
  });

  it("operação fechada é configuração da marca, só da Brás Digital hoje", () => {
    expect(closedCommerceBrandCodes({})).toEqual(["BRAS_DIGITAL"]);
    expect(isClosedCommerceBrand(brandByCode("SUPERDROP", {}))).toBe(false);
    expect(isClosedCommerceBrand(brandByCode("NEXTLEVEL_COMMERCE", {}))).toBe(false);
    expect(isClosedCommerceBrand(null)).toBe(false);
  });
});
