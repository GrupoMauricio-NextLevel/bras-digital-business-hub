import { createHash } from "node:crypto";

/**
 * Modelo "Loja Virtual Pronta Express" (D276). Versão simples aprovada pelo dono em 10/11/2026: 40 produtos com
 * treinamento para o resto, entrega em dias corridos depois do pagamento total e do material, sinal retido como multa,
 * comunicação por e-mail e aceite no painel. Arquivo puro: monta o texto a partir dos dados; nada vem fixo de cliente.
 */
export const MODELO_LOJA_PRONTA = "LOJA_PRONTA_EXPRESS";
export const VERSAO_LOJA_PRONTA = 1;

/** Contratada e recebimento: provisoriamente a NextLevel Marketing (Itaú); vira configuração quando a NextLevel Soluções existir. */
export const CONTRATADA_PADRAO = {
  razao: "NextLevel Marketing Ltda - ME",
  cnpj: "51.392.006/0001-92",
  banco: "Itaú",
  chavePix: "51.392.006/0001-92",
  favorecido: "NextLevel Marketing Ltda",
  representante: "Mauricio Ramos dos Santos Junior",
  emailRepresentante: "agencianextlevelbr@gmail.com",
} as const;

export type DadosLojaPronta = {
  contratada: { razao: string; cnpj: string; banco: string; chavePix: string; favorecido: string; representante: string; cpfRepresentante?: string; emailRepresentante: string };
  cliente: { nome: string; documento: string; email: string };
  loja: { nome: string; slug: string };
  valorCheioCents: number;
  valorCents: number;
  sinalCents: number;
  dataSinal: string;
  restanteCents: number;
  dataRestante: string;
  produtos: number;
  prazoDias: number;
  cortesiaMeses: number;
};

export type Secao = { titulo: string; resumo?: string; paragrafos?: string[]; itens?: string[] };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\s/g, " ");
const data = (iso: string) => { const [a, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${a}`; };
const POR_EXTENSO_DIAS: Record<number, string> = { 1: "um", 2: "dois", 3: "três", 4: "quatro", 5: "cinco", 6: "seis", 7: "sete", 10: "dez", 15: "quinze", 30: "trinta" };
const dias = (n: number) => `${n}${POR_EXTENSO_DIAS[n] ? ` (${POR_EXTENSO_DIAS[n]})` : ""} ${n === 1 ? "dia corrido" : "dias corridos"}`;

/** Confere a conta e as datas; devolve a lista de problemas (vazia = ok). */
export function conferirDados(d: DadosLojaPronta): string[] {
  const p: string[] = [];
  if (d.sinalCents + d.restanteCents !== d.valorCents) p.push("O sinal mais o restante precisam somar o valor do contrato.");
  if (d.valorCents <= 0 || d.sinalCents <= 0 || d.restanteCents < 0) p.push("Valores precisam ser positivos.");
  if (d.valorCheioCents < d.valorCents) p.push("O valor cheio não pode ser menor que o valor do contrato.");
  if (d.dataRestante.slice(0, 10) < d.dataSinal.slice(0, 10)) p.push("A data do restante não pode ser antes da data do sinal.");
  if (d.produtos < 1 || d.prazoDias < 1) p.push("Produtos e prazo precisam ser pelo menos 1.");
  if (d.cortesiaMeses < 0 || d.cortesiaMeses > 12) p.push("A cortesia vai de 0 a 12 meses.");
  return p;
}

/** Texto do contrato em seções (o resumo e o bloco do Pix são montados na tela a partir dos dados). */
export function montarSecoes(d: DadosLojaPronta): Secao[] {
  const c = d.contratada;
  const cortesia = d.cortesiaMeses > 0;
  const secoes: Secao[] = [
    { titulo: "Como vamos trabalhar juntos?", paragrafos: ["Nosso objetivo é entregar sua loja virtual pronta para operar, com cada responsabilidade bem definida desde o começo."] },
    { titulo: `A ${c.favorecido} cuida de:`, itens: ["Criação e configuração da loja.", `Cadastro inicial de ${d.produtos} produtos.`, "Treinamento para o CONTRATANTE cadastrar os demais produtos.", "Integração dos meios de pagamento e envio.", "Configuração dos aplicativos necessários.", "Testes e preparação para a entrega."] },
    { titulo: "A loja fica responsável por:", itens: ["Contratar o domínio e a plataforma.", "Disponibilizar o acesso ao Mercado Pago.", "Enviar fotos, preços, grades e informações dos produtos.", `Cadastrar os produtos além dos ${d.produtos} incluídos, com o treinamento da NextLevel.`, "Organizar estoque, pedidos, atendimento e expedição.", "Manter os serviços contratados ativos."] },
    { titulo: "Tudo organizado e sem complicação!", paragrafos: ["O nosso trabalho é preparar a tecnologia. O seu é cuidar das vendas e da operação diária da loja."] },
    { titulo: "Cláusula 1 · Objeto", paragrafos: [`Este contrato trata exclusivamente do desenvolvimento da loja virtual ${d.loja.nome}, do CONTRATANTE, dentro da plataforma NextLevel E-commerce, conforme o quadro "Como vamos trabalhar juntos?". As mensalidades da plataforma e o domínio não fazem parte deste contrato e são contratados e pagos à parte pelo CONTRATANTE${cortesia ? ", ressalvada a cortesia da cláusula 2" : ""}.`] },
  ];
  if (cortesia) secoes.push({ titulo: "Cláusula 2 · Cortesia de mensalidade", resumo: `Em resumo: os primeiros ${d.cortesiaMeses} meses de plataforma são por nossa conta.`, paragrafos: [`Excepcionalmente, a CONTRATADA libera ${d.cortesiaMeses} ${d.cortesiaMeses === 1 ? "mês" : "meses"} de uso da plataforma NextLevel E-commerce sem mensalidade, a partir do envio deste contrato. Depois desse período, a mensalidade passa a ser paga pelo CONTRATANTE, no plano que ele escolher.`] });
  const n = (k: number) => `Cláusula ${k + (cortesia ? 1 : 0)}`;
  secoes.push(
    { titulo: `${n(2)} · Produtos`, paragrafos: [`A CONTRATADA faz o cadastro inicial de até ${d.produtos} produtos, com as informações enviadas pelo CONTRATANTE, e ensina o CONTRATANTE a cadastrar os demais produtos na plataforma.`] },
    { titulo: `${n(3)} · Valor e pagamento`, resumo: `Em resumo: ${brl(d.valorCents)} no Pix, sendo ${brl(d.sinalCents)} em ${data(d.dataSinal)} e ${brl(d.restanteCents)} até ${data(d.dataRestante)}.`, paragrafos: [`Pelo serviço, o CONTRATANTE paga o valor promocional de ${brl(d.valorCents)}, em vez de ${brl(d.valorCheioCents)}, por Pix na chave ${c.chavePix} (${c.banco}, favorecido ${c.favorecido}), assim: ${brl(d.sinalCents)} de sinal em ${data(d.dataSinal)} e ${brl(d.restanteCents)} até ${data(d.dataRestante)}.`] },
    { titulo: `${n(4)} · Prazo e entrega`, resumo: `Em resumo: a loja é entregue em até ${d.prazoDias} dias corridos depois de pago o total e de recebido todo o material.`, paragrafos: [`A entrega final da loja acontece em até ${dias(d.prazoDias)}, contados a partir do pagamento total de ${brl(d.valorCents)} e do recebimento de todas as informações, materiais e acessos necessários, o que acontecer por último. A entrega final está condicionada ao pagamento do valor restante.`] },
    { titulo: `${n(5)} · Desistência`, resumo: `Em resumo: se o CONTRATANTE não continuar, o sinal de ${brl(d.sinalCents)} não é devolvido.`, paragrafos: [`Se, por qualquer motivo, o CONTRATANTE não der continuidade a este contrato, o valor do sinal (${brl(d.sinalCents)}) fica com a CONTRATADA como multa, sem devolução.`] },
    { titulo: `${n(6)} · Comunicação`, paragrafos: [`As comunicações sobre este contrato, inclusive o envio de materiais e comprovantes, são feitas pelos e-mails ${c.emailRepresentante} (CONTRATADA) e ${d.cliente.email} (CONTRATANTE).`] },
    { titulo: `${n(7)} · Aceite`, paragrafos: ["O CONTRATANTE aceita este contrato no painel da plataforma, com o próprio login, marcando \"Li e concordo\" e apertando \"Aceitar contrato\". O sistema registra a data, a hora, o endereço de rede, o aparelho e a impressão digital do texto aceito. As partes reconhecem esse aceite como válido, com o mesmo efeito da assinatura."] },
    { titulo: `${n(8)} · Foro`, paragrafos: ["Fica eleito o foro da comarca de São Paulo/SP para resolver qualquer questão sobre este contrato."] },
    { titulo: "Material que o CONTRATANTE envia", itens: ["Logotipo e cores da loja.", `Fotos dos ${d.produtos} produtos.`, "Nome, preço, grade (cores e tamanhos), estoque, peso e medidas de cada produto.", "Acesso ao Mercado Pago da loja.", "Políticas de troca e de frete.", ...(cortesia ? [] : ["Domínio e plano da plataforma contratados."])] },
  );
  return secoes;
}

/** JSON com as chaves em ordem (o banco reordena as chaves do jsonb; a impressão digital não pode depender disso). */
export function jsonEstavel(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(jsonEstavel).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v as object).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${jsonEstavel((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

/** Impressão digital do que foi enviado: dados + texto, em JSON estável. Dá para conferir a qualquer momento. */
export function impressaoDigital(dados: unknown, secoes: unknown): string {
  return createHash("sha256").update(jsonEstavel({ dados, secoes })).digest("hex");
}

export const formatar = { brl, data };
