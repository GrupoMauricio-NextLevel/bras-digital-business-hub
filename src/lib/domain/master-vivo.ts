/**
 * Master com vida (D335): o que a NextLevel recebeu dos lojistas mês a mês e o movimento da plataforma, para o início
 * do Master ("Agora"). Só faturas pagas (dinheiro que entrou de verdade); só para o Master (a página exige o papel).
 */
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { activities, financeInvoices, stores } from "@/db/schema";
import { formatBRL } from "@/lib/money";

/** "2026-11" no fuso de Brasília. */
export const mesDeBrasilia = (iso: string | Date) => new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString().slice(0, 7);

/** Os últimos N meses, do mais antigo ao atual ("2026-06" … "2026-11"). */
export function ultimosMeses(n: number, agora = new Date()): string[] {
  const [a, m] = mesDeBrasilia(agora).split("-").map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => { const d = new Date(Date.UTC(a, m - 1 - (n - 1 - i), 1)); return d.toISOString().slice(0, 7); });
}

/** Regra pura: soma o pago por mês e conta as lojas diferentes que pagaram. Meses sem pagamento ficam com zero. */
export function recebidoPorMes(faturas: { paidAt: string | null; amountCents: number; storeId: string | null }[], meses: string[]) {
  return meses.map((mes) => {
    const doMes = faturas.filter((f) => f.paidAt && mesDeBrasilia(f.paidAt) === mes);
    return { mes, recebidoCents: doMes.reduce((s, f) => s + f.amountCents, 0), lojas: new Set(doMes.map((f) => f.storeId).filter(Boolean)).size };
  });
}

/** Título do gráfico: a conclusão. */
export function fraseDoRecebido(serie: { recebidoCents: number }[]): string {
  const atual = serie.at(-1)?.recebidoCents ?? 0, anterior = serie.at(-2)?.recebidoCents ?? 0;
  const total = serie.reduce((s, x) => s + x.recebidoCents, 0);
  if (!total) return "Os pagamentos dos lojistas aparecem aqui assim que a primeira fatura for paga.";
  if (!anterior) return `${formatBRL(atual)} recebidos neste mês; ${formatBRL(total)} no período.`;
  const d = Math.round(((atual - anterior) / anterior) * 100);
  return d >= 0 ? `${formatBRL(atual)} recebidos neste mês, ${d}% a mais que no mês passado.` : `${formatBRL(atual)} recebidos neste mês, ${Math.abs(d)}% a menos que no mês passado (o mês ainda não acabou).`;
}

/** As faturas pagas pelas lojas nos últimos 6 meses, agrupadas. */
export async function recebidoDosLojistas(db: Database, agora = new Date()) {
  const meses = ultimosMeses(6, agora);
  const desde = new Date(Date.parse(`${meses[0]}-01T03:00:00Z`)).toISOString();
  const faturas = await db.select({ paidAt: financeInvoices.paidAt, amountCents: financeInvoices.amountCents, storeId: financeInvoices.storeId })
    .from(financeInvoices).where(and(eq(financeInvoices.status, "PAID"), eq(financeInvoices.payerType, "STORE"), gte(financeInvoices.paidAt, desde)));
  return recebidoPorMes(faturas, meses);
}

/** O que aconteceu por último nas lojas (pedidos, publicação, configuração), com o nome da loja. */
export async function movimentoDaPlataforma(db: Database, limite = 6) {
  const linhas = await db.select({ id: activities.id, tipo: activities.type, mensagem: activities.message, createdAt: activities.createdAt, storeId: activities.storeId })
    .from(activities).where(inArray(activities.scope, ["STORE", "PLATFORM"])).orderBy(desc(activities.createdAt)).limit(limite);
  const ids = [...new Set(linhas.map((l) => l.storeId).filter((x): x is string => !!x))];
  const nomes = ids.length ? await db.select({ id: stores.id, name: stores.name, slug: stores.slug }).from(stores).where(inArray(stores.id, ids)) : [];
  const loja = new Map(nomes.map((n) => [n.id, n]));
  return linhas.map((l) => { const x = l.storeId ? loja.get(l.storeId) : undefined; return { ...l, loja: x?.name ?? "NextLevel", slug: x?.slug ?? null }; });
}
