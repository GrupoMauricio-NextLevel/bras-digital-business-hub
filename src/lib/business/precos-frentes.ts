import type { PriceBook } from "@/lib/finance/price-book";

/**
 * Preços das frentes (ecossistema tudo em um, D336). Funções puras, testadas; os valores vêm sempre da tabela do Master
 * (`frentes` no price book) e dos planos do catálogo, nunca escritos aqui.
 */
export type Nivel = "START" | "PRO" | "SCALE";
export type Preco = { monthlyCents: number; annualCents: number };
export type PlanoCatalogo = { key: string; monthlyCents: number | null; annualCents: number | null };

/** Nível (Start, Pro ou Scale) a partir da chave do plano da loja (COMMERCE_START…). */
export function nivelDoPlano(productKey: string | null | undefined): Nivel | null {
  if (!productKey) return null;
  const k = productKey.replace(/^COMMERCE_/, "");
  return k === "START" || k === "PRO" || k === "SCALE" ? k : null;
}

/** Preço do Sites em cada nível: Start da tabela do Master; Pro e Scale iguais aos planos da loja (decisão do dono). */
export function precosDoSites(book: Pick<PriceBook, "frentes">, planos: PlanoCatalogo[]): { START: Preco; PRO: Preco | null; SCALE: Preco | null } {
  const plano = (n: Nivel) => planos.find((p) => p.key === `COMMERCE_${n}`);
  const doPlano = (n: Nivel) => { const p = plano(n); return p?.monthlyCents ? { monthlyCents: p.monthlyCents, annualCents: p.annualCents ?? p.monthlyCents * 12 } : null; };
  // Anual do Start segue a mesma proporção do Start da loja (hoje 9 mensalidades); sem o plano, 9 mensalidades.
  const start = plano("START");
  const proporcao = start?.monthlyCents && start.annualCents ? start.annualCents / start.monthlyCents : 9;
  const s = book.frentes.sitesStartCents;
  return { START: { monthlyCents: s, annualCents: Math.round(s * proporcao) }, PRO: doPlano("PRO"), SCALE: doPlano("SCALE") };
}

/** Valor com o desconto do segundo produto (50% hoje), arredondado para o centavo. */
export const comDesconto = (cents: number, bps: number) => Math.round((cents * (10_000 - Math.min(10_000, Math.max(0, bps)))) / 10_000);

/**
 * Site para quem já tem a loja: o Sites do mesmo nível do plano da loja, com o desconto do segundo produto.
 * Sem plano conhecido (teste, sem assinatura), vale o nível Start.
 */
export function precoDoSiteParaLojista(book: Pick<PriceBook, "frentes">, planos: PlanoCatalogo[], productKey: string | null | undefined) {
  const nivel = nivelDoPlano(productKey) ?? "START";
  const todos = precosDoSites(book, planos); const sites = todos[nivel] ?? todos.START;
  return { nivel, cheio: sites, monthlyCents: comDesconto(sites.monthlyCents, book.frentes.segundoProdutoBps), annualCents: comDesconto(sites.annualCents, book.frentes.segundoProdutoBps) };
}

/** Níveis de referência do NextLevel Business (venda por proposta até o primeiro pagante; D336). */
export function niveisDoBusiness(book: Pick<PriceBook, "frentes">) {
  const b = book.frentes.business;
  return [
    { chave: "ESSENCIAL" as const, nome: "Essencial", monthlyCents: b.essencialCents, pessoas: b.essencialPessoas, para: "Para começar a organizar a equipe e os clientes" },
    { chave: "PROFISSIONAL" as const, nome: "Profissional", monthlyCents: b.profissionalCents, pessoas: b.profissionalPessoas, para: "Para equipes de venda e atendimento" },
    { chave: "AVANCADO" as const, nome: "Avançado", monthlyCents: b.avancadoCents, pessoas: b.avancadoPessoas, para: "Para empresas com várias equipes" },
  ];
}

/** O plano Scale (de loja ou de site) traz o NextLevel Business Essencial incluso (decisão do dono, 17/11). */
export const scaleTrazBusiness = (productKey: string | null | undefined) => nivelDoPlano(productKey) === "SCALE";
