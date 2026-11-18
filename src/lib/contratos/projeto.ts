import { formatar, impressaoDigital, type Secao } from "./loja-pronta-express";

/**
 * Contratos de PROJETO da agência (D335): serviço com entrega e valor fechado (sinal + restante ou à vista), no lugar
 * da mensalidade. Dois produtos com o nome que o cliente vê (dono, 18/11/2026):
 *   - "Loja Virtual Pronta Express";
 *   - "Migração Nuvemshop → NextLevel" (origem configurável).
 * Arquivo puro e testado: os dados entram, o texto sai. Mesmo jeito de escrever do modelo do Master (D276): quadros
 * "Como vamos trabalhar juntos?", cláusulas com "Em resumo:" e aceite eletrônico. O que já foi pago fica escrito.
 */
export { MEIOS_PAGAMENTO, PLATAFORMAS_ORIGEM, PRODUTOS_PROJETO, PRODUTOS_PROJETO_LISTA, type MeioPagamento, type ProdutoProjeto } from "./projeto-constantes";
import { MEIOS_PAGAMENTO, PRODUTOS_PROJETO, type MeioPagamento, type ProdutoProjeto } from "./projeto-constantes";
export const VERSAO_PROJETO = 1;

export type ParcelaProjeto = { ordem: number; descricao: string; valorCents: number; vencimento: string; pagoEm: string | null; meio: MeioPagamento | null };
export type CortesiaProjeto = { titulo: string; valorReferenciaCents: number | null };

export type DadosContratoProjeto = {
  produto: ProdutoProjeto;
  contratada: { nome: string; razao: string; documento: string; cidadeForo: string; representante: string; email: string; pix: { chave: string; banco: string; favorecido: string } | null };
  cliente: { nome: string; documento: string; email: string; contato: string | null };
  /** Nome da loja virtual do cliente, quando houver. */
  loja: string | null;
  /** Só na migração: de onde vem a loja. */
  origem: string | null;
  valorCheioCents: number | null;
  valorCents: number;
  parcelas: ParcelaProjeto[];
  produtos: number;
  banners: number;
  prazoDias: number;
  cortesias: CortesiaProjeto[];
  extras: string | null;
};

const brl = formatar.brl;
const data = formatar.data;
const POR_EXTENSO: Record<number, string> = { 1: "um", 2: "dois", 3: "três", 4: "quatro", 5: "cinco", 6: "seis", 7: "sete", 8: "oito", 10: "dez", 15: "quinze", 20: "vinte", 30: "trinta" };
const dias = (n: number) => `${n}${POR_EXTENSO[n] ? ` (${POR_EXTENSO[n]})` : ""} ${n === 1 ? "dia corrido" : "dias corridos"}`;
const nomeDoProduto = (d: Pick<DadosContratoProjeto, "produto" | "origem">) => d.produto === "MIGRACAO_PLATAFORMA" ? `Migração ${d.origem || "Nuvemshop"} → NextLevel` : PRODUTOS_PROJETO[d.produto].nome;
export const tituloDoProjeto = (d: Pick<DadosContratoProjeto, "produto" | "origem">, cliente: string) => `${nomeDoProduto(d)} · ${cliente}`;

/** Total pago e o que falta, pelas parcelas. */
export function situacaoDoPagamento(parcelas: Pick<ParcelaProjeto, "valorCents" | "pagoEm">[]) {
  const pagoCents = parcelas.filter((p) => p.pagoEm).reduce((s, p) => s + p.valorCents, 0);
  const totalCents = parcelas.reduce((s, p) => s + p.valorCents, 0);
  return { pagoCents, totalCents, faltaCents: totalCents - pagoCents, quitado: totalCents > 0 && pagoCents === totalCents };
}

/** Uma linha por parcela: "R$ 250,00 de sinal, pago em 13/11/2026 (Pix)". */
export function textoDaParcela(p: ParcelaProjeto, unica: boolean): string {
  const rotulo = unica ? "à vista" : p.descricao.toLowerCase();
  return p.pagoEm
    ? `${brl(p.valorCents)} ${unica ? "à vista" : `de ${rotulo}`}, pago em ${data(p.pagoEm)}${p.meio ? ` (${MEIOS_PAGAMENTO[p.meio]})` : ""}`
    : `${brl(p.valorCents)} ${unica ? "à vista" : `de ${rotulo}`}, com vencimento em ${data(p.vencimento)}`;
}

/** Confere a conta e as datas; devolve a lista de problemas (vazia = ok). */
export function conferirProjeto(d: DadosContratoProjeto): string[] {
  const p: string[] = [];
  if (d.valorCents <= 0) p.push("Informe o valor do serviço.");
  if (!d.parcelas.length) p.push("Informe como o cliente paga (à vista ou sinal e restante).");
  if (d.parcelas.some((x) => x.valorCents <= 0)) p.push("Cada parcela precisa ter valor.");
  if (d.parcelas.reduce((s, x) => s + x.valorCents, 0) !== d.valorCents) p.push("As parcelas precisam somar o valor do serviço.");
  if (d.parcelas.some((x) => !/^\d{4}-\d{2}-\d{2}$/.test(x.vencimento))) p.push("Cada parcela precisa de data.");
  if (d.valorCheioCents !== null && d.valorCheioCents < d.valorCents) p.push("O valor cheio não pode ser menor que o valor do serviço.");
  if (d.produtos < 1 || d.prazoDias < 1) p.push("Produtos e prazo precisam ser pelo menos 1.");
  if (d.produto === "MIGRACAO_PLATAFORMA" && !d.origem) p.push("Diga de qual plataforma vem a loja.");
  return p;
}

/** O que falta para poder ENVIAR (a prévia sai mesmo assim). */
export function pendenciasDoProjeto(d: DadosContratoProjeto): string[] {
  const p: string[] = [];
  if (!d.contratada.razao) p.push("Razão social da agência (Equipe, em Dados da agência)");
  if (!d.contratada.documento) p.push("CNPJ ou CPF da agência (Equipe, em Dados da agência)");
  if (!d.contratada.cidadeForo) p.push("Cidade do foro (Equipe, em Dados da agência)");
  if (!d.cliente.documento) p.push("CPF ou CNPJ do cliente (Editar dados do cliente)");
  if (!d.cliente.email) p.push("E-mail do cliente (é por ele que o cliente entra no portal para aceitar)");
  return [...p, ...conferirProjeto(d)];
}

function comoPaga(d: DadosContratoProjeto): string {
  const unica = d.parcelas.length === 1;
  const linhas = d.parcelas.map((p) => textoDaParcela(p, unica));
  const onde = d.contratada.pix ? ` por Pix na chave ${d.contratada.pix.chave} (${d.contratada.pix.banco}, favorecido ${d.contratada.pix.favorecido})` : " pelo link de pagamento enviado pela CONTRATADA ou outro meio combinado por escrito";
  return `Pelo serviço, o CONTRATANTE paga ${d.valorCheioCents && d.valorCheioCents > d.valorCents ? `o valor promocional de ${brl(d.valorCents)}, em vez de ${brl(d.valorCheioCents)}` : brl(d.valorCents)}${onde}, assim: ${linhas.join("; ")}.`;
}

function resumoDoPagamento(d: DadosContratoProjeto): string {
  const s = situacaoDoPagamento(d.parcelas);
  if (s.quitado) return `Em resumo: ${brl(d.valorCents)}, já pagos integralmente.`;
  if (s.pagoCents > 0) return `Em resumo: ${brl(d.valorCents)}; ${brl(s.pagoCents)} já pagos e ${brl(s.faltaCents)} a pagar.`;
  return `Em resumo: ${brl(d.valorCents)}${d.parcelas.length === 1 ? " à vista" : `, em ${d.parcelas.length} parcelas`}.`;
}

/** Texto do contrato em seções. */
export function secoesDoProjeto(d: DadosContratoProjeto): Secao[] {
  const c = d.contratada;
  const migracao = d.produto === "MIGRACAO_PLATAFORMA";
  const origem = d.origem || "Nuvemshop";
  const loja = d.loja ? `a loja virtual ${d.loja}` : "a loja virtual";
  const s: Secao[] = [
    { titulo: "Como vamos trabalhar juntos?", paragrafos: [migracao
      ? `Nosso objetivo é levar ${loja} do CONTRATANTE da ${origem} para a plataforma NextLevel Commerce, pronta para vender, com cada responsabilidade bem definida desde o começo.`
      : "Nosso objetivo é entregar sua loja virtual pronta para operar, com cada responsabilidade bem definida desde o começo."] },
    { titulo: `A ${c.nome} cuida de:`, itens: migracao ? [
      `Levar da ${origem} os produtos (até ${d.produtos}), com fotos, descrições, preços, variações e categorias.`,
      `Montar até ${d.banners} banners para a loja nova.`,
      "Configurar o tema, os meios de pagamento e as formas de envio.",
      "Criar os redirecionamentos dos endereços antigos, quando a plataforma de origem permitir, para não perder visitas.",
      "Ensinar o CONTRATANTE a usar o painel e a cadastrar os próximos produtos.",
      "Testar a loja e combinar a data de virada do domínio.",
    ] : [
      "Criação e configuração da loja.",
      `Cadastro inicial de ${d.produtos} produtos.`,
      `Criação de até ${d.banners} banners.`,
      "Treinamento para o CONTRATANTE cadastrar os demais produtos.",
      "Integração dos meios de pagamento e envio.",
      "Configuração dos aplicativos necessários.",
      "Testes e preparação para a entrega.",
    ] },
    { titulo: "A loja fica responsável por:", itens: migracao ? [
      `Dar acesso à conta da ${origem} ou enviar a exportação dos produtos.`,
      "Disponibilizar o acesso ao Mercado Pago e ao domínio.",
      "Conferir a loja nova antes da virada.",
      "Manter a plataforma e os serviços contratados ativos.",
      "Organizar estoque, pedidos, atendimento e expedição.",
    ] : [
      "Contratar o domínio e a plataforma.",
      "Disponibilizar o acesso ao Mercado Pago.",
      "Enviar fotos, preços, grades e informações dos produtos.",
      `Cadastrar os produtos além dos ${d.produtos} incluídos, com o treinamento da ${c.nome}.`,
      "Organizar estoque, pedidos, atendimento e expedição.",
      "Manter os serviços contratados ativos.",
    ] },
    { titulo: "Tudo organizado e sem complicação!", paragrafos: ["O nosso trabalho é preparar a tecnologia. O seu é cuidar das vendas e da operação diária da loja."] },
  ];
  let n = 0;
  const cl = (t: string) => `Cláusula ${++n} · ${t}`;
  s.push({ titulo: cl("Objeto"), paragrafos: [migracao
    ? `Este contrato trata exclusivamente da migração de ${loja} do CONTRATANTE da plataforma ${origem} para a plataforma NextLevel Commerce, conforme o quadro "Como vamos trabalhar juntos?". As mensalidades da plataforma, o domínio e os aplicativos pagos não fazem parte deste contrato e são contratados à parte pelo CONTRATANTE.`
    : `Este contrato trata exclusivamente do desenvolvimento de ${loja} do CONTRATANTE, dentro da plataforma NextLevel Commerce, conforme o quadro "Como vamos trabalhar juntos?". As mensalidades da plataforma e o domínio não fazem parte deste contrato e são contratados e pagos à parte pelo CONTRATANTE.`] });
  s.push({ titulo: cl("Produtos e banners"), paragrafos: [migracao
    ? `A CONTRATADA migra até ${d.produtos} produtos e cria até ${d.banners} banners. O que a plataforma de origem não deixar exportar (por exemplo, senhas de clientes ou histórico de pedidos) não faz parte da migração.`
    : `A CONTRATADA faz o cadastro inicial de até ${d.produtos} produtos, com as informações enviadas pelo CONTRATANTE, cria até ${d.banners} banners e ensina o CONTRATANTE a cadastrar os demais produtos na plataforma.`] });
  if (d.cortesias.length) s.push({ titulo: cl("Cortesias"), resumo: "Em resumo: sem custo para o CONTRATANTE.", itens: d.cortesias.map((k) => `${k.titulo}${k.valorReferenciaCents ? ` (valor de referência ${brl(k.valorReferenciaCents)})` : ""}, sem custo.`) });
  s.push({ titulo: cl("Valor e pagamento"), resumo: resumoDoPagamento(d), paragrafos: [comoPaga(d)] });
  s.push({ titulo: cl("Prazo e entrega"), resumo: `Em resumo: entrega em até ${d.prazoDias} dias corridos depois de pago o total e de recebido todo o material.`, paragrafos: [`A entrega acontece em até ${dias(d.prazoDias)}, contados a partir do pagamento total de ${brl(d.valorCents)} e do recebimento de todas as informações, materiais e acessos necessários, o que acontecer por último. A entrega final está condicionada ao pagamento total.`] });
  const sinal = d.parcelas.length > 1 ? d.parcelas[0]! : null;
  s.push({ titulo: cl("Desistência"), resumo: sinal ? `Em resumo: se o CONTRATANTE não continuar, o sinal de ${brl(sinal.valorCents)} não é devolvido.` : "Em resumo: depois de iniciado o trabalho, o valor pago não é devolvido.", paragrafos: [sinal
    ? `Se, por qualquer motivo, o CONTRATANTE não der continuidade a este contrato, o valor do sinal (${brl(sinal.valorCents)}) fica com a CONTRATADA como multa, sem devolução.`
    : "Se o CONTRATANTE desistir depois de iniciado o trabalho, o valor pago remunera o que já foi feito e não é devolvido. Antes do início, a devolução é combinada por escrito."] });
  s.push({ titulo: cl("Dados e acessos"), paragrafos: ["As duas partes tratam dados pessoais conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). Senhas e acessos recebidos são usados só para este trabalho e apagados ao fim dele."] });
  s.push({ titulo: cl("Resultados"), paragrafos: ["A CONTRATADA se compromete com a qualidade e o prazo do trabalho. Visitas, vendas e faturamento dependem de fatores fora do controle dela e não são garantidos."] });
  s.push({ titulo: cl("Comunicação"), paragrafos: [`As comunicações sobre este contrato, inclusive o envio de materiais e comprovantes, são feitas pelos e-mails ${c.email} (CONTRATADA) e ${d.cliente.email || "do CONTRATANTE cadastrado na ficha"} (CONTRATANTE).`] });
  if (d.extras?.trim()) s.push({ titulo: cl("Combinados adicionais"), paragrafos: d.extras.trim().split(/\n+/).map((x) => x.trim()).filter(Boolean) });
  s.push({ titulo: cl("Aceite"), paragrafos: ["O CONTRATANTE aceita este contrato no portal do cliente, entrando com o próprio e-mail e um código, marcando \"Li e concordo\" e apertando \"Aceitar contrato\". O sistema registra a data, a hora, o endereço de rede, o aparelho e a impressão digital do texto aceito. As partes reconhecem esse aceite como válido, com o mesmo efeito da assinatura."] });
  s.push({ titulo: cl("Foro"), paragrafos: [`Fica eleito o foro da comarca de ${c.cidadeForo || "São Paulo/SP"} para resolver qualquer questão sobre este contrato.`] });
  s.push({ titulo: "Material que o CONTRATANTE envia", itens: migracao
    ? [`Acesso à ${origem} (ou a exportação dos produtos).`, "Logotipo e cores, se mudarem.", "Acesso ao Mercado Pago.", "Acesso ao domínio para a virada.", "Políticas de troca e de frete."]
    : ["Logotipo e cores da loja.", `Fotos dos ${d.produtos} produtos.`, "Nome, preço, grade (cores e tamanhos), estoque, peso e medidas de cada produto.", "Acesso ao Mercado Pago da loja.", "Políticas de troca e de frete.", "Domínio e plano da plataforma contratados."] });
  return s;
}

/** Linhas do resumo do PDF. */
export function resumoDoProjetoParaPdf(d: DadosContratoProjeto): [string, string][] {
  const pg = situacaoDoPagamento(d.parcelas);
  return [
    ["Contratada", `${d.contratada.razao} · CNPJ/CPF ${d.contratada.documento} · representada por ${d.contratada.representante} · ${d.contratada.email}`],
    ["Contratante", `${d.cliente.nome} · CPF/CNPJ ${d.cliente.documento} · ${d.cliente.email}`],
    ...(d.loja ? [["Loja", d.loja] as [string, string]] : []),
    ["Serviço", nomeDoProduto(d)],
    ["Incluso", `${d.produtos} produtos e ${d.banners} banners`],
    ...(d.cortesias.length ? [["Cortesias", d.cortesias.map((k) => k.titulo).join("; ")] as [string, string]] : []),
    ["Valor", `${brl(d.valorCents)}${pg.quitado ? " · pago integralmente" : pg.pagoCents ? ` · ${brl(pg.pagoCents)} pagos, ${brl(pg.faltaCents)} a pagar` : ""}`],
    ["Pagamento", d.parcelas.map((p) => textoDaParcela(p, d.parcelas.length === 1)).join(" · ")],
    ["Entrega", `Em até ${d.prazoDias} dias corridos depois do pagamento total e do material`],
  ];
}

export const hashDoProjeto = (d: DadosContratoProjeto, secoes: Secao[]) => impressaoDigital(d, secoes);
