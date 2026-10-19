import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { FEATURES, OFFER_FEATURES } from "@/lib/features";
import { montarPerfil, perfilDaLoja, recursosDoPlano, salvarTabelaRecursos, tabelaRecursos, TABELA_PADRAO, SO_SUPERDROP } from "@/lib/domain/perfil-loja";
import { isIndependentStore as independenteA } from "@/lib/domain/independent";
import { storeModality } from "@/lib/domain/order-policy";
import { stores } from "@/db/schema";

const sem = new Set<string>();

/** Perfil da loja (D172): uma resposta só para "que loja é esta e o que ela pode usar". */
describe("perfil da loja", () => {
  it("SuperDrop: o que a loja pode usar é exatamente a oferta dela, como antes (nada muda)", () => {
    for (const oferta of ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as const) {
      const p = montarPerfil({ store: { id: "s", offer: oferta }, marca: "SUPERDROP", modalidade: "NETWORK", plano: null, tabela: TABELA_PADRAO, direitos: sem });
      expect(p.pode).toEqual(OFFER_FEATURES[oferta]);
      expect(p).toMatchObject({ ecommerce: false, oferta, vocabulario: { produto: "SuperDrop", quemPrepara: "Central" } });
    }
  });

  it("E-commerce: sem oferta do SuperDrop; com o padrão do dono, tudo liberado menos saldo e etiqueta da Central", () => {
    for (const plano of [null, { productKey: "COMMERCE_START", status: "trial" }, { productKey: "COMMERCE_SCALE", status: "active" }]) {
      const p = montarPerfil({ store: { id: "s", offer: "STORE_SUBDOMAIN" }, marca: "NEXTLEVEL_COMMERCE", modalidade: "INDEPENDENT", plano, tabela: TABELA_PADRAO, direitos: sem });
      expect(p.oferta).toBeNull();
      for (const f of FEATURES) expect(p.pode[f]).toBe(!SO_SUPERDROP.includes(f));
      expect(p.vocabulario).toMatchObject({ produto: "NextLevel E-commerce", quemPrepara: "Sua loja", custoDebitado: null });
      expect(JSON.stringify(p.vocabulario)).not.toMatch(/SuperDrop|Central|saldo/);
    }
  });

  it("E-commerce: a tabela do Master manda; sem plano vale o Start; direito comprado soma", () => {
    const tabela = { ...TABELA_PADRAO, COMMERCE_START: ["catalog", "storefront"] as never[] };
    expect(recursosDoPlano(tabela, null).analytics).toBe(false);
    expect(recursosDoPlano(tabela, "COMMERCE_START").storefront).toBe(true);
    expect(recursosDoPlano(tabela, "COMMERCE_PRO").analytics).toBe(true);
    const comDireito = montarPerfil({ store: { id: "s", offer: "STORE_SUBDOMAIN" }, marca: "NEXTLEVEL_COMMERCE", modalidade: "INDEPENDENT", plano: null, tabela, direitos: new Set(["analytics", "wallet"]) });
    expect(comDireito.pode.analytics).toBe(true);
    expect(comDireito.pode.wallet).toBe(false); // recurso do SuperDrop nunca entra na E-commerce
  });

  it("no banco: lojas do SuperDrop do seed seguem a oferta; a tabela salva no Master vale e fica auditada", async () => {
    const { db, seed, actors } = await freshDb();
    const arena = (await db.query.stores.findFirst({ where: (s, { eq }) => eq(s.id, seed.stores.arena.id) }))!;
    const p = await perfilDaLoja(db, arena);
    expect(p.marca).toBe("SUPERDROP");
    expect(p.pode).toEqual(OFFER_FEATURES[arena.offer]);
    expect(await tabelaRecursos(db)).toEqual(TABELA_PADRAO);
    await salvarTabelaRecursos(db, actors.master, { ...TABELA_PADRAO, COMMERCE_START: ["catalog"] });
    expect((await tabelaRecursos(db)).COMMERCE_START).toEqual(["catalog"]);
    await expect(salvarTabelaRecursos(db, actors.master, { ...TABELA_PADRAO, COMMERCE_START: ["wallet"] })).rejects.toThrow();
    // Só o dono do Master ou a função financeira altera; suporte não.
    await expect(salvarTabelaRecursos(db, { ...actors.master, masterFunction: "SUPORTE" }, TABELA_PADRAO)).rejects.toThrow(/função/);
    const auditoria = await db.query.auditLog.findMany();
    expect(auditoria.some((a) => a.action === "ECOMMERCE_RECURSOS_POR_PLANO")).toBe(true);
  });

  it("'loja independente' é uma função só e concorda com a modalidade e com o perfil em todas as lojas do seed", async () => {
    const { db } = await freshDb();
    for (const s of await db.select().from(stores)) {
      const ind = await independenteA(db, s.id);
      expect(ind).toBe((await storeModality(db, s.id)) === "INDEPENDENT");
      expect((await perfilDaLoja(db, s)).independente).toBe(ind);
    }
  });
});
