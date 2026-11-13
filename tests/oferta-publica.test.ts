import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { commercePlansView, ofertaPublica } from "@/lib/domain/commerce-plans";
import { activeDoor } from "@/lib/domain/precos/porta-entrada";
import { turnEverythingOnInDemo } from "@/db/demo-ligar-tudo";

const classica = { trialDays: 3, firstPeriodCents: 990, feeHolidayMonths: 3, version: 1 };

/** O que a página promete é o que toda loja nova recebe no cadastro (D177). */
describe("oferta pública da Commerce", () => {
  it("sem porta: oferta clássica; porta para todos: termos da porta; porta em experimento: só o que é comum", () => {
    expect(ofertaPublica(classica, null, false)).toEqual(classica);
    expect(ofertaPublica(classica, { trialDays: 7, version: 2 }, false)).toEqual({ trialDays: 7, firstPeriodCents: null, feeHolidayMonths: 0, version: 2 });
    expect(ofertaPublica(classica, { trialDays: 7, version: 2 }, true)).toEqual({ trialDays: 3, firstPeriodCents: null, feeHolidayMonths: 0, version: 1 });
    expect(ofertaPublica(classica, { trialDays: 0, version: 2 }, false)).toBeNull(); // porta no grátis: nada de "dias grátis"
    expect(ofertaPublica(null, { trialDays: 7, version: 2 }, true)).toBeNull(); // metade sem oferta: não promete teste
  });

  it("no banco: com a porta ligada na demonstração, a página mostra os dias da porta, não os da oferta clássica", async () => {
    const { db } = await freshDb();
    const antes = (await commercePlansView(db)).offer;
    await turnEverythingOnInDemo(db);
    const porta = await activeDoor(db, "NEXTLEVEL_COMMERCE");
    const depois = (await commercePlansView(db)).offer;
    const experimento = await db.query.experiments.findFirst({ where: (e, { and, eq }) => and(eq(e.piece, "PORTA_COMMERCE"), eq(e.status, "RODANDO")) });
    if (!porta) { expect(depois).toEqual(antes); return; }
    // Com a porta, ninguém promete o 1º mês por R$ 9,90 (quem cai na porta não tem). Dias: os da porta, ou o mínimo comum no experimento.
    expect(depois?.firstPeriodCents ?? null).toBeNull();
    const esperado = experimento ? Math.min(porta.trialDays, antes?.trialDays ?? 0) : porta.trialDays;
    expect(depois?.trialDays ?? 0).toBe(esperado);
  });
});
