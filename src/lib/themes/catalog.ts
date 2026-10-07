import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { themes, themeVersions } from "@/db/schema";
import { newId } from "@/lib/ids";

import { FAMILY_INFO, type Capability, type ThemeFamily, type ThemeLevel } from "./levels";

/** Estado de liberação: só `released` é vendido e instalado; `review` tem demonstração por link; `draft` não aparece em público. */
export type ReleaseState = "released" | "review" | "draft";
export type ThemeInfo = {
  key: string; legacyKeys?: string[]; name: string;
  /** Coluna antiga da tabela `themes` (mantida para compatibilidade). O que vale para recursos é `level`. */
  tier: "STARTER" | "PRO" | "ELITE" | "SIGNATURE";
  /** Identidade (família) e nível N1–N4: decidem composição e capacidades de edição. */
  family: ThemeFamily; level: ThemeLevel;
  /** Preço de licença em centavos (0 = grátis). Tema em revisão sem preço aprovado usa 0 e `pricePending`. */
  priceCents: number; pricePending?: boolean;
  release: ReleaseState;
  /** Concessões explícitas além do nível, só para manter o que o tema já vendia antes da classificação por níveis. */
  grants?: Capability[];
  tagline: string; description: string; features: string[]; previewAccent: string;
  /** Para quem o tema foi pensado (página pública de temas). */
  niche: string;
};

/**
 * Catálogo central. Preços definidos pelo dono (não mudam aqui): Lume e Ninho R$ 149, Arena R$ 299, Editorial R$ 699, Signature R$ 1.499.
 * Mapa família/nível e estados: docs/temas-modulares/CATALOGO.md.
 */
export const THEME_CATALOG: ThemeInfo[] = [
  { key: "starter", family: "base", level: 1, release: "released", niche: "Qualquer loja, grátis", name: "Starter", tier: "STARTER", priceCents: 0, tagline: "Simples e bem acabado", description: "Tema gratuito e padrão: limpo, rápido e pronto para vender, com destaque, vitrine, banners e catálogo.", features: ["Página inicial com destaque, vitrine e banners", "Produto com galeria de miniaturas", "Catálogo com busca e categorias", "Cores, fontes e textos personalizáveis"], previewAccent: "#16a34a" },
  { key: "lume", family: "moda", level: 2, release: "released", niche: "Moda e acessórios", name: "Lume", tier: "PRO", priceCents: 14900, tagline: "Moda e acessórios, um passo acima do gratuito", description: "Destaque com imagem em tela larga, categorias em círculos, compra rápida, abas e barra fixa de compra no produto, perguntas frequentes e chamada para o WhatsApp.", features: ["Destaque com imagem em tela larga", "Categorias em círculos e vitrines em sequência", "Compra rápida nos cartões de produto", "Produto com abas e barra fixa de compra no celular", "Perguntas frequentes e chamada para o WhatsApp"], previewAccent: "#be185d" },
  { key: "ninho", family: "casa", level: 2, release: "review", niche: "Casa e decoração", name: "Ninho", tier: "PRO", priceCents: 14900, tagline: "Casa e decoração, com cara de lar", description: "Mesmo padrão do Lume, em tons de terra e verde-sálvia: destaque com imagem em tela larga, categorias em cartões, compra rápida, abas e barra fixa de compra no produto, perguntas frequentes e chamada para o WhatsApp.", features: ["Destaque com imagem em tela larga", "Categorias em cartões e vitrines em sequência", "Compra rápida nos cartões de produto", "Produto com abas e barra fixa de compra no celular", "Perguntas frequentes e chamada para o WhatsApp"], previewAccent: "#b4532a" },
  { key: "arena", family: "sport", level: 3, release: "released", niche: "Esportivo e camisas de time", legacyKeys: ["pro"], name: "Arena", tier: "PRO", priceCents: 29900, tagline: "A loja esportiva que entra em campo vendendo", description: "Experiência criada para camisas de time: destaque esportivo com produto real, navegação por categorias, vitrines comerciais, ofertas e compra rápida.", features: ["Apresentação de slides na página inicial", "Contagem regressiva de ofertas", "Grade de categorias e vitrines", "Compra rápida e barra fixa de compra no celular", "Perguntas frequentes e chamada para o WhatsApp"], previewAccent: "#22c55e" },
  { key: "editorial", family: "moda", level: 3, release: "released", grants: ["hero.video"], niche: "Moda de marca e lookbook", legacyKeys: ["elite"], name: "Editorial", tier: "ELITE", priceCents: 69900, tagline: "Imagem, marca e tipografia", description: "Visual de revista: imagem em tela larga, lookbook, depoimentos, abas no produto e tipografia com serifa.", features: ["Destaque com imagem em tela larga e vídeo", "Lookbook e imagem com texto", "Depoimentos com estrelas", "Abas de descrição, envio e trocas no produto", "Tipografia refinada e cantos retos"], previewAccent: "#a16207" },
  { key: "signature", family: "base", level: 4, release: "released", niche: "Loja completa, estilo grandes lojas", name: "Signature", tier: "SIGNATURE", priceCents: 149900, tagline: "A vitrine completa, no nível das grandes lojas", description: "Tudo dos outros temas mais menu grande com submenus, busca com sugestões, compra rápida, ordenação e movimento discreto.", features: ["Menu grande com submenus e busca com sugestões", "Apresentação de slides, vídeo, lookbook e contagem", "Compra rápida, ordenação e barra fixa de compra", "Depoimentos, perguntas e abas do produto", "Movimento discreto ao rolar"], previewAccent: "#c2410c" },
];
export const THEME_BY_KEY = Object.fromEntries(THEME_CATALOG.map((t) => [t.key, t])) as Record<string, ThemeInfo>;
export const themeEntitlementKey = (key: string) => `THEME_${key.toUpperCase()}`;
/** Vendido e instalável por quem ainda não tem a licença. */
export const isReleased = (t: Pick<ThemeInfo, "release">) => t.release === "released";
/** Tem demonstração pública por link (vendido ou em revisão). */
export const hasPublicDemo = (t: Pick<ThemeInfo, "release">) => t.release !== "draft";
export const themeSegment = (t: Pick<ThemeInfo, "family">) => FAMILY_INFO[t.family].segment;

/**
 * Deixa a tabela de temas igual ao catálogo. Idempotente e segura para bancos que já têm lojas:
 * os temas antigos "pro" e "elite" viram "arena" e "editorial" mantendo o mesmo id (as lojas continuam ligadas).
 */
export async function syncThemeCatalog(db: Database): Promise<string[]> {
  const log: string[] = [];
  const rows = await db.select().from(themes);
  for (const info of THEME_CATALOG) {
    const existing = rows.find((r) => r.key === info.key) ?? rows.find((r) => info.legacyKeys?.includes(r.key));
    const values = { key: info.key, name: info.name, tier: info.tier, description: info.description, priceCents: info.priceCents, features: info.features, previewAccent: info.previewAccent, available: isReleased(info), family: info.family, level: info.level, release: info.release };
    if (existing) {
      const changed = existing.key !== info.key || existing.name !== info.name || existing.priceCents !== info.priceCents || existing.tier !== info.tier || existing.description !== info.description || existing.available !== isReleased(info) || existing.family !== info.family || existing.level !== info.level || existing.release !== info.release || JSON.stringify(existing.features) !== JSON.stringify(info.features) || existing.previewAccent !== info.previewAccent;
      if (changed) { await db.update(themes).set(values).where(eq(themes.id, existing.id)); log.push(`tema ${info.key} atualizado`); }
    } else { await db.insert(themes).values({ id: newId("thm"), ...values }); log.push(`tema ${info.key} criado`); }
  }
  const all = await db.select().from(themes).where(inArray(themes.key, THEME_CATALOG.map((t) => t.key)));
  const withVersion = new Set((await db.select({ themeId: themeVersions.themeId }).from(themeVersions)).map((v) => v.themeId));
  for (const t of all) if (!withVersion.has(t.id)) { await db.insert(themeVersions).values({ id: newId("thv"), themeId: t.id, version: "1.0.0", status: "PUBLISHED" }); log.push(`versão do tema ${t.key} criada`); }
  return log;
}
