import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { actorFromUser, assertStoreAdmin } from "@/lib/domain/access";
import { inviteStaff, listTeam, removeStaff } from "@/lib/domain/store-team";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function owner(n = 1) {
  const r = await signupMember(ctx.db, { storeName: `Moda ${n}`, ownerName: "Maria Souza", email: `maria${n}@moda.com.br`, password: "senha-segura-1", taxId: n === 1 ? "529.982.247-25" : "111.444.777-35", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  return { ...r, actor: actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!) };
}

describe("Equipe da loja", () => {
  it("dono cria acesso de equipe; a equipe não passa nas funções de dono nem gerencia a equipe", async () => {
    const o = await owner();
    const { id } = await inviteStaff(ctx.db, o.actor, { name: "João Estoque", email: "Joao@Moda.com.br", password: "provisoria-1" });
    const staff = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!);
    expect(staff).toMatchObject({ role: "STORE_OWNER", storeRole: "STAFF", storeId: o.storeId });
    expect(() => assertStoreAdmin(staff)).toThrow(/dono/);
    expect(() => assertStoreAdmin(o.actor)).not.toThrow();
    expect(() => assertStoreAdmin(ctx.actors.master)).not.toThrow();
    await expect(inviteStaff(ctx.db, staff, { name: "Outro", email: "o@x.com", password: "12345678" })).rejects.toThrow(/dono/);
    await expect(listTeam(ctx.db, staff)).rejects.toThrow(/dono/);
    const row = (await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!;
    expect([row.email, row.mustChangePassword]).toEqual(["joao@moda.com.br", true]);
    await expect(inviteStaff(ctx.db, o.actor, { name: "Dup", email: "joao@moda.com.br", password: "12345678" })).rejects.toThrow(/e-mail/i);
  });

  it("limite do plano na E-commerce (Start: 3 pessoas com o dono, D247); encerrar acesso libera a vaga e outra loja não consegue", async () => {
    const a = await owner(1);
    const b = await owner(2);
    const ids: string[] = [];
    for (let i = 0; i < 2; i++) ids.push((await inviteStaff(ctx.db, a.actor, { name: `Pessoa ${i}`, email: `p${i}@x.com`, password: "12345678" })).id);
    await expect(inviteStaff(ctx.db, a.actor, { name: "Sexta", email: "p6@x.com", password: "12345678" })).rejects.toThrow(/até 3 pessoas/);
    await expect(removeStaff(ctx.db, b.actor, ids[0]!)).rejects.toThrow(/não encontrada/);
    await removeStaff(ctx.db, a.actor, ids[0]!);
    expect((await ctx.db.query.users.findFirst({ where: eq(users.id, ids[0]!) }))!.disabledAt).toBeTruthy();
    await expect(inviteStaff(ctx.db, a.actor, { name: "Sexta", email: "p6@x.com", password: "12345678" })).resolves.toBeTruthy(); // vaga liberada
    await expect(removeStaff(ctx.db, a.actor, a.userId)).rejects.toThrow(/não encontrada/); // dono não se remove
  });
});
