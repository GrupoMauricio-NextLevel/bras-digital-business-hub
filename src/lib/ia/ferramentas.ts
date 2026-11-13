/**
 * Ferramentas do Maurício (D194, `docs/prompts/mauricio-ia-v3-padrao-hostinger.md`). Arquivo puro (servidor e tela).
 * O exemplo de cada uma é gravado aqui: aparece no estado bloqueado sem chamar a IA e sem custo.
 */
export type GrupoIa = "TEXTO" | "ANALISE" | "ACAO";
export type FerramentaIa = { key: string; grupo: GrupoIa; nome: string; frase: string; onde: string; exemplo: { pedido: string; resposta: string } };
export type EstadoIa = "BLOQUEADA" | "EM_BREVE" | "LIBERADA";

export const GRUPOS_IA: Record<GrupoIa, { titulo: string; frase: string }> = {
  TEXTO: { titulo: "Escrever", frase: "Textos prontos para conferir e usar." },
  ANALISE: { titulo: "Analisar", frase: "Perguntas sobre a sua loja, respondidas com os números do sistema." },
  ACAO: { titulo: "Fazer por você", frase: "O Maurício prepara; você confere e confirma." },
};

export const FERRAMENTAS_IA: readonly FerramentaIa[] = [
  { key: "descricao", grupo: "TEXTO", nome: "Descrição do produto", frase: "Escreve a descrição a partir do nome, tecido e detalhes.", onde: "Cadastro do produto",
    exemplo: { pedido: "Vestido midi de viscose, estampa floral, alça regulável.", resposta: "Leve e fresco para o dia a dia: vestido midi em viscose com estampa floral e alças reguláveis que se ajustam ao seu corpo. Combina com tênis ou sandália." } },
  { key: "seo", grupo: "TEXTO", nome: "Título e SEO", frase: "Título para o Google, descrição curta e palavras do produto.", onde: "Cadastro do produto",
    exemplo: { pedido: "Vestido midi floral de viscose", resposta: "Título: Vestido Midi Floral de Viscose com Alça Regulável\nDescrição: Vestido midi floral em viscose, leve e confortável. Compre com Pix ou cartão em até 6x." } },
  { key: "traduzir", grupo: "TEXTO", nome: "Traduzir produto", frase: "Nome e descrição em espanhol, chinês e inglês.", onde: "Cadastro do produto",
    exemplo: { pedido: "Vestido midi floral de viscose", resposta: "Español: Vestido midi floral de viscosa\n中文：碎花粘胶中长连衣裙\nEnglish: Floral viscose midi dress" } },
  { key: "resposta", grupo: "TEXTO", nome: "Resposta ao cliente", frase: "Rascunho de resposta para dúvida, troca ou atraso, com os dados do pedido.", onde: "Pedido",
    exemplo: { pedido: "Cliente pergunta onde está o pedido 1042.", resposta: "Oi, Ana! Seu pedido 1042 saiu ontem pelos Correios (código QB123456789BR) e a previsão de entrega é sexta-feira. Qualquer coisa, estou aqui." } },
  { key: "campanha", grupo: "TEXTO", nome: "Ideias de campanha", frase: "Textos de cupom, campanha e post para as datas do varejo.", onde: "Campanhas e cupons",
    exemplo: { pedido: "Campanha para o Dia dos Pais.", resposta: "Faixa: Presente certo para o pai: 10% OFF com o cupom PAI10 até domingo.\nPost: Ele merece estilo. Escolha o presente e receba em casa." } },
  { key: "pergunte", grupo: "ANALISE", nome: "Pergunte à sua loja", frase: "\"Quanto vendi esta semana?\", \"Qual produto está parado?\"", onde: "Botão do Maurício",
    exemplo: { pedido: "Quanto vendi esta semana?", resposta: "Esta semana: 23 pedidos pagos, R$ 3.480,00 em vendas, 12% a mais que a semana passada. O produto que mais vendeu foi o Vestido Midi Floral (9 unidades)." } },
  { key: "resumo", grupo: "ANALISE", nome: "Resumo da semana", frase: "Toda segunda: vendas, pedidos parados e estoque acabando.", onde: "E-mail e painel",
    exemplo: { pedido: "Resumo de segunda-feira", resposta: "3 pedidos esperando envio há mais de 2 dias, 2 produtos com menos de 3 unidades e 1 cliente sem resposta. Comece pelos pedidos." } },
  { key: "cadastro", grupo: "ACAO", nome: "Cadastro por conversa", frase: "\"Cadastra a camiseta preta P M G a R$ 79,90\": monta o produto para você confirmar.", onde: "Botão do Maurício",
    exemplo: { pedido: "Cadastra a camiseta preta básica, P M G, R$ 79,90, 10 de cada.", resposta: "Preparei o produto: Camiseta Preta Básica · P, M e G · R$ 79,90 · 10 unidades por tamanho. Confirmar o cadastro?" } },
  { key: "precos", grupo: "ACAO", nome: "Preço em massa", frase: "\"Aumenta 10% a coleção inverno\": mostra a prévia de todos antes de confirmar.", onde: "Botão do Maurício e catálogo",
    exemplo: { pedido: "Aumenta 10% a coleção inverno.", resposta: "18 produtos da coleção inverno: de R$ 129,90 para R$ 142,89 (e os demais na mesma proporção). Ver a lista e confirmar?" } },
];

/** Ordem dos planos da Commerce: quem tem um plano tem os de baixo. */
export const ORDEM_PLANOS = ["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE", "COMMERCE_ENTERPRISE"] as const;
export const NOME_PLANO: Record<string, string> = { COMMERCE_START: "Start", COMMERCE_PRO: "Pro", COMMERCE_SCALE: "Scale", COMMERCE_ENTERPRISE: "Enterprise" };
const nivel = (k: string | null | undefined) => (k ? ORDEM_PLANOS.indexOf(k as (typeof ORDEM_PLANOS)[number]) : -1);

/** Estado de uma ferramenta para uma loja: plano abaixo do mínimo = bloqueada; sem chave ou uso real desligado = em breve. */
export function estadoDaFerramenta(f: Pick<FerramentaIa, "grupo">, cfg: { usoReal: boolean; temChave: boolean; planoTexto: string; planoAvancado: string }, loja: { plano: string | null; emTeste: boolean; master?: boolean }): EstadoIa {
  const minimo = f.grupo === "TEXTO" ? cfg.planoTexto : cfg.planoAvancado;
  // No teste grátis vale o plano escolhido (pedido do dono: o avançado aparece bloqueado fora do Scale).
  const pode = loja.master || nivel(loja.plano) >= nivel(minimo);
  if (!pode) return "BLOQUEADA";
  return cfg.usoReal && cfg.temChave ? "LIBERADA" : "EM_BREVE";
}
