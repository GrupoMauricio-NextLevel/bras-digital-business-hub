import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { seedCommerceDemo } from "@/db/commerce-demo";
import { categories, products, stores } from "@/db/schema";
import { createProduct } from "@/lib/domain/products";
import { DEGRAUS, funilEcommerce, ondeParou, type Degrau } from "@/lib/domain/funil-ecommerce";

const tudo = (v: boolean) => Object.fromEntries(DEGRAUS.map((d) => [d.key, v])) as Record<Degrau, boolean>;

/** Funil de ativação da Commerce (D176). */
describe("funil de ativação da Commerce", () => {
  it("onde a loja parou: o primeiro degrau que falta, na ordem", () => {
    expect(ondeParou({ ...tudo(true) })).toBeNull();
    expect(ondeParou({ ...tudo(false), CADASTRO: true })).toBe("PRODUTO");
    expect(ondeParou({ ...tudo(true), PAGAMENTO: false, PRIMEIRA_VENDA: false })).toBe("PAGAMENTO");
    expect(ondeParou({ ...tudo(true), ASSINANTE: false })).toBe("ASSINANTE");
  });

  it("no banco: só lojas da Commerce, funil cumulativo que nunca cresce, cada parada com o próximo passo", async () => {
    const { db, actors } = await freshDb();
    await seedCommerceDemo(db);
    const f = await funilEcommerce(db, actors.master);
    expect(f.total).toBeGreaterThan(0);
    expect(f.degraus[0]!.n).toBe(f.total);
    for (let i = 1; i < f.degraus.length; i++) expect(f.degraus[i]!.n).toBeLessThanOrEqual(f.degraus[i - 1]!.n);
    for (const l of f.paradas) expect(l.passo).toBeTruthy();
    // A loja do SuperDrop do seed não entra.
    const arena = (await db.query.stores.findFirst({ where: eq(stores.slug, "arena10") })) ?? null;
    if (arena) expect(f.paradas.some((l) => l.storeId === arena.id)).toBe(false);
    // Pagamento em modo demonstração não conta como conectado.
    const demoPay = (await db.select().from(stores).where(eq(stores.paymentStatus, "DEMO"))).map((s) => s.id);
    for (const l of f.paradas.filter((p) => demoPay.includes(p.storeId))) expect(l.feitos.PAGAMENTO).toBe(false);
  });

  it("só o Master", async () => {
    const { db, actors } = await freshDb();
    await expect(funilEcommerce(db, actors.arena)).rejects.toThrow();
  });

  it("primeiro produto sem categoria não trava: entra em \"Geral\" (loja nova ainda não tem categorias)", async () => {
    const { db, seed } = await freshDb();
    const { productId } = await createProduct(db, seed.supplierId, { name: "Blusa de linho", sku: "bl-geral-01", categoryName: "  ", costCents: 5900, suggestedPriceCents: 14990, minimumPriceCents: 11990, sizes: [{ size: "m", initialStock: 3 }] });
    const p = (await db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    const c = (await db.query.categories.findFirst({ where: eq(categories.id, p.categoryId!) }))!;
    expect(c.name).toBe("Geral");
  });

  it("loja independente: produto ativo já entra à venda na própria loja; rascunho não; fornecedor do SuperDrop não muda", async () => {
    const { db, seed } = await freshDb();
    await seedCommerceDemo(db);
    const { stores: st, storeProducts: sp } = await import("@/db/schema");
    const { isNull, and: e } = await import("drizzle-orm");
    const loja = (await db.select().from(st).where(e(isNull(st.networkId), isNull(st.showcaseTheme))))[0]!;
    const base = { costCents: 5900, suggestedPriceCents: 14990, minimumPriceCents: 11990, sizes: [{ size: "m", initialStock: 3 }], categoryName: "" };
    const ativo = await createProduct(db, { storeId: loja.id }, { ...base, name: "Blusa à venda", sku: "bl-venda-01" });
    const rasc = await createProduct(db, { storeId: loja.id }, { ...base, name: "Blusa rascunho", sku: "bl-rasc-01", status: "DRAFT" });
    const listado = async (id: string) => (await db.select().from(sp).where(eq(sp.productId, id))).filter((r) => r.storeId === loja.id);
    expect(await listado(ativo.productId)).toMatchObject([{ active: true, priceCents: 14990 }]);
    expect(await listado(rasc.productId)).toEqual([]);
    const forn = await createProduct(db, seed.supplierId, { ...base, name: "Manto fornecedor", sku: "mf-01" });
    expect((await db.select().from(sp).where(eq(sp.productId, forn.productId))).length).toBe(0);
  });

  it("lembrete de ativação: uma vez por degrau, só depois do prazo, com o botão para a tela certa", async () => {
    const { db, actors } = await freshDb();
    await seedCommerceDemo(db);
    const { emailOutbox } = await import("@/db/schema");
    const { lembretesDeAtivacao } = await import("@/lib/domain/funil-ecommerce");
    const { like } = await import("drizzle-orm");
    const parada = (await funilEcommerce(db, actors.master)).paradas[0];
    expect(parada, "a demonstração tem ao menos uma loja parada num degrau").toBeTruthy();
    const criada = new Date(parada!.criadaEm);
    expect((await lembretesDeAtivacao(db, new Date(criada.getTime() + 3_600_000))).enviados).toBe(0); // no mesmo dia, nada
    const depois = new Date(criada.getTime() + 10 * 86_400_000);
    await lembretesDeAtivacao(db, depois);
    const ativacao = () => db.select().from(emailOutbox).where(like(emailOutbox.kind, "ATIVACAO_LOJA"));
    const emails = await ativacao();
    expect(emails.length).toBeGreaterThan(0);
    expect(emails[0]!.body).toMatch(/\/merchant\//);
    await lembretesDeAtivacao(db, depois); // repetir não reenvia
    expect((await ativacao()).length).toBe(emails.length);
  });
});
