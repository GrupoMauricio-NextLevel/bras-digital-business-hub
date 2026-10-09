import type { Database } from "@/db/client";
import type { bdMembers } from "@/db/schema";
import { brasMemberOwnActivity } from "./membros";
import { brasClientLevel, brasJourneyMoment, brasPanelPlan, getBrasClassification, type BrasClientLevel, type BrasMoment } from "./perfil";
import { brasMemberPlan } from "./suporte";
import type { BrasMemberPlan } from "./regras";

/**
 * O que o Meu Brás mostra para este membro agora (D108): nível (declarado × comprovado × ajuste), momento da jornada,
 * plano e os 3 cartões principais. Tudo calculado no servidor a partir do banco.
 */
export async function brasMemberPanel(db: Database, m: typeof bdMembers.$inferSelect, now = new Date()): Promise<{
  level: BrasClientLevel; moment: BrasMoment; plan: BrasMemberPlan; planUntil: string | null; hasProfile: boolean;
  headline: string; cards: ReturnType<typeof brasPanelPlan>["cards"];
}> {
  const c = await getBrasClassification(db);
  const [act, plan] = await Promise.all([brasMemberOwnActivity(db, m.id, c.behavior.windowDays, now), brasMemberPlan(db, m.id, now)]);
  const { level } = brasClientLevel(m, act.paidWindowCents, c);
  const moment = brasJourneyMoment({ ...act, lastSeenAt: m.lastSeenAt ? new Date(m.lastSeenAt).toISOString() : null }, c, now);
  const p = brasPanelPlan({ hasProfile: !!m.profile, level, moment, goals: m.profile?.goals ?? [], channels: m.profile?.channels ?? [] });
  return { level, moment, plan: plan.plan, planUntil: plan.validUntil, hasProfile: !!m.profile, headline: p.headline, cards: p.cards };
}

/** Só o nível (para o suporte por plano conferir o reforço de grande conta). */
export async function brasMemberLevel(db: Database, m: typeof bdMembers.$inferSelect, now = new Date()): Promise<BrasClientLevel> {
  const c = await getBrasClassification(db);
  const act = await brasMemberOwnActivity(db, m.id, c.behavior.windowDays, now);
  return brasClientLevel(m, act.paidWindowCents, c).level;
}
