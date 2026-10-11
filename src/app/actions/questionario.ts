"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { saveBenefitsSettings } from "@/lib/domain/beneficios/painel";
import { saveEcoSettings } from "@/lib/domain/ecossistema/lancador";
import { answerSurvey, dismissSurvey, saveSurveySettings, type surveyAnswerSchema, type surveySettingsSchema } from "@/lib/domain/precos/questionario";

/** Ações do questionário de preço (D124). */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { for (const p of ["/merchant", "/meu-bras", "/transportadora", "/master/financeiro/descoberta"]) revalidatePath(p); };

export async function answerSurveyAction(input: z.input<typeof surveyAnswerSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await answerSurvey(db, actor, input); refresh(); return r; });
}
export async function dismissSurveyAction() {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await dismissSurvey(db, actor); refresh(); return r; });
}
export async function saveSurveySettingsAction(input: z.input<typeof surveySettingsSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveSurveySettings(db, actor, input); refresh(); return r; });
}

/** Liga os benefícios gamificados por marca (D128). */
export async function saveBenefitsSettingsAction(input: { brands: string[] }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveBenefitsSettings(db, actor, input as never); refresh(); return r; });
}

/** Liga a barra do ecossistema por marca (D129). */
export async function saveEcoSettingsAction(input: { brands: string[] }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveEcoSettings(db, actor, input as never); for (const p of ["/merchant", "/meu-bras", "/transportadora", "/importadora"]) revalidatePath(p, "layout"); refresh(); return r; });
}
