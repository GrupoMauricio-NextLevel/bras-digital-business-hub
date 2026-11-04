import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { platformSettings, products } from "@/db/schema";
import { BENEFICIOS_PADRAO, beneficiosPorPlano, exigirVagaDePessoa, exigirVagaDeProduto, salvarBeneficios, usoDoPlano } from "@/lib/domain/beneficios-plano";
import { createProduct } from "@/lib/domain/products";
import { comBeneficios } from "@/lib/domain/placar";
import { SUMULA_PADRAO } from "@/lib/marcas/placar-seed";
import { signupMember } from "@/lib/domain/store-access";
import { inviteStaff } from "@/lib/domain/store-team";
import type { Actor } from "@/lib/domain/access";

/** Benefícios por plano (D247): tabela única, travas que não tiram nada de quem já tem, placar coerente. */
describe("benefícios por plano", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const loja = async () => {
    const r = await signupMember(ctx.db, { storeName: "Loja Limite", ownerName: "Ana Lima", email: "ana@limite.com", password: "senha-segura-1", taxId: "529.982.247-25", brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_START", cycle: "MONTHLY" } as never);
    return r;
  };
  const produto = (sku: string) => ({ name: `Camiseta ${sku}`, sku, description: "", categoryName: "Moda", images: [], costCents: 1000, suggestedPriceCents: 3000, minimumPriceCents: 2000, sizes: [{ size: "M", initialStock: 5 }] });

  it("padrão aprovado (D226) com a IA vinda das cotas do Maurício", async () => {
    const b = await beneficiosPorPlano(ctx.db);
    expect([b.COMMERCE_START.produtos, b.COMMERCE_PRO.produtos, b.COMMERCE_SCALE.produtos]).toEqual([300, 1000, null]);
    expect([b.COMMERCE_START.pessoas, b.COMMERCE_PRO.pessoas, b.COMMERCE_SCALE.pessoas]).toEqual([3, 6, 12]);
    expect([b.COMMERCE_START.ia, b.COMMERCE_PRO.ia, b.COMMERCE_SCALE.ia]).toEqual([40, 350, 1200]);
  });

  it("trava de produto: no limite não cadastra; quem já passou continua com tudo", async () => {
    const r = await loja();
    await ctx.db.insert(platformSettings).values({ key: "ecommerce.beneficios-plano", value: { ...BENEFICIOS_PADRAO, COMMERCE_START: { ...BENEFICIOS_PADRAO.COMMERCE_START, produtos: 2 } } });
    await createProduct(ctx.db, { storeId: r.storeId } as never, produto("A1"));
    await createProduct(ctx.db, { storeId: r.storeId } as never, produto("A2"));
    await expect(createProduct(ctx.db, { storeId: r.storeId } as never, produto("A3"))).rejects.toThrow(/até 2 produtos/);
    expect((await usoDoPlano(ctx.db, r.storeId)).produtos).toEqual({ usados: 2, limite: 2 });
    // Baixar o limite não apaga nem arquiva nada.
    await ctx.db.update(platformSettings).set({ value: { ...BENEFICIOS_PADRAO, COMMERCE_START: { ...BENEFICIOS_PADRAO.COMMERCE_START, produtos: 1 } } }).where(eq(platformSettings.key, "ecommerce.beneficios-plano"));
    expect((await ctx.db.select().from(products).where(eq(products.storeId, r.storeId))).every((p) => p.status === "ACTIVE")).toBe(true);
    // Arquivar libera vaga.
    await ctx.db.update(platformSettings).set({ value: BENEFICIOS_PADRAO }).where(eq(platformSettings.key, "ecommerce.beneficios-plano"));
    await expect(exigirVagaDeProduto(ctx.db, r.storeId)).resolves.toBeUndefined();
  });

  it("trava de pessoas: Start tem 3 contando o dono", async () => {
    const r = await loja();
    const dono = { userId: r.userId, role: "STORE_OWNER", organizationId: "", supplierId: null, storeId: r.storeId } as unknown as Actor;
    await inviteStaff(ctx.db, dono, { name: "Bia", email: "bia@limite.com", password: "senha-segura-1" } as never);
    await inviteStaff(ctx.db, dono, { name: "Caio", email: "caio@limite.com", password: "senha-segura-1" } as never);
    await expect(exigirVagaDePessoa(ctx.db, r.storeId)).rejects.toThrow(/até 3 pessoas/);
  });

  it("só o Master comercial ou financeiro salva; o placar passa a usar a tabela", async () => {
    await expect(salvarBeneficios(ctx.db, ctx.actors.arena, BENEFICIOS_PADRAO)).rejects.toThrow();
    const s = comBeneficios(SUMULA_PADRAO, { COMMERCE_START: { produtos: 250, pessoas: 4, ia: 50, temaPago: true }, COMMERCE_PRO: { produtos: 900, pessoas: 6, ia: 350, temaPago: true }, COMMERCE_SCALE: { produtos: null, pessoas: 12, ia: 1200, temaPago: true } });
    const it = (k: string) => s.itens.find((i) => i.key === k)!.nextlevel;
    expect(it("produtos")).toEqual({ entrada: "250", intermediario: "900", avancado: "sem limite" });
    expect(it("pessoas").entrada).toBe("4"); expect(it("ia").entrada).toBe("50"); expect(it("tema").entrada).toBe("sim");
  });
});
