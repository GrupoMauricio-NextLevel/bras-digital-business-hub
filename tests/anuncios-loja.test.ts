import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { corporateQuotes, emailOutbox, orders } from "@/db/schema";
import { ensureCatalogSeed } from "@/lib/domain/nl-catalog";
import { updateQuote } from "@/lib/domain/corporate-sales";
import {
  aceitarProposta, anunciosDaLoja, cancelarAnuncio, criarAnuncio, criarPropostaDoAnuncio, enviarDiagnostico, lancarResultado, marcarPendencia,
  mensagemDaEquipe, mensagemDoLojista, mesaDeAnuncios, mudarEtapa, novaPendencia, resumoDiagnostico, salaDaCampanha, salvarDiagnostico,
} from "@/lib/domain/anuncios";

/** D299: anúncios da loja na Meta, do diagnóstico no painel do lojista à campanha no ar, com a mesa da equipe no Master. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); await ensureCatalogSeed(ctx.db); });

const DIAG = { objetivo: "VENDAS", lojaToda: true, genero: "MULHERES", idadeMin: 22, idadeMax: 45, regiao: "ESTADOS", estados: ["SP", "MG"], verbaDiariaCents: 3000, duracao: "30", contaAnuncios: "NAO", materiais: ["FOTOS"], instagram: "@@minha.loja", oferta: "Frete grátis acima de R$ 199" } as const;

describe("diagnóstico do lojista", () => {
  it("rascunho salva aos poucos, valida no envio e cria as pendências certas", async () => {
    const { id } = await criarAnuncio(ctx.db, ctx.actors.mantos);
    expect((await criarAnuncio(ctx.db, ctx.actors.mantos)).id).toBe(id); // um rascunho por vez
    await salvarDiagnostico(ctx.db, ctx.actors.mantos, id, { objetivo: "VENDAS" });
    await expect(enviarDiagnostico(ctx.db, ctx.actors.mantos, id)).rejects.toThrow();
    await salvarDiagnostico(ctx.db, ctx.actors.mantos, id, { ...DIAG, regiao: "ESTADOS", estados: [] });
    await expect(enviarDiagnostico(ctx.db, ctx.actors.mantos, id)).rejects.toThrow(/estado/);
    await expect(salvarDiagnostico(ctx.db, ctx.actors.mantos, id, { verbaDiariaCents: 500 })).rejects.toThrow(/R\$ 10/);
    await salvarDiagnostico(ctx.db, ctx.actors.mantos, id, DIAG);
    await enviarDiagnostico(ctx.db, ctx.actors.mantos, id);
    const sala = await salaDaCampanha(ctx.db, ctx.actors.mantos, id);
    expect(sala.anuncio).toMatchObject({ status: "ENVIADA", nome: expect.stringMatching(/^Vender mais na loja · /), utmCampaign: expect.stringMatching(/^nl-meta-[a-z0-9]{6}$/) });
    expect(sala.anuncio.diagnostico).toMatchObject({ instagram: "minha.loja" });
    expect(sala.anuncio.pendencias.map((p) => p.chave)).toEqual(["conta", "acesso", "pagamento", "materiais", "instagram"]);
    expect(sala.eventos[0]!.texto).toMatch(/mesa da equipe/);
    expect((await ctx.db.select().from(emailOutbox)).some((e) => e.subject === "Recebemos o diagnóstico da sua campanha")).toBe(true);
    await expect(salvarDiagnostico(ctx.db, ctx.actors.mantos, id, { objetivo: "WHATSAPP" })).rejects.toThrow(/já foi enviado/);
  });
  it("resumo em português, sem promessa de resultado", () => {
    const r = resumoDiagnostico(DIAG as never).join("\n");
    expect(r).toMatch(/Verba na Meta: R\$\s?30,00 por dia por 30 dias \(cerca de R\$\s?900,00\)/);
    expect(r).toMatch(/Onde: SP, MG/);
    expect(r).not.toMatch(/garant|retorno de|lucro/i);
  });
  it("uma loja não vê nem mexe na campanha de outra; funcionário não cuida de anúncios", async () => {
    const { id } = await criarAnuncio(ctx.db, ctx.actors.mantos);
    await expect(salaDaCampanha(ctx.db, ctx.actors.arena, id)).rejects.toThrow(/não encontrada/);
    await expect(salvarDiagnostico(ctx.db, ctx.actors.arena, id, { objetivo: "VENDAS" })).rejects.toThrow(/não encontrada/);
    await expect(criarAnuncio(ctx.db, { ...ctx.actors.mantos, storeRole: "STAFF" })).rejects.toThrow(/dono da loja/);
    expect(await anunciosDaLoja(ctx.db, ctx.actors.arena)).toEqual([]);
  });
});

describe("mesa da equipe e sala da campanha", () => {
  async function enviada() {
    const { id } = await criarAnuncio(ctx.db, ctx.actors.mantos);
    await salvarDiagnostico(ctx.db, ctx.actors.mantos, id, DIAG);
    await enviarDiagnostico(ctx.db, ctx.actors.mantos, id);
    return id;
  }
  it("da mesa até o ar: etapas, conversa, proposta com aceite, pendências e números", async () => {
    const id = await enviada();
    const mesa = await mesaDeAnuncios(ctx.db, ctx.actors.master);
    expect(mesa).toHaveLength(1);
    expect(mesa[0]).toMatchObject({ status: "ENVIADA", pendentesLojista: 5, pendentesEquipe: 0, aguardandoResposta: false });

    await mensagemDoLojista(ctx.db, ctx.actors.mantos, id, "Dono", "Posso anunciar só os vestidos?");
    expect((await mesaDeAnuncios(ctx.db, ctx.actors.master))[0]!.aguardandoResposta).toBe(true);
    await mensagemDaEquipe(ctx.db, ctx.actors.master, id, "Ana (NextLevel)", "Pode sim, vamos focar nos vestidos.");
    expect((await mesaDeAnuncios(ctx.db, ctx.actors.master))[0]!.aguardandoResposta).toBe(false);

    await mudarEtapa(ctx.db, ctx.actors.master, id, "ANALISE", "Ana (NextLevel)");
    await expect(mudarEtapa(ctx.db, ctx.actors.master, id, "PROPOSTA", "Ana")).rejects.toThrow(/Monte e envie a proposta/);
    const { quoteId } = await criarPropostaDoAnuncio(ctx.db, ctx.actors.master, id);
    const q = (await ctx.db.query.corporateQuotes.findFirst({ where: eq(corporateQuotes.id, quoteId) }))!;
    expect(q).toMatchObject({ requesterType: "STORE", storeId: ctx.seed.stores.mantos.id, status: "DRAFTING" });
    expect(q.briefing).toMatch(/Objetivo: Vender mais na loja/);
    expect((await criarPropostaDoAnuncio(ctx.db, ctx.actors.master, id)).quoteId).toBe(quoteId);
    await expect(aceitarProposta(ctx.db, ctx.actors.mantos, id, "Dono")).rejects.toThrow(/não está aberta/);
    await updateQuote(ctx.db, ctx.actors.master, quoteId, { items: [{ description: "Gestão de Meta Ads (1º mês)", amountCents: 69700 }], status: "SENT" });
    await mudarEtapa(ctx.db, ctx.actors.master, id, "PROPOSTA", "Ana");
    let sala = await salaDaCampanha(ctx.db, ctx.actors.mantos, id);
    expect(sala.proposta).toMatchObject({ status: "SENT", totalCents: 69700 });
    expect(sala.anuncio.pendencias[0]).toMatchObject({ chave: "aceite", quem: "LOJISTA" });
    await expect(marcarPendencia(ctx.db, ctx.actors.mantos, id, "aceite", true)).rejects.toThrow(/botão da proposta/);
    await aceitarProposta(ctx.db, ctx.actors.mantos, id, "Dono");
    sala = await salaDaCampanha(ctx.db, ctx.actors.mantos, id);
    expect(sala.anuncio.status).toBe("PREPARACAO");
    expect(sala.proposta!.status).toBe("ACCEPTED");
    expect(sala.anuncio.pendencias[0]!.feitoEm).not.toBeNull();

    await marcarPendencia(ctx.db, ctx.actors.mantos, id, "acesso", true, "Dono");
    await novaPendencia(ctx.db, ctx.actors.master, id, { rotulo: "Escrever os textos dos anúncios", quem: "EQUIPE" }, "Ana");
    const chaveEquipe = (await salaDaCampanha(ctx.db, ctx.actors.mantos, id)).anuncio.pendencias.at(-1)!.chave;
    await expect(marcarPendencia(ctx.db, ctx.actors.mantos, id, chaveEquipe, true)).rejects.toThrow(/da equipe/);
    await marcarPendencia(ctx.db, ctx.actors.master, id, chaveEquipe, true, "Ana");

    for (const st of ["CONFIGURACAO", "REVISAO_META", "NO_AR"] as const) await mudarEtapa(ctx.db, ctx.actors.master, id, st, "Ana");
    await expect(cancelarAnuncio(ctx.db, ctx.actors.mantos, id, "Dono")).rejects.toThrow(/peça a pausa/);
    await lancarResultado(ctx.db, ctx.actors.master, id, "Ana", { de: "2026-11-15", ate: "2026-11-21", gastoCents: 21000, alcance: 18400, cliques: 520, conversas: 12, comentario: "Vestido azul é o que mais chama." });
    await expect(lancarResultado(ctx.db, ctx.actors.master, id, "Ana", { de: "2026-11-22", ate: "2026-11-21", gastoCents: 0, alcance: 0, cliques: 0, conversas: 0 })).rejects.toThrow(/antes da final/);

    // Vendas pagas da loja com a etiqueta da campanha aparecem sozinhas.
    const utm = (await salaDaCampanha(ctx.db, ctx.actors.mantos, id)).anuncio.utmCampaign;
    const [ped] = await ctx.db.select({ id: orders.id }).from(orders).where(eq(orders.storeId, ctx.seed.stores.mantos.id)).limit(1);
    if (ped) await ctx.db.update(orders).set({ utmCampaign: utm, customerPaymentStatus: "PAID" }).where(eq(orders.id, ped.id));
    sala = await salaDaCampanha(ctx.db, ctx.actors.mantos, id);
    expect(sala.anuncio).toMatchObject({ status: "NO_AR", responsavelNome: "Ana (NextLevel)" });
    expect(sala.anuncio.noArEm).not.toBeNull();
    expect(sala.totais).toEqual({ gastoCents: 21000, alcance: 18400, cliques: 520, conversas: 12 });
    if (ped) expect(sala.vendas.pedidos).toBe(1);
    expect(sala.eventos.map((e) => e.tipo)).toEqual(expect.arrayContaining(["ETAPA", "MENSAGEM", "PROPOSTA", "PENDENCIA", "RESULTADO"]));
    expect(sala.eventos.find((e) => e.tipo === "RESULTADO")!.texto).toMatch(/R\$\s?210,00 investidos na Meta, 18\.400 pessoas alcançadas, 520 cliques, 12 conversas/);
    const assuntos = (await ctx.db.select().from(emailOutbox)).map((e) => e.subject);
    expect(assuntos).toEqual(expect.arrayContaining(["Sua campanha: no ar", "Números novos da sua campanha", "Nova mensagem da equipe sobre a sua campanha"]));
  });

  it("só a equipe certa mexe na mesa; rascunho não aparece; lojista cancela antes do ar", async () => {
    const { id: rasc } = await criarAnuncio(ctx.db, ctx.actors.mantos);
    expect(await mesaDeAnuncios(ctx.db, ctx.actors.master)).toEqual([]);
    await expect(mensagemDoLojista(ctx.db, ctx.actors.mantos, rasc, "Dono", "oi")).rejects.toThrow(/Envie o diagnóstico/);
    const id = await (async () => { await salvarDiagnostico(ctx.db, ctx.actors.mantos, rasc, DIAG); await enviarDiagnostico(ctx.db, ctx.actors.mantos, rasc); return rasc; })();
    await expect(mesaDeAnuncios(ctx.db, { ...ctx.actors.master, masterFunction: "FINANCEIRO" })).rejects.toThrow(/função/);
    await expect(mudarEtapa(ctx.db, ctx.actors.mantos, id, "NO_AR", "x")).rejects.toThrow(/NextLevel/);
    await expect(mudarEtapa(ctx.db, ctx.actors.master, id, "RASCUNHO", "x")).rejects.toThrow(/lojista/);
    await cancelarAnuncio(ctx.db, ctx.actors.mantos, id, "Dono");
    expect((await salaDaCampanha(ctx.db, ctx.actors.mantos, id)).anuncio.status).toBe("CANCELADA");
  });
});
