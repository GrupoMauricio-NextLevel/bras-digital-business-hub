import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { organizations, platformSettings, priceSurveyResponses, priceSurveyStatus, stores, users, PRICE_SURVEY_BRANDS } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor, requireMasterFn } from "../access";
import { recordAudit } from "../audit";
import { DomainError } from "../errors";
import { FUNNEL_BRANDS, median, type FunnelBrand } from "./funil";

/**
 * Questionário de preço dentro do painel (D124, fase P2 do prompt de público e preço). No máximo 5 perguntas, opcional,
 * **desligado até o Master ligar**. Quatro perguntas de preço (adaptação de Van Westendorp: barato demais para confiar,
 * pechincha, caro mas pagaria, caro demais) e uma de "e se tirássemos?" (Sean Ellis). As respostas ficam sem ligação com a
 * pessoa (só marca e mês); o Master só vê o resultado somado e só a partir de um mínimo de respostas por marca.
 */
export const surveySettingsSchema = z.object({
  enabled: z.boolean(),
  brands: z.array(z.enum(PRICE_SURVEY_BRANDS)).max(PRICE_SURVEY_BRANDS.length),
  /** Só pergunta para quem já usa há alguns dias (opinião de quem conhece o produto). */
  minDaysSinceSignup: z.number().int().min(0).max(365),
  /** Abaixo disso o Master não vê o resultado da marca (para ninguém ser identificado por poucas respostas). */
  minResponsesToShow: z.number().int().min(3).max(100),
});
export type SurveySettings = z.output<typeof surveySettingsSchema>;
export const DEFAULT_SURVEY: SurveySettings = { enabled: false, brands: [...PRICE_SURVEY_BRANDS], minDaysSinceSignup: 7, minResponsesToShow: 5 };
const KEY = "descoberta.questionario";

export async function getSurveySettings(db: Database): Promise<SurveySettings> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const parsed = surveySettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_SURVEY;
}
export async function saveSurveySettings(db: Database, actor: Actor, raw: z.input<typeof surveySettingsSchema>) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  const before = await getSurveySettings(db);
  const v = surveySettingsSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "PRICE_SURVEY_SETTINGS", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

const monthOf = (d: Date) => d.toISOString().slice(0, 7);
const labelOf = (b: FunnelBrand) => FUNNEL_BRANDS.find((x) => x.brand === b)!.label;

/** Marca do painel de quem está logado (só lojista, membro da Brás e transportadora respondem). */
async function brandOf(db: Database, actor: Actor): Promise<FunnelBrand | null> {
  if (actor.role === "BRAS_MEMBER") return "BRAS_DIGITAL";
  if (actor.role === "CARRIER") return "NEXTLEVEL_CARGAS";
  if (actor.role !== "STORE_OWNER" || !actor.storeId) return null;
  const [r] = await db.select({ brand: organizations.brand, networkId: stores.networkId }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, actor.storeId)).limit(1);
  if (!r) return null;
  if (r.brand === "SUPERDROP" || r.brand === "NEXTLEVEL_COMMERCE") return r.brand;
  return r.networkId ? "SUPERDROP" : "NEXTLEVEL_COMMERCE";
}

/** O questionário a mostrar no painel agora, ou `null` (desligado, marca fora, conta nova, já respondeu ou dispensou). */
export async function pendingSurvey(db: Database, actor: Actor, now = new Date()): Promise<{ brand: FunnelBrand; product: string } | null> {
  const s = await getSurveySettings(db);
  if (!s.enabled) return null;
  const brand = await brandOf(db, actor);
  if (!brand || !s.brands.includes(brand)) return null;
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { createdAt: true } });
  if (!u || now.getTime() - new Date(u.createdAt).getTime() < s.minDaysSinceSignup * 86_400_000) return null;
  const done = await db.query.priceSurveyStatus.findFirst({ where: and(eq(priceSurveyStatus.userId, actor.userId), eq(priceSurveyStatus.brand, brand)) });
  return done ? null : { brand, product: labelOf(brand) };
}

const cents = z.number().int().min(0).max(10_000_000);
export const surveyAnswerSchema = z.object({
  tooCheapCents: cents, bargainCents: cents, expensiveCents: cents, tooExpensiveCents: cents,
  disappointment: z.enum(["MUITO", "POUCO", "NADA"]),
}).refine((a) => a.tooCheapCents <= a.bargainCents && a.bargainCents <= a.expensiveCents && a.expensiveCents <= a.tooExpensiveCents, {
  message: "Os valores precisam subir de uma pergunta para a outra: barato demais ≤ pechincha ≤ caro, mas pagaria ≤ caro demais.",
});

/** Grava a resposta sem ligação com a pessoa e marca que ela já respondeu (as duas coisas juntas). */
export async function answerSurvey(db: Database, actor: Actor, raw: z.input<typeof surveyAnswerSchema>, now = new Date()) {
  const pending = await pendingSurvey(db, actor, now);
  if (!pending) throw new DomainError("SURVEY_UNAVAILABLE", "Este questionário não está disponível para você agora.");
  const a = surveyAnswerSchema.parse(raw);
  const month = monthOf(now);
  await db.transaction(async (tx) => {
    const ins = await tx.insert(priceSurveyStatus).values({ userId: actor.userId, brand: pending.brand, status: "RESPONDEU", month }).onConflictDoNothing().returning();
    if (!ins.length) throw new DomainError("SURVEY_DONE", "Você já respondeu. Obrigado!");
    await tx.insert(priceSurveyResponses).values({ id: newId("psr"), brand: pending.brand, month, ...a });
  });
  return { ok: true };
}

/** "Agora não": não pergunta de novo para esta marca. */
export async function dismissSurvey(db: Database, actor: Actor, now = new Date()) {
  const pending = await pendingSurvey(db, actor, now);
  if (!pending) return { ok: true };
  await db.insert(priceSurveyStatus).values({ userId: actor.userId, brand: pending.brand, status: "DISPENSOU", month: monthOf(now) }).onConflictDoNothing();
  return { ok: true };
}

export type SurveyResult = {
  brand: FunnelBrand; label: string; responses: number; dismissed: number; shown: boolean;
  medians: { tooCheap: number; bargain: number; expensive: number; tooExpensive: number } | null;
  /** % que se sentiria "muito decepcionado" sem o produto (referência de mercado: 40% ou mais indica produto que faz falta). */
  veryDisappointedPct: number | null;
};

/** Resultado somado por marca, só para o Master; esconde a marca com menos respostas que o mínimo. */
export async function surveyResults(db: Database, actor: Actor): Promise<{ settings: SurveySettings; results: SurveyResult[] }> {
  requireMaster(actor);
  const settings = await getSurveySettings(db);
  const [rows, status] = await Promise.all([db.select().from(priceSurveyResponses), db.select({ brand: priceSurveyStatus.brand, status: priceSurveyStatus.status }).from(priceSurveyStatus)]);
  const results = PRICE_SURVEY_BRANDS.map((brand) => {
    const r = rows.filter((x) => x.brand === brand);
    const shown = r.length >= settings.minResponsesToShow;
    const m = (k: "tooCheapCents" | "bargainCents" | "expensiveCents" | "tooExpensiveCents") => Math.round(median(r.map((x) => x[k])) ?? 0);
    return {
      brand, label: labelOf(brand), responses: r.length, dismissed: status.filter((s) => s.brand === brand && s.status === "DISPENSOU").length, shown,
      medians: shown ? { tooCheap: m("tooCheapCents"), bargain: m("bargainCents"), expensive: m("expensiveCents"), tooExpensive: m("tooExpensiveCents") } : null,
      veryDisappointedPct: shown ? Math.round((r.filter((x) => x.disappointment === "MUITO").length / r.length) * 100) : null,
    };
  });
  return { settings, results };
}
