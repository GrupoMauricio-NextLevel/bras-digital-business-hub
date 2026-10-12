import { HOLDING_CODE, type Brand } from "@/lib/brand";
import { PANEL_PREFIXES } from "@/lib/host-routing";

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
  if (brand.code === HOLDING_CODE) return [...(opts.publicSolutions ? ["/solucoes", ...opts.solutions.map((s) => `/solucoes/${s}`)] : []), "/loja-nextlevel", ...legal];
  if (brand.landing === "cargas") return ["/", ...legal];
  if (brand.closedCommerce) return ["/", ...(brand.signupOpen ? ["/cadastro"] : []), ...legal];
  const dropship = brand.modules.includes("dropship");
  const themes = brand.modules.includes("themes") ? ["/temas", ...opts.themes.map((k) => `/temas/${k}`)] : [];
  return [
    "/", ...(dropship ? ["/como-funciona"] : []), "/planos", "/faq", brand.signupOpen ? "/cadastro" : "/quero-minha-loja",
    ...(dropship ? ["/seja-fornecedor"] : []), ...(brand.partnersOpen ? ["/parceiros"] : []), ...themes, ...legal,
  ];
}

export type RobotsPlan = { index: false } | { index: true; allow: string[]; disallow: string[] };
/** O que o `robots.txt` do endereço libera. */
export function robotsPlan({ brand, office }: SeoHost): RobotsPlan {
  if (!brand || office || brand.soon) return { index: false };
  const privados = [...PANEL_PREFIXES, "/api/", "/r/", "/c/", "/loja-nextlevel/pedido/", "/balcao/", "/balcao-club/", "/motorista/", "/ativar", "/demo", "/dev", "/gravacao"];
  // Endereço do grupo (hoje o mesmo do Master): só as páginas do grupo; o resto é painel.
  if (brand.code === HOLDING_CODE) return { index: true, allow: ["/solucoes", "/loja-nextlevel", "/termos", "/privacidade"], disallow: ["/", "/loja-nextlevel/pedido/"] };
  return { index: true, allow: ["/"], disallow: privados };
}
