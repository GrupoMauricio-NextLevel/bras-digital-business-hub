import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { adsMetricasDiarias, anunciosLoja, conversoesEnvio } from "@/db/schema";
import { salvarConfigRetorno } from "@/lib/domain/trafego/retorno";
import { campanhasDaConta, chaveCampanha, contaMeta, estadoLeitura, ligarSalaAMeta, painelCampanhas, sincronizarMeta } from "@/lib/domain/trafego/meta-leitura";
import { registrarSinal } from "@/lib/domain/trafego/coletor";
import { registrarOrigemDoContato } from "@/lib/domain/trafego/origem-contato";
import { createBrandLead } from "@/lib/domain/brand-leads";
import { criarAnuncio, enviarDiagnostico, mudarEtapa, salaDaCampanha, salvarDiagnostico } from "@/lib/domain/anuncios";
import { ensureCatalogSeed } from "@/lib/domain/nl-catalog";

/** TR6 (D302): leitura da Meta (gasto por campanha), painel com custo por cliente real e números automáticos na sala. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); await ensureCatalogSeed(ctx.db); });

const AGORA = new Date("2026-11-16T15:00:00Z");
type Chamada = { url: string };
function metaFalsa(paginas: Record<string, unknown>[], status = 200) {
  const chamadas: Chamada[] = [];
  let i = 0;
  const f = (async (url: string | URL) => {
    chamadas.push({ url: String(url) });
    if (status !== 200) return new Response('{"error":{"message":"Invalid OAuth access_token=EAAsegredo"}}', { status });
    if (String(url).includes("/campaigns?")) return Response.json({ data: [{ id: "120001", name: "2026-11-cadastro-teste3dias", effective_status: "ACTIVE" }, { id: "120002", name: "Remarketing", effective_status: "PAUSED" }] });
    const p = paginas[Math.min(i++, paginas.length - 1)];
    return Response.json(p);
  }) as typeof fetch;
  return { f, chamadas };
}
const linha = (id: string, nome: string, dia: string, spend: string, extra: Record<string, unknown> = {}) => ({ campaign_id: id, campaign_name: nome, date_start: dia, spend, impressions: "1000", reach: "800", inline_link_clicks: "40", actions: [{ action_type: "lead", value: "3" }, { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "2" }], ...extra });

describe("leitura da Meta", () => {
  it("contas e nomes normalizados", () => {
    expect(contaMeta(" act_123456789 ")).toBe("act_123456789");
    expect(contaMeta("123456789")).toBe("act_123456789");
    expect(contaMeta("abc")).toBeNull();
    expect(chaveCampanha("2026-11 Cadastro Teste 3 dias")).toBe("2026-11-cadastro-teste-3-dias");
    expect(chaveCampanha("Promoção  Natal!")).toBe("promocao-natal");
  });

  it("sem token avisa; com token lê a conta da NextLevel com paginação, grava e não relê antes de 1 hora", async () => {
    expect(await sincronizarMeta(ctx.db, metaFalsa([]).f, AGORA)).toMatchObject({ ok: false, motivo: expect.stringMatching(/Sem o token/) });
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "EAAsegredo", metaContaAnuncios: "987654321" });
    const { f, chamadas } = metaFalsa([
      { data: [linha("120001", "2026-11-cadastro-teste3dias", "2026-11-15", "30.50")], paging: { next: "https://graph.facebook.com/next-page" } },
      { data: [linha("120001", "2026-11-cadastro-teste3dias", "2026-11-16", "29.50")] },
    ]);
    const r = await sincronizarMeta(ctx.db, f, AGORA);
    expect(r).toMatchObject({ ok: true, contas: 1, linhas: 2 });
    expect(chamadas[0]!.url).toMatch(/graph\.facebook\.com\/v\d+\.\d\/act_987654321\/insights\?/);
    expect(decodeURIComponent(chamadas[0]!.url)).toMatch(/"since":"2026-11-10","until":"2026-11-16"/);
    const rows = await ctx.db.select().from(adsMetricasDiarias).orderBy(adsMetricasDiarias.dia);
    expect(rows.map((x) => [x.dia, x.gastoCents, x.cliques, x.leads, x.conversas])).toEqual([["2026-11-15", 3050, 40, 3, 2], ["2026-11-16", 2950, 40, 3, 2]]);
    expect(await sincronizarMeta(ctx.db, f, new Date(AGORA.getTime() + 30 * 60_000))).toMatchObject({ pulou: true });
    // Releitura corrige o dia (a Meta ajusta os últimos dias), sem duplicar.
    await sincronizarMeta(ctx.db, metaFalsa([{ data: [linha("120001", "2026-11-cadastro-teste3dias", "2026-11-16", "31.00")] }]).f, AGORA, { forcar: true });
    expect((await ctx.db.select().from(adsMetricasDiarias).where(eq(adsMetricasDiarias.dia, "2026-11-16")))[0]!.gastoCents).toBe(3100);
  });

  it("erro da Meta fica guardado em português, sem o token", async () => {
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "EAAsegredo", metaContaAnuncios: "987654321" });
    const r = await sincronizarMeta(ctx.db, metaFalsa([], 400).f, AGORA);
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/Conta da NextLevel: A Meta respondeu 400/);
    expect(r.motivo).not.toMatch(/EAAsegredo/);
    expect((await estadoLeitura(ctx.db)).motivo).toBe(r.motivo);
  });
});

describe("painel Campanhas: gasto × resultado real", () => {
  it("cruza o gasto da Meta com visitas, contatos, lojas, pagantes e receita pela etiqueta da campanha", async () => {
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "EAAsegredo", metaContaAnuncios: "987654321" });
    await sincronizarMeta(ctx.db, metaFalsa([{ data: [linha("120001", "2026-11 Cadastro Teste3dias", "2026-11-15", "60.00")] }]).f, AGORA);
    // Duas visitas com a etiqueta (escrita diferente), um contato e um pagante com R$ 149.
    for (const v of ["a", "b"]) await registrarSinal(ctx.db, { brand: "NEXTLEVEL_COMMERCE", visitanteId: `v_${v.repeat(16)}`, sessaoId: null, tipo: "PAGE_VIEW", caminho: "/", busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-11-cadastro-teste3dias", ua: "Mozilla" }, AGORA);
    const { id } = await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "Ana Souza", email: "ana@x.teste", phone: "11988887777" });
    await registrarOrigemDoContato(ctx.db, `interessado:${id}`, "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: { utm_source: "meta", utm_medium: "pago", utm_campaign: "2026-11-cadastro-teste3dias" }, primeiro: {}, sessaoId: null }, "/", AGORA);
    await registrarOrigemDoContato(ctx.db, "loja:abc", "NEXTLEVEL_COMMERCE", "CADASTRO", { ultimo: { utm_source: "meta", utm_medium: "pago", utm_campaign: "2026-11-cadastro-teste3dias" }, primeiro: {}, sessaoId: null }, "/", AGORA);
    await ctx.db.insert(conversoesEnvio).values({ id: "cnv_t1", plataforma: "META", evento: "PAGANTE", chave: "loja:abc", eventoId: "pagante:loja:abc", valorCents: 14900, ocorreuEm: AGORA.toISOString(), dedupeKey: "t1" });
    const p = await painelCampanhas(ctx.db, ctx.actors.master, 7, new Date(AGORA.getTime() + 60_000));
    expect(p.linhas).toHaveLength(1);
    expect(p.linhas[0]).toMatchObject({ gastoCents: 6000, visitas: 2, contatos: 1, contas: 1, pagantes: 1, receitaCents: 14900, custoContatoCents: 6000, custoPaganteCents: 6000, retorno: 2.48, leadsMeta: 3 });
    expect(p.total).toMatchObject({ gastoCents: 6000, pagantes: 1 });
    await expect(painelCampanhas(ctx.db, { ...ctx.actors.master, masterFunction: "CONTEUDO" }, 7)).rejects.toThrow(/função/);
  });
});

describe("sala do lojista ligada à conta dele", () => {
  it("a equipe busca as campanhas, liga a sala e os números chegam sozinhos", async () => {
    await salvarConfigRetorno(ctx.db, ctx.actors.master, { metaToken: "EAAsegredo" });
    const { id } = await criarAnuncio(ctx.db, ctx.actors.mantos);
    await salvarDiagnostico(ctx.db, ctx.actors.mantos, id, { objetivo: "VENDAS", lojaToda: true, genero: "TODOS", idadeMin: 18, idadeMax: 55, regiao: "BRASIL", verbaDiariaCents: 3000, duracao: "30", contaAnuncios: "SIM", materiais: ["FOTOS"] });
    await enviarDiagnostico(ctx.db, ctx.actors.mantos, id);
    await mudarEtapa(ctx.db, ctx.actors.master, id, "NO_AR", "Ana");
    const { f } = metaFalsa([{ data: [linha("120001", "Loja Mantos", "2026-11-15", "25.00"), linha("120001", "Loja Mantos", "2026-11-16", "30.00")] }]);
    const c = await campanhasDaConta(ctx.db, ctx.actors.master, "555444333", f);
    expect(c).toMatchObject({ conta: "act_555444333", campanhas: [{ id: "120001", status: "ACTIVE" }, { id: "120002", status: "PAUSED" }] });
    await expect(campanhasDaConta(ctx.db, ctx.actors.mantos, "555444333", f)).rejects.toThrow(/NextLevel/);
    await expect(campanhasDaConta(ctx.db, ctx.actors.master, "555444333", metaFalsa([], 403).f)).rejects.toThrow(/acesso de parceiro/);
    await ligarSalaAMeta(ctx.db, ctx.actors.master, id, "555444333", ["120001", "x'"]);
    expect((await ctx.db.query.anunciosLoja.findFirst({ where: eq(anunciosLoja.id, id) }))).toMatchObject({ metaContaId: "act_555444333", metaCampanhas: ["120001"] });
    expect((await salaDaCampanha(ctx.db, ctx.actors.mantos, id)).metaAuto).toMatchObject({ dias: 0 });
    await sincronizarMeta(ctx.db, f, AGORA, { forcar: true });
    const sala = await salaDaCampanha(ctx.db, ctx.actors.mantos, id);
    expect(sala.metaAuto).toMatchObject({ gastoCents: 5500, impressoes: 2000, cliques: 80, conversas: 4, dias: 2 });
    // A loja vizinha não vê os números dessa conta.
    await expect(salaDaCampanha(ctx.db, ctx.actors.arena, id)).rejects.toThrow(/não encontrada/);
  });
});
