import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./setup";
import { errorEvents } from "@/db/schema";
import { listErrors, maskRoute, maskText, recordError, resolveError } from "@/lib/domain/error-log";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("Painel de erros", () => {
  it("mascara e-mail, telefone, CPF e fichas; a rota perde parâmetros e identificadores", () => {
    const t = maskText("Falha para maria@loja.com, CPF 529.982.247-25, tel (11) 98888-7777, Bearer APP_USR-1234567890abcdef12345678");
    expect(t).not.toMatch(/maria@|529\.982|98888|APP_USR/);
    expect(maskRoute("/merchant/orders/ord_6az37kawzagq?email=a@b.com")).toBe("/merchant/orders/:id");
    expect(maskRoute("/store/loja/order/12345")).toBe("/store/loja/order/:n");
  });

  it("agrupa o mesmo erro (somando) e reabre se voltar depois de resolvido", async () => {
    await recordError(ctx.db, { origin: "SERVER", route: "/merchant/orders/ord_aaaaaaaaaaaaaaaa", message: "Timeout no pedido 1001" });
    await recordError(ctx.db, { origin: "SERVER", route: "/merchant/orders/ord_bbbbbbbbbbbbbbbb", message: "Timeout no pedido 2002" });
    await recordError(ctx.db, { origin: "BROWSER", route: "/login", message: "Falha na tela" });
    let rows = await listErrors(ctx.db, ctx.actors.master);
    expect(rows).toHaveLength(2);
    const server = rows.find((r) => r.origin === "SERVER")!;
    expect(server.count).toBe(2);
    await resolveError(ctx.db, ctx.actors.master, server.id);
    rows = await listErrors(ctx.db, ctx.actors.master);
    expect(rows.at(-1)!.id).toBe(server.id); // resolvido vai para o fim
    await recordError(ctx.db, { origin: "SERVER", route: "/merchant/orders/ord_cccccccccccccccc", message: "Timeout no pedido 3003" });
    const again = (await listErrors(ctx.db, ctx.actors.master)).find((r) => r.id === server.id)!;
    expect([again.count, again.resolvedAt]).toEqual([3, null]);
  });

  it("só o Master lê e resolve; registrar nunca lança", async () => {
    await recordError(ctx.db, { origin: "SERVER", route: "/x", message: "boom" });
    await expect(listErrors(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await expect(listErrors(ctx.db, ctx.actors.supplier)).rejects.toThrow();
    const id = (await ctx.db.select().from(errorEvents))[0]!.id;
    await expect(resolveError(ctx.db, ctx.actors.mantos, id)).rejects.toThrow();
    await expect(recordError({} as never, { origin: "SERVER", route: "/x", message: "y" })).resolves.toBeUndefined();
  });
});
