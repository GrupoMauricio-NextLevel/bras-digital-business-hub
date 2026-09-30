"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { themeTemplates } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { PREVIEW_COOKIE } from "@/lib/themes/preview";
import { TRY_COOKIE } from "@/lib/themes/try";
import { THEME_BY_KEY } from "@/lib/themes/catalog";
import { buyTheme, installTheme } from "@/lib/themes/install";
import { discardDraft, listVersions, publishGlobals, publishTemplate, restoreVersion, saveGlobalsDraft, saveTemplateDraft } from "@/lib/themes/store";
import { PAGE_KINDS } from "@/lib/themes/types";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { session, storeId: requireStoreId(session.actor), db: await getDb() };
}
const page = z.enum(PAGE_KINDS);
const refresh = (slug?: string) => { if (slug) revalidatePath(`/store/${slug}`, "layout"); };

/** Liga a prévia do rascunho (cookie) para o dono enquanto ele usa o editor. */
export async function enterThemePreviewAction() {
  return runAction(async () => { await ctx(); (await cookies()).set(PREVIEW_COOKIE, "1", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 6 }); return undefined; });
}
export async function exitThemePreviewAction() {
  (await cookies()).delete(PREVIEW_COOKIE);
}

export async function saveTemplateDraftAction(p: string, template: unknown) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); const r = await saveTemplateDraft(db, session.actor, storeId, page.parse(p), template); return { issues: r.issues }; });
}
export async function saveGlobalsDraftAction(globals: unknown) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); const r = await saveGlobalsDraft(db, session.actor, storeId, globals); return { issues: r.issues }; });
}

/** Publica todas as páginas com rascunho e o estilo global. */
export async function publishThemeAction(label?: string) {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    const rows = await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, storeId));
    let pages = 0;
    for (const r of rows) if (r.draft && (await publishTemplate(db, session.actor, storeId, r.page, label ?? "Publicação")).published) pages++;
    const g = await publishGlobals(db, session.actor, storeId, label ?? "Publicação do estilo");
    refresh(session.store?.slug); revalidatePath("/merchant", "layout");
    return { pages, globals: g.published };
  });
}
export async function discardThemeDraftAction() {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    for (const p of PAGE_KINDS) await discardDraft(db, session.actor, storeId, p);
    await discardDraft(db, session.actor, storeId, "globals"); refresh(session.store?.slug);
    return undefined;
  });
}
export async function listThemeVersionsAction(p: string) {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    const v = await listVersions(db, session.actor, storeId, p === "globals" ? "globals" : page.parse(p));
    return v.map((x) => ({ id: x.id, label: x.label, createdAt: x.createdAt, page: x.page }));
  });
}
export async function restoreThemeVersionAction(versionId: string) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); return restoreVersion(db, session.actor, storeId, z.string().min(1).parse(versionId)); });
}

/** Liga o teste de um tema (só cookie: nada é gravado). */
export async function tryThemeAction(key: string) {
  return runAction(async () => { await ctx(); if (!THEME_BY_KEY[key]) throw new ForbiddenError("Tema não encontrado."); (await cookies()).set(TRY_COOKIE, key, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 2 }); return undefined; });
}
export async function exitTryThemeAction() {
  (await cookies()).delete(TRY_COOKIE);
}
export async function buyThemeAction(key: string) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await buyTheme(db, session.actor, z.string().min(1).parse(key)); revalidatePath("/merchant", "layout"); return r; });
}
export async function installThemeAction(key: string) {
  return runAction(async () => {
    const { session, db } = await ctx(); const r = await installTheme(db, session.actor, z.string().min(1).parse(key));
    (await cookies()).delete(TRY_COOKIE); refresh(session.store?.slug); revalidatePath("/merchant", "layout"); return r;
  });
}
