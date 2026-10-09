/** Classificação do cliente da Brás (D108): níveis, momentos e perguntas do cadastro. Puro: serve o formulário (cliente) e o domínio. */
export const BRAS_LEVELS = ["INICIANTE", "CRESCIMENTO", "PROFISSIONAL", "GRANDE"] as const;
export type BrasClientLevel = (typeof BRAS_LEVELS)[number];
export const BRAS_LEVEL_LABEL: Record<BrasClientLevel, string> = { INICIANTE: "Iniciante", CRESCIMENTO: "Em crescimento", PROFISSIONAL: "Profissional", GRANDE: "Grande conta" };
export const BRAS_LEVEL_HINT: Record<BrasClientLevel, string> = {
  INICIANTE: "Começando ou testando produto. Precisa de segurança e de uma primeira caixa certa.",
  CRESCIMENTO: "Já vende e quer achar produtos melhores com frequência.",
  PROFISSIONAL: "Compra em volume todo mês. Quer preço, prazo e contêiner.",
  GRANDE: "Operação grande. Atenda pessoalmente: contêiner fechado, alto mar e agenda na importadora.",
};
/** Perguntas do cadastro. As opções são fixas (o código depende delas); os PONTOS e os cortes ficam no Master. */
export const BRAS_PROFILE_QUESTIONS = [
  { key: "stage", multi: false, label: "Em que momento está o seu negócio?", options: [
    { key: "comecando", label: "Estou começando e quero testar um produto" },
    { key: "vendendo", label: "Já vendo e quero achar produtos melhores" },
    { key: "crescendo", label: "Vendo todo mês e quero crescer com volume" },
    { key: "estruturado", label: "Tenho operação grande e compro em volume" },
  ] },
  { key: "channels", multi: true, label: "Onde você vende hoje?", options: [
    { key: "mercado_livre", label: "Mercado Livre" }, { key: "shopee", label: "Shopee" }, { key: "amazon", label: "Amazon" },
    { key: "loja_online", label: "Loja online própria" }, { key: "loja_fisica", label: "Loja física" },
    { key: "atacado", label: "Atacado ou revenda para lojas" }, { key: "ainda_nao", label: "Ainda não vendo" },
  ] },
  { key: "monthlyPurchase", multi: false, label: "Quanto pretende comprar por mês no Brás?", options: [
    { key: "ate5k", label: "Até R$ 5 mil" }, { key: "5a20k", label: "De R$ 5 mil a R$ 20 mil" }, { key: "20a100k", label: "De R$ 20 mil a R$ 100 mil" },
    { key: "100a500k", label: "De R$ 100 mil a R$ 500 mil" }, { key: "acima500k", label: "Acima de R$ 500 mil" },
  ] },
  { key: "revenue", multi: false, label: "Faturamento mensal da empresa", options: [
    { key: "ate20k", label: "Até R$ 20 mil" }, { key: "20a100k", label: "De R$ 20 mil a R$ 100 mil" }, { key: "100a500k", label: "De R$ 100 mil a R$ 500 mil" },
    { key: "500ka2m", label: "De R$ 500 mil a R$ 2 milhões" }, { key: "acima2m", label: "Acima de R$ 2 milhões" },
  ] },
  { key: "importExperience", multi: false, label: "Qual a sua experiência com importação?", options: [
    { key: "nunca", label: "Nunca comprei de importadora" }, { key: "caixa", label: "Já compro caixa fechada no Brás" },
    { key: "participou", label: "Já participei de importação com outras empresas" }, { key: "container", label: "Importo contêiner (fechado ou dividido)" },
  ] },
  { key: "team", multi: false, label: "Quantas pessoas trabalham no negócio?", options: [
    { key: "so_eu", label: "Só eu" }, { key: "2a5", label: "De 2 a 5" }, { key: "6a20", label: "De 6 a 20" }, { key: "mais20", label: "Mais de 20" },
  ] },
  { key: "goals", multi: true, label: "O que você mais quer agora?", options: [
    { key: "produto", label: "Achar produto que vende" }, { key: "preco", label: "Preço melhor por unidade" },
    { key: "volume", label: "Comprar em volume ou contêiner" }, { key: "alto_mar", label: "Comprar antes de chegar (em alto mar)" },
    { key: "frete", label: "Frete e retirada mais fáceis" }, { key: "aprender", label: "Aprender a comprar e vender melhor" },
  ] },
] as const;
export const BRAS_MOMENTS = ["NOVO", "AGUARDANDO", "PRIMEIRA_COMPRA", "RECORRENTE", "ESFRIANDO"] as const;
export type BrasMoment = (typeof BRAS_MOMENTS)[number];
export const BRAS_MOMENT_LABEL: Record<BrasMoment, string> = { NOVO: "Novo, sem pedido", AGUARDANDO: "Pedido aguardando pagamento", PRIMEIRA_COMPRA: "Primeira compra feita", RECORRENTE: "Compra com frequência", ESFRIANDO: "Esfriando" };

