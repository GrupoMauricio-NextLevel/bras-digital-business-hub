import { describe, expect, it } from "vitest";
import { canRedo, canUndo, changedParts, getTemplate, newHistory, pushHistory, reconcileSelection, redo, setTemplate, undo, COALESCE_MS, HISTORY_LIMIT, type Doc } from "@/lib/themes/editor-state";
import { emptyTemplate, legacyGlobals, removeSection, setSetting, templateFromLegacy } from "@/lib/themes/template";

const legacy = { heroTitle: "A", heroSubtitle: "B", heroCta: "C", announcement: "", banners: [], showCategories: true, footerText: "" };
const doc = (): Doc => ({ pages: { home: templateFromLegacy(legacy), product: emptyTemplate(), collection: emptyTemplate(), cart: emptyTemplate() }, globals: legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, legacy) });
const title = (d: Doc) => d.pages.home.sections.hero!.settings.title;
const edit = (d: Doc, t: string) => setTemplate(d, "content", "home", setSetting(getTemplate(d, "content", "home"), "hero", "title", t));

describe("histórico do editor", () => {
  it("desfaz e refaz", () => {
    let h = newHistory(doc()); h = pushHistory(h, edit(h.present, "Um")); h = pushHistory(h, edit(h.present, "Dois"), null);
    expect(title(h.present)).toBe("Dois"); expect(canUndo(h)).toBe(true);
    h = undo(h); expect(title(h.present)).toBe("Um"); expect(canRedo(h)).toBe(true);
    h = redo(h); expect(title(h.present)).toBe("Dois"); expect(canRedo(h)).toBe(false);
  });
  it("digitação seguida no mesmo campo vira um passo só", () => {
    let h = newHistory(doc()); const t0 = 1_000_000;
    for (const [i, s] of ["O", "Ol", "Olá"].entries()) h = pushHistory(h, edit(h.present, s), "hero.title", t0 + i * 200);
    expect(h.past).toHaveLength(1); expect(title(undo(h).present)).toBe("A");
  });
  it("pausa longa ou outro campo abre novo passo", () => {
    let h = newHistory(doc()); const t0 = 1_000_000;
    h = pushHistory(h, edit(h.present, "Um"), "hero.title", t0); h = pushHistory(h, edit(h.present, "Dois"), "hero.title", t0 + COALESCE_MS + 10); h = pushHistory(h, edit(h.present, "Três"), "outro", t0 + COALESCE_MS + 20);
    expect(h.past).toHaveLength(3);
  });
  it("nova alteração descarta o que seria refeito", () => {
    let h = newHistory(doc()); h = pushHistory(h, edit(h.present, "Um")); h = undo(h); h = pushHistory(h, edit(h.present, "Outro"));
    expect(canRedo(h)).toBe(false);
  });
  it("limita o tamanho do histórico e ignora estado igual", () => {
    let h = newHistory(doc());
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) h = pushHistory(h, edit(h.present, `t${i}`), null);
    expect(h.past.length).toBe(HISTORY_LIMIT); expect(pushHistory(h, h.present)).toBe(h);
  });
});

describe("seleção e alterações", () => {
  it("a seleção some quando o item é removido; bloco removido volta para a seção", () => {
    const d = doc(); const sel = { kind: "section", region: "content", id: "hero" } as const;
    expect(reconcileSelection(d, sel, "home")).toEqual(sel);
    expect(reconcileSelection(setTemplate(d, "content", "home", removeSection(d.pages.home, "hero")), sel, "home")).toBeNull();
    const bsel = { kind: "block", region: "content", sectionId: "trust", blockId: "nao-existe" } as const;
    expect(reconcileSelection(d, bsel, "home")).toEqual({ kind: "section", region: "content", id: "trust" });
    expect(reconcileSelection(d, { kind: "style" }, "home")).toEqual({ kind: "style" });
  });
  it("aponta o que mudou para salvar só o necessário", () => {
    const saved = doc(); const d = edit(saved, "Novo");
    expect(changedParts(d, saved)).toEqual({ pages: ["home"], globals: false });
    expect(changedParts(saved, saved)).toEqual({ pages: [], globals: false });
    const g = { ...saved, globals: { ...saved.globals, style: { ...saved.globals.style, radius: 4 } } };
    expect(changedParts(g, saved)).toEqual({ pages: [], globals: true });
  });
});
