/**
 * Marcas do portfólio NextLevel sobre o MESMO motor (mesmo repositório, deploy e banco).
 * Marca é organização e apresentação (portal, e-mails, cobrança, módulos), NÃO fronteira de segurança:
 * a fronteira continua sendo o tenant. Texto de marca nunca fica fixo em componente: vem daqui.
 * Puro (sem Next/React), para servir servidor, e-mail, testes e rotas.
 */
export const BRAND_CODES = ["NEXTLEVEL_COMMERCE", "NEXTLEVEL"] as const;
export type BrandCode = (typeof BRAND_CODES)[number];
/** "NEXTLEVEL" é a holding: só aparece no endereço do Master central. Os demais são produtos que têm contas, lojas e fornecedores. */
export const HOLDING_CODE: BrandCode = "NEXTLEVEL";
/** Atalho de prévia `/lojas` (cara da Commerce em qualquer endereço): só na demonstração (D149). */
export const brandPreviewAllowed = (env: Record<string, string | undefined> = process.env) => env.NEXT_PUBLIC_DEMO_MODE === "true";
export const PRODUCT_BRANDS = BRAND_CODES.filter((c) => c !== HOLDING_CODE) as Exclude<BrandCode, "NEXTLEVEL">[];

/** Módulos que uma marca liga por padrão (a compra avulsa e os planos refinam por loja). */
import { PALETTES } from "@/lib/brand-palette";
import { EC } from "@/lib/marcas/nextlevel-ecommerce";

export const BRAND_MODULES = ["stores", "themes", "partners", "wholesale", "influencers", "liveShop", "dropship", "marketplace"] as const;
export type BrandModule = (typeof BRAND_MODULES)[number];

export type Brand = {
  code: BrandCode;
  /** Nome completo (títulos, e-mails, rodapés). */
  name: string;
  /** Verdadeiro quando a marca já atende o público (senão o portal fica em modo de lista de espera). */
  live: boolean;
  /** Frase curta que descreve o produto. */
  tagline: string;
  description: string;
  /** Domínios que pertencem à marca (o domínio e seus subdomínios como www e app). */
  domains: string[];
  /** Endereço público principal (links de e-mail e SEO). */
  baseUrl: string;
  /** Endereço só dos painéis (login, Master, fornecedor, lojista, afiliado), ex.: https://office.superdrop.com.br. Nulo = painéis no endereço público. Liga-se por variável de ambiente, depois que o domínio estiver verificado. */
  officeUrl: string | null;
  primaryColor: string;
  accentColor: string;
  logo: "superdrop" | "nextlevel";
  /** Sufixo do logotipo em texto quando a arte é a da NextLevel. */
  wordmark?: string;
  modules: BrandModule[];
  /** Nome do remetente dos e-mails. */
  emailFromName: string;
  /** Linha legal do rodapé ("<produto> é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda."). */
  legalLine: string;
  /** O cadastro público de loja está aberto (depende do modelo de conta da marca). */
  signupOpen: boolean;
  /** O programa de parceiros está aberto nesta marca (depende de planos e comissões da própria marca). */
  partnersOpen: boolean;
  /** Produto ainda sem sistema próprio: o portal mostra uma página "em breve" com lista de espera, sem prometer o que não existe. */
  soon: { headline: string; text: string; bullets: string[]; leadTitle: string; zh?: { headline: string; text: string } } | null;
  /**
   * Operação comercial fechada: preço, estoque, nome de importadora/fornecedor e vídeo completo só para membro aprovado,
   * nada indexável e nenhuma página pública de fornecedor. Ausente = falso (as marcas abertas não mudam).
   */
  /** Rodapé público em superfície escura da marca (logo escura com slogan). Brás Digital Club (D158). */
  rodapeEscuro?: boolean;
  closedCommerce?: boolean;
  /** Página inicial própria da marca (ex.: NextLevel Cargas). Ausente = a página do modelo da marca (loja, dropshipping, fechada). */
  landing?: "cargas";
  /** Só estes caminhos públicos existem no endereço da marca (além dos painéis e de /api); o resto volta para a página inicial. */
  publicPaths?: string[];
  /** Padrões (regex) de caminhos públicos extras, ex.: o link do motorista da Cargas. */
  publicPatterns?: string[];
  /** Convite no rodapé da tela de entrada. Ausente = o convite do modelo da marca (loja, cadastro de membro, lista de espera); null = nenhum. */
  loginInvite?: { lead: string; label: string; href: string } | null;
};

const list = (v: string | undefined, fallback: string[]) => (v ? v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : fallback);
const url = (v: string | undefined) => (v ? v.trim().replace(/\/$/, "") : null);
const LEGAL = (n: string) => `${n} é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda.`;

/** Domínios podem ser ajustados por variável de ambiente sem novo deploy de código (lista separada por vírgula). */
export function brandsFrom(env: Record<string, string | undefined> = process.env): Record<BrandCode, Brand> {
  return {
    NEXTLEVEL_COMMERCE: {
      // NextLevel Commerce (D163): nome público novo; o código NEXTLEVEL_COMMERCE fica (está no banco).
      code: "NEXTLEVEL_COMMERCE", name: EC.name, live: true,
      tagline: "Loja virtual para varejo e atacado",
      // D293: o atacado existe em todos os planos e atendemos vários nichos (antes: "feita para quem vende moda" e "em breve, atacado").
      description: "Plataforma de lojas virtuais da NextLevel com atacado em todos os planos, Pix e cartão, 0% de tarifa da plataforma com Mercado Pago e temas por nicho.",
      domains: list(env.BRAND_DOMAINS_NEXTLEVEL_COMMERCE, ["lojas.nextlevelgroup.com.br", "nextlevelcommerce.com.br", "www.nextlevelcommerce.com.br"]),
      baseUrl: env.BRAND_URL_NEXTLEVEL_COMMERCE ?? "https://lojas.nextlevelgroup.com.br",
      officeUrl: url(env.BRAND_OFFICE_NEXTLEVEL_COMMERCE),
      primaryColor: PALETTES.NEXTLEVEL_COMMERCE.light.ink, accentColor: PALETTES.NEXTLEVEL_COMMERCE.light.signal, logo: "nextlevel",
      modules: ["stores", "themes", "partners"], emailFromName: EC.name, legalLine: LEGAL(EC.name),
      // Conta simples (D34) pronta: o cadastro abre ao ligar BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true (decisão do dono, junto do Mercado Pago da NextLevel).
      signupOpen: env.BRAND_SIGNUP_NEXTLEVEL_COMMERCE === "true", partnersOpen: env.BRAND_PARTNERS_NEXTLEVEL_COMMERCE !== "false" /* D220: programa de parceiros aberto */, soon: null,
    },
    NEXTLEVEL: {
      code: "NEXTLEVEL", name: "NextLevel", live: true,
      tagline: "Gestão central do ecossistema NextLevel",
      description: "Painel de gestão da NextLevel Marketing: todos os produtos em um só lugar.",
      domains: list(env.BRAND_DOMAINS_NEXTLEVEL, ["master.nextlevelgroup.com.br", "nextlevelgroup.com.br", "www.nextlevelgroup.com.br"]),
      baseUrl: env.BRAND_URL_NEXTLEVEL ?? "https://master.nextlevelgroup.com.br",
      officeUrl: null,
      primaryColor: PALETTES.NEXTLEVEL.light.ink, accentColor: PALETTES.NEXTLEVEL.light.signal, logo: "nextlevel",
      modules: ["stores", "themes", "partners", "wholesale", "influencers", "liveShop", "dropship", "marketplace"], emailFromName: "NextLevel", legalLine: LEGAL("NextLevel"), signupOpen: false, partnersOpen: true, soon: null,
      // Endereço só da equipe: sem convite de cadastro nem de parceiro na tela de entrada.
      loginInvite: null,
    },
  };
}

/** Convite da tela de entrada: o da marca, ou o do modelo dela (membro da operação fechada, loja, lista de espera). Null = nenhum. */
export function loginInviteFor(brand: Pick<Brand, "loginInvite" | "closedCommerce" | "signupOpen" | "soon">): { lead: string; label: string; href: string } | null {
  if (brand.loginInvite !== undefined) return brand.loginInvite;
  if (brand.soon) return { lead: "Quer entrar?", label: brand.soon.leadTitle, href: "/quero-minha-loja" };
  if (brand.closedCommerce && brand.signupOpen) return { lead: "Ainda não é membro?", label: "Cadastrar minha empresa (grátis)", href: "/cadastro" };
  return brand.signupOpen ? { lead: "Ainda não tem uma loja?", label: "Criar agora", href: "/cadastro" } : { lead: "Quer uma loja?", label: "Falar com a gente", href: "/quero-minha-loja" };
}

/** A marca opera fechada (ver `Brand.closedCommerce`): configuração da marca, nunca condicional por empresa em componente. */
export const isClosedCommerceBrand = (brand: Pick<Brand, "closedCommerce"> | null | undefined): boolean => brand?.closedCommerce === true;

/** Códigos das marcas fechadas, para filtrar consultas no banco (ex.: fornecedores que não podem aparecer em página pública). */
export function closedCommerceBrandCodes(env: Record<string, string | undefined> = process.env): BrandCode[] {
  const all = brandsFrom(env);
  return BRAND_CODES.filter((c) => isClosedCommerceBrand(all[c]));
}

export const isBrandCode = (v: unknown): v is BrandCode => typeof v === "string" && (BRAND_CODES as readonly string[]).includes(v);

/** Marca padrão quando o endereço não pertence a nenhuma marca (localhost, endereço técnico do Render). Padrão: a Commerce, a marca em produção. */
export function defaultBrandCode(env: Record<string, string | undefined> = process.env): BrandCode {
  return isBrandCode(env.DEFAULT_BRAND) ? env.DEFAULT_BRAND : "NEXTLEVEL_COMMERCE";
}

export function brandByCode(code: string | null | undefined, env: Record<string, string | undefined> = process.env): Brand {
  const all = brandsFrom(env);
  return isBrandCode(code) ? all[code] : all[defaultBrandCode(env)];
}

/** O domínio mais específico vence (ex.: `bras.nextlevelgroup.com.br` é do Brás Digital, mesmo `superdrop.com.br` sendo do SuperDrop). */
function longestMatch(all: Record<BrandCode, Brand>, h: string): Brand | null {
  let best: { b: Brand; len: number } | null = null;
  for (const b of Object.values(all)) for (const d of b.domains) if ((h === d || h.endsWith(`.${d}`)) && (!best || d.length > best.len)) best = { b, len: d.length };
  return best?.b ?? null;
}

/** Marca de um endereço: o domínio exato ou qualquer subdomínio dele (www, app). Sem correspondência, a marca padrão. */
export function brandForHost(host: string | null | undefined, env: Record<string, string | undefined> = process.env): Brand {
  const all = brandsFrom(env);
  const h = (host ?? "").split(":")[0]!.toLowerCase();
  return longestMatch(all, h) ?? all[defaultBrandCode(env)];
}

/** A marca liga o módulo? */
export const brandHas = (b: Brand, m: BrandModule) => b.modules.includes(m);

/** Marca dona do endereço, só quando o domínio pertence a uma marca (null em localhost e endereços técnicos). */
export function brandOfHostStrict(host: string | null | undefined, env: Record<string, string | undefined> = process.env): Brand | null {
  const all = brandsFrom(env);
  const h = (host ?? "").split(":")[0]!.toLowerCase();
  return h ? longestMatch(all, h) : null;
}

/**
 * Cada conta pertence a uma marca e só entra pelo endereço dela. A equipe NextLevel (holding) entra em qualquer um.
 * Endereços técnicos (sem marca) não bloqueiam ninguém. Devolve o aviso a mostrar, ou null se pode entrar.
 */
export function accountBrandConflict(account: { role: string; brand: BrandCode }, hostBrand: Brand | null, env: Record<string, string | undefined> = process.env): { message: string } | null {
  if (!hostBrand) return null;
  const masterHost = brandByCode(HOLDING_CODE, env).baseUrl.replace(/^https?:\/\//, "");
  if (account.role === "NEXTLEVEL_MASTER") {
    // A equipe NextLevel entra só pelo endereço do Master central (D149; MASTER_HOST_ONLY=false desliga).
    if (env.MASTER_HOST_ONLY !== "false" && hostBrand.code !== HOLDING_CODE) return { message: `A equipe NextLevel entra pelo endereço ${masterHost}.` };
    return null;
  }
  if (account.brand === hostBrand.code) return null;
  if (hostBrand.code === HOLDING_CODE) return { message: "Este endereço é só da equipe NextLevel. Entre pelo endereço do seu produto." };
  const own = brandByCode(account.brand, env);
  return { message: `Sua conta é da ${own.name}. Entre pelo endereço ${own.baseUrl.replace(/^https?:\/\//, "")}.` };
}
