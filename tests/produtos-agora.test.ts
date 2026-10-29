import { describe, expect, it } from "vitest";
import { produtosQuePrecisamDeVoce } from "@/lib/domain/produtos-agora";

const p = (id: string, o: Partial<{ images: string[]; suggestedPriceCents: number; status: string; available: number }> = {}) =>
  ({ id, name: `Produto ${id}`, images: ["a.jpg"], suggestedPriceCents: 5000, status: "ACTIVE", available: 20, ...o });

describe("produtos que precisam do lojista (D211)", () => {
  it("um problema por produto, do mais grave ao menos; arquivado e ok ficam de fora", () => {
    const r = produtosQuePrecisamDeVoce([
      p("ok"), p("rasc", { status: "DRAFT" }), p("baixo", { available: 2 }), p("foto", { images: [] }), p("zero", { available: 0, images: [] }),
      p("preco", { suggestedPriceCents: 0 }), p("arq", { status: "ARCHIVED", available: 0 }),
    ]);
    expect(r.map((x) => [x.id, x.problema])).toEqual([["zero", "sem-estoque"], ["preco", "sem-preco"], ["foto", "sem-foto"], ["baixo", "estoque-baixo"], ["rasc", "rascunho"]]);
  });
});
