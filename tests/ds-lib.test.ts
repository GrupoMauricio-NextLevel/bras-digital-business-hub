import { describe, expect, it } from "vitest";
import { contrastLevel, contrastRatio, normalizeHex } from "@/lib/ds/color";
import { renderMarkdownLite, slugify, truncate } from "@/lib/ds/text";
import { applyIndexQuery, moveItem, queryIsEmpty, sameQuery, toggleSelection, type IndexSpec } from "@/lib/ds/index-list";

describe("cor", () => {
  it("normaliza hexadecimal", () => { expect(normalizeHex("#ABC")).toBe("#aabbcc"); expect(normalizeHex("0f1c16")).toBe("#0f1c16"); expect(normalizeHex("zzz")).toBeNull(); });
  it("calcula contraste WCAG", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
    expect(contrastLevel(21)).toBe("AAA"); expect(contrastLevel(4.6)).toBe("AA"); expect(contrastLevel(3.2)).toBe("AA-large"); expect(contrastLevel(2)).toBe("fail");
  });
});

describe("texto", () => {
  it("gera endereços sem acento", () => { expect(slugify("Camisa Tailandesa São Paulo 25/26!")).toBe("camisa-tailandesa-sao-paulo-25-26"); });
  it("trunca com reticências", () => { expect(truncate("abcdefghij", 5)).toBe("abcd…"); expect(truncate("abc", 5)).toBe("abc"); });
  it("formata markdown leve", () => {
    expect(renderMarkdownLite("**Forte** e *leve*")).toBe("<p><strong>Forte</strong> e <em>leve</em></p>");
    expect(renderMarkdownLite("- um\n- dois")).toBe("<ul><li>um</li><li>dois</li></ul>");
    expect(renderMarkdownLite("[site](https://x.com)")).toContain('href="https://x.com"');
  });
  it("não deixa passar HTML nem links perigosos", () => {
    expect(renderMarkdownLite("<script>alert(1)</script>")).not.toContain("<script>");
    expect(renderMarkdownLite("[x](javascript:alert(1))")).toContain('href="#"');
    expect(renderMarkdownLite('"><img src=x onerror=1>')).not.toContain("<img");
  });
});

type Row = { name: string; status: string; total: number };
const rows: Row[] = [{ name: "Manto São Paulo", status: "ACTIVE", total: 12000 }, { name: "Camisa Flamengo", status: "DRAFT", total: 9000 }, { name: "Manto Corinthians", status: "ACTIVE", total: 15000 }];
const spec: IndexSpec<Row> = { searchText: (r) => r.name, filterValue: { status: (r) => r.status }, sortValue: { total: (r) => r.total, name: (r) => r.name } };

describe("lista com visões", () => {
  it("busca sem acento e sem maiúsculas", () => { expect(applyIndexQuery(rows, { search: "sao paulo", filters: {}, sort: null }, spec)).toHaveLength(1); });
  it("filtra e ordena", () => {
    const out = applyIndexQuery(rows, { search: "", filters: { status: "ACTIVE" }, sort: { key: "total", dir: "desc" } }, spec);
    expect(out.map((r) => r.name)).toEqual(["Manto Corinthians", "Manto São Paulo"]);
  });
  it("compara consultas ignorando ruído", () => {
    expect(sameQuery({ search: " a ", filters: { x: "" }, sort: null }, { search: "a", filters: {}, sort: null })).toBe(true);
    expect(queryIsEmpty({ search: "", filters: { a: "" }, sort: null })).toBe(true);
  });
  it("seleciona intervalo com shift", () => {
    const ids = ["a", "b", "c", "d"];
    expect([...toggleSelection(new Set(["a"]), ids, "c", { shift: true, last: "a" })].sort()).toEqual(["a", "b", "c"]);
    expect(toggleSelection(new Set(["a"]), ids, "a").size).toBe(0);
  });
  it("reordena itens com limites seguros", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
  });
});
