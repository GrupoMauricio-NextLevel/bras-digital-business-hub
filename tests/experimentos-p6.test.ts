import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { bucketOf, compareRates, createExperiment, inTreatment, readExperiment, setExperimentStatus } from "@/lib/domain/experimentos";

/** D136 (fase P6): experimento com controle × grupo novo e leitura com incerteza. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("experimentos", () => {
  it("sorteio fixo e comparação explicada", () => {
    expect(bucketOf("exp1", "loja1")).toBe(bucketOf("exp1", "loja1"));
    expect(compareRates({ n: 1000, hits: 100 }, { n: 1000, hits: 160 })).toMatchObject({ controlPct: 10, treatmentPct: 16, diffPts: 6, significant: true });
    expect(compareRates({ n: 20, hits: 2 }, { n: 20, hits: 3 }).significant).toBe(false);
    expect(compareRates({ n: 20, hits: 2 }, { n: 20, hits: 3 }).verdict).toMatch(/pode ser acaso/);
  });

  it("sem experimento todos recebem; rodando só o grupo novo; encerrar exige leitura e decisão; um por peça", async () => {
    expect(await inTreatment(ctx.db, "PORTA_SUPERDROP", "qualquer")).toBe(true);
    const { id } = await createExperiment(ctx.db, ctx.actors.master, { piece: "PORTA_SUPERDROP", name: "Teste reverso × hoje", treatmentPct: 50, primaryMetric: "ATIVACAO_30", guardMetric: "RECEITA_POR_CLIENTE", minPerGroup: 10, readAt: "2026-12-31" });
    await setExperimentStatus(ctx.db, ctx.actors.master, id, { start: true });
    const subjects = Array.from({ length: 200 }, (_, i) => `loja${i}`);
    const yes = (await Promise.all(subjects.map((s) => inTreatment(ctx.db, "PORTA_SUPERDROP", s)))).filter(Boolean).length;
    expect(yes).toBeGreaterThan(60); expect(yes).toBeLessThan(140);
    const { id: id2 } = await createExperiment(ctx.db, ctx.actors.master, { piece: "PORTA_SUPERDROP", name: "Outro", treatmentPct: 50, primaryMetric: "PAGANTE_30", guardMetric: "SAIDA_30", minPerGroup: 10, readAt: "2026-12-31" });
    await expect(setExperimentStatus(ctx.db, ctx.actors.master, id2, { start: true })).rejects.toThrow(/Já existe/);
    expect((await readExperiment(ctx.db, ctx.actors.master, id)).ready).toBe(false);
    await expect(setExperimentStatus(ctx.db, ctx.actors.master, id, { end: true, reading: "curta", decision: "x" })).rejects.toThrow(/leitura/);
    await setExperimentStatus(ctx.db, ctx.actors.master, id, { end: true, reading: "O grupo novo vendeu mais na primeira semana, mas com poucos clientes.", decision: "Repetir com mais lojas" });
    expect(await inTreatment(ctx.db, "PORTA_SUPERDROP", "loja1")).toBe(true);
    await expect(createExperiment(ctx.db, ctx.actors.arena, { piece: "BENEFICIOS", name: "x x x", treatmentPct: 50, primaryMetric: "ATIVACAO_30", guardMetric: "SAIDA_30", minPerGroup: 10, readAt: "2026-12-31" })).rejects.toThrow();
  });
});
