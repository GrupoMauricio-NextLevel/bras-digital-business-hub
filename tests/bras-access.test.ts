import { describe, expect, it } from "vitest";
import { canViewBrasCommercialData } from "@/lib/bras/access";

describe("acesso comercial da Brás Digital", () => {
  it.each([
    [{ authenticated: false, approvedMember: false }, false],
    [{ authenticated: false, approvedMember: true }, false],
    [{ authenticated: true, approvedMember: false }, false],
    [{ authenticated: true, approvedMember: true }, true],
  ] as const)("só libera membro autenticado e aprovado: %o", (access, expected) => {
    expect(canViewBrasCommercialData(access)).toBe(expected);
  });
});
