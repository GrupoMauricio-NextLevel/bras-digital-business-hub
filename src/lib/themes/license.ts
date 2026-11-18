import { and, eq, gt, isNull, like, or } from "drizzle-orm";
import type { Database } from "@/db/client";
import { entitlements, storeThemes, themes, type Store } from "@/db/schema";
import { canUse } from "@/lib/features";
import { THEME_BY_KEY } from "./catalog";
import { makeEditingContext, type EditingContext } from "./policy";
import { buildPreset } from "./presets";
import { PAGE_KINDS } from "./types";
import { capabilitiesOf } from "./levels";

/** Temas que a loja tem direito de instalar: os grátis e os pagos com licença ativa (comprada ou cortesia). */
export async function ownedThemeKeys(db: Database, storeId: string, now = new Date()): Promise<Set<string>> {
  const rows = await db.select().from(entitlements).where(and(eq(entitlements.storeId, storeId), like(entitlements.key, "THEME_%"), or(isNull(entitlements.endsAt), gt(entitlements.endsAt, now.toISOString()))));
  const owned = new Set<string>(Object.values(THEME_BY_KEY).filter((t) => t.priceCents === 0 && !t.pricePending && t.release === "released").map((t) => t.key));
  for (const r of rows) { const k = r.key.replace("THEME_", "").toLowerCase(); if (THEME_BY_KEY[k]) owned.add(k); }
  return owned;
}

/** Tema ativo da loja (o instalado); sem registro, o Starter. */
export async function activeThemeKey(db: Database, storeId: string): Promise<string> {
  const r = await db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, storeId)).limit(1);
  const key = r[0]?.key;
  return key && THEME_BY_KEY[key] ? key : "starter";
}

const BASE_CTX = { storeName: "Loja", tagline: null, primary: "#111111", accent: "#222222", announcement: "", footerText: "", now: new Date(0) };
/** Ids das seções que compõem o tema (por página e nos grupos globais): a "composição fixa" que o N1/N2 preserva. */
export function themeBaseIds(themeKey: string): EditingContext["base"] {
  const p = buildPreset(themeKey, BASE_CTX); if (!p) return {};
  const base: EditingContext["base"] = { header: p.globals.header.order, footer: p.globals.footer.order };
  for (const page of PAGE_KINDS) base[page] = p.pages[page].order;
  return base;
}

/**
 * Contexto de edição da loja: capacidades do tema ATIVO (nível + concessões do catálogo) e, por compatibilidade, o que o
 * plano já vendia (LEGACY_PLAN_GRANTS). O plano não amplia seções de tema: só a reorganização que já existia.
 */
export async function editingContextFor(db: Database, store: Store): Promise<EditingContext> {
  const key = await activeThemeKey(db, store.id);
  const info = THEME_BY_KEY[key]!;
  // Edição completa (D329): liberada pela equipe (cortesia ou paga por fora), soma todas as funções do editor ao tema ativo.
  const completo = (await db.select({ endsAt: entitlements.endsAt }).from(entitlements).where(and(eq(entitlements.storeId, store.id), eq(entitlements.key, "EDITOR_COMPLETO")))).some((r) => !r.endsAt || new Date(r.endsAt) > new Date());
  const grants = completo ? [...(info.grants ?? []), ...capabilitiesOf(4)] : info.grants;
  return makeEditingContext({ themeKey: key, themeName: completo ? `${info.name} com Edição completa` : info.name, family: info.family, level: completo ? 4 : info.level, grants, offer: store.offer, base: themeBaseIds(key) });
}

/** A loja tem loja virtual (pré-requisito operacional de qualquer tema). */
export const hasStorefront = (store: Pick<Store, "offer">) => canUse(store.offer, "storefront");
