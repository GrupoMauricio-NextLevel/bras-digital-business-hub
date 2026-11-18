import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { paginasSite, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { campanhasDaLoja, criarCampanha, linkDaCampanha, modeloDaCampanha, veioDaCampanha } from "@/lib/business/campanhas";
import { criarPagina } from "@/lib/business/paginas";
import { atualizarContato, registrarContato } from "@/lib/business/contatos";

describe("página de campanha em poucos cliques (NB4, D339)", () => {
  it("monta topo com a oferta, motivos, formulário e contatos; o botão do topo leva ao formulário", () => {
    const t = modeloDaCampanha({ objetivo: "VISITA", titulo: "Aula experimental grátis", oferta: "Conheça o estúdio", motivos: ["Turmas pequenas", "", "Professores formados"] }, "Estúdio Leve");
    expect(t.order).toEqual(["destaque", "motivos", "orcamento", "contato"]);
    expect(t.sections.destaque!.settings).toMatchObject({ title: "Aula experimental grátis", ctaLabel: "Quero agendar", ctaLink: "#orcamento" });
    expect(t.sections.motivos!.settings.body).toBe("✓ Turmas pequenas\n✓ Professores formados");
    expect(t.sections.orcamento!.settings).toMatchObject({ buttonLabel: "Quero agendar", askService: true });
    const sem = modeloDaCampanha({ objetivo: "CONTATO", titulo: "Fale com a gente" }, "Vidraçaria");
    expect(sem.order).toEqual(["destaque", "orcamento", "contato"]);
    expect(sem.sections.orcamento!.settings).toMatchObject({ askService: false });
  });
  it("link de cada lugar leva a origem e o nome da campanha", () => {
    const u = new URL(linkDaCampanha("https://loja.com.br/", "box-sob-medida", "meta"));
    expect(u.pathname).toBe("/box-sob-medida");
    expect(Object.fromEntries(u.searchParams)).toEqual({ utm_source: "facebook", utm_medium: "paid", utm_campaign: "box-sob-medida" });
    expect(new URL(linkDaCampanha("https://x.com/store/a", "oferta", "google")).searchParams.get("utm_medium")).toBe("cpc");
  });
  it("contato da campanha pela etiqueta ou pela página", () => {
    expect(veioDaCampanha({ utmCampaign: "oferta", pagina: null }, "oferta")).toBe(true);
    expect(veioDaCampanha({ utmCampaign: null, pagina: "/store/a/oferta?x=1" }, "oferta")).toBe(true);
    expect(veioDaCampanha({ utmCampaign: null, pagina: "/store/a/oferta-2" }, "oferta")).toBe(false);
  });
  it("cria e publica só a página da campanha; números vêm dos contatos", async () => {
    const ctx = await freshDb();
    const r = await signupMember(ctx.db, { storeName: "Vidraçaria Cristal", ownerName: "Rita Lima", email: "rita@campanha.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true });
    const actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!) as Actor;
    const outra = await criarPagina(ctx.db, actor, r.storeId, { titulo: "Rascunho do dono", tipo: "LIVRE" });
    const c = await criarCampanha(ctx.db, actor, r.storeId, { objetivo: "ORCAMENTO", titulo: "Box sob medida", motivos: ["Garantia"] }, "Vidraçaria Cristal");
    expect(c.slug).toBe("box-sob-medida");
    const pag = await ctx.db.query.paginasSite.findFirst({ where: eq(paginasSite.id, c.id) });
    expect(pag).toMatchObject({ tipo: "CAMPANHA", noMenu: false, indexar: false });
    expect(pag!.published).not.toBeNull();
    expect((await ctx.db.query.paginasSite.findFirst({ where: eq(paginasSite.id, outra.id) }))!.published).toBeNull();
    const ct = await registrarContato(ctx.db, r.slug, { nome: "João Souza", whatsapp: "11988887777", tempoMs: 8000, chaveEnvio: "chave-campanha-001", origem: { utm_source: "facebook", utm_medium: "paid", utm_campaign: "box-sob-medida" } });
    await atualizarContato(ctx.db, actor, r.storeId, ct.id!, { situacao: "GANHO", valorCents: 129_000 });
    expect(await campanhasDaLoja(ctx.db, r.storeId)).toEqual([expect.objectContaining({ slug: "box-sob-medida", noAr: true, contatos: 1, fechados: 1, valorCents: 129_000 })]);
  });
});
