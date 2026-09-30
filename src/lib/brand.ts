/**
 * Marcas do portfólio NextLevel sobre o MESMO motor (mesmo repositório, deploy e banco).
 * Marca é organização e apresentação (portal, e-mails, cobrança, módulos), NÃO fronteira de segurança:
 * a fronteira continua sendo o tenant. Texto de marca nunca fica fixo em componente: vem daqui.
 * Puro (sem Next/React), para servir servidor, e-mail, testes e rotas.
 */
export const BRAND_CODES = ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL"] as const;
export type BrandCode = (typeof BRAND_CODES)[number];

/** Módulos que uma marca liga por padrão (a compra avulsa e os planos refinam por loja). */
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
};

const list = (v: string | undefined, fallback: string[]) => (v ? v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : fallback);
const LEGAL = (n: string) => `${n} é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda.`;

/** Domínios podem ser ajustados por variável de ambiente sem novo deploy de código (lista separada por vírgula). */
export function brandsFrom(env: Record<string, string | undefined> = process.env): Record<BrandCode, Brand> {
  return {
    NEXTLEVEL_COMMERCE: {
      code: "NEXTLEVEL_COMMERCE", name: "NextLevel Commerce", live: true,
      tagline: "A loja virtual feita para quem vende moda no Brasil",
      description: "Plataforma de lojas virtuais da NextLevel: temas de alto nível, Pix e cartão, programa de parceiros e, em breve, atacado, influenciadores e live shop.",
      domains: list(env.BRAND_DOMAINS_NEXTLEVEL_COMMERCE, ["nextlevelgroup.com.br", "nextlevelcommerce.com.br"]),
      baseUrl: env.BRAND_URL_NEXTLEVEL_COMMERCE ?? "https://nextlevelgroup.com.br",
      primaryColor: "#0b1a3a", accentColor: "#2563eb", logo: "nextlevel", wordmark: "Commerce",
      modules: ["stores", "themes", "partners"], emailFromName: "NextLevel Commerce", legalLine: LEGAL("NextLevel Commerce"),
      // Conta simples (D34) pronta: o cadastro abre ao ligar BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true (decisão do dono, junto do Mercado Pago da NextLevel).
      signupOpen: env.BRAND_SIGNUP_NEXTLEVEL_COMMERCE === "true", partnersOpen: env.BRAND_PARTNERS_NEXTLEVEL_COMMERCE === "true",
    },
    SUPERDROP: {
      code: "SUPERDROP", name: "SuperDrop", live: true,
      tagline: "Sua loja online sem estoque, pronta para vender",
      description: "Monte sua loja online com produtos de fornecedores parceiros, sem estoque. Assine por Pix, acesso liberado na hora, ou teste 7 dias com cupom.",
      domains: list(env.BRAND_DOMAINS_SUPERDROP, ["superdrop.com.br"]),
      baseUrl: env.BRAND_URL_SUPERDROP ?? "https://superdrop.com.br",
      primaryColor: "#0f1c16", accentColor: "#22c55e", logo: "superdrop",
      modules: ["stores", "themes", "partners", "dropship"], emailFromName: "SuperDrop", legalLine: LEGAL("SuperDrop"), signupOpen: true, partnersOpen: true,
    },
    BRAS_DIGITAL: {
      code: "BRAS_DIGITAL", name: "Brás Digital", live: false,
      tagline: "O atacado do Brás em uma vitrine só",
      description: "Marketplace atacadista com lojas e fornecedores do Brás. Em breve.",
      domains: list(env.BRAND_DOMAINS_BRAS_DIGITAL, []),
      baseUrl: env.BRAND_URL_BRAS_DIGITAL ?? "https://nextlevelgroup.com.br",
      primaryColor: "#3b0764", accentColor: "#f59e0b", logo: "nextlevel", wordmark: "Brás Digital",
      modules: ["stores", "themes", "partners", "wholesale", "marketplace"], emailFromName: "Brás Digital", legalLine: LEGAL("Brás Digital"), signupOpen: false, partnersOpen: false,
    },
  };
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

/** Marca de um endereço: o domínio exato ou qualquer subdomínio dele (www, app). Sem correspondência, a marca padrão. */
export function brandForHost(host: string | null | undefined, env: Record<string, string | undefined> = process.env): Brand {
  const all = brandsFrom(env);
  const h = (host ?? "").split(":")[0]!.toLowerCase();
  if (h) for (const b of Object.values(all)) if (b.domains.some((d) => h === d || h.endsWith(`.${d}`))) return b;
  return all[defaultBrandCode(env)];
}

/** A marca liga o módulo? */
export const brandHas = (b: Brand, m: BrandModule) => b.modules.includes(m);
