import { describe, expect, it } from "vitest";
import { count, eq, isNull } from "drizzle-orm";
import { freshDb } from "./setup";
import { crossOpportunities, organizations, qaRuns, stores } from "@/db/schema";
import { ORDEM_MARCAS, mapaDoEcossistema, raioDoNo, saudeDaMarca } from "@/lib/domain/ecossistema/mapa";
import { ecosystemIndex, presenceByDocument } from "@/lib/domain/ecossistema/torre";
import { NAV, navDoMasterPorMarca } from "@/lib/nav";

const agora = new Date("2026-10-20T12:00:00Z");
const conferido = { ok: true, quando: "2026-10-19T12:00:00Z", detalhe: null };

/** Mapa do Ecossistema vivo (D175). */
describe("mapa do ecossistema", () => {
  it("saúde de cada marca: cada nível com o motivo em texto", () => {
    const base = { noAr: true, site: conferido, errosAbertos: 0, clientes: 5, vendas: 3 };
    expect(saudeDaMarca(base, agora).nivel).toBe("BEM");
    expect(saudeDaMarca({ ...base, noAr: false }, agora).nivel).toBe("PREPARACAO");
    expect(saudeDaMarca({ ...base, site: { ok: false, quando: conferido.quando, detalhe: "tempo esgotado" } }, agora)).toMatchObject({ nivel: "ATENCAO", motivo: expect.stringContaining("tempo esgotado") });
    expect(saudeDaMarca({ ...base, errosAbertos: 2 }, agora)).toMatchObject({ nivel: "ATENCAO", motivo: expect.stringContaining("2 erro") });
    expect(saudeDaMarca({ ...base, site: { ok: null, quando: null, detalhe: null } }, agora).nivel).toBe("OBSERVAR");
    expect(saudeDaMarca({ ...base, site: { ...conferido, quando: "2026-10-01T00:00:00Z" } }, agora).nivel).toBe("OBSERVAR");
    expect(saudeDaMarca({ ...base, vendas: 0 }, agora).nivel).toBe("OBSERVAR");
    expect(saudeDaMarca({ ...base, clientes: 0, vendas: null }, agora).nivel).toBe("OBSERVAR");
    for (const n of [0, 1, 50, 1000]) { const r = raioDoNo(n, 1000); expect(r).toBeGreaterThanOrEqual(26); expect(r).toBeLessThanOrEqual(58); }
  });

  it("no banco: marcas na ordem do foco, números reais, conferência dos endereços e pares da Torre; abrir não grava nada", async () => {
    const { db, actors } = await freshDb();
    await db.insert(qaRuns).values({ id: "qa_teste", kind: "DOMINIOS", results: [{ key: "https://superdrop.com.br", url: "https://superdrop.com.br", status: 500, ms: 10, ok: false, expected: "sistema no ar", detail: "erro 500" }], ok: 0, failed: 1, startedBy: null, createdAt: "2026-10-20T10:00:00Z" });
    const opps = async () => (await db.select({ n: count() }).from(crossOpportunities))[0]!.n;
    const antes = await opps();
    const mapa = await mapaDoEcossistema(db, actors.master, agora, { ...process.env, BRAND_URL_SUPERDROP: "https://superdrop.com.br" });
    expect(await opps()).toBe(antes);
    expect(mapa.marcas.map((m) => m.code)).toEqual([...ORDEM_MARCAS]);
    const sd = mapa.marcas.find((m) => m.code === "SUPERDROP")!;
    const [lojasSd] = await db.select({ n: count() }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(isNull(stores.showcaseTheme)).groupBy(organizations.brand).having(eq(organizations.brand, "SUPERDROP"));
    expect(sd.clientes).toBe(lojasSd?.n ?? 0);
    expect(sd.vendas!.pedidos).toBeGreaterThan(0);
    expect(sd.site).toMatchObject({ ok: false, detalhe: "erro 500" });
    expect(sd.saude.nivel).toBe("ATENCAO");
    const idx = ecosystemIndex(await presenceByDocument(db));
    expect(mapa.emVariasMarcas).toBe(idx.two + idx.threePlus);
    expect(mapa.pares.reduce((s, p) => s + p.n, 0)).toBe(idx.pairs.reduce((s, p) => s + p.n, 0));
    expect(JSON.stringify(mapa)).not.toMatch(/@|cpf|cnpj/i); // só contagens, nenhum dado pessoal
  });

  it("só o Master (dono ou comercial); lojista não abre; o item do menu fica em 'Todas as marcas'", async () => {
    const { db, actors } = await freshDb();
    await expect(mapaDoEcossistema(db, actors.arena)).rejects.toThrow();
    await expect(mapaDoEcossistema(db, { ...actors.master, masterFunction: "FINANCEIRO" })).rejects.toThrow();
    await expect(mapaDoEcossistema(db, { ...actors.master, masterFunction: "COMERCIAL" })).resolves.toBeTruthy();
    expect(navDoMasterPorMarca(NAV.NEXTLEVEL_MASTER.items, null).some((i) => i.href === "/master/mapa")).toBe(true);
    expect(navDoMasterPorMarca(NAV.NEXTLEVEL_MASTER.items, "SUPERDROP").some((i) => i.href === "/master/mapa")).toBe(false);
  });
});
