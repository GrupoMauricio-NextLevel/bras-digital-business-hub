import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { emailOutbox, orders, stores } from "@/db/schema";
import { assinarSessao, codigoDaJanela, entrarComCodigo, lerSessao, pedidosDoCliente, pedirCodigo } from "@/lib/domain/conta-cliente";

/** Minha conta do cliente final (D240): código no e-mail, sessão assinada por loja, só os pedidos daquele e-mail. */
describe("conta do cliente final", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeAll(async () => { ctx = await freshDb(); });
  const AGORA = new Date("2026-11-04T15:00:00Z");

  it("código muda por janela, loja e e-mail; manda e-mail; entra com o código certo", async () => {
    const o = (await ctx.db.select().from(orders).limit(1))[0]!;
    const loja = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, o.storeId) }))!;
    await ctx.db.update(stores).set({ status: "ACTIVE" }).where(eq(stores.id, loja.id));
    const janela = Math.floor(AGORA.getTime() / 600_000);
    const c = codigoDaJanela(loja.id, o.customerEmail, janela);
    expect(c).toMatch(/^\d{6}$/);
    expect(codigoDaJanela(loja.id, o.customerEmail.toUpperCase(), janela)).toBe(c);
    expect(codigoDaJanela(loja.id, "outro@x.com", janela)).not.toBe(c);
    await pedirCodigo(ctx.db, loja.slug, o.customerEmail, "https://loja.test", AGORA);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "CLIENTE_CODIGO"))).some((e) => e.subject.includes(c))).toBe(true);
    await expect(entrarComCodigo(ctx.db, loja.slug, o.customerEmail, "000000".replace(/./g, (_, i) => String((Number(c[i]) + 1) % 10)), AGORA)).rejects.toThrow(/inválido/);
    const token = await entrarComCodigo(ctx.db, loja.slug, o.customerEmail, c, new Date(AGORA.getTime() + 9 * 60_000));
    expect(lerSessao(token, loja.id, AGORA)).toBe(o.customerEmail.toLowerCase());
    expect(lerSessao(token, "outra-loja", AGORA)).toBeNull();
    expect(lerSessao(token.slice(0, -2) + "xx", loja.id, AGORA)).toBeNull();
    expect(lerSessao(assinarSessao({ s: loja.id, e: "a@b.com", x: AGORA.getTime() - 1 }), loja.id, AGORA)).toBeNull();
    const ps = await pedidosDoCliente(ctx.db, loja.id, o.customerEmail);
    expect(ps.some((p) => p.number === o.number)).toBe(true);
    expect(ps.every((p) => typeof p.etapa === "string")).toBe(true);
  });
});
