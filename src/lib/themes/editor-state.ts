import type { PageKind, Template, ThemeGlobals } from "./types";

/** Estado puro do editor de tema: documento, seleção e histórico (desfazer e refazer com junção de digitação). */
export type Region = "header" | "content" | "footer";
/**
 * Páginas do documento: as fixas da loja (`home`, `product`, `collection`, `cart`) e as páginas livres do site
 * (NextLevel Business, NB2, D307), com chave `p:<id>`. Página livre é validada como página inicial (`kindOf`).
 */
export type PageKey = PageKind | `p:${string}`;
export type Doc = { pages: Record<string, Template>; globals: ThemeGlobals };
export const kindOf = (k: string): PageKind => (k.startsWith("p:") ? "home" : (k as PageKind));
export type Selection = { kind: "section"; region: Region; id: string } | { kind: "block"; region: Region; sectionId: string; blockId: string } | { kind: "style" } | null;
export type History = { past: Doc[]; present: Doc; future: Doc[]; lastKey: string | null; lastAt: number };

export const HISTORY_LIMIT = 100;
export const COALESCE_MS = 1200;

export const newHistory = (doc: Doc): History => ({ past: [], present: doc, future: [], lastKey: null, lastAt: 0 });

/** Grava uma alteração. Edições seguidas da mesma chave (ex.: digitar em um campo) viram um passo só no histórico. */
export function pushHistory(h: History, next: Doc, key: string | null = null, now = Date.now()): History {
  if (next === h.present) return h;
  if (key && key === h.lastKey && now - h.lastAt < COALESCE_MS) return { ...h, present: next, future: [], lastAt: now };
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [], lastKey: key, lastAt: now };
}
export const canUndo = (h: History) => h.past.length > 0;
export const canRedo = (h: History) => h.future.length > 0;
export function undo(h: History): History { const prev = h.past.at(-1); return prev ? { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future], lastKey: null, lastAt: 0 } : h; }
export function redo(h: History): History { const [next, ...rest] = h.future; return next ? { past: [...h.past, h.present], present: next, future: rest, lastKey: null, lastAt: 0 } : h; }

export function getTemplate(doc: Doc, region: Region, page: string): Template { return region === "header" ? doc.globals.header : region === "footer" ? doc.globals.footer : doc.pages[page]!; }
export function setTemplate(doc: Doc, region: Region, page: string, t: Template): Doc {
  if (region === "header") return { ...doc, globals: { ...doc.globals, header: t } };
  if (region === "footer") return { ...doc, globals: { ...doc.globals, footer: t } };
  return { ...doc, pages: { ...doc.pages, [page]: t } };
}

/** Depois de desfazer, remover ou trocar de página, a seleção some se o item deixou de existir. */
export function reconcileSelection(doc: Doc, sel: Selection, page: string): Selection {
  if (!sel || sel.kind === "style") return sel;
  const t = getTemplate(doc, sel.region, page);
  if (sel.kind === "section") return t.sections[sel.id] ? sel : null;
  const s = t.sections[sel.sectionId];
  return s && s.blocks[sel.blockId] ? sel : s ? { kind: "section", region: sel.region, id: sel.sectionId } : null;
}

/** Quais partes mudaram em relação à última gravação (para salvar só o necessário). */
export function changedParts(doc: Doc, saved: Doc): { pages: string[]; globals: boolean } {
  const pages = Object.keys(doc.pages).filter((p) => JSON.stringify(doc.pages[p]) !== JSON.stringify(saved.pages[p]));
  return { pages, globals: JSON.stringify(doc.globals) !== JSON.stringify(saved.globals) };
}
