import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { adsMetricasDiarias, anunciosLoja, conversoesEnvio, origensContato, platformSettings, trafegoSessoes } from "@/db/schema";
import { decryptSecret } from "@/lib/security/crypto";
import { timeoutSignal } from "@/lib/http-timeout";
import { type Actor, requireMasterFn } from "../access";
import { DomainError } from "../errors";
import { diaDeBrasilia } from "../visitas";
import { lerGuardado, META_GRAPH_VERSAO } from "./retorno";

/**
 * Leitura da Meta (TR6, D302): gasto, impressões, alcance, cliques no link, conversas e leads de cada campanha, por dia,
 * pela API de Marketing (só leitura). Duas origens:
 * - a conta de anúncios da NextLevel (painel Campanhas do Master, com o custo por cliente real);
 * - as contas dos lojistas que deram acesso de parceiro (números automáticos na sala da campanha, D299).
 * O token é o mesmo da API de conversões (D298), com permissão de leitura de anúncios. Nunca vai para log nem tela.
 */
const ESTADO = "trafego.meta.leitura";
const INTERVALO_MIN = 60;
export const contaMeta = (v: string | null | undefined) => { const d = (v ?? "").replace(/\s/g, "").replace(/^act_/, ""); return /^\d{5,20}$/.test(d) ? `act_${d}` : null; };
const limparErro = (t: string) => t.replace(/access_token=[^&\s"]+/g, "access_token=…").slice(0, 300);

type Acao = { action_type?: string; value?: string };
type Linha = { campaign_id?: string; campaign_name?: string; date_start?: string; spend?: string; impressions?: string; reach?: string; inline_link_clicks?: string; actions?: Acao[] };
const n = (v: string | undefined) => Math.max(0, Math.round(Number(v ?? 0) || 0));
const soma = (acoes: Acao[] | undefined, tipos: RegExp) => (acoes ?? []).filter((a) => tipos.test(a.action_type ?? "")).reduce((t, a) => t + n(a.value), 0);

/** Insights por campanha e por dia, com paginação. Lança DomainError com a resposta da Meta em português. */
export async function lerInsights(token: string, conta: string, desde: string, ate: string, fetchImpl: typeof fetch, campanhas?: string[]) {
  const q = new URLSearchParams({
    level: "campaign", time_increment: "1", limit: "500", access_token: token,
    time_range: JSON.stringify({ since: desde, until: ate }),
    fields: "campaign_id,campaign_name,date_start,spend,impressions,reach,inline_link_clicks,actions",
    ...(campanhas?.length ? { filtering: JSON.stringify([{ field: "campaign.id", operator: "IN", value: campanhas }]) } : {}),
  });
  let url: string | null = `https://graph.facebook.com/${META_GRAPH_VERSAO}/${conta}/insights?${q.toString()}`;
  const linhas: typeof adsMetricasDiarias.$inferInsert[] = [];
  for (let pagina = 0; url && pagina < 20; pagina++) {
    const r: Response = await fetchImpl(url, { signal: timeoutSignal() });
    const txt = await r.text();
    if (!r.ok) throw new DomainError("META", `A Meta respondeu ${r.status}: ${limparErro(txt) || "sem detalhe"}`);
    const j = JSON.parse(txt) as { data?: Linha[]; paging?: { next?: string } };
    for (const l of j.data ?? []) {
      if (!l.campaign_id || !l.date_start) continue;
      linhas.push({
        plataforma: "META", contaId: conta, campanhaId: l.campaign_id, dia: l.date_start, campanhaNome: (l.campaign_name ?? l.campaign_id).slice(0, 200),
        gastoCents: Math.round(Number(l.spend ?? 0) * 100) || 0, impressoes: n(l.impressions), alcance: n(l.reach), cliques: n(l.inline_link_clicks),
        conversas: soma(l.actions, /messaging_conversation_started/), leads: soma(l.actions, /^(lead|offsite_conversion\.fb_pixel_lead|onsite_conversion\.lead_grouped)$/),
      });
    }
    url = j.paging?.next ?? null;
  }
  return linhas;
}

async function gravar(db: Database, linhas: typeof adsMetricasDiarias.$inferInsert[]) {
  for (const l of linhas) {
    await db.insert(adsMetricasDiarias).values(l).onConflictDoUpdate({
      target: [adsMetricasDiarias.plataforma, adsMetricasDiarias.contaId, adsMetricasDiarias.campanhaId, adsMetricasDiarias.dia],
      set: { campanhaNome: l.campanhaNome, gastoCents: l.gastoCents, impressoes: l.impressoes, alcance: l.alcance, cliques: l.cliques, conversas: l.conversas, leads: l.leads, atualizadoEm: new Date().toISOString() },
    });
  }
}

export type EstadoLeitura = { em: string | null; ok: boolean; motivo: string | null; contas: number; linhas: number };
export async function estadoLeitura(db: Database): Promise<EstadoLeitura> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, ESTADO) });
  const v = (row?.value ?? {}) as Partial<EstadoLeitura>;
  return { em: v.em ?? null, ok: v.ok ?? false, motivo: v.motivo ?? null, contas: v.contas ?? 0, linhas: v.linhas ?? 0 };
}
async function gravarEstado(db: Database, e: EstadoLeitura) {
  await db.insert(platformSettings).values({ key: ESTADO, value: e }).onConflictDoUpdate({ target: platformSettings.key, set: { value: e, updatedAt: new Date().toISOString() } });
}

/**
 * Rotina (no máximo uma vez por hora, ou "Atualizar agora"): relê os últimos 7 dias da conta da NextLevel e de cada sala
 * de campanha ligada a uma conta de lojista (na primeira leitura de uma sala, desde que ela foi ao ar, até 90 dias).
 * Uma conta com erro não para as outras; o motivo fica guardado para a tela.
 */
export async function sincronizarMeta(db: Database, fetchImpl: typeof fetch = fetch, agora = new Date(), opts: { forcar?: boolean } = {}): Promise<EstadoLeitura & { pulou?: boolean }> {
  const antes = await estadoLeitura(db);
  // Depois de uma leitura boa, espera 1 hora; depois de uma falha (sem token, Meta fora), tenta de novo na próxima volta.
  if (!opts.forcar && antes.ok && antes.em && agora.getTime() - new Date(antes.em).getTime() < INTERVALO_MIN * 60_000) return { ...antes, pulou: true };
  const g = await lerGuardado(db);
  const token = decryptSecret(g.metaTokenEnc);
  const ate = diaDeBrasilia(agora);
  const dias = (k: number) => diaDeBrasilia(new Date(agora.getTime() - k * 86_400_000));
  if (!token) { const e = { em: agora.toISOString(), ok: false, motivo: "Sem o token da Meta (Master → Tráfego e campanhas → Retorno às plataformas).", contas: 0, linhas: 0 }; await gravarEstado(db, e); return e; }
  const erros: string[] = []; let contas = 0; let linhas = 0;
  const nl = contaMeta(g.metaContaAnuncios);
  if (nl) {
    try { const l = await lerInsights(token, nl, dias(6), ate, fetchImpl); await gravar(db, l); linhas += l.length; contas++; }
    catch (e) { erros.push(`Conta da NextLevel: ${e instanceof Error ? e.message : String(e)}`); }
  }
  const salas = await db.select().from(anunciosLoja).where(and(isNotNull(anunciosLoja.metaContaId), inArray(anunciosLoja.status, ["REVISAO_META", "NO_AR", "PAUSADA", "ENCERRADA"])));
  for (const s of salas) {
    const conta = contaMeta(s.metaContaId);
    if (!conta || !s.metaCampanhas.length) continue;
    // Encerrada só é lida mais uma vez, até 7 dias depois do último movimento.
    if (s.status === "ENCERRADA" && agora.getTime() - new Date(s.updatedAt).getTime() > 7 * 86_400_000) continue;
    const ja = await db.select({ n: sql<number>`count(*)` }).from(adsMetricasDiarias).where(and(eq(adsMetricasDiarias.contaId, conta), inArray(adsMetricasDiarias.campanhaId, s.metaCampanhas)));
    const inicio = Number(ja[0]?.n ?? 0) ? dias(6) : (s.noArEm && s.noArEm > new Date(agora.getTime() - 90 * 86_400_000).toISOString() ? diaDeBrasilia(new Date(s.noArEm)) : dias(89));
    try { const l = await lerInsights(token, conta, inicio, ate, fetchImpl, s.metaCampanhas); await gravar(db, l); linhas += l.length; contas++; }
    catch (e) { erros.push(`${s.nome}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  const e = { em: agora.toISOString(), ok: erros.length === 0, motivo: erros.length ? erros.join(" · ").slice(0, 600) : (!nl && !salas.length ? "Informe o número da conta de anúncios da NextLevel." : null), contas, linhas };
  await gravarEstado(db, e);
  return e;
}

/** Campanhas de uma conta (para a equipe escolher quais pertencem a uma sala de lojista). */
export async function campanhasDaConta(db: Database, actor: Actor, contaBruta: string, fetchImpl: typeof fetch = fetch) {
  requireMasterFn(actor, ["COMERCIAL", "CONTEUDO"]);
  const conta = contaMeta(contaBruta);
  if (!conta) throw new DomainError("CONTA", "O número da conta de anúncios tem só algarismos (o lojista vê no Gerenciador de Anúncios).");
  const token = decryptSecret((await lerGuardado(db)).metaTokenEnc);
  if (!token) throw new DomainError("TOKEN", "Falta o token da Meta em Tráfego e campanhas → Retorno às plataformas.");
  const q = new URLSearchParams({ fields: "id,name,effective_status", limit: "100", access_token: token });
  const r = await fetchImpl(`https://graph.facebook.com/${META_GRAPH_VERSAO}/${conta}/campaigns?${q.toString()}`, { signal: timeoutSignal() });
  const txt = await r.text();
  if (!r.ok) throw new DomainError("META", r.status === 400 || r.status === 403 ? "A Meta não liberou esta conta. Confira se o lojista deu acesso de parceiro à NextLevel (com permissão de anúncios)." : `A Meta respondeu ${r.status}: ${limparErro(txt)}`);
  const j = JSON.parse(txt) as { data?: { id: string; name: string; effective_status?: string }[] };
  return { conta, campanhas: (j.data ?? []).map((c) => ({ id: c.id, nome: c.name, status: c.effective_status ?? "" })) };
}

/** A equipe liga a sala à conta e às campanhas do lojista. */
export async function ligarSalaAMeta(db: Database, actor: Actor, anuncioId: string, contaBruta: string, campanhas: string[]) {
  requireMasterFn(actor, ["COMERCIAL", "CONTEUDO"]);
  const conta = contaBruta.trim() ? contaMeta(contaBruta) : null;
  if (contaBruta.trim() && !conta) throw new DomainError("CONTA", "O número da conta de anúncios tem só algarismos.");
  const ids = [...new Set(campanhas.filter((c) => /^\d{5,30}$/.test(c)))].slice(0, 20);
  await db.update(anunciosLoja).set({ metaContaId: conta, metaCampanhas: conta ? ids : [], updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, anuncioId));
}

/** Números automáticos de uma sala (soma por campanha ligada). */
export async function numerosDaSala(db: Database, conta: string | null, campanhas: string[]) {
  if (!conta || !campanhas.length) return null;
  const [r] = await db.select({
    gastoCents: sql<number>`coalesce(sum(${adsMetricasDiarias.gastoCents}), 0)`, impressoes: sql<number>`coalesce(sum(${adsMetricasDiarias.impressoes}), 0)`,
    cliques: sql<number>`coalesce(sum(${adsMetricasDiarias.cliques}), 0)`, conversas: sql<number>`coalesce(sum(${adsMetricasDiarias.conversas}), 0)`,
    dias: sql<number>`count(distinct ${adsMetricasDiarias.dia})`, em: sql<string | null>`max(${adsMetricasDiarias.atualizadoEm})`,
  }).from(adsMetricasDiarias).where(and(eq(adsMetricasDiarias.contaId, conta), inArray(adsMetricasDiarias.campanhaId, campanhas)));
  if (!Number(r?.dias)) return { gastoCents: 0, impressoes: 0, cliques: 0, conversas: 0, dias: 0, em: null };
  return { gastoCents: Number(r!.gastoCents), impressoes: Number(r!.impressoes), cliques: Number(r!.cliques), conversas: Number(r!.conversas), dias: Number(r!.dias), em: r!.em ? new Date(r!.em).toISOString() : null };
}

// ---------------------------------------------------------------------------------------------------------------------
// Painel Campanhas do Master: gasto da Meta × resultado real do sistema
// ---------------------------------------------------------------------------------------------------------------------
/** A etiqueta utm_campaign dos anúncios é o nome da campanha ({{campaign.name}}): comparação sem acento e sem espaço. */
export const chaveCampanha = (v: string | null | undefined) => (v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type LinhaCampanha = {
  chave: string; nome: string; gastoCents: number; impressoes: number; cliques: number; leadsMeta: number;
  visitas: number; contatos: number; contas: number; pagantes: number; receitaCents: number;
  custoContatoCents: number | null; custoPaganteCents: number | null; retorno: number | null;
};

export async function painelCampanhas(db: Database, actor: Actor, dias: 7 | 30 | 90, agora = new Date()) {
  requireMasterFn(actor, ["COMERCIAL"]);
  const g = await lerGuardado(db);
  const conta = contaMeta(g.metaContaAnuncios);
  const desdeDia = diaDeBrasilia(new Date(agora.getTime() - (dias - 1) * 86_400_000));
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const [metricas, sessoes, origens, resultados, estado] = await Promise.all([
    conta ? db.select({ id: adsMetricasDiarias.campanhaId, nome: sql<string>`max(${adsMetricasDiarias.campanhaNome})`, gasto: sql<number>`sum(${adsMetricasDiarias.gastoCents})`, imp: sql<number>`sum(${adsMetricasDiarias.impressoes})`, cliq: sql<number>`sum(${adsMetricasDiarias.cliques})`, leads: sql<number>`sum(${adsMetricasDiarias.leads})` })
      .from(adsMetricasDiarias).where(and(eq(adsMetricasDiarias.contaId, conta), gte(adsMetricasDiarias.dia, desdeDia))).groupBy(adsMetricasDiarias.campanhaId) : Promise.resolve([]),
    db.select({ utm: trafegoSessoes.utmCampaign, n: sql<number>`count(*)` }).from(trafegoSessoes).where(and(gte(trafegoSessoes.iniciadaEm, desde), isNotNull(trafegoSessoes.utmCampaign))).groupBy(trafegoSessoes.utmCampaign),
    db.select({ utm: origensContato.utmCampaign, via: origensContato.via, n: sql<number>`count(*)` }).from(origensContato).where(and(gte(origensContato.capturadaEm, desde), isNotNull(origensContato.utmCampaign))).groupBy(origensContato.utmCampaign, origensContato.via),
    db.select({ utm: origensContato.utmCampaign, evento: conversoesEnvio.evento, chave: conversoesEnvio.chave, valor: conversoesEnvio.valorCents }).from(conversoesEnvio)
      .innerJoin(origensContato, eq(origensContato.chave, conversoesEnvio.chave))
      .where(and(eq(conversoesEnvio.plataforma, "META"), inArray(conversoesEnvio.evento, ["PAGANTE", "VENDA"]), gte(conversoesEnvio.ocorreuEm, desde), isNotNull(origensContato.utmCampaign))),
    estadoLeitura(db),
  ]);
  const linhas = new Map<string, LinhaCampanha>();
  const linha = (nome: string) => {
    const k = chaveCampanha(nome);
    if (!k) return null;
    if (!linhas.has(k)) linhas.set(k, { chave: k, nome, gastoCents: 0, impressoes: 0, cliques: 0, leadsMeta: 0, visitas: 0, contatos: 0, contas: 0, pagantes: 0, receitaCents: 0, custoContatoCents: null, custoPaganteCents: null, retorno: null });
    return linhas.get(k)!;
  };
  for (const m of metricas) { const l = linha(m.nome); if (!l) continue; l.nome = m.nome; l.gastoCents += Number(m.gasto); l.impressoes += Number(m.imp); l.cliques += Number(m.cliq); l.leadsMeta += Number(m.leads); }
  for (const s of sessoes) { const l = linha(s.utm!); if (l) l.visitas += Number(s.n); }
  for (const o of origens) { const l = linha(o.utm!); if (!l) continue; if (o.via === "CADASTRO") l.contas += Number(o.n); else l.contatos += Number(o.n); }
  const pagantes = new Map<string, Set<string>>();
  for (const r of resultados) {
    const l = linha(r.utm!); if (!l) continue;
    l.receitaCents += r.valor ?? 0;
    if (r.evento === "PAGANTE") { const s = pagantes.get(l.chave) ?? new Set(); s.add(r.chave); pagantes.set(l.chave, s); }
  }
  for (const [k, s] of pagantes) linhas.get(k)!.pagantes = s.size;
  const out = [...linhas.values()].map((l) => ({
    ...l,
    custoContatoCents: l.gastoCents && l.contatos ? Math.round(l.gastoCents / l.contatos) : null,
    custoPaganteCents: l.gastoCents && l.pagantes ? Math.round(l.gastoCents / l.pagantes) : null,
    retorno: l.gastoCents ? Math.round((l.receitaCents / l.gastoCents) * 100) / 100 : null,
  })).sort((a, b) => b.gastoCents - a.gastoCents || b.contatos - a.contatos);
  const total = out.reduce((t, l) => ({ gastoCents: t.gastoCents + l.gastoCents, impressoes: t.impressoes + l.impressoes, cliques: t.cliques + l.cliques, leadsMeta: t.leadsMeta + l.leadsMeta, visitas: t.visitas + l.visitas, contatos: t.contatos + l.contatos, contas: t.contas + l.contas, pagantes: t.pagantes + l.pagantes, receitaCents: t.receitaCents + l.receitaCents }), { gastoCents: 0, impressoes: 0, cliques: 0, leadsMeta: 0, visitas: 0, contatos: 0, contas: 0, pagantes: 0, receitaCents: 0 });
  return { dias, conta, estado, linhas: out, total };
}
