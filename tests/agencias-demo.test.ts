import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaClientes, agenciaPecas, agencias, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { switchProfile } from "@/lib/domain/conta-grupo";
import { convidarMembro, criarAgencia, listarAgencias } from "@/lib/agencias/agencias";
import { criarCliente } from "@/lib/agencias/clientes";
import { desligarModoDemo, ligarModoDemo, movimentarDemo } from "@/lib/agencias/demo";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }

describe("modo demonstração da agência (D326)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("liga num sandbox separado (dados reais intactos), volta para a real e a produção anda sozinha", async () => {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
    await criarCliente(ctx.db, admin, { nome: "CCV Vidros" });
    await expect(ligarModoDemo(ctx.db, editor)).rejects.toThrow(/administrador/);

    const { perfilId } = await ligarModoDemo(ctx.db, admin);
    const sb = (await ctx.db.query.agencias.findFirst({ where: eq(agencias.demoDeId, a.agenciaId) }))!;
    expect(sb.nome).toBe("UPClips · demonstração");
    expect((await ctx.db.select().from(agenciaClientes).where(eq(agenciaClientes.agenciaId, a.agenciaId))).map((c) => c.nome)).toEqual(["CCV Vidros"]);
    expect((await ctx.db.select().from(agenciaClientes).where(eq(agenciaClientes.agenciaId, sb.id))).length).toBeGreaterThan(5);
    expect((await ctx.db.select().from(users).where(eq(users.organizationId, sb.organizationId))).every((u) => u.email.endsWith("@demonstracao.invalid"))).toBe(true);
    expect((await ligarModoDemo(ctx.db, admin)).perfilId).toBe(perfilId);
    expect((await listarAgencias(ctx.db, ctx.actors.master)).map((x) => x.nome)).toEqual(["UPClips"]);

    const s = await switchProfile(ctx.db, admin, perfilId, null);
    expect(s).toMatchObject({ kind: "SESSION", userId: perfilId });
    const naDemo = await ator(perfilId);
    await expect(ligarModoDemo(ctx.db, naDemo)).rejects.toThrow(/já está no modo/);

    const etapas = async () => (await ctx.db.select({ e: agenciaPecas.etapa }).from(agenciaPecas).where(eq(agenciaPecas.agenciaId, sb.id))).map((x) => x.e).join();
    const antesE = await etapas();
    const t = new Date(Date.now() + 120_000);
    expect((await movimentarDemo(ctx.db, sb.id, t)).movidas).toBeGreaterThan(0);
    expect(await etapas()).not.toBe(antesE);
    expect((await movimentarDemo(ctx.db, sb.id, new Date(t.getTime() + 10_000))).movidas).toBe(0);
    expect((await movimentarDemo(ctx.db, a.agenciaId, t)).movidas).toBe(0);

    expect((await desligarModoDemo(ctx.db, naDemo)).perfilId).toBe(admin.userId);
    await expect(desligarModoDemo(ctx.db, admin)).rejects.toThrow(/já está desligado/);
  });
});
