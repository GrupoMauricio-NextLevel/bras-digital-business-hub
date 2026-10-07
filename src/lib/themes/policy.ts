/**
 * Política única de temas (pura, sem banco): o editor, o servidor e a galeria consultam as MESMAS funções.
 * Responde: o tema tem o recurso? a loja tem a licença? o plano permite loja virtual? a seção cabe nesta página?
 * os limites foram respeitados? o tema está liberado para compra/instalação?
 *
 * Regras de compatibilidade (direitos já vendidos não somem):
 *  - o que já está no documento (mesmo id e mesmo tipo de seção) continua valendo, mesmo acima do nível atual;
 *  - ajuste acima do nível pode voltar ao padrão (desligar sempre é permitido), mas não pode ganhar valor novo;
 *  - a oferta "Loja própria" mantém a reorganização de seções que o plano vendia antes dos níveis (LEGACY_PLAN_GRANTS).
 */
import type { OfferKey } from "@/lib/finance/price-book";
import { capabilitiesOf, CAPABILITY_LABEL, CAPABILITY_LEVEL, LEVEL_INFO, N2_EXTRA_SECTIONS, PLATFORM_MODULES, type Capability, type PlatformModule, type ThemeFamily, type ThemeLevel } from "./levels";
import { sectionSchema } from "./sections";
import { defaultValue } from "./settings";
import type { BlockDef, PageKind, SectionRegion, SectionSchema, SettingDef, SettingValue, Template, ThemeStyle } from "./types";

export type BlockReason =
  | "NO_STOREFRONT" // o plano não tem loja virtual
  | "NOT_RELEASED" // tema em revisão/rascunho: só demonstração
  | "NO_LICENSE" // tema pago sem licença da loja
  | "CAPABILITY_LOCKED" // o nível do tema ativo não concede o recurso
  | "FAMILY_ONLY" // seção de identidade de outra família
  | "MODULE_UNAVAILABLE" // depende de módulo operacional não contratado/implementado
  | "INCOMPATIBLE" // página ou região erradas, seção única repetida
  | "LIMIT"; // limite de seções/blocos do nível
export type Verdict = { ok: true } | { ok: false; reason: BlockReason; message: string; requiredLevel?: ThemeLevel; capability?: Capability };
const OK: Verdict = { ok: true };
const no = (reason: BlockReason, message: string, extra: Partial<Extract<Verdict, { ok: false }>> = {}): Verdict => ({ ok: false, reason, message, ...extra });

/** Recursos que a oferta "Loja própria" já vendia antes dos níveis ("Editor avançado": reorganizar seções e estilo). */
export const LEGACY_PLAN_GRANTS: Partial<Record<OfferKey, Capability[]>> = {
  STORE_OWN: ["editor.reorder", "editor.addSections", "editor.duplicate", "editor.variants", "style.extended", "product.quickView", "style.motion"],
};

/** Contexto de edição de uma loja: vem do tema ATIVO (e da licença dele), não do plano. */
export type EditingContext = {
  themeKey: string; themeName: string; family: ThemeFamily; level: ThemeLevel;
  caps: ReadonlySet<Capability>;
  /** Capacidades vindas do plano por compatibilidade (mostradas como "compatibilidade" no editor). */
  legacy: ReadonlySet<Capability>;
  modules: ReadonlySet<PlatformModule>;
  /** Ids das seções que compõem o tema em cada página e nos grupos globais (base do limite do N2). */
  base: Partial<Record<PageKind | "header" | "footer", string[]>>;
};

export function makeEditingContext(input: { themeKey: string; themeName: string; family: ThemeFamily; level: ThemeLevel; grants?: Capability[]; offer: OfferKey; base?: EditingContext["base"]; modules?: PlatformModule[] }): EditingContext {
  const legacy = new Set(LEGACY_PLAN_GRANTS[input.offer] ?? []);
  const caps = new Set<Capability>([...capabilitiesOf(input.level), ...(input.grants ?? []), ...legacy]);
  const modules = new Set((input.modules ?? []).filter((m) => PLATFORM_MODULES[m]?.available));
  return { themeKey: input.themeKey, themeName: input.themeName, family: input.family, level: input.level, caps, legacy, modules, base: input.base ?? {} };
}

const has = (ctx: EditingContext, c: Capability) => ctx.caps.has(c);
const levelName = (c: Capability) => LEVEL_INFO[CAPABILITY_LEVEL[c] as ThemeLevel].name;
const locked = (ctx: EditingContext, c: Capability, what: string): Verdict =>
  no("CAPABILITY_LOCKED", `${what} faz parte dos temas de nível ${levelName(c)} (${LEVEL_INFO[CAPABILITY_LEVEL[c] as ThemeLevel].short}). O tema ${ctx.themeName} é ${LEVEL_INFO[ctx.level].short}.`, { requiredLevel: CAPABILITY_LEVEL[c] as ThemeLevel, capability: c });

// ---------------------------------------------------------------------------
// Comercial: compra e instalação
// ---------------------------------------------------------------------------
export type ThemeCommercial = { key: string; name: string; priceCents: number; release: "released" | "review" | "draft" };

export function canPurchase(t: ThemeCommercial, s: { storefront: boolean; owned: boolean }): Verdict {
  if (!s.storefront) return no("NO_STOREFRONT", "Temas são para lojas com loja virtual. Veja o upgrade na Loja NextLevel.");
  if (t.release !== "released") return no("NOT_RELEASED", `O tema ${t.name} ainda está em revisão: dá para ver a demonstração, mas ele ainda não é vendido.`);
  if (t.priceCents === 0) return no("INCOMPATIBLE", "Este tema é grátis: é só instalar.");
  if (s.owned) return no("INCOMPATIBLE", "Você já tem este tema. É só instalar.");
  return OK;
}

/** Instalar: precisa da licença (grátis conta como licença). Quem já comprou instala mesmo que o tema volte para revisão. */
export function canInstall(t: ThemeCommercial, s: { storefront: boolean; owned: boolean }): Verdict {
  if (!s.storefront) return no("NO_STOREFRONT", "Temas são para lojas com loja virtual.");
  if (t.release !== "released" && !s.owned) return no("NOT_RELEASED", `O tema ${t.name} ainda está em revisão e não pode ser instalado.`);
  if (t.priceCents > 0 && !s.owned) return no("NO_LICENSE", `O tema ${t.name} ainda não foi comprado. Gere a fatura e pague para instalar.`);
  return OK;
}

// ---------------------------------------------------------------------------
// Editor: seções, blocos e ajustes
// ---------------------------------------------------------------------------
const requiredCap = (s: SectionSchema): Capability => s.requires ?? "content.basic";

/** A seção pode ser ADICIONADA nesta página com o tema ativo? (O diálogo do editor e o servidor usam esta função.) */
export function sectionAvailability(ctx: EditingContext, type: string, where: { region: SectionRegion; page?: PageKind }): Verdict {
  const s = sectionSchema(type);
  if (!s) return no("INCOMPATIBLE", "Seção desconhecida.");
  if (s.region !== where.region) return no("INCOMPATIBLE", `${s.name} não pode ser usada aqui.`);
  if (where.region === "content" && where.page && !s.pages.includes(where.page)) return no("INCOMPATIBLE", `${s.name} não é permitida nesta página.`);
  if (s.families && !s.families.includes(ctx.family)) return no("FAMILY_ONLY", `${s.name} faz parte da identidade de outra família de temas.`);
  if (s.module && !ctx.modules.has(s.module)) return no("MODULE_UNAVAILABLE", `${s.name} depende do módulo ${PLATFORM_MODULES[s.module].name}, que precisa estar contratado e configurado. O tema sozinho não liga esse serviço.`);
  const c = requiredCap(s);
  if (!has(ctx, c)) return locked(ctx, c, s.name);
  return OK;
}

/** Operações de estrutura que o tema ativo permite (o editor mostra/desabilita os botões com isto). */
export function structureRights(ctx: EditingContext) {
  return {
    add: has(ctx, "editor.addSections") ? "any" as const : has(ctx, "editor.addApproved") ? "approved" as const : "none" as const,
    reorder: has(ctx, "editor.reorder"),
    duplicate: has(ctx, "editor.duplicate"),
    hide: has(ctx, "editor.hide"),
    blocks: has(ctx, "editor.addApproved") || has(ctx, "editor.addSections"),
    extraLimit: has(ctx, "editor.addSections") ? Infinity : has(ctx, "editor.addApproved") ? N2_EXTRA_SECTIONS : 0,
  };
}

/** Quantos blocos deste tipo o nível permite. */
export function blockLimit(ctx: EditingContext, schema: SectionSchema, def: BlockDef): number {
  const byLevel = def.maxByLevel?.[ctx.level - 1];
  const schemaMax = Math.min(def.limit ?? Infinity, schema.maxBlocks ?? Infinity);
  if (byLevel !== undefined) {
    // Concessão explícita (ex.: Loja própria legado com N1) não aumenta limites de banner: eles são do tema.
    return Math.min(byLevel, schemaMax);
  }
  return structureRights(ctx).blocks ? schemaMax : 0;
}

/** O ajuste pode receber valor novo? (Voltar ao padrão ou desligar é sempre permitido.) */
export function settingAllowed(ctx: EditingContext, def: SettingDef): Verdict {
  if (!def.minLevel || def.minLevel <= ctx.level) return OK;
  // Ajustes de estilo/edição concedidos por compatibilidade
  if (def.minLevel && STYLE_CAP[def.id] && has(ctx, STYLE_CAP[def.id]!)) return OK;
  return no("CAPABILITY_LOCKED", `“${def.label}” faz parte dos temas de nível ${LEVEL_INFO[def.minLevel].name} (${LEVEL_INFO[def.minLevel].short}).`, { requiredLevel: def.minLevel });
}
/** Ajustes de estilo e a capacidade correspondente (para concessões explícitas, como a do plano Loja própria). */
const STYLE_CAP: Record<string, Capability> = { radius: "style.extended", buttons: "style.extended", headingFont: "style.basic", bodyFont: "style.basic", quickView: "product.quickView", animations: "style.motion" };
export const STYLE_MIN_LEVEL: Partial<Record<keyof ThemeStyle, ThemeLevel>> = { radius: 2, buttons: 2, quickView: 2, animations: 4 };

const isOff = (def: SettingDef, v: SettingValue | undefined) => v === undefined || v === defaultValue(def) || v === false || v === "";

// ---------------------------------------------------------------------------
// Validação de uma mudança (servidor): compara o documento novo com o atual
// ---------------------------------------------------------------------------
export type Violation = { reason: BlockReason; message: string; sectionId?: string; requiredLevel?: ThemeLevel };

function relativeOrder(order: string[], keep: Set<string>): string[] { return order.filter((id) => keep.has(id)); }

/**
 * Confere se `next` pode substituir `prev` com o tema ativo. Não normaliza (isso é feito antes): só decide permissão.
 * Devolve a lista de violações (vazia = permitido). Nunca transforma um uso proibido em sucesso silencioso.
 */
export function checkTemplateChange(ctx: EditingContext, prev: Template, next: Template, where: { region: SectionRegion; page?: PageKind }): Violation[] {
  const out: Violation[] = [];
  const rights = structureRights(ctx);
  const baseKey = where.region === "content" ? where.page : where.region;
  const base = new Set(baseKey ? ctx.base[baseKey] ?? [] : []);
  const kept = (id: string) => !!prev.sections[id] && prev.sections[id]!.type === next.sections[id]?.type;
  const added = next.order.filter((id) => !kept(id));
  const removed = prev.order.filter((id) => !next.sections[id] || next.sections[id]!.type !== prev.sections[id]!.type);

  // 1. Seções novas: o tipo precisa estar disponível e a estrutura precisa permitir adicionar.
  for (const id of added) {
    const v = sectionAvailability(ctx, next.sections[id]!.type, where);
    if (!v.ok) { out.push({ reason: v.reason, message: v.message, sectionId: id, requiredLevel: v.requiredLevel }); continue; }
    if (rights.add === "none") out.push({ reason: "CAPABILITY_LOCKED", message: `Adicionar seções faz parte dos temas ${LEVEL_INFO[2].short} em diante. O tema ${ctx.themeName} tem a composição fixa.`, sectionId: id, requiredLevel: 2 });
  }
  if (rights.add === "approved" && added.length) {
    const extras = next.order.filter((id) => !base.has(id)).length;
    const prevExtras = prev.order.filter((id) => !base.has(id)).length;
    if (extras > Math.max(rights.extraLimit, prevExtras)) out.push({ reason: "LIMIT", message: `O tema ${ctx.themeName} permite até ${rights.extraLimit} espaços extras por página. Para mais, use um tema ${LEVEL_INFO[3].short}.`, requiredLevel: 3 });
  }
  // 2. Seções removidas
  for (const id of removed) {
    const s = sectionSchema(prev.sections[id]!.type);
    if (s?.required) { out.push({ reason: "INCOMPATIBLE", message: `${s.name} é um espaço obrigatório desta página.`, sectionId: id }); continue; }
    const canRemove = rights.add === "any" || (rights.add === "approved" && !base.has(id));
    if (!canRemove) out.push({ reason: "CAPABILITY_LOCKED", message: `Remover espaços da composição do tema faz parte dos temas ${LEVEL_INFO[3].short}. Você pode ocultá-lo.`, sectionId: id, requiredLevel: 3 });
  }
  // 3. Ordem
  if (!rights.reorder) {
    const keep = new Set(prev.order.filter((id) => kept(id) && (rights.add === "none" || base.has(id))));
    if (JSON.stringify(relativeOrder(prev.order, keep)) !== JSON.stringify(relativeOrder(next.order, keep))) out.push({ reason: "CAPABILITY_LOCKED", message: `Mudar a ordem das seções do tema faz parte dos temas ${LEVEL_INFO[3].short}.`, requiredLevel: 3 });
  }
  // 4. Cada seção: ocultar, blocos e ajustes
  for (const id of next.order) {
    const s = next.sections[id]!; const schema = sectionSchema(s.type); if (!schema) continue;
    const old = kept(id) ? prev.sections[id] : undefined;
    if (s.hidden && !old?.hidden) {
      if (schema.required) out.push({ reason: "INCOMPATIBLE", message: `${schema.name} é obrigatório e não pode ser ocultado.`, sectionId: id });
      else if (!rights.hide) out.push({ reason: "CAPABILITY_LOCKED", message: "Ocultar espaços não está disponível.", sectionId: id });
    }
    checkSettings(ctx, schema.settings, s.settings, old?.settings, !old, schema.name, id, out);
    // Blocos: contagem por tipo dentro do limite do nível (o que já existia continua valendo).
    for (const def of schema.blocks ?? []) {
      const n = s.blockOrder.filter((b) => s.blocks[b]?.type === def.type).length;
      const before = old ? old.blockOrder.filter((b) => old.blocks[b]?.type === def.type).length : 0;
      const limit = blockLimit(ctx, schema, def);
      // Seção nova nasce com os blocos do preset; o limite vale do mesmo jeito.
      if (n > Math.max(limit, before)) out.push({ reason: "LIMIT", message: `${schema.name}: o tema ${ctx.themeName} permite ${limit === 0 ? "só os blocos que já existem" : `até ${limit} ${def.name.toLowerCase()}(s)`}.`, sectionId: id, requiredLevel: nextLevelWith(ctx, schema, def, n) });
    }
    if (old && !structureRights(ctx).blocks) {
      const prevIds = old.blockOrder.filter((b) => old.blocks[b]);
      const nextIds = s.blockOrder.filter((b) => s.blocks[b]);
      const sameSet = prevIds.length === nextIds.length && prevIds.every((b) => s.blocks[b]?.type === old.blocks[b]!.type);
      const noMaxByLevel = (schema.blocks ?? []).every((d) => !d.maxByLevel);
      if (!sameSet && noMaxByLevel) out.push({ reason: "CAPABILITY_LOCKED", message: `${schema.name}: incluir ou tirar itens faz parte dos temas ${LEVEL_INFO[2].short} em diante.`, sectionId: id, requiredLevel: 2 });
    }
    for (const bid of s.blockOrder) {
      const b = s.blocks[bid]; if (!b) continue; const def = schema.blocks?.find((d) => d.type === b.type); if (!def) continue;
      const ob = old?.blocks[bid]?.type === b.type ? old.blocks[bid] : undefined;
      checkSettings(ctx, def.settings, b.settings, ob?.settings, !ob, `${schema.name} · ${def.name}`, id, out);
    }
  }
  return out;
}

/**
 * Conferência na publicação: cada seção precisa estar disponível com o tema ativo OU já ter existido legitimamente na loja
 * (no publicado ou em uma versão do histórico). O mesmo vale para a quantidade de blocos por tipo. Assim um rascunho antigo ou
 * restaurado publica, mas um tipo de seção que a loja nunca teve com direito não chega ao público.
 */
export function checkPublishable(ctx: EditingContext, next: Template, refs: Template[], where: { region: SectionRegion; page?: PageKind }): Violation[] {
  const out: Violation[] = [];
  const typesSeen = new Set(refs.flatMap((r) => Object.values(r.sections).map((s) => s.type)));
  const maxBlocks = (type: string, block: string) => Math.max(0, ...refs.flatMap((r) => Object.values(r.sections).filter((s) => s.type === type).map((s) => s.blockOrder.filter((b) => s.blocks[b]?.type === block).length)));
  for (const id of next.order) {
    const s = next.sections[id]!; const schema = sectionSchema(s.type); if (!schema) continue;
    const v = sectionAvailability(ctx, s.type, where);
    if (!v.ok && v.reason !== "INCOMPATIBLE" && !typesSeen.has(s.type)) out.push({ reason: v.reason, message: v.message, sectionId: id, requiredLevel: v.requiredLevel });
    for (const def of schema.blocks ?? []) {
      const n = s.blockOrder.filter((b) => s.blocks[b]?.type === def.type).length;
      const limit = Math.max(blockLimit(ctx, schema, def), maxBlocks(s.type, def.type));
      if (def.maxByLevel && n > limit) out.push({ reason: "LIMIT", message: `${schema.name}: o tema ${ctx.themeName} permite até ${limit} ${def.name.toLowerCase()}(s).`, sectionId: id });
    }
  }
  return out;
}

function nextLevelWith(ctx: EditingContext, schema: SectionSchema, def: BlockDef, n: number): ThemeLevel | undefined {
  if (!def.maxByLevel) return 2;
  const i = def.maxByLevel.findIndex((m, k) => k + 1 > ctx.level && m >= n);
  return i >= 0 ? ((i + 1) as ThemeLevel) : undefined;
}

function checkSettings(ctx: EditingContext, defs: SettingDef[], next: Record<string, SettingValue>, prev: Record<string, SettingValue> | undefined, isNew: boolean, where: string, sectionId: string, out: Violation[]) {
  for (const def of defs) {
    if (!def.minLevel) continue;
    const v = next[def.id];
    if (!settingAllowed(ctx, def).ok) {
      const before = prev?.[def.id];
      // Mantém o que já estava, aceita voltar ao padrão/desligar; seção nova nasce com o padrão do esquema ou do preset do tema.
      if (v === before || isOff(def, v) || (isNew && v === defaultValue(def))) continue;
      out.push({ reason: "CAPABILITY_LOCKED", message: `${where}: “${def.label}” faz parte dos temas ${LEVEL_INFO[def.minLevel].short} (${LEVEL_INFO[def.minLevel].name}).`, sectionId, requiredLevel: def.minLevel });
    }
  }
}

/** Estilo global: mesmos princípios (o que o tema trouxe continua; mudar para valor novo exige o nível). */
export function checkStyleChange(ctx: EditingContext, prev: ThemeStyle, next: ThemeStyle, defaults: ThemeStyle): Violation[] {
  const out: Violation[] = [];
  for (const k of Object.keys(STYLE_MIN_LEVEL) as (keyof ThemeStyle)[]) {
    const min = STYLE_MIN_LEVEL[k]!; if (min <= ctx.level) continue;
    const cap = STYLE_CAP[k]; if (cap && ctx.caps.has(cap)) continue;
    const v = next[k]; if (v === prev[k] || v === defaults[k] || v === false) continue;
    out.push({ reason: "CAPABILITY_LOCKED", message: `“${STYLE_LABEL[k]}” faz parte dos temas ${LEVEL_INFO[min].short} (${LEVEL_INFO[min].name}).`, requiredLevel: min });
  }
  return out;
}
const STYLE_LABEL: Partial<Record<keyof ThemeStyle, string>> = { radius: "Cantos arredondados", buttons: "Estilo dos botões", quickView: "Compra rápida", animations: "Movimento ao rolar" };

/** Resumo legível de uma lista de violações (a primeira de cada motivo). */
export function violationMessage(v: Violation[]): string { return [...new Map(v.map((x) => [x.message, x])).values()].slice(0, 3).map((x) => x.message).join(" "); }

/** Texto da capacidade para cadeados e comparação. */
export const capabilityLabel = (c: Capability) => CAPABILITY_LABEL[c];

/** Versão serializável do contexto (vai do servidor para o editor no navegador). */
export type SerializedContext = { themeKey: string; themeName: string; family: ThemeFamily; level: ThemeLevel; caps: Capability[]; legacy: Capability[]; modules: PlatformModule[]; base: EditingContext["base"] };
export const serializeContext = (c: EditingContext): SerializedContext => ({ themeKey: c.themeKey, themeName: c.themeName, family: c.family, level: c.level, caps: [...c.caps], legacy: [...c.legacy], modules: [...c.modules], base: c.base });
export const hydrateContext = (c: SerializedContext): EditingContext => ({ ...c, caps: new Set(c.caps), legacy: new Set(c.legacy), modules: new Set(c.modules) });
