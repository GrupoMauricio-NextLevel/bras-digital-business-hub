/**
 * Marcas do portfólio NextLevel sobre o MESMO motor (mesmo repositório, deploy e banco).
 * Marca é organização e apresentação (portal, e-mails, cobrança, módulos), NÃO fronteira de segurança:
 * a fronteira continua sendo o tenant. Texto de marca nunca fica fixo em componente: vem daqui.
 * Puro (sem Next/React), para servir servidor, e-mail, testes e rotas.
 */
export const BRAND_CODES = ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL"] as const;
export type BrandCode = (typeof BRAND_CODES)[number];
/** "NEXTLEVEL" é a holding: só aparece no endereço do Master central. Os demais são produtos que têm contas, lojas e fornecedores. */
export const HOLDING_CODE: BrandCode = "NEXTLEVEL";
export const PRODUCT_BRANDS = BRAND_CODES.filter((c) => c !== HOLDING_CODE) as Exclude<BrandCode, "NEXTLEVEL">[];

/** Módulos que uma marca liga por padrão (a compra avulsa e os planos refinam por loja). */
import { PALETTES } from "@/lib/brand-palette";

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
  closedCommerce?: boolean;
};

const list = (v: string | undefined, fallback: string[]) => (v ? v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : fallback);
const url = (v: string | undefined) => (v ? v.trim().replace(/\/$/, "") : null);
const LEGAL = (n: string) => `${n} é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda.`;

/** Domínios podem ser ajustados por variável de ambiente sem novo deploy de código (lista separada por vírgula). */
export function brandsFrom(env: Record<string, string | undefined> = process.env): Record<BrandCode, Brand> {
  return {
    NEXTLEVEL_COMMERCE: {
      code: "NEXTLEVEL_COMMERCE", name: "NextLevel Commerce", live: true,
      tagline: "A loja virtual feita para quem vende moda no Brasil",
      description: "Plataforma de lojas virtuais da NextLevel: temas de alto nível, Pix e cartão, programa de parceiros e, em breve, atacado.",
      domains: list(env.BRAND_DOMAINS_NEXTLEVEL_COMMERCE, ["lojas.nextlevelgroup.com.br", "nextlevelcommerce.com.br"]),
      baseUrl: env.BRAND_URL_NEXTLEVEL_COMMERCE ?? "https://lojas.nextlevelgroup.com.br",
      officeUrl: url(env.BRAND_OFFICE_NEXTLEVEL_COMMERCE),
      primaryColor: PALETTES.NEXTLEVEL_COMMERCE.light.ink, accentColor: PALETTES.NEXTLEVEL_COMMERCE.light.signal, logo: "nextlevel", wordmark: "Commerce",
      modules: ["stores", "themes", "partners"], emailFromName: "NextLevel Commerce", legalLine: LEGAL("NextLevel Commerce"),
      // Conta simples (D34) pronta: o cadastro abre ao ligar BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true (decisão do dono, junto do Mercado Pago da NextLevel).
      signupOpen: env.BRAND_SIGNUP_NEXTLEVEL_COMMERCE === "true", partnersOpen: env.BRAND_PARTNERS_NEXTLEVEL_COMMERCE === "true", soon: null,
    },
    SUPERDROP: {
      code: "SUPERDROP", name: "SuperDrop", live: true,
      tagline: "Sua loja online sem estoque, pronta para vender",
      description: "Monte sua loja online com produtos de fornecedores parceiros, sem estoque. Assine por Pix, acesso liberado na hora, ou teste 7 dias com cupom.",
      domains: list(env.BRAND_DOMAINS_SUPERDROP, ["superdrop.com.br"]),
      baseUrl: env.BRAND_URL_SUPERDROP ?? "https://superdrop.com.br",
      officeUrl: url(env.BRAND_OFFICE_SUPERDROP),
      primaryColor: PALETTES.SUPERDROP.light.ink, accentColor: PALETTES.SUPERDROP.light.signal, logo: "superdrop",
      modules: ["stores", "themes", "partners", "dropship"], emailFromName: "SuperDrop", legalLine: LEGAL("SuperDrop"), signupOpen: true, partnersOpen: true, soon: null,
    },
    BRAS_DIGITAL: {
      // D91: com BRAND_SIGNUP_BRAS_DIGITAL=true abre a página pública e o cadastro grátis com CNPJ; sem ela, segue "em breve".
      code: "BRAS_DIGITAL", name: "Brás Digital", live: env.BRAND_SIGNUP_BRAS_DIGITAL === "true",
      tagline: "O atacado do Brás em uma vitrine só",
      description: env.BRAND_SIGNUP_BRAS_DIGITAL === "true"
        ? "Atacado em caixa fechada das importadoras do Brás, com vídeos de análise de produto. Cadastro grátis com CNPJ; preço e estoque só para membros."
        : "Plataforma fechada de atacado do Brás para membros aprovados. Em breve.",
      domains: list(env.BRAND_DOMAINS_BRAS_DIGITAL, ["bras.superdrop.com.br"]),
      baseUrl: env.BRAND_URL_BRAS_DIGITAL ?? "https://bras.superdrop.com.br",
      officeUrl: url(env.BRAND_OFFICE_BRAS_DIGITAL),
      primaryColor: PALETTES.BRAS_DIGITAL.light.ink, accentColor: PALETTES.BRAS_DIGITAL.light.signal, logo: "nextlevel", wordmark: "Brás Digital",
      modules: ["stores", "themes", "partners", "wholesale", "marketplace"], emailFromName: "Brás Digital", legalLine: LEGAL("Brás Digital"), signupOpen: env.BRAND_SIGNUP_BRAS_DIGITAL === "true", partnersOpen: false, closedCommerce: true,
      soon: env.BRAND_SIGNUP_BRAS_DIGITAL === "true" ? null : { headline: "O atacado do Brás, em uma vitrine só.", text: "Uma plataforma fechada para membros aprovados comprarem em caixa fechada, com reserva e retirada organizadas.", bullets: ["Acesso por cadastro e aprovação", "Compra em caixa fechada", "Reserva e retirada organizadas"], leadTitle: "Quero solicitar acesso à Brás Digital" },
    },
    CREATORS_HUB: {
      code: "CREATORS_HUB", name: "Hub Creators", live: false,
      tagline: "Influenciadores e vendedores que vendem juntos",
      description: "Plataforma para marcas e criadores de conteúdo venderem juntos: links rastreáveis, campanhas, amostras e comissões. Em breve.",
      domains: list(env.BRAND_DOMAINS_CREATORS_HUB, ["hubcreators.nextlevelgroup.com.br"]),
      baseUrl: env.BRAND_URL_CREATORS_HUB ?? "https://hubcreators.nextlevelgroup.com.br",
      officeUrl: url(env.BRAND_OFFICE_CREATORS_HUB),
      primaryColor: PALETTES.CREATORS_HUB.light.ink, accentColor: PALETTES.CREATORS_HUB.light.signal, logo: "nextlevel", wordmark: "Creators",
      modules: ["stores", "partners", "influencers", "liveShop"], emailFromName: "Hub Creators", legalLine: LEGAL("Hub Creators"), signupOpen: false, partnersOpen: false,
      soon: { headline: "Quem cria e quem vende, no mesmo lugar.", text: "Influenciadores e vendedores do TikTok e de outras redes conectados a marcas, com link rastreável, campanha, amostra e comissão calculada sobre a venda real.", bullets: ["Link rastreável por criador e campanha", "Comissão sobre venda confirmada", "Pedido de amostra e acompanhamento"], leadTitle: "Quero entrar no Hub Creators" },
    },
    CHINA_HUB: {
      code: "CHINA_HUB", name: "China Hub", live: false,
      tagline: "Fornecedores e importadores conectados ao Brasil",
      description: "Rede para fornecedores e importadores levarem o seu catálogo a lojistas de todo o Brasil. Em breve.",
      domains: list(env.BRAND_DOMAINS_CHINA_HUB, ["chinahubglobal.com.br"]),
      baseUrl: env.BRAND_URL_CHINA_HUB ?? "https://chinahubglobal.com.br",
      officeUrl: url(env.BRAND_OFFICE_CHINA_HUB),
      primaryColor: PALETTES.CHINA_HUB.light.ink, accentColor: PALETTES.CHINA_HUB.light.signal, logo: "nextlevel", wordmark: "China Hub",
      modules: ["stores", "themes", "partners", "dropship", "wholesale"], emailFromName: "China Hub", legalLine: LEGAL("China Hub"), signupOpen: false, partnersOpen: false,
      soon: { headline: "Seu catálogo importado, vendendo no Brasil inteiro.", text: "Fornecedores e importadores conectados a uma rede de lojistas e representantes, com pedido, expedição e pagamento organizados em português.", bullets: ["Rede de lojistas e representantes", "Pedido e expedição organizados", "Atendimento em português, espanhol e mandarim"], leadTitle: "Quero ser fornecedor no China Hub", zh: { headline: "把货卖到巴西，全国分销", text: "连接巴西批发商与零售店网络，由本地系统统一管理订单与发货。" } },
    },
    NEXTLEVEL: {
      code: "NEXTLEVEL", name: "NextLevel", live: true,
      tagline: "Gestão central do ecossistema NextLevel",
      description: "Painel de gestão da NextLevel Marketing: todos os produtos em um só lugar.",
      domains: list(env.BRAND_DOMAINS_NEXTLEVEL, ["master.nextlevelgroup.com.br"]),
      baseUrl: env.BRAND_URL_NEXTLEVEL ?? "https://master.nextlevelgroup.com.br",
      officeUrl: null,
      primaryColor: PALETTES.NEXTLEVEL.light.ink, accentColor: PALETTES.NEXTLEVEL.light.signal, logo: "nextlevel",
      modules: ["stores", "themes", "partners", "wholesale", "influencers", "liveShop", "dropship", "marketplace"], emailFromName: "NextLevel", legalLine: LEGAL("NextLevel"), signupOpen: false, partnersOpen: true, soon: null,
    },
  };
}

/** A marca opera fechada (ver `Brand.closedCommerce`): configuração da marca, nunca condicional por empresa em componente. */
export const isClosedCommerceBrand = (brand: Pick<Brand, "closedCommerce"> | null | undefined): boolean => brand?.closedCommerce === true;

/** Códigos das marcas fechadas, para filtrar consultas no banco (ex.: fornecedores que não podem aparecer em página pública). */
export function closedCommerceBrandCodes(env: Record<string, string | undefined> = process.env): BrandCode[] {
  const all = brandsFrom(env);
  return BRAND_CODES.filter((c) => isClosedCommerceBrand(all[c]));
}

export const isBrandCode = (v: unknown): v is BrandCode => typeof v === "string" && (BRAND_CODES as readonly string[]).includes(v);

/** Marca padrão quando o endereço não pertence a nenhuma marca (localhost, endereço técnico do Render). Padrão: SuperDrop, a marca em produção. */
export function defaultBrandCode(env: Record<string, string | undefined> = process.env): BrandCode {
  return isBrandCode(env.DEFAULT_BRAND) ? env.DEFAULT_BRAND : "SUPERDROP";
}

export function brandByCode(code: string | null | undefined, env: Record<string, string | undefined> = process.env): Brand {
  const all = brandsFrom(env);
  return isBrandCode(code) ? all[code] : all[defaultBrandCode(env)];
}

/** O domínio mais específico vence (ex.: `bras.superdrop.com.br` é do Brás Digital, mesmo `superdrop.com.br` sendo do SuperDrop). */
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
    // Com MASTER_HOST_ONLY=true a equipe NextLevel entra só pelo endereço do Master central.
    if (env.MASTER_HOST_ONLY === "true" && hostBrand.code !== HOLDING_CODE) return { message: `A equipe NextLevel entra pelo endereço ${masterHost}.` };
    return null;
  }
  if (account.brand === hostBrand.code) return null;
  if (hostBrand.code === HOLDING_CODE) return { message: "Este endereço é só da equipe NextLevel. Entre pelo endereço do seu produto." };
  const own = brandByCode(account.brand, env);
  return { message: `Sua conta é da ${own.name}. Entre pelo endereço ${own.baseUrl.replace(/^https?:\/\//, "")}.` };
}
