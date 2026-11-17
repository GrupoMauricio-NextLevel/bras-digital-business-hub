import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { stores, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { groupProfiles, switchProfile } from "@/lib/domain/conta-grupo";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { salvarDadosJuridicos } from "@/lib/agencias/contratos";
import { conectarAoBusiness, destinoDaSolucao, emailSugerido, solucoesDaAgencia } from "@/lib/agencias/solucoes";
import { modulosDoNegocio } from "@/lib/business/modulos";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = { a: process.env.AGENCIAS_V1, b: process.env.BUSINESS_V1 };
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; process.env.BUSINESS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes.a; process.env.BUSINESS_V1 = antes.b; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }

describe("soluções NextLevel da agência (D323)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("e-mail sugerido com +negocio", () => {
    expect(emailSugerido("Leo+x@UP.com.br")).toBe("leo+negocio@up.com.br");
  });

  it("só o administrador; exige CNPJ; conecta pelo cadastro de sempre, liga os perfis e abre as telas do negócio", async () => {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const gestor = await ator((await convidarMembro(ctx.db, admin, { nome: "Rafa", email: "rafa@up.com.br", senha: "senha-provisoria", funcao: "GESTOR" })).userId);
    await expect(solucoesDaAgencia(ctx.db, gestor)).rejects.toThrow(/administrador/);
    expect(await solucoesDaAgencia(ctx.db, admin)).toMatchObject({ conectada: false, temDocumento: false, emailSugerido: "leo+negocio@up.com.br" });
    await expect(conectarAoBusiness(ctx.db, admin, { formato: "SITE", email: "leo+negocio@up.com.br", aceite: true })).rejects.toThrow(/CNPJ ou CPF/);
    await salvarDadosJuridicos(ctx.db, admin, { razaoSocial: "UP Clips Ltda", documento: "11.222.333/0001-81", cidadeForo: "São Paulo/SP" });

    const r = await conectarAoBusiness(ctx.db, admin, { formato: "SITE", email: "leo+negocio@up.com.br", aceite: true });
    await expect(conectarAoBusiness(ctx.db, admin, { formato: "SITE", email: "outro@up.com.br", aceite: true })).rejects.toThrow(/já está conectada/);
    const loja = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(loja).toMatchObject({ name: "UPClips", formato: "SITE", status: "ACTIVE" });
    expect((await modulosDoNegocio(ctx.db, r.storeId)).ativos.has("site")).toBe(true);

    const s = await solucoesDaAgencia(ctx.db, admin);
    expect(s).toMatchObject({ conectada: true, euConectado: true, negocio: { nome: "UPClips", site: true } });
    expect((await groupProfiles(ctx.db, admin.userId)).map((p) => p.role).sort()).toEqual(["AGENCY", "STORE_OWNER"]);

    const d = await destinoDaSolucao(ctx.db, admin, "site");
    expect(d).toEqual({ perfilId: r.perfilId, caminho: "/merchant/site/paginas" });
    await expect(destinoDaSolucao(ctx.db, admin, "/master")).rejects.toThrow(/não encontrada/);
    expect(await switchProfile(ctx.db, admin, d.perfilId, null)).toMatchObject({ kind: "SESSION", userId: r.perfilId });
  });
});
