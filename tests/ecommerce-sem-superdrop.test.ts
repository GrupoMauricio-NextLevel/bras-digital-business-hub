import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { ecosystemBar, groupSegments, saveEcoSettings } from "@/lib/domain/ecossistema/lancador";
import { attentionFor, stageLabelsFor, stagesFor } from "@/lib/domain/after-sales";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";

/** D164: nada de SuperDrop na NextLevel E-commerce (fio do grupo, pós-venda da loja independente, nome dos planos). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("E-commerce sem SuperDrop", () => {
  it("fio e lançador da E-commerce não listam o SuperDrop; o do SuperDrop continua igual", async () => {
    await saveEcoSettings(ctx.db, ctx.actors.master, { brands: ["NEXTLEVEL_COMMERCE", "SUPERDROP"] });
    const ec = (await ecosystemBar(ctx.db, "NEXTLEVEL_COMMERCE"))!;
    const marcas = [...ec.segments.map((s) => s.brand), ...ec.all.map((i) => i.brand), ...ec.recommended.map((i) => i.brand)];
    expect(marcas).not.toContain("SUPERDROP");
    expect(groupSegments("NEXTLEVEL_COMMERCE").map((s) => s.brand)).not.toContain("SUPERDROP");
    const sd = (await ecosystemBar(ctx.db, "SUPERDROP"))!;
    expect(sd.segments.map((s) => s.brand)).toEqual(groupSegments("SUPERDROP").map((s) => s.brand));
  });

  it("pós-venda da loja independente: sem recarga nem Central", () => {
    expect(stagesFor(true)).not.toContain("AWAITING_FUNDS");
    expect(stagesFor(false)).toContain("AWAITING_FUNDS");
    expect(stagesFor(true).map((s) => stageLabelsFor(true)[s].title).join(" ")).not.toMatch(/Central|recarga/);
    expect(attentionFor("IN_DISPATCH", 50, true)).not.toMatch(/Central/);
    expect(attentionFor("IN_DISPATCH", 50)).toMatch(/Central/);
  });

  it("nome público do plano, sem 'Commerce'", () => {
    expect(nomePlanoEc("Commerce Start")).toBe("Plano Start");
    expect(nomePlanoEc("COMMERCE_SCALE")).toBe("Plano Scale");
  });
});
