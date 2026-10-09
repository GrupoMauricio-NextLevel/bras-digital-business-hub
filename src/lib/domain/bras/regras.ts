import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";

/**
 * Regras da Brás v2 (D108): tudo que muda o dinheiro, o prazo ou o acesso fica aqui, editável no Master
 * (Brás → Planos e regras), com versão e auditoria. Preço de plano e de serviço fica no catálogo Master (D90);
 * aqui ficam prazos, percentuais, parâmetros e o suporte de cada plano. Nada disso é fixo no código: os valores
 * abaixo são só o padrão aceito pelo dono em 2026-10-09.
 */
import { BRAS_MEMBER_PLANS, BRAS_SUPPORT_CHANNELS, type BrasMemberPlan, type BrasSupportChannel } from "@/lib/bras/planos";
export { BRAS_MEMBER_PLANS, BRAS_PLAN_LABEL, BRAS_SUPPORT_CHANNELS, BRAS_SUPPORT_LABEL, CARRIER_PLANS, brasPlanRank, type BrasMemberPlan, type BrasSupportChannel, type CarrierPlan } from "@/lib/bras/planos";

const pct = z.number().int().min(0).max(100);
const dias = (min: number, max: number) => z.number().int().min(min).max(max);
const bps = z.number().int().min(0).max(5000);
const canais = z.array(z.enum(BRAS_SUPPORT_CHANNELS)).min(1).transform((c) => [...new Set(["FAQ" as const, ...c])]);

export const brasRulesSchema = z.object({
  /** Pré-pedido de produto em alto mar (módulo D). */
  preorder: z.object({
    depositPct: pct.refine((v) => v >= 5 && v <= 90, "Sinal entre 5% e 90%"),
    /** Dias de atraso sobre a ETA original que liberam o cancelamento com devolução integral do sinal. */
    delayRefundDays: dias(1, 180),
    /** Dias para pagar o saldo depois que o produto fica disponível no galpão. */
    balanceDueDays: dias(1, 30),
    /** Plano mínimo para ver o preço e pré-comprar. */
    minPlan: z.enum(BRAS_MEMBER_PLANS),
  }),
  /** Cotação de contêiner fechado (módulo E). A taxa fora do catálogo é preço do catálogo Master (BRAS_COTACAO_FORA_CATALOGO). */
  quotes: z.object({
    catalogDays: dias(1, 60),
    offCatalogDays: dias(1, 90),
    offCatalogMaxItems: z.number().int().min(1).max(20),
    /** Devolução da taxa se a resposta passar do prazo. */
    offCatalogLateRefundPct: pct,
    minPlan: z.enum(BRAS_MEMBER_PLANS),
  }),
  /** Contêiner compartilhado por cotas (módulo F). */
  shared: z.object({
    closeDays: dias(5, 120),
    extensionDays: dias(0, 60),
    maxExtensions: z.number().int().min(0).max(3),
    minFillPct: pct.refine((v) => v >= 50, "Mínimo de 50% para fechar"),
    minPlan: z.enum(BRAS_MEMBER_PLANS),
  }),
  /** Referências de cubagem (seção 9.3 do prompt v2): volumes úteis em m³ × 10 (uma casa decimal, sem número quebrado no banco). */
  cubage: z.object({
    usefulDm3: z.object({ c20: z.number().int().min(10_000).max(40_000), c40: z.number().int().min(30_000).max(80_000), c40hc: z.number().int().min(30_000).max(90_000) }),
    /** Fator de ocupação do contêiner misto (80% a 95%). */
    mixedOccupancyPct: z.number().int().min(60).max(100),
    /** Taxa de manuseio por item diferente no misto (separação, etiqueta, conferência). */
    perSkuFeeCents: z.number().int().min(0).max(10_000_000),
    /** Acréscimo no preço do produto quando a quantidade do item é pequena: até X caixas, + Y%. Ordenado por caixas. */
    smallQtyCurve: z.array(z.object({ upToBoxes: z.number().int().min(1).max(100_000), surchargeBps: bps })).max(8),
  }),
  /** Transporte (NextLevel Cargas): comissão por carga sobre o frete, por plano da transportadora. */
  carriers: z.object({
    commissionBps: z.object({ GRATIS: bps, PRO: bps, PREMIUM: bps }),
    freeLoadsPerMonth: z.number().int().min(0).max(10_000),
    /** Minutos de antecedência que o Pro e o Premium veem as cargas antes do grátis. */
    earlyAccessMinutes: z.number().int().min(0).max(1440),
  }),
  /** Estoque da importadora: horas até o saldo ser considerado desatualizado; minutos entre sincronizações do Bling. */
  stock: z.object({ freshnessHours: z.number().int().min(1).max(720), blingSyncMinutes: z.number().int().min(5).max(1440) }),
  /** O que o plano grátis vê. */
  freePlan: z.object({ trendsVisible: z.number().int().min(0).max(20), openRequestsMax: z.number().int().min(1).max(100) }),
  /** Suporte por plano (decisão do dono, 2026-10-09): grátis = FAQ; básico pago = chat e WhatsApp; avançados = agenda pessoal. */
  support: z.object({
    channels: z.object({ GRATIS: canais, PRATA: canais, OURO: canais, PLATINUM: canais }),
    /** Visitas agendadas por mês em cada plano que tem agenda. */
    agendaPerMonth: z.object({ GRATIS: z.number().int().min(0).max(10), PRATA: z.number().int().min(0).max(10), OURO: z.number().int().min(0).max(10), PLATINUM: z.number().int().min(0).max(10) }),
    /** Grande conta (classificação) fala por WhatsApp mesmo no plano grátis, para não perder cliente grande no primeiro contato. */
    largeAccountWhatsapp: z.boolean(),
    /** Prazo de resposta no chat, em horas úteis, mostrado ao membro. */
    chatReplyHours: z.number().int().min(1).max(72),
    faq: z.array(z.object({ q: z.string().trim().min(3).max(160), a: z.string().trim().min(3).max(1200) })).max(40),
  }),
});
export type BrasRules = z.infer<typeof brasRulesSchema>;
export type BrasRulesInput = z.input<typeof brasRulesSchema>;

export const DEFAULT_BRAS_FAQ: BrasRules["support"]["faq"] = [
  { q: "Preciso pagar para comprar?", a: "Não. O cadastro com CNPJ é grátis e comprar caixas é sempre grátis. Os planos pagos liberam inteligência (análises, tendências, contêiner e pré-pedido), nunca a compra." },
  { q: "Como funciona a compra por caixa?", a: "Você escolhe a descoberta, vê o preço da caixa e quantas unidades vêm nela, pede as caixas e informa o destino. A equipe da Brás Digital confirma o pedido e o pagamento com você; a sua transportadora retira no Brás com o código do pedido." },
  { q: "Quem fala comigo depois do pedido?", a: "A equipe da Brás Digital. A importadora recebe só o endereço de envio de cada pedido; atendimento, ocorrências e trocas são com a Brás." },
  { q: "Posso retirar pessoalmente?", a: "Sim. No comprovante de retirada aparecem o endereço da importadora e o código do pedido. Quem retirar (você ou a transportadora) mostra o código no balcão." },
  { q: "A análise garante que o produto vai vender?", a: "Não. A análise reúne tendência, concorrência, preço praticado e riscos para você decidir melhor. Resultado de venda depende do seu anúncio, preço, frete e mercado." },
  { q: "Como mudo de plano?", a: "Em Meu plano (ou falando com a equipe). O plano vale do dia da confirmação do pagamento e pode ser cancelado quando quiser, sem multa." },
];

export const DEFAULT_BRAS_RULES: BrasRules = {
  preorder: { depositPct: 30, delayRefundDays: 30, balanceDueDays: 5, minPlan: "PLATINUM" },
  quotes: { catalogDays: 7, offCatalogDays: 15, offCatalogMaxItems: 4, offCatalogLateRefundPct: 100, minPlan: "OURO" },
  shared: { closeDays: 30, extensionDays: 15, maxExtensions: 1, minFillPct: 100, minPlan: "OURO" },
  cubage: {
    usefulDm3: { c20: 28_000, c40: 58_000, c40hc: 68_000 },
    mixedOccupancyPct: 85,
    perSkuFeeCents: 25_000,
    smallQtyCurve: [{ upToBoxes: 10, surchargeBps: 1500 }, { upToBoxes: 30, surchargeBps: 800 }, { upToBoxes: 80, surchargeBps: 300 }],
  },
  carriers: { commissionBps: { GRATIS: 800, PRO: 600, PREMIUM: 500 }, freeLoadsPerMonth: 20, earlyAccessMinutes: 30 },
  stock: { freshnessHours: 72, blingSyncMinutes: 30 },
  freePlan: { trendsVisible: 3, openRequestsMax: 5 },
  support: {
    channels: { GRATIS: ["FAQ"], PRATA: ["FAQ", "CHAT", "WHATSAPP"], OURO: ["FAQ", "CHAT", "WHATSAPP", "AGENDA"], PLATINUM: ["FAQ", "CHAT", "WHATSAPP", "AGENDA"] },
    agendaPerMonth: { GRATIS: 0, PRATA: 0, OURO: 1, PLATINUM: 2 },
    largeAccountWhatsapp: true,
    chatReplyHours: 8,
    faq: DEFAULT_BRAS_FAQ,
  },
};

const KEY = "bras.v2_rules";

/** Grupo a grupo: um grupo inválido no banco volta ao padrão sem derrubar os outros. */
function merge(raw: unknown): BrasRules {
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_BRAS_RULES } as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_BRAS_RULES) as (keyof BrasRules)[]) {
    const shape = brasRulesSchema.shape[k];
    const parsed = shape.safeParse(v[k]);
    if (parsed.success) out[k] = parsed.data;
  }
  return out as BrasRules;
}

export async function getBrasRules(db: Database): Promise<BrasRules & { version: number; updatedAt: string | null }> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const value = (row?.value ?? {}) as Record<string, unknown>;
  return { ...merge(value), version: typeof value.version === "number" ? value.version : 0, updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : null };
}

/** Grava um ou mais grupos (o resto fica como está), sobe a versão e registra antes/depois na auditoria. */
export async function saveBrasRules(db: Database, actor: Actor, patch: Partial<BrasRulesInput>): Promise<BrasRules & { version: number }> {
  requireMaster(actor);
  const current = await getBrasRules(db);
  const { version, updatedAt: _u, ...before } = current;
  void _u;
  const next = brasRulesSchema.parse({ ...before, ...patch });
  if (next.cubage.smallQtyCurve.some((t, i, a) => i > 0 && t.upToBoxes <= a[i - 1]!.upToBoxes)) {
    throw new z.ZodError([{ code: "custom", path: ["cubage", "smallQtyCurve"], message: "A curva de quantidade precisa estar em ordem crescente de caixas." }]);
  }
  const value = { ...next, version: version + 1 };
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  const changed = Object.keys(patch) as (keyof BrasRules)[];
  await recordAudit(db, actor, { action: "BRAS_RULES_SAVED", entityType: "platform_settings", entityId: KEY, before: Object.fromEntries(changed.map((k) => [k, before[k]])), after: { version: value.version, ...Object.fromEntries(changed.map((k) => [k, next[k]])) } }, { force: true });
  return value;
}

/** Canais de suporte de um membro: os do plano, mais WhatsApp para grande conta quando a regra estiver ligada. */
export function brasSupportFor(rules: Pick<BrasRules, "support">, plan: BrasMemberPlan, level?: string | null): { channels: BrasSupportChannel[]; agendaPerMonth: number; largeAccountBoost: boolean } {
  const base = rules.support.channels[plan];
  const boost = level === "GRANDE" && rules.support.largeAccountWhatsapp && !base.includes("WHATSAPP");
  const channels = BRAS_SUPPORT_CHANNELS.filter((c) => base.includes(c) || (boost && c === "WHATSAPP"));
  return { channels, agendaPerMonth: channels.includes("AGENDA") ? rules.support.agendaPerMonth[plan] : 0, largeAccountBoost: boost };
}

/** Menor plano que oferece um canal (para a chamada de upgrade honesta: "disponível a partir do Prata"). */
export function brasPlanForChannel(rules: Pick<BrasRules, "support">, channel: BrasSupportChannel): BrasMemberPlan | null {
  return BRAS_MEMBER_PLANS.find((p) => rules.support.channels[p].includes(channel)) ?? null;
}

export { brasCubageQuote, type CubageInput } from "@/lib/bras/cubagem";
