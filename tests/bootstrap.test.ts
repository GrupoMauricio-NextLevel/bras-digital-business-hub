import { describe, it, expect } from "vitest";
import { createDatabase } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { bootstrapDatabase } from "@/db/bootstrap-data";
import { users, themes, plans, services } from "@/db/schema";
import { verifyPassword } from "@/lib/security/password";

describe("bootstrap de produção", () => {
  it("cria dados de referência e o master sem dados de demonstração; é idempotente", async () => {
    const { db } = await createDatabase("pglite://memory");
    await runMigrations(db);
    const first = await bootstrapDatabase(db, { seedDemo: false, masterEmail: "Admin@NextLevel.com", masterPassword: "senha-bem-longa-123" });
    expect(first.join(" ")).toMatch(/master criado/);
    expect((await db.select().from(themes)).length).toBe(4);
    expect((await db.select().from(plans)).length).toBe(3);
    expect((await db.select().from(services)).length).toBe(13);
    const all = await db.select().from(users);
    expect(all).toHaveLength(1);
    expect(all[0]?.email).toBe("admin@nextlevel.com");
    expect(all[0]?.role).toBe("NEXTLEVEL_MASTER");
    expect(verifyPassword("senha-bem-longa-123", all[0]?.passwordHash)).toBe(true);
    await bootstrapDatabase(db, { seedDemo: false, masterEmail: "admin@nextlevel.com", masterPassword: "senha-bem-longa-123" });
    expect((await db.select().from(users))).toHaveLength(1);
    expect((await db.select().from(themes)).length).toBe(4);
  });
  it("rejeita senha de master curta", async () => {
    const { db } = await createDatabase("pglite://memory");
    await runMigrations(db);
    await expect(bootstrapDatabase(db, { seedDemo: false, masterEmail: "a@b.com", masterPassword: "curta" })).rejects.toThrow(/10 caracteres/);
  });
});
