import type { PartnerTier } from "@/db/schema";
import { NIVEIS, nivelPorClientes, recorrenteDoNivel } from "./niveis-regras";

/**
 * Perfis, escada e simulador da página de parceiros (D252, refeito na D260). Regra única: o perfil só muda o texto
 * para cada público; o ganho é o mesmo para todos (20% / 24% / 28% de toda mensalidade, pelos clientes ativos).
 * Puro: roda no servidor e no navegador.
 */
export const PERFIS = {
  criador: { kind: "AFFILIATE", rotulo: "Sou criador", rota: "/parceiros/criadores", titulo: "Transforme a sua audiência em renda que se repete todo mês.", quem: "Criadores de conteúdo, influenciadores de moda e negócios, professores de e-commerce.", chamada: "Quero ser criador parceiro" },
  vendedor: { kind: "REPRESENTATIVE", rotulo: "Sou vendedor", rota: "/parceiros/vendedores", titulo: "Venda a loja virtual que o Brás está usando, de porta em porta.", quem: "Representantes, vendedores de rua, consultores que já visitam lojistas.", chamada: "Quero ser vendedor parceiro" },
  agencia: { kind: "AGENCY", rotulo: "Sou agência", rota: "/parceiros/agencias", titulo: "Coloque os seus clientes na plataforma e ganhe enquanto eles ficarem.", quem: "Agências de marketing, social media, consultorias e quem cuida de várias marcas.", chamada: "Cadastrar minha agência" },
} as const;
export type PerfilCaptacao = keyof typeof PERFIS;
export const PERFIL_LISTA = Object.keys(PERFIS) as PerfilCaptacao[];

export type RegraPerfil = { primeiraBps: number; recorrenteBps: number; meses: number };

/**
 * Quanto o parceiro ganha no mês N, se trouxer `porMes` lojas todo mês e nenhuma cancelar. Igual ao cálculo real:
 * toda mensalidade paga (inclusive a 1ª) rende o percentual do nível, e o nível sobe na hora da venda.
 */
export function ganhoNoMes(r: RegraPerfil, porMes: number, mensalCents: number, mes: number) {
  const carteira = porMes * mes;
  const tier = nivelPorClientes(carteira);
  const bps = recorrenteDoNivel(r.recorrenteBps, tier);
  return { cents: Math.round((carteira * mensalCents * bps) / 10_000), carteira, tier, recBps: bps };
}

/** Escada de níveis: percentual e ganho por cliente por mês em cada nível. Puro. */
export function escadaDoPerfil(r: RegraPerfil, mensalCents: number) {
  return NIVEIS.map((n) => { const rec = recorrenteDoNivel(r.recorrenteBps, n.tier); return { tier: n.tier as PartnerTier, nome: n.nome, minimo: n.minimo, efeito: n.efeito, recBps: rec, porClienteCents: Math.round((mensalCents * rec) / 10_000) }; });
}

// ---------------------------------------------------------------------------------------------------------------------
// Comparativo com os programas dos concorrentes (D260). Só regras publicadas nos sites oficiais, com data e link.
// Para ser justo, a conta usa a MESMA mensalidade para todos e nenhum cancelamento.
// ---------------------------------------------------------------------------------------------------------------------
export const CONSULTA_CONCORRENTES = "06/11/2026";
export type ProgramaConcorrente = { id: string; nome: string; regra: string; fonte: string; ressalva?: string };
export const PROGRAMAS_CONCORRENTES: ProgramaConcorrente[] = [
  { id: "nuvem-especialistas", nome: "Nuvemshop Especialistas", regra: "20% da mensalidade líquida, a partir do nível Silver", fonte: "https://atendimento.nuvemshop.com.br/pt_BR/comissionamento/comissoes-vigentes-no-programa-de-parceiros-especialistas-da-nuvemshop", ressalva: "No nível de entrada (Member) não há recorrência; a conta usa o melhor caso (20% desde o início)." },
  { id: "nuvem-associados", nome: "Nuvemshop Associados", regra: "O valor das 2 primeiras mensalidades de cada loja; depois, nada", fonte: "https://www.nuvemshop.com.br/parceiros/associados" },
  { id: "wbuy", nome: "WBuy Parceiros", regra: "10% até 49 indicações, 15% de 50 a 99 e 20% a partir de 100", fonte: "https://www.wbuy.com.br/afiliados/", ressalva: "Exige CNPJ e nota fiscal." },
];

/** Ganho de um programa concorrente no mês N (mesmas premissas do nosso simulador). Puro. */
export function ganhoConcorrenteNoMes(id: string, porMes: number, mensalCents: number, mes: number): number {
  const carteira = porMes * mes;
  if (id === "nuvem-especialistas") return Math.round((carteira * mensalCents * 2000) / 10_000);
  if (id === "nuvem-associados") return (mes === 1 ? porMes : porMes * 2) * mensalCents; // a 1ª e a 2ª mensalidade das lojas novas
  if (id === "wbuy") { const bps = carteira >= 100 ? 2000 : carteira >= 50 ? 1500 : 1000; return Math.round((carteira * mensalCents * bps) / 10_000); }
  return 0;
}

/** Total acumulado em N meses e o ganho do último mês: nós e cada concorrente. */
export function comparativoDeParceiros(r: RegraPerfil, porMes: number, mensalCents: number, meses: number) {
  const soma = (f: (m: number) => number) => Array.from({ length: meses }, (_, i) => f(i + 1)).reduce((a, b) => a + b, 0);
  const nos = { id: "nextlevel", nome: "NextLevel", total: soma((m) => ganhoNoMes(r, porMes, mensalCents, m).cents), ultimo: ganhoNoMes(r, porMes, mensalCents, meses).cents };
  const outros = PROGRAMAS_CONCORRENTES.map((p) => ({ id: p.id, nome: p.nome, total: soma((m) => ganhoConcorrenteNoMes(p.id, porMes, mensalCents, m)), ultimo: ganhoConcorrenteNoMes(p.id, porMes, mensalCents, meses) }));
  return [nos, ...outros];
}

/**
 * Raio-x dos programas concorrentes (D261, pedido do dono: tom agressivo, expondo o ponto fraco de cada um).
 * Regra fixa: todo "golpe" se apoia num fato publicado no site oficial do concorrente, com link e data. Nada inventado.
 */
export type GolpeConcorrente = { id: string; nome: string; golpe: string; fato: string; resposta: string; fonte: string };
export const RAIO_X_CONCORRENTES: GolpeConcorrente[] = [
  { id: "nuvem-especialistas", nome: "Nuvemshop Especialistas", golpe: "Começou? 0% de recorrência.", fato: "No nível de entrada (Member) não há comissão recorrente: ela só começa no Silver. Nos planos comuns, 20% é o teto em qualquer nível.", resposta: "Aqui: 20% desde o 1º cliente, até 28%.", fonte: "https://atendimento.nuvemshop.com.br/pt_BR/comissionamento/comissoes-vigentes-no-programa-de-parceiros-especialistas-da-nuvemshop" },
  { id: "nuvem-associados", nome: "Nuvemshop Associados", golpe: "Paga 2 mensalidades e esquece de você.", fato: "O associado recebe o valor das 2 primeiras mensalidades da loja indicada. O cliente fica anos; o parceiro não recebe mais nada.", resposta: "Aqui: você ganha enquanto o cliente ficar.", fonte: "https://www.nuvemshop.com.br/parceiros/associados" },
  { id: "wbuy", nome: "WBuy", golpe: "10% para começar. 20% só depois de 100 lojas.", fato: "10% de 1 a 49 indicações, 15% de 50 a 99 e 20% a partir de 100. Exige CNPJ e nota fiscal.", resposta: "Aqui: 20% no 1º cliente, 28% com 25. Aceita CPF.", fonte: "https://www.wbuy.com.br/afiliados/" },
  { id: "tray", nome: "Tray", golpe: "Promete \"até 20%\" e esconde a régua.", fato: "Os níveis dependem de MRR, volume de indicações, conversão e NPS, sem nenhum número publicado para cada nível.", resposta: "Aqui: régua pública. 10 clientes = 24%, 25 = 28%.", fonte: "https://tray.com.br/partners" },
];
