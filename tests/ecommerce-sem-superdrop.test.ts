import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { ecosystemBar, groupSegments, saveEcoSettings } from "@/lib/domain/ecossistema/lancador";
import { attentionFor, stageLabelsFor, stagesFor } from "@/lib/domain/after-sales";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";
import { analiseLiberada } from "@/lib/features";

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

  it("Master vê pedido de loja E-commerce com o vocabulário dela (D169)", () => {
    const pagina = readFileSync(join(process.cwd(), "src/app/master/orders/[id]/page.tsx"), "utf8");
    expect(pagina).toMatch(/independent=\{modality === "INDEPENDENT"\}/);
    expect(pagina).toMatch(/marca === "NEXTLEVEL_COMMERCE" \? "NextLevel E-commerce" : "SuperDrop"/);
    const detalhe = readFileSync(join(process.cwd(), "src/components/shared/order-detail.tsx"), "utf8");
    expect(detalhe).toMatch(/const quemLoja = role === "STORE_OWNER" \? "Sua loja" : "Loja"/);
  });

  it("análise de vendas liberada na E-commerce, sem cartão de oferta do SuperDrop (D170)", () => {
    expect(analiseLiberada("STORE_SUBDOMAIN", true)).toBe(true);
    expect(analiseLiberada("STORE_SUBDOMAIN", false)).toBe(false);
    expect(analiseLiberada("STORE_OWN", false)).toBe(true);
  });

  it("nome público do plano, sem 'Commerce'", () => {
    expect(nomePlanoEc("Commerce Start")).toBe("Plano Start");
    expect(nomePlanoEc("COMMERCE_SCALE")).toBe("Plano Scale");
  });
});
