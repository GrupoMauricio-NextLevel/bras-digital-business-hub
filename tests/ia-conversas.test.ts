import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { brandLeads, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { abrirConversa, assumirConversa, devolverAoMauricio, enviarDoCliente, iniciarConversa, listarConversas, mensagensDepois, responderComoEquipe, salvarContato } from "@/lib/domain/ia-conversas";
import type { FatosVenda } from "@/lib/ia/vendedor-publico";

/** Conversas do Maurício e CRM ao vivo (D197). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const fatos: FatosVenda = { marca: "NextLevel E-commerce", cadastro: "/cadastro", temasGratis: 4, oferta: null, integracoes: [], planos: [{ key: "COMMERCE_START", name: "Start", monthlyCents: 14900, feeBps: 100, quote: false }] };

describe("conversa do visitante e CRM", () => {
  it("visitante conversa, deixa contato, equipe assume e responde; o Maurício para e volta", async () => {
    const master = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.role, "NEXTLEVEL_MASTER") }))!);
    const c = await iniciarConversa(ctx.db, { brand: "NEXTLEVEL_COMMERCE", pagina: "/", origem: { utm_source: "instagram" } }, fatos);
    expect(c.mensagens.mensagens[0]!.autor).toBe("MAURICIO");
    await expect(mensagensDepois(ctx.db, c.id, "token-errado")).rejects.toThrow(/não encontrada/);

    const r1 = await enviarDoCliente(ctx.db, { id: c.id, token: c.token, atalho: { id: "fx-3", rotulo: "Até R$ 3 mil por mês" } }, fatos);
    expect(r1.mensagens.map((m) => m.autor)).toEqual(["MAURICIO", "CLIENTE", "MAURICIO"]);

    await salvarContato(ctx.db, { id: c.id, token: c.token, nome: "Ana Lima", whatsapp: "(11) 98888-7777", email: "ana@loja.com.br" });
    expect((await ctx.db.select().from(brandLeads).where(eq(brandLeads.email, "ana@loja.com.br"))).length).toBe(1);

    const lista = await listarConversas(ctx.db, master, { status: "ABERTAS" });
    expect(lista.lista[0]).toMatchObject({ nome: "Ana Lima", whatsapp: "11988887777", faturamento: "Até R$ 3 mil por mês", status: "IA" });

    await assumirConversa(ctx.db, master, c.id, "Mauricio Dono");
    const antes = (await abrirConversa(ctx.db, master, c.id)).mensagens.length;
    await enviarDoCliente(ctx.db, { id: c.id, token: c.token, texto: "quanto custa?" }, fatos);
    const depois = (await abrirConversa(ctx.db, master, c.id)).mensagens;
    expect(depois.length).toBe(antes + 1);
    expect(depois.at(-1)!.autor).toBe("CLIENTE");

    await responderComoEquipe(ctx.db, master, c.id, "Oi Ana! Te ajudo agora.", "Mauricio Dono");
    const vis = await mensagensDepois(ctx.db, c.id, c.token);
    expect(vis.status).toBe("HUMANO");
    expect(vis.mensagens.at(-1)).toMatchObject({ autor: "HUMANO", autorNome: "Mauricio" });
    expect(JSON.stringify(await abrirConversa(ctx.db, master, c.id))).not.toContain("tokenHash");

    await devolverAoMauricio(ctx.db, master, c.id);
    const r2 = await enviarDoCliente(ctx.db, { id: c.id, token: c.token, texto: "e o frete?" }, fatos);
    expect(r2.mensagens.at(-1)!.autor).toBe("MAURICIO");
    await expect(listarConversas(ctx.db, ctx.actors.arena)).rejects.toThrow();
  });
});
