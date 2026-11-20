import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { linksCliquesDiarios, linksRastreados } from "@/db/schema";
import { BRAND_CODES } from "@/lib/brand";
import { newId } from "@/lib/ids";
import { canalDe, CLICK_IDS, type Canal } from "@/lib/trafego/canal";
import { type Actor, requireMasterFn } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { diaDeBrasilia } from "../visitas";

/**
 * Links rastreados (TR1, D290): o Master cria `/l/<codigo>` com destino e etiquetas no padrão de nomes; o clique é
 * contado por dia (sem IP) e a pessoa segue para a página com as etiquetas, que o proxy grava como origem (D90).
 * Quem cria: o dono, o Comercial e o Conteúdo (redes sociais).
 */
const equipe = (actor: Actor) => requireMasterFn(actor, ["COMERCIAL", "CONTEUDO"]);

/** Valores sugeridos do padrão de nomes (docs/prompts/trafego-campanhas-meta-google-reels.md, 5.1). */
export const FONTES_PADRAO = ["meta", "google", "instagram", "facebook", "tiktok", "youtube", "whatsapp", "email", "parceiro", "site"] as const;
export const MEIOS_PADRAO = ["pago", "organico", "bio", "story", "direct", "reels", "post", "lista", "indicacao", "remarketing"] as const;

/** Padrão de nomes: minúsculo, sem acento, espaço vira hífen, só letras, números, hífen, ponto e sublinhado. */
export function normalizarEtiqueta(v: string | null | undefined): string {
  return (v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9_.-]/g, "").replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Destino só dentro da marca: caminho que começa com "/" (sem "//", sem barra invertida, sem esquema). */
export function destinoSeguro(v: string): string | null {
  const d = v.trim();
  if (!d.startsWith("/") || d.startsWith("//") || d.includes("\\") || /[\s<>"]/.test(d) || d.length > 300) return null;
  if (/^\/(api|_next|l|r)\//.test(d)) return null;
  return d;
}

const CODIGO = /^[a-z0-9][a-z0-9-]{1,39}$/;
const etiqueta = (rotulo: string, obrigatoria: boolean) => z.string().max(80).optional().nullable().transform((v, ctx) => {
  const n = normalizarEtiqueta(v);
  if (obrigatoria && !n) ctx.addIssue({ code: "custom", message: `Preencha ${rotulo}.` });
  return n || null;
});

export const linkSchema = z.object({
  codigo: z.string().max(40).optional().nullable().transform((v) => normalizarEtiqueta(v) || null)
    .refine((v) => !v || CODIGO.test(v), "O código usa de 2 a 40 letras minúsculas, números ou hífen."),
  brand: z.enum(BRAND_CODES).default("NEXTLEVEL_COMMERCE"),
  destino: z.string().min(1, "Informe a página de destino.").transform((v, ctx) => {
    const d = destinoSeguro(v);
    if (!d) ctx.addIssue({ code: "custom", message: "O destino é uma página do próprio site, começando com / (ex.: /planos)." });
    return d ?? "/";
  }),
  utmSource: etiqueta("a origem (utm_source)", true),
  utmMedium: etiqueta("o meio (utm_medium)", true),
  utmCampaign: etiqueta("a campanha (utm_campaign)", true),
  utmContent: etiqueta("a peça", false),
  utmTerm: etiqueta("o público ou palavra", false),
  nota: z.string().max(200).optional().nullable().transform((v) => v?.trim() || null),
});

/** Avisos (não bloqueiam): valores fora do padrão de nomes e campanha sem o mês na frente. */
export function avisosDoPadrao(l: { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null }): string[] {
  const out: string[] = [];
  if (l.utmSource && !(FONTES_PADRAO as readonly string[]).includes(l.utmSource)) out.push(`Origem "${l.utmSource}" fora da lista do padrão (${FONTES_PADRAO.join(", ")}).`);
  if (l.utmMedium && !(MEIOS_PADRAO as readonly string[]).includes(l.utmMedium)) out.push(`Meio "${l.utmMedium}" fora da lista do padrão (${MEIOS_PADRAO.join(", ")}).`);
  if (l.utmCampaign && !/^\d{4}-\d{2}-/.test(l.utmCampaign)) out.push("A campanha começa com o ano e o mês (ex.: 2026-12-cadastro-teste3dias).");
  return out;
}

const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";
const codigoAleatorio = () => Array.from({ length: 6 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join("");

export async function criarLink(db: Database, actor: Actor, raw: z.input<typeof linkSchema>) {
  equipe(actor);
  const l = linkSchema.parse(raw);
  let codigo = l.codigo;
  if (codigo) {
    if (await db.query.linksRastreados.findFirst({ where: eq(linksRastreados.codigo, codigo), columns: { id: true } })) throw new DomainError("CODIGO_EM_USO", "Esse código já está em uso. Escolha outro.");
  } else {
    for (let i = 0; i < 5 && !codigo; i++) {
      const c = codigoAleatorio();
      if (!(await db.query.linksRastreados.findFirst({ where: eq(linksRastreados.codigo, c), columns: { id: true } }))) codigo = c;
    }
    if (!codigo) throw new DomainError("CODIGO", "Não foi possível gerar um código agora. Tente de novo.");
  }
  const id = newId("lnk");
  await db.insert(linksRastreados).values({ id, codigo, brand: l.brand, destino: l.destino, utmSource: l.utmSource!, utmMedium: l.utmMedium!, utmCampaign: l.utmCampaign!, utmContent: l.utmContent, utmTerm: l.utmTerm, nota: l.nota, criadoPor: actor.userId });
  await recordAudit(db, actor, { action: "LINK_RASTREADO_CRIADO", entityType: "link_rastreado", entityId: id, after: { codigo, destino: l.destino, utm: [l.utmSource, l.utmMedium, l.utmCampaign].join("/") } });
  return { id, codigo, avisos: avisosDoPadrao(l) };
}

export async function alterarLink(db: Database, actor: Actor, id: string, patch: { ativo?: boolean; destino?: string; nota?: string | null }) {
  equipe(actor);
  const atual = await db.query.linksRastreados.findFirst({ where: eq(linksRastreados.id, id) });
  if (!atual) throw new NotFoundError("Link não encontrado.");
  const set: Partial<typeof linksRastreados.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (patch.ativo !== undefined) set.ativo = patch.ativo;
  if (patch.destino !== undefined) {
    const d = destinoSeguro(patch.destino);
    if (!d) throw new DomainError("DESTINO", "O destino é uma página do próprio site, começando com / (ex.: /planos).");
    set.destino = d;
  }
  if (patch.nota !== undefined) set.nota = patch.nota?.trim().slice(0, 200) || null;
  await db.update(linksRastreados).set(set).where(eq(linksRastreados.id, id));
  await recordAudit(db, actor, { action: "LINK_RASTREADO_ALTERADO", entityType: "link_rastreado", entityId: id, before: { ativo: atual.ativo, destino: atual.destino }, after: { ativo: set.ativo ?? atual.ativo, destino: set.destino ?? atual.destino } });
}

export type LinkNaLista = typeof linksRastreados.$inferSelect & { canal: Canal; cliques7: number; cliques30: number; cliquesTotal: number; avisos: string[] };

export async function listarLinks(db: Database, actor: Actor, agora = new Date()): Promise<LinkNaLista[]> {
  equipe(actor);
  const d7 = diaDeBrasilia(new Date(agora.getTime() - 6 * 86_400_000));
  const d30 = diaDeBrasilia(new Date(agora.getTime() - 29 * 86_400_000));
  const [links, somas] = await Promise.all([
    db.select().from(linksRastreados).orderBy(desc(linksRastreados.createdAt)).limit(500),
    db.select({
      linkId: linksCliquesDiarios.linkId,
      total: sql<number>`coalesce(sum(${linksCliquesDiarios.cliques}), 0)`,
      c7: sql<number>`coalesce(sum(case when ${linksCliquesDiarios.dia} >= ${d7} then ${linksCliquesDiarios.cliques} else 0 end), 0)`,
      c30: sql<number>`coalesce(sum(case when ${linksCliquesDiarios.dia} >= ${d30} then ${linksCliquesDiarios.cliques} else 0 end), 0)`,
    }).from(linksCliquesDiarios).groupBy(linksCliquesDiarios.linkId),
  ]);
  const por = new Map(somas.map((s) => [s.linkId, s]));
  return links.map((l) => {
    const s = por.get(l.id);
    return { ...l, canal: canalDe({ utm_source: l.utmSource, utm_medium: l.utmMedium }), cliquesTotal: Number(s?.total ?? 0), cliques7: Number(s?.c7 ?? 0), cliques30: Number(s?.c30 ?? 0), avisos: avisosDoPadrao(l) };
  });
}

/** Cliques por dia de um link (últimos N dias), para o gráfico. */
export async function cliquesPorDia(db: Database, actor: Actor, id: string, dias = 30, agora = new Date()) {
  equipe(actor);
  const desde = diaDeBrasilia(new Date(agora.getTime() - (dias - 1) * 86_400_000));
  return db.select({ dia: linksCliquesDiarios.dia, cliques: linksCliquesDiarios.cliques }).from(linksCliquesDiarios)
    .where(and(eq(linksCliquesDiarios.linkId, id), gte(linksCliquesDiarios.dia, desde))).orderBy(linksCliquesDiarios.dia);
}

/**
 * Clique público (rota /l/<codigo>): conta o clique (robô à parte) e devolve o caminho de destino com as etiquetas do link.
 * Os identificadores de clique que a Meta/Google puseram no endereço (fbclid, gclid...) seguem junto, para o proxy guardar.
 * Link inexistente ou desligado: null (a rota leva à página inicial). Nunca lança.
 */
export async function resolverClique(db: Database, codigoBruto: string, req: { robo: boolean; busca?: URLSearchParams }, agora = new Date()): Promise<{ brand: string; caminho: string } | null> {
  try {
    const codigo = codigoBruto.toLowerCase();
    if (!CODIGO.test(codigo)) return null;
    const l = await db.query.linksRastreados.findFirst({ where: eq(linksRastreados.codigo, codigo) });
    if (!l || !l.ativo) return null;
    const dia = diaDeBrasilia(agora);
    await db.insert(linksCliquesDiarios).values({ linkId: l.id, dia, cliques: req.robo ? 0 : 1, robos: req.robo ? 1 : 0 })
      .onConflictDoUpdate({ target: [linksCliquesDiarios.linkId, linksCliquesDiarios.dia], set: req.robo ? { robos: sql`${linksCliquesDiarios.robos} + 1` } : { cliques: sql`${linksCliquesDiarios.cliques} + 1` } });
    return { brand: l.brand, caminho: montarDestino(l, req.busca) };
  } catch (e) {
    console.error("[links] clique", e);
    return null;
  }
}

/** Destino + etiquetas do link (as do link vencem as que já estiverem no destino) + identificadores de clique recebidos. */
export function montarDestino(l: Pick<typeof linksRastreados.$inferSelect, "destino" | "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm">, busca?: URLSearchParams): string {
  const u = new URL(l.destino, "http://x");
  const tags: [string, string | null][] = [["utm_source", l.utmSource], ["utm_medium", l.utmMedium], ["utm_campaign", l.utmCampaign], ["utm_content", l.utmContent], ["utm_term", l.utmTerm]];
  for (const [k, v] of tags) { if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); }
  for (const k of CLICK_IDS) { const v = busca?.get(k); if (v && /^[A-Za-z0-9_.-]{1,200}$/.test(v)) u.searchParams.set(k, v); }
  return `${u.pathname}${u.search}${u.hash}`;
}
