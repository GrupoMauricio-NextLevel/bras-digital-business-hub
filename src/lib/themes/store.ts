import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores, storeThemes, themeGlobals, themes, themeSettings, themeTemplates, themeTemplateVersions, themeVersions, type Store, type ThemeSettingsData } from "@/db/schema";
import { assertCanAccess, type Actor } from "@/lib/domain/access";
import { assertAssetsBelong } from "@/lib/domain/assets";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { requireFeature } from "@/lib/features";
import { newId } from "@/lib/ids";
import { defaultThemeSettings } from "@/lib/queries/merchant";
import { THEME_BY_KEY } from "./catalog";
import { activeThemeKey, editingContextFor, ownedThemeKeys } from "./license";
import { checkPublishable, checkStyleChange, checkTemplateChange, violationMessage, type Violation } from "./policy";
import { DEFAULT_STYLE, defaultTemplate, legacyGlobals, normalizeGlobals, normalizeTemplate, sameTemplate } from "./template";
import type { PageKind, SectionRegion, Template, ThemeGlobals } from "./types";
import { PAGE_KINDS } from "./types";
import { garantirLojaCompleta } from "./loja-completa";

const MAX_VERSIONS = 20;
export type Source = "draft" | "published" | "default";

async function loadStore(db: Database, storeId: string): Promise<Store> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  return store;
}
async function legacySettings(db: Database, storeId: string): Promise<ThemeSettingsData> {
  return (await db.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, storeId) }))?.settings ?? defaultThemeSettings();
}
const isPage = (p: string): p is PageKind => (PAGE_KINDS as readonly string[]).includes(p);

/** Estrutura (o que existe, a ordem e o que está oculto), sem os textos. Mudá-la exige o editor completo. */
export function structureOf(t: Template): string {
  return JSON.stringify(t.order.map((id) => { const s = t.sections[id]!; return [id, s.type, !!s.hidden, s.blockOrder.map((b) => [b, s.blocks[b]!.type, !!s.blocks[b]!.hidden])]; }));
}

// ---------------------------------------------------------------------------
// Leitura (usada pela loja pública e pelo editor)
// ---------------------------------------------------------------------------
export async function resolveTemplate(db: Database, store: Store, page: PageKind, opts: { draft?: boolean; themeKey?: string } = {}): Promise<{ template: Template; source: Source; hasDraft: boolean }> {
  let row = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, store.id), eq(themeTemplates.page, page)) });
  // D237 (L1): loja E-commerce sem nada salvo nasce com o tema grátis completo da família (instalado uma vez).
  if (!row && !opts.themeKey && (await garantirLojaCompleta(db, store))) row = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, store.id), eq(themeTemplates.page, page)) });
  const region: SectionRegion = "content";
  const fallback = async () => normalizeTemplate(defaultTemplate(page, await legacySettings(db, store.id), opts.themeKey), region, page).template;
  if (opts.draft && row?.draft) return { template: normalizeTemplate(row.draft, region, page).template, source: "draft", hasDraft: true };
  if (row?.published) return { template: normalizeTemplate(row.published, region, page).template, source: "published", hasDraft: !!row.draft };
  return { template: await fallback(), source: "default", hasDraft: !!row?.draft };
}

export async function resolveGlobals(db: Database, store: Store, opts: { draft?: boolean } = {}): Promise<{ globals: ThemeGlobals; source: Source; hasDraft: boolean }> {
  let row = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, store.id) });
  if (!row && (await garantirLojaCompleta(db, store))) row = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, store.id) });
  if (opts.draft && row?.draft) return { globals: normalizeGlobals(row.draft).globals, source: "draft", hasDraft: true };
  if (row?.published) return { globals: normalizeGlobals(row.published).globals, source: "published", hasDraft: !!row.draft };
  return { globals: normalizeGlobals(legacyGlobals(store, await legacySettings(db, store.id))).globals, source: "default", hasDraft: !!row?.draft };
}

// ---------------------------------------------------------------------------
// Escrita (só o dono da loja). Regras: política de temas (policy.ts) com o tema ATIVO e a licença dele.
// ---------------------------------------------------------------------------
function assertEditor(actor: Actor, store: Store) {
  assertCanAccess(actor, { storeId: store.id });
  if (actor.role !== "STORE_OWNER" && actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  requireFeature(store.offer, "appearanceBasic");
}

/** Erro de política: o código diz o motivo (recurso sem licença, limite, incompatível…), a mensagem diz o que fazer. */
export function throwViolations(v: Violation[]): void {
  if (!v.length) return;
  const code = v.find((x) => x.reason === "CAPABILITY_LOCKED")?.reason ?? v[0]!.reason;
  throw new DomainError(code === "CAPABILITY_LOCKED" ? "THEME_LOCKED" : code === "LIMIT" ? "THEME_LIMIT" : code === "FAMILY_ONLY" ? "THEME_FAMILY_ONLY" : code === "MODULE_UNAVAILABLE" ? "MODULE_UNAVAILABLE" : "THEME_INCOMPATIBLE", violationMessage(v));
}

/** Dado inválido (seção que não existe ou não cabe na página) não vira sucesso silencioso: é recusado com o motivo. */
function assertNothingDropped(raw: unknown, t: Template, issues: string[]) {
  const r = raw as { sections?: Record<string, unknown> } | null;
  const n = r && typeof r === "object" && r.sections && typeof r.sections === "object" ? Object.keys(r.sections).length : 0;
  if (n > t.order.length) throw new DomainError("THEME_INVALID", issues.filter((i) => /removid|não pertence|não é permitida|Só pode haver|Limite/.test(i)).join(" ") || "O modelo enviado tem seções inválidas.");
}

export class DraftConflictError extends DomainError {}
function assertRevision(current: number, base: number | undefined) {
  if (base !== undefined && base !== current) throw new DraftConflictError("DRAFT_CONFLICT", "Este rascunho foi alterado em outra aba ou aparelho. Recarregue para ver a versão mais nova (suas mudanças desta aba ficam no histórico do editor até você sair).");
}

/** Salva o rascunho de uma página, validando contra o documento atual com o tema ativo. */
export async function saveTemplateDraft(db: Database, actor: Actor, storeId: string, page: PageKind, raw: unknown, opts: { baseRevision?: number; skipPolicy?: boolean } = {}) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const { template, issues } = normalizeTemplate(raw, "content", page);
  assertNothingDropped(raw, template, issues);
  const row = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)) });
  assertRevision(row?.revision ?? 0, opts.baseRevision);
  const current = (await resolveTemplate(db, store, page, { draft: true })).template;
  await assertAssetsBelong(db, storeId, [template]);
  if (!opts.skipPolicy) throwViolations(checkTemplateChange(await editingContextFor(db, store), current, template, { region: "content", page }));
  const revision = (row?.revision ?? 0) + 1;
  await db.insert(themeTemplates).values({ storeId, page, draft: template, revision }).onConflictDoUpdate({ target: [themeTemplates.storeId, themeTemplates.page], set: { draft: template, revision, updatedAt: new Date().toISOString() } });
  return { template, issues, revision };
}

/** Salva o rascunho do estilo global e dos grupos de cabeçalho e rodapé. */
export async function saveGlobalsDraft(db: Database, actor: Actor, storeId: string, raw: unknown, opts: { baseRevision?: number; skipPolicy?: boolean } = {}) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const { globals, issues } = normalizeGlobals(raw);
  const r = raw as { header?: unknown; footer?: unknown } | null;
  if (r && typeof r === "object") { assertNothingDropped(r.header, globals.header, issues); assertNothingDropped(r.footer, globals.footer, issues); }
  const row = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  assertRevision(row?.revision ?? 0, opts.baseRevision);
  const cur = (await resolveGlobals(db, store, { draft: true })).globals;
  await assertAssetsBelong(db, storeId, [globals]);
  if (!opts.skipPolicy) {
    const ctx = await editingContextFor(db, store);
    throwViolations([...checkStyleChange(ctx, cur.style, globals.style, DEFAULT_STYLE), ...checkTemplateChange(ctx, cur.header, globals.header, { region: "header" }), ...checkTemplateChange(ctx, cur.footer, globals.footer, { region: "footer" })]);
  }
  const revision = (row?.revision ?? 0) + 1;
  await db.insert(themeGlobals).values({ storeId, draft: globals, revision }).onConflictDoUpdate({ target: themeGlobals.storeId, set: { draft: globals, revision, updatedAt: new Date().toISOString() } });
  return { globals, issues, revision };
}

/** Revisões atuais de cada página e dos globais (o editor guarda e manda de volta ao salvar e publicar). */
export async function draftRevisions(db: Database, storeId: string): Promise<Record<PageKind | "globals", number>> {
  const rows = await db.select({ page: themeTemplates.page, revision: themeTemplates.revision }).from(themeTemplates).where(eq(themeTemplates.storeId, storeId));
  const g = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  const out = { home: 0, product: 0, collection: 0, cart: 0, globals: g?.revision ?? 0 } as Record<PageKind | "globals", number>;
  for (const r of rows) out[r.page as PageKind] = r.revision;
  return out;
}

export async function saveSnapshot(db: Database, storeId: string, page: string, data: unknown, label: string, by: string, meta: { themeKey?: string | null; kind?: "published" | "draft" } = {}) {
  await db.insert(themeTemplateVersions).values({ id: newId("tpv"), storeId, page, snapshot: data, label, createdBy: by, themeKey: meta.themeKey ?? null, kind: meta.kind ?? "published" });
  const rows = await db.select({ id: themeTemplateVersions.id }).from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, page))).orderBy(desc(themeTemplateVersions.createdAt), desc(themeTemplateVersions.id));
  for (const r of rows.slice(MAX_VERSIONS)) await db.delete(themeTemplateVersions).where(eq(themeTemplateVersions.id, r.id));
}

/** Publica o rascunho de uma página e guarda a versão no histórico. Sem rascunho, não faz nada. */
export async function publishTemplate(db: Database, actor: Actor, storeId: string, page: PageKind, label = "Publicação") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const row = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)) });
  if (!row?.draft) return { published: false as const };
  const template = normalizeTemplate(row.draft, "content", page).template;
  const ctx = await editingContextFor(db, store);
  throwViolations(checkPublishable(ctx, template, [(await resolveTemplate(db, store, page)).template, ...(await versionTemplates(db, storeId, page))], { region: "content", page }));
  await db.transaction(async (tx) => {
    await tx.update(themeTemplates).set({ published: template, draft: null, revision: row.revision + 1, updatedAt: new Date().toISOString() }).where(and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)));
    await saveSnapshot(tx as unknown as Database, storeId, page, template, label, actor.userId, { themeKey: ctx.themeKey });
  });
  return { published: true as const };
}

export async function publishGlobals(db: Database, actor: Actor, storeId: string, label = "Publicação do estilo") {
  return publishAllDrafts(db, actor, storeId, label, { only: "globals" });
}

/**
 * Publica TODAS as páginas com rascunho e o estilo global numa única transação: ou vai tudo, ou nada
 * (nunca cabeçalho novo com página antiga). Valida tudo com a política antes de gravar qualquer coisa.
 * `expected` (revisões que o editor conhece): se outra aba mudou algo depois, recusa com conflito.
 */
export async function publishAllDrafts(db: Database, actor: Actor, storeId: string, label = "Publicação", opts: { expected?: Partial<Record<PageKind | "globals", number>>; only?: "globals" } = {}) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const rows = opts.only ? [] : await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, storeId));
  const gRow = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  for (const r of rows) if (opts.expected?.[r.page as PageKind] !== undefined) assertRevision(r.revision, opts.expected[r.page as PageKind]);
  if (gRow && opts.expected?.globals !== undefined) assertRevision(gRow.revision, opts.expected.globals);
  const pages = rows.filter((r) => r.draft).map((r) => ({ page: r.page as PageKind, revision: r.revision, template: normalizeTemplate(r.draft, "content", r.page as PageKind).template }));
  const globals = gRow?.draft ? normalizeGlobals(gRow.draft).globals : null;
  if (!pages.length && !globals) return { pages: 0, globals: false };
  const ctx = await editingContextFor(db, store);
  const v: Violation[] = [];
  for (const p of pages) v.push(...checkPublishable(ctx, p.template, [(await resolveTemplate(db, store, p.page)).template, ...(await versionTemplates(db, storeId, p.page))], { region: "content", page: p.page }));
  if (globals) {
    const pub = (await resolveGlobals(db, store)).globals; const hist = (await versionGlobals(db, storeId));
    v.push(...checkPublishable(ctx, globals.header, [pub.header, ...hist.map((h) => h.header)], { region: "header" }), ...checkPublishable(ctx, globals.footer, [pub.footer, ...hist.map((h) => h.footer)], { region: "footer" }));
  }
  throwViolations(v);
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    for (const p of pages) {
      await tx.update(themeTemplates).set({ published: p.template, draft: null, revision: p.revision + 1, updatedAt: now }).where(and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, p.page)));
      await saveSnapshot(tx as unknown as Database, storeId, p.page, p.template, label, actor.userId, { themeKey: ctx.themeKey });
    }
    if (globals) {
      await tx.update(themeGlobals).set({ published: globals, draft: null, revision: (gRow?.revision ?? 0) + 1, updatedAt: now }).where(eq(themeGlobals.storeId, storeId));
      // As cores da loja seguem o estilo publicado (logo, avisos e demais telas usam as mesmas).
      await tx.update(stores).set({ primaryColor: globals.style.primary, accentColor: globals.style.accent, updatedAt: now }).where(eq(stores.id, storeId));
      await saveSnapshot(tx as unknown as Database, storeId, "globals", globals, label, actor.userId, { themeKey: ctx.themeKey });
    }
  });
  return { pages: pages.length, globals: !!globals };
}

/** Modelos guardados no histórico (estados que a loja já teve com direito). */
async function versionTemplates(db: Database, storeId: string, page: PageKind): Promise<Template[]> {
  const rows = await db.select({ snapshot: themeTemplateVersions.snapshot }).from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, page)));
  return rows.map((r) => normalizeTemplate(r.snapshot, "content", page).template);
}
async function versionGlobals(db: Database, storeId: string): Promise<ThemeGlobals[]> {
  const rows = await db.select({ snapshot: themeTemplateVersions.snapshot }).from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, "globals")));
  return rows.map((r) => normalizeGlobals(r.snapshot).globals);
}

export async function discardDraft(db: Database, actor: Actor, storeId: string, page: PageKind | "globals") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const now = new Date().toISOString();
  if (page === "globals") { const g = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) }); if (g) await db.update(themeGlobals).set({ draft: null, revision: g.revision + 1, updatedAt: now }).where(eq(themeGlobals.storeId, storeId)); }
  else { const r = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)) }); if (r) await db.update(themeTemplates).set({ draft: null, revision: r.revision + 1, updatedAt: now }).where(and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page))); }
}

export async function listVersions(db: Database, actor: Actor, storeId: string, page: PageKind | "globals") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  return db.select().from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, page))).orderBy(desc(themeTemplateVersions.createdAt), desc(themeTemplateVersions.id));
}

/**
 * Coloca uma versão antiga no rascunho (não publica: o dono revisa e publica). Se a versão é de outro tema, a loja volta a
 * esse tema antes (só se tiver direito a ele); a política é aplicada com o tema da versão.
 */
export async function restoreVersion(db: Database, actor: Actor, storeId: string, versionId: string) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const v = await db.query.themeTemplateVersions.findFirst({ where: and(eq(themeTemplateVersions.id, versionId), eq(themeTemplateVersions.storeId, storeId)) });
  if (!v) throw new NotFoundError("Versão não encontrada.");
  if (v.page !== "globals" && !isPage(v.page)) throw new DomainError("INVALID", "Versão inválida.");
  let switched: string | null = null;
  if (v.themeKey && v.themeKey !== (await activeThemeKey(db, storeId))) {
    if (!(await ownedThemeKeys(db, storeId)).has(v.themeKey)) throw new DomainError("NO_LICENSE", `Esta versão usa o tema ${THEME_BY_KEY[v.themeKey]?.name ?? v.themeKey}, que a loja não tem mais. Compre o tema para restaurá-la.`);
    await setActiveTheme(db, storeId, v.themeKey); switched = v.themeKey;
  }
  // A versão guardada vira o documento de referência: o que ela tinha volta a valer (é um estado que a loja já teve com direito).
  if (v.page === "globals") await saveGlobalsDraft(db, actor, storeId, v.snapshot, { skipPolicy: true });
  else {
    await saveTemplateDraft(db, actor, storeId, v.page as PageKind, v.snapshot, { skipPolicy: true });
  }
  return { page: v.page as PageKind | "globals", switchedTo: switched };
}

/** Troca o tema ativo da loja (sem mexer nos modelos). Usado na restauração de versões de outro tema. */
async function setActiveTheme(db: Database, storeId: string, key: string) {
  const theme = await db.query.themes.findFirst({ where: eq(themes.key, key) }); if (!theme) throw new NotFoundError("Tema não encontrado.");
  const version = await db.query.themeVersions.findFirst({ where: and(eq(themeVersions.themeId, theme.id), eq(themeVersions.status, "PUBLISHED")) }); if (!version) throw new NotFoundError("Versão do tema não encontrada.");
  const has = await db.query.storeThemes.findFirst({ where: eq(storeThemes.storeId, storeId) });
  if (has) await db.update(storeThemes).set({ themeId: theme.id, themeVersionId: version.id, activatedAt: new Date().toISOString() }).where(eq(storeThemes.storeId, storeId));
  else await db.insert(storeThemes).values({ storeId, themeId: theme.id, themeVersionId: version.id });
}

export const hasUnpublished = async (db: Database, storeId: string): Promise<boolean> => {
  const t = await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, storeId));
  const g = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  return t.some((r) => r.draft && !(r.published && sameTemplate(normalizeTemplate(r.draft, "content", r.page).template, normalizeTemplate(r.published, "content", r.page).template))) || !!g?.draft;
};
