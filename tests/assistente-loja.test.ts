import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { orders, stores } from "@/db/schema";
import { falaDePedido, responderNaLoja } from "@/lib/domain/assistente-loja";
import { listStoreCatalog } from "@/lib/domain/catalog";

/** Assistente da loja (D239): responde com produtos e pedidos reais; o resto vai para os guias. */
describe("assistente da loja", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  let slug = ""; let storeId = "";
  beforeAll(async () => {
    ctx = await freshDb();
    const rows = await ctx.db.select({ id: stores.id, slug: stores.slug }).from(stores).where(eq(stores.status, "ACTIVE"));
    for (const r of rows) if ((await listStoreCatalog(ctx.db, r.id)).length) { slug = r.slug; storeId = r.id; break; }
  });
  it("reconhece pergunta de pedido", () => {
    expect(falaDePedido("Onde está meu pedido?")).toBe(true);
    expect(falaDePedido("Tem camisa azul?")).toBe(false);
  });
  it("acha produto do catálogo pelo nome, com preço e link", async () => {
    const p = (await listStoreCatalog(ctx.db, storeId))[0]!;
    const palavra = p.product.name.split(/\s+/).find((w) => w.length >= 4)!;
    const r = await responderNaLoja(ctx.db, slug, `vocês têm ${palavra}?`);
    expect(r.tipo).toBe("produtos");
    if (r.tipo === "produtos") { expect(r.produtos.length).toBeGreaterThan(0); expect(r.produtos[0]!.href).toContain(`/store/${slug}/product/`); }
  });
  it("pedido: pede número e e-mail; com os dois certos, mostra a etapa real", async () => {
    expect((await responderNaLoja(ctx.db, slug, "onde está meu pedido?")).tipo).toBe("pedir-pedido");
    const o = await ctx.db.query.orders.findFirst({ where: eq(orders.storeId, storeId) });
    if (!o?.customerEmail) return;
    const r = await responderNaLoja(ctx.db, slug, `meu pedido ${o.number} ${o.customerEmail}`);
    expect(r.tipo).toBe("pedido");
    expect((await responderNaLoja(ctx.db, slug, `meu pedido ${o.number} outro@email.com`)).tipo).toBe("pedir-pedido");
  });
  it("sem nada a ver com a loja, devolve 'nada' (vai para os guias)", async () => {
    expect((await responderNaLoja(ctx.db, slug, "olá bom dia")).tipo).toBe("nada");
    expect((await responderNaLoja(ctx.db, "nao-existe", "camisa")).tipo).toBe("nada");
  });
});
