import { createHash } from "node:crypto";
import { and, eq, gte, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { experiments, financeInvoices, orders, organizations, stores, EXPERIMENT_PIECES } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "./access";
import { recordAudit } from "./audit";
import { DomainError, NotFoundError } from "./errors";

/**
 * Experimentos (D136, fase P6 do prompt de público e preço). Uma peça (porta de entrada do SuperDrop ou da Commerce,
 * benefícios nos painéis) roda com **grupo de controle × grupo novo**, sorteado por cliente de forma fixa (o mesmo
 * cliente cai sempre no mesmo grupo). Sem experimento rodando, a peça vale para todos quando ligada (como antes).
 * A leitura compara a métrica principal e a de guarda por grupo e explica a incerteza em português simples.
 */
export type Piece = (typeof EXPERIMENT_PIECES)[number];
export const PIECE_LABEL: Record<Piece, string> = { PORTA_SUPERDROP: "Porta de entrada do SuperDrop", PORTA_COMMERCE: "Porta de entrada da Commerce", BENEFICIOS: "Benefícios nos painéis" };

/** Sorteio fixo: 0 a 99 a partir do experimento e do cliente. */
export function bucketOf(experimentId: string, subjectId: string) {
  return parseInt(createHash("sha256").update(`${experimentId}:${subjectId}`).digest("hex").slice(0, 8), 16) % 100;
}

/**
 * O cliente recebe a peça? Sem experimento rodando: sim (a chave da peça decide). Com experimento: só quem caiu no
 * grupo novo. Quem entrou antes do início do experimento fica como estava (controle).
 */
export async function inTreatment(db: Database, piece: Piece, subjectId: string, now = new Date()): Promise<boolean> {
  const exp = await db.query.experiments.findFirst({ where: and(eq(experiments.piece, piece), eq(experiments.status, "RODANDO")) });
  if (!exp) return true;
  if (exp.startedAt && new Date(exp.startedAt) > now) return false;
  return bucketOf(exp.id, subjectId) < exp.treatmentPct;
}

export const experimentSchema = z.object({
  piece: z.enum(EXPERIMENT_PIECES),
  name: z.string().trim().min(3).max(120),
  treatmentPct: z.number().int().min(5).max(95),
  primaryMetric: z.enum(["ATIVACAO_30", "PAGANTE_30"]),
  guardMetric: z.enum(["RECEITA_POR_CLIENTE", "SAIDA_30"]),
  minPerGroup: z.number().int().min(10).max(100_000),
  readAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export async function createExperiment(db: Database, actor: Actor, raw: z.input<typeof experimentSchema>) {
  requireMaster(actor);
  const v = experimentSchema.parse(raw);
  const id = newId("exp");
  await db.insert(experiments).values({ id, ...v, readAt: new Date(v.readAt).toISOString(), createdBy: actor.userId });
  await recordAudit(db, actor, { action: "EXPERIMENT_CREATED", entityType: "experiment", entityId: id, after: v }, { force: true });
  return { id };
}

/** Iniciar (um experimento rodando por peça) ou encerrar (exige leitura escrita e decisão). */
export async function setExperimentStatus(db: Database, actor: Actor, id: string, action: { start: true } | { end: true; reading: string; decision: string }, now = new Date()) {
  requireMaster(actor);
  const e = await db.query.experiments.findFirst({ where: eq(experiments.id, id) });
  if (!e) throw new NotFoundError("Experimento não encontrado.");
  if ("start" in action) {
    if (e.status !== "RASCUNHO") throw new DomainError("EXP_STATE", "Só um experimento em rascunho pode começar.");
    if (await db.query.experiments.findFirst({ where: and(eq(experiments.piece, e.piece), eq(experiments.status, "RODANDO")) })) throw new DomainError("EXP_RUNNING", "Já existe um experimento rodando nesta peça.");
    await db.update(experiments).set({ status: "RODANDO", startedAt: now.toISOString(), updatedAt: now.toISOString() }).where(eq(experiments.id, id));
  } else {
    if (e.status !== "RODANDO") throw new DomainError("EXP_STATE", "Só um experimento rodando pode ser encerrado.");
    if (action.reading.trim().length < 20 || action.decision.trim().length < 5) throw new DomainError("EXP_READING", "Para encerrar, escreva a leitura (o que os números mostram) e a decisão.");
    await db.update(experiments).set({ status: "ENCERRADO", endedAt: now.toISOString(), reading: action.reading.trim(), decision: action.decision.trim(), updatedAt: now.toISOString() }).where(eq(experiments.id, id));
  }
  await recordAudit(db, actor, { action: "start" in action ? "EXPERIMENT_STARTED" : "EXPERIMENT_ENDED", entityType: "experiment", entityId: id }, { force: true });
  return { ok: true };
}

/** Diferença entre duas proporções e se pode ser acaso (teste de duas proporções, aproximação normal). */
export function compareRates(a: { n: number; hits: number }, b: { n: number; hits: number }) {
  const pa = a.n ? a.hits / a.n : 0, pb = b.n ? b.hits / b.n : 0;
  const p = a.n + b.n ? (a.hits + b.hits) / (a.n + b.n) : 0;
  const se = Math.sqrt(p * (1 - p) * (1 / Math.max(a.n, 1) + 1 / Math.max(b.n, 1)));
  const z = se ? (pb - pa) / se : 0;
  const diffPts = Math.round((pb - pa) * 1000) / 10;
  const verdict = !a.n || !b.n ? "Ainda sem clientes nos dois grupos." : Math.abs(z) >= 1.96
    ? `O grupo novo ficou ${diffPts > 0 ? "acima" : "abaixo"} do controle em ${Math.abs(diffPts).toLocaleString("pt-BR")} pontos, e é difícil ser acaso (95% de confiança).`
    : `A diferença de ${diffPts.toLocaleString("pt-BR")} pontos ainda pode ser acaso: com esses números, não dá para afirmar que um grupo é melhor.`;
  return { controlPct: Math.round(pa * 1000) / 10, treatmentPct: Math.round(pb * 1000) / 10, diffPts, z: Math.round(z * 100) / 100, significant: Math.abs(z) >= 1.96, verdict };
}

const DAY = 86_400_000;
/** Leitura: lojas que entraram depois do início, por grupo; ativação (1ª venda paga) e pagante em 30 dias; guarda. */
export async function readExperiment(db: Database, actor: Actor, id: string, now = new Date()) {
  requireMaster(actor);
  const e = await db.query.experiments.findFirst({ where: eq(experiments.id, id) });
  if (!e) throw new NotFoundError("Experimento não encontrado.");
  if (!e.startedAt) return { experiment: e, groups: null, primary: null, guard: null, ready: false };
  const brand = e.piece === "PORTA_COMMERCE" ? "NEXTLEVEL_COMMERCE" : e.piece === "PORTA_SUPERDROP" ? "SUPERDROP" : null;
  const rows = await db.select({ id: stores.id, createdAt: stores.createdAt, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(gte(stores.createdAt, e.startedAt));
  const cohort = rows.filter((r) => !brand || r.brand === brand);
  const ids = cohort.map((c) => c.id);
  const [ords, invs] = ids.length ? await Promise.all([
    db.select({ storeId: orders.storeId, createdAt: orders.createdAt, cents: orders.subtotalCents }).from(orders).where(and(inArray(orders.storeId, ids), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"))),
    db.select({ storeId: financeInvoices.storeId, paidAt: financeInvoices.paidAt, cents: financeInvoices.amountCents }).from(financeInvoices).where(and(inArray(financeInvoices.storeId, ids), eq(financeInvoices.status, "PAID"))),
  ]) : [[], []];
  const g = { control: { n: 0, act: 0, paying: 0, revenue: 0 }, treatment: { n: 0, act: 0, paying: 0, revenue: 0 } };
  for (const c of cohort) {
    const grp = bucketOf(e.id, c.id) < e.treatmentPct ? g.treatment : g.control;
    const until = new Date(c.createdAt).getTime() + 30 * DAY;
    if (until > now.getTime()) continue; // só conta quem já tem 30 dias
    grp.n++;
    if (ords.some((o) => o.storeId === c.id && new Date(o.createdAt).getTime() <= until)) grp.act++;
    const paid = invs.filter((i) => i.storeId === c.id && i.paidAt);
    if (paid.some((i) => new Date(i.paidAt!).getTime() <= until)) grp.paying++;
    grp.revenue += paid.reduce((a, i) => a + i.cents, 0);
  }
  const metric = e.primaryMetric === "ATIVACAO_30" ? "act" : "paying";
  const primary = compareRates({ n: g.control.n, hits: g.control[metric] }, { n: g.treatment.n, hits: g.treatment[metric] });
  const rpc = (x: typeof g.control) => (x.n ? Math.round(x.revenue / x.n) : 0);
  const guard = { controlCents: rpc(g.control), treatmentCents: rpc(g.treatment) };
  const ready = g.control.n >= e.minPerGroup && g.treatment.n >= e.minPerGroup && now >= new Date(e.readAt);
  return { experiment: e, groups: g, primary, guard, ready };
}

export async function listExperiments(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(experiments).orderBy(experiments.createdAt);
}
