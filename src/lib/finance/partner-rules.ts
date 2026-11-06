import { z } from "zod";

/**
 * Regras do Programa de Parceiros (afiliados). Nada de percentual fixo no código de negócio:
 * tudo vem de `partner_settings` (platform_settings), com estes padrões decididos pelo dono.
 */
export const partnerSettingsSchema = z.object({
  /** Faixas pelas ativações do mês civil. `max` ausente = sem teto. */
  tiers: z.array(z.object({ min: z.number().int().min(1), max: z.number().int().min(1).optional(), bps: z.number().int().min(0).max(10000) })).min(1),
  maintenanceBps: z.number().int().min(0).max(10000),
  attributionDays: z.number().int().min(1).max(365),
  guaranteeDays: z.number().int().min(0).max(120),
  minPayoutCents: z.number().int().min(0),
  payoutsPerWeek: z.number().int().min(1).max(7),
  inactiveFeeCents: z.number().int().min(0),
  /** Metas: ativações por mês para manter o cadastro gratuito. */
  monthlyGoal: z.number().int().min(1).max(50),
  termsVersion: z.string().min(1),
});
export type PartnerSettings = z.infer<typeof partnerSettingsSchema>;

export const DEFAULT_PARTNER_SETTINGS: PartnerSettings = {
  // "acima de 10 é 25%": 10 entra na faixa de 25% para não deixar buraco entre 9 e 11.
  tiers: [{ min: 1, max: 4, bps: 1500 }, { min: 5, max: 9, bps: 2000 }, { min: 10, bps: 2500 }],
  maintenanceBps: 500,
  attributionDays: 90, // D260: o lojista do Brás demora a decidir; os concorrentes dão 30 dias
  guaranteeDays: 7,
  minPayoutCents: 5_000, // D260: saque a partir de R$ 50
  payoutsPerWeek: 1,
  inactiveFeeCents: 10_000,
  monthlyGoal: 1,
  termsVersion: "2026-09",
};

export type Tier = { bps: number; next: { needed: number; bps: number } | null };

/** Faixa de comissão sobre o setup para N ativações no mês, e quantas faltam para a próxima. */
export function tierFor(activations: number, s: Pick<PartnerSettings, "tiers">): Tier {
  const tiers = [...s.tiers].sort((a, b) => a.min - b.min);
  // A faixa vigente é a de maior `min` alcançado (o `max` só documenta o intervalo).
  const cur = [...tiers].reverse().find((t) => activations >= t.min);
  const bps = cur?.bps ?? 0;
  const nextTier = tiers.find((t) => t.min > activations);
  return { bps, next: nextTier ? { needed: nextTier.min - activations, bps: nextTier.bps } : null };
}

export const commissionOf = (baseCents: number, bps: number) => Math.round((baseCents * bps) / 10_000);

/**
 * Simulação da calculadora pública (não é garantia de ganhos): `perMonth` ativações todo mês, por 12 meses.
 * Setup pela faixa do mês; manutenção de cada loja ativa enquanto pagar, acumulada mês a mês.
 */
export function simulateEarnings(input: { perMonth: number; setupCents: number; monthlyCents: number }, s: PartnerSettings) {
  const tier = tierFor(input.perMonth, s);
  const setupPerMonth = commissionOf(input.setupCents * input.perMonth, tier.bps);
  let maintenance12 = 0;
  for (let m = 1; m <= 12; m++) maintenance12 += commissionOf(input.monthlyCents * input.perMonth * (m - 1), s.maintenanceBps);
  const setup12 = setupPerMonth * 12;
  const maintenanceMonth12 = commissionOf(input.monthlyCents * input.perMonth * 11, s.maintenanceBps);
  return { tier, setupPerMonth, setup12, maintenance12, maintenanceMonth12, total12: setup12 + maintenance12 };
}
