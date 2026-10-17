import type { CatalogAudience, CatalogContent, CatalogFamily, CatalogStatus, CatalogKind, JourneyPhase, OfferRules, PartnerKind, PriceCycle } from "@/db/schema";
import { THEME_CATALOG } from "@/lib/themes/catalog";
import { BRAS_SEED_PRODUCTS } from "./catalog-seed-bras";
import { CLUB_SEED_PRODUCTS } from "./catalog-seed-club";

/**
 * Catálogo aprovado pelo dono (D90), versão 1. É só a SEMENTE: depois de gravado no banco, o Master é a fonte da verdade
 * (novas versões de preço, publicação, pausa). Nada aqui é lido em tempo de execução para cobrar.
 * Produtos sem preço definido pelo dono (marketing, consultoria) nascem "sob consulta" com a estrutura pronta.
 */
export type SeedPrice = { cycle: PriceCycle; amountCents: number | null; platformFeeBps?: number; methods?: ("PIX" | "CARD")[]; pixDiscountBps?: number; cardMaxInstallments?: number; cardMarkupBps?: number; annualDiscountBps?: number };
export type SeedProduct = {
  key: string; slug: string; name: string; family: CatalogFamily; kind: CatalogKind; phase: JourneyPhase;
  audience: CatalogAudience[];
  /** Situação ao nascer. Padrão: publicado (tabela D90). Produtos novos sem preço publicado pelo dono nascem DRAFT. */
  status?: CatalogStatus;
  /** Decisão que aprovou a versão 1 do preço (padrão D90). */
  ref?: string;
  tagline: string; summary: string; content: CatalogContent;
  prerequisites?: string[]; lockMode?: "HARD" | "RECOMMENDED"; unlocks?: string[]; deliveryDays?: number | null; grantsKey?: string | null;
  partnerDiscountMaxBps?: number; commissionHoldDays?: number; meta?: Record<string, unknown>; sortOrder: number; prices: SeedPrice[];
};

/** Pagamento único alto: Pix com 10% e cartão em até 10x com preço-base × 1,16. */
const HIGH_TICKET = { methods: ["PIX", "CARD"] as ("PIX" | "CARD")[], pixDiscountBps: 1000, cardMaxInstallments: 10, cardMarkupBps: 1600 };
const MONTHLY_PLAN = { methods: ["PIX", "CARD"] as ("PIX" | "CARD")[], pixDiscountBps: 0, cardMaxInstallments: 1, cardMarkupBps: 0 };

const PLAN_FEATURES = [
  "Loja virtual com tema gratuito, editor visual e domínio próprio",
  "Produtos, variações, estoque e categorias sem limite de cadastro",
  "Checkout com Pix e cartão na sua própria conta Mercado Pago (você recebe 100% das vendas)",
  "Cupons, campanhas, avaliações e avise-me",
  "Equipe com acessos separados",
  "Frete por regras próprias ou plataforma de envio",
];

const plan = (key: string, slug: string, name: string, monthly: number, annual: number, feeBps: number, sortOrder: number, extra: Partial<CatalogContent> = {}): SeedProduct => ({
  key, slug, name, family: "COMMERCE_PLAN", kind: "subscription", phase: "FUNDACAO", audience: ["STORE", "PUBLIC", "PARTNER"],
  tagline: `Plano ${name.replace("Commerce ", "")}: R$ ${(monthly / 100).toLocaleString("pt-BR")}/mês ou R$ ${(annual / 100).toLocaleString("pt-BR")}/ano`,
  summary: `Assinatura da plataforma NextLevel E-commerce com taxa de plataforma de ${(feeBps / 100).toString().replace(".", ",")}% sobre as vendas depois dos 3 primeiros meses.`,
  content: {
    forWho: ["Marcas e lojistas que querem uma loja virtual própria, com a sua identidade", "Quem já vende em rede social ou marketplace e quer um canal próprio"],
    notFor: ["Quem procura revender produtos de um fornecedor sem estoque (para isso existe o SuperDrop)"],
    problem: "Vender só por rede social e marketplace deixa a marca refém de algoritmo e comissão alta.",
    outcome: "Uma loja própria no ar, com checkout, frete e catálogo organizados, recebendo direto na sua conta.",
    scope: PLAN_FEATURES, deliverables: ["Acesso à plataforma durante o ciclo pago", "Suporte pelos canais da NextLevel"],
    timeline: "Acesso liberado na hora, depois da confirmação do pagamento (ou durante os 3 dias de teste).",
    limits: ["A taxa de plataforma incide sobre o valor dos produtos dos pedidos pagos, sem o frete", "Verba de anúncios, domínio e taxas do Mercado Pago são pagos por você diretamente a cada empresa"],
    faq: [
      { q: "Como funciona o teste?", a: "Novos clientes têm 3 dias grátis. Depois, o primeiro mês custa R$ 9,90 e a taxa de plataforma é zero nos 3 primeiros meses. A condição vale uma vez por CPF/CNPJ." },
      { q: "O anual tem desconto?", a: "Sim, 25% em relação a 12 mensalidades, pago de uma vez. Ele não acumula com desconto percentual de parceiro." },
      { q: "Quem recebe o dinheiro das minhas vendas?", a: "Você, 100%, na sua conta Mercado Pago. A NextLevel cobra a assinatura e a taxa de plataforma em fatura separada." },
    ],
    policy: "Cancelamento a qualquer momento: o acesso segue até o fim do ciclo pago. O anual não é reembolsado proporcionalmente após 7 dias da compra.",
    partnerPerk: "No anual, o parceiro pode oferecer um benefício não monetário aprovado pelo Master (onboarding prioritário, crédito de setup, auditoria de conversão ou tema selecionado).",
    ...extra,
  },
  unlocks: ["LOJA_PRONTA_ESSENCIAL", "MIGRACAO_LITE"], grantsKey: `PLAN_${key}`, commissionHoldDays: 14, sortOrder,
  meta: { platformFeeBps: feeBps, features: PLAN_FEATURES, brands: ["NEXTLEVEL_COMMERCE"] },
  prices: [
    { cycle: "MONTHLY", amountCents: monthly, platformFeeBps: feeBps, ...MONTHLY_PLAN },
    { cycle: "ANNUAL", amountCents: annual, platformFeeBps: feeBps, ...MONTHLY_PLAN, annualDiscountBps: 2500 },
  ],
});

const quoteOnly = (): SeedPrice[] => [{ cycle: "QUOTE", amountCents: null, methods: ["PIX", "CARD"] }];

const MKT_BANDS = [
  { label: "Verba mensal até R$ 3 mil", feeCents: null },
  { label: "Verba mensal de R$ 3 mil a R$ 10 mil", feeCents: null },
  { label: "Verba mensal de R$ 10 mil a R$ 30 mil", feeCents: null },
  { label: "Verba mensal acima de R$ 30 mil", feeCents: null },
];
const MEDIA_NOTE = "A verba de anúncios é paga por você direto à plataforma (Meta, Google, Mercado Livre). Ela nunca passa pela NextLevel, não entra na nossa cobrança nem em comissão.";

const marketing = (key: string, slug: string, name: string, tagline: string, summary: string, channel: string, sortOrder: number, prerequisites: string[], lockMode: "HARD" | "RECOMMENDED"): SeedProduct => ({
  key, slug, name, family: "MARKETING", kind: "quote_required", phase: "AQUISICAO", audience: ["STORE", "SUPPLIER", "PUBLIC", "PARTNER"], tagline, summary,
  content: {
    forWho: ["Lojas publicadas que querem tráfego qualificado e previsível"], notFor: ["Loja ainda sem produtos e checkout funcionando: o anúncio desperdiça verba"],
    problem: "Sem gestão profissional, a verba de anúncio some sem retorno medido.", outcome: "Campanhas acompanhadas com metas, relatórios mensais e otimização contínua, sem promessa de resultado.",
    scope: [`Planejamento e gestão de ${channel}`, "Configuração de pixels e eventos de conversão", "Relatório mensal e reunião de acompanhamento", "Revisões de criativos dentro do escopo contratado"],
    deliverables: ["Plano de mídia com verba recomendada", "Campanhas configuradas e acompanhadas", "Relatório mensal"],
    timeline: "Início em até 7 dias úteis depois do aceite da proposta e dos acessos.", limits: [MEDIA_NOTE, "Prazo mínimo de 3 meses", "Fee fixo por faixa de investimento, mais adicional por canal; não é percentual sobre a verba"],
    faq: [{ q: "A verba de anúncios está incluída?", a: MEDIA_NOTE }, { q: "Vocês garantem vendas?", a: "Não. Garantimos método, acompanhamento e transparência nos números." }],
    policy: "Prazo mínimo de 3 meses. Cancelamento com aviso de 30 dias depois do prazo mínimo.",
  },
  prerequisites, lockMode, deliveryDays: 7, partnerDiscountMaxBps: 1000, commissionHoldDays: 30, sortOrder,
  meta: { mediaSpendPaidByClient: true, minTermMonths: 3, bands: MKT_BANDS, perChannelExtraCents: null, channel, meetingsPerMonth: 1, revisionsPerMonth: 2 },
  prices: quoteOnly(),
});

export const SEED_PRODUCTS: SeedProduct[] = [
  plan("COMMERCE_START", "commerce-start", "Commerce Start", 14_900, 134_100, 100, 10),
  plan("COMMERCE_PRO", "commerce-pro", "Commerce Pro", 24_900, 224_100, 70, 11),
  plan("COMMERCE_SCALE", "commerce-scale", "Commerce Scale", 49_900, 449_100, 40, 12),
  {
    key: "COMMERCE_ENTERPRISE", slug: "commerce-enterprise", name: "Commerce Enterprise", family: "COMMERCE_PLAN", kind: "quote_required", phase: "ESCALA", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Operação grande com condições negociadas", summary: "Plano sob consulta: valores, taxa de plataforma e implantação definidos em proposta.",
    content: { forWho: ["Operações com volume alto, vários canais ou necessidades específicas"], notFor: ["Quem está começando: os planos Start, Pro e Scale atendem melhor"], problem: "Operação grande precisa de condição comercial e acompanhamento próprios.", outcome: "Condições negociadas e implantação assistida, com escopo por escrito.", scope: ["Tudo dos planos Commerce", "Taxa de plataforma negociada", "Implantação assistida"], deliverables: ["Proposta com escopo, preço e prazo"], limits: ["Integrações sob medida dependem de avaliação técnica"], faq: [{ q: "Quanto custa?", a: "É sob consulta: peça a proposta e respondemos com valores claros." }] },
    unlocks: [], commissionHoldDays: 30, sortOrder: 13, meta: { brands: ["NEXTLEVEL_COMMERCE"] }, prices: quoteOnly(),
  },
  {
    key: "LOJA_PRONTA_ESSENCIAL", slug: "loja-pronta-essencial", name: "Loja Pronta Essencial", family: "LOJA_PRONTA", kind: "one_time", phase: "FUNDACAO", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Sua loja montada pela equipe NextLevel, pronta para vender", summary: "Montagem completa da loja com tema base, identidade, até 30 produtos, domínio, checkout, frete e treinamento.",
    content: {
      forWho: ["Quem quer começar certo sem gastar semanas configurando"], notFor: ["Quem precisa de mais de 30 produtos cadastrados (veja o Profissional)"],
      problem: "Configurar loja, frete, checkout e catálogo sozinho toma tempo e deixa brechas que derrubam a conversão.", outcome: "Loja publicada com o essencial bem feito e você treinado para operar.",
      scope: ["Tema base com a sua identidade aplicada", "Até 30 produtos cadastrados", "Domínio conectado", "Checkout e frete configurados", "Treinamento de uso", "Uma rodada de ajustes"],
      deliverables: ["Loja publicada", "Checklist de lançamento", "Treinamento gravado ou ao vivo"], timeline: "Até 10 dias úteis depois do envio do material.",
      limits: ["Produtos além de 30 ficam com você ou no plano Profissional", "Fotos e textos dos produtos são enviados por você"],
      faq: [{ q: "Posso parcelar?", a: "Sim: em até 10x no cartão com o total de R$ 2.316,52 (preço-base × 1,16), ou à vista no Pix com 10% de desconto (R$ 1.797,30)." }],
      policy: "Reembolso integral até o início do trabalho. Depois disso, proporcional ao que não foi entregue.",
    },
    prerequisites: ["PLAN_ACTIVE"], lockMode: "RECOMMENDED", unlocks: ["MKT_META_ADS", "MKT_SOCIAL"], deliveryDays: 10, partnerDiscountMaxBps: 1000, commissionHoldDays: 30, sortOrder: 20,
    meta: { maxProducts: 30, adjustmentRounds: 1, brands: ["NEXTLEVEL_COMMERCE"] }, prices: [{ cycle: "ONE_TIME", amountCents: 199_700, ...HIGH_TICKET }],
  },
  {
    key: "LOJA_PRONTA_PROFISSIONAL", slug: "loja-pronta-profissional", name: "Loja Pronta Profissional", family: "LOJA_PRONTA", kind: "one_time", phase: "LANCAMENTO", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Loja completa com personalização avançada, SEO básico e mensuração", summary: "Tudo do Essencial, até 150 produtos, páginas institucionais, pixel e analytics, catálogo otimizado, SEO básico e duas rodadas de ajustes.",
    content: {
      forWho: ["Marcas com catálogo maior que querem lançar com mensuração desde o primeiro dia"], notFor: ["Quem precisa de integrações sob medida (veja o Premium)"],
      problem: "Lançar sem páginas institucionais, pixel e SEO faz perder confiança e dados das primeiras vendas.", outcome: "Loja completa, medida e pronta para receber tráfego pago.",
      scope: ["Tudo do Essencial", "Até 150 produtos", "Personalização avançada do tema", "Páginas institucionais", "Pixel e analytics", "Catálogo otimizado e SEO básico", "Treinamento", "Duas rodadas de ajustes"],
      deliverables: ["Loja publicada e medida", "Checklist de lançamento", "Treinamento"], timeline: "Até 20 dias úteis depois do envio do material.",
      limits: ["Integrações com ERP e sistemas externos ficam fora (Premium)"], faq: [{ q: "Posso parcelar?", a: "Sim: em até 10x no cartão com o total de R$ 5.796,52 (preço-base × 1,16), ou no Pix com 10% de desconto (R$ 4.497,30)." }],
      policy: "Reembolso integral até o início do trabalho. Depois disso, proporcional ao que não foi entregue.",
    },
    prerequisites: ["PLAN_ACTIVE"], lockMode: "RECOMMENDED", unlocks: ["MKT_META_ADS", "MKT_GOOGLE_ADS"], deliveryDays: 20, partnerDiscountMaxBps: 1000, commissionHoldDays: 30, sortOrder: 21,
    meta: { maxProducts: 150, adjustmentRounds: 2, brands: ["NEXTLEVEL_COMMERCE"] }, prices: [{ cycle: "ONE_TIME", amountCents: 499_700, ...HIGH_TICKET }],
  },
  {
    key: "LOJA_PRONTA_PREMIUM", slug: "loja-pronta-premium", name: "Loja Pronta Premium", family: "LOJA_PRONTA", kind: "quote_required", phase: "ESCALA", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Projeto sob medida: design estratégico, integrações e lançamento assistido", summary: "Proposta personalizada com design estratégico, integrações, catálogo maior, SEO e migração, CRO e lançamento assistido.",
    content: { forWho: ["Marcas estabelecidas com operação e catálogo grandes"], notFor: ["Quem está validando o produto"], problem: "Projetos maiores precisam de diagnóstico e escopo próprios.", outcome: "Projeto completo com escopo, prazo e preço definidos em proposta.", scope: ["Design estratégico", "Integrações", "Catálogo grande", "SEO e migração", "CRO", "Lançamento assistido"], deliverables: ["Proposta detalhada"], limits: ["Preço e prazo só depois do diagnóstico"], faq: [{ q: "Quanto custa?", a: "Sob consulta. O diagnóstico é gratuito." }] },
    commissionHoldDays: 30, sortOrder: 22, meta: { brands: ["NEXTLEVEL_COMMERCE"] }, prices: quoteOnly(),
  },
  {
    key: "MIGRACAO_LITE", slug: "migracao-lite", name: "Migração Lite", family: "MIGRACAO", kind: "one_time", phase: "FUNDACAO", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Traga sua loja de outra plataforma, até 100 produtos", summary: "Migração de até 100 produtos, categorias e imagens, com domínio e checklist de lançamento.",
    content: {
      forWho: ["Lojas em Shopify, Nuvemshop, Tray, WooCommerce, Loja Integrada, Yampi ou WBuy"], notFor: ["Catálogos acima de 100 produtos (veja a Pro)"],
      problem: "Trocar de plataforma sem perder catálogo e domínio dá trabalho e assusta.", outcome: "Catálogo migrado, domínio apontado e checklist de lançamento conferido com você.",
      scope: ["Até 100 produtos com variações", "Categorias e imagens", "Domínio", "Checklist de lançamento e aceite de go-live"], deliverables: ["Catálogo migrado", "Checklist assinado no aceite"],
      timeline: "Até 10 dias úteis depois dos acessos.", limits: ["Clientes, pedidos antigos e redirecionamentos 301 ficam na Pro"],
      faq: [{ q: "De quais plataformas?", a: "Shopify, Nuvemshop, Tray, WooCommerce, Loja Integrada, Yampi e WBuy. Outras, sob consulta." }], policy: "Reembolso integral até o início do trabalho.",
    },
    unlocks: ["LOJA_PRONTA_ESSENCIAL"], deliveryDays: 10, partnerDiscountMaxBps: 1000, commissionHoldDays: 30, sortOrder: 30,
    meta: { maxProducts: 100, sources: ["Shopify", "Nuvemshop", "Tray", "WooCommerce", "Loja Integrada", "Yampi", "WBuy"], brands: ["NEXTLEVEL_COMMERCE"] }, prices: [{ cycle: "ONE_TIME", amountCents: 149_700, ...HIGH_TICKET }],
  },
  {
    key: "MIGRACAO_PRO", slug: "migracao-pro", name: "Migração Pro", family: "MIGRACAO", kind: "one_time", phase: "FUNDACAO", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Até 1.000 produtos, clientes, SEO com 301 e homologação", summary: "Migração de até 1.000 produtos, clientes, SEO com redirecionamentos 301, pagamento, frete e homologação.",
    content: {
      forWho: ["Lojas com catálogo e base de clientes que não podem perder posição no Google"], notFor: ["Operações com ERP e integrações críticas (veja a Scale)"],
      problem: "Migrar sem redirecionamentos e sem clientes derruba tráfego orgânico e recompra.", outcome: "Loja migrada com SEO preservado, clientes importados e homologação conferida.",
      scope: ["Até 1.000 produtos", "Clientes", "SEO e redirecionamentos 301", "Pagamento e frete", "Homologação e aceite de go-live"], deliverables: ["Catálogo e clientes migrados", "Mapa de redirecionamentos", "Checklist de homologação"],
      timeline: "Até 20 dias úteis depois dos acessos.", limits: ["Integrações com ERP ficam na Scale"], faq: [{ q: "Posso parcelar?", a: "Sim, em até 10x no cartão (preço-base × 1,16) ou no Pix com 10% de desconto." }], policy: "Reembolso integral até o início do trabalho.",
    },
    deliveryDays: 20, partnerDiscountMaxBps: 1000, commissionHoldDays: 30, sortOrder: 31,
    meta: { maxProducts: 1000, sources: ["Shopify", "Nuvemshop", "Tray", "WooCommerce", "Loja Integrada", "Yampi", "WBuy"], brands: ["NEXTLEVEL_COMMERCE"] }, prices: [{ cycle: "ONE_TIME", amountCents: 399_700, ...HIGH_TICKET }],
  },
  {
    key: "MIGRACAO_SCALE", slug: "migracao-scale", name: "Migração Scale", family: "MIGRACAO", kind: "quote_required", phase: "ESCALA", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: "Catálogo grande, ERP, integrações e operação crítica", summary: "Migração sob consulta para operações grandes com ERP e integrações.",
    content: { forWho: ["Operações críticas com ERP e integrações"], notFor: ["Lojas com até 1.000 produtos"], problem: "Operação crítica não pode parar durante a troca.", outcome: "Plano de migração com janela, responsáveis e homologação.", scope: ["Catálogo grande", "ERP e integrações", "Operação crítica"], deliverables: ["Proposta com plano de migração"], limits: ["Depende de avaliação técnica"], faq: [] },
    commissionHoldDays: 30, sortOrder: 32, meta: { sources: ["Shopify", "Nuvemshop", "Tray", "WooCommerce", "Loja Integrada", "Yampi", "WBuy"], brands: ["NEXTLEVEL_COMMERCE"] }, prices: quoteOnly(),
  },
  marketing("MKT_SOCIAL", "gestao-redes-sociais", "Gestão de redes sociais", "Conteúdo constante e alinhado à sua loja", "Planejamento, produção e publicação de conteúdo para Instagram e outras redes.", "redes sociais", 40, ["STORE_PUBLISHED"], "RECOMMENDED"),
  marketing("MKT_META_ADS", "meta-ads", "Gestão de Meta Ads", "Anúncios no Instagram e Facebook com acompanhamento", "Gestão de campanhas na Meta com fee fixo por faixa de investimento.", "Meta Ads", 41, ["STORE_PUBLISHED"], "HARD"),
  marketing("MKT_GOOGLE_ADS", "google-ads", "Gestão de Google Ads", "Apareça quando o cliente procura", "Gestão de campanhas de pesquisa e Shopping no Google.", "Google Ads", 42, ["STORE_PUBLISHED"], "HARD"),
  marketing("MKT_MELI_ADS", "mercado-livre-ads", "Gestão de Mercado Livre Ads", "Produtos patrocinados no Mercado Livre", "Gestão de anúncios patrocinados para quem já vende no Mercado Livre.", "Mercado Livre Ads", 43, [], "RECOMMENDED"),
  marketing("MKT_COMBO", "conteudo-e-midia", "Conteúdo + mídia", "Pacote de conteúdo e anúncios em um só acompanhamento", "Combinação de gestão de redes sociais com gestão de tráfego pago.", "conteúdo e tráfego pago", 44, ["STORE_PUBLISHED"], "HARD"),
  {
    key: "CONSULTORIA_CRESCIMENTO", slug: "consultoria-crescimento", name: "Consultoria e auditoria de crescimento", family: "CONSULTORIA", kind: "quote_required", phase: "OTIMIZACAO", audience: ["STORE", "SUPPLIER", "PUBLIC", "PARTNER"],
    tagline: "Diagnóstico da operação e plano de melhorias priorizado", summary: "Auditoria de conversão, catálogo, mídia e operação, com plano de ação.",
    content: { forWho: ["Lojas que já vendem e querem saber onde está o gargalo"], notFor: ["Loja sem vendas ainda"], problem: "Sem diagnóstico, cada melhoria é um palpite.", outcome: "Plano de ação priorizado com base nos dados da sua operação.", scope: ["Auditoria de conversão (CRO)", "Catálogo e preço", "Mídia e mensuração", "Operação e pós-venda"], deliverables: ["Relatório com prioridades", "Reunião de apresentação"], limits: ["Não inclui execução (pode virar proposta separada)"], faq: [] },
    prerequisites: ["FIRST_SALE"], lockMode: "RECOMMENDED", deliveryDays: 15, partnerDiscountMaxBps: 1000, commissionHoldDays: 30, sortOrder: 50, meta: {}, prices: quoteOnly(),
  },
  {
    key: "WHITE_LABEL_PARCEIRO", slug: "white-label", name: "White Label NextLevel", family: "WHITE_LABEL", kind: "quote_required", phase: "ESCALA", audience: ["PARTNER", "PUBLIC"],
    tagline: "A plataforma com a sua marca, para revender aos seus clientes", summary: "Implantação com setup de R$ 25.000, proposta, contrato e ativação exclusivos do Master.",
    content: {
      forWho: ["Agências e grupos que querem revender lojas virtuais com marca própria"], notFor: ["Lojistas individuais"],
      problem: "Agências querem oferecer loja virtual com a própria marca sem construir tecnologia.", outcome: "Plataforma com sua marca, subdomínio e regras de revenda definidas em contrato.",
      scope: ["Branding e subdomínio próprios", "Regras de revenda", "Suporte e responsabilidade comercial definidos em contrato"], deliverables: ["Proposta e contrato", "Ativação pelo Master depois dos requisitos"],
      limits: ["Não é compra automática: a ativação só acontece depois de branding, subdomínio, suporte, responsabilidade comercial e regras de revenda configurados"], faq: [{ q: "Quanto custa?", a: "Setup de R$ 25.000, com proposta e contrato. Mensalidade e condições de revenda definidas na proposta." }],
    },
    commissionHoldDays: 30, sortOrder: 60, meta: { setupCents: 2_500_000, requirements: ["Branding", "Subdomínio", "Suporte", "Responsabilidade comercial", "Regras de revenda"] }, prices: quoteOnly(),
  },
  // Temas pagos: compra única (nunca assinatura). Preço da versão 1 = preço aprovado no catálogo de temas.
  ...THEME_CATALOG.filter((t) => t.priceCents > 0 && t.release === "released").map((t, i): SeedProduct => ({
    key: `TEMA_${t.key.toUpperCase()}`, slug: `tema-${t.key}`, name: `Tema ${t.name}`, family: "TEMA", kind: "one_time", phase: "LANCAMENTO", audience: ["STORE", "PUBLIC", "PARTNER"],
    tagline: t.tagline, summary: t.description,
    content: {
      forWho: [t.niche], notFor: ["Quem ainda não tem loja ativa"], problem: "Uma vitrine genérica não transmite o valor da marca.", outcome: "Visual profissional instalado com 1 clique, editável no editor do tema.",
      scope: t.features, deliverables: ["Licença de uso do tema para 1 loja", "Atualizações do tema enquanto a licença existir"], limits: ["Compra única, sem mensalidade", "Suporte de personalização é serviço separado"],
      faq: [{ q: "É assinatura?", a: "Não. O tema é compra única e fica na sua loja." }, { q: "Vou ver como fica antes?", a: "Sim: cada tema tem uma loja de demonstração." }], policy: "Reembolso em até 7 dias se o tema não tiver sido publicado.",
    },
    prerequisites: ["PLAN_ACTIVE"], lockMode: "RECOMMENDED", grantsKey: `THEME_${t.key.toUpperCase()}`, partnerDiscountMaxBps: 1000, commissionHoldDays: 14, sortOrder: 70 + i,
    meta: { themeKey: t.key, level: t.level, family: t.family, license: "1 loja", supportOptional: true, compatibility: "Motor de temas v3" },
    prices: [{ cycle: "ONE_TIME", amountCents: t.priceCents, methods: ["PIX", "CARD"], pixDiscountBps: 1000, cardMaxInstallments: 6, cardMarkupBps: 0 }],
  })),
  ...BRAS_SEED_PRODUCTS,
  ...CLUB_SEED_PRODUCTS,
];

export const ENTRY_OFFER_KEY = "COMMERCE_ENTRADA";
export const SEED_OFFER: { key: string; name: string; rules: OfferRules } = {
  key: ENTRY_OFFER_KEY, name: "Oferta de entrada Commerce",
  rules: { trialDays: 3, firstPeriodCents: 990, feeHolidayMonths: 3, appliesToFamilies: ["COMMERCE_PLAN"], appliesToCycles: ["MONTHLY", "ANNUAL"], oncePer: "TAX_ID" },
};

/**
 * Portas de entrada (D126): nascem **pausadas**. Valores do rascunho da proposta (D125); o Master liga marca por marca
 * depois da aprovação do dono, criando uma versão nova.
 */
const door = (feeBps: number): OfferRules => ({
  trialDays: 14, firstPeriodCents: null, feeHolidayMonths: 0, appliesToFamilies: [], appliesToCycles: ["MONTHLY", "ANNUAL"], oncePer: "TAX_ID",
  mode: "REVERSE_TRIAL", fallbackPlanKey: "COMECO", freeTierFeeBps: feeBps,
  milestoneDays: [{ event: "STORE_PUBLISHED", days: 7 }, { event: "FIRST_SALE", days: 7 }], milestoneCapDays: 30,
  annualPromo: { paidMonths: 8, getMonths: 12 }, cashbackBps: 500,
});
export const SEED_DOOR_OFFERS: { key: string; name: string; rules: OfferRules }[] = [
  { key: "PORTA_COMMERCE", name: "Porta de entrada Commerce", rules: door(250) },
  { key: "PORTA_SUPERDROP", name: "Porta de entrada SuperDrop", rules: door(700) },
];

export type SeedRule = { key: string; family: CatalogFamily; productKey?: string; cycle?: PriceCycle; partnerKind?: PartnerKind; firstBps: number; recurringBps?: number; recurringMonths?: number; holdDays: number; benefit: string };
export const SEED_COMMISSION_RULES: SeedRule[] = [
  { key: "COMMERCE_MENSAL", family: "COMMERCE_PLAN", cycle: "MONTHLY", firstBps: 2500, recurringBps: 1000, recurringMonths: 12, holdDays: 14, benefit: "R$ 9,90 no 1º mês + taxa zero por 3 meses" },
  { key: "COMMERCE_ANUAL", family: "COMMERCE_PLAN", cycle: "ANNUAL", firstBps: 2000, holdDays: 14, benefit: "25% de desconto no anual (sem desconto extra do parceiro)" },
  { key: "TEMA", family: "TEMA", firstBps: 2000, holdDays: 14, benefit: "Até 10% de desconto, não cumulativo" },
  { key: "LOJA_PRONTA", family: "LOJA_PRONTA", firstBps: 1500, holdDays: 30, benefit: "Até 10% no Pix ou bônus de onboarding" },
  { key: "LOJA_PRONTA_PREMIUM", family: "LOJA_PRONTA", productKey: "LOJA_PRONTA_PREMIUM", firstBps: 1000, holdDays: 30, benefit: "Benefício definido em proposta" },
  { key: "MIGRACAO", family: "MIGRACAO", firstBps: 1500, holdDays: 30, benefit: "Diagnóstico de migração gratuito" },
  { key: "MKT_SOCIAL", family: "MARKETING", productKey: "MKT_SOCIAL", firstBps: 1500, recurringBps: 500, recurringMonths: 6, holdDays: 30, benefit: "Diagnóstico social gratuito" },
  { key: "MKT_TRAFEGO", family: "MARKETING", firstBps: 1500, recurringBps: 500, recurringMonths: 6, holdDays: 30, benefit: "Auditoria de mídia gratuita" },
];
