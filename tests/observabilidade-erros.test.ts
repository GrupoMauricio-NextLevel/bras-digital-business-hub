import { beforeAll, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { listErrors, recordError } from "@/lib/domain/error-log";
import { runAction } from "@/lib/action-result";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

describe("observabilidade: erro com loja, origem e código", () => {
  it("grava loja, origem e código; repetir o mesmo erro soma e guarda a última loja e o último código", async () => {
    await recordError(ctx.db, { origin: "SERVER", route: "/store/loja-a/checkout", message: "Mercado Pago (HTTP 503): fora do ar", context: "mercadopago", storeSlug: "loja-a", ref: "ABC123" });
    await recordError(ctx.db, { origin: "SERVER", route: "/store/loja-a/checkout", message: "Mercado Pago (HTTP 503): fora do ar", context: "mercadopago", storeSlug: "loja-b", ref: "XYZ789" });
    const rows = (await listErrors(ctx.db, ctx.actors.master)).filter((e) => e.context === "mercadopago");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ count: 2, lastStoreSlug: "loja-b", lastRef: "XYZ789", context: "mercadopago" });
  });
  it("não grava e-mail nem segredo, mesmo no contexto da loja", async () => {
    await recordError(ctx.db, { origin: "SERVER", route: "/merchant", message: "falha para fulano@exemplo.com com Bearer abcdefghijklmnopqrstuvwxyz123456", context: "ação", storeSlug: "loja-c", ref: "R1" });
    const all = JSON.stringify(await listErrors(ctx.db, ctx.actors.master));
    expect(all).not.toContain("fulano@exemplo.com"); expect(all).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
  });
  it("erro inesperado numa ação devolve um código ao usuário; erro de negócio continua claro e sem código", async () => {
    const boom = await runAction(async () => { throw new Error("falha interna qualquer"); });
    expect(boom.ok).toBe(false);
    if (!boom.ok) { expect(boom.ref).toMatch(/^[A-Z0-9]{4,6}$/); expect(boom.error).toContain(boom.ref!); }
    const { DomainError } = await import("@/lib/domain/errors");
    const biz = await runAction(async () => { throw new DomainError("X", "Regra de negócio clara."); });
    expect(biz).toEqual({ ok: false, error: "Regra de negócio clara.", code: "X" });
  });
});
