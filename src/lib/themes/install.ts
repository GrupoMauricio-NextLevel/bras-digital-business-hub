import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { financeInvoices, stores, storeThemes, themeGlobals, themeTemplates, themes, themeVersions } from "@/db/schema";
import { assertCanAccess, type Actor } from "@/lib/domain/access";
import { emitEvent } from "@/lib/domain/events";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { supplierOfStore, themeQuote, switchInvoiceMethod } from "@/lib/domain/nextlevel-billing";
import { amountFor, type PaymentMethod, type Quote } from "@/lib/finance/pricing";
import { requireFeature } from "@/lib/features";
import { newId } from "@/lib/ids";
import { THEME_BY_KEY, themeEntitlementKey } from "./catalog";
import { hasStorefront, ownedThemeKeys } from "./license";
import { canInstall, canPurchase } from "./policy";
import { buildPreset, type PresetContext } from "./presets";
import { resolveGlobals, resolveTemplate, saveSnapshot } from "./store";
import { normalizeGlobals, normalizeTemplate } from "./template";
import { PAGE_KINDS, type Template } from "./types";

async function ownStore(db: Database, actor: Actor, storeId?: string) {
  const id = storeId ?? actor.storeId;
  if (!id) throw new ForbiddenError("Ação disponível apenas para lojistas.");
  assertCanAccess(actor, { storeId: id });
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Apenas o dono da loja instala temas.");
  const store = await db.query.stores.findFirst({ where: eq(stores.id, id) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  requireFeature(store.offer, "storefront");
  return store;
}

/** Temas que a loja pode instalar (grátis liberados + licenças ativas). Fonte única em license.ts. */
export { ownedThemeKeys };

export type ThemeCard = { key: string; name: string; tier: string; priceCents: number; tagline: string; description: string; features: string[]; previewAccent: string; owned: boolean; active: boolean; openInvoiceId: string | null; quote: Quote; openMethod: PaymentMethod | null };

/** Vitrine de temas para o lojista, com estado (comprado, ativo, fatura em aberto). */
export async function themeCardsFor(db: Database, actor: Actor): Promise<ThemeCard[]> {
  const store = await ownStore(db, actor);
  const [rows, owned, active, invoices] = await Promise.all([
    db.select().from(themes), ownedThemeKeys(db, store.id),
    db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, store.id)).limit(1),
    db.select().from(financeInvoices).where(and(eq(financeInvoices.storeId, store.id), eq(financeInvoices.kind, "ADDON"), eq(financeInvoices.status, "OPEN"))),
  ]);
  const quotes = new Map<string, Quote>();
  for (const t of rows) if (THEME_BY_KEY[t.key]) quotes.set(t.key, await themeQuote(db, t.key));
  return rows.flatMap((t) => {
    const info = THEME_BY_KEY[t.key]; if (!info || (info.release !== "released" && !owned.has(t.key))) return [];
    const inv = invoices.find((i) => i.dedupeKey.split(":")[2] === themeEntitlementKey(t.key));
    return [{ key: t.key, name: t.name, tier: t.tier, priceCents: t.priceCents, tagline: info.tagline, description: t.description, features: t.features, previewAccent: t.previewAccent, owned: owned.has(t.key), active: active[0]?.key === t.key, openInvoiceId: inv?.id ?? null, openMethod: inv ? (inv.lines[0]?.kind === "THEME_CARD" ? "CARD" as const : "PIX" as const) : null, quote: quotes.get(t.key)! }];
  }).sort((a, b) => a.priceCents - b.priceCents);
}

/**
 * Gera a fatura do tema. O preço de lista é o valor cheio no cartão (em até 6x); o Pix tem desconto.
 * Se já há fatura aberta, só troca o método. Pago, a licença é permanente para a loja.
 */
export async function buyTheme(db: Database, actor: Actor, key: string, method: PaymentMethod = "PIX", now = new Date()) {
  const store = await ownStore(db, actor);
  const info = THEME_BY_KEY[key]; const theme = info ? await db.query.themes.findFirst({ where: eq(themes.key, key) }) : null;
  if (!info || !theme) throw new NotFoundError("Tema não encontrado.");
  // Mesma política da vitrine: tema em revisão não é vendido, nem por chamada direta.
  const owned = (await ownedThemeKeys(db, store.id, now)).has(key);
  const verdict = canPurchase(info, { storefront: hasStorefront(store), owned });
  if (!verdict.ok) throw new DomainError(verdict.reason === "NOT_RELEASED" ? "THEME_NOT_RELEASED" : info.priceCents === 0 ? "FREE_THEME" : owned ? "ALREADY_OWNED" : verdict.reason, verdict.message);
  const ent = themeEntitlementKey(key);
  const dedupeKey = `ADDON:${store.id}:${ent}:LIFETIME:${now.toISOString().slice(0, 7)}`;
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, dedupeKey) });
  if (existing && existing.status === "OPEN") { const r = await switchInvoiceMethod(db, actor, existing.id, method); return { invoiceId: existing.id, amountCents: r.amountCents, method }; }
  const q = await themeQuote(db, key); const amount = amountFor(q, method);
  const id = newId("fin"); const due = new Date(now); due.setUTCDate(due.getUTCDate() + 3);
  const supplierId = await supplierOfStore(db, store.id);
  const line = { kind: method === "CARD" ? "THEME_CARD" : "THEME_PIX", description: method === "CARD" ? `Tema ${theme.name} · cartão em até ${q.installments}x` : `Tema ${theme.name} · Pix com ${q.pixDiscountPct}% de desconto`, amountCents: amount };
  await db.insert(financeInvoices).values({ id, dedupeKey: existing ? `${dedupeKey}:${now.getTime()}` : dedupeKey, payerType: "STORE", supplierId, storeId: store.id, kind: "ADDON", description: `Tema ${theme.name} (licença permanente)`, amountCents: amount, lines: [line], status: "OPEN", dueDate: due.toISOString() });
  await emitEvent(db, { type: "THEME_ORDERED", supplierId, storeId: store.id, actorRole: actor.role, payload: { key, invoiceId: id, method } });
  return { invoiceId: id, amountCents: amount, method };
}

const DEFAULT_HERO_TITLE = "Bem-vindo à nossa loja";

/** Dados da loja que alimentam os modelos: nome, cores atuais, texto do destaque, aviso e rodapé que ela já tinha. */
export async function presetContextFor(db: Database, store: typeof stores.$inferSelect, now = new Date()) {
  const current = { home: (await resolveTemplate(db, store, "home")).template, globals: (await resolveGlobals(db, store)).globals };
  const oldHero = Object.values(current.home.sections).find((s) => s.type === "hero");
  const oldTitle = String(oldHero?.settings.title ?? "");
  const oldAnn = Object.values(current.globals.header.sections).find((s) => s.type === "announcement-bar" && !s.hidden);
  const oldFoot = Object.values(current.globals.footer.sections).find((s) => s.type === "footer");
  const ctx: PresetContext = {
    storeName: store.name, tagline: store.tagline, primary: current.globals.style.primary, accent: current.globals.style.accent,
    announcement: String(oldAnn?.settings.text ?? ""), footerText: String(oldFoot?.settings.text ?? ""),
    hero: oldHero && oldTitle && oldTitle !== DEFAULT_HERO_TITLE && oldTitle !== `Bem-vindo à ${store.name}` ? { title: oldTitle, subtitle: String(oldHero.settings.subtitle ?? ""), ctaLabel: String(oldHero.settings.ctaLabel ?? "Ver catálogo") } : undefined,
    now,
  };
  return { ctx, current };
}

/**
 * Monta e publica o tema na loja (sem checar compra: quem chama garante a licença). Usada pela instalação do lojista
 * e pelas lojas de demonstração. O estado anterior fica no histórico ("Antes de instalar …").
 */
export async function applyThemeToStore(db: Database, store: typeof stores.$inferSelect, key: string, by: string, now = new Date(), images?: PresetContext["images"], extra?: Partial<Pick<PresetContext, "media" | "categories" | "categoryImages">>) {
  const info = THEME_BY_KEY[key]; const theme = info ? await db.query.themes.findFirst({ where: eq(themes.key, key) }) : null;
  if (!info || !theme) throw new NotFoundError("Tema não encontrado.");
  const { ctx, current } = await presetContextFor(db, store, now);
  const preset = buildPreset(key, { ...ctx, ...(images ? { images } : {}), ...(extra?.media ? { media: extra.media } : {}), ...(extra?.categories ? { categories: extra.categories } : {}), ...(extra?.categoryImages ? { categoryImages: extra.categoryImages } : {}) });
  if (!preset) throw new NotFoundError("Modelo do tema não encontrado.");
  const version = await db.query.themeVersions.findFirst({ where: and(eq(themeVersions.themeId, theme.id), eq(themeVersions.status, "PUBLISHED")) });
  if (!version) throw new NotFoundError("Versão do tema não encontrada.");

  const previousKey = (await db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, store.id)).limit(1))[0]?.key ?? "starter";
  let draftsSaved = 0;
  await db.transaction(async (tx) => {
    const t = tx as unknown as Database; const before = `Antes de instalar ${theme.name}`;
    // Rascunhos não publicados vão para o histórico ANTES de serem trocados (nada some em silêncio).
    const rows = await tx.select().from(themeTemplates).where(eq(themeTemplates.storeId, store.id));
    for (const r of rows) if (r.draft) { await saveSnapshot(t, store.id, r.page, r.draft, `Rascunho guardado antes de instalar ${theme.name}`, by, { themeKey: previousKey, kind: "draft" }); draftsSaved++; }
    const gRow = await tx.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, store.id) });
    if (gRow?.draft) { await saveSnapshot(t, store.id, "globals", gRow.draft, `Rascunho guardado antes de instalar ${theme.name}`, by, { themeKey: previousKey, kind: "draft" }); draftsSaved++; }
    for (const page of PAGE_KINDS) await saveSnapshot(t, store.id, page, (await resolveTemplate(t, store, page)).template, before, by, { themeKey: previousKey });
    await saveSnapshot(t, store.id, "globals", current.globals, before, by, { themeKey: previousKey });
    const iso = now.toISOString();
    for (const page of PAGE_KINDS) {
      const tpl: Template = normalizeTemplate(preset.pages[page], "content", page).template;
      const rev = (rows.find((r) => r.page === page)?.revision ?? 0) + 1;
      await tx.insert(themeTemplates).values({ storeId: store.id, page, published: tpl, draft: null, revision: rev }).onConflictDoUpdate({ target: [themeTemplates.storeId, themeTemplates.page], set: { published: tpl, draft: null, revision: rev, updatedAt: iso } });
      await saveSnapshot(t, store.id, page, tpl, `Tema ${theme.name} instalado`, by, { themeKey: key });
    }
    const g = normalizeGlobals(preset.globals).globals; const grev = (gRow?.revision ?? 0) + 1;
    await tx.insert(themeGlobals).values({ storeId: store.id, published: g, draft: null, revision: grev }).onConflictDoUpdate({ target: themeGlobals.storeId, set: { published: g, draft: null, revision: grev, updatedAt: iso } });
    await saveSnapshot(t, store.id, "globals", g, `Tema ${theme.name} instalado`, by, { themeKey: key });
    await tx.update(stores).set({ primaryColor: g.style.primary, accentColor: g.style.accent, updatedAt: iso }).where(eq(stores.id, store.id));
    const has = await tx.query.storeThemes.findFirst({ where: eq(storeThemes.storeId, store.id) });
    if (has) await tx.update(storeThemes).set({ themeId: theme.id, themeVersionId: version.id, activatedAt: iso }).where(eq(storeThemes.storeId, store.id));
    else await tx.insert(storeThemes).values({ storeId: store.id, themeId: theme.id, themeVersionId: version.id });
  });
  return { name: theme.name, draftsSaved };
}

/**
 * Instala um tema com 1 clique: monta as quatro páginas e o estilo a partir do modelo do tema, com o nome, o texto do destaque,
 * o aviso e o rodapé que a loja já tinha, e publica na hora. O estado anterior fica no histórico ("Antes de instalar …")
 * e pode ser restaurado a qualquer momento.
 */
export async function installTheme(db: Database, actor: Actor, key: string, now = new Date()) {
  const store = await ownStore(db, actor);
  const info = THEME_BY_KEY[key]; const theme = info ? await db.query.themes.findFirst({ where: eq(themes.key, key) }) : null;
  if (!info || !theme) throw new NotFoundError("Tema não encontrado.");
  const verdict = canInstall(info, { storefront: hasStorefront(store), owned: (await ownedThemeKeys(db, store.id, now)).has(key) });
  if (!verdict.ok) throw new DomainError(verdict.reason === "NO_LICENSE" ? "THEME_NOT_OWNED" : verdict.reason === "NOT_RELEASED" ? "THEME_NOT_RELEASED" : verdict.reason, verdict.message);

  const r = await applyThemeToStore(db, store, key, actor.userId, now);
  await emitEvent(db, { type: "THEME_INSTALLED", storeId: store.id, actorRole: actor.role, payload: { key } });
  return { installed: true as const, name: theme.name, draftsSaved: r.draftsSaved };
}
