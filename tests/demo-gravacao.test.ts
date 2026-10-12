import { describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdRequests, clubLedger, trParcels, users } from "@/db/schema";
import { seedDemoCargas } from "@/db/demo-cargas";
import { DEMO_BRAS_ACCOUNTS, seedDemoBras } from "@/db/demo-bras";
import { verifyPassword } from "@/lib/security/password";
import { DEMO_PASSWORD } from "@/db/seed-constants";

/** D144: o ambiente de gravação tem todos os participantes com login e dados em cada etapa. */
describe("mundo da demonstração para gravação", () => {
  it("cria cada participante com a senha da demonstração, pedidos em cada etapa, fardos, pontos e chamado; só uma vez", async () => {
    const ctx = await freshDb();
    await seedDemoCargas(ctx.db);
    const problems: string[] = [];
    expect(await seedDemoBras(ctx.db, (m) => { if (m.includes("não foi criado")) problems.push(m); })).toBe(true);
    expect(problems).toEqual([]);
    expect(await seedDemoBras(ctx.db)).toBe(false);
    const accounts = await ctx.db.select().from(users).where(inArray(users.email, Object.values(DEMO_BRAS_ACCOUNTS)));
    expect(accounts.map((u) => u.email).sort()).toEqual(Object.values(DEMO_BRAS_ACCOUNTS).sort());
    expect(accounts.every((u) => verifyPassword(DEMO_PASSWORD, u.passwordHash) && !u.mustChangePassword)).toBe(true);
    expect(new Set((await ctx.db.select({ s: bdRequests.status }).from(bdRequests)).map((r) => r.s))).toEqual(new Set(["NEW", "CONFIRMED", "PAID", "PICKED_UP"]));
    expect((await ctx.db.select().from(trParcels)).length).toBe(3);
    const ana = accounts.find((u) => u.email === DEMO_BRAS_ACCOUNTS.membro)!;
    expect((await ctx.db.select().from(clubLedger).where(eq(clubLedger.userId, ana.id))).length).toBeGreaterThan(0);
  });
});

describe("estúdio de gravação", () => {
  it("cada aula usa uma conta da lista; o início da aula é sempre um endereço interno", async () => {
    const { AULAS, DEMO_LOGINS, safeStart } = await import("@/lib/gravacao");
    const all = new Set(DEMO_LOGINS.flatMap((g) => g.items.map((i) => i.email)));
    expect(AULAS.flatMap((s) => s.aulas).every((a) => all.has(a.email))).toBe(true);
    expect(safeStart("/merchant/orders")).toBe("/merchant/orders");
    expect(safeStart("//site-de-fora.com")).toBe("/");
    expect(safeStart("https://site-de-fora.com")).toBe("/");
  });
});
