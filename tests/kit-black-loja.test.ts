import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { storeDiscounts } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { desligarKitBlack, kitBlackDaLoja, ligarKitBlack } from "@/lib/domain/kit-black-loja";

/** Kit Black da loja (D242): cupom real, faixa com a data do lojista, some sozinho no fim. */
describe("kit Black da loja do lojista", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const AGORA = new Date("2026-11-10T12:00:00Z");

  it("liga com cupom real, vale até a data escolhida e some depois; atualizar não duplica o cupom", async () => {
    const { storeId } = await signupMember(ctx.db, { storeName: "Moda Black", ownerName: "Maria Souza", email: "maria@modablack.com.br", password: "senha-segura-1", taxId: "529.982.247-25", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    const k = await ligarKitBlack(ctx.db, storeId, { percentual: 15, fim: "2026-11-30T23:59:00-03:00" }, AGORA);
    expect(k.codigo).toBe("BLACK15");
    const cupom = await ctx.db.query.storeDiscounts.findFirst({ where: and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, "BLACK15")) });
    expect(cupom).toMatchObject({ kind: "PERCENT", value: 15, active: true });
    expect(Date.parse(cupom!.expiresAt!)).toBe(Date.parse("2026-12-01T02:59:00Z"));
    expect((await kitBlackDaLoja(ctx.db, storeId, AGORA))!.noAr).toBe(true);
    expect((await kitBlackDaLoja(ctx.db, storeId, new Date("2026-12-01T03:00:00Z")))!.noAr).toBe(false);
    await ligarKitBlack(ctx.db, storeId, { percentual: 20, fim: "2026-11-30T23:59:00-03:00", codigo: "BLACK15" }, AGORA);
    const todos = await ctx.db.select().from(storeDiscounts).where(and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, "BLACK15")));
    expect(todos).toHaveLength(1); expect(todos[0]!.value).toBe(20);
    await desligarKitBlack(ctx.db, storeId, AGORA);
    expect((await kitBlackDaLoja(ctx.db, storeId, AGORA))!.noAr).toBe(false);
    expect((await ctx.db.query.storeDiscounts.findFirst({ where: eq(storeDiscounts.id, todos[0]!.id) }))!.active).toBe(false);
    await expect(ligarKitBlack(ctx.db, storeId, { percentual: 10, fim: "2026-11-01T00:00:00Z" }, AGORA)).rejects.toThrow(/futuro/);
  });
});
