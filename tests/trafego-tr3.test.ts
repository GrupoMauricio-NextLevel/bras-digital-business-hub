import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { origensContato, trafegoSessoes } from "@/db/schema";
import { createBrandLead } from "@/lib/domain/brand-leads";
import { CODIGO_VISITA, novoCodigoVisita, registrarSinal, type Sinal } from "@/lib/domain/trafego/coletor";
import { registrarOrigemDoContato, vincularCodigoVisita } from "@/lib/domain/trafego/origem-contato";
import { fichaCliente, funilComercial, salvarAcompanhamento } from "@/lib/domain/comercial";

/** TR3 (D293): origem completa de cada contato, código da visita no WhatsApp, Fechou/Perdeu no Comercial. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const AGORA = new Date();
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 320.0";
const visita = async (x: Partial<Sinal> = {}) => (await registrarSinal(ctx.db, { brand: "NEXTLEVEL_COMMERCE", visitanteId: `v_${"a".repeat(16)}`, sessaoId: null, tipo: "PAGE_VIEW", caminho: "/", ua: UA, local: { cidade: "Fortaleza", uf: "CE", pais: "BR" }, ...x }, AGORA))!;
const lead = async (email = "ana@loja.teste") => (await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "Ana Souza", email, phone: "11988887777" })).id;

describe("código da visita", () => {
  it("5 letras e números sem os que se confundem; cada visita nova ganha um", async () => {
    for (let i = 0; i < 50; i++) expect(novoCodigoVisita()).toMatch(CODIGO_VISITA);
    const v = await visita();
    expect(v.codigo).toMatch(CODIGO_VISITA);
    expect((await registrarSinal(ctx.db, { brand: "NEXTLEVEL_COMMERCE", visitanteId: `v_${"a".repeat(16)}`, sessaoId: v.sessaoId, tipo: "PING", caminho: "/" }, AGORA))!.codigo).toBe(v.codigo);
  });
});

describe("origem do contato", () => {
  it("visita com campanha: canal, campanha, peça, clique do anúncio, cidade e aparelho; marca a visita como lead; a primeira origem fica", async () => {
    const v = await visita({ busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste&utm_content=video-1&utm_term=amplo&fbclid=IwAR1" });
    const id = await lead();
    expect(await registrarOrigemDoContato(ctx.db, `interessado:${id}`, "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: { canal: "google-organico", page: "/blog" }, sessaoId: v.sessaoId }, "/quero-minha-loja", AGORA)).toBe(true);
    const o = (await ctx.db.query.origensContato.findFirst({ where: eq(origensContato.chave, `interessado:${id}`) }))!;
    expect(o).toMatchObject({ via: "FORMULARIO", canal: "meta-pago", utmCampaign: "2026-12-teste", utmContent: "video-1", utmTerm: "amplo", clickIds: { fbclid: "IwAR1" }, primeiroCanal: "google-organico", primeiraPagina: "/blog", cidade: "Fortaleza", uf: "CE", codigoVisita: v.codigo });
    expect(o.aparelho).toBe("Celular · iOS 17.4 · iPhone · App do Instagram");
    expect((await ctx.db.query.trafegoSessoes.findFirst({ where: eq(trafegoSessoes.id, v.sessaoId) }))!.lead).toBe(true);
    // Segunda vez não sobrescreve.
    expect(await registrarOrigemDoContato(ctx.db, `interessado:${id}`, "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: { utm_source: "google", utm_medium: "cpc" }, primeiro: {}, sessaoId: null })).toBe(false);
  });

  it("visita direta com campanha nos últimos 30 dias: vale a campanha, com a cidade da visita; sem nada: direto", async () => {
    const v = await visita();
    await registrarOrigemDoContato(ctx.db, "loja:abc", "NEXTLEVEL_COMMERCE", "CADASTRO", { ultimo: { utm_source: "instagram", utm_medium: "bio", utm_campaign: "2026-12-organico", canal: "instagram-organico" }, primeiro: {}, sessaoId: v.sessaoId }, "/cadastro", AGORA);
    expect(await ctx.db.query.origensContato.findFirst({ where: eq(origensContato.chave, "loja:abc") })).toMatchObject({ canal: "instagram-organico", utmCampaign: "2026-12-organico", cidade: "Fortaleza", codigoVisita: v.codigo });
    await registrarOrigemDoContato(ctx.db, "loja:xyz", "NEXTLEVEL_COMMERCE", "CADASTRO", { ultimo: {}, primeiro: {}, sessaoId: "tss_naoexiste" }, "/", AGORA);
    expect(await ctx.db.query.origensContato.findFirst({ where: eq(origensContato.chave, "loja:xyz") })).toMatchObject({ canal: "direto", cidade: null });
  });

  it("código do WhatsApp liga o contato à visita (e corrige a origem); só a equipe; código errado explica", async () => {
    const v = await visita({ busca: "?gclid=Cj0K&utm_source=google&utm_medium=cpc&utm_campaign=2026-12-busca" });
    const id = await lead();
    await registrarOrigemDoContato(ctx.db, `interessado:${id}`, "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: {}, sessaoId: null }, "/", AGORA);
    expect(await vincularCodigoVisita(ctx.db, ctx.actors.master, `interessado:${id}`, ` ${v.codigo!.toLowerCase()} `, AGORA)).toEqual({ canal: "google-pago", campanha: "2026-12-busca" });
    expect(await ctx.db.query.origensContato.findFirst({ where: eq(origensContato.chave, `interessado:${id}`) })).toMatchObject({ via: "CODIGO_WHATSAPP", canal: "google-pago", clickIds: { gclid: "Cj0K" } });
    await expect(vincularCodigoVisita(ctx.db, ctx.actors.master, `interessado:${id}`, "AB1", AGORA)).rejects.toThrow(/5 letras/);
    await expect(vincularCodigoVisita(ctx.db, ctx.actors.master, `interessado:${id}`, "ZZZZZ", AGORA)).rejects.toThrow(/Não achei/);
    await expect(vincularCodigoVisita(ctx.db, ctx.actors.master, "x; drop", v.codigo!, AGORA)).rejects.toThrow(/inválido/);
    await expect(vincularCodigoVisita(ctx.db, ctx.actors.mantos, `interessado:${id}`, v.codigo!, AGORA)).rejects.toThrow(/NextLevel/);
    await expect(vincularCodigoVisita(ctx.db, { ...ctx.actors.master, masterFunction: "FINANCEIRO" }, `interessado:${id}`, v.codigo!, AGORA)).rejects.toThrow(/função/);
  });
});

describe("Comercial: origem, Fechou e Perdeu", () => {
  it("a pessoa mostra de onde veio; fechar com valor vira pagante; perder pede motivo da lista; desfazer volta", async () => {
    const v = await visita({ busca: "?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste&fbclid=F1" });
    const id = await lead();
    await registrarOrigemDoContato(ctx.db, `interessado:${id}`, "NEXTLEVEL_COMMERCE", "FORMULARIO", { ultimo: {}, primeiro: {}, sessaoId: v.sessaoId }, "/", AGORA);
    const chave = `interessado:${id}`;
    let p = (await funilComercial(ctx.db, ctx.actors.master)).find((x) => x.chave === chave)!;
    expect(p.fonte).toMatchObject({ canal: "meta-pago", campanha: "2026-12-teste", anuncio: "Meta", cidade: "Fortaleza", via: "FORMULARIO" });
    expect(p.origem).toBe("Formulário · Anúncio Meta (Instagram/Facebook) · 2026-12-teste");
    expect(p.etapa).toBe("contato");

    await salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { fechou: { valorCents: 199700, descricao: "Loja Pronta" } });
    p = (await funilComercial(ctx.db, ctx.actors.master)).find((x) => x.chave === chave)!;
    expect(p.etapa).toBe("pagante");
    expect(p.fechou).toMatchObject({ valorCents: 199700, descricao: "Loja Pronta" });
    expect(p.detalhe).toMatch(/Fechado à mão: R\$\s?1\.997,00 · Loja Pronta/);
    const ficha = await fichaCliente(ctx.db, ctx.actors.master, chave);
    expect(ficha.linha.map((l) => l.texto).join("\n")).toMatch(/Chegou por Anúncio Meta.*2026-12-teste.*Fortaleza\/CE/);
    expect(ficha.linha.map((l) => l.texto).join("\n")).toMatch(/Negócio fechado/);

    await expect(salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { perdido: true, motivoPerda: "inventado" })).rejects.toThrow(/motivo/);
    await expect(salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { fechou: { valorCents: -5 } })).rejects.toThrow(/valor/);
    await salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { perdido: true, motivoPerda: "Achou caro: queria plano grátis" });
    p = (await funilComercial(ctx.db, ctx.actors.master)).find((x) => x.chave === chave)!;
    expect(p).toMatchObject({ etapa: "perdido", motivoPerda: "Achou caro: queria plano grátis" });

    await salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { perdido: false });
    await salvarAcompanhamento(ctx.db, ctx.actors.master, chave, "Equipe", { fechou: null });
    p = (await funilComercial(ctx.db, ctx.actors.master)).find((x) => x.chave === chave)!;
    expect(p).toMatchObject({ etapa: "contato", fechou: null, motivoPerda: null });
  });
});
