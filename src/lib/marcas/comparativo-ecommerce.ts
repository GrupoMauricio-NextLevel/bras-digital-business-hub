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
  { key: "nuvemshop", nome: "Nuvemshop", fonte: "https://www.nuvemshop.com.br/planos-e-precos", moeda: "BRL", notas: ["Tarifa por venda com outro meio de pagamento: 2%, 2%, 1% e 0,7%. Com o Nuvem Pago a tarifa zera, mas o processamento do pagamento é cobrado."], planos: [
    { nome: "Começo", mensalCents: 0, taxaBps: 200, ...sem },
    { nome: "Essencial", mensalCents: 6_900, anualMesCents: 5_900, taxaBps: 200, ...sem },
    { nome: "Impulso", mensalCents: 16_400, anualMesCents: 13_900, taxaBps: 100, ...sem },
    { nome: "Escala", mensalCents: 44_900, anualMesCents: 38_200, taxaBps: 70, ...sem },
  ] },
  { key: "tray", nome: "Tray", fonte: "https://www.tray.com.br/planos/", moeda: "BRL", notas: ["Limites de produtos e pedidos por plano; teste grátis não informado. Anual com valor por mês divulgado no site."], planos: [
    { nome: "Lançamento", mensalCents: 5_900, anualMesCents: 3_900, taxaBps: 125, produtos: 100, pedidosMes: 100, faturamentoMaxCents: 2_000_000 },
    { nome: "Crescimento", mensalCents: 15_900, anualMesCents: 12_900, taxaBps: 100, produtos: 750, pedidosMes: 500, faturamentoMaxCents: 7_500_000 },
    { nome: "Avançado", mensalCents: 44_900, anualMesCents: 35_900, taxaBps: 75, produtos: 1_500, pedidosMes: 1_000, faturamentoMaxCents: 15_000_000 },
  ] },
  { key: "loja-integrada", nome: "Loja Integrada", fonte: "https://lojaintegrada.com.br/planos/", moeda: "BRL", notas: ["Não divulga o percentual da tarifa com outro meio de pagamento; limites de produtos e visitas por plano."], planos: [
    { nome: "Crescimento", mensalCents: 4_600, taxaBps: null, produtos: 250, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Aceleração", mensalCents: 8_300, taxaBps: null, produtos: 500, pedidosMes: null, faturamentoMaxCents: null },
    { nome: "Expansão", mensalCents: 20_000, taxaBps: null, produtos: null, pedidosMes: null, faturamentoMaxCents: null },
  ] },
  { key: "shopify", nome: "Shopify", fonte: "https://www.shopify.com/br/precos", moeda: "USD", notas: ["Cobrança em dólar (US$ 39, 105 e 399 por mês)."], planos: [
    { nome: "Basic", mensalCents: 3_900, taxaBps: 200, ...sem },
    { nome: "Grow", mensalCents: 10_500, taxaBps: 100, ...sem },
    { nome: "Advanced", mensalCents: 39_900, taxaBps: 60, ...sem },
  ] },
];

/** Plano cabe nesse faturamento? (limite de pedidos pelo ticket médio e faturamento recomendado) */
const cabe = (p: PlanoComparado, fatCents: number) => (p.faturamentoMaxCents === null || fatCents <= p.faturamentoMaxCents) && (p.pedidosMes === null || Math.ceil(fatCents / TICKET_MEDIO_CENTS) <= p.pedidosMes);
export const custoDoPlano = (p: PlanoComparado, fatCents: number) => (p.taxaBps === null ? null : p.mensalCents + Math.round((fatCents * p.taxaBps) / 10_000));

/** O plano mais barato da plataforma para esse faturamento (null quando não dá para comparar: dólar ou tarifa não divulgada). */
export function melhorPlano(pl: Pick<Plataforma, "moeda" | "planos">, fatCents: number): { nome: string; totalCents: number } | null {
  if (pl.moeda !== "BRL") return null;
  let melhor: { nome: string; totalCents: number } | null = null;
  for (const p of pl.planos) { const c = custoDoPlano(p, fatCents); if (c !== null && cabe(p, fatCents) && (!melhor || c < melhor.totalCents)) melhor = { nome: p.nome, totalCents: c }; }
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
 * Degraus (D220): o plano de entrada, o intermediário e o avançado de cada plataforma, lado a lado, no mensal e no anual
 * (valor por mês). É a comparação "mais barato em todos os planos" da home. Só plataformas em reais com preço divulgado.
 */
export const DEGRAUS = ["Entrada", "Intermediário", "Avançado"] as const;
const DEGRAU_DE: Record<string, [string, string, string]> = { nuvemshop: ["Essencial", "Impulso", "Escala"], tray: ["Lançamento", "Crescimento", "Avançado"] };
export function degraus(nl: { nome: string; mensalCents: number; anualMesCents: number }[]) {
  return DEGRAUS.map((d, i) => ({
    degrau: d,
    nextlevel: nl[i] ?? null,
    outras: Object.entries(DEGRAU_DE).map(([k, nomes]) => {
      const c = CONCORRENTES.find((x) => x.key === k)!;
      const p = c.planos.find((x) => x.nome === nomes[i])!;
      return { key: k, nome: c.nome, plano: p.nome, mensalCents: p.mensalCents, anualMesCents: p.anualMesCents ?? null };
    }),
  }));
}
