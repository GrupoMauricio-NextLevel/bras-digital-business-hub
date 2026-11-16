import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { paginasSite, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { arquivarPagina, criarPagina, editarPagina, listarPaginas, menuDoSite, paginaPublica, publicarPaginas, salvarRascunhoDaPagina, SLUGS_RESERVADOS } from "@/lib/business/paginas";
import { criarServico, editarServico, listarServicos, servicosPublicos } from "@/lib/business/servicos";
import { aplicarModeloDoSite, modeloDoSite } from "@/lib/business/modelos-site";
import { listVersions, resolveTemplate, restoreVersion } from "@/lib/themes/store";

let ctx: Awaited<ReturnType<typeof freshDb>>;
let n = 0;
async function negocio(nome = "Vidraçaria Modelo") {
  n += 1;
  const cpf = ["529.982.247-25", "111.444.777-35", "390.533.447-05", "123.456.789-09"][n % 4]!;
  const r = await signupMember(ctx.db, { storeName: nome, ownerName: "Rita Lima", email: `rita${n}@site.com.br`, password: "senha-segura-1", taxId: cpf, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, formato: "SITE" });
  const user = await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) });
  return { storeId: r.storeId, slug: r.slug, actor: actorFromUser(user!) as Actor };
}

describe("modelos de site (NB2, D307)", () => {
  it("institucional e academia montam sem perder seção e só com seções liberadas para todos os temas", () => {
    for (const m of ["institucional", "academia"] as const) {
      const s = modeloDoSite(m, "Vidraçaria Modelo");
      const tipos = Object.values(s.inicio.sections).map((x) => x.type);
      expect(tipos).toContain("services-grid");
      expect(tipos).toContain("contact-info");
      expect(s.inicio.order.length).toBe(5);
      for (const p of s.paginas) expect(p.modelo.order.length).toBeGreaterThan(0);
    }
    expect(modeloDoSite("academia", "Academia Forte").paginas.map((p) => p.slug)).toEqual(["sobre", "modalidades", "grade", "contato"]);
    expect(modeloDoSite("institucional", "X").paginas.map((p) => p.slug)).toEqual(["sobre", "servicos", "contato"]);
  });
});

describe("páginas livres do site (NB2, D307)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("endereço: reservado, repetido e formato errado são recusados com explicação", async () => {
    const a = await negocio();
    for (const r of ["cart", "checkout", "portal", "catalog"]) expect(SLUGS_RESERVADOS.has(r)).toBe(true);
    await expect(criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Carrinho", slug: "cart" })).rejects.toThrow(/já é usado pelo site/);
    await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Sobre nós", slug: "sobre" });
    await expect(criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Outra", slug: "sobre" })).rejects.toThrow(/Já existe uma página/);
    await expect(criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Errada", slug: "Sobre Nós!" })).rejects.toThrow(/letras minúsculas/);
    const auto = await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Nossa história" });
    expect(auto.slug).toBe("nossa-historia");
  });

  it("rascunho não aparece para o visitante; publicar põe no ar, no menu e no histórico", async () => {
    const a = await negocio();
    const m = modeloDoSite("institucional", "X").paginas[0]!.modelo;
    const p = await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Sobre", slug: "sobre", tipo: "INSTITUCIONAL" }, m);
    expect(await paginaPublica(ctx.db, a.storeId, "sobre")).toBeNull();
    expect(await paginaPublica(ctx.db, a.storeId, "sobre", { previa: true })).not.toBeNull();
    const r = await publicarPaginas(ctx.db, a.actor, a.storeId);
    expect(r.publicadas).toEqual([p.id]);
    const pub = await paginaPublica(ctx.db, a.storeId, "sobre");
    expect(pub?.modelo.order.length).toBe(m.order.length);
    expect(await menuDoSite(ctx.db, a.storeId)).toEqual([{ label: "Sobre", slug: "sobre" }]);
    expect((await listVersions(ctx.db, a.actor, a.storeId, `pagina:${p.id}`)).length).toBe(1);
    await arquivarPagina(ctx.db, a.actor, a.storeId, p.id);
    expect(await paginaPublica(ctx.db, a.storeId, "sobre")).toBeNull();
    expect(await menuDoSite(ctx.db, a.storeId)).toEqual([]);
  });

  it("duas abas: salvar com revisão antiga é recusado; histórico restaura no rascunho", async () => {
    const a = await negocio();
    const p = await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Contato", slug: "contato" }, modeloDoSite("institucional", "X").paginas[2]!.modelo);
    await publicarPaginas(ctx.db, a.actor, a.storeId, "Primeira");
    const row = await ctx.db.query.paginasSite.findFirst({ where: eq(paginasSite.id, p.id) });
    // Tema básico: seção se esconde, não se remove (regra dos níveis de tema).
    const oculto = structuredClone(row!.published!); oculto.sections[oculto.order[0]!]!.hidden = true;
    const s1 = await salvarRascunhoDaPagina(ctx.db, a.actor, a.storeId, p.id, oculto, { baseRevision: row!.revision });
    await expect(salvarRascunhoDaPagina(ctx.db, a.actor, a.storeId, p.id, oculto, { baseRevision: row!.revision })).rejects.toThrow(/outra aba/);
    await expect(salvarRascunhoDaPagina(ctx.db, a.actor, a.storeId, p.id, { v: 1, sections: {}, order: [] })).rejects.toThrow(/Você pode ocultá-lo/);
    expect(s1.revision).toBe(row!.revision + 1);
    const [v] = await listVersions(ctx.db, a.actor, a.storeId, `pagina:${p.id}`);
    const r = await restoreVersion(ctx.db, a.actor, a.storeId, v!.id);
    expect(r.page).toBe(`pagina:${p.id}`);
    const depois = await ctx.db.query.paginasSite.findFirst({ where: eq(paginasSite.id, p.id) });
    expect(depois!.draft!.sections[depois!.draft!.order[0]!]!.hidden).toBeFalsy();
  });

  it("outro negócio não lê nem altera as páginas (servidor)", async () => {
    const a = await negocio("Vidraçaria A"); const b = await negocio("Academia B");
    const p = await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Sobre", slug: "sobre" });
    await expect(salvarRascunhoDaPagina(ctx.db, b.actor, a.storeId, p.id, { v: 1, sections: {}, order: [] })).rejects.toThrow();
    await expect(salvarRascunhoDaPagina(ctx.db, b.actor, b.storeId, p.id, { v: 1, sections: {}, order: [] })).rejects.toThrow(/não encontrada/);
    await expect(editarPagina(ctx.db, b.actor, b.storeId, p.id, { titulo: "Invadido" })).rejects.toThrow(/não encontrada/);
    await expect(publicarPaginas(ctx.db, b.actor, a.storeId)).rejects.toThrow();
    expect(await listarPaginas(ctx.db, b.storeId)).toEqual([]);
  });

  it("editar título, endereço e menu; endereço novo também é conferido", async () => {
    const a = await negocio();
    const p = await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Sobre", slug: "sobre" });
    await criarPagina(ctx.db, a.actor, a.storeId, { titulo: "Contato", slug: "contato" });
    await expect(editarPagina(ctx.db, a.actor, a.storeId, p.id, { slug: "contato" })).rejects.toThrow(/Já existe/);
    await expect(editarPagina(ctx.db, a.actor, a.storeId, p.id, { slug: "checkout" })).rejects.toThrow(/já é usado/);
    await editarPagina(ctx.db, a.actor, a.storeId, p.id, { titulo: "Quem somos", slug: "quem-somos", noMenu: false });
    const row = await ctx.db.query.paginasSite.findFirst({ where: eq(paginasSite.id, p.id) });
    expect(row).toMatchObject({ titulo: "Quem somos", slug: "quem-somos", noMenu: false });
  });
});

describe("serviços da empresa (NB2, D307)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("cria, edita, esconde; o site mostra só os ativos; endereço não repete", async () => {
    const a = await negocio();
    const s1 = await criarServico(ctx.db, a.actor, a.storeId, { nome: "Box de banheiro", resumo: "Vidro temperado 8 mm", precoAPartirCents: 89000 });
    await criarServico(ctx.db, a.actor, a.storeId, { nome: "Box de banheiro" });
    await criarServico(ctx.db, a.actor, a.storeId, { nome: "Espelhos sob medida" });
    expect((await listarServicos(ctx.db, a.storeId)).map((s) => s.slug)).toEqual(["box-de-banheiro", "box-de-banheiro-2", "espelhos-sob-medida"]);
    await editarServico(ctx.db, a.actor, a.storeId, s1.id, { nome: "Box de banheiro", ativo: false });
    const pub = await servicosPublicos(ctx.db, a.storeId);
    expect(pub.map((s) => s.nome)).toEqual(["Box de banheiro", "Espelhos sob medida"]);
    expect(pub[0]!.precoAPartirCents).toBeNull();
  });

  it("imagem só da biblioteca ou https; outro negócio não mexe", async () => {
    const a = await negocio("Vidraçaria A"); const b = await negocio("Vidraçaria B");
    await expect(criarServico(ctx.db, a.actor, a.storeId, { nome: "Teste", imagemUrl: "javascript:alert(1)" })).rejects.toThrow(/biblioteca ou um endereço https/);
    const s = await criarServico(ctx.db, a.actor, a.storeId, { nome: "Espelho" });
    await expect(criarServico(ctx.db, b.actor, a.storeId, { nome: "Invasão" })).rejects.toThrow();
    await expect(editarServico(ctx.db, b.actor, b.storeId, s.id, { nome: "Invasão" })).rejects.toThrow(/não encontrado/);
  });
});

describe("aplicar o modelo de site (NB2, D307)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("publicado na hora: início com serviços e contato, páginas no menu; segunda vez não duplica", async () => {
    const a = await negocio();
    const r = await aplicarModeloDoSite(ctx.db, a.actor, a.storeId, "institucional", "Vidraçaria Modelo", { publicar: true });
    expect(r.criadas).toEqual(["sobre", "servicos", "contato"]);
    const store = await ctx.db.query.stores.findFirst({ where: (s, { eq: e }) => e(s.id, a.storeId) });
    const inicio = (await resolveTemplate(ctx.db, store!, "home")).template;
    expect(Object.values(inicio.sections).map((x) => x.type)).toEqual(expect.arrayContaining(["hero", "services-grid", "contact-info"]));
    expect((await menuDoSite(ctx.db, a.storeId)).map((m) => m.slug)).toEqual(["sobre", "servicos", "contato"]);
    const de2 = await aplicarModeloDoSite(ctx.db, a.actor, a.storeId, "academia", "Vidraçaria Modelo");
    expect(de2.criadas).toEqual(["modalidades", "grade"]);
  });
});
