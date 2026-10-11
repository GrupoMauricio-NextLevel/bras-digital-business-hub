import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { crossOpportunities } from "@/db/schema";
import { newId } from "@/lib/ids";
import { ecosystemIndex, ecosystemTower, updateOpportunity } from "@/lib/domain/ecossistema/torre";

/** D135 (fase P5M): Torre do Ecossistema e fila de oportunidades. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("Torre do Ecossistema", () => {
  it("índice com números conhecidos", () => {
    const p = new Map([["1", new Set(["SUPERDROP"])], ["2", new Set(["SUPERDROP", "BRAS_DIGITAL"])], ["3", new Set(["SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"])], ["4", new Set(["BRAS_DIGITAL"])]]);
    const i = ecosystemIndex(p);
    expect(i).toMatchObject({ total: 4, one: 2, two: 1, threePlus: 1, multiPct: 50 });
    expect(i.pairs[0]).toEqual({ pair: "BRAS_DIGITAL + SUPERDROP", n: 2 });
  });

  it("fila: quem mexe vira dono; 'ativou' entra no placar do mês; só o Master", async () => {
    await ctx.db.insert(crossOpportunities).values({ id: newId("opp"), key: "LOJA_PARA_BRAS:teste", rule: "LOJA_PARA_BRAS", fromBrand: "SUPERDROP", toBrand: "BRAS_DIGITAL", entityType: "store", entityId: "teste" });
    let t = await ecosystemTower(ctx.db, ctx.actors.master);
    const o = t.queue.find((q) => q.key === "LOJA_PARA_BRAS:teste")!;
    expect(o.status).toBe("NOVA");
    await updateOpportunity(ctx.db, ctx.actors.master, o.id, { status: "ATIVOU" });
    t = await ecosystemTower(ctx.db, ctx.actors.master);
    expect(t.board[0]?.n).toBe(1);
    expect(t.counts.ATIVOU).toBe(1);
    await expect(ecosystemTower(ctx.db, ctx.actors.arena)).rejects.toThrow();
    await expect(updateOpportunity(ctx.db, ctx.actors.supplier, o.id, { status: "NOVA" })).rejects.toThrow();
  });
});
