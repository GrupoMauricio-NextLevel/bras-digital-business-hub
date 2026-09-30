import { describe, expect, it } from "vitest";
import type { ThemeSettingsData } from "@/db/schema";
import { normalizeSettings, normalizeValue } from "@/lib/themes/settings";
import { SECTION_SCHEMAS, sectionSchema } from "@/lib/themes/sections";
import { addBlock, addSection, duplicateSection, legacyGlobals, moveBlock, moveSection, normalizeGlobals, normalizeStyle, normalizeTemplate, planProducts, removeBlock, removeSection, resolveLink, sameTemplate, setBlockSetting, setSectionHidden, setSetting, templateFromLegacy, TemplateOpError } from "@/lib/themes/template";
import type { Template } from "@/lib/themes/types";

const legacy: ThemeSettingsData = { heroTitle: "Vista o manto", heroSubtitle: "Camisas oficiais", heroCta: "Ver catálogo", announcement: "Frete grátis", banners: [{ title: "Lançamento", subtitle: "Coleção nova", tone: "accent" }, { title: "Promo", subtitle: "", tone: "neutral" }], showCategories: true, footerText: "Mantos Shop" };

describe("esquemas das seções", () => {
  it("todos os esquemas são consistentes", () => {
    for (const s of SECTION_SCHEMAS) {
      expect(s.presets.length).toBeGreaterThan(0);
      const ids = s.settings.map((d) => d.id); expect(new Set(ids).size).toBe(ids.length);
      for (const p of s.presets) for (const b of p.blocks ?? []) expect(s.blocks?.some((d) => d.type === b.type), `${s.type}: preset com bloco desconhecido`).toBe(true);
      for (const d of [...s.settings, ...(s.blocks ?? []).flatMap((b) => b.settings)]) {
        if (d.type === "select") expect(d.options?.length, `${s.type}.${d.id}`).toBeGreaterThan(0);
        if (d.type === "range") { expect(d.min).toBeDefined(); expect(d.max).toBeDefined(); }
      }
    }
  });
});

describe("normalização de valores", () => {
  const def = (o: object) => ({ id: "x", label: "x", ...o }) as never;
  it("cores", () => { expect(normalizeValue(def({ type: "color", default: "#111111" }), "#ABC")).toBe("#aabbcc"); expect(normalizeValue(def({ type: "color", default: "#111111" }), "vermelho")).toBe("#111111"); });
  it("faixas respeitam limites e passo", () => {
    const d = def({ type: "range", min: 2, max: 12, step: 2, default: 4 });
    expect(normalizeValue(d, 99)).toBe(12); expect(normalizeValue(d, -5)).toBe(2); expect(normalizeValue(d, "7")).toBe(8); expect(normalizeValue(d, "abc")).toBe(4);
  });
  it("seleção fora da lista volta ao padrão", () => { expect(normalizeValue(def({ type: "select", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], default: "b" }), "z")).toBe("b"); });
  it("links e imagens perigosos são recusados", () => {
    expect(normalizeValue(def({ type: "url", default: "/catalog" }), "javascript:alert(1)")).toBe("/catalog");
    expect(normalizeValue(def({ type: "url", default: "" }), "https://exemplo.com/x")).toBe("https://exemplo.com/x");
    expect(normalizeValue(def({ type: "image", default: "" }), "data:image/svg+xml,<svg onload=1>")).toBe("");
    expect(normalizeValue(def({ type: "image", default: "" }), "https://cdn.exemplo.com/a.webp")).toBe("https://cdn.exemplo.com/a.webp");
  });
  it("texto: corta no limite, tira quebras de linha e caractere nulo", () => {
    expect(normalizeValue(def({ type: "text", maxLength: 5 }), "abcdefghi")).toBe("abcde");
    expect(normalizeValue(def({ type: "text" }), "a\nb\u0000c")).toBe("a bc");
  });
  it("ignora chaves desconhecidas e preenche padrões", () => {
    const hero = sectionSchema("hero")!;
    const s = normalizeSettings(hero.settings, { title: "Oi", intruso: "x" });
    expect(s.title).toBe("Oi"); expect("intruso" in s).toBe(false); expect(s.layout).toBe("split");
  });
});

describe("normalização do modelo", () => {
  const raw = { v: 1, order: ["a", "b", "c", "hero"], sections: { a: { type: "hero", settings: { title: "Oi" } }, b: { type: "nao-existe" }, c: { type: "footer" }, hero: { type: "hero", settings: { layout: "xx" } }, orfa: { type: "rich-text" } } };
  it("remove tipo desconhecido e região errada; junta seções órfãs no fim", () => {
    const { template, issues } = normalizeTemplate(raw, "content", "home");
    expect(template.order).toEqual(["a", "hero", "orfa"]); expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(template.sections.hero!.settings.layout).toBe("split");
  });
  it("é idempotente", () => {
    const once = normalizeTemplate(raw, "content", "home").template;
    expect(normalizeTemplate(once, "content", "home").template).toEqual(once);
  });
  it("entrada inválida vira modelo vazio sem quebrar", () => {
    expect(normalizeTemplate("lixo", "content").template.order).toEqual([]); expect(normalizeTemplate(null, "content").issues).toEqual([]);
  });
  it("respeita singleton e página permitida", () => {
    const t = normalizeTemplate({ v: 1, order: ["h1", "h2"], sections: { h1: { type: "header" }, h2: { type: "header" } } }, "header").template;
    expect(t.order).toEqual(["h1"]);
    expect(normalizeTemplate({ v: 1, order: ["x"], sections: { x: { type: "hero" } } }, "content", "cart").template.order).toEqual([]);
  });
  it("limita blocos, tipos e ids", () => {
    const blocks = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`item-${i}`, { type: "item" }]));
    const t = normalizeTemplate({ v: 1, order: ["t"], sections: { t: { type: "trust-bar", blocks, blockOrder: Object.keys(blocks) } } }, "content", "home").template;
    expect(t.sections.t!.blockOrder).toHaveLength(6);
    expect(normalizeTemplate({ v: 1, order: ["../x"], sections: { "../x": { type: "hero" } } }, "content").template.order).toEqual([]);
  });
});

describe("operações do editor", () => {
  const base = templateFromLegacy(legacy);
  it("adiciona, move, duplica, oculta e remove seções", () => {
    const added = addSection(base, "rich-text", { region: "content", page: "home", index: 1 });
    const id = added.id; let template = added.template;
    expect(template.order[1]).toBe(id); expect(template.sections[id]!.settings.heading).toBe("Sobre a loja");
    template = moveSection(template, id, 0); expect(template.order[0]).toBe(id);
    const dup = duplicateSection(template, id); expect(dup.id).toBe("rich-text-2"); expect(dup.template.order[1]).toBe("rich-text-2");
    template = setSectionHidden(dup.template, id, true); expect(template.sections[id]!.hidden).toBe(true);
    template = setSectionHidden(template, id, false); expect(template.sections[id]!.hidden).toBeUndefined();
    template = removeSection(template, id); expect(template.order).not.toContain(id);
    expect(normalizeTemplate(template, "content", "home").issues).toEqual([]);
  });
  it("recusa seção de outro local, fora da página e além do singleton", () => {
    expect(() => addSection(base, "header", { region: "content" })).toThrow(TemplateOpError);
    expect(() => addSection(base, "hero", { region: "content", page: "cart" })).toThrow(TemplateOpError);
    const hdr = normalizeTemplate({ v: 1, order: ["header"], sections: { header: { type: "header" } } }, "header").template;
    expect(() => addSection(hdr, "header", { region: "header" })).toThrow(/uma seção/);
    expect(() => duplicateSection(hdr, "header")).toThrow(TemplateOpError);
  });
  it("normaliza o valor ao alterar uma configuração", () => {
    const t = setSetting(base, "showcase", "count", 999); expect(t.sections.showcase!.settings.count).toBe(12);
    expect(() => setSetting(base, "showcase", "inexistente", 1)).toThrow(TemplateOpError);
  });
  it("blocos: adiciona, edita, move, remove e respeita o limite", () => {
    let t = base; const n0 = t.sections.trust!.blockOrder.length;
    const a = addBlock(t, "trust", "item"); t = a.template; expect(t.sections.trust!.blockOrder).toHaveLength(n0 + 1);
    t = setBlockSetting(t, "trust", a.blockId, "title", "Garantia de 30 dias"); expect(t.sections.trust!.blocks[a.blockId]!.settings.title).toBe("Garantia de 30 dias");
    t = moveBlock(t, "trust", a.blockId, 0); expect(t.sections.trust!.blockOrder[0]).toBe(a.blockId);
    t = removeBlock(t, "trust", a.blockId); expect(t.sections.trust!.blockOrder).toHaveLength(n0);
    for (let i = t.sections.trust!.blockOrder.length; i < 6; i++) t = addBlock(t, "trust", "item").template;
    expect(() => addBlock(t, "trust", "item")).toThrow(/Limite/);
  });
  it("comparação de modelos", () => { expect(sameTemplate(base, templateFromLegacy(legacy))).toBe(true); expect(sameTemplate(base, setSetting(base, "hero", "title", "Outro"))).toBe(false); });
});

describe("conversão do tema atual", () => {
  const t = templateFromLegacy(legacy);
  it("cria as seções na ordem da loja atual", () => { expect(t.order).toEqual(["hero", "trust", "categories", "showcase", "banners", "grid"]); });
  it("leva os textos da loja para o destaque e os banners para blocos", () => {
    expect(t.sections.hero!.settings).toMatchObject({ title: "Vista o manto", subtitle: "Camisas oficiais", ctaLabel: "Ver catálogo", layout: "split" });
    expect(t.sections.banners!.blockOrder).toHaveLength(2);
    expect(t.sections.banners!.blocks[t.sections.banners!.blockOrder[0]!]!.settings).toMatchObject({ title: "Lançamento", tone: "accent" });
    expect(t.sections.trust!.blockOrder).toHaveLength(3);
  });
  it("sem categorias, sem banners e tema elite", () => {
    const t2 = templateFromLegacy({ ...legacy, showCategories: false, banners: [] }, "elite");
    expect(t2.sections.categories!.hidden).toBe(true); expect(t2.order).not.toContain("banners"); expect(t2.sections.hero!.settings.layout).toBe("wide");
  });
  it("é determinística e já normalizada", () => { expect(templateFromLegacy(legacy)).toEqual(t); expect(normalizeTemplate(t, "content", "home").template).toEqual(t); });
  it("globais: anúncio oculto quando vazio, rodapé com o texto", () => {
    const g = legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, { ...legacy, announcement: "" });
    expect(g.header.sections.announcement!.hidden).toBe(true); expect(g.footer.sections.footer!.settings.text).toBe("Mantos Shop");
    expect(g.style).toMatchObject({ primary: "#0f172a", accent: "#16a34a", headingFont: "display", radius: 16 });
    expect(normalizeGlobals(g).globals).toEqual(g);
  });
  it("estilo inválido volta ao padrão", () => { expect(normalizeStyle({ primary: "x", radius: 999, buttons: "zz" })).toMatchObject({ primary: "#0f172a", radius: 28, buttons: "solid" }); });
});

describe("produtos por seção (paridade com a loja atual)", () => {
  const mk = (n: number, featured: number[] = []) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, featured: featured.includes(i), categoryId: i % 2 ? "c1" : "c2" }));
  const t: Template = templateFromLegacy(legacy);
  it("usa os destaques quando há pelo menos 4; senão os 4 primeiros", () => {
    expect(planProducts(t, mk(10, [3, 4, 5, 6])).lists.showcase!.map((p) => p.id)).toEqual(["p3", "p4", "p5", "p6"]);
    expect(planProducts(t, mk(10, [3])).lists.showcase!.map((p) => p.id)).toEqual(["p0", "p1", "p2", "p3"]);
  });
  it("a grade não repete o que a vitrine mostrou", () => {
    const { lists } = planProducts(t, mk(10)); expect(lists.grid!.map((p) => p.id)).toEqual(["p4", "p5", "p6", "p7", "p8", "p9"]);
  });
  it("o produto do destaque principal é o primeiro da vitrine", () => { expect(planProducts(t, mk(10, [5, 6, 7, 8])).hero!.id).toBe("p5"); });
  it("vitrine por categoria e quantidade", () => {
    const t2 = setSetting(setSetting(setSetting(t, "showcase", "source", "collection"), "showcase", "collection", "c1"), "showcase", "count", 2);
    expect(planProducts(t2, mk(10)).lists.showcase!.map((p) => p.id)).toEqual(["p1", "p3"]);
  });
  it("seção oculta não reserva produtos", () => { expect(planProducts(setSectionHidden(t, "showcase", true), mk(6)).lists.grid).toHaveLength(6); });
});

describe("links do tema", () => {
  it("resolve caminhos da loja e preserva endereços completos", () => {
    expect(resolveLink("/store/x", "/catalog")).toBe("/store/x/catalog"); expect(resolveLink("/store/x", "/")).toBe("/store/x");
    expect(resolveLink("/store/x", "https://wa.me/55")).toBe("https://wa.me/55"); expect(resolveLink("/store/x", "#topo")).toBe("#topo"); expect(resolveLink("/store/x", "")).toBe("/store/x");
    expect(resolveLink("/store/x", "//evil.com")).toBe("//evil.com");
  });
});
