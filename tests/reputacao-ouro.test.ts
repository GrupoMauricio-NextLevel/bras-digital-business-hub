import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { seedDemoCargas } from "@/db/demo-cargas";
import { carrierCatalog } from "@/lib/domain/cargas/cargas";
import { commissionWithTier, DEFAULT_REPUTATION } from "@/lib/domain/cargas/reputacao";

/** D139: vantagens do nível Ouro (comissão menor e prioridade com selo) e os dados fictícios de demonstração. */
describe("reputação Ouro", () => {
  it("comissão menor só no Ouro, nunca negativa", () => {
    expect(commissionWithTier(1_000, "OURO", DEFAULT_REPUTATION)).toBe(900);
    expect(commissionWithTier(1_000, "PRATA", DEFAULT_REPUTATION)).toBe(1_000);
    expect(commissionWithTier(50, "OURO", DEFAULT_REPUTATION)).toBe(0);
  });
  it("demonstração: Ouro, Prata e Bronze; Ouro primeiro na lista, sem esconder as outras", async () => {
    const ctx = await freshDb();
    expect(await seedDemoCargas(ctx.db)).toBe(true);
    expect(await seedDemoCargas(ctx.db)).toBe(false);
    const list = await carrierCatalog(ctx.db, {});
    const demo = list.filter((c) => c.name.includes("(demonstração)"));
    expect(demo.map((c) => c.tier)).toEqual(["OURO", "PRATA", "BRONZE"]);
    expect(list[0]!.tier).toBe("OURO");
  });
});
