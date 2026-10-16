import { and, count, desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores, themeSavedTemplates } from "@/db/schema";
import { assertCanAccess, type Actor } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { editingContextFor } from "./license";
import { sectionAvailability } from "./policy";
import { sectionSchema } from "./sections";
import { normalizeTemplate } from "./template";
import { PAGE_KINDS, type PageKind, type SectionInstance } from "./types";

export const MAX_SAVED_TEMPLATES = 30;

async function ownStore(db: Database, actor: Actor, storeId: string) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  assertCanAccess(actor, { storeId });
  if (actor.role !== "STORE_OWNER" && actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  return store;
}
const need = async (db: Database, store: Awaited<ReturnType<typeof ownStore>>, cap: "editor.sectionTemplates" | "editor.pageTemplates") => {
  const ctx = await editingContextFor(db, store);
  if (!ctx.caps.has(cap)) throw new DomainError("THEME_LOCKED", cap === "editor.sectionTemplates" ? `Salvar modelos de seção faz parte dos temas N3 (Avançado). O tema ${ctx.themeName} é N${ctx.level}.` : `Modelos de página e campanha fazem parte dos temas N4 (Exclusivo). O tema ${ctx.themeName} é N${ctx.level}.`);
  return ctx;
};

/**
 * Modelo de seção (N3): guarda uma seção pronta (textos, imagens, blocos) para reaproveitar em outras páginas.
 * Inserir um modelo passa pela mesma política ao salvar a página (nível, família e limites valem do mesmo jeito).
 */
export async function saveSectionTemplate(db: Database, actor: Actor, storeId: string, input: { name: string; section: unknown }) {
  const store = await ownStore(db, actor, storeId); const ctx = await need(db, store, "editor.sectionTemplates");
  const name = input.name.trim().slice(0, 60); if (!name) throw new DomainError("INVALID", "Dê um nome ao modelo.");
  const t = normalizeTemplate({ v: 1, sections: { s: input.section }, order: ["s"] }, "content").template;
  const section = t.sections.s; if (!section) throw new DomainError("THEME_INVALID", "Seção inválida.");
  const schema = sectionSchema(section.type)!; if (schema.singleton || schema.required) throw new DomainError("THEME_INVALID", `${schema.name} não pode virar modelo (é única na página).`);
  const v = sectionAvailability(ctx, section.type, { region: "content" }); if (!v.ok) throw new DomainError("THEME_LOCKED", v.message);
  await assertRoom(db, storeId);
  const id = newId("tst");
  await db.insert(themeSavedTemplates).values({ id, storeId, kind: "section", name, data: section, createdBy: actor.userId });
  return { id };
}

/** Modelo de página ou campanha (N4): o conteúdo inteiro de uma página, para aplicar no rascunho depois. */
export async function savePageTemplate(db: Database, actor: Actor, storeId: string, input: { name: string; page: PageKind; template: unknown }) {
  const store = await ownStore(db, actor, storeId); await need(db, store, "editor.pageTemplates");
  if (!(PAGE_KINDS as readonly string[]).includes(input.page)) throw new DomainError("INVALID", "Página inválida.");
  const name = input.name.trim().slice(0, 60); if (!name) throw new DomainError("INVALID", "Dê um nome ao modelo.");
  const template = normalizeTemplate(input.template, "content", input.page).template;
  await assertRoom(db, storeId);
  const id = newId("tst");
  await db.insert(themeSavedTemplates).values({ id, storeId, kind: "page", page: input.page, name, data: template, createdBy: actor.userId });
  return { id };
}

async function assertRoom(db: Database, storeId: string) {
  const [n] = await db.select({ n: count() }).from(themeSavedTemplates).where(eq(themeSavedTemplates.storeId, storeId));
  if ((n?.n ?? 0) >= MAX_SAVED_TEMPLATES) throw new DomainError("THEME_LIMIT", `Limite de ${MAX_SAVED_TEMPLATES} modelos salvos. Apague os que não usa.`);
}

export type SavedTemplate = { id: string; kind: "section" | "page"; name: string; page: string | null; createdAt: string; type: string | null; data: unknown };
/** Modelos da própria loja (nunca de outra). */
export async function listSavedTemplates(db: Database, actor: Actor, storeId: string): Promise<SavedTemplate[]> {
  await ownStore(db, actor, storeId);
  const rows = await db.select().from(themeSavedTemplates).where(eq(themeSavedTemplates.storeId, storeId)).orderBy(desc(themeSavedTemplates.createdAt));
  return rows.map((r) => ({ id: r.id, kind: r.kind, name: r.name, page: r.page, createdAt: r.createdAt, type: r.kind === "section" ? (r.data as SectionInstance | null)?.type ?? null : null, data: r.data }));
}

export async function deleteSavedTemplate(db: Database, actor: Actor, storeId: string, id: string) {
  await ownStore(db, actor, storeId);
  const r = await db.delete(themeSavedTemplates).where(and(eq(themeSavedTemplates.id, id), eq(themeSavedTemplates.storeId, storeId))).returning({ id: themeSavedTemplates.id });
  if (!r.length) throw new NotFoundError("Modelo não encontrado.");
}
