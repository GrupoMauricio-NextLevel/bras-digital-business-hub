import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { seedCommerceDemo } from "@/db/commerce-demo";
import { categories, products, stores } from "@/db/schema";
import { createProduct } from "@/lib/domain/products";
import { DEGRAUS, funilEcommerce, ondeParou, type Degrau } from "@/lib/domain/funil-ecommerce";

const tudo = (v: boolean) => Object.fromEntries(DEGRAUS.map((d) => [d.key, v])) as Record<Degrau, boolean>;

/** Funil de ativação da E-commerce (D176). */
describe("funil de ativação da E-commerce", () => {
  it("onde a loja parou: o primeiro degrau que falta, na ordem", () => {
    expect(ondeParou({ ...tudo(true) })).toBeNull();
    expect(ondeParou({ ...tudo(false), CADASTRO: true })).toBe("PRODUTO");
    expect(ondeParou({ ...tudo(true), PAGAMENTO: false, PRIMEIRA_VENDA: false })).toBe("PAGAMENTO");
    expect(ondeParou({ ...tudo(true), ASSINANTE: false })).toBe("ASSINANTE");
  });

  it("no banco: só lojas da E-commerce, funil cumulativo que nunca cresce, cada parada com o próximo passo", async () => {
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
});
