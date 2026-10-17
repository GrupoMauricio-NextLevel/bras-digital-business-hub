import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { groupPriceTable } from "@/lib/domain/precos/tabela-grupo";
import { saveClubRules } from "@/lib/domain/club/regras";
import { getPriceBook } from "@/lib/domain/finance";

/** D123 (fase P0 do prompt de público e preço): a tabela de preços do grupo lê as fontes reais e só o Master vê. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("tabela de preços do grupo", () => {
  it("junta todas as marcas, cada valor com a fonte, e bate com a fonte", async () => {
    const { rows, divergences } = await groupPriceTable(ctx.db, ctx.actors.master);
    const brands = new Set(rows.map((r) => r.brand));
    for (const b of ["SuperDrop", "NextLevel E-commerce", "Brás Digital", "NextLevel Cargas", "Brás Digital Club", "Parceiros"]) expect(brands.has(b)).toBe(true);
    expect(rows.every((r) => r.source && r.editHref.startsWith("/"))).toBe(true);
    const book = await getPriceBook(ctx.db);
    expect(rows.find((r) => r.source === "price_book.offers.STORE_SUBDOMAIN" && r.kind === "MENSAL")!.cents).toBe(book.offers.STORE_SUBDOMAIN.monthlyCents);
    const start = rows.find((r) => r.source.startsWith("catalog:COMMERCE_START") && r.kind === "MENSAL")!;
    expect(start).toMatchObject({ cents: 14_900, status: "VALENDO" });
    expect(rows.find((r) => r.source.startsWith("catalog:BRAS_PRATA"))!.status).toBe("RASCUNHO");
    expect(rows.find((r) => r.item === "Excursão: taxa por fardo")!.status).toBe("DESLIGADO");
    expect(divergences.map((d) => d.topic)).toEqual(expect.arrayContaining(["Duas tabelas de preço", "Documento × sistema"]));
  });

  it("muda junto com a regra de origem; só o Master vê", async () => {
    await saveClubRules(ctx.db, ctx.actors.master, { pointsPerReal: 200 });
    const { rows } = await groupPriceTable(ctx.db, ctx.actors.master);
    expect(rows.find((r) => r.item === "Valor do ponto no resgate")!.value).toBe("200 pontos = R$ 1,00");
    await expect(groupPriceTable(ctx.db, ctx.actors.arena)).rejects.toThrow();
  });
});
