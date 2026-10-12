import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { platformSettings, users } from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { DEFAULT_SURVEY, saveSurveySettings } from "@/lib/domain/precos/questionario";
import { BENEFIT_BRANDS, saveBenefitsSettings } from "@/lib/domain/beneficios/painel";
import { ECO_BRANDS, saveEcoSettings } from "@/lib/domain/ecossistema/lancador";
import { addDoorVersion } from "@/lib/domain/precos/porta-entrada";
import { createExperiment, setExperimentStatus } from "@/lib/domain/experimentos";
import { getCatalogItem, setCatalogStatus } from "@/lib/domain/nl-catalog";
import { getProposal, saveProposal } from "@/lib/domain/precos/proposta";
import { getExcursionRules, saveExcursionRules } from "@/lib/domain/cargas/regras-excursao";

/**
 * "Tudo ligado" no ambiente de demonstração (D151): o que a Central de qualidade lista em "Pronto e desligado" e depende
 * do banco é ligado uma vez, pelas mesmas funções das telas do Master (com auditoria), para a família e a equipe verem
 * tudo funcionando. Só roda no seed de demonstração; marca `demo.tudo-ligado` para não religar o que alguém desligar
 * depois. O que depende de chave no Render (cadastro aberto, Pagar.me, suporte) é ligado no serviço de demonstração.
 * Fica desligado de propósito: conta Mercado Pago da NextLevel (precisa de conta real; a demonstração simula o Pix) e
 * envio real de e-mails.
 */
export const DEMO_ALL_ON_KEY = "demo.tudo-ligado";

export async function turnEverythingOnInDemo(db: Database, now = new Date()): Promise<string[]> {
  if (await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, DEMO_ALL_ON_KEY) })) return [];
  const master = await db.query.users.findFirst({ where: eq(users.email, "master@nextlevel.demo") });
  if (!master) return [];
  const actor: Actor = actorFromUser(master);
  const done: string[] = [];
  const step = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); done.push(label); } catch (e) { done.push(`${label}: não ligado (${(e as Error).message})`); }
  };

  await step("questionário de preço", () => saveSurveySettings(db, actor, { ...DEFAULT_SURVEY, enabled: true }));
  await step("benefícios nos painéis", () => saveBenefitsSettings(db, actor, { brands: [...BENEFIT_BRANDS] }));
  for (const [brand, piece] of [["SUPERDROP", "PORTA_SUPERDROP"], ["NEXTLEVEL_COMMERCE", "PORTA_COMMERCE"]] as const) {
    await step(`porta de entrada ${brand} com os preços da Proposta, em experimento`, async () => {
      await addDoorVersion(db, actor, brand, {
        status: "ACTIVE", mode: "REVERSE_TRIAL", trialDays: 7, freeTierFeeBps: 0, publishDays: 3, firstSaleDays: 4, milestoneCapDays: 14,
        annualPaidMonths: 10, cashbackBps: 500, useProposalPrices: true, reason: "Demonstração: tudo ligado para conhecer o sistema",
      }, DEMO_PASSWORD);
      const { id } = await createExperiment(db, actor, {
        piece, name: `Porta ${brand === "SUPERDROP" ? "SuperDrop" : "Commerce"} com os preços da Proposta (demonstração)`, treatmentPct: 50,
        primaryMetric: "ATIVACAO_30", guardMetric: "RECEITA_POR_CLIENTE", minPerGroup: 30,
        readAt: new Date(now.getTime() + 60 * 86_400_000).toISOString().slice(0, 10),
      });
      await setExperimentStatus(db, actor, id, { start: true }, now);
    });
  }
  await step("barra do ecossistema, captação, e-mails e páginas públicas", () => saveEcoSettings(db, actor, { brands: [...ECO_BRANDS], capture: true, emailFooter: true, publicPages: true }));
  for (const key of ["CLUB_PLUS", "CLUB_TOTAL"]) {
    await step(`${key} publicado`, async () => {
      const item = await getCatalogItem(db, { key }, { includeUnpublished: true });
      if (item) await setCatalogStatus(db, actor, item.id, "PUBLISHED", "Demonstração: tudo ligado");
    });
  }
  await step("proposta de preços aprovada", async () => saveProposal(db, actor, { ...(await getProposal(db)), status: "APROVADA" }));
  await step("taxa dos fardos e Pix do frete do ônibus", async () => {
    const r = await getExcursionRules(db);
    await saveExcursionRules(db, actor, { fee: { ...r.fee, charging: true }, pixOnline: true });
  });
  await db.insert(platformSettings).values({ key: DEMO_ALL_ON_KEY, value: { at: now.toISOString(), done } }).onConflictDoNothing();
  return done;
}
