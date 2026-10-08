import { describe, expect, it } from "vitest";
import { brandByCode } from "@/lib/brand";
import { robotsForBrandPortal } from "@/lib/bras/visibility";

describe("visibilidade pública da Brás Digital", () => {
  it("impede indexação enquanto a operação é fechada", () => {
    expect(robotsForBrandPortal(brandByCode("BRAS_DIGITAL", {}))).toEqual({ index: false, follow: false });
  });

  it("não muda a política dos produtos já públicos", () => {
    expect(robotsForBrandPortal(brandByCode("SUPERDROP", {}))).toBeUndefined();
  });
});
