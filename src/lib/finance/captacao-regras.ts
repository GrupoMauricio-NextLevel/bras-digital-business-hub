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
// Comparativo com os programas dos concorrentes (D260, refeito na D262). Só regras publicadas nos sites oficiais, com
// data e link. Para ser justo, a conta usa a MESMA mensalidade para todos e nenhum cancelamento. Escolha do dono: a
// Loja Integrada fica fora; a Shopify entra em destaque; a Tray entra com 20% (o teto publicado na página Tray Partners).
// ---------------------------------------------------------------------------------------------------------------------
export const CONSULTA_CONCORRENTES = "06/11/2026";
/** Câmbio oficial (PTAX de venda do Banco Central) usado para converter o valor em dólar da Shopify. */
export const CAMBIO_USD = { centavosPorDolar: 546.21, data: "05/11/2026", fonte: "https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes" };
export const SHOPIFY_BR_USD = 25;
export const SHOPIFY_BR_CENTS = Math.round(SHOPIFY_BR_USD * CAMBIO_USD.centavosPorDolar);

export type ProgramaConcorrente = { id: string; nome: string; regra: string; fonte: string; ressalva?: string; destaque?: boolean };
export const PROGRAMAS_CONCORRENTES: ProgramaConcorrente[] = [
  { id: "shopify", nome: "Shopify", destaque: true, regra: `US$ ${SHOPIFY_BR_USD} por loja do Brasil, uma vez só`, fonte: "https://help.shopify.com/en/affiliates/earnings", ressalva: `Convertido pelo dólar oficial de ${CAMBIO_USD.data} (R$ ${(CAMBIO_USD.centavosPorDolar / 100).toFixed(4).replace(".", ",")}). Os US$ 150 do anúncio valem para EUA, Europa e outros países.` },
  { id: "nuvemshop", nome: "Nuvemshop", regra: "o programa que mais paga no prazo: Especialistas (20% a partir do nível Silver) ou Associados (as 2 primeiras mensalidades, depois nada)", fonte: "https://atendimento.nuvemshop.com.br/pt_BR/comissionamento/comissoes-vigentes-no-programa-de-parceiros-especialistas-da-nuvemshop", ressalva: "No Especialistas, o nível de entrada (Member) não recebe recorrência; a conta usa o melhor caso." },
  { id: "tray", nome: "Tray", regra: "até 20% recorrente, conforme o nível (a conta usa 20% desde o início, o melhor caso)", fonte: "https://tray.com.br/partners", ressalva: "Os critérios de cada nível não têm números publicados." },
  { id: "wbuy", nome: "WBuy", regra: "10% até 49 indicações, 15% de 50 a 99 e 20% a partir de 100", fonte: "https://www.wbuy.com.br/afiliados/", ressalva: "Exige CNPJ e nota fiscal." },
];

/** Ganho de um programa concorrente no mês N (mesmas premissas do nosso simulador). Puro. */
export function ganhoConcorrenteNoMes(id: string, porMes: number, mensalCents: number, mes: number): number {
  const carteira = porMes * mes;
  if (id === "shopify") return porMes * SHOPIFY_BR_CENTS; // valor único por loja nova
  if (id === "nuvem-especialistas" || id === "tray") return Math.round((carteira * mensalCents * 2000) / 10_000);
  if (id === "nuvem-associados") return (mes === 1 ? porMes : porMes * 2) * mensalCents; // a 1ª e a 2ª mensalidade das lojas novas
  if (id === "wbuy") { const bps = carteira >= 100 ? 2000 : carteira >= 50 ? 1500 : 1000; return Math.round((carteira * mensalCents * bps) / 10_000); }
  return 0;
}

const somaAte = (f: (m: number) => number, meses: number) => Array.from({ length: meses }, (_, i) => f(i + 1)).reduce((a, b) => a + b, 0);

/** Primeiro mês em que o nosso acumulado passa o deles (até 10 anos); nulo se já estamos na frente desde o 1º mês. */
function viradaAcumulada(nos: (m: number) => number, eles: (m: number) => number): number | null {
  let a = 0, b = 0, atras = false;
  for (let m = 1; m <= 120; m++) { a += nos(m); b += eles(m); if (a < b) atras = true; else if (atras) return m; }
  return null;
}

/** Total em N meses, ganho do último mês e o mês da virada: nós e cada concorrente (a Nuvemshop pelo programa que mais paga). */
export function comparativoDeParceiros(r: RegraPerfil, porMes: number, mensalCents: number, meses: number) {
  const nosMes = (m: number) => ganhoNoMes(r, porMes, mensalCents, m).cents;
  const nos = { id: "nextlevel", nome: "NextLevel", programa: null as string | null, total: somaAte(nosMes, meses), ultimo: nosMes(meses), virada: null as number | null };
  const outros = PROGRAMAS_CONCORRENTES.map((p) => {
    let id = p.id, programa: string | null = null;
    if (p.id === "nuvemshop") {
      const esp = somaAte((m) => ganhoConcorrenteNoMes("nuvem-especialistas", porMes, mensalCents, m), meses);
      const ass = somaAte((m) => ganhoConcorrenteNoMes("nuvem-associados", porMes, mensalCents, m), meses);
      id = ass > esp ? "nuvem-associados" : "nuvem-especialistas"; programa = ass > esp ? "Associados" : "Especialistas";
    }
    const f = (m: number) => ganhoConcorrenteNoMes(id, porMes, mensalCents, m);
    return { id: p.id, nome: p.nome, programa, total: somaAte(f, meses), ultimo: f(meses), virada: viradaAcumulada(nosMes, f) };
  });
  return [nos, ...outros];
}

/**
 * Barreira de entrada (D262, pedido do dono): o nosso parceiro recebe no CPF, por Pix, sem abrir empresa. Só entra aqui
 * o que o concorrente publica sobre CNPJ e nota fiscal; quem não publica fica de fora.
 */
export const BARREIRA_CNPJ: { nome: string; exige: string; fonte: string }[] = [
  { nome: "WBuy", exige: "Exige CNPJ e nota fiscal para pagar a comissão", fonte: "https://www.wbuy.com.br/afiliados/" },
  { nome: "Nuvemshop Associados", exige: "Recomenda CNPJ ou MEI para emitir a nota da comissão", fonte: "https://atendimento.nuvemshop.com.br/pt_BR/programadeassociados/perguntas-frequentes-sobre-o-programa-de-parceiros-associados" },
];

/**
 * Raio-x dos programas concorrentes (D261, pedido do dono: tom agressivo, expondo o ponto fraco de cada um).
 * Regra fixa: todo "golpe" se apoia num fato publicado no site oficial do concorrente, com link e data. Nada inventado.
 */
export type GolpeConcorrente = { id: string; nome: string; golpe: string; fato: string; resposta: string; fonte: string; destaque?: boolean };
export const RAIO_X_CONCORRENTES: GolpeConcorrente[] = [
  { id: "shopify", nome: "Shopify", destaque: true, golpe: `A mais famosa paga US$ ${SHOPIFY_BR_USD} por loja do Brasil. Uma vez. E acabou.`, fato: `Pela tabela oficial do programa de afiliados, loja indicada no Brasil rende US$ ${SHOPIFY_BR_USD} (cerca de R$ ${Math.round(SHOPIFY_BR_CENTS / 100)}) uma única vez. Os "até US$ 150" do anúncio são para EUA, Europa e outros países.`, resposta: "Aqui: 20% de toda mensalidade, todo mês, enquanto a loja ficar.", fonte: "https://help.shopify.com/en/affiliates/earnings" },
  { id: "nuvemshop", nome: "Nuvemshop", golpe: "Ou 0% de recorrência no começo, ou 2 mensalidades e tchau.", fato: "No programa Especialistas, o nível de entrada (Member) não recebe recorrência: ela só começa no Silver. No Associados, o parceiro recebe as 2 primeiras mensalidades da loja e depois mais nada.", resposta: "Aqui: 20% desde o 1º cliente, até 28%, enquanto o cliente ficar.", fonte: "https://atendimento.nuvemshop.com.br/pt_BR/comissionamento/comissoes-vigentes-no-programa-de-parceiros-especialistas-da-nuvemshop" },
  { id: "wbuy", nome: "WBuy", golpe: "10% para começar, 20% só depois de 100 lojas. E só com CNPJ.", fato: "10% de 1 a 49 indicações, 15% de 50 a 99 e 20% a partir de 100. Para receber, exige CNPJ e nota fiscal.", resposta: "Aqui: 20% no 1º cliente, 28% com 25. Recebe no CPF.", fonte: "https://www.wbuy.com.br/afiliados/" },
  { id: "tray", nome: "Tray", golpe: "Promete \"até 20%\" e esconde a régua.", fato: "Os níveis dependem de MRR, volume de indicações, conversão e NPS, sem nenhum número publicado para cada nível.", resposta: "Aqui: régua pública. 10 clientes = 24%, 25 = 28%.", fonte: "https://tray.com.br/partners" },
];
