import { beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { freshDb } from "./setup";
import { runIntegrityReport } from "@/lib/domain/integrity";
import { inventory } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

describe("FD: relatório de integridade (somente leitura)", () => {
  it("dados de demonstração saem limpos ou mostram exatamente o que viola", async () => {
    const r = await runIntegrityReport(ctx.db);
    const bad = r.checks.filter((c) => c.violations > 0).map((c) => `${c.key}:${c.violations}`);
    expect(bad).toEqual([]);
  });
  it("detecta estoque reservado maior que o físico sem alterar nada", async () => {
    const row = (await ctx.db.select().from(inventory).limit(1))[0]!;
    await ctx.db.update(inventory).set({ reserved: row.onHand + 5 }).where(eq(inventory.variantId, row.variantId));
    const r = await runIntegrityReport(ctx.db);
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.key === "stock-reserved")!.sample).toContain(row.variantId);
    const after = (await ctx.db.select().from(inventory).where(eq(inventory.variantId, row.variantId)))[0]!;
    expect(after.reserved).toBe(row.onHand + 5);
    await ctx.db.execute(sql`select 1`);
  });
});
