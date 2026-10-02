import { and, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { brandLeads, errorEvents, financeInvoices, orders, stores, users } from "@/db/schema";
import { requireMaster, type Actor } from "./access";
import { jobStatus } from "./job-runs";

/**
 * Resumo do dia para o dono. Só números e contagens (sem nome de cliente, e-mail ou telefone): serve para a tela e para o e-mail.
 * "Venda" segue o contrato único: pedido pago e não cancelado, criado nas últimas 24 h (valor dos produtos menos desconto).
 */
export type DailySummary = {
  date: string;
  sales: { orders: number; cents: number };
  newStores: number;
  newLeads: number;
  overdueInvoices: { count: number; cents: number };
  stuckOrders: number;
  errors: { open: number; new24h: number };
  lateJobs: string[];
};

export async function buildDailySummary(db: Database, now = new Date()): Promise<DailySummary> {
  const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const stuckBefore = new Date(now.getTime() - 48 * 3_600_000).toISOString();
  const paid = await db.select({ sub: orders.subtotalCents, disc: orders.discountCents }).from(orders).where(and(eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), gte(orders.createdAt, since)));
  const [ns] = await db.select({ n: sql<number>`count(*)::int` }).from(stores).where(gte(stores.createdAt, since));
  const [nl] = await db.select({ n: sql<number>`count(*)::int` }).from(brandLeads).where(gte(brandLeads.createdAt, since));
  const [ov] = await db.select({ n: sql<number>`count(*)::int`, c: sql<number>`coalesce(sum(${financeInvoices.amountCents}), 0)::int` }).from(financeInvoices).where(eq(financeInvoices.status, "OVERDUE"));
  const [st] = await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(and(inArray(orders.status, ["AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK"]), lt(orders.updatedAt, stuckBefore)));
  const [eo] = await db.select({ n: sql<number>`count(*)::int` }).from(errorEvents).where(sql`${errorEvents.resolvedAt} is null`);
  const [en] = await db.select({ n: sql<number>`count(*)::int` }).from(errorEvents).where(gte(errorEvents.firstAt, since));
  const jobs = await jobStatus(db, now);
  return {
    date: now.toISOString().slice(0, 10),
    sales: { orders: paid.length, cents: paid.reduce((s, o) => s + o.sub - o.disc, 0) },
    newStores: ns?.n ?? 0, newLeads: nl?.n ?? 0,
    overdueInvoices: { count: ov?.n ?? 0, cents: ov?.c ?? 0 },
    stuckOrders: st?.n ?? 0,
    errors: { open: eo?.n ?? 0, new24h: en?.n ?? 0 },
    lateJobs: jobs.filter((j) => j.late || j.lastOk === false).map((j) => j.label),
  };
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Texto curto, em português simples, com o que precisa de atenção primeiro. */
export function renderSummary(s: DailySummary): { subject: string; text: string; attention: string[] } {
  const attention: string[] = [];
  if (s.lateJobs.length) attention.push(`Rotinas automáticas atrasadas ou com falha: ${s.lateJobs.join(", ")}. A cobrança e as reservas dependem delas.`);
  if (s.errors.open) attention.push(`${s.errors.open} erro(s) do sistema em aberto (${s.errors.new24h} novo(s) nas últimas 24 h).`);
  if (s.overdueInvoices.count) attention.push(`${s.overdueInvoices.count} fatura(s) vencida(s), somando ${brl(s.overdueInvoices.cents)}.`);
  if (s.stuckOrders) attention.push(`${s.stuckOrders} pedido(s) parado(s) há mais de 2 dias (esperando recarga, etiqueta ou separação).`);
  const lines = [
    `Resumo de ${s.date.split("-").reverse().join("/")}`,
    "",
    attention.length ? `PRECISA DE ATENÇÃO\n${attention.map((a) => `• ${a}`).join("\n")}` : "Nada precisa de atenção hoje.",
    "",
    `Nas últimas 24 horas: ${s.sales.orders} venda(s) paga(s), ${brl(s.sales.cents)} em produtos · ${s.newStores} loja(s) nova(s) · ${s.newLeads} interessado(s) novo(s).`,
  ];
  return { subject: attention.length ? `Resumo do dia: ${attention.length} ponto(s) de atenção` : "Resumo do dia: tudo em ordem", text: lines.join("\n"), attention };
}

/** Envia o resumo aos usuários Master (uma vez por dia e por pessoa). Sem e-mail configurado, só fica registrado na caixa de saída. */
export async function sendDailySummary(db: Database, now = new Date()): Promise<{ recipients: number }> {
  const { sendEmail, appUrl } = await import("@/lib/email");
  const s = await buildDailySummary(db, now);
  const m = renderSummary(s);
  const masters = await db.select({ email: users.email }).from(users).where(eq(users.role, "NEXTLEVEL_MASTER"));
  let n = 0;
  for (const u of masters) if ((await sendEmail(db, { kind: "DAILY_SUMMARY", to: u.email, subject: m.subject, text: m.text, cta: { label: "Abrir o painel", url: `${appUrl()}/master/summary` }, dedupeKey: `RESUMO:${s.date}:${u.email}` })) !== "SKIPPED") n++;
  return { recipients: n };
}

export async function summaryForMaster(db: Database, actor: Actor) {
  requireMaster(actor);
  return renderSummary(await buildDailySummary(db));
}
