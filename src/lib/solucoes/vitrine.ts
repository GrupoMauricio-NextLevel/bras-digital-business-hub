import type { CatalogFamily, JourneyPhase } from "@/db/schema";
import type { CatalogItem } from "@/lib/domain/nl-catalog";
import type { DiagnosticNeed } from "@/lib/domain/corporate-sales";
import { FAMILY_LABEL, PHASE_LABEL, priceLines } from "@/lib/finance/catalog-labels";
import { THEME_CATALOG } from "@/lib/themes/catalog";
import { SINONIMOS } from "./intencoes";

/**
 * Vitrine imersiva de Soluções (D162): projeção pura do catálogo Master, da jornada e da oferta de entrada para a página.
 * Nenhum preço escrito aqui: tudo sai de `listCatalog` (preço versionado). Os links de contratação usam só caminhos que
 * já existem (cadastro da Commerce, página da solução, Loja NextLevel, site da marca, diagnóstico).
 */
export type PrecoVitrine = { tipo: "UNICO" | "MENSAL" | "CONSULTA"; cents: number | null; linha: string };
export type ItemVitrine = {
  key: string; slug: string; nome: string; resumo: string; familia: CatalogFamily; familiaRotulo: string; fase: JourneyPhase; faseRotulo: string;
  preco: PrecoVitrine; detalheHref: string; contratar: { rotulo: string; href: string }; necessidade: DiagnosticNeed | null;
};
export type PortaKey = "COMECAR" | "MIGRAR" | "VENDER_MAIS" | "PLATAFORMA";
export type Porta = { key: PortaKey; titulo: string; texto: string; familias: CatalogFamily[]; foto: CatalogFamily };
export type EntradasVitrine = {
  itens: CatalogItem[];
  fases: { key: JourneyPhase; name: string; goal: string }[];
  oferta: { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number } | null;
  link: (path: string) => string;
  commerce: { base: string; signupOpen: boolean };
  superdrop: { base: string; tagline: string };
};

/** Ordem do cardápio; Temas e SuperDrop entram como famílias próprias com os produtos de cada uma. */
export const ORDEM_FAMILIAS: CatalogFamily[] = ["COMMERCE_PLAN", "SUPERDROP", "LOJA_PRONTA", "MIGRACAO", "TEMA", "MARKETING", "CONSULTORIA", "WHITE_LABEL"];

export const PORTAS: Porta[] = [
  { key: "COMECAR", titulo: "Quero começar a vender", texto: "Loja virtual com a sua marca, loja montada pela equipe ou revenda sem estoque.", familias: ["COMMERCE_PLAN", "LOJA_PRONTA", "SUPERDROP", "TEMA"], foto: "COMMERCE_PLAN" },
  { key: "MIGRAR", titulo: "Quero trocar de plataforma", texto: "Leve produtos e clientes para a NextLevel E-commerce e renove o visual.", familias: ["MIGRACAO", "TEMA", "LOJA_PRONTA"], foto: "MIGRACAO" },
  { key: "VENDER_MAIS", titulo: "Quero vender mais", texto: "Anúncios, conteúdo para redes sociais e uma auditoria do que está travando as vendas.", familias: ["MARKETING", "CONSULTORIA", "TEMA"], foto: "MARKETING" },
  { key: "PLATAFORMA", titulo: "Quero a minha própria plataforma", texto: "Para agências e parceiros: a plataforma com a sua marca, sob consulta.", familias: ["WHITE_LABEL", "COMMERCE_PLAN", "CONSULTORIA"], foto: "WHITE_LABEL" },
];

const NECESSIDADE: Partial<Record<CatalogFamily, DiagnosticNeed>> = {
  COMMERCE_PLAN: "CRIAR_LOJA", LOJA_PRONTA: "LOJA_PRONTA", MIGRACAO: "MIGRAR", TEMA: "TEMA", CONSULTORIA: "CONSULTORIA", WHITE_LABEL: "WHITE_LABEL", SUPERDROP: "SUPERDROP",
};
const necessidadeDe = (i: { key: string; family: CatalogFamily }): DiagnosticNeed | null =>
  i.family === "MARKETING" ? (i.key === "MKT_SOCIAL" ? "REDES" : "TRAFEGO") : NECESSIDADE[i.family] ?? null;

function precoDe(i: CatalogItem): PrecoVitrine {
  const linha = priceLines(i).main;
  if (i.kind === "quote_required") return { tipo: "CONSULTA", cents: null, linha };
  const m = i.prices.MONTHLY?.amountCents, o = i.prices.ONE_TIME?.amountCents;
  if (typeof m === "number") return { tipo: "MENSAL", cents: m, linha };
  if (typeof o === "number") return { tipo: "UNICO", cents: o, linha };
  return { tipo: "CONSULTA", cents: null, linha };
}

export function projetarVitrine(e: EntradasVitrine) {
  const pub = e.itens.filter((i) => i.audience.includes("PUBLIC") && i.family !== "TEMA");
  const item = (i: CatalogItem): ItemVitrine => {
    const detalheHref = e.link(`/solucoes/${i.slug}`);
    const contratar = i.kind === "quote_required" ? { rotulo: "Pedir proposta", href: "#diagnostico" }
      : i.family === "COMMERCE_PLAN" ? { rotulo: "Assinar", href: e.link(`${e.commerce.base}${e.commerce.signupOpen ? `/cadastro?plano=${i.key}` : "/quero-minha-loja"}`) }
      : { rotulo: "Ver e contratar", href: detalheHref };
    return { key: i.key, slug: i.slug, nome: i.name, resumo: i.tagline, familia: i.family, familiaRotulo: FAMILY_LABEL[i.family], fase: i.phase, faseRotulo: PHASE_LABEL[i.phase], preco: precoDe(i), detalheHref, contratar, necessidade: necessidadeDe(i) };
  };
  const itens = pub.map(item);
  // Temas pagos liberados: compra única, com loja de demonstração (o preço é o do catálogo de temas, o mesmo do checkout).
  const temas = THEME_CATALOG.filter((t) => t.release === "released" && t.priceCents > 0).sort((a, b) => b.level - a.level || b.priceCents - a.priceCents)
    .map((t) => ({ key: t.key, nome: t.name, nicho: t.niche, nivel: t.level, tier: t.tier, precoCents: t.priceCents, resumo: t.tagline, demoHref: e.link(`${e.commerce.base}/demo/${t.key}`), cor: t.previewAccent }));
  const superdrop: ItemVitrine = {
    key: "SUPERDROP", slug: "superdrop", nome: "SuperDrop", resumo: e.superdrop.tagline, familia: "SUPERDROP", familiaRotulo: FAMILY_LABEL.SUPERDROP, fase: "FUNDACAO", faseRotulo: PHASE_LABEL.FUNDACAO,
    preco: { tipo: "CONSULTA", cents: null, linha: "Planos no site do SuperDrop" }, detalheHref: e.link(`${e.superdrop.base}/`), contratar: { rotulo: "Conhecer o SuperDrop", href: e.link(`${e.superdrop.base}/`) }, necessidade: "SUPERDROP",
  };
  const familias = ORDEM_FAMILIAS.map((f) => ({
    key: f, rotulo: FAMILY_LABEL[f],
    itens: f === "SUPERDROP" ? [superdrop] : f === "TEMA" ? [] : itens.filter((i) => i.familia === f),
  })).filter((f) => f.itens.length || f.key === "TEMA");
  const fases = e.fases.map((f) => ({ key: f.key, nome: f.name, objetivo: f.goal, itens: itens.filter((i) => i.fase === f.key) }));
  const campanhas = e.oferta ? [{
    key: "ENTRADA_COMMERCE", titulo: "Comece a sua loja na NextLevel E-commerce",
    texto: `${e.oferta.trialDays} dias grátis e taxa zero da plataforma para clientes novos.`,
    href: e.link(`${e.commerce.base}/planos`), rotulo: "Ver os planos",
  }] : [];
  const busca = [
    ...itens.map((i) => ({ id: i.slug, rotulo: i.nome, grupo: i.familiaRotulo, href: `#sol-${i.slug}`, termos: [i.resumo, i.familiaRotulo, ...(SINONIMOS[i.familia] ?? []), ...fontesDe(e.itens.find((x) => x.key === i.key))] })),
    { id: "superdrop", rotulo: "SuperDrop", grupo: FAMILY_LABEL.SUPERDROP, href: "#sol-superdrop", termos: [e.superdrop.tagline, ...(SINONIMOS.SUPERDROP ?? [])] },
    ...temas.map((t) => ({ id: `tema-${t.key}`, rotulo: `Tema ${t.nome}`, grupo: FAMILY_LABEL.TEMA, href: `#tema-${t.key}`, termos: [t.nicho, t.resumo, ...(SINONIMOS.TEMA ?? [])] })),
  ];
  return { itens, familias, fases, temas, campanhas, busca, portas: PORTAS };
}
export type VitrineSolucoes = ReturnType<typeof projetarVitrine>;

const fontesDe = (i: CatalogItem | undefined) => (Array.isArray(i?.meta?.sources) ? (i!.meta.sources as string[]) : []);

/** Total da seleção: soma só o que tem preço fixo, separando compra única e mensalidade; o resto conta como sob consulta. */
export function totalSelecao(itens: Pick<ItemVitrine, "preco">[]) {
  const unico = itens.filter((i) => i.preco.tipo === "UNICO").reduce((s, i) => s + (i.preco.cents ?? 0), 0);
  const mensal = itens.filter((i) => i.preco.tipo === "MENSAL").reduce((s, i) => s + (i.preco.cents ?? 0), 0);
  return { unicoCents: unico, mensalCents: mensal, consulta: itens.filter((i) => i.preco.tipo === "CONSULTA").length };
}

/** Diagnóstico a partir da seleção: até 6 necessidades (limite do formulário) e a lista de itens na mensagem. */
export function diagnosticoDaSelecao(itens: Pick<ItemVitrine, "nome" | "necessidade">[]) {
  const needs = [...new Set(itens.map((i) => i.necessidade).filter((n): n is DiagnosticNeed => !!n))].slice(0, 6);
  return { needs, mensagem: itens.length ? `Tenho interesse em: ${itens.map((i) => i.nome).join(", ")}.` : "" };
}
