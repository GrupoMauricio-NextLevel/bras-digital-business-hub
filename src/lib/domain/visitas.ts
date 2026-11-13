import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { products, storeProducts, storeVisitsDaily } from "@/db/schema";
import { ehRobo } from "@/lib/trafego/canal";

export { ehRobo };

/**
 * Visitas da loja (W2, D185): contagem agregada por dia, sem cookie, sem IP e sem dado pessoal. Por isso o painel mostra
 * "visitas" (páginas abertas), nunca "visitantes únicos". Robôs ficam fora pelo navegador que dizem ser; prévias do
 * editor nem chegam a enviar.
 */
export type Aparelho = "MOBILE" | "DESKTOP" | "TABLET";
export function aparelhoDe(ua: string | null | undefined): Aparelho {
  const u = ua ?? "";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(u)) return "TABLET";
  if (/mobi|iphone|ipod|android/i.test(u)) return "MOBILE";
  return "DESKTOP";
}

/** Origem: a campanha (utm_source) quando existe; senão, o site de onde a pessoa veio; senão, "direto". */
export function origemDe(input: { utmSource?: string | null; referrer?: string | null; hostDaLoja?: string | null }): string {
  const utm = (input.utmSource ?? "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 40);
  if (utm) return utm;
  let host = "";
  try { host = input.referrer ? new URL(input.referrer).hostname.replace(/^www\./, "").toLowerCase() : ""; } catch { host = ""; }
  if (!host || (input.hostDaLoja && host === input.hostDaLoja.replace(/^www\./, "").toLowerCase())) return "direto";
  for (const [chave, nome] of [["google.", "google"], ["instagram.", "instagram"], ["facebook.", "facebook"], ["fb.", "facebook"], ["tiktok.", "tiktok"], ["wa.me", "whatsapp"], ["whatsapp.", "whatsapp"], ["youtube.", "youtube"], ["bing.", "bing"], ["pinterest.", "pinterest"]] as const) {
    if (host.includes(chave)) return nome;
  }
  return host.slice(0, 40);
}

/** Dia no fuso de Brasília (AAAA-MM-DD). */
export const diaDeBrasilia = (agora = new Date()) => new Date(agora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);

/** Produto da página (pelo apelido no endereço), só se for da própria loja. */
export async function produtoDaPagina(db: Database, storeId: string, caminho: string): Promise<string> {
  const m = caminho.match(/\/product\/([^/?#]+)/);
  if (!m) return "";
  const [p] = await db.select({ id: products.id }).from(products).innerJoin(storeProducts, and(eq(storeProducts.productId, products.id), eq(storeProducts.storeId, storeId)))
    .where(eq(products.slug, decodeURIComponent(m[1]!))).limit(1);
  return p?.id ?? "";
}

export async function registrarVisita(db: Database, v: { storeId: string; productId?: string; source: string; device: Aparelho }, agora = new Date()) {
  await db.insert(storeVisitsDaily).values({ storeId: v.storeId, day: diaDeBrasilia(agora), productId: v.productId ?? "", source: v.source, device: v.device, views: 1 })
    .onConflictDoUpdate({ target: [storeVisitsDaily.storeId, storeVisitsDaily.day, storeVisitsDaily.productId, storeVisitsDaily.source, storeVisitsDaily.device], set: { views: sql`${storeVisitsDaily.views} + 1` } });
}

export type ResumoDeVisitas = {
  total: number; hoje: number;
  porDia: { day: string; views: number }[];
  porOrigem: { source: string; views: number }[];
  porAparelho: { device: string; views: number }[];
  maisVisitados: { productId: string; name: string; views: number }[];
};

/** Últimos N dias (uma consulta por bloco, nada dentro de laço). */
export async function resumoDeVisitas(db: Database, storeId: string, dias = 30, agora = new Date()): Promise<ResumoDeVisitas> {
  const desde = diaDeBrasilia(new Date(agora.getTime() - (dias - 1) * 86_400_000));
  const onde = and(eq(storeVisitsDaily.storeId, storeId), gte(storeVisitsDaily.day, desde));
  const soma = sql<number>`coalesce(sum(${storeVisitsDaily.views}), 0)::int`;
  const [porDia, porOrigem, porAparelho, porProduto] = await Promise.all([
    db.select({ day: storeVisitsDaily.day, views: soma }).from(storeVisitsDaily).where(onde).groupBy(storeVisitsDaily.day).orderBy(storeVisitsDaily.day),
    db.select({ source: storeVisitsDaily.source, views: soma }).from(storeVisitsDaily).where(onde).groupBy(storeVisitsDaily.source).orderBy(desc(soma)).limit(8),
    db.select({ device: storeVisitsDaily.device, views: soma }).from(storeVisitsDaily).where(onde).groupBy(storeVisitsDaily.device).orderBy(desc(soma)),
    db.select({ productId: storeVisitsDaily.productId, views: soma }).from(storeVisitsDaily).where(and(onde, sql`${storeVisitsDaily.productId} <> ''`)).groupBy(storeVisitsDaily.productId).orderBy(desc(soma)).limit(10),
  ]);
  const nomes = porProduto.length ? await db.select({ id: products.id, name: products.name }).from(products).where(inArray(products.id, porProduto.map((p) => p.productId))) : [];
  const nome = new Map(nomes.map((n) => [n.id, n.name]));
  const hojeDia = diaDeBrasilia(agora);
  return {
    total: porDia.reduce((s, d) => s + Number(d.views), 0),
    hoje: Number(porDia.find((d) => d.day === hojeDia)?.views ?? 0),
    porDia: porDia.map((d) => ({ day: d.day, views: Number(d.views) })),
    porOrigem: porOrigem.map((o) => ({ source: o.source, views: Number(o.views) })),
    porAparelho: porAparelho.map((o) => ({ device: o.device, views: Number(o.views) })),
    maisVisitados: porProduto.map((p) => ({ productId: p.productId, name: nome.get(p.productId) ?? "Produto removido", views: Number(p.views) })),
  };
}

/** Conversão em %: pedidos pagos ÷ visitas. Nula sem visitas (não inventa número). */
export const conversao = (pedidosPagos: number, visitas: number): number | null => visitas > 0 ? Math.round((pedidosPagos / visitas) * 1000) / 10 : null;

/** Aparelho e campanha que vão para o pedido no checkout (D185). */
export function origemDoPedido(ua: string | null | undefined, utm: { source?: string; medium?: string; campaign?: string } | undefined) {
  const limpa = (s?: string) => (s ?? "").trim().slice(0, 60) || null;
  return { device: aparelhoDe(ua), utmSource: limpa(utm?.source)?.toLowerCase() ?? null, utmMedium: limpa(utm?.medium), utmCampaign: limpa(utm?.campaign) };
}

/** Vendas pagas por origem e por aparelho (pedidos do período já carregados; função pura). */
export function vendasPorOrigem(pedidos: { customerPaymentStatus: string; status: string; utmSource: string | null; device: string | null; subtotalCents: number; discountCents: number; channel: string; createdAt: string }[], dias = 30, agora = new Date()) {
  const desde = agora.getTime() - dias * 86_400_000;
  const pagos = pedidos.filter((o) => o.customerPaymentStatus === "PAID" && o.status !== "CANCELED" && new Date(o.createdAt).getTime() >= desde);
  const juntar = (chave: (o: (typeof pagos)[number]) => string) => {
    const m = new Map<string, { pedidos: number; vendasCents: number }>();
    for (const o of pagos) { const k = chave(o); const v = m.get(k) ?? { pedidos: 0, vendasCents: 0 }; v.pedidos++; v.vendasCents += o.subtotalCents - o.discountCents; m.set(k, v); }
    return [...m.entries()].map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.vendasCents - a.vendasCents);
  };
  return {
    origem: juntar((o) => o.utmSource ?? (o.channel === "ONLINE_STORE" ? "sem campanha" : o.channel === "MANUAL" ? "venda manual" : o.channel.toLowerCase())),
    aparelho: juntar((o) => ({ MOBILE: "celular", DESKTOP: "computador", TABLET: "tablet" } as Record<string, string>)[o.device ?? ""] ?? "não informado"),
    pagos: pagos.length,
  };
}
