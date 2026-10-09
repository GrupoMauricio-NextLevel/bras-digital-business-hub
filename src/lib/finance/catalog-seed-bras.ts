import type { CatalogContent } from "@/db/schema";
import type { SeedPrice, SeedProduct } from "./catalog-seed";

/**
 * Brás v2 e NextLevel Cargas (D108): preços aceitos pelo dono em 2026-10-09 (membro Prata R$ 97, Ouro R$ 197,
 * Platinum R$ 397; comissão por carga e publicidade sugeridas). TODOS nascem em RASCUNHO: nada é cobrado nem
 * aparece para o cliente até o dono publicar no Financeiro Master. O plano grátis de cada lado é a ausência de plano.
 * Prazos, sinal, cubagem e comissão por carga ficam nas regras (`src/lib/domain/bras/regras.ts`), não aqui.
 */
const MENSAL = { methods: ["PIX", "CARD"] as ("PIX" | "CARD")[], pixDiscountBps: 0, cardMaxInstallments: 1, cardMarkupBps: 0 };
const UNICO = { methods: ["PIX", "CARD"] as ("PIX" | "CARD")[], pixDiscountBps: 0, cardMaxInstallments: 3, cardMarkupBps: 0 };
const mensal = (cents: number): SeedPrice[] => [{ cycle: "MONTHLY", amountCents: cents, ...MENSAL }];
const SEM_GANHO = "Planos vendem informação, ferramenta e atendimento. Nenhum plano garante venda, margem ou lucro.";
const CANCELA = "Cancele quando quiser, sem multa: o acesso segue até o fim do mês pago. Comprar caixas é sempre grátis, em qualquer plano.";

const membro = (key: string, slug: string, name: string, cents: number, sortOrder: number, scope: string[], forWho: string[], extra: Partial<CatalogContent> = {}): SeedProduct => ({
  key, slug, name, family: "BRAS_MEMBER_PLAN", kind: "subscription", phase: "AQUISICAO", audience: ["BRAS_MEMBER"], status: "DRAFT", ref: "D108",
  tagline: `Plano ${name.replace("Brás ", "")} da Brás Digital`, summary: `Assinatura mensal do membro da Brás Digital: ${scope[0]!.toLowerCase()}.`,
  content: {
    forWho, notFor: ["Quem procura promessa de lucro ou produto garantido"],
    problem: "Comprar no Brás sem dado é apostar: produto que já saturou, caixa que encalha, viagem que não se paga.",
    outcome: "Escolher o produto com tendência, concorrência e preço praticado na mão, e comprar a caixa sem sair de onde está.",
    scope, deliverables: ["Acesso no Meu Brás durante o mês pago", "Suporte nos canais do plano"],
    limits: [SEM_GANHO, "Disponibilidade de caixas, contêiner e alto mar depende das importadoras parceiras"],
    faq: [{ q: "Preciso de plano para comprar?", a: "Não. Comprar caixas é grátis. O plano libera a inteligência e o atendimento." }, { q: "Posso trocar de plano?", a: "Sim, a qualquer momento; vale a partir da confirmação do pagamento." }],
    policy: CANCELA, ...extra,
  },
  grantsKey: `BRAS_PLAN_${key.replace("BRAS_", "")}`, commissionHoldDays: 14, sortOrder,
  meta: { brands: ["BRAS_DIGITAL"], plan: key.replace("BRAS_", "") },
  prices: mensal(cents),
});

const importadora = (key: string, slug: string, name: string, cents: number, sortOrder: number, scope: string[]): SeedProduct => ({
  key, slug, name, family: "BRAS_IMPORTER_PLAN", kind: "subscription", phase: "ESCALA", audience: ["IMPORTER"], status: "DRAFT", ref: "D108",
  tagline: `${name}: mais canais de venda para a sua importadora`, summary: "Assinatura mensal da importadora parceira da Brás Digital.",
  content: {
    forWho: ["Importadoras do Brás que querem vender caixa fechada para lojistas do Brasil inteiro"], notFor: ["Quem não tem estoque próprio ou não emite nota"],
    problem: "O lojista do interior não vem ao Brás toda semana, e o estoque parado custa caro.",
    outcome: "Pedidos de caixa fechada chegando de membros com CNPJ, sem prospectar e sem cuidar do atendimento pós-venda.",
    scope, deliverables: ["Painel da importadora com equipe", "Relatórios do plano"],
    limits: ["Comissão da Brás por venda continua valendo (combinada na ficha da importadora)", "Sem garantia de volume de pedidos"],
    faq: [{ q: "Preciso de plano para vender?", a: "Não. O plano grátis já tem painel, estoque manual ou por planilha, pedidos e o Balcão." }],
    policy: CANCELA.replace("Comprar caixas é sempre grátis, em qualquer plano.", ""),
  },
  grantsKey: `IMPORTER_${key.replace("BRAS_IMPORTADORA_", "")}`, commissionHoldDays: 14, sortOrder, meta: { brands: ["BRAS_DIGITAL"] }, prices: mensal(cents),
});

const transportadora = (key: string, slug: string, name: string, cents: number, sortOrder: number, scope: string[]): SeedProduct => ({
  key, slug, name, family: "CARRIER_PLAN", kind: "subscription", phase: "ESCALA", audience: ["CARRIER"], status: "DRAFT", ref: "D108",
  tagline: `${name}: mais cargas na sua rota`, summary: "Assinatura mensal da transportadora na NextLevel Cargas.",
  content: {
    forWho: ["Transportadoras e autônomos que coletam no Brás"], notFor: ["Quem não tem RNTRC ou seguro de carga quando a rota exigir"],
    problem: "Caminhão voltando vazio e coleta picada em vários endereços do Brás.",
    outcome: "Coletas da sua rota aparecendo no painel, consolidadas por região, com o código de retirada de cada pedido.",
    scope, deliverables: ["Painel da transportadora", "Link do motorista sem aplicativo"],
    limits: ["Comissão por carga sobre o frete (percentual do plano, nas regras do Master)", "Sem garantia de volume de cargas", "CT-e e MDF-e continuam no seu sistema"],
    faq: [{ q: "Tem plano grátis?", a: "Sim: perfil, coletas do mês até o limite do plano grátis, link do motorista e comissão padrão." }],
    policy: "Cancele quando quiser, sem multa: o acesso segue até o fim do mês pago.",
  },
  grantsKey: `CARRIER_${key.replace("CARGAS_", "")}`, commissionHoldDays: 14, sortOrder, meta: { brands: ["NEXTLEVEL_CARGAS"] }, prices: mensal(cents),
});

export const BRAS_SEED_PRODUCTS: SeedProduct[] = [
  membro("BRAS_PRATA", "bras-prata", "Brás Prata", 9_700, 200,
    ["Análise completa de todas as descobertas (tendência, concorrência, preço praticado, riscos e como anunciar)", "Ranking completo das tendências da semana", "Calculadora de economia avançada", "Alertas de reposição", "Chat e WhatsApp com a equipe"],
    ["Quem já vende e quer escolher produto com dado", "Quem compra caixa todo mês e quer acertar mais"]),
  membro("BRAS_OURO", "bras-ouro", "Brás Ouro", 19_700, 201,
    ["Tudo do Prata", "Participar de contêiner dividido (cotas)", "Cotação de contêiner fechado de itens do catálogo", "\"1 produto, 3 jeitos de vender\"", "Agenda pessoal na importadora (visitas por mês nas regras)"],
    ["Quem compra em volume e quer preço de contêiner sem fechar um sozinho"]),
  membro("BRAS_PLATINUM", "bras-platinum", "Brás Platinum", 39_700, 202,
    ["Tudo do Ouro", "Pré-compra de produtos em alto mar, com sinal e previsão de chegada (exclusivo)", "Prioridade nas cotas de contêiner", "Mais visitas na agenda pessoal", "Atendimento prioritário"],
    ["Quem quer o produto antes de chegar ao Brás", "Distribuidores e redes que planejam a compra por estação"]),

  importadora("BRAS_IMPORTADORA_PRO", "importadora-pro", "Importadora Pro", 29_700, 210, ["Integração com o Bling", "Vários galpões e pontos de retirada", "Pré-pedido de produtos em alto mar", "Contêiner fechado e dividido", "Demanda detalhada por região e tipo de cliente"]),
  importadora("BRAS_IMPORTADORA_PREMIUM", "importadora-premium", "Importadora Premium", 69_700, 211, ["Tudo do Pro", "Destaque na vitrine da Brás (rotulado)", "Conteúdo gravado no seu showroom todo mês", "Prioridade nas cotações fora do catálogo", "Relatórios de mercado"]),

  transportadora("CARGAS_PRO", "cargas-pro", "Cargas Pro", 14_700, 220, ["Coletas ilimitadas", "Ver as cargas antes do plano grátis (minutos nas regras)", "Consolidação e ocupação do caminhão", "Relatórios", "Comissão por carga menor"]),
  transportadora("CARGAS_PREMIUM", "cargas-premium", "Cargas Premium", 39_700, 221, ["Tudo do Pro", "Selo \"Recomendada\" (critério explicado ao usuário)", "Prioridade nas indicações da sua rota", "Integração por API com webhook", "Gerente de conta"]),

  {
    key: "BRAS_COTACAO_FORA_CATALOGO", slug: "bras-cotacao-fora-do-catalogo", name: "Cotação de contêiner fora do catálogo", family: "BRAS_SERVICE", kind: "one_time", phase: "ESCALA", audience: ["BRAS_MEMBER"], status: "DRAFT", ref: "D108",
    tagline: "Até 4 itens que não estão na vitrine, cotados com as importadoras parceiras", summary: "Serviço da NextLevel: a Brás leva os itens às importadoras parceiras e devolve a proposta no prazo das regras.",
    content: {
      forWho: ["Quem quer importar um produto que ainda não está no catálogo da Brás"], notFor: ["Quem procura um item avulso ou amostra"],
      problem: "Cotar sozinho com fornecedor de fora leva meses e não traz comparação.",
      outcome: "Uma proposta de contêiner com preço, prazo e condições, para decidir com número na mão.",
      scope: ["Até o número de itens das regras (padrão 4)", "Distribuição às importadoras parceiras", "Proposta consolidada no Meu Brás"], deliverables: ["Proposta de contêiner ou justificativa de não cotação"],
      limits: ["A proposta não obriga a compra", "Prazo de resposta nas regras do Master (padrão 15 dias)"],
      faq: [{ q: "E se passar do prazo?", a: "A taxa é devolvida no percentual das regras (padrão 100%)." }],
      policy: "Taxa paga à NextLevel pelo serviço de cotação; devolução conforme as regras se o prazo vencer sem proposta.",
    },
    grantsKey: null, commissionHoldDays: 30, sortOrder: 230, meta: { brands: ["BRAS_DIGITAL"] }, prices: [{ cycle: "ONE_TIME", amountCents: 150_000, ...UNICO }],
  },
  {
    key: "BRAS_CONTEUDO_PATROCINADO", slug: "bras-conteudo-patrocinado", name: "Gravação patrocinada no showroom", family: "BRAS_SERVICE", kind: "one_time", phase: "AQUISICAO", audience: ["IMPORTER"], status: "DRAFT", ref: "D108",
    tagline: "A equipe da Brás grava os achados da sua importadora", summary: "Dia de gravação no showroom com Shorts, tour e caixa aberta, publicados na Brás com o rótulo de patrocinado.",
    content: {
      forWho: ["Importadoras que querem mostrar o estoque para lojistas do Brasil"], notFor: ["Quem quer controlar o veredito da análise (a análise é independente)"],
      problem: "Lojista de fora não conhece o showroom e não confia em foto de catálogo.",
      outcome: "Vídeos do seu estoque circulando para membros com CNPJ, sempre com o rótulo \"Patrocinado\".",
      scope: ["1 dia de gravação", "Shorts de descoberta, tour do showroom e caixa aberta", "Publicação na Brás e nas redes da Brás"], deliverables: ["Vídeos publicados com rótulo de patrocinado"],
      limits: ["A análise e o veredito continuam independentes", "Sem garantia de pedidos"],
      faq: [{ q: "Posso aprovar o vídeo?", a: "Você confere dados do produto (preço, unidades). Opinião e veredito são da Brás." }],
    },
    grantsKey: null, commissionHoldDays: 30, sortOrder: 231, meta: { brands: ["BRAS_DIGITAL"] }, prices: [{ cycle: "ONE_TIME", amountCents: 149_700, ...UNICO }],
  },
  {
    key: "ADS_TRANSPORTADORA_DESTAQUE", slug: "ads-transportadora-destaque", name: "Destaque da transportadora por região", family: "ADS", kind: "subscription", phase: "ESCALA", audience: ["CARRIER"], status: "DRAFT", ref: "D108",
    tagline: "Apareça primeiro para importadoras e membros da sua rota", summary: "Destaque pago na lista de transportadoras, sempre rotulado \"Patrocinado\", por região e por mês.",
    content: {
      forWho: ["Transportadoras que querem mais indicações numa rota"], notFor: ["Quem ainda não completou o perfil e o seguro"],
      problem: "Ser só mais uma na lista.", outcome: "Primeiras posições da sua região, com rótulo claro de patrocinado.",
      scope: ["1 região por contratação", "Posição de destaque na tela \"chamar transportadora\" e na escolha do membro"], deliverables: ["Destaque ativo durante o mês pago"],
      limits: ["Sempre rotulado \"Patrocinado\"", "Não muda a nota de reputação"], faq: [{ q: "Garante carga?", a: "Não. Garante visibilidade rotulada na sua região." }],
    },
    grantsKey: null, commissionHoldDays: 14, sortOrder: 240, meta: { brands: ["NEXTLEVEL_CARGAS"], perRegion: true }, prices: mensal(19_700),
  },
  {
    key: "ADS_IMPORTADORA_DESTAQUE", slug: "ads-importadora-destaque", name: "Destaque da importadora na vitrine", family: "ADS", kind: "subscription", phase: "ESCALA", audience: ["IMPORTER"], status: "DRAFT", ref: "D108",
    tagline: "Seus produtos no topo da vitrine da Brás", summary: "Destaque pago na vitrine e nas descobertas, sempre rotulado \"Patrocinado\".",
    content: {
      forWho: ["Importadoras com estoque para girar rápido"], notFor: ["Quem não mantém o estoque atualizado"],
      problem: "Estoque bom parado no galpão.", outcome: "Mais membros vendo os seus produtos primeiro, com rótulo claro.",
      scope: ["Posição de destaque na vitrine e na seção de tendências"], deliverables: ["Destaque ativo durante o mês pago"],
      limits: ["Sempre rotulado \"Patrocinado\"", "O veredito da análise continua independente"], faq: [{ q: "Garante venda?", a: "Não. Garante visibilidade rotulada." }],
    },
    grantsKey: null, commissionHoldDays: 14, sortOrder: 241, meta: { brands: ["BRAS_DIGITAL"] }, prices: mensal(29_700),
  },
];
