import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { createMasterMember } from "@/lib/domain/equipe-master";
import { checkMap, mapCells } from "@/lib/domain/qualidade";
import { buildMapTree, cellState, expectedAt, followChain, mermaidOf, misplaced, sectionOf, type TreePage } from "@/lib/qualidade/mapa";

/** D147: Mapa vivo — página × endereço seguindo redirecionamentos, regras do dono de 12/10 e árvore com contadores. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

/** Servidor falso: cada endereço responde conforme a tabela (status e destino). */
const fake = (table: Record<string, [number, string?]>) => async (url: string) => {
  const u = new URL(url);
  const [status, loc] = table[`${u.host}${u.pathname}`] ?? [200];
  return new Response(null, { status, headers: loc ? { location: loc } : {} });
};

describe("seguir o endereço até o fim", () => {
  it("conta os saltos e diz onde terminou", async () => {
    const f = fake({ "x.com/fornecedores": [308, "/seja-fornecedor"], "x.com/seja-fornecedor": [307, "/"] });
    const c = await followChain(f, "https://x.com/fornecedores");
    expect(c.hops).toEqual(["/seja-fornecedor", "/"]);
    expect(cellState(c, "/fornecedores")).toBe("INICIO");
    expect(cellState(await followChain(fake({ "x.com/termos": [404] }), "https://x.com/termos"), "/termos")).toBe("404");
    expect(cellState(await followChain(fake({ "x.com/master": [307, "/login?next=/master"] }), "https://x.com/master"), "/master")).toBe("LOGIN");
  });
});

describe("decisões do dono de 12/10", () => {
  it("painéis da equipe só no Master, dos clientes na marca deles; Soluções e Loja NextLevel no site do grupo; termos em todas", () => {
    expect(misplaced("/master/stores", "SUPERDROP", "LOGIN")).toMatch(/Master/);
    expect(misplaced("/bras/videos", "BRAS_DIGITAL", "ABRE")).toMatch(/Master/);
    expect(misplaced("/master/stores", "SUPERDROP", "OUTRO")).toBeNull(); // levou ao Master
    expect(misplaced("/master/stores", "NEXTLEVEL", "LOGIN")).toBeNull();
    expect(misplaced("/merchant", "SUPERDROP", "LOGIN")).toBeNull();
    expect(misplaced("/merchant", "NEXTLEVEL_COMMERCE", "LOGIN")).toBeNull();
    expect(misplaced("/merchant", "NEXTLEVEL", "LOGIN")).toBeNull();
    expect(misplaced("/meu-bras", "SUPERDROP", "LOGIN")).toMatch(/outra marca/);
    expect(misplaced("/meu-bras", "BRAS_DIGITAL", "LOGIN")).toBeNull();
    expect(misplaced("/merchant", "SUPERDROP", "OUTRO")).toMatch(/marca dele/);
    expect(expectedAt("/merchant", "BRAS_DIGITAL").kind).toBe("A_DEFINIR");
    expect(misplaced("/solucoes", "SUPERDROP", "ABRE")).toMatch(/site do grupo/);
    expect(misplaced("/solucoes", "SUPERDROP", "OUTRO")).toBeNull(); // levou ao site do grupo
    expect(misplaced("/solucoes", "NEXTLEVEL", "ABRE")).toBeNull();
    expect(misplaced("/loja-nextlevel", "NEXTLEVEL", "404")).toMatch(/Site do grupo/);
    expect(misplaced("/loja-nextlevel", "NEXTLEVEL_COMMERCE", "ABRE")).toMatch(/site do grupo/);
    expect(misplaced("/termos", "SUPERDROP", "404")).toMatch(/grupo inteiro/);
    expect(misplaced("/termos", "BRAS_DIGITAL", "ABRE")).toBeNull();
    expect(misplaced("/como-funciona", "NEXTLEVEL", "ABRE")).toMatch(/só painéis/);
    expect(expectedAt("/planos", "SUPERDROP").kind).toBe("A_DEFINIR");
  });
});

describe("árvore", () => {
  it("agrupa por tipo, área e seção do menu, com contadores em cada galho e mapa mental", () => {
    const page = (route: string, kind: TreePage["kind"], areaKey: string, cells: TreePage["cells"] = {}, extra: Partial<TreePage> = {}): TreePage => ({ route, label: route, areaKey, areaLabel: areaKey, kind, tested: false, approved: false, problem: false, cells, ...extra });
    const t = buildMapTree([
      page("/master/financeiro/precos", "PAINEL", "master", { SUPERDROP: { state: "LOGIN", misplaced: "fora", hops: ["/login"] } }, { tested: true, approved: true }),
      page("/master/clientes", "PAINEL", "master"),
      page("/termos", "PUBLICA", "publicas", { SUPERDROP: { state: "404", misplaced: "falta", hops: [] } }),
    ]);
    expect(t.map((n) => n.label)).toEqual(["Painéis", "Páginas públicas e vitrines"]);
    expect(t[0]!.counts).toMatchObject({ total: 2, approved: 1, misplaced: 1, unchecked: 1 });
    expect(sectionOf("/master/financeiro/precos").section).toBe("Negócio");
    expect(t[0]!.children[0]!.children.map((s) => s.label).sort()).toEqual(["Negócio", "Operação"]);
    expect(t[0]!.routes.sort()).toEqual(["/master/clientes", "/master/financeiro/precos"]);
    expect(mermaidOf(t)).toContain("mindmap");
  });
});

describe("checagem por galho", () => {
  it("testa cada página nos 5 endereços, guarda e junta a mais nova; só o dono", async () => {
    const f = fake({ "superdrop.com.br/merchant": [307, "/login"], "lojas.nextlevelgroup.com.br/merchant": [307, "/login"], "bras.nextlevelgroup.com.br/merchant": [307, "/login"], "cargas.nextlevelgroup.com.br/merchant": [307, "/login"], "master.nextlevelgroup.com.br/merchant": [307, "/login"] });
    const r = await checkMap(ctx.db, ctx.actors.master, ["/merchant", "/nao-existe"], f);
    expect(r.results).toHaveLength(5);
    const { cells } = await mapCells(ctx.db, ctx.actors.master);
    expect(cells.find((c) => c.host === "NEXTLEVEL")).toMatchObject({ route: "/merchant", state: "LOGIN", misplaced: null });
    expect(cells.find((c) => c.host === "SUPERDROP")!.misplaced).toBeNull(); // painel do lojista no endereço da marca dele (D149)
    await checkMap(ctx.db, ctx.actors.master, ["/merchant"], fake({}));
    expect((await mapCells(ctx.db, ctx.actors.master)).cells.find((c) => c.host === "SUPERDROP")!.state).toBe("ABRE");
    const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: "Camila", email: "camila@nl.teste", password: "provisoria-1234", masterFunction: "COMERCIAL" });
    const staff = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!);
    await expect(checkMap(ctx.db, staff, ["/merchant"], f)).rejects.toThrow();
    await expect(mapCells(ctx.db, staff)).rejects.toThrow();
  });
});
