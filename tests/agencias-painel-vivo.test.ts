import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { criarCliente } from "@/lib/agencias/clientes";
import { avancarPeca, criarPeca } from "@/lib/agencias/producao";
import { esteiraDoMes, fraseDaReceita, haQuanto, movimentoDaAgencia } from "@/lib/agencias/painel-vivo";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }

describe("Painel da Agência com vida (D334): regras puras", () => {
  it("esteira agrupa as etapas em 6 trechos que somam 100%", () => {
    const e = esteiraDoMes({ PLANEJAMENTO: 2, ROTEIRO: 1, EDICAO: 2, REVISAO: 1, APROVACAO: 1, PUBLICADO: 3 });
    expect(e.total).toBe(10);
    expect(e.trechos.map((t) => [t.chave, t.n])).toEqual([["planejar", 2], ["roteiro", 1], ["gravacao", 0], ["edicao", 3], ["aprovacao", 1], ["publicado", 3]]);
    expect(Math.round(e.trechos.reduce((s, t) => s + t.pct, 0))).toBe(100);
    expect(esteiraDoMes({}).total).toBe(0);
  });
  it("frase da receita diz a conclusão, sem inventar", () => {
    expect(fraseDaReceita([{ mes: "2026-06", recorrenteCents: 0 }, { mes: "2026-07", recorrenteCents: 0 }])).toMatch(/aparece aqui/);
    expect(fraseDaReceita([{ mes: "2026-06", recorrenteCents: 100_000 }, { mes: "2026-07", recorrenteCents: 150_000 }])).toBe("A receita recorrente cresceu 50% no período: R$ 1.500,00 por mês.");
    expect(fraseDaReceita([{ mes: "2026-06", recorrenteCents: 200_000 }, { mes: "2026-07", recorrenteCents: 150_000 }])).toMatch(/caiu 25%/);
    expect(fraseDaReceita([{ mes: "2026-06", recorrenteCents: 0 }, { mes: "2026-07", recorrenteCents: 90_000 }])).toMatch(/^Receita recorrente de/);
  });
  it("há quanto tempo, em português", () => {
    const agora = new Date("2026-11-18T12:00:00Z");
    expect(haQuanto("2026-11-18T11:59:40Z", agora)).toBe("agora");
    expect(haQuanto("2026-11-18T11:55:00Z", agora)).toBe("há 5 min");
    expect(haQuanto("2026-11-18T09:00:00Z", agora)).toBe("há 3 h");
    expect(haQuanto("2026-11-16T12:00:00Z", agora)).toBe("há 2 dias");
  });
});

describe("movimento ao vivo da agência (D334)", () => {
  beforeEach(async () => { ctx = await freshDb(); });
  it("mostra só a própria agência e só para quem vê a carteira toda", async () => {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
    const b = await criarAgencia(ctx.db, ctx.actors.master, { nome: "Outra", responsavel: { nome: "Ana", email: "ana@outra.com.br", senha: "senha-provisoria" } });
    const admA = await ator(a.userId), admB = await ator(b.userId);
    const cA = await criarCliente(ctx.db, admA, { nome: "CCV Vidros" });
    const cB = await criarCliente(ctx.db, admB, { nome: "Padaria" });
    const pA = await criarPeca(ctx.db, admA, { clienteId: cA.id, titulo: "Reels da vitrine" });
    await criarPeca(ctx.db, admB, { clienteId: cB.id, titulo: "Post da padaria" });
    await avancarPeca(ctx.db, admA, pA.id);
    const mov = await movimentoDaAgencia(ctx.db, admA);
    expect(mov.length).toBeGreaterThan(0);
    expect(mov.some((m) => m.tipo === "CRIADA")).toBe(false);
    expect(mov.every((m) => m.titulo === "Reels da vitrine")).toBe(true);
    const editor = await ator((await convidarMembro(ctx.db, admA, { nome: "Gu", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
    expect(await movimentoDaAgencia(ctx.db, editor)).toEqual([]);
  });
});
