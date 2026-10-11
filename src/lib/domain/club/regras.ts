import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";

/**
 * Regras dos pontos do Brás Digital Club (D115), editáveis no Master com versão e auditoria. Padrões = sugestão do
 * prompt (seção 7B), em rascunho até o dono decidir. Ponto não é dinheiro: não se saca nem se transfere, vale só como
 * desconto dentro do ecossistema e vence.
 */
const pts = z.number().int().min(0).max(1_000_000);
export const clubRulesSchema = z.object({
  /** Quantos pontos valem R$ 1,00 de desconto no resgate. */
  pointsPerReal: z.number().int().min(1).max(10_000),
  /** Pontos por indicação confirmada (ativou), por tipo de indicado. */
  referral: z.object({ CLIENTE: pts, IMPORTADORA: pts, TRANSPORTADORA: pts, ONIBUS: pts, LOJA: pts, GUIA: pts }),
  /** Teto de pontos de indicação por pessoa no mês; acima disso vai para a revisão do Master. */
  monthlyCap: pts,
  /** Validade dos pontos, em meses. */
  expiryMonths: z.number().int().min(1).max(60),
  /** Menor vale que dá para gerar, em pontos. */
  minRedeem: pts,
  /**
   * Compra no balcão de uma empresa do grupo (D120): pontos por R$ 1,00 gasto, pagos pela empresa da compra. Compra
   * acima do valor de revisão vai para a revisão do Master. O vale cobre no máximo um percentual da compra.
   */
  purchase: z.object({
    pointsPerReal: z.number().int().min(0).max(100),
    companies: z.array(z.string().regex(/^[A-Z0-9_]{2,30}$/)).max(20),
    reviewAboveCents: z.number().int().min(0).max(100_000_000),
    maxDiscountPct: z.number().int().min(1).max(100),
  }),
  /**
   * Benefícios cruzados do grupo (D121): pontos por fardo entregue por ônibus de empresa do grupo (pagos por ela) e o
   * percentual da compra que vira pontos para o guia de excursão que trouxe o passageiro (pago pela empresa da compra).
   */
  cross: z.object({ parcelDeliveredPoints: pts, guidePct: z.number().int().min(0).max(20) }),
  /**
   * Níveis pagos do Club (D131, rascunho até o dono aprovar): multiplicador de pontos (100 = normal) e desconto nos planos
   * das marcas. O Club Total libera o plano de entrada de todas as marcas; a taxa sobre a venda continua.
   */
  tiers: z.object({
    PLUS: z.object({ pointsMultiplierPct: z.number().int().min(100).max(500), planDiscountBps: z.number().int().min(0).max(5_000) }),
    TOTAL: z.object({ pointsMultiplierPct: z.number().int().min(100).max(500), planDiscountBps: z.number().int().min(0).max(5_000), unlocksEntryPlans: z.boolean() }),
  }),
  /** Missões do mês (pontos por meta atingida, nunca por sorteio). */
  missions: z.array(z.object({
    key: z.string().regex(/^[A-Z0-9_]{2,30}$/),
    title: z.string().trim().min(3).max(80),
    metric: z.enum(["INDICACOES_ATIVADAS", "FRETES_MES", "FARDOS_ONIBUS", "TRANSPORTADORA_ATIVADA"]),
    target: z.number().int().min(1).max(1000),
    points: pts,
  })).max(12),
});
export type ClubRules = z.output<typeof clubRulesSchema>;

export const DEFAULT_CLUB_RULES: ClubRules = {
  pointsPerReal: 100,
  referral: { CLIENTE: 500, IMPORTADORA: 2000, TRANSPORTADORA: 1000, ONIBUS: 1000, LOJA: 500, GUIA: 300 },
  monthlyCap: 20_000,
  expiryMonths: 12,
  minRedeem: 1_000,
  purchase: { pointsPerReal: 2, companies: ["MEGATRON", "STARLINE"], reviewAboveCents: 500_000, maxDiscountPct: 30 },
  cross: { parcelDeliveredPoints: 100, guidePct: 2 },
  tiers: { PLUS: { pointsMultiplierPct: 200, planDiscountBps: 2_000 }, TOTAL: { pointsMultiplierPct: 300, planDiscountBps: 0, unlocksEntryPlans: true } },
  missions: [
    { key: "TRAGA_TRANSPORTADORA", title: "Traga a sua transportadora ou ônibus", metric: "TRANSPORTADORA_ATIVADA", target: 1, points: 300 },
    { key: "TRES_FRETES", title: "3 fretes no mês pelo painel", metric: "FRETES_MES", target: 3, points: 500 },
    { key: "PRIMEIRO_FARDO", title: "Seu primeiro fardo por ônibus", metric: "FARDOS_ONIBUS", target: 1, points: 300 },
  ],
};

const KEY = "club.rules";

export async function getClubRules(db: Database): Promise<ClubRules & { version: number }> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const v = (row?.value ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_CLUB_RULES } as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_CLUB_RULES) as (keyof ClubRules)[]) {
    const parsed = clubRulesSchema.shape[k].safeParse(v[k]);
    if (parsed.success) out[k] = parsed.data;
  }
  return { ...(out as ClubRules), version: typeof v.version === "number" ? v.version : 0 };
}

export async function saveClubRules(db: Database, actor: Actor, patch: Partial<z.input<typeof clubRulesSchema>>) {
  requireMaster(actor);
  const { version, ...before } = await getClubRules(db);
  const next = clubRulesSchema.parse({ ...before, ...patch });
  if (new Set(next.missions.map((m) => m.key)).size !== next.missions.length) throw new z.ZodError([{ code: "custom", path: ["missions"], message: "Missões com a mesma chave." }]);
  const value = { ...next, version: version + 1 };
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "CLUB_RULES_SAVED", entityType: "platform_settings", entityId: KEY, before, after: value }, { force: true });
  return value;
}

/** Pontos → reais (centavos) no resgate, com o valor do momento. */
export const pointsToCents = (points: number, rules: Pick<ClubRules, "pointsPerReal">) => Math.floor((points * 100) / rules.pointsPerReal);
