import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { trafegoDiario, trafegoEventos, trafegoSessoes } from "@/db/schema";
import { agoraNoSite, marcarLeadNaSessao, origemDaEntrada, origensPorCanal, registrarSinal, resumirELimparTrafego, type Sinal } from "@/lib/domain/trafego/coletor";

/** TR2 (D291): coletor próprio, sessões, "Agora no site", origens e limpeza de 90 dias. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const T0 = new Date("2026-11-13T15:00:00.000Z");
const mais = (min: number) => new Date(T0.getTime() + min * 60_000);
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari";
const sinal = (x: Partial<Sinal>): Sinal => ({ brand: "NEXTLEVEL_COMMERCE", visitanteId: "v_aaaaaaaaaaaaaaaa", sessaoId: null, tipo: "PAGE_VIEW", caminho: "/", hostProprio: "nextlevelcommerce.com.br", ua: UA, ...x });

describe("origem da entrada", () => {
  it("etiqueta e clique do anúncio vencem o site de origem; navegação interna é direto", () => {
    expect(origemDaEntrada("?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste&fbclid=IwAR1", "https://l.instagram.com/", "nextlevelcommerce.com.br"))
      .toMatchObject({ canal: "meta-pago", utmCampaign: "2026-12-teste", clickIds: { fbclid: "IwAR1" }, refHost: "l.instagram.com" });
    expect(origemDaEntrada("", "https://www.google.com/", "nextlevelcommerce.com.br")).toMatchObject({ canal: "google-organico", refHost: "google.com" });
    expect(origemDaEntrada("", "https://nextlevelcommerce.com.br/planos", "www.nextlevelcommerce.com.br")).toMatchObject({ canal: "direto", refHost: null });
    expect(origemDaEntrada("?ref=ANA", null, "x")).toMatchObject({ canal: "indicacao" });
    expect(origemDaEntrada("?utm_source=<script>", null, "x").utmSource).toBe("script");
  });
});

describe("sessões", () => {
  it("abre na primeira página, continua por 30 min, marca WhatsApp e cadastro, e encerra depois", async () => {
    const a = (await registrarSinal(ctx.db, sinal({ caminho: "/?x=1", busca: "?utm_source=instagram&utm_medium=bio&utm_campaign=2026-12-organico", referrer: "https://l.instagram.com/" }), T0))!;
    expect(a.nova).toBe(true);
    const b = (await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, caminho: "/planos", busca: "" }), mais(2)))!;
    expect(b).toEqual({ sessaoId: a.sessaoId, nova: false, codigo: a.codigo });
    // Recarregar a página com a mesma etiqueta não abre outra sessão.
    expect((await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, caminho: "/", busca: "?utm_source=instagram&utm_medium=bio&utm_campaign=2026-12-organico" }), mais(3)))!.nova).toBe(false);
    await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, tipo: "PING", caminho: "/temas" }), mais(4));
    await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, tipo: "CLIQUE_WHATSAPP", caminho: "/temas" }), mais(5));
    await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, tipo: "INICIO_CADASTRO", caminho: "/temas" }), mais(6));
    const s = (await ctx.db.query.trafegoSessoes.findFirst({ where: eq(trafegoSessoes.id, a.sessaoId) }))!;
    expect(s).toMatchObject({ canal: "instagram-organico", paginaEntrada: "/", paginaAtual: "/temas", paginas: 3, whatsapp: true, cadastro: true, lead: false, aparelho: "MOBILE", utmCampaign: "2026-12-organico" });
    const ev = await ctx.db.select().from(trafegoEventos).where(eq(trafegoEventos.sessaoId, a.sessaoId));
    expect(ev.map((e) => e.tipo).sort()).toEqual(["CLIQUE_WHATSAPP", "INICIO_CADASTRO", "PAGE_VIEW", "PAGE_VIEW", "PAGE_VIEW"]);
    // 31 min sem sinal: presença sozinha não ressuscita; a próxima página abre outra sessão.
    expect(await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, tipo: "PING" }), mais(37))).toBeNull();
    expect((await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId }), mais(38)))!.nova).toBe(true);
  });

  it("nova campanha no meio da visita abre outra sessão; sessão de outro visitante não é reaproveitada", async () => {
    const a = (await registrarSinal(ctx.db, sinal({}), T0))!;
    const b = (await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, busca: "?gclid=Cj0" }), mais(1)))!;
    expect(b.nova).toBe(true);
    const c = (await registrarSinal(ctx.db, sinal({ sessaoId: b.sessaoId, visitanteId: "v_bbbbbbbbbbbbbbbb" }), mais(2)))!;
    expect(c.nova).toBe(true);
    expect(await registrarSinal(ctx.db, sinal({ tipo: "CLIQUE_WHATSAPP" }), mais(3))).toBeNull();
    // Chegou do Google no meio da visita: outra sessão, com o canal certo.
    const g = (await registrarSinal(ctx.db, sinal({ visitanteId: "v_bbbbbbbbbbbbbbbb", sessaoId: c.sessaoId, referrer: "https://www.google.com/" }), mais(4)))!;
    expect(g.nova).toBe(true);
    expect((await ctx.db.query.trafegoSessoes.findFirst({ where: eq(trafegoSessoes.id, g.sessaoId) }))!.canal).toBe("google-organico");
  });

  it("lead marca a sessão viva; código estranho ou sessão vencida não marca", async () => {
    const a = (await registrarSinal(ctx.db, sinal({}), T0))!;
    expect(await marcarLeadNaSessao(ctx.db, a.sessaoId, "/quero-minha-loja", mais(5))).toBe(true);
    expect((await ctx.db.query.trafegoSessoes.findFirst({ where: eq(trafegoSessoes.id, a.sessaoId) }))!.lead).toBe(true);
    expect(await marcarLeadNaSessao(ctx.db, "x' or 1=1", "/", mais(5))).toBe(false);
    expect(await marcarLeadNaSessao(ctx.db, a.sessaoId, "/", mais(60))).toBe(false);
    expect(await marcarLeadNaSessao(ctx.db, null)).toBe(false);
  });
});

describe("leituras do Master", () => {
  it("Agora no site: só os últimos 5 minutos, entradas da última hora, marcos e números de hoje", async () => {
    const a = (await registrarSinal(ctx.db, sinal({ busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste&fbclid=F1" }), T0))!;
    await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, tipo: "CLIQUE_WHATSAPP", caminho: "/planos" }), mais(1));
    await registrarSinal(ctx.db, sinal({ visitanteId: "v_cccccccccccccccc", referrer: "https://www.google.com/", ua: "Mozilla/5.0 (Windows NT 10.0)" }), mais(-20));
    const d = await agoraNoSite(ctx.db, ctx.actors.master, mais(3));
    expect(d.agora).toBe(1);
    expect(d.porCanal).toEqual([{ chave: "meta-pago", total: 1 }]);
    expect(d.porPagina).toEqual([{ chave: "/", total: 1 }]);
    expect(d.entradas).toHaveLength(2);
    expect(d.entradas[0]).toMatchObject({ canal: "meta-pago", campanha: "2026-12-teste", ativa: true, whatsapp: true });
    expect(d.entradas[1]).toMatchObject({ canal: "google-organico", ativa: false, aparelho: "DESKTOP" });
    expect(d.marcos).toEqual([expect.objectContaining({ tipo: "CLIQUE_WHATSAPP", caminho: "/planos", canal: "meta-pago" })]);
    expect(d.hoje).toEqual({ sessoes: 2, whatsapp: 1, cadastros: 0, leads: 0 });
  });

  it("Origens: por canal com o período anterior e as campanhas", async () => {
    await registrarSinal(ctx.db, sinal({ busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste" }), T0);
    const b = (await registrarSinal(ctx.db, sinal({ visitanteId: "v_dddddddddddddddd", busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste" }), mais(10)))!;
    await marcarLeadNaSessao(ctx.db, b.sessaoId, "/", mais(12));
    await registrarSinal(ctx.db, sinal({ visitanteId: "v_eeeeeeeeeeeeeeee", referrer: "https://www.google.com/" }), new Date(T0.getTime() - 10 * 86_400_000));
    const o = await origensPorCanal(ctx.db, ctx.actors.master, 7, mais(60));
    expect(o.linhas.find((l) => l.canal === "meta-pago")).toMatchObject({ sessoes: 2, leads: 1, anteriores: 0 });
    expect(o.linhas.find((l) => l.canal === "google-organico")).toMatchObject({ sessoes: 0, anteriores: 1 });
    expect(o.campanhas).toEqual([expect.objectContaining({ campanha: "2026-12-teste", sessoes: 2, leads: 1 })]);
    expect(o.total).toMatchObject({ sessoes: 2, leads: 1, anteriores: 1 });
  });

  it("só a equipe do Master (dono, Comercial e Conteúdo) vê", async () => {
    await expect(agoraNoSite(ctx.db, ctx.actors.mantos)).rejects.toThrow(/NextLevel/);
    await expect(origensPorCanal(ctx.db, { ...ctx.actors.master, masterFunction: "FINANCEIRO" }, 7)).rejects.toThrow(/função/);
    await expect(agoraNoSite(ctx.db, { ...ctx.actors.master, masterFunction: "CONTEUDO" })).resolves.toMatchObject({ agora: 0 });
  });
});

describe("limpeza de 90 dias", () => {
  it("resume por dia, canal, campanha e aparelho e apaga o detalhe antigo; o recente fica", async () => {
    const velho = new Date("2026-07-01T15:00:00.000Z");
    const a = (await registrarSinal(ctx.db, sinal({ busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-07-x" }), velho))!;
    await registrarSinal(ctx.db, sinal({ sessaoId: a.sessaoId, caminho: "/planos" }), new Date(velho.getTime() + 60_000));
    await marcarLeadNaSessao(ctx.db, a.sessaoId, "/", new Date(velho.getTime() + 120_000));
    await registrarSinal(ctx.db, sinal({ visitanteId: "v_ffffffffffffffff", busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-07-x" }), velho);
    await registrarSinal(ctx.db, sinal({ visitanteId: "v_gggggggggggggggg" }), T0);
    const r = await resumirELimparTrafego(ctx.db, mais(60));
    expect(r.resumidas).toBe(2);
    expect(await ctx.db.select().from(trafegoDiario)).toEqual([{ dia: "2026-07-01", brand: "NEXTLEVEL_COMMERCE", canal: "meta-pago", campanha: "2026-07-x", aparelho: "MOBILE", sessoes: 2, paginas: 3, whatsapp: 0, cadastros: 0, leads: 1 }]);
    expect(await ctx.db.select().from(trafegoSessoes)).toHaveLength(1);
    expect((await ctx.db.select().from(trafegoEventos)).every((e) => e.sessaoId !== a.sessaoId)).toBe(true);
    // Rodar de novo não duplica.
    expect((await resumirELimparTrafego(ctx.db, mais(60))).resumidas).toBe(0);
  });
});
