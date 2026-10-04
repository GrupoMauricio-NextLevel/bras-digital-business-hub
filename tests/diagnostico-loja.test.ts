import { beforeAll, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { getStoreDiagnostics } from "@/lib/domain/diagnostics";
import { recordError } from "@/lib/domain/error-log";
import { recordAudit } from "@/lib/domain/audit";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

describe("Platform Ops: diagnóstico de uma loja", () => {
  it("junta prontidão, integrações, erros e mudanças da loja, sem misturar com outra", async () => {
    const m = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, ctx.seed.stores.mantos.id) }))!;
    const a = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, ctx.seed.stores.arena.id) }))!;
    await recordError(ctx.db, { origin: "SERVER", route: `/store/${m.slug}/checkout`, message: "Mercado Pago (HTTP 503): fora do ar", context: "mercadopago", storeSlug: m.slug, ref: "K1" });
    await recordError(ctx.db, { origin: "SERVER", route: `/store/${a.slug}/checkout`, message: "Erro só da Arena", context: "ação", storeSlug: a.slug, ref: "K2" });
    await recordAudit(ctx.db, ctx.actors.mantos, { action: "STORE_PUBLISHED", entityType: "store", entityId: m.id, storeId: m.id }, { force: true });
    const d = await getStoreDiagnostics(ctx.db, ctx.actors.master, m.slug);
    expect(d.store.slug).toBe(m.slug);
    expect(d.readiness.items.length).toBeGreaterThan(3);
    expect(d.errors.map((e) => e.message)).toEqual(["Mercado Pago (HTTP 503): fora do ar"]);
    expect(d.audit.map((x) => x.action)).toContain("STORE_PUBLISHED");
    expect(Object.keys(d.integrations)).toEqual(["payment", "shipping", "domain"]);
    expect(JSON.stringify(d)).not.toContain("mpAccessTokenEnc");
  });
  it("só o Master vê; loja inexistente dá erro claro", async () => {
    await expect(getStoreDiagnostics(ctx.db, ctx.actors.mantos, "mantos-shop")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getStoreDiagnostics(ctx.db, ctx.actors.supplier, "mantos-shop")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getStoreDiagnostics(ctx.db, ctx.actors.master, "nao-existe")).rejects.toBeInstanceOf(NotFoundError);
  });
});
