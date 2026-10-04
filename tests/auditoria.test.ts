import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { diffFields, listAudit, recordAudit } from "@/lib/domain/audit";
import { inviteStaff, removeStaff } from "@/lib/domain/store-team";
import { exportStoreCsv } from "@/lib/domain/privacy";
import { auditLog } from "@/db/schema";
import { ForbiddenError } from "@/lib/domain/errors";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);
const mantos = () => ctx.actors.mantos;

describe("trilha de auditoria", () => {
  it("diferença campo a campo, sem valor para campos sensíveis", () => {
    expect(diffFields({ priceCents: 1000, mpToken: "abc" }, { priceCents: 1200, mpToken: "xyz" })).toEqual({ priceCents: { from: 1000, to: 1200 }, mpToken: {} });
    expect(diffFields({ a: 1 }, { a: 1 })).toEqual({});
  });
  it("sem mudança não grava; com mudança grava quem, o quê e antes/depois", async () => {
    const st = ctx.seed.stores.mantos.id;
    expect(await recordAudit(ctx.db, mantos(), { action: "X", entityType: "store", storeId: st, before: { a: 1 }, after: { a: 1 } })).toBe(false);
    expect(await recordAudit(ctx.db, mantos(), { action: "LISTING_UPDATED", entityType: "store_product", entityId: "p1", storeId: st, before: { priceCents: 100 }, after: { priceCents: 150 } })).toBe(true);
    const row = (await ctx.db.select().from(auditLog).where(eq(auditLog.action, "LISTING_UPDATED")))[0]!;
    expect(row.actorUserId).toBe(mantos().userId); expect(row.changes).toEqual({ priceCents: { from: 100, to: 150 } });
  });
  it("equipe e exportação deixam rastro; só o dono lê o histórico da própria loja", async () => {
    const r = await inviteStaff(ctx.db, mantos(), { name: "Auditada", email: "auditada@mantos.demo", password: "senha-forte-123" } as never);
    await removeStaff(ctx.db, mantos(), r.id);
    await exportStoreCsv(ctx.db, mantos(), "products");
    const mine = await listAudit(ctx.db, mantos());
    expect(mine.map((a) => a.action)).toEqual(expect.arrayContaining(["STAFF_INVITED", "STAFF_REMOVED", "DATA_EXPORT"]));
    expect(mine.every((a) => a.storeId === ctx.seed.stores.mantos.id)).toBe(true);
    expect(JSON.stringify(mine)).not.toContain("senha-forte-123");
    await expect(listAudit(ctx.db, { ...mantos(), storeRole: "STAFF" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAudit(ctx.db, ctx.actors.supplier)).rejects.toBeInstanceOf(ForbiddenError);
    expect((await listAudit(ctx.db, ctx.actors.arena)).some((a) => a.action === "STAFF_INVITED")).toBe(false);
  });
});
