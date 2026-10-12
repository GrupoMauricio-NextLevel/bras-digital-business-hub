import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { groupPassCodes, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { brandByCode } from "@/lib/brand";
import { consumePassCode, groupProfiles, linkProfile, maskEmail, profileForHost, switchProfile, unlinkProfile } from "@/lib/domain/conta-grupo";
import { ecosystemBar, saveEcoSettings } from "@/lib/domain/ecossistema/lancador";
import { DEMO_PASSWORD } from "@/db/seed-constants";

/** D141: conta do grupo — perfis da mesma pessoa em marcas diferentes, ligados com aceite. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const commerce = () => brandByCode("NEXTLEVEL_COMMERCE");
const superdrop = () => brandByCode("SUPERDROP");

async function lojaCommerce() {
  const r = await signupMember(ctx.db, { storeName: "Loja Ju", ownerName: "Juliana", email: "ju@x.teste", password: "senha-segura-1", taxId: "529.982.247-25", brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_START", cycle: "MONTHLY" });
  const u = (await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!;
  return { user: u, actor: actorFromUser(u) };
}
const mantosEmail = async () => (await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.actors.mantos.userId) }))!.email;

describe("ligar perfis", () => {
  it("exige a senha do outro perfil e o aceite; liga os dois no mesmo grupo e audita", async () => {
    const ju = await lojaCommerce();
    const email = await mantosEmail();
    await expect(linkProfile(ctx.db, ju.actor, { email, password: "errada", consent: true })).rejects.toThrow(/incorretos/);
    await expect(linkProfile(ctx.db, ju.actor, { email, password: DEMO_PASSWORD, consent: false as true })).rejects.toThrow();
    const r = await linkProfile(ctx.db, ju.actor, { email, password: DEMO_PASSWORD, consent: true });
    expect(r.profiles).toBe(2);
    const list = await groupProfiles(ctx.db, ju.user.id);
    expect(list.map((p) => p.brand).sort()).toEqual(["NEXTLEVEL_COMMERCE", "SUPERDROP"]);
    expect(list[0]!.current).toBe(true);
    expect(list.every((p) => p.email.includes("*"))).toBe(true);
    await expect(linkProfile(ctx.db, ju.actor, { email, password: DEMO_PASSWORD, consent: true })).rejects.toThrow(/já está/);
  });

  it("conta da equipe NextLevel não entra no grupo", async () => {
    const ju = await lojaCommerce();
    const master = (await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.actors.master.userId) }))!;
    await expect(linkProfile(ctx.db, ju.actor, { email: master.email, password: DEMO_PASSWORD, consent: true })).rejects.toThrow(/equipe/);
    await expect(linkProfile(ctx.db, ctx.actors.master, { email: "ju@x.teste", password: "senha-segura-1", consent: true })).rejects.toThrow();
  });

  it("desligar: o perfil sai e, sobrando um, o grupo acaba", async () => {
    const ju = await lojaCommerce();
    await linkProfile(ctx.db, ju.actor, { email: await mantosEmail(), password: DEMO_PASSWORD, consent: true });
    await unlinkProfile(ctx.db, ju.actor, ctx.actors.mantos.userId);
    expect((await ctx.db.query.users.findFirst({ where: eq(users.id, ju.user.id) }))!.groupId).toBeNull();
    await expect(unlinkProfile(ctx.db, ju.actor, ctx.actors.arena.userId)).rejects.toThrow();
  });
});

describe("trocar de perfil e entrar em outra marca", () => {
  it("mesmo endereço troca a sessão; outra marca gera código de uso único que vale uma vez", async () => {
    const ju = await lojaCommerce();
    await linkProfile(ctx.db, ju.actor, { email: await mantosEmail(), password: DEMO_PASSWORD, consent: true });
    // Endereço técnico (sem marca): troca direto.
    expect(await switchProfile(ctx.db, ju.actor, ctx.actors.mantos.userId, null)).toMatchObject({ kind: "SESSION", userId: ctx.actors.mantos.userId });
    // No endereço da Commerce, o perfil do SuperDrop abre no endereço do SuperDrop.
    const pass = await switchProfile(ctx.db, ju.actor, ctx.actors.mantos.userId, commerce());
    expect(pass.kind).toBe("PASS");
    const code = new URL((pass as { url: string }).url).searchParams.get("c")!;
    expect(await consumePassCode(ctx.db, code)).toMatchObject({ userId: ctx.actors.mantos.userId });
    expect(await consumePassCode(ctx.db, code)).toBeNull(); // uma vez
    // Guarda só o hash do código.
    expect((await ctx.db.select().from(groupPassCodes)).every((r) => r.codeHash !== code)).toBe(true);
  });

  it("código vencido não abre; perfil fora do grupo não abre", async () => {
    const ju = await lojaCommerce();
    await linkProfile(ctx.db, ju.actor, { email: await mantosEmail(), password: DEMO_PASSWORD, consent: true });
    const pass = await switchProfile(ctx.db, ju.actor, ctx.actors.mantos.userId, commerce());
    const code = new URL((pass as { url: string }).url).searchParams.get("c")!;
    expect(await consumePassCode(ctx.db, code, new Date(Date.now() + 3 * 60_000))).toBeNull();
    await expect(switchProfile(ctx.db, ju.actor, ctx.actors.arena.userId, null)).rejects.toThrow();
  });

  it("login com a conta do grupo: a senha de um perfil abre o perfil da marca do endereço", async () => {
    const ju = await lojaCommerce();
    const mantos = (await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.actors.mantos.userId) }))!;
    expect(await profileForHost(ctx.db, mantos, commerce())).toBeNull(); // sem grupo: aviso de sempre
    await linkProfile(ctx.db, ju.actor, { email: mantos.email, password: DEMO_PASSWORD, consent: true });
    const fresh = (await ctx.db.query.users.findFirst({ where: eq(users.id, mantos.id) }))!;
    expect((await profileForHost(ctx.db, fresh, commerce()))?.id).toBe(ju.user.id);
    expect((await profileForHost(ctx.db, fresh, superdrop()))?.id).toBe(mantos.id);
  });

  it("a barra do ecossistema mostra a marca do outro perfil em 'Suas marcas'", async () => {
    const ju = await lojaCommerce();
    await linkProfile(ctx.db, ju.actor, { email: await mantosEmail(), password: DEMO_PASSWORD, consent: true });
    await saveEcoSettings(ctx.db, ctx.actors.master, { brands: ["NEXTLEVEL_COMMERCE", "SUPERDROP"] });
    const bar = await ecosystemBar(ctx.db, "NEXTLEVEL_COMMERCE", new Date(), ju.user.id);
    expect(bar?.mine.map((m) => m.brand)).toContain("SUPERDROP");
    expect(bar?.mine.find((m) => m.brand === "SUPERDROP")?.href).toBe("/account/marcas");
  });
});

it("e-mail mascarado", () => { expect(maskEmail("mauricio@gmail.com")).toBe("ma***@gmail.com"); expect(maskEmail("ab@x.com")).toBe("ab*@x.com"); });
