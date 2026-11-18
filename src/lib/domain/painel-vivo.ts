/**
 * Painéis com vida (D331, rodada relâmpago): regras puras dos números do início do lojista.
 * Recebem as séries diárias já calculadas pelo contrato único de venda (`computeStoreAnalytics`), então o número
 * daqui é sempre o mesmo da Análise. Nada de banco aqui; tudo testado em `tests/painel-vivo.test.ts`.
 */
import { formatBRL } from "@/lib/money";

export type Dia = { date: string; cents: number };
export type Periodo = 7 | 30;

const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;

/** Variação em % (uma casa). Nula quando não há base para comparar (não inventa número). */
export function variacao(atual: number, base: number): number | null {
  if (base <= 0) return null;
  return Math.round(((atual - base) / base) * 1000) / 10;
}

/** Dia da semana por extenso de uma data "AAAA-MM-DD". */
export function diaDaSemana(date: string): string {
  return DIAS_SEMANA[new Date(`${date}T12:00:00Z`).getUTCDay()]!;
}

/** "14/11" a partir de "2026-11-14". */
export const diaMes = (date: string) => date.split("-").reverse().slice(0, 2).join("/");

/**
 * Vendas de hoje comparadas com o mesmo dia da semana anterior (comparação justa: segunda não é sábado).
 * `dias` é a série diária até hoje (o último item é hoje).
 */
export function comparaHoje(dias: Dia[]): { hojeCents: number; baseCents: number | null; delta: number | null; rotuloBase: string | null } {
  const hoje = dias.at(-1);
  if (!hoje) return { hojeCents: 0, baseCents: null, delta: null, rotuloBase: null };
  const base = dias.length >= 8 ? dias[dias.length - 8]! : null;
  return {
    hojeCents: hoje.cents,
    baseCents: base ? base.cents : null,
    delta: base ? variacao(hoje.cents, base.cents) : null,
    rotuloBase: base ? `${diaDaSemana(base.date)} passada` : null,
  };
}

/**
 * Série do período escolhido e a do período anterior de mesmo tamanho.
 * `atuais` = últimos N dias (até hoje); `anteriores` = os N dias antes deles. Aceita séries maiores e corta.
 */
export function serieDoPeriodo(atuais: Dia[], anteriores: Dia[], periodo: Periodo) {
  const atual = atuais.slice(-periodo);
  const juntos = [...anteriores, ...atuais];
  const fimAnterior = juntos.length - atual.length;
  const anterior = juntos.slice(Math.max(0, fimAnterior - periodo), fimAnterior);
  const totalAtual = atual.reduce((s, d) => s + d.cents, 0);
  const totalAnterior = anterior.reduce((s, d) => s + d.cents, 0);
  const melhor = atual.reduce<Dia | null>((m, d) => (d.cents > 0 && (!m || d.cents > m.cents) ? d : m), null);
  return { atual, anterior, totalAtual, totalAnterior, delta: anterior.length === periodo ? variacao(totalAtual, totalAnterior) : null, melhor };
}

/** Título do gráfico: a conclusão, não "Gráfico de vendas". */
export function fraseDoPeriodo(s: ReturnType<typeof serieDoPeriodo>, periodo: Periodo): string {
  if (!s.melhor) return periodo === 7 ? "Ainda sem vendas pagas nos últimos 7 dias." : "Ainda sem vendas pagas nos últimos 30 dias.";
  const dia = diaDaSemana(s.melhor.date);
  return `${dia[0]!.toUpperCase()}${dia.slice(1)}, ${diaMes(s.melhor.date)}, foi o seu melhor dia: ${formatBRL(s.melhor.cents)}.`;
}

/** Os últimos N pontos para o mini gráfico do cartão (só quando há alguma venda; senão, nada). */
export function miniSerie(dias: Dia[], n = 14): number[] {
  const ult = dias.slice(-n).map((d) => d.cents);
  return ult.some((v) => v > 0) ? ult : [];
}

/** Conversão só com visitas suficientes (D331: 100 ou mais no período); abaixo disso, nula. */
export function conversaoConfiavel(pedidosPagos: number, visitas: number, minimo = 100): number | null {
  if (visitas < minimo) return null;
  return Math.round((pedidosPagos / visitas) * 1000) / 10;
}

/** Canais reais gravados no pedido, com nome em português. */
export const NOME_CANAL: Record<string, string> = { ONLINE_STORE: "Loja virtual", WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", MANUAL: "Venda manual" };

/** Fatias da rosca: no máximo 4 canais + "Outros", em % inteiro que soma 100. */
export function fatiasDeCanal(porCanal: { channel: string; salesCents: number }[]): { nome: string; cents: number; pct: number }[] {
  const total = porCanal.reduce((s, c) => s + c.salesCents, 0);
  if (total <= 0) return [];
  const ordenados = [...porCanal].filter((c) => c.salesCents > 0).sort((a, b) => b.salesCents - a.salesCents);
  const top = ordenados.slice(0, 4).map((c) => ({ nome: NOME_CANAL[c.channel] ?? c.channel, cents: c.salesCents }));
  const resto = ordenados.slice(4).reduce((s, c) => s + c.salesCents, 0);
  if (resto > 0) top.push({ nome: "Outros", cents: resto });
  const fatias = top.map((f) => ({ ...f, pct: Math.floor((f.cents / total) * 100) }));
  // Ajuste para somar 100 (a sobra vai para a maior fatia).
  fatias[0]!.pct += 100 - fatias.reduce((s, f) => s + f.pct, 0);
  return fatias;
}
