import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { jobRuns } from "@/db/schema";
import { jobStatus, runJob } from "@/lib/domain/job-runs";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("Rotinas agendadas", () => {
  it("falha de uma etapa não impede as outras e o resultado fica registrado numa linha só", async () => {
    let ran = 0;
    const r = await runJob(ctx.db, "finance", [
      { name: "a", run: async () => { ran++; return 1; } },
      { name: "b", run: async () => { throw new Error("banco indisponível para joao@x.com token=APP_USR-1234567890abcdef1234567890"); } },
      { name: "c", run: async () => { ran++; return 2; } },
    ]);
    expect(ran).toBe(2);
    expect(r.ok).toBe(false);
    expect(r.failed).toHaveLength(1);
    const rows = await ctx.db.select().from(jobRuns).where(eq(jobRuns.job, "finance"));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.ok).toBe(false);
    expect(rows[0]!.detail).toMatch(/b: FALHOU/);
    expect(rows[0]!.detail).not.toMatch(/joao@x\.com|APP_USR/); // sem e-mail nem ficha no registro
  });

  it("status: sem execução = atrasada; execução recente ok = em dia; passou do dobro do intervalo = atrasada", async () => {
    const now = new Date();
    expect((await jobStatus(ctx.db, now)).every((j) => j.late)).toBe(true);
    await runJob(ctx.db, "expire-reservations", [{ name: "x", run: async () => 1 }]);
    await runJob(ctx.db, "finance", [{ name: "x", run: async () => 1 }]);
    expect((await jobStatus(ctx.db, now)).every((j) => !j.late && j.lastOk)).toBe(true);
    const later = new Date(now.getTime() + 25 * 60_000); // 25 min: reservas (10 min) atrasadas, financeiro (24 h) em dia
    const s = Object.fromEntries((await jobStatus(ctx.db, later)).map((j) => [j.job, j.late]));
    expect(s).toEqual({ "expire-reservations": true, finance: false });
  });

  it("mantém só as últimas 200 execuções de cada rotina", async () => {
    for (let i = 0; i < 203; i++) await runJob(ctx.db, "expire-reservations", [{ name: "x", run: async () => 1 }]);
    expect((await ctx.db.select().from(jobRuns).where(eq(jobRuns.job, "expire-reservations"))).length).toBe(200);
  });
});
