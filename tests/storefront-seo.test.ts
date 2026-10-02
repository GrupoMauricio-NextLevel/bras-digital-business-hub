import { describe, it, expect } from "vitest";
import { ldJson, shortDescription } from "@/lib/storefront-seo";

describe("SEO da vitrine", () => {
  it("descrição curta: usa o texto, corta em palavra inteira e cai no padrão quando vazio", () => {
    expect(shortDescription("  Camiseta   de algodão  ", "padrão")).toBe("Camiseta de algodão");
    expect(shortDescription("", "padrão da loja")).toBe("padrão da loja");
    const long = "palavra ".repeat(60);
    const d = shortDescription(long, "x");
    expect(d.length).toBeLessThanOrEqual(156);
    expect(d.endsWith("…")).toBe(true);
    expect(d).not.toMatch(/palav…$/); // não corta no meio da palavra
  });
  it("JSON dos dados estruturados não deixa fechar a tag <script>", () => {
    const out = ldJson({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toContain("script");
  });
});
