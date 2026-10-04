import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores, themeGlobals, themeSettings, themeTemplates, themeTemplateVersions, type Store, type ThemeSettingsData } from "@/db/schema";
import { assertCanAccess, type Actor } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { requireFeature } from "@/lib/features";
import { newId } from "@/lib/ids";
import { defaultThemeSettings } from "@/lib/queries/merchant";
import { sectionSchema } from "./sections";
import { defaultTemplate, legacyGlobals, normalizeGlobals, normalizeTemplate, sameTemplate } from "./template";
import type { PageKind, SectionRegion, Template, ThemeGlobals } from "./types";
import { PAGE_KINDS } from "./types";

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
  const row = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, store.id), eq(themeTemplates.page, page)) });
  const region: SectionRegion = "content";
  const fallback = async () => normalizeTemplate(defaultTemplate(page, await legacySettings(db, store.id), opts.themeKey), region, page).template;
  if (opts.draft && row?.draft) return { template: normalizeTemplate(row.draft, region, page).template, source: "draft", hasDraft: true };
  if (row?.published) return { template: normalizeTemplate(row.published, region, page).template, source: "published", hasDraft: !!row.draft };
  return { template: await fallback(), source: "default", hasDraft: !!row?.draft };
}

export async function resolveGlobals(db: Database, store: Store, opts: { draft?: boolean } = {}): Promise<{ globals: ThemeGlobals; source: Source; hasDraft: boolean }> {
  const row = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, store.id) });
  if (opts.draft && row?.draft) return { globals: normalizeGlobals(row.draft).globals, source: "draft", hasDraft: true };
  if (row?.published) return { globals: normalizeGlobals(row.published).globals, source: "published", hasDraft: !!row.draft };
  return { globals: normalizeGlobals(legacyGlobals(store, await legacySettings(db, store.id))).globals, source: "default", hasDraft: !!row?.draft };
}

// ---------------------------------------------------------------------------
// Escrita (só o dono da loja, com as regras da oferta)
// ---------------------------------------------------------------------------
function assertEditor(actor: Actor, store: Store) {
  assertCanAccess(actor, { storeId: store.id });
  if (actor.role !== "STORE_OWNER" && actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  requireFeature(store.offer, "appearanceBasic");
}

function assertPremium(store: Store, t: Template) {
  for (const s of Object.values(t.sections)) if (sectionSchema(s.type)?.premium) requireFeature(store.offer, "templatesPremium");
}

/** Salva o rascunho de uma página. Alterar a estrutura exige o editor completo; textos e cores, não. */
export async function saveTemplateDraft(db: Database, actor: Actor, storeId: string, page: PageKind, raw: unknown) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const { template, issues } = normalizeTemplate(raw, "content", page);
  const current = (await resolveTemplate(db, store, page, { draft: true })).template;
  if (structureOf(template) !== structureOf(current)) requireFeature(store.offer, "appearanceAdvanced");
  assertPremium(store, template);
  await db.insert(themeTemplates).values({ storeId, page, draft: template }).onConflictDoUpdate({ target: [themeTemplates.storeId, themeTemplates.page], set: { draft: template, updatedAt: new Date().toISOString() } });
  return { template, issues };
}

/** Salva o rascunho do estilo global e dos grupos de cabeçalho e rodapé. */
export async function saveGlobalsDraft(db: Database, actor: Actor, storeId: string, raw: unknown) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const { globals, issues } = normalizeGlobals(raw);
  const cur = (await resolveGlobals(db, store, { draft: true })).globals;
  const styleAdvanced = cur.style.headingFont !== globals.style.headingFont || cur.style.bodyFont !== globals.style.bodyFont || cur.style.radius !== globals.style.radius || cur.style.buttons !== globals.style.buttons || cur.style.quickView !== globals.style.quickView || cur.style.animations !== globals.style.animations;
  if (styleAdvanced || structureOf(globals.header) !== structureOf(cur.header) || structureOf(globals.footer) !== structureOf(cur.footer)) requireFeature(store.offer, "appearanceAdvanced");
  assertPremium(store, globals.header); assertPremium(store, globals.footer);
  await db.insert(themeGlobals).values({ storeId, draft: globals }).onConflictDoUpdate({ target: themeGlobals.storeId, set: { draft: globals, updatedAt: new Date().toISOString() } });
  return { globals, issues };
}

export async function saveSnapshot(db: Database, storeId: string, page: string, data: unknown, label: string, by: string) {
  await db.insert(themeTemplateVersions).values({ id: newId("tpv"), storeId, page, snapshot: data, label, createdBy: by });
  const rows = await db.select({ id: themeTemplateVersions.id }).from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, page))).orderBy(desc(themeTemplateVersions.createdAt), desc(themeTemplateVersions.id));
  for (const r of rows.slice(MAX_VERSIONS)) await db.delete(themeTemplateVersions).where(eq(themeTemplateVersions.id, r.id));
}

/** Publica o rascunho de uma página e guarda a versão no histórico. Sem rascunho, não faz nada. */
export async function publishTemplate(db: Database, actor: Actor, storeId: string, page: PageKind, label = "Publicação") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const row = await db.query.themeTemplates.findFirst({ where: and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)) });
  if (!row?.draft) return { published: false as const };
  const template = normalizeTemplate(row.draft, "content", page).template;
  await db.transaction(async (tx) => {
    await tx.update(themeTemplates).set({ published: template, draft: null, updatedAt: new Date().toISOString() }).where(and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)));
    await saveSnapshot(tx as unknown as Database, storeId, page, template, label, actor.userId);
  });
  return { published: true as const };
}

export async function publishGlobals(db: Database, actor: Actor, storeId: string, label = "Publicação do estilo") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const row = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  if (!row?.draft) return { published: false as const };
  const globals = normalizeGlobals(row.draft).globals;
  await db.transaction(async (tx) => {
    await tx.update(themeGlobals).set({ published: globals, draft: null, updatedAt: new Date().toISOString() }).where(eq(themeGlobals.storeId, storeId));
    // As cores da loja seguem o estilo publicado (logo, avisos e demais telas usam as mesmas).
    await tx.update(stores).set({ primaryColor: globals.style.primary, accentColor: globals.style.accent, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    await saveSnapshot(tx as unknown as Database, storeId, "globals", globals, label, actor.userId);
  });
  return { published: true as const };
}

/**
 * Publica TODAS as páginas com rascunho e o estilo global numa única transação: ou vai tudo, ou nada
 * (nunca cabeçalho novo com página antiga). Valida tudo antes de gravar qualquer coisa.
 */
export async function publishAllDrafts(db: Database, actor: Actor, storeId: string, label = "Publicação") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const rows = await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, storeId));
  const pages = rows.filter((r) => r.draft).map((r) => ({ page: r.page as PageKind, template: normalizeTemplate(r.draft, "content", r.page as PageKind).template }));
  const gRow = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  const globals = gRow?.draft ? normalizeGlobals(gRow.draft).globals : null;
  if (!pages.length && !globals) return { pages: 0, globals: false };
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    for (const p of pages) {
      await tx.update(themeTemplates).set({ published: p.template, draft: null, updatedAt: now }).where(and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, p.page)));
      await saveSnapshot(tx as unknown as Database, storeId, p.page, p.template, label, actor.userId);
    }
    if (globals) {
      await tx.update(themeGlobals).set({ published: globals, draft: null, updatedAt: now }).where(eq(themeGlobals.storeId, storeId));
      await tx.update(stores).set({ primaryColor: globals.style.primary, accentColor: globals.style.accent, updatedAt: now }).where(eq(stores.id, storeId));
      await saveSnapshot(tx as unknown as Database, storeId, "globals", globals, label, actor.userId);
    }
  });
  return { pages: pages.length, globals: !!globals };
}

export async function discardDraft(db: Database, actor: Actor, storeId: string, page: PageKind | "globals") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  if (page === "globals") await db.update(themeGlobals).set({ draft: null, updatedAt: new Date().toISOString() }).where(eq(themeGlobals.storeId, storeId));
  else await db.update(themeTemplates).set({ draft: null, updatedAt: new Date().toISOString() }).where(and(eq(themeTemplates.storeId, storeId), eq(themeTemplates.page, page)));
}

export async function listVersions(db: Database, actor: Actor, storeId: string, page: PageKind | "globals") {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  return db.select().from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, page))).orderBy(desc(themeTemplateVersions.createdAt), desc(themeTemplateVersions.id));
}

/** Coloca uma versão antiga no rascunho (não publica: o dono revisa e publica). */
export async function restoreVersion(db: Database, actor: Actor, storeId: string, versionId: string) {
  const store = await loadStore(db, storeId); assertEditor(actor, store);
  const v = await db.query.themeTemplateVersions.findFirst({ where: and(eq(themeTemplateVersions.id, versionId), eq(themeTemplateVersions.storeId, storeId)) });
  if (!v) throw new NotFoundError("Versão não encontrada.");
  if (v.page === "globals") { await saveGlobalsDraft(db, actor, storeId, v.snapshot); return { page: "globals" as const }; }
  if (!isPage(v.page)) throw new DomainError("INVALID", "Versão inválida.");
  await saveTemplateDraft(db, actor, storeId, v.page, v.snapshot);
  return { page: v.page };
}

export const hasUnpublished = async (db: Database, storeId: string): Promise<boolean> => {
  const t = await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, storeId));
  const g = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  return t.some((r) => r.draft && !(r.published && sameTemplate(normalizeTemplate(r.draft, "content", r.page).template, normalizeTemplate(r.published, "content", r.page).template))) || !!g?.draft;
};

