import type { ThemeSettingsData } from "@/db/schema";
import { defaultsFor, normalizeSettings, normalizeValue } from "./settings";
import { sectionSchema } from "./sections";
import { ID_PATTERN, LIMITS, type BlockInstance, type PageKind, type SectionInstance, type SectionRegion, type SettingValue, type Template, type ThemeGlobals, type ThemeStyle } from "./types";

export const emptyTemplate = (): Template => ({ v: 1, sections: {}, order: [] });

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Valida e corrige um modelo vindo do editor ou do banco. Nunca lança erro por conteúdo do usuário:
 * remove o que é desconhecido, limita tamanhos e preenche padrões. É idempotente.
 */
export function normalizeTemplate(raw: unknown, region: SectionRegion, page?: PageKind): { template: Template; issues: string[] } {
  const issues: string[] = [];
  if (!isObj(raw) || !isObj(raw.sections) || !Array.isArray(raw.order)) return { template: emptyTemplate(), issues: raw === undefined || raw === null ? [] : ["Modelo inválido: começou vazio."] };
  const src = raw.sections as Record<string, unknown>;
  const wanted = [...(raw.order as unknown[]).filter((x): x is string => typeof x === "string"), ...Object.keys(src)];
  const seen = new Set<string>(); const sections: Record<string, SectionInstance> = {}; const order: string[] = []; const singletons = new Set<string>();
  for (const id of wanted) {
    if (seen.has(id)) continue; seen.add(id);
    if (order.length >= LIMITS.sections) { issues.push(`Limite de ${LIMITS.sections} seções.`); break; }
    const s = src[id];
    if (!ID_PATTERN.test(id) || !isObj(s) || typeof s.type !== "string") { issues.push(`Seção “${id}” inválida removida.`); continue; }
    const schema = sectionSchema(s.type);
    if (!schema) { issues.push(`Seção “${id}” de tipo desconhecido (${s.type}) removida.`); continue; }
    if (schema.region !== region) { issues.push(`Seção “${schema.name}” não pertence a este local.`); continue; }
    if (region === "content" && page && !schema.pages.includes(page)) { issues.push(`Seção “${schema.name}” não é permitida nesta página.`); continue; }
    if (schema.singleton) { const key = schema.slot ?? schema.type; if (singletons.has(key)) { issues.push(`Só pode haver uma seção “${schema.name}”.`); continue; } singletons.add(key); }
    const rawBlocks = isObj(s.blocks) ? s.blocks : {};
    const bids = [...(Array.isArray(s.blockOrder) ? s.blockOrder.filter((x): x is string => typeof x === "string") : []), ...Object.keys(rawBlocks)];
    const blocks: Record<string, BlockInstance> = {}; const blockOrder: string[] = []; const bseen = new Set<string>(); const perType: Record<string, number> = {};
    for (const bid of bids) {
      if (bseen.has(bid)) continue; bseen.add(bid);
      const b = rawBlocks[bid];
      if (!ID_PATTERN.test(bid) || !isObj(b) || typeof b.type !== "string") continue;
      const def = schema.blocks?.find((d) => d.type === b.type); if (!def) continue;
      if (blockOrder.length >= (schema.maxBlocks ?? LIMITS.blocks)) { issues.push(`Limite de blocos em “${schema.name}”.`); break; }
      perType[def.type] = (perType[def.type] ?? 0) + 1; if (def.limit && perType[def.type]! > def.limit) continue;
      blocks[bid] = { type: def.type, settings: normalizeSettings(def.settings, isObj(b.settings) ? b.settings : {}), ...(b.hidden === true ? { hidden: true } : {}) };
      blockOrder.push(bid);
    }
    sections[id] = { type: schema.type, settings: normalizeSettings(schema.settings, isObj(s.settings) ? s.settings : {}), blocks, blockOrder, ...(s.hidden === true ? { hidden: true } : {}) };
    order.push(id);
  }
  return { template: { v: 1, sections, order }, issues };
}

// ---------------------------------------------------------------------------
// Operações do editor (puras): cada uma devolve um modelo novo, sempre válido
// ---------------------------------------------------------------------------
export class TemplateOpError extends Error {}

export function newSectionId(type: string, taken: Iterable<string>): string {
  const used = new Set(taken); const base = type.replace(/[^a-z0-9]+/g, "-").slice(0, 30);
  if (!used.has(base)) return base; let n = 2; while (used.has(`${base}-${n}`)) n++; return `${base}-${n}`;
}

function instantiateBlock(def: NonNullable<ReturnType<typeof sectionSchema>>["blocks"] extends (infer B)[] | undefined ? B : never, over?: Record<string, SettingValue>): BlockInstance {
  return { type: def.type, settings: normalizeSettings(def.settings, { ...defaultsFor(def.settings), ...(over ?? {}) }) };
}

export function addSection(t: Template, type: string, opts: { region: SectionRegion; page?: PageKind; index?: number; preset?: number }): { template: Template; id: string } {
  const schema = sectionSchema(type);
  if (!schema) throw new TemplateOpError("Seção desconhecida.");
  if (schema.region !== opts.region) throw new TemplateOpError("Esta seção não pode ser usada aqui.");
  if (opts.region === "content" && opts.page && !schema.pages.includes(opts.page)) throw new TemplateOpError("Esta seção não é permitida nesta página.");
  if (t.order.length >= LIMITS.sections) throw new TemplateOpError(`Limite de ${LIMITS.sections} seções.`);
  if (schema.singleton && t.order.some((id) => { const o = sectionSchema(t.sections[id]!.type); return (o?.slot ?? o?.type) === (schema.slot ?? schema.type); })) throw new TemplateOpError(`Só pode haver uma seção “${schema.name}”.`);
  const preset = schema.presets[opts.preset ?? 0] ?? schema.presets[0];
  const id = newSectionId(type, t.order);
  const blocks: Record<string, BlockInstance> = {}; const blockOrder: string[] = [];
  for (const pb of preset?.blocks ?? []) { const def = schema.blocks?.find((b) => b.type === pb.type); if (!def) continue; const bid = newSectionId(def.type, blockOrder); blocks[bid] = instantiateBlock(def, pb.settings); blockOrder.push(bid); }
  const inst: SectionInstance = { type, settings: normalizeSettings(schema.settings, { ...defaultsFor(schema.settings), ...(preset?.settings ?? {}) }), blocks, blockOrder };
  const order = [...t.order]; const at = opts.index === undefined ? order.length : Math.max(0, Math.min(order.length, opts.index)); order.splice(at, 0, id);
  return { template: { ...t, sections: { ...t.sections, [id]: inst }, order }, id };
}

export function removeSection(t: Template, id: string): Template {
  if (!t.sections[id]) return t;
  const { [id]: _gone, ...rest } = t.sections; void _gone;
  return { ...t, sections: rest, order: t.order.filter((x) => x !== id) };
}

export function moveSection(t: Template, id: string, toIndex: number): Template {
  const from = t.order.indexOf(id); if (from < 0) return t;
  const to = Math.max(0, Math.min(t.order.length - 1, toIndex)); if (from === to) return t;
  const order = [...t.order]; order.splice(from, 1); order.splice(to, 0, id); return { ...t, order };
}

export function duplicateSection(t: Template, id: string): { template: Template; id: string } {
  const s = t.sections[id]; if (!s) throw new TemplateOpError("Seção não encontrada.");
  const schema = sectionSchema(s.type)!;
  if (schema.singleton) throw new TemplateOpError(`Só pode haver uma seção “${schema.name}”.`);
  if (t.order.length >= LIMITS.sections) throw new TemplateOpError(`Limite de ${LIMITS.sections} seções.`);
  const nid = newSectionId(s.type, t.order); const order = [...t.order]; order.splice(order.indexOf(id) + 1, 0, nid);
  return { template: { ...t, sections: { ...t.sections, [nid]: structuredClone(s) }, order }, id: nid };
}

export function setSectionHidden(t: Template, id: string, hidden: boolean): Template {
  const s = t.sections[id]; if (!s) return t;
  const { hidden: _h, ...rest } = s; void _h;
  return { ...t, sections: { ...t.sections, [id]: hidden ? { ...rest, hidden: true } : rest } };
}

export function setSetting(t: Template, id: string, settingId: string, value: unknown): Template {
  const s = t.sections[id]; if (!s) throw new TemplateOpError("Seção não encontrada.");
  const def = sectionSchema(s.type)!.settings.find((d) => d.id === settingId); if (!def) throw new TemplateOpError("Configuração desconhecida.");
  return { ...t, sections: { ...t.sections, [id]: { ...s, settings: { ...s.settings, [settingId]: normalizeValue(def, value) } } } };
}

export function addBlock(t: Template, id: string, type: string, index?: number): { template: Template; blockId: string } {
  const s = t.sections[id]; if (!s) throw new TemplateOpError("Seção não encontrada.");
  const schema = sectionSchema(s.type)!; const def = schema.blocks?.find((b) => b.type === type); if (!def) throw new TemplateOpError("Bloco desconhecido.");
  if (s.blockOrder.length >= (schema.maxBlocks ?? LIMITS.blocks)) throw new TemplateOpError("Limite de blocos desta seção.");
  if (def.limit && s.blockOrder.filter((b) => s.blocks[b]!.type === type).length >= def.limit) throw new TemplateOpError("Limite deste tipo de bloco.");
  const blockId = newSectionId(type, s.blockOrder); const blockOrder = [...s.blockOrder]; blockOrder.splice(index === undefined ? blockOrder.length : Math.max(0, Math.min(blockOrder.length, index)), 0, blockId);
  return { template: { ...t, sections: { ...t.sections, [id]: { ...s, blocks: { ...s.blocks, [blockId]: instantiateBlock(def) }, blockOrder } } }, blockId };
}

export function removeBlock(t: Template, id: string, blockId: string): Template {
  const s = t.sections[id]; if (!s || !s.blocks[blockId]) return t;
  const { [blockId]: _b, ...blocks } = s.blocks; void _b;
  return { ...t, sections: { ...t.sections, [id]: { ...s, blocks, blockOrder: s.blockOrder.filter((b) => b !== blockId) } } };
}

export function moveBlock(t: Template, id: string, blockId: string, toIndex: number): Template {
  const s = t.sections[id]; if (!s) return t; const from = s.blockOrder.indexOf(blockId); if (from < 0) return t;
  const to = Math.max(0, Math.min(s.blockOrder.length - 1, toIndex)); if (from === to) return t;
  const blockOrder = [...s.blockOrder]; blockOrder.splice(from, 1); blockOrder.splice(to, 0, blockId);
  return { ...t, sections: { ...t.sections, [id]: { ...s, blockOrder } } };
}

export function setBlockSetting(t: Template, id: string, blockId: string, settingId: string, value: unknown): Template {
  const s = t.sections[id]; const b = s?.blocks[blockId]; if (!s || !b) throw new TemplateOpError("Bloco não encontrado.");
  const def = sectionSchema(s.type)!.blocks?.find((d) => d.type === b.type)?.settings.find((d) => d.id === settingId); if (!def) throw new TemplateOpError("Configuração desconhecida.");
  return { ...t, sections: { ...t.sections, [id]: { ...s, blocks: { ...s.blocks, [blockId]: { ...b, settings: { ...b.settings, [settingId]: normalizeValue(def, value) } } } } } };
}

/** Assinatura estável para comparar modelos (rascunho versus publicado). */
export const templateSignature = (t: Template): string => JSON.stringify({ o: t.order, s: t.order.map((id) => [id, t.sections[id]]) });
export const sameTemplate = (a: Template, b: Template) => templateSignature(a) === templateSignature(b);

// ---------------------------------------------------------------------------
// Tema atual convertido em modelo (as lojas existentes continuam idênticas)
// ---------------------------------------------------------------------------
type Ins = { type: string; settings?: Record<string, SettingValue>; blocks?: { type: string; settings?: Record<string, SettingValue> }[]; hidden?: boolean };
export type SectionSpec = Ins;
/** Monta e valida um modelo a partir de uma lista de seções (usado pelos temas prontos e pela conversão do tema atual). */
export function buildTemplate(region: SectionRegion, page: PageKind | undefined, items: [string, Ins][]): Template { return build(region, page, items); }
function build(region: SectionRegion, page: PageKind | undefined, items: [string, Ins][]): Template {
  const sections: Record<string, unknown> = {}; const order: string[] = [];
  for (const [id, it] of items) {
    const schema = sectionSchema(it.type)!; const blocks: Record<string, unknown> = {}; const blockOrder: string[] = [];
    (it.blocks ?? []).forEach((b, i) => { const bid = `${b.type}-${i + 1}`; blocks[bid] = { type: b.type, settings: b.settings ?? {} }; blockOrder.push(bid); });
    sections[id] = { type: schema.type, settings: it.settings ?? {}, blocks, blockOrder, ...(it.hidden ? { hidden: true } : {}) }; order.push(id);
  }
  return normalizeTemplate({ v: 1, sections, order }, region, page).template;
}

const trustPreset = () => sectionSchema("trust-bar")!.presets[0]!.blocks!;
const sealsPreset = () => sectionSchema("security-seals")!.presets[0]!.blocks!;

export function templateFromLegacy(s: ThemeSettingsData, themeKey = "starter"): Template {
  const items: [string, Ins][] = [
    ["hero", { type: "hero", settings: { title: s.heroTitle, subtitle: s.heroSubtitle, ctaLabel: s.heroCta, ctaLink: "/catalog", layout: themeKey === "elite" ? "wide" : "split" } }],
    ["trust", { type: "trust-bar", blocks: trustPreset() }],
    ["categories", { type: "category-chips", hidden: !s.showCategories }],
    ["showcase", { type: "product-showcase" }],
  ];
  if (s.banners.length) items.push(["banners", { type: "promo-banners", blocks: s.banners.map((b) => ({ type: "banner", settings: { title: b.title, subtitle: b.subtitle, tone: b.tone, link: "/catalog" } })) }]);
  items.push(["grid", { type: "product-grid" }]);
  items.push(["seals", { type: "security-seals", blocks: sealsPreset() }], ["about", { type: "store-about", hidden: true }]);
  return build("content", "home", items);
}

export function legacyGlobals(store: { primaryColor: string; accentColor: string }, s: ThemeSettingsData): ThemeGlobals {
  return {
    v: 1,
    style: normalizeStyle({ primary: store.primaryColor, accent: store.accentColor }),
    header: build("header", undefined, [["announcement", { type: "announcement-bar", settings: { text: s.announcement }, hidden: !s.announcement.trim() }], ["header", { type: "header" }]]),
    footer: build("footer", undefined, [["footer", { type: "footer", settings: { text: s.footerText } }], ["wa", { type: "whatsapp-float" }]]),
  };
}

export const DEFAULT_STYLE: ThemeStyle = { primary: "#0f172a", accent: "#16a34a", headingFont: "display", bodyFont: "moderna", radius: 16, buttons: "solid", quickView: false, animations: false };
export function normalizeStyle(raw: Partial<Record<keyof ThemeStyle, unknown>> | undefined): ThemeStyle {
  const r = raw ?? {};
  const def = (id: keyof ThemeStyle) => STYLE_DEFS.find((d) => d.id === id)!;
  return {
    primary: normalizeValue(def("primary"), r.primary ?? DEFAULT_STYLE.primary) as string, accent: normalizeValue(def("accent"), r.accent ?? DEFAULT_STYLE.accent) as string,
    headingFont: normalizeValue(def("headingFont"), r.headingFont ?? DEFAULT_STYLE.headingFont) as string, bodyFont: normalizeValue(def("bodyFont"), r.bodyFont ?? DEFAULT_STYLE.bodyFont) as string,
    radius: normalizeValue(def("radius"), r.radius ?? DEFAULT_STYLE.radius) as number, buttons: normalizeValue(def("buttons"), r.buttons ?? DEFAULT_STYLE.buttons) as ThemeStyle["buttons"],
    quickView: normalizeValue(def("quickView"), r.quickView ?? DEFAULT_STYLE.quickView) as boolean, animations: normalizeValue(def("animations"), r.animations ?? DEFAULT_STYLE.animations) as boolean,
  };
}
/** Configurações globais do tema, no mesmo formato das seções (o editor as desenha do mesmo jeito). */
export const STYLE_DEFS = [
  { id: "primary", type: "color", label: "Cor principal", default: DEFAULT_STYLE.primary },
  { id: "accent", type: "color", label: "Cor de destaque", default: DEFAULT_STYLE.accent },
  { id: "headingFont", type: "font", label: "Fonte dos títulos", default: DEFAULT_STYLE.headingFont },
  { id: "bodyFont", type: "font", label: "Fonte do texto", default: DEFAULT_STYLE.bodyFont },
  { id: "radius", type: "range", label: "Cantos arredondados", min: 0, max: 28, step: 2, unit: "px", default: DEFAULT_STYLE.radius },
  { id: "buttons", type: "select", label: "Botões", options: [{ value: "solid", label: "Preenchidos" }, { value: "outline", label: "Só contorno" }], default: DEFAULT_STYLE.buttons },
  { id: "quickView", type: "checkbox", label: "Compra rápida nos cartões de produto", default: DEFAULT_STYLE.quickView },
  { id: "animations", type: "checkbox", label: "Movimento discreto ao rolar", default: DEFAULT_STYLE.animations },
] as const satisfies readonly import("./types").SettingDef[];

export function normalizeGlobals(raw: unknown): { globals: ThemeGlobals; issues: string[] } {
  const r = isObj(raw) ? raw : {};
  const h = normalizeTemplate(r.header, "header"); const f = normalizeTemplate(r.footer, "footer");
  return { globals: { v: 1, style: normalizeStyle(isObj(r.style) ? r.style : undefined), header: h.template, footer: f.template }, issues: [...h.issues, ...f.issues] };
}

/** Modelo de cada página quando a loja ainda não tem um salvo (o mesmo visual que a loja sempre teve). */
export function defaultTemplate(page: PageKind, settings: ThemeSettingsData, themeKey = "starter"): Template {
  if (page === "home") return templateFromLegacy(settings, themeKey);
  if (page === "product") return build("content", "product", [["product", { type: "product-main" }], ["seals", { type: "security-seals", blocks: sealsPreset() }], ["related", { type: "product-related" }]]);
  if (page === "collection") return build("content", "collection", [["header", { type: "collection-header" }], ["grid", { type: "collection-grid" }]]);
  return build("content", "cart", [["cart", { type: "cart-main" }], ["seals", { type: "security-seals", blocks: sealsPreset() }]]);
}

// ---------------------------------------------------------------------------
// Produtos por seção e links
// ---------------------------------------------------------------------------
type PlanProduct = { id: string; featured: boolean; categoryId: string | null };
/** Reparte os produtos entre as seções de vitrine e de grade, na ordem em que aparecem (sem repetir quando pedido). */
export function planProducts<P extends PlanProduct>(t: Template, products: P[]): { lists: Record<string, P[]>; hero: P | undefined } {
  const lists: Record<string, P[]> = {}; const shown = new Set<string>();
  for (const id of t.order) {
    const s = t.sections[id]!; if (s.hidden) continue;
    if (s.type === "product-showcase") {
      const count = Number(s.settings.count) || 4; const source = s.settings.source;
      let picked: P[];
      if (source === "collection") picked = products.filter((p) => p.categoryId === s.settings.collection).slice(0, count);
      else if (source === "latest") picked = products.slice(0, count);
      else { const feat = products.filter((p) => p.featured).slice(0, count); picked = feat.length >= count ? feat : products.slice(0, count); }
      lists[id] = picked; picked.forEach((p) => shown.add(p.id));
    } else if (s.type === "product-grid") {
      const rest = s.settings.skipShown ? products.filter((p) => !shown.has(p.id)) : products; lists[id] = rest;
      rest.forEach((p) => shown.add(p.id));
    }
  }
  const firstShowcase = t.order.find((id) => t.sections[id]!.type === "product-showcase" && !t.sections[id]!.hidden);
  return { lists, hero: (firstShowcase ? lists[firstShowcase]?.[0] : undefined) ?? products[0] };
}

/** Links do tema: "/catalog" vira o endereço da loja; endereços completos e âncoras ficam como estão. */
export function resolveLink(base: string, href: string): string {
  const h = href.trim(); if (!h) return base;
  if (h === "/") return base;
  if (h.startsWith("/") && !h.startsWith("//")) return `${base}${h}`;
  return h;
}
