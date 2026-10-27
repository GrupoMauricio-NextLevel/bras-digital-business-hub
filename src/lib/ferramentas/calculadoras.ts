/**
 * Calculadoras do lojista (W5, D188). Contas puras com os números que a pessoa digita: não prometem ganho nem resultado.
 * Tudo em centavos e em pontos-base (1% = 100) para não errar arredondamento.
 */
const pct = (bps: number) => bps / 10_000;
const arred = (c: number) => Math.round(c);

/**
 * Preço para ter a margem desejada: preço = (custo + fixos por peça) ÷ (1 − taxas − margem).
 * Nulo quando taxas + margem chegam a 100% (não existe preço que feche a conta).
 */
export function precoComMargem(i: { custoCents: number; fixoPorPecaCents?: number; taxasBps: number; margemBps: number }): { precoCents: number; lucroCents: number; taxasCents: number } | null {
  const denom = 1 - pct(i.taxasBps) - pct(i.margemBps);
  if (denom <= 0 || i.custoCents < 0) return null;
  const precoCents = arred((i.custoCents + (i.fixoPorPecaCents ?? 0)) / denom);
  const taxasCents = arred(precoCents * pct(i.taxasBps));
  return { precoCents, taxasCents, lucroCents: precoCents - taxasCents - i.custoCents - (i.fixoPorPecaCents ?? 0) };
}

/** Lucro por peça com um preço dado (taxas sobre o preço). */
export function lucroPorPeca(i: { precoCents: number; custoCents: number; taxasBps: number; fixoPorPecaCents?: number }) {
  const taxasCents = arred(i.precoCents * pct(i.taxasBps));
  const lucroCents = i.precoCents - taxasCents - i.custoCents - (i.fixoPorPecaCents ?? 0);
  return { taxasCents, lucroCents, margemBps: i.precoCents > 0 ? Math.round((lucroCents / i.precoCents) * 10_000) : 0 };
}

/**
 * Promoção: quanto o lucro por peça cai com o desconto e quantas peças a mais é preciso vender para manter o mesmo
 * lucro total. Nulo quando o desconto zera o lucro (nenhuma quantidade compensa).
 */
export function simularPromocao(i: { precoCents: number; custoCents: number; taxasBps: number; descontoBps: number; vendasHoje: number }) {
  const antes = lucroPorPeca(i);
  const novoPreco = arred(i.precoCents * (1 - pct(i.descontoBps)));
  const depois = lucroPorPeca({ ...i, precoCents: novoPreco });
  if (depois.lucroCents <= 0) return { novoPrecoCents: novoPreco, lucroAntesCents: antes.lucroCents, lucroDepoisCents: depois.lucroCents, vendasNecessarias: null };
  return { novoPrecoCents: novoPreco, lucroAntesCents: antes.lucroCents, lucroDepoisCents: depois.lucroCents, vendasNecessarias: Math.ceil((antes.lucroCents * i.vendasHoje) / depois.lucroCents) };
}

/** Parcelado "sem juros" para o cliente: preço para receber o mesmo valor líquido, se a loja paga a taxa das parcelas. */
export function precoParceladoSemJuros(i: { precoCents: number; taxaParcelasBps: number }): number | null {
  const denom = 1 - pct(i.taxaParcelasBps);
  return denom > 0 ? arred(i.precoCents / denom) : null;
}

/**
 * Frete grátis: a partir de qual valor de pedido a margem paga o frete médio sem a loja ficar no prejuízo.
 * valor mínimo = frete médio ÷ margem do pedido. Nulo sem margem.
 */
export function freteGratisAPartirDe(i: { freteMedioCents: number; margemBps: number }): number | null {
  return i.margemBps > 0 ? arred(i.freteMedioCents / pct(i.margemBps)) : null;
}

/** Ponto de equilíbrio: quantas peças por mês pagam os custos fixos do mês. Nulo se a peça não dá lucro. */
export function pontoDeEquilibrio(i: { custosFixosMesCents: number; lucroPorPecaCents: number }): number | null {
  return i.lucroPorPecaCents > 0 ? Math.ceil(i.custosFixosMesCents / i.lucroPorPecaCents) : null;
}

/** Retorno do anúncio (ROAS) e custo por cliente (CAC), com o que a pessoa digitou. */
export function retornoDoAnuncio(i: { gastoCents: number; vendasCents: number; clientesNovos: number }) {
  return { roas: i.gastoCents > 0 ? Math.round((i.vendasCents / i.gastoCents) * 100) / 100 : null, cacCents: i.clientesNovos > 0 ? arred(i.gastoCents / i.clientesNovos) : null };
}

/** Datas do varejo brasileiro e quando começar a preparar (dias antes). Datas móveis calculadas por ano. */
export function calendarioComercial(ano: number): { nome: string; data: string; prepararDias: number }[] {
  const d = (m: number, dia: number) => `${ano}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const nDomingo = (m: number, n: number) => { const x = new Date(Date.UTC(ano, m - 1, 1)); const primeiro = (7 - x.getUTCDay()) % 7 + 1; return d(m, primeiro + (n - 1) * 7); };
  const sextaAposQuartaQuinta = () => { const x = new Date(Date.UTC(ano, 10, 1)); const quinta = ((4 - x.getUTCDay() + 7) % 7) + 1 + 21; return d(11, quinta + 1); };
  return [
    { nome: "Dia do Consumidor", data: d(3, 15), prepararDias: 21 },
    { nome: "Dia das Mães", data: nDomingo(5, 2), prepararDias: 30 },
    { nome: "Dia dos Namorados", data: d(6, 12), prepararDias: 21 },
    { nome: "Dia dos Pais", data: nDomingo(8, 2), prepararDias: 30 },
    { nome: "Dia do Cliente", data: d(9, 15), prepararDias: 14 },
    { nome: "Dia das Crianças", data: d(10, 12), prepararDias: 30 },
    { nome: "Black Friday", data: sextaAposQuartaQuinta(), prepararDias: 45 },
    { nome: "Natal", data: d(12, 25), prepararDias: 45 },
  ];
}
