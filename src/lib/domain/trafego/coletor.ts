import { and, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { trafegoDiario, trafegoEventos, trafegoSessoes } from "@/db/schema";
import type { BrandCode } from "@/lib/brand";
import { newId } from "@/lib/ids";
import { CLICK_IDS, canalDe, type Canal } from "@/lib/trafego/canal";
import { type Actor, requireMasterFn } from "../access";
import { aparelhoDe, diaDeBrasilia } from "../visitas";

/**
 * Coletor do site (TR2, D291). A página manda um sinal ao abrir e a cada 30 s com a aba visível; cliques no WhatsApp e no
 * cadastro viram marcos; o lead é marcado pelo servidor quando o formulário é aceito. Sessão = 30 min sem sinal encerra.
 * O canal é calculado UMA vez, na entrada da sessão (etiqueta e clique do anúncio no endereço; senão, o site de origem).
 */
export const SESSAO_MIN = 30;
export const AGORA_MIN = 5;
export const DETALHE_DIAS = 90;
export const TIPOS_SINAL = ["PAGE_VIEW", "PING", "CLIQUE_WHATSAPP", "INICIO_CADASTRO"] as const;
export type TipoSinal = (typeof TIPOS_SINAL)[number];

const equipe = (actor: Actor) => requireMasterFn(actor, ["COMERCIAL", "CONTEUDO"]);
const limpaCaminho = (c: string) => { const x = (c || "/").split("#")[0]!.split("?")[0]!; return (x.startsWith("/") && !x.startsWith("//") ? x : "/").replace(/[^\w\-./~%@:+]/g, "").slice(0, 120) || "/"; };
const etiqueta = (v: string | null) => (v ? v.replace(/[^\w\-. ]/g, "").slice(0, 60) || null : null);
const minutosAtras = (agora: Date, min: number) => new Date(agora.getTime() - min * 60_000).toISOString();

export type Sinal = {
  brand: BrandCode; visitanteId: string; sessaoId: string | null; tipo: TipoSinal; caminho: string;
  /** Busca do endereço da página (`?utm_source=...`), só na abertura de página. */
  busca?: string | null; referrer?: string | null; hostProprio?: string | null; ua?: string | null;
};

/** Origem da sessão a partir do endereço de entrada e do site de onde veio. */
export function origemDaEntrada(busca: string | null | undefined, referrer: string | null | undefined, hostProprio: string | null | undefined) {
  const q = new URLSearchParams((busca ?? "").slice(0, 800));
  const get = (k: string) => q.get(k);
  const clickIds: Record<string, string> = {};
  for (const k of CLICK_IDS) { const v = get(k)?.replace(/[^A-Za-z0-9_\-.]/g, "").slice(0, 120); if (v) clickIds[k] = v; }
  let refHost = "";
  try { refHost = referrer ? new URL(referrer).hostname.replace(/^www\./, "").toLowerCase().slice(0, 60) : ""; } catch { refHost = ""; }
  const proprio = (hostProprio ?? "").split(":")[0]!.replace(/^www\./, "").toLowerCase();
  if (refHost === proprio) refHost = "";
  const ref = get("ref");
  const utm = { utmSource: etiqueta(get("utm_source")), utmMedium: etiqueta(get("utm_medium")), utmCampaign: etiqueta(get("utm_campaign")), utmContent: etiqueta(get("utm_content")), utmTerm: etiqueta(get("utm_term")) };
  const canal = canalDe({ utm_source: utm.utmSource, utm_medium: utm.utmMedium, ref: ref && /^[A-Za-z0-9_-]{3,24}$/.test(ref) ? ref : null, ...clickIds, referrer: refHost, hostProprio: proprio });
  return { ...utm, clickIds, refHost: refHost || null, canal };
}

/** Registra um sinal. Devolve a sessão (nova ou a mesma) ou null quando não há o que fazer (sinal de presença sem sessão viva). */
export async function registrarSinal(db: Database, s: Sinal, agora = new Date()): Promise<{ sessaoId: string; nova: boolean } | null> {
  const caminho = limpaCaminho(s.caminho);
  const agoraIso = agora.toISOString();
  const viva = s.sessaoId ? await db.query.trafegoSessoes.findFirst({
    where: and(eq(trafegoSessoes.id, s.sessaoId), eq(trafegoSessoes.visitanteId, s.visitanteId), gte(trafegoSessoes.ultimoSinalEm, minutosAtras(agora, SESSAO_MIN))),
    columns: { id: true, canal: true, utmSource: true, utmCampaign: true, utmContent: true, clickIds: true },
  }) : null;
  // Entrada nova com outra origem (etiqueta, clique de anúncio, indicação ou outro site) abre outra sessão, como no Google Analytics.
  const origem = s.tipo === "PAGE_VIEW" ? origemDaEntrada(s.busca, s.referrer, s.hostProprio) : null;
  // Recarregar a mesma página de entrada (mesma etiqueta) continua a sessão.
  // Chegar de outro site (ex.: do Google) no meio da visita também é origem nova.
  const temOrigem = !!origem && (!!origem.utmSource || Object.keys(origem.clickIds).length > 0 || origem.canal === "indicacao" || !!origem.refHost);
  const trocaOrigem = !!viva && temOrigem && (origem!.canal !== viva.canal || origem!.utmSource !== viva.utmSource || origem!.utmCampaign !== viva.utmCampaign || origem!.utmContent !== viva.utmContent
    || JSON.stringify(origem!.clickIds) !== JSON.stringify(viva.clickIds));
  if (viva && !trocaOrigem) {
    const id = viva.id;
    if (s.tipo === "PING") { await db.update(trafegoSessoes).set({ ultimoSinalEm: agoraIso, paginaAtual: caminho }).where(eq(trafegoSessoes.id, id)); return { sessaoId: id, nova: false }; }
    const set: Partial<typeof trafegoSessoes.$inferInsert> = { ultimoSinalEm: agoraIso };
    if (s.tipo === "PAGE_VIEW") { set.paginaAtual = caminho; set.paginas = sql`${trafegoSessoes.paginas} + 1` as never; }
    if (s.tipo === "CLIQUE_WHATSAPP") set.whatsapp = true;
    if (s.tipo === "INICIO_CADASTRO") set.cadastro = true;
    await db.update(trafegoSessoes).set(set).where(eq(trafegoSessoes.id, id));
    await db.insert(trafegoEventos).values({ id: newId("tev"), sessaoId: id, tipo: s.tipo, caminho, criadoEm: agoraIso });
    return { sessaoId: id, nova: false };
  }
  if (s.tipo !== "PAGE_VIEW") return null;
  const o = origem!;
  const id = newId("tss");
  await db.insert(trafegoSessoes).values({
    id, visitanteId: s.visitanteId, brand: s.brand, iniciadaEm: agoraIso, ultimoSinalEm: agoraIso, paginaEntrada: caminho, paginaAtual: caminho,
    canal: o.canal, utmSource: o.utmSource, utmMedium: o.utmMedium, utmCampaign: o.utmCampaign, utmContent: o.utmContent, utmTerm: o.utmTerm,
    refHost: o.refHost, clickIds: o.clickIds, aparelho: aparelhoDe(s.ua),
  });
  await db.insert(trafegoEventos).values({ id: newId("tev"), sessaoId: id, tipo: "PAGE_VIEW", caminho, criadoEm: agoraIso });
  return { sessaoId: id, nova: true };
}

/** Lead aceito pelo servidor (formulário, janela de saída, diagnóstico): marca a sessão viva. Nunca lança. */
export async function marcarLeadNaSessao(db: Database, sessaoId: string | null | undefined, caminho = "/", agora = new Date()): Promise<boolean> {
  try {
    if (!sessaoId || !/^tss_[A-Za-z0-9_-]{4,40}$/.test(sessaoId)) return false;
    const s = await db.query.trafegoSessoes.findFirst({ where: and(eq(trafegoSessoes.id, sessaoId), gte(trafegoSessoes.ultimoSinalEm, minutosAtras(agora, SESSAO_MIN))), columns: { id: true } });
    if (!s) return false;
    await db.update(trafegoSessoes).set({ lead: true, ultimoSinalEm: agora.toISOString() }).where(eq(trafegoSessoes.id, s.id));
    await db.insert(trafegoEventos).values({ id: newId("tev"), sessaoId: s.id, tipo: "LEAD", caminho: limpaCaminho(caminho), criadoEm: agora.toISOString() });
    return true;
  } catch (e) { console.error("[trafego] lead", e); return false; }
}

// ---------------------------------------------------------------------------------------------------------------------
// Leituras do Master
// ---------------------------------------------------------------------------------------------------------------------
type Contagem<K extends string> = { chave: K; total: number }[];
const contar = <K extends string>(itens: K[]): Contagem<K> => {
  const m = new Map<K, number>();
  for (const k of itens) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].map(([chave, total]) => ({ chave, total })).sort((a, b) => b.total - a.total);
};
/** Começo do dia de Brasília em UTC. */
const inicioDoDia = (agora: Date) => new Date(`${diaDeBrasilia(agora)}T03:00:00.000Z`).toISOString();

export type AgoraNoSite = {
  em: string;
  agora: number;
  porCanal: Contagem<Canal>; porPagina: Contagem<string>; porAparelho: Contagem<string>; porMarca: Contagem<string>;
  entradas: { id: string; quando: string; canal: Canal; campanha: string | null; peca: string | null; entrada: string; atual: string; paginas: number; aparelho: string; brand: string; ativa: boolean; whatsapp: boolean; cadastro: boolean; lead: boolean }[];
  marcos: { quando: string; tipo: "CLIQUE_WHATSAPP" | "INICIO_CADASTRO" | "LEAD"; caminho: string; canal: Canal; campanha: string | null }[];
  hoje: { sessoes: number; whatsapp: number; cadastros: number; leads: number };
};

export async function agoraNoSite(db: Database, actor: Actor, agora = new Date()): Promise<AgoraNoSite> {
  equipe(actor);
  const limiteAgora = minutosAtras(agora, AGORA_MIN);
  const umaHora = minutosAtras(agora, 60);
  const [vivas, entradas, marcos, [hoje]] = await Promise.all([
    db.select({ canal: trafegoSessoes.canal, pagina: trafegoSessoes.paginaAtual, aparelho: trafegoSessoes.aparelho, brand: trafegoSessoes.brand })
      .from(trafegoSessoes).where(gte(trafegoSessoes.ultimoSinalEm, limiteAgora)).limit(5000),
    db.select().from(trafegoSessoes).where(gte(trafegoSessoes.iniciadaEm, umaHora)).orderBy(desc(trafegoSessoes.iniciadaEm)).limit(20),
    db.select({ quando: trafegoEventos.criadoEm, tipo: trafegoEventos.tipo, caminho: trafegoEventos.caminho, canal: trafegoSessoes.canal, campanha: trafegoSessoes.utmCampaign })
      .from(trafegoEventos).innerJoin(trafegoSessoes, eq(trafegoSessoes.id, trafegoEventos.sessaoId))
      .where(and(gte(trafegoEventos.criadoEm, minutosAtras(agora, 24 * 60)), ne(trafegoEventos.tipo, "PAGE_VIEW"))).orderBy(desc(trafegoEventos.criadoEm)).limit(15),
    db.select({
      sessoes: sql<number>`count(*)`, whatsapp: sql<number>`count(*) filter (where ${trafegoSessoes.whatsapp})`,
      cadastros: sql<number>`count(*) filter (where ${trafegoSessoes.cadastro})`, leads: sql<number>`count(*) filter (where ${trafegoSessoes.lead})`,
    }).from(trafegoSessoes).where(gte(trafegoSessoes.iniciadaEm, inicioDoDia(agora))),
  ]);
  return {
    em: agora.toISOString(),
    agora: vivas.length,
    porCanal: contar(vivas.map((v) => v.canal as Canal)),
    porPagina: contar(vivas.map((v) => v.pagina)).slice(0, 8),
    porAparelho: contar(vivas.map((v) => v.aparelho)),
    porMarca: contar(vivas.map((v) => v.brand)),
    entradas: entradas.map((e) => ({ id: e.id, quando: new Date(e.iniciadaEm).toISOString(), canal: e.canal as Canal, campanha: e.utmCampaign, peca: e.utmContent, entrada: e.paginaEntrada, atual: e.paginaAtual, paginas: e.paginas, aparelho: e.aparelho, brand: e.brand, ativa: new Date(e.ultimoSinalEm).getTime() >= new Date(limiteAgora).getTime(), whatsapp: e.whatsapp, cadastro: e.cadastro, lead: e.lead })),
    marcos: marcos.map((m) => ({ quando: new Date(m.quando).toISOString(), tipo: m.tipo as AgoraNoSite["marcos"][number]["tipo"], caminho: m.caminho, canal: m.canal as Canal, campanha: m.campanha })),
    hoje: { sessoes: Number(hoje?.sessoes ?? 0), whatsapp: Number(hoje?.whatsapp ?? 0), cadastros: Number(hoje?.cadastros ?? 0), leads: Number(hoje?.leads ?? 0) },
  };
}

export type LinhaOrigem = { canal: Canal; sessoes: number; anteriores: number; paginas: number; whatsapp: number; cadastros: number; leads: number };
export type Origens = { dias: number; desde: string; linhas: LinhaOrigem[]; campanhas: { canal: Canal; campanha: string; sessoes: number; whatsapp: number; cadastros: number; leads: number }[]; total: Omit<LinhaOrigem, "canal"> };

/** Origens por canal no período (7, 30 ou 90 dias), com o período anterior para comparar e as campanhas que mais trouxeram. */
export async function origensPorCanal(db: Database, actor: Actor, dias: 7 | 30 | 90, agora = new Date(), filtro: { brand?: BrandCode } = {}): Promise<Origens> {
  equipe(actor);
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const antes = new Date(agora.getTime() - 2 * dias * 86_400_000).toISOString();
  const marca = filtro.brand ? eq(trafegoSessoes.brand, filtro.brand) : undefined;
  const somas = {
    sessoes: sql<number>`count(*)`, paginas: sql<number>`coalesce(sum(${trafegoSessoes.paginas}), 0)`,
    whatsapp: sql<number>`count(*) filter (where ${trafegoSessoes.whatsapp})`, cadastros: sql<number>`count(*) filter (where ${trafegoSessoes.cadastro})`,
    leads: sql<number>`count(*) filter (where ${trafegoSessoes.lead})`,
  };
  const [atual, anterior, campanhas] = await Promise.all([
    db.select({ canal: trafegoSessoes.canal, ...somas }).from(trafegoSessoes).where(and(gte(trafegoSessoes.iniciadaEm, desde), marca)).groupBy(trafegoSessoes.canal),
    db.select({ canal: trafegoSessoes.canal, sessoes: sql<number>`count(*)` }).from(trafegoSessoes).where(and(gte(trafegoSessoes.iniciadaEm, antes), lt(trafegoSessoes.iniciadaEm, desde), marca)).groupBy(trafegoSessoes.canal),
    db.select({ canal: trafegoSessoes.canal, campanha: trafegoSessoes.utmCampaign, ...somas }).from(trafegoSessoes)
      .where(and(gte(trafegoSessoes.iniciadaEm, desde), sql`${trafegoSessoes.utmCampaign} is not null`, marca)).groupBy(trafegoSessoes.canal, trafegoSessoes.utmCampaign)
      .orderBy(desc(sql`count(*)`)).limit(15),
  ]);
  const prev = new Map(anterior.map((a) => [a.canal, Number(a.sessoes)]));
  const canais = new Set([...atual.map((a) => a.canal), ...prev.keys()]);
  const linhas: LinhaOrigem[] = [...canais].map((c) => {
    const a = atual.find((x) => x.canal === c);
    return { canal: c as Canal, sessoes: Number(a?.sessoes ?? 0), anteriores: prev.get(c) ?? 0, paginas: Number(a?.paginas ?? 0), whatsapp: Number(a?.whatsapp ?? 0), cadastros: Number(a?.cadastros ?? 0), leads: Number(a?.leads ?? 0) };
  }).sort((x, y) => y.sessoes - x.sessoes || y.anteriores - x.anteriores);
  const total = linhas.reduce((t, l) => ({ sessoes: t.sessoes + l.sessoes, anteriores: t.anteriores + l.anteriores, paginas: t.paginas + l.paginas, whatsapp: t.whatsapp + l.whatsapp, cadastros: t.cadastros + l.cadastros, leads: t.leads + l.leads }), { sessoes: 0, anteriores: 0, paginas: 0, whatsapp: 0, cadastros: 0, leads: 0 });
  return { dias, desde, linhas, total, campanhas: campanhas.map((c) => ({ canal: c.canal as Canal, campanha: c.campanha!, sessoes: Number(c.sessoes), whatsapp: Number(c.whatsapp), cadastros: Number(c.cadastros), leads: Number(c.leads) })) };
}

/**
 * Rotina diária: sessões com mais de 90 dias viram resumo por dia/marca/canal/campanha/aparelho (13 meses) e o detalhe é
 * apagado; resumos com mais de 13 meses também saem. Em lotes, para não pesar o banco.
 */
export async function resumirELimparTrafego(db: Database, agora = new Date()): Promise<{ resumidas: number; diasApagados: number }> {
  const corte = new Date(agora.getTime() - DETALHE_DIAS * 86_400_000).toISOString();
  let resumidas = 0;
  for (let lote = 0; lote < 20; lote++) {
    const velhas = await db.select().from(trafegoSessoes).where(lt(trafegoSessoes.iniciadaEm, corte)).limit(2000);
    if (!velhas.length) break;
    const grupos = new Map<string, typeof trafegoDiario.$inferInsert>();
    for (const v of velhas) {
      const g = { dia: diaDeBrasilia(new Date(v.iniciadaEm)), brand: v.brand, canal: v.canal, campanha: v.utmCampaign ?? "", aparelho: v.aparelho };
      const k = JSON.stringify(g);
      const a = grupos.get(k) ?? { ...g, sessoes: 0, paginas: 0, whatsapp: 0, cadastros: 0, leads: 0 };
      a.sessoes! += 1; a.paginas! += v.paginas; a.whatsapp! += v.whatsapp ? 1 : 0; a.cadastros! += v.cadastro ? 1 : 0; a.leads! += v.lead ? 1 : 0;
      grupos.set(k, a);
    }
    for (const g of grupos.values()) {
      await db.insert(trafegoDiario).values(g).onConflictDoUpdate({
        target: [trafegoDiario.dia, trafegoDiario.brand, trafegoDiario.canal, trafegoDiario.campanha, trafegoDiario.aparelho],
        set: { sessoes: sql`${trafegoDiario.sessoes} + ${g.sessoes}`, paginas: sql`${trafegoDiario.paginas} + ${g.paginas}`, whatsapp: sql`${trafegoDiario.whatsapp} + ${g.whatsapp}`, cadastros: sql`${trafegoDiario.cadastros} + ${g.cadastros}`, leads: sql`${trafegoDiario.leads} + ${g.leads}` },
      });
    }
    const ids = velhas.map((v) => v.id);
    await db.delete(trafegoEventos).where(inArray(trafegoEventos.sessaoId, ids));
    await db.delete(trafegoSessoes).where(inArray(trafegoSessoes.id, ids));
    resumidas += velhas.length;
  }
  const diaCorte = diaDeBrasilia(new Date(agora.getTime() - 396 * 86_400_000));
  const apagados = await db.delete(trafegoDiario).where(lt(trafegoDiario.dia, diaCorte)).returning({ dia: trafegoDiario.dia });
  return { resumidas, diasApagados: apagados.length };
}
