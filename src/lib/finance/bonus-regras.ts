/**
 * Bônus gamificado (BG1, D271). Puro: pontos pelo valor pago, faixa atingida, teto de custo por ponto e períodos.
 * Racional e contas de margem: docs/prompts/bonus-gamificado-parceiros-executivos.md.
 */
import { dataSP, limitesDoDia, semanaDe } from "./caixa-regras";

export type Publico = "ONLINE" | "RUA";
export type PeriodoBonus = "SEMANA" | "MES";
export type Faixa = { pontos: number; valorCents: number };

/** Teto do custo por ponto, somando as campanhas ativas do público (em bps de uma mensalidade do Start). */
export const TETO_POR_PONTO_BPS: Record<Publico, number> = { ONLINE: 5_000, RUA: 7_500 };
/** O anual entra adiantado: a mensalidade equivalente vale 20% a mais em pontos. */
export const BONUS_ANUAL_BPS = 12_000;

/**
 * Campanhas padrão (ativas na BG1). Cabem no teto também na Black (Start a R$ 57): online 46% e rua 73% de uma
 * mensalidade; depois da Black (R$ 67), 40% e 62%.
 */
export const CAMPANHAS_PADRAO: { chave: string; nome: string; publico: Publico; periodo: PeriodoBonus; faixas: Faixa[]; orcamentoCents: number }[] = [
  { chave: "ONLINE_SEMANA", nome: "Sprint da semana", publico: "ONLINE", periodo: "SEMANA", faixas: [{ pontos: 2, valorCents: 1_500 }, { pontos: 4, valorCents: 3_400 }], orcamentoCents: 50_000 },
  { chave: "ONLINE_MES", nome: "Produção do mês", publico: "ONLINE", periodo: "MES", faixas: [{ pontos: 3, valorCents: 3_000 }, { pontos: 6, valorCents: 7_500 }, { pontos: 12, valorCents: 19_000 }, { pontos: 25, valorCents: 45_000 }], orcamentoCents: 200_000 },
  { chave: "RUA_SEMANA", nome: "Ritmo da semana", publico: "RUA", periodo: "SEMANA", faixas: [{ pontos: 3, valorCents: 4_000 }, { pontos: 5, valorCents: 8_000 }, { pontos: 8, valorCents: 14_000 }], orcamentoCents: 150_000 },
  { chave: "RUA_MES", nome: "Meta do mês", publico: "RUA", periodo: "MES", faixas: [{ pontos: 10, valorCents: 19_000 }, { pontos: 20, valorCents: 44_000 }, { pontos: 35, valorCents: 85_000 }], orcamentoCents: 500_000 },
];

/**
 * Pontos da 1ª venda de uma loja, em centésimos: (valor-base ÷ meses do ciclo) × (1,2 se anual) ÷ mensalidade do Start.
 * O valor-base é o mesmo da comissão (pago − taxa − imposto), então desconto reduz pontos sozinho.
 */
export function pontosDaVenda(baseCents: number, ciclo: "MONTHLY" | "ANNUAL" | string | null, refCents: number): number {
  if (refCents <= 0 || baseCents <= 0) return 0;
  const anual = ciclo === "ANNUAL";
  const mensal = baseCents / (anual ? 12 : 1);
  return Math.round(((mensal * (anual ? BONUS_ANUAL_BPS : 10_000)) / 10_000 / refCents) * 100);
}

/** Faixa mais alta atingida (pontos em centésimos) e a próxima. */
export function faixaDe(faixas: Faixa[], pontosCent: number) {
  const ord = [...faixas].sort((a, b) => a.pontos - b.pontos);
  const atingida = [...ord].reverse().find((f) => pontosCent >= f.pontos * 100) ?? null;
  const proxima = ord.find((f) => pontosCent < f.pontos * 100) ?? null;
  return { atingida, proxima, faltaCent: proxima ? proxima.pontos * 100 - pontosCent : 0 };
}

/** Maior R$ por ponto entre as faixas (o custo máximo de uma loja Start nesta campanha). */
export const custoMaxPorPonto = (faixas: Faixa[]) => faixas.reduce((m, f) => Math.max(m, f.pontos > 0 ? f.valorCents / f.pontos : 0), 0);

/** Faixas válidas: pontos e valores crescentes, valor por ponto não cai (quem vende mais nunca ganha menos por loja). */
export function validarFaixas(faixas: Faixa[]): string | null {
  if (!faixas.length) return "Coloque pelo menos uma faixa.";
  if (faixas.length > 6) return "No máximo 6 faixas.";
  for (const [i, f] of faixas.entries()) {
    if (!Number.isInteger(f.pontos) || f.pontos < 1 || f.pontos > 500) return "Pontos de 1 a 500.";
    if (!Number.isInteger(f.valorCents) || f.valorCents < 100) return "Valor mínimo de R$ 1 por faixa.";
    const ant = faixas[i - 1];
    if (ant && (f.pontos <= ant.pontos || f.valorCents <= ant.valorCents)) return "As faixas precisam crescer em pontos e em valor.";
  }
  return null;
}

/** Teto da soma das campanhas ativas de um público. Devolve o custo por ponto (centavos) e se cabe. */
export function conferirTeto(publico: Publico, campanhasAtivas: { faixas: Faixa[] }[], refCents: number) {
  const custo = campanhasAtivas.reduce((t, c) => t + custoMaxPorPonto(c.faixas), 0);
  const teto = (refCents * TETO_POR_PONTO_BPS[publico]) / 10_000;
  return { custoPorPontoCents: Math.round(custo), tetoCents: Math.round(teto), cabe: custo <= teto + 0.5, percentual: refCents ? Math.round((custo / refCents) * 100) : 0 };
}

/** Chave e limites do período que contém o instante (semana de segunda a domingo e mês, no fuso de São Paulo). */
export function periodoDe(periodo: PeriodoBonus, agora: Date) {
  const hoje = dataSP(agora);
  if (periodo === "SEMANA") {
    const dias = semanaDe(hoje);
    return { chave: dias[0]!, inicio: limitesDoDia(dias[0]!).inicio, fim: limitesDoDia(dias[6]!).fim, rotulo: `semana de ${dias[0]!.slice(8, 10)}/${dias[0]!.slice(5, 7)}` };
  }
  const [a, m] = hoje.split("-").map(Number) as [number, number];
  const primeiro = `${a}-${String(m).padStart(2, "0")}-01`;
  const proximo = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
  return { chave: primeiro.slice(0, 7), inicio: limitesDoDia(primeiro).inicio, fim: limitesDoDia(proximo).inicio, rotulo: `${String(m).padStart(2, "0")}/${a}` };
}

/** Períodos já encerrados há pelo menos `garantiaDias` (prontos para apurar), dos mais antigos aos mais novos. */
export function periodosParaApurar(periodo: PeriodoBonus, agora: Date, garantiaDias: number, desde: Date, quantos = periodo === "SEMANA" ? 10 : 4) {
  const out: ReturnType<typeof periodoDe>[] = [];
  let ref = new Date(agora.getTime() - garantiaDias * 86_400_000);
  for (let i = 0; i < quantos + 2 && out.length < quantos; i++) {
    const p = periodoDe(periodo, ref);
    if (p.fim.getTime() + garantiaDias * 86_400_000 <= agora.getTime() && p.fim > desde) out.push(p);
    ref = new Date(p.inicio.getTime() - 1);
  }
  return out.reverse();
}

