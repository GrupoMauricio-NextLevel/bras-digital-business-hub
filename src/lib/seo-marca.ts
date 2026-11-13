import { HOLDING_CODE, type Brand } from "@/lib/brand";
import { PANEL_PREFIXES } from "@/lib/host-routing";
import { caminhosCommerce } from "@/lib/seo/paginas";

/**
 * Buscadores por marca (D149): cada endereço publica o próprio `robots.txt` e o próprio `sitemap.xml`, só com as páginas
 * daquela marca (árvore-alvo em docs/mapa/PROPOSTA-REORGANIZACAO-2026-10.md). Endereço técnico (demonstração, onrender,
 * localhost), escritório dos painéis e marca "em breve" não entram na busca. Arquivo puro: o servidor só passa a marca.
 */
export type SeoHost = { brand: Brand | null; office: boolean };

/** Caminhos que entram no sitemap da marca (sem domínio). */
export function sitemapPaths(brand: Brand, opts: { themes: string[]; solutions: string[]; publicSolutions: boolean }): string[] {
  if (brand.soon) return [];
  const legal = ["/termos", "/privacidade"];
  if (brand.code === HOLDING_CODE) return [...(opts.publicSolutions ? ["/solucoes", ...opts.solutions.map((s) => `/solucoes/${s}`)] : []), "/loja-nextlevel", "/club", "/meu-contador", ...legal];
  if (brand.landing === "cargas") return ["/", ...legal];
  if (brand.closedCommerce) return ["/", ...(brand.signupOpen ? ["/cadastro"] : []), ...legal];
  const dropship = brand.modules.includes("dropship");
  // NextLevel Commerce (D293): a lista sai da tabela central de páginas públicas, mais uma linha por tema publicado.
  if (brand.code === "NEXTLEVEL_COMMERCE") {
    const base = caminhosCommerce(brand);
    return base.flatMap((c) => (c === "/temas" ? ["/temas", ...opts.themes.map((k) => `/temas/${k}`)] : [c]));
  }
  const themes = brand.modules.includes("themes") ? ["/temas", ...opts.themes.map((k) => `/temas/${k}`)] : [];
  return [
    "/", ...(dropship ? ["/como-funciona"] : []), "/planos", "/faq", brand.signupOpen ? "/cadastro" : "/quero-minha-loja",
    ...(dropship ? ["/seja-fornecedor"] : []), ...(brand.partnersOpen ? ["/parceiros"] : []), ...themes, ...legal,
  ];
}

/**
 * Robôs de busca e de IA citados por nome no robots.txt (D293, plano de busca v3, seção 4.4). Todos liberados nas páginas
 * públicas, inclusive os de treino (decisão recomendada no plano); os painéis continuam bloqueados para todos. Os nomes
 * mudam: conferir na documentação de cada empresa a cada revisão do plano e atualizar aqui.
 */
export const ROBOS_DE_IA = [
  "Googlebot", "Google-Extended", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "Perplexity-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User", "Applebot", "Applebot-Extended", "meta-externalagent", "MistralAI-User", "DuckAssistBot",
] as const;

export type RobotsPlan = { index: false } | { index: true; allow: string[]; disallow: string[] };
/** O que o `robots.txt` do endereço libera. */
export function robotsPlan({ brand, office }: SeoHost): RobotsPlan {
  if (!brand || office || brand.soon) return { index: false };
  const privados = [...PANEL_PREFIXES, "/api/", "/r/", "/c/", "/loja-nextlevel/pedido/", "/balcao/", "/balcao-club/", "/motorista/", "/ativar", "/demo", "/dev", "/gravacao"];
  // Endereço do grupo (hoje o mesmo do Master): só as páginas do grupo; o resto é painel.
  if (brand.code === HOLDING_CODE) return { index: true, allow: ["/solucoes", "/loja-nextlevel", "/club", "/meu-contador", "/termos", "/privacidade"], disallow: ["/", "/loja-nextlevel/pedido/"] };
  return { index: true, allow: ["/"], disallow: privados };
}
