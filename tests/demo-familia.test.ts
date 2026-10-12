import { describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { DEMO_PASSWORD } from "@/db/seed-constants";
import { familyEmail, seedDemoFamily } from "@/db/demo-familia";
import { verifyPassword } from "@/lib/security/password";

/** D150: perfis do Samuel e da Danielle no ambiente de demonstração, na mesma empresa de um perfil de demonstração. */
describe("perfis da família na demonstração", () => {
  it("cria um perfil por papel na empresa de referência, com a senha da demonstração, e não repete", async () => {
    const { db, seed } = await freshDb();
    const created = await seedDemoFamily(db);
    expect(created).toContain(familyEmail("samuel", "master"));
    expect(created).toContain(familyEmail("danielle", "lojista"));
    expect(created).not.toContain(familyEmail("samuel", "financeiro")); // financeiro do Master é só da Danielle
    const lojista = (await db.query.users.findFirst({ where: eq(users.email, familyEmail("samuel", "lojista")) }))!;
    expect(lojista).toMatchObject({ name: "Samuel · Lojista SuperDrop", role: "STORE_OWNER", storeId: seed.stores.arena.id });
    expect(verifyPassword(DEMO_PASSWORD, lojista.passwordHash!)).toBe(true);
    const master = (await db.query.users.findFirst({ where: eq(users.email, familyEmail("danielle", "master")) }))!;
    expect(master).toMatchObject({ role: "NEXTLEVEL_MASTER", masterFunction: null });
    expect(await seedDemoFamily(db)).toEqual([]);
    expect((await db.select().from(users).where(like(users.email, "%@familia.demo"))).length).toBe(created.length);
  });
});
