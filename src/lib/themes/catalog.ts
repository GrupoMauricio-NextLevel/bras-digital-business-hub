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
 * Mapa família/nível e estados: docs/temas-modulares/CATALOGO.md. Temas novos ficam em revisão até o dono aprovar o visual e o preço.
 */
export const THEME_CATALOG: ThemeInfo[] = [
  { key: "starter", family: "base", level: 1, release: "released", niche: "Qualquer loja, grátis", name: "Starter", tier: "STARTER", priceCents: 0, tagline: "Simples e bem acabado", description: "Tema gratuito e padrão: limpo, rápido e pronto para vender, com destaque, vitrine, banners e catálogo.", features: ["Página inicial com destaque, vitrine e banners", "Produto com galeria de miniaturas", "Catálogo com busca e categorias", "Cores, fontes e textos personalizáveis"], previewAccent: "#16a34a" },
  { key: "trama", family: "moda", level: 1, release: "review", niche: "Moda: básicos e conjuntos", name: "Trama", tier: "STARTER", priceCents: 0, tagline: "Loja de moda pronta, grátis", description: "Composição fixa e bem acabada para moda: destaque com imagem, dois banners de apoio, faixa de campanha, categorias e vitrines. Imagem própria para computador e celular em todos os banners.", features: ["Destaque com imagem (computador e celular)", "Dois banners de apoio e uma faixa de campanha", "Categorias e vitrines de novidades e destaques", "Logo, cores e fontes selecionadas"], previewAccent: "#9a3412" },
  { key: "lume", family: "moda", level: 2, release: "released", niche: "Moda e acessórios", name: "Lume", tier: "PRO", priceCents: 14900, tagline: "Moda e acessórios, um passo acima do gratuito", description: "Destaque com até 2 slides, categorias em círculos, compra rápida, abas e barra fixa de compra no produto, imagem com texto e perguntas frequentes.", features: ["Destaque com até 2 slides (computador e celular)", "Categorias em círculos e vitrines em sequência", "Compra rápida nos cartões de produto", "Produto com abas e barra fixa de compra no celular", "Até 3 espaços extras aprovados por página"], previewAccent: "#be185d" },
  { key: "lar", family: "casa", level: 1, release: "review", niche: "Casa: utilidades e organização", name: "Lar", tier: "STARTER", priceCents: 0, tagline: "Loja de casa pronta, grátis", description: "Composição fixa para utilidades e organização: destaque com imagem, dois banners de apoio, faixa de campanha, categorias por cômodo e vitrines. Imagem própria para computador e celular.", features: ["Destaque com imagem (computador e celular)", "Dois banners de apoio e uma faixa de campanha", "Categorias e vitrines de novidades e destaques", "Logo, cores e fontes selecionadas"], previewAccent: "#b4532a" },
  { key: "ninho", family: "casa", level: 2, release: "review", niche: "Casa: utilidades e organização", name: "Ninho", tier: "PRO", priceCents: 14900, tagline: "Casa organizada, com cara de lar", description: "Destaque com até 2 slides, categorias em círculos, compra rápida, abas e barra fixa de compra no produto, imagem com texto e perguntas frequentes, em tons de verde-sálvia e terracota.", features: ["Destaque com até 2 slides (computador e celular)", "Categorias em círculos e vitrines em sequência", "Compra rápida nos cartões de produto", "Produto com abas e barra fixa de compra no celular", "Até 3 espaços extras aprovados por página"], previewAccent: "#b4532a" },
  { key: "lance", family: "sport", level: 1, release: "review", niche: "Esportivo: camisas e treino", name: "Lance", tier: "STARTER", priceCents: 0, tagline: "Loja esportiva pronta, grátis", description: "Composição fixa para camisas e treino: destaque com imagem, dois banners de apoio, faixa de campanha, categorias e vitrines. Imagem própria para computador e celular.", features: ["Destaque com imagem (computador e celular)", "Dois banners de apoio e uma faixa de campanha", "Categorias e vitrines de novidades e destaques", "Logo, cores e fontes selecionadas"], previewAccent: "#16a34a" },
  { key: "torcida", family: "sport", level: 2, release: "review", pricePending: true, niche: "Esportivo: camisas e treino", name: "Torcida", tier: "PRO", priceCents: 0, tagline: "Esportivo profissional, um passo acima do grátis", description: "Destaque com até 2 slides, categorias em círculos, compra rápida, abas e barra fixa de compra no produto, imagem com texto e perguntas frequentes.", features: ["Destaque com até 2 slides (computador e celular)", "Categorias em círculos e vitrines em sequência", "Compra rápida nos cartões de produto", "Produto com abas e barra fixa de compra no celular", "Até 3 espaços extras aprovados por página"], previewAccent: "#2563eb" },
  { key: "arena", family: "sport", level: 3, release: "released", niche: "Esportivo e camisas de time", legacyKeys: ["pro"], name: "Arena", tier: "PRO", priceCents: 29900, tagline: "A loja esportiva que entra em campo vendendo", description: "Experiência criada para camisas de time: destaque esportivo com produto real, navegação por categorias, vitrines comerciais, ofertas e compra rápida.", features: ["Apresentação de slides na página inicial", "Contagem regressiva de ofertas", "Grade de categorias e vitrines", "Compra rápida e barra fixa de compra no celular", "Perguntas frequentes e chamada para o WhatsApp"], previewAccent: "#22c55e" },
  { key: "editorial", family: "moda", level: 3, release: "released", grants: ["hero.video"], niche: "Moda de marca e lookbook", legacyKeys: ["elite"], name: "Editorial", tier: "ELITE", priceCents: 69900, tagline: "Imagem, marca e tipografia", description: "Visual de revista: carrossel de destaques, mosaico de banners, lookbook, imagem com texto, abas no produto e tipografia com serifa. Seções reorganizáveis.", features: ["Carrossel com até 6 slides e mosaico de banners", "Lookbook e imagem com texto", "Reorganizar, duplicar e salvar modelos de seção", "Abas de descrição, envio e trocas no produto", "Destaque com vídeo (incluído desde o lançamento do tema)"], previewAccent: "#a16207" },
  { key: "varanda", family: "casa", level: 3, release: "review", pricePending: true, niche: "Casa: utilidades e decoração", name: "Varanda", tier: "ELITE", priceCents: 0, tagline: "Casa com composição de loja de decoração", description: "Carrossel de destaques, mosaico de banners por cômodo, galeria de ambientes, banner entre vitrines e na coleção, ordenação e seções reorganizáveis.", features: ["Carrossel com até 6 slides e mosaico de banners", "Galeria de ambientes e imagem com texto", "Reorganizar, duplicar e salvar modelos de seção", "Banner na página de coleção e ordenação"], previewAccent: "#8a6d3b" },
  { key: "atelier", family: "moda", level: 4, release: "review", pricePending: true, niche: "Moda de marca própria", name: "Atelier", tier: "SIGNATURE", priceCents: 0, tagline: "A experiência completa para marcas de moda", description: "Menu grande com busca, carrossel automático com campanha agendada, mosaico 1+4, lookbook, modelos de página e campanha, banners por categoria e movimento discreto.", features: ["Menu grande com submenus e busca com sugestões", "Carrossel automático e banners agendados (horário de Brasília)", "Mosaico 1+4, lookbook e banners por categoria", "Modelos de página e de campanha", "Destaque com vídeo e movimento discreto"], previewAccent: "#b45309" },
  { key: "morada", family: "casa", level: 4, release: "review", pricePending: true, niche: "Casa: marca própria", name: "Morada", tier: "SIGNATURE", priceCents: 0, tagline: "A experiência completa para lojas de casa", description: "Menu grande com busca, carrossel automático com campanha agendada, mosaico 1+4, galeria de ambientes, modelos de página e campanha, banners por categoria e movimento discreto.", features: ["Menu grande com submenus e busca com sugestões", "Carrossel automático e banners agendados (horário de Brasília)", "Mosaico 1+4, galeria e banners por categoria", "Modelos de página e de campanha"], previewAccent: "#c2410c" },
  { key: "podio", family: "sport", level: 4, release: "review", pricePending: true, niche: "Esportivo: marca própria", name: "Pódio", tier: "SIGNATURE", priceCents: 0, tagline: "A experiência completa para lojas esportivas", description: "Menu grande com busca, carrossel automático com campanha agendada, mosaico 1+4, galeria Em campo, modelos de página e campanha, banners por categoria e movimento discreto.", features: ["Menu grande com submenus e busca com sugestões", "Carrossel automático e banners agendados (horário de Brasília)", "Mosaico 1+4, galeria e banners por categoria", "Modelos de página e de campanha"], previewAccent: "#f59e0b" },
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
