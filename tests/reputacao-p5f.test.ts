import { describe, expect, it } from "vitest";
import { DEFAULT_REPUTATION, tierOf } from "@/lib/domain/cargas/reputacao";
import { freshDb } from "./setup";
import { reputationBoard } from "@/lib/domain/cargas/reputacao";

/** D134 (fase P5F): reputação Bronze, Prata e Ouro com números conhecidos. */
describe("reputação do parceiro de transporte", () => {
  it("níveis e o que falta", () => {
    expect(tierOf({ deliveries: 40, rating: 4.8, ratings: 10, refusalPct: 5, notBoarded: 0 }, DEFAULT_REPUTATION).tier).toBe("OURO");
    const prata = tierOf({ deliveries: 12, rating: 4.2, ratings: 5, refusalPct: 15, notBoarded: 0 }, DEFAULT_REPUTATION);
    expect(prata.tier).toBe("PRATA");
    expect(prata.next?.missing.length).toBe(3);
    const bronze = tierOf({ deliveries: 2, rating: null, ratings: 0, refusalPct: 0, notBoarded: 0 }, DEFAULT_REPUTATION);
    expect(bronze).toMatchObject({ tier: "BRONZE", next: { tier: "PRATA" } });
    expect(bronze.next!.missing[0]).toMatch(/8 entrega/);
  });
  it("quadro só para o Master", async () => {
    const ctx = await freshDb();
    expect((await reputationBoard(ctx.db, ctx.actors.master)).rows).toBeInstanceOf(Array);
    await expect(reputationBoard(ctx.db, ctx.actors.arena)).rejects.toThrow();
  });
});
