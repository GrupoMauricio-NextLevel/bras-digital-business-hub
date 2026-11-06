import type { PartnerTier } from "@/db/schema";
import { NIVEIS, nivelPorClientes, recorrenteDoNivel } from "./niveis-regras";

/** D263: CPF = Programa de Indicações (5 pontos a menos); CNPJ = Programa de Parceiros (criador, vendedor, agência). */
export type Trilha = "cpf" | "cnpj";
export const trilhaDoPerfil = (k: string): Trilha => (k === "indicacao" ? "cpf" : "cnpj");

/**
 * Perfis, escada e simulador da página de parceiros (D252, refeito na D260). Regra única: o perfil só muda o texto
 * para cada público; o ganho é o mesmo para todos (20% / 24% / 28% de toda mensalidade, pelos clientes ativos).
 * Puro: roda no servidor e no navegador.
 */
export const PERFIS = {
  indicacao: { kind: "AFFILIATE", rotulo: "Indico pelo CPF", rota: "/parceiros/indique", titulo: "Indique lojas e ganhe todo mês, só com o seu CPF.", quem: "Qualquer pessoa: quem conhece lojista, vende no Brás, tem amigo com loja ou quer uma renda extra.", chamada: "Quero indicar pelo CPF" },
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
export function ganhoNoMes(r: RegraPerfil, porMes: number, mensalCents: number, mes: number, pessoaFisica = false) {
  const carteira = porMes * mes;
  const tier = nivelPorClientes(carteira);
  const bps = recorrenteDoNivel(r.recorrenteBps, tier, undefined, pessoaFisica);
  return { cents: Math.round((carteira * mensalCents * bps) / 10_000), carteira, tier, recBps: bps };
}

/** Escada de níveis: percentual e ganho por cliente por mês em cada nível. Puro. */
export function escadaDoPerfil(r: RegraPerfil, mensalCents: number, pessoaFisica = false) {
  return NIVEIS.map((n) => { const rec = recorrenteDoNivel(r.recorrenteBps, n.tier, undefined, pessoaFisica); return { tier: n.tier as PartnerTier, nome: n.nome, minimo: n.minimo, efeito: n.efeito, recBps: rec, porClienteCents: Math.round((mensalCents * rec) / 10_000) }; });
}

// ---------------------------------------------------------------------------------------------------------------------
// Comparativo com os concorrentes (D260, D262, refeito na D263). Só regras publicadas nos sites oficiais, com data e
// link. Cada trilha enfrenta o programa equivalente: CPF (indicação) contra os programas de indicação/afiliados deles;
// CNPJ (parceiro profissional) contra os programas de parceiros deles. A métrica é a renda que entra POR MÊS no mês
// escolhido (a renda que se repete), com a MESMA mensalidade para todos e nenhum cancelamento. Loja Integrada fica fora
// (escolha do dono); Tray com 20% (teto publicado).
// ---------------------------------------------------------------------------------------------------------------------
export const CONSULTA_CONCORRENTES = "06/11/2026";
/** Câmbio oficial (PTAX de venda do Banco Central) usado para converter o valor em dólar da Shopify. */
export const CAMBIO_USD = { centavosPorDolar: 546.21, data: "05/11/2026", fonte: "https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes" };
export const SHOPIFY_BR_USD = 25;
export const SHOPIFY_BR_CENTS = Math.round(SHOPIFY_BR_USD * CAMBIO_USD.centavosPorDolar);

const FONTE = {
  shopify: "https://help.shopify.com/en/affiliates/earnings",
  nuvemEsp: "https://atendimento.nuvemshop.com.br/pt_BR/comissionamento/comissoes-vigentes-no-programa-de-parceiros-especialistas-da-nuvemshop",
  nuvemAss: "https://www.nuvemshop.com.br/parceiros/associados",
  nuvemResgate: "https://atendimento.nuvemshop.com.br/pt_BR/comissionamento/como-solicitar-resgate-de-comissao-para-parceiros-comerciais",
  tray: "https://tray.com.br/partners",
  trayCadastro: "https://tray.com.br/quero-ser-parceiro",
  wbuy: "https://www.wbuy.com.br/afiliados/",
  wbuyIndicar: "https://www.wbuy.com.br/indicar/",
};

export type ProgramaConcorrente = { id: string; trilha: Trilha; nome: string; regra: string; barreira: string; fonte: string; destaque?: boolean };
export const PROGRAMAS_CONCORRENTES: ProgramaConcorrente[] = [
  { id: "shopify", trilha: "cpf", destaque: true, nome: "Shopify Afiliados", regra: `US$ ${SHOPIFY_BR_USD} por loja do Brasil, uma vez só`, barreira: "Paga em dólar, uma única vez por loja", fonte: FONTE.shopify },
  { id: "nuvem-associados", trilha: "cpf", nome: "Nuvemshop Associados", regra: "as 2 primeiras mensalidades de cada loja; depois, nada", barreira: "Sem CNPJ, só recebe por RPA, com retenção de INSS, IRRF e ISS", fonte: FONTE.nuvemAss },
  { id: "nuvem-especialistas", trilha: "cnpj", nome: "Nuvemshop Especialistas", regra: "20% a partir do nível Silver; 0% no nível de entrada", barreira: "Exige nota fiscal (NFS-e) para pagar a comissão", fonte: FONTE.nuvemEsp },
  { id: "tray", trilha: "cnpj", nome: "Tray Partners", regra: "até 20%, conforme o nível (a conta usa 20%)", barreira: "O cadastro de parceiro pede CNPJ", fonte: FONTE.tray },
  { id: "wbuy", trilha: "cnpj", nome: "WBuy Parceiros", regra: "10% até 49 indicações, 15% de 50 a 99, 20% a partir de 100", barreira: "Exige CNPJ e nota fiscal em cada saque", fonte: FONTE.wbuy },
];

/** Renda de um programa concorrente no mês N (mesmas premissas do nosso simulador). Puro. */
export function ganhoConcorrenteNoMes(id: string, porMes: number, mensalCents: number, mes: number): number {
  const carteira = porMes * mes;
  if (id === "shopify") return porMes * SHOPIFY_BR_CENTS; // valor único por loja nova
  if (id === "nuvem-especialistas" || id === "tray") return Math.round((carteira * mensalCents * 2000) / 10_000);
  if (id === "nuvem-associados") return (mes === 1 ? porMes : porMes * 2) * mensalCents; // a 1ª e a 2ª mensalidade das lojas novas
  if (id === "wbuy") { const bps = carteira >= 100 ? 2000 : carteira >= 50 ? 1500 : 1000; return Math.round((carteira * mensalCents * bps) / 10_000); }
  return 0;
}

/** Meses que a disputa mostra (o teste garante que, em todos eles, a nossa renda do mês é a maior). */
export const MESES_DA_DISPUTA = [18, 24, 36] as const;

/** Renda por mês no mês N: nós (na trilha) e os programas equivalentes dos concorrentes. */
export function comparativoDeParceiros(r: RegraPerfil, porMes: number, mensalCents: number, mes: number, trilha: Trilha = "cnpj") {
  const nos = ganhoNoMes(r, porMes, mensalCents, mes, trilha === "cpf");
  const outros = PROGRAMAS_CONCORRENTES.filter((p) => p.trilha === trilha).map((p) => ({ id: p.id, nome: p.nome, porMesCents: ganhoConcorrenteNoMes(p.id, porMes, mensalCents, mes) }));
  return [{ id: "nextlevel", nome: "NextLevel", porMesCents: nos.cents }, ...outros];
}

/** As maiores barreiras de entrada de cada concorrente (D263): fatos publicados, com link. */
export const BARREIRAS: { nome: string; barreira: string; fonte: string }[] = [
  { nome: "WBuy", barreira: "Só paga com CNPJ: exige nota fiscal (NFS-e) anexada em cada pedido de saque.", fonte: FONTE.wbuyIndicar },
  { nome: "Nuvemshop", barreira: "Exige nota fiscal (NFS-e) para pagar a comissão. Sem CNPJ, só por RPA, com retenção de INSS, IRRF e ISS sobre o que você ganhou.", fonte: FONTE.nuvemResgate },
  { nome: "Tray", barreira: "O cadastro de parceiro pede o CNPJ do parceiro.", fonte: FONTE.trayCadastro },
  { nome: "Shopify", barreira: `Paga em dólar e uma vez só: US$ ${SHOPIFY_BR_USD} por loja do Brasil.`, fonte: FONTE.shopify },
];

/**
 * Raio-x dos programas concorrentes (D261, pedido do dono: tom agressivo, expondo o ponto fraco de cada um).
 * Regra fixa: todo "golpe" se apoia num fato publicado no site oficial do concorrente, com link e data. Nada inventado.
 */
export type GolpeConcorrente = { id: string; nome: string; golpe: string; fato: string; resposta: string; fonte: string; destaque?: boolean };
export const RAIO_X_CONCORRENTES: GolpeConcorrente[] = [
  { id: "shopify", nome: "Shopify", destaque: true, golpe: `A mais famosa paga US$ ${SHOPIFY_BR_USD} por loja do Brasil. Uma vez. E acabou.`, fato: `Pela tabela oficial do programa de afiliados, loja indicada no Brasil rende US$ ${SHOPIFY_BR_USD} (cerca de R$ ${Math.round(SHOPIFY_BR_CENTS / 100)}) uma única vez, pago em dólar. Os "até US$ 150" do anúncio são para EUA, Europa e outros países.`, resposta: "Aqui: comissão em real, todo mês, enquanto a loja ficar.", fonte: FONTE.shopify },
  { id: "nuvemshop", nome: "Nuvemshop", golpe: "Sem nota fiscal, não paga. Sem CNPJ, desconta imposto.", fato: "Para resgatar a comissão, a Nuvemshop exige nota fiscal (NFS-e). Quem não tem CNPJ só recebe por RPA, com retenção de INSS, IRRF e ISS. E no programa Especialistas, o nível de entrada não recebe recorrência.", resposta: "Aqui: Pix pelo painel, sem anexar nota. CPF ou CNPJ.", fonte: FONTE.nuvemResgate },
  { id: "wbuy", nome: "WBuy", golpe: "Sem CNPJ e nota fiscal, você não recebe um centavo.", fato: "\"O único requisito é ter um CNPJ para emitir a nota fiscal\": cada saque exige anexar a NFS-e. E a comissão começa em 10%, chegando a 20% só depois de 100 indicações.", resposta: "Aqui: recebe no CPF ou no CNPJ, sem nota, desde o 1º cliente.", fonte: FONTE.wbuyIndicar },
  { id: "tray", nome: "Tray", golpe: "Pede CNPJ no cadastro e esconde a régua.", fato: "O formulário de parceiro pede o CNPJ. Os níveis dependem de MRR, volume, conversão e NPS, sem número publicado para cada nível.", resposta: "Aqui: régua pública e cadastro com CPF ou CNPJ.", fonte: FONTE.trayCadastro },
];
