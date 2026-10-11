import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";

/**
 * Regras da Cargas Excursão (D112), editáveis no Master com versão e auditoria. Valores padrão são sugestão em
 * rascunho (seção 5.2 e 13 do prompt do Club): a taxa da plataforma só é cobrada depois que o dono ligar a cobrança.
 */
export const PARCEL_SIZES = ["P", "M", "G"] as const;
export type ParcelSize = (typeof PARCEL_SIZES)[number];
export const PARCEL_SIZE_LABEL: Record<ParcelSize, string> = { P: "Fardinho P", M: "Fardo M", G: "Fardo G" };

const size = z.object({
  maxCm: z.string().trim().min(3).max(30),
  maxKg: z.number().int().min(1).max(200),
  /** Quanto ocupa no bagageiro, em fardinhos equivalentes. */
  units: z.number().int().min(1).max(50),
});
export const excursionRulesSchema = z.object({
  sizes: z.object({ P: size, M: size, G: size }),
  /** Taxa da NextLevel por fardo (VOLUME, centavos) ou percentual do frete (PERCENT, bps). */
  fee: z.object({ mode: z.enum(["VOLUME", "PERCENT"]), perParcelCents: z.number().int().min(0).max(100_000), bps: z.number().int().min(0).max(5000), charging: z.boolean() }),
  defaultCapacityUnits: z.number().int().min(10).max(2000),
  /** Horas antes da saída até quando o cliente cancela com devolução. */
  cancelHours: z.number().int().min(0).max(240),
  /** Fardo só embarca com nota (seção 7A.1). */
  requireInvoice: z.boolean(),
  /**
   * Pix do frete na conta Mercado Pago do dono do ônibus (D119). Desligado: cliente e ônibus combinam o pagamento.
   * Ligado (e o ônibus com Mercado Pago conectado): o fardo aceito só é coletado depois do Pix conferido na API.
   */
  pixOnline: z.boolean(),
});
export type ExcursionRules = z.output<typeof excursionRulesSchema>;

export const DEFAULT_EXCURSION_RULES: ExcursionRules = {
  sizes: { P: { maxCm: "40 × 30 × 30", maxKg: 10, units: 1 }, M: { maxCm: "60 × 40 × 40", maxKg: 20, units: 2 }, G: { maxCm: "80 × 50 × 50", maxKg: 30, units: 4 } },
  fee: { mode: "VOLUME", perParcelCents: 150, bps: 500, charging: false },
  defaultCapacityUnits: 120,
  cancelHours: 12,
  requireInvoice: true,
  pixOnline: false,
};

const KEY = "cargas.excursion_rules";

export async function getExcursionRules(db: Database): Promise<ExcursionRules & { version: number }> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const v = (row?.value ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_EXCURSION_RULES } as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_EXCURSION_RULES) as (keyof ExcursionRules)[]) {
    const parsed = excursionRulesSchema.shape[k].safeParse(v[k]);
    if (parsed.success) out[k] = parsed.data;
  }
  return { ...(out as ExcursionRules), version: typeof v.version === "number" ? v.version : 0 };
}

export async function saveExcursionRules(db: Database, actor: Actor, patch: Partial<z.input<typeof excursionRulesSchema>>) {
  requireMaster(actor);
  const { version, ...before } = await getExcursionRules(db);
  const next = excursionRulesSchema.parse({ ...before, ...patch });
  if (!(next.sizes.P.units <= next.sizes.M.units && next.sizes.M.units <= next.sizes.G.units)) throw new z.ZodError([{ code: "custom", path: ["sizes"], message: "O fardo maior precisa ocupar pelo menos o mesmo espaço que o menor." }]);
  const value = { ...next, version: version + 1 };
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "EXCURSION_RULES_SAVED", entityType: "platform_settings", entityId: KEY, before, after: value }, { force: true });
  return value;
}

/** Taxa da plataforma de um fardo, congelada no aceite. */
export function excursionFeeCents(rules: Pick<ExcursionRules, "fee">, freightCents: number): number {
  return rules.fee.mode === "VOLUME" ? rules.fee.perParcelCents : Math.round((freightCents * rules.fee.bps) / 10_000);
}
