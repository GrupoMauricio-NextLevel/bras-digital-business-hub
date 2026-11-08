/**
 * Engajamento sem dinheiro (BG2, D272): missões da semana, sequência de semanas com venda, selos e ranking.
 * Puro. Nada aqui paga nada: reconhecimento e ritmo; dinheiro só pelas campanhas de bônus (D271).
 */
import { somarDias } from "./caixa-regras";
import type { Publico } from "./bonus-regras";

export type IndicadoresDaSemana = { cliques: number; cadastros: number; vendas: number; vendasPlanoMaior: number; vendasAnuais: number; visitas: number; demonstracoes: number };
export const INDICADORES_ZERADOS: IndicadoresDaSemana = { cliques: 0, cadastros: 0, vendas: 0, vendasPlanoMaior: 0, vendasAnuais: 0, visitas: 0, demonstracoes: 0 };
export type Missao = { id: string; titulo: string; dica: string; meta: number; indicador: keyof IndicadoresDaSemana };

/** Missões por público. A rua conta visitas e demonstrações registradas no painel (BG3, D274). */
export const MISSOES: Record<Publico, Missao[]> = {
  ONLINE: [
    { id: "cliques", titulo: "Leve 10 pessoas ao seu link", dica: "Poste o link no status, num grupo ou no story.", meta: 10, indicador: "cliques" },
    { id: "cadastro", titulo: "Traga 1 cadastro", dica: "Mande a demonstração para um lojista conhecido.", meta: 1, indicador: "cadastros" },
    { id: "venda", titulo: "Feche 1 venda", dica: "Ligue para quem está em teste e ainda não pagou.", meta: 1, indicador: "vendas" },
    { id: "plano-maior", titulo: "Venda um Pro ou Scale", dica: "Mostre o que o Pro libera para quem tem muitos produtos.", meta: 1, indicador: "vendasPlanoMaior" },
  ],
  RUA: [
    { id: "visitas", titulo: "Faça 10 visitas", dica: "Registre cada loja visitada, mesmo quem disse não.", meta: 10, indicador: "visitas" },
    { id: "demonstracoes", titulo: "Mostre a demonstração 5 vezes", dica: "Abra os temas no celular e deixe o lojista mexer.", meta: 5, indicador: "demonstracoes" },
    { id: "vendas", titulo: "Feche 3 vendas", dica: "Volte em quem pediu para pensar.", meta: 3, indicador: "vendas" },
    { id: "plano-maior", titulo: "Venda um Pro ou Scale", dica: "Lojista com mais de 300 produtos já precisa do Pro.", meta: 1, indicador: "vendasPlanoMaior" },
    { id: "anual", titulo: "Feche 1 plano anual", dica: "No anual o cliente economiza e você soma mais pontos.", meta: 1, indicador: "vendasAnuais" },
  ],
};

export function missoesDaSemana(publico: Publico, ind: IndicadoresDaSemana) {
  const lista = MISSOES[publico].map((m) => ({ ...m, atual: ind[m.indicador], feita: ind[m.indicador] >= m.meta }));
  return { lista, feitas: lista.filter((m) => m.feita).length, total: lista.length, completa: lista.every((m) => m.feita) };
}

/**
 * Sequência de semanas seguidas com pelo menos uma venda (chave = segunda-feira AAAA-MM-DD). A semana atual sem venda
 * ainda não quebra a sequência: ela só quebra quando a semana termina vazia.
 */
export function sequenciaDeSemanas(semanasComVenda: Set<string>, semanaAtual: string) {
  let n = 0;
  let s = semanasComVenda.has(semanaAtual) ? semanaAtual : somarDias(semanaAtual, -7);
  while (semanasComVenda.has(s)) { n++; s = somarDias(s, -7); }
  return { atual: n, emRisco: !semanasComVenda.has(semanaAtual) && n > 0 };
}

export function melhorSequencia(semanasComVenda: Set<string>) {
  let melhor = 0;
  for (const s of semanasComVenda) {
    if (semanasComVenda.has(somarDias(s, -7))) continue; // só conta a partir do começo de cada sequência
    let n = 0, x = s;
    while (semanasComVenda.has(x)) { n++; x = somarDias(x, 7); }
    melhor = Math.max(melhor, n);
  }
  return melhor;
}

export type FatosDosSelos = { vendas: number; maiorMesVendas: number; temScale: boolean; temAnual: boolean; nivel: string; clienteMaisAntigoPagamentos: number; melhorSequencia: number; semanasCompletas: number };
export const SELOS: { id: string; nome: string; descricao: string; ganhou: (f: FatosDosSelos) => boolean }[] = [
  { id: "primeira-venda", nome: "Primeira venda", descricao: "Sua 1ª loja paga", ganhou: (f) => f.vendas >= 1 },
  { id: "cinco-no-mes", nome: "5 no mês", descricao: "5 lojas pagas no mesmo mês", ganhou: (f) => f.maiorMesVendas >= 5 },
  { id: "primeiro-scale", nome: "Primeiro Scale", descricao: "Vendeu um plano Scale", ganhou: (f) => f.temScale },
  { id: "anual", nome: "Fechou anual", descricao: "Vendeu um plano anual", ganhou: (f) => f.temAnual },
  { id: "sequencia-4", nome: "4 semanas seguidas", descricao: "Vendeu em 4 semanas seguidas", ganhou: (f) => f.melhorSequencia >= 4 },
  { id: "semana-completa", nome: "Semana completa", descricao: "Cumpriu todas as missões de uma semana", ganhou: (f) => f.semanasCompletas >= 1 },
  { id: "cliente-6-meses", nome: "Cliente fiel", descricao: "Um cliente seu pagou 6 meses", ganhou: (f) => f.clienteMaisAntigoPagamentos >= 6 },
  { id: "prata", nome: "Nível Prata", descricao: "Chegou ao Prata", ganhou: (f) => f.nivel === "PRATA" || f.nivel === "OURO" },
  { id: "ouro", nome: "Nível Ouro", descricao: "Chegou ao Ouro", ganhou: (f) => f.nivel === "OURO" },
];

/** Posição no ranking (pontos em centésimos) e quanto falta para passar quem está logo acima. */
export function posicaoNoRanking(lista: { partnerId: string; nome: string; pontos: number }[], partnerId: string) {
  const ord = [...lista].sort((a, b) => b.pontos - a.pontos);
  const i = ord.findIndex((x) => x.partnerId === partnerId);
  if (i < 0) return { posicao: null, total: ord.length, acima: null };
  const acima = i > 0 ? ord[i - 1]! : null;
  return { posicao: i + 1, total: ord.length, acima: acima ? { nome: acima.nome.split(" ")[0]!, faltaCent: acima.pontos - ord[i]!.pontos + 1 } : null };
}
