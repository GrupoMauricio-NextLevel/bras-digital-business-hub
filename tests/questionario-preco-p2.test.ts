import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { priceSurveyResponses, users } from "@/db/schema";
import { answerSurvey, dismissSurvey, pendingSurvey, saveSurveySettings, surveyResults, DEFAULT_SURVEY } from "@/lib/domain/precos/questionario";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import type { Actor } from "@/lib/domain/access";

/** D124 (fase P2): questionário de preço no painel, desligado por padrão, anônimo, uma vez por marca. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
const LATER = new Date(Date.now() + 30 * 86_400_000);
const answer = (n: number) => ({ tooCheapCents: 1_000 * n, bargainCents: 2_000 * n, expensiveCents: 4_000 * n, tooExpensiveCents: 8_000 * n, disappointment: "MUITO" as const });
async function membro(i: number): Promise<Actor> {
  const r = await signupBrasMember(ctx.db, { name: `Pessoa ${i}`, companyName: `Empresa ${i} LTDA`, cnpj: ["11222333000181", "11444777000161", "47173173000175", "19131243000197", "60701190000104"][i]!, whatsapp: "11988887777", email: `p${i}@u.teste`, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
}
beforeEach(async () => { ctx = await freshDb(); });

describe("questionário de preço", () => {
  it("desligado por padrão: ninguém vê", async () => {
    expect(DEFAULT_SURVEY.enabled).toBe(false);
    expect(await pendingSurvey(ctx.db, ctx.actors.mantos, LATER)).toBeNull();
    await expect(answerSurvey(ctx.db, ctx.actors.mantos, answer(1), LATER)).rejects.toThrow(/não está disponível/);
  });

  it("ligado: só depois dos dias de uso, uma vez por marca, sem ligação com a pessoa", async () => {
    await saveSurveySettings(ctx.db, ctx.actors.master, { ...DEFAULT_SURVEY, enabled: true });
    const ana = await membro(0);
    expect(await pendingSurvey(ctx.db, ana)).toBeNull(); // conta nova (menos de 7 dias)
    expect(await pendingSurvey(ctx.db, ana, LATER)).toEqual({ brand: "BRAS_DIGITAL", product: "Brás Digital" });
    await expect(answerSurvey(ctx.db, ana, { ...answer(1), bargainCents: 500 }, LATER)).rejects.toThrow(/subir/);
    await answerSurvey(ctx.db, ana, answer(1), LATER);
    expect(await pendingSurvey(ctx.db, ana, LATER)).toBeNull();
    await expect(answerSurvey(ctx.db, ana, answer(1), LATER)).rejects.toThrow();
    const rows = await ctx.db.select().from(priceSurveyResponses);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]!).sort()).toEqual(["bargainCents", "brand", "disappointment", "expensiveCents", "id", "month", "tooCheapCents", "tooExpensiveCents"]);
    // Lojista do seed: marca da loja; quem não responde (Master, fornecedor) não vê.
    expect((await pendingSurvey(ctx.db, ctx.actors.mantos, LATER))?.brand).toMatch(/SUPERDROP|NEXTLEVEL_COMMERCE/);
    expect(await pendingSurvey(ctx.db, ctx.actors.supplier, LATER)).toBeNull();
    expect(await pendingSurvey(ctx.db, ctx.actors.master, LATER)).toBeNull();
  });

  it("'agora não' não pergunta de novo; marca fora da lista não vê", async () => {
    await saveSurveySettings(ctx.db, ctx.actors.master, { ...DEFAULT_SURVEY, enabled: true, brands: ["BRAS_DIGITAL"] });
    const ana = await membro(0);
    await dismissSurvey(ctx.db, ana, LATER);
    expect(await pendingSurvey(ctx.db, ana, LATER)).toBeNull();
    expect(await pendingSurvey(ctx.db, ctx.actors.mantos, LATER)).toBeNull();
  });

  it("o Master vê só a soma e só a partir do mínimo de respostas", async () => {
    await saveSurveySettings(ctx.db, ctx.actors.master, { ...DEFAULT_SURVEY, enabled: true, minResponsesToShow: 3 });
    const pessoas = [await membro(0), await membro(1), await membro(2)];
    await answerSurvey(ctx.db, pessoas[0]!, answer(1), LATER);
    await answerSurvey(ctx.db, pessoas[1]!, answer(2), LATER);
    let bras = (await surveyResults(ctx.db, ctx.actors.master)).results.find((r) => r.brand === "BRAS_DIGITAL")!;
    expect(bras).toMatchObject({ responses: 2, shown: false, medians: null });
    await answerSurvey(ctx.db, pessoas[2]!, { ...answer(3), disappointment: "NADA" }, LATER);
    bras = (await surveyResults(ctx.db, ctx.actors.master)).results.find((r) => r.brand === "BRAS_DIGITAL")!;
    expect(bras).toMatchObject({ responses: 3, shown: true, medians: { tooCheap: 2_000, bargain: 4_000, expensive: 8_000, tooExpensive: 16_000 }, veryDisappointedPct: 67 });
    await expect(surveyResults(ctx.db, ctx.actors.arena)).rejects.toThrow();
    await expect(saveSurveySettings(ctx.db, ctx.actors.arena, DEFAULT_SURVEY)).rejects.toThrow();
    expect(await ctx.db.select().from(users).where(eq(users.id, pessoas[0]!.userId))).toHaveLength(1);
  });
});
