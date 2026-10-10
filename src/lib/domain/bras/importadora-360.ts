import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdCommissionSettlements, bdImporterUsers, bdImporters, bdOffers, bdProducts, bdRequests, bdVideos, bdWarehouses } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { NotFoundError } from "../errors";
import { brasCommissionCents, brasMonthOf } from "./comissoes";
import { getBrasRules } from "./regras";

/**
 * Importadora 360 (D110, seção 4 do prompt v2): a importadora como fonte de receita. Saúde de 0 a 100 explicável
 * (cada fator com peso, pontos e "como melhorar"), receita de 12 meses e oportunidades com premissa. Só o Master.
 * A saúde é uma função pura dos números: os mesmos dados dão o mesmo índice.
 */
export type HealthInput = {
  activeProducts: number; freshProducts: number; warehouses: number;
  /** Horas médias entre o pedido e a importadora conferir as caixas (90 dias). Null = sem pedidos. */
  avgAvailabilityHours: number | null;
  /** Pedidos pagos que já saíram e quantos saíram no prazo (90 dias). */
  pickups: number; pickupsOnTime: number;
  discoveriesLast30: number;
  profile: { legalName: boolean; cnpj: boolean; description: boolean; contacts: boolean; paymentMethods: boolean };
};
export type HealthFactor = { key: string; label: string; weight: number; points: number; detail: string; howTo: string };

export function brasImporterHealth(i: HealthInput): { score: number; factors: HealthFactor[] } {
  const f: HealthFactor[] = [];
  const frac = (x: number) => Math.max(0, Math.min(1, x));
  const freshShare = i.activeProducts ? i.freshProducts / i.activeProducts : 0;
  f.push({ key: "estoque", label: "Estoque atualizado", weight: 25, points: 25 * freshShare, detail: i.activeProducts ? `${i.freshProducts} de ${i.activeProducts} produtos com saldo em dia` : "Nenhum produto ativo", howTo: i.activeProducts ? "Faça a contagem semanal no painel ou suba a planilha de estoque." : "Cadastre os produtos de caixa fechada e o estoque." });
  f.push({ key: "galpao", label: "Galpão cadastrado", weight: 10, points: i.warehouses > 0 ? 10 : 0, detail: i.warehouses ? `${i.warehouses} galpão(ões)` : "Sem galpão", howTo: "Cadastre o galpão com horário e regras de retirada." });
  const avail = i.avgAvailabilityHours === null ? 0.5 : frac(1 - (i.avgAvailabilityHours - 4) / 44);
  f.push({ key: "disponibilidade", label: "Confere as caixas rápido", weight: 20, points: 20 * avail, detail: i.avgAvailabilityHours === null ? "Sem pedidos no período (meio ponto)" : `Média de ${Math.round(i.avgAvailabilityHours)} h para conferir`, howTo: "Toque em \"Tenho as caixas\" assim que o pedido chegar (até 4 h vale a nota cheia)." });
  const onTime = i.pickups ? i.pickupsOnTime / i.pickups : 0.5;
  f.push({ key: "retirada", label: "Entrega no prazo", weight: 20, points: 20 * onTime, detail: i.pickups ? `${i.pickupsOnTime} de ${i.pickups} retiradas no prazo` : "Sem retiradas no período (meio ponto)", howTo: "Separe as caixas no dia da confirmação e combine a coleta com a transportadora." });
  f.push({ key: "descobertas", label: "Descobertas no mês", weight: 15, points: i.discoveriesLast30 >= 2 ? 15 : i.discoveriesLast30 === 1 ? 7.5 : 0, detail: `${i.discoveriesLast30} descoberta(s) publicada(s) em 30 dias`, howTo: "Agende uma gravação no showroom (Pauta de conteúdo)." });
  const prof = Object.values(i.profile).filter(Boolean).length / 5;
  f.push({ key: "ficha", label: "Ficha completa", weight: 10, points: 10 * prof, detail: `${Object.values(i.profile).filter(Boolean).length} de 5 itens (razão social, CNPJ, descrição, contato, pagamento)`, howTo: "Complete a ficha da importadora." });
  const factors = f.map((x) => ({ ...x, points: Math.round(x.points * 10) / 10 }));
  return { score: Math.round(factors.reduce((s, x) => s + x.points, 0)), factors };
}

export type Opportunity = { title: string; detail: string; href?: string };
export function brasImporterOpportunities(i: { warehouses: number; staleProducts: number; soldOut: number; discoveriesLast30: number; plan: string; paidOrders30: number; hasAccess: boolean; activeProducts: number }): Opportunity[] {
  const o: Opportunity[] = [];
  if (!i.hasAccess) o.push({ title: "Criar o acesso da importadora", detail: "Com o painel, ela confere as caixas, separa e entrega com o código, sem depender da equipe." });
  if (!i.activeProducts) o.push({ title: "Cadastrar os produtos de caixa fechada", detail: "Sem produto ligado, o estoque mostrado ao membro é o informado à mão na oferta." });
  if (!i.warehouses) o.push({ title: "Cadastrar o galpão", detail: "Sem galpão, a retirada fica mais lenta e o comprovante sai sem horário." });
  if (i.staleProducts) o.push({ title: `${i.staleProducts} produto(s) com estoque desatualizado`, detail: "O membro passa a ver \"consultar\" no lugar do número. Peça a contagem ou a planilha." });
  if (i.soldOut) o.push({ title: `${i.soldOut} produto(s) esgotado(s)`, detail: "Bom candidato a pré-pedido do próximo contêiner (fase F4) ou a reposição.", href: undefined });
  if (i.discoveriesLast30 === 0) o.push({ title: "Nenhuma descoberta em 30 dias", detail: "Agende uma gravação no showroom: descoberta é o que traz pedido.", href: "/bras/pauta" });
  if (i.plan === "GRATIS" && i.paidOrders30 >= 20) o.push({ title: "Oferecer o plano Pro", detail: `${i.paidOrders30} pedidos pagos em 30 dias no plano grátis.`, href: "/bras/regras?aba=planos" });
  return o;
}

/** Tudo da ficha 360 de uma importadora. */
export async function brasImporter360(db: Database, actor: Actor, importerId: string, now = new Date()) {
  requireMaster(actor);
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
  if (!imp) throw new NotFoundError("Importadora não encontrada.");
  const rules = await getBrasRules(db);
  const d90 = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const start12 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)).toISOString();
  const [prods, whs, access, reqs90, paid12, disc, settled] = await Promise.all([
    db.select().from(bdProducts).where(eq(bdProducts.importerId, imp.id)),
    db.select().from(bdWarehouses).where(and(eq(bdWarehouses.importerId, imp.id), eq(bdWarehouses.active, true))),
    db.select({ id: bdImporterUsers.id }).from(bdImporterUsers).where(eq(bdImporterUsers.importerId, imp.id)),
    db.select().from(bdRequests).where(and(eq(bdRequests.importerId, imp.id), gte(bdRequests.createdAt, d90))),
    db.select({ paidAt: bdRequests.paidAt, totalCents: bdRequests.totalCents, commissionBps: bdRequests.commissionBps }).from(bdRequests).where(and(eq(bdRequests.importerId, imp.id), inArray(bdRequests.status, ["PAID", "PICKED_UP"]), gte(bdRequests.paidAt, start12))),
    db.select({ n: sql<number>`count(*)` }).from(bdOffers).innerJoin(bdVideos, eq(bdVideos.id, bdOffers.videoId)).where(and(eq(bdOffers.importerId, imp.id), eq(bdVideos.active, true), gte(bdVideos.createdAt, d30))),
    db.select({ cents: sql<number>`coalesce(sum(${bdCommissionSettlements.amountCents}), 0)` }).from(bdCommissionSettlements).where(and(eq(bdCommissionSettlements.importerId, imp.id), eq(bdCommissionSettlements.status, "ACTIVE"))),
  ]);
  const staleMs = rules.stock.freshnessHours * 3_600_000;
  const ativos = prods.filter((p) => p.status === "ATIVO" || p.status === "ESGOTADO");
  const fresh = ativos.filter((p) => p.stockUpdatedAt && now.getTime() - new Date(p.stockUpdatedAt).getTime() <= staleMs).length;
  const avail = reqs90.filter((r) => r.availabilityConfirmedAt).map((r) => (new Date(r.availabilityConfirmedAt!).getTime() - new Date(r.createdAt).getTime()) / 3_600_000);
  const prazo = (imp.prepDays ?? 2) * 86_400_000;
  const saidas = reqs90.filter((r) => r.status === "PICKED_UP" && r.paidAt && r.pickedUpAt);
  const health = brasImporterHealth({
    activeProducts: ativos.length, freshProducts: fresh, warehouses: whs.length,
    avgAvailabilityHours: avail.length ? avail.reduce((s, x) => s + x, 0) / avail.length : null,
    pickups: saidas.length, pickupsOnTime: saidas.filter((r) => new Date(r.pickedUpAt!).getTime() - new Date(r.paidAt!).getTime() <= prazo).length,
    discoveriesLast30: Number(disc[0]?.n ?? 0),
    profile: { legalName: !!imp.legalName, cnpj: !!imp.cnpj, description: !!imp.description, contacts: imp.contacts.length > 0, paymentMethods: imp.paymentMethods.length > 0 },
  });
  // Receita por mês (12 meses): vendas pagas e a comissão congelada no pagamento (D102).
  const months: { month: string; salesCents: number; commissionCents: number }[] = [];
  for (let k = 11; k >= 0; k--) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 15)); months.push({ month: brasMonthOf(d.toISOString()), salesCents: 0, commissionCents: 0 }); }
  for (const r of paid12) {
    const m = months.find((x) => x.month === brasMonthOf(new Date(r.paidAt!).toISOString()));
    if (!m) continue;
    m.salesCents += r.totalCents;
    m.commissionCents += brasCommissionCents(r.totalCents, r.commissionBps ?? 0);
  }
  const commissionTotal = months.reduce((s, m) => s + m.commissionCents, 0);
  const paidOrders30 = reqs90.filter((r) => r.paidAt && r.paidAt >= d30).length;
  return {
    importer: imp, warehouses: whs, products: prods, accessCount: access.length, health,
    revenue: { months, salesCents: months.reduce((s, m) => s + m.salesCents, 0), commissionCents: commissionTotal, settledCents: Number(settled[0]?.cents ?? 0) },
    opportunities: brasImporterOpportunities({ warehouses: whs.length, staleProducts: ativos.length - fresh, soldOut: prods.filter((p) => p.status === "ESGOTADO").length, discoveriesLast30: Number(disc[0]?.n ?? 0), plan: imp.plan, paidOrders30, hasAccess: access.length > 0, activeProducts: ativos.length }),
  };
}
