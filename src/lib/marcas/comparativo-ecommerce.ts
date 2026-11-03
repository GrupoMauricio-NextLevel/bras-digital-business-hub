/**
 * Comparativo da NextLevel E-commerce com outras plataformas (D219). Dados PÚBLICOS dos sites oficiais, com a data da
 * coleta: o que muda lá precisa ser atualizado aqui (e a data também). A NextLevel entra sempre com os preços reais do
 * Master (`commercePlansView`). Regras para ser justo:
 *  - conta só mensalidade + tarifa da plataforma sobre a venda, usando o PRÓPRIO meio de pagamento do lojista (no nosso
 *    caso, o Mercado Pago dele). Taxa de processamento do cartão/Pix fica de fora: existe em todas.
 *  - de cada plataforma vale o plano MAIS BARATO que comporta o faturamento (limite de pedidos e faturamento recomendado).
 *  - plataforma cobrada em dólar ou que não divulga a tarifa fica fora da conta (aparece só na tabela de recursos).
 */
export const COLETADO_EM = "2026-10-29";
export const TICKET_MEDIO_CENTS = 15_000; // R$ 150: para estimar pedidos por mês nos limites de pedidos

export type PlanoComparado = { nome: string; mensalCents: number; /** valor por mês no anual (quando divulgado) */ anualMesCents?: number | null; taxaBps: number | null; produtos: number | null; pedidosMes: number | null; faturamentoMaxCents: number | null };
export type Plataforma = { key: string; nome: string; fonte: string; moeda: "BRL" | "USD"; planos: PlanoComparado[]; notas: string[] };

const sem = { produtos: null, pedidosMes: null, faturamentoMaxCents: null };
export const CONCORRENTES: Plataforma[] = [
  { key: "nuvemshop", nome: "Nuvemshop", fonte: "https://www.nuvemshop.com.br/planos-e-precos", moeda: "BRL", notas: ["Tarifa por venda com outro meio de pagamento (inclusive o Mercado Pago): 2%, 2%, 1% e 0,7%. Zera com o Nuvem Pago, o pagamento da própria plataforma."], planos: [
    { nome: "Começo", mensalCents: 0, taxaBps: 200, ...sem },
    { nome: "Essencial", mensalCents: 6_900, anualMesCents: 5_900, taxaBps: 200, ...sem },
    { nome: "Impulso", mensalCents: 16_400, anualMesCents: 13_900, taxaBps: 100, ...sem },
    { nome: "Escala", mensalCents: 44_900, anualMesCents: 38_200, taxaBps: 70, ...sem },
  ] },
  { key: "loja-integrada", nome: "Loja Integrada", fonte: "https://lojaintegrada.com.br/compare/", moeda: "BRL", notas: ["Valores do site no pagamento trimestral. Tarifa com outro meio de pagamento (inclusive o Mercado Pago): 0,99%, 0,90% e 0,70%; zera com o Pagali, o pagamento da própria plataforma. O plano grátis não aceita outro meio de pagamento."], planos: [
    { nome: "Crescimento", mensalCents: 4_600, taxaBps: 99, produtos: 250, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Aceleração", mensalCents: 8_300, taxaBps: 90, produtos: 500, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Expansão", mensalCents: 20_000, taxaBps: 70, produtos: null, pedidosMes: null, faturamentoMaxCents: null },
  ] },
  { key: "wbuy", nome: "WBuy", fonte: "https://www.wbuy.com.br/planos", moeda: "BRL", notas: ["Comissão com outros gateways (inclusive o Mercado Pago): 1,5%, 1,25%, 1% e 0,7%; zera com o wBuy Pay, o pagamento da própria plataforma. Limite de produtos por plano."], planos: [
    { nome: "Iniciante", mensalCents: 5_900, anualMesCents: 4_720, taxaBps: 150, produtos: 200, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Turbo", mensalCents: 14_900, anualMesCents: 11_920, taxaBps: 125, produtos: 500, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Expansão", mensalCents: 29_900, anualMesCents: 23_920, taxaBps: 100, produtos: 1_000, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Elite", mensalCents: 49_900, anualMesCents: 39_920, taxaBps: 70, produtos: 5_000, pedidosMes: null, faturamentoMaxCents: null },
  ] },
  { key: "tray", nome: "Tray", fonte: "https://www.tray.com.br/planos/", moeda: "BRL", notas: ["Tarifa com outros gateways (inclusive o Mercado Pago): 1,25%, 1% e 0,75%. Limites de produtos e pedidos por plano."], planos: [
    { nome: "Lançamento", mensalCents: 5_900, anualMesCents: 3_900, taxaBps: 125, produtos: 100, pedidosMes: 100, faturamentoMaxCents: 2_000_000 },
    { nome: "Crescimento", mensalCents: 15_900, anualMesCents: 12_900, taxaBps: 100, produtos: 750, pedidosMes: 500, faturamentoMaxCents: 7_500_000 },
    { nome: "Avançado", mensalCents: 44_900, anualMesCents: 35_900, taxaBps: 75, produtos: 1_500, pedidosMes: 1_000, faturamentoMaxCents: 15_000_000 },
  ] },
  { key: "shopify", nome: "Shopify", fonte: "https://www.shopify.com/br/precos", moeda: "USD", notas: ["Cobrança em dólar (US$ 39, 105 e 399 por mês). Tarifa com gateway de terceiros (inclusive o Mercado Pago): 2%, 1% e 0,6%."], planos: [
    { nome: "Basic", mensalCents: 3_900, anualMesCents: 2_900, taxaBps: 200, ...sem },
    { nome: "Grow", mensalCents: 10_500, anualMesCents: 7_900, taxaBps: 100, ...sem },
    { nome: "Advanced", mensalCents: 39_900, anualMesCents: 29_900, taxaBps: 60, ...sem },
  ] },
];

/**
 * Câmbio para comparar a Shopify (cobra em dólar) em reais (D233). Referência CONSERVADORA, abaixo do dólar comercial
 * recente (R$ 5,15 em 16/09/2026): a conta nunca exagera o custo dela. IOF e spread do cartão ficam de fora.
 * O dono atualiza aqui (valor e data).
 */
export const COTACAO_DOLAR = { reais: 5, data: "2026-11-03" } as const;
/** Valor em centavos de real (converte quem cobra em dólar pela cotação de referência). */
export const emReais = (c: Pick<Plataforma, "moeda">, cents: number) => (c.moeda === "USD" ? Math.round(cents * COTACAO_DOLAR.reais) : cents);

/**
 * Atacado nativo (grade fechada, preço por quantidade, pedido mínimo) em cada concorrente (D231): Nuvemshop e Loja
 * Integrada não têm (confirmado pelo dono em 03/11/2026); WBuy só a partir do Turbo e Tray só no Avançado (sites oficiais).
 */
export const ATACADO_CONCORRENTES: Record<string, { tem: boolean | "parcial"; texto: string }> = {
  nuvemshop: { tem: false, texto: "Não tem" },
  "loja-integrada": { tem: false, texto: "Não tem" },
  wbuy: { tem: "parcial", texto: "Só a partir do Turbo (R$ 149)" },
  tray: { tem: "parcial", texto: "Só no Avançado (R$ 449)" },
  shopify: { tem: "parcial", texto: "Só no plano Plus (em dólar)" },
};

/** Plano cabe nesse faturamento? (limite de pedidos pelo ticket médio e faturamento recomendado) */
const cabe = (p: PlanoComparado, fatCents: number) => (p.faturamentoMaxCents === null || fatCents <= p.faturamentoMaxCents) && (p.pedidosMes === null || Math.ceil(fatCents / TICKET_MEDIO_CENTS) <= p.pedidosMes);
export const custoDoPlano = (p: PlanoComparado, fatCents: number) => (p.taxaBps === null ? null : p.mensalCents + Math.round((fatCents * p.taxaBps) / 10_000));

/** O plano de menor custo da plataforma para esse faturamento (null quando a tarifa não é divulgada). */
export function melhorPlano(pl: Pick<Plataforma, "moeda" | "planos">, fatCents: number): { nome: string; totalCents: number } | null {
  let melhor: { nome: string; totalCents: number } | null = null;
  for (const p of pl.planos) {
    // Em dólar (Shopify): mensalidade convertida por `COTACAO_DOLAR` (D233); a taxa já incide sobre a venda em reais.
    const c = p.taxaBps === null ? null : emReais(pl, p.mensalCents) + Math.round((fatCents * p.taxaBps) / 10_000);
    if (c !== null && cabe(p, fatCents) && (!melhor || c < melhor.totalCents)) melhor = { nome: p.nome, totalCents: c };
  }
  return melhor;
}

/** A NextLevel no mesmo formato, a partir dos planos do Master (mensal + taxa; sem limite de produtos e pedidos). */
export const nextlevelComoPlataforma = (planos: { name: string; monthlyCents: number | null; feeBps: number | null; quote: boolean }[]): Pick<Plataforma, "moeda" | "planos"> => ({
  moeda: "BRL", planos: planos.filter((p) => !p.quote && p.monthlyCents !== null && p.feeBps !== null).map((p) => ({ nome: p.name.replace(/^Commerce\s+/i, ""), mensalCents: p.monthlyCents!, taxaBps: p.feeBps!, ...sem })),
});

/** Linhas de custo total por faixa de faturamento (só plataformas comparáveis). */
export function custosPorFaixa(nl: Pick<Plataforma, "moeda" | "planos">, faixasCents: number[]) {
  return faixasCents.map((f) => ({ faturamentoCents: f, nextlevel: melhorPlano(nl, f), outras: CONCORRENTES.map((c) => ({ key: c.key, nome: c.nome, melhor: melhorPlano(c, f) })).filter((x) => x.melhor) }));
}

/**
 * Degraus (D220): o plano de entrada, o intermediário e o avançado de cada plataforma, lado a lado, com a mensalidade, o anual
 * (valor por mês, quando divulgado) e a tarifa quando o lojista usa o Mercado Pago. O custo total é calculado para quem vende
 * `FAT_REFERENCIA` por mês. Quem cobra em dólar entra convertido por `COTACAO_DOLAR` (D233).
 */
export const DEGRAUS = ["Entrada", "Intermediário", "Avançado"] as const;
export const FAT_REFERENCIA_CENTS = 3_000_000; // R$ 30 mil por mês
const DEGRAU_DE: Record<string, [string, string, string]> = { nuvemshop: ["Essencial", "Impulso", "Escala"], "loja-integrada": ["Crescimento", "Aceleração", "Expansão"], wbuy: ["Iniciante", "Turbo", "Expansão"], tray: ["Lançamento", "Crescimento", "Avançado"], shopify: ["Basic", "Grow", "Advanced"] };
export function degraus(nl: { nome: string; mensalCents: number; anualMesCents: number }[], fatCents = FAT_REFERENCIA_CENTS) {
  return DEGRAUS.map((d, i) => ({
    degrau: d,
    nextlevel: nl[i] ? { ...nl[i], totalCents: nl[i].mensalCents } : null,
    outras: Object.entries(DEGRAU_DE).map(([k, nomes]) => {
      const c = CONCORRENTES.find((x) => x.key === k)!;
      const p = c.planos.find((x) => x.nome === nomes[i])!;
      const mensalCents = emReais(c, p.mensalCents);
      return { key: k, nome: c.nome, plano: p.nome, dolar: c.moeda === "USD", mensalCents, anualMesCents: p.anualMesCents == null ? null : emReais(c, p.anualMesCents), taxaBps: p.taxaBps ?? 0, totalCents: mensalCents + Math.round((fatCents * (p.taxaBps ?? 0)) / 10_000) };
    }),
  }));
}

/** Maior tarifa de cada plataforma quando o lojista usa o Mercado Pago (para a faixa do topo). */
export const taxasNoMercadoPago = () => CONCORRENTES.map((c) => ({ key: c.key, nome: c.nome, maxBps: Math.max(...c.planos.filter((p) => p.mensalCents > 0).map((p) => p.taxaBps ?? 0)) }));

/**
 * Black deles × Black NextLevel (D232): custo do 1º ano no plano de entrada para quem vende `fatMesCents` por mês.
 * A NextLevel entra com o anual da Black (2 meses grátis) e taxa zero da plataforma; cada concorrente com o melhor preço
 * anual que divulga hoje (ou a mensalidade, quando não divulga anual) + a taxa da plataforma usando o Mercado Pago.
 * As Blacks de 2026 dos concorrentes ainda não foram anunciadas; quando saírem, entram aqui com data e fonte.
 */
export function dueloPrimeiroAno(nlAnualBlackCents: number, fatMesCents: number) {
  const outras = Object.entries(DEGRAU_DE).map(([k, nomes]) => {
    const c = CONCORRENTES.find((x) => x.key === k)!;
    const p = c.planos.find((x) => x.nome === nomes[0])!;
    const mensalidadesCents = emReais(c, (p.anualMesCents ?? p.mensalCents) * 12);
    const taxaCents = Math.round((fatMesCents * 12 * (p.taxaBps ?? 0)) / 10_000);
    return { key: k, nome: c.nome, plano: p.nome, mensalidadesCents, taxaCents, totalCents: mensalidadesCents + taxaCents };
  }).sort((a, b) => a.totalCents - b.totalCents);
  const nextlevel = { key: "nextlevel", nome: "NextLevel", plano: "Start anual Black", mensalidadesCents: nlAnualBlackCents, taxaCents: 0, totalCents: nlAnualBlackCents };
  return { nextlevel, outras, vantagemCents: outras[0]!.totalCents - nextlevel.totalCents };
}
