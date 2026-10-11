import type { SeedProduct } from "./catalog-seed";

/**
 * Club como assinatura do ecossistema (D131, fase P5C): Club+ e Club Total nascem em **RASCUNHO** com os valores da
 * proposta (seção A8: Club+ ~R$ 29,90; Club Total ~R$ 247). Nada é cobrado nem aparece para o cliente até o dono
 * aprovar por escrito e publicar no Financeiro Master. O Club grátis é a ausência de assinatura.
 * Multiplicador de pontos e desconto em planos ficam nas regras do Club (`club.rules.tiers`), não aqui.
 */
const PRECO = { methods: ["PIX", "CARD"] as ("PIX" | "CARD")[], pixDiscountBps: 0, cardMaxInstallments: 1, cardMarkupBps: 0 };
const SEM_GANHO = "Pontos valem desconto em serviços do grupo; não são dinheiro, não se sacam e vencem. Nenhuma assinatura garante venda ou lucro.";

const club = (key: string, slug: string, name: string, monthly: number, sortOrder: number, scope: string[], tier: "PLUS" | "TOTAL"): SeedProduct => ({
  key, slug, name, family: "CLUB_PLAN", kind: "subscription", phase: "OTIMIZACAO", audience: ["PUBLIC", "STORE", "BRAS_MEMBER", "CARRIER", "IMPORTER"], status: "DRAFT", ref: "D131",
  tagline: `${name}: uma assinatura, vantagens em todas as marcas do grupo`, summary: `Assinatura do Club NextLevel: ${scope[0]!.toLowerCase()}.`,
  content: {
    forWho: ["Quem usa mais de uma marca do grupo"], notFor: ["Quem usa só uma marca e pouco"],
    problem: "Pagar cada marca separada e juntar pontos espalhados.",
    outcome: "Uma assinatura que abre as portas das marcas do grupo e acelera os pontos do Club.",
    scope, deliverables: ["Benefícios ativos durante o período pago"], limits: [SEM_GANHO],
    faq: [{ q: "Se eu cancelar?", a: "Cada marca volta para o plano grátis dela, sem bloquear e sem perder dados." }],
    policy: "Cancele quando quiser, sem multa: os benefícios seguem até o fim do período pago.",
  },
  grantsKey: `CLUB_${tier}`, commissionHoldDays: 14, sortOrder,
  meta: { brands: ["NEXTLEVEL"], tier },
  prices: [{ cycle: "MONTHLY", amountCents: monthly, ...PRECO }, { cycle: "ANNUAL", amountCents: monthly * 8, ...PRECO, methods: ["PIX"] }],
});

export const CLUB_SEED_PRODUCTS: SeedProduct[] = [
  club("CLUB_PLUS", "club-plus", "Club+", 2_990, 300, ["Pontos em dobro em todas as marcas", "20% de desconto nos planos das marcas do grupo", "Prioridade no atendimento"], "PLUS"),
  club("CLUB_TOTAL", "club-total", "Club Total", 24_700, 301, ["Plano de entrada de todas as marcas do grupo liberado", "Pontos em triplo", "A taxa sobre a venda de cada marca continua valendo"], "TOTAL"),
];
