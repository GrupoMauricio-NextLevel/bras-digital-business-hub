import { and, count, desc, eq, gte, inArray, isNull, ne, sum } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdMembers, bdRequests, crossOpportunities, orders, organizations, stores, trCarriers, trParcels, users, CROSS_OPP_STATUSES } from "@/db/schema";
import { newId } from "@/lib/ids";
import { type Actor, requireMasterFn } from "../access";
import { recordAudit } from "../audit";
import { NotFoundError } from "../errors";

/**
 * Torre do Ecossistema e fila de oportunidades cruzadas (D135, fase P5M). Visão do dono e da equipe comercial:
 * - **Índice do ecossistema:** clientes presentes em mais de uma marca, reconhecidos pelo mesmo CPF/CNPJ (sem juntar
 *   contas: só conta);
 * - **Fluxo entre marcas:** cadastros que vieram de outra marca do grupo (origem `grupo-<marca>` e indicações do Club);
 * - **Fila de oportunidades:** regras que apontam quem tem perfil para outra marca; cada oportunidade ganha dono,
 *   situação (nova, em contato, ativou, descartada) e anotação. **Placar** do mês por pessoa da equipe (só números).
 */
const digits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");
const DAY = 86_400_000;

type Presence = Map<string, Set<string>>;
export async function presenceByDocument(db: Database): Promise<Presence> {
  const [st, mem, car] = await Promise.all([
    db.select({ doc: stores.taxId, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(isNull(stores.showcaseTheme)),
    db.select({ doc: bdMembers.cnpj }).from(bdMembers),
    db.select({ doc: trCarriers.document }).from(trCarriers),
  ]);
  const out: Presence = new Map();
  const add = (doc: string | null, brand: string) => { const d = digits(doc); if (d.length < 11) return; if (!out.has(d)) out.set(d, new Set()); out.get(d)!.add(brand); };
  for (const s of st) add(s.doc, s.brand === "NEXTLEVEL_COMMERCE" ? "NEXTLEVEL_COMMERCE" : "SUPERDROP");
  for (const m of mem) add(m.doc, "BRAS_DIGITAL");
  for (const c of car) add(c.doc, "NEXTLEVEL_CARGAS");
  return out;
}

/** Conta pura do índice: quantos documentos estão em 1, 2, 3+ marcas e os pares mais comuns. */
export function ecosystemIndex(p: Presence) {
  const dist = { one: 0, two: 0, threePlus: 0 };
  const pairs = new Map<string, number>();
  for (const brands of p.values()) {
    if (brands.size === 1) dist.one++; else if (brands.size === 2) dist.two++; else dist.threePlus++;
    const list = [...brands].sort();
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const k = `${list[i]} + ${list[j]}`; pairs.set(k, (pairs.get(k) ?? 0) + 1); }
  }
  const total = p.size;
  return { total, ...dist, multiPct: total ? Math.round(((dist.two + dist.threePlus) / total) * 100) : 0, pairs: [...pairs].map(([pair, n]) => ({ pair, n })).sort((a, b) => b.n - a.n) };
}

export type OppCandidate = { key: string; rule: string; fromBrand: string; toBrand: string; entityType: string; entityId: string; who: string; reason: string };

/** Regras das oportunidades (v1): sinais reais, sem dado sensível na tela além do nome da empresa. */
async function candidates(db: Database, presence: Presence, now: Date): Promise<OppCandidate[]> {
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  const out: OppCandidate[] = [];
  // 1. Lojista que vende (R$ 1.000+ em 30 dias) e ainda não está na Brás → abastecer pelo Brás.
  const selling = await db.select({ id: stores.id, name: stores.name, doc: stores.taxId, brand: organizations.brand, v: sum(orders.subtotalCents) }).from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId)).innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(and(eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), gte(orders.createdAt, since30), isNull(stores.showcaseTheme)))
    .groupBy(stores.id, stores.name, stores.taxId, organizations.brand);
  for (const s of selling) {
    const v = Number(s.v ?? 0);
    if (v < 100_000 || presence.get(digits(s.doc))?.has("BRAS_DIGITAL")) continue;
    const from = s.brand === "NEXTLEVEL_COMMERCE" ? "NEXTLEVEL_COMMERCE" : "SUPERDROP";
    out.push({ key: `LOJA_PARA_BRAS:${s.id}`, rule: "LOJA_PARA_BRAS", fromBrand: from, toBrand: "BRAS_DIGITAL", entityType: "store", entityId: s.id, who: s.name, reason: `Vendeu R$ ${(v / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} em 30 dias e ainda não compra estoque na Brás` });
  }
  // 2. Membro da Brás com pedido pago e sem fardo pelo frete do grupo → Excursão/Cargas.
  const paid = await db.select({ memberId: bdRequests.memberId, n: count() }).from(bdRequests).where(inArray(bdRequests.status, ["PAID", "PICKED_UP"])).groupBy(bdRequests.memberId);
  if (paid.length) {
    const members = await db.select({ id: bdMembers.id, userId: bdMembers.userId, company: bdMembers.companyName }).from(bdMembers).where(inArray(bdMembers.id, paid.map((p) => p.memberId)));
    const withParcels = new Set((await db.select({ u: trParcels.clientUserId }).from(trParcels)).map((r) => r.u));
    for (const m of members) if (!withParcels.has(m.userId)) out.push({ key: `BRAS_PARA_CARGAS:${m.id}`, rule: "BRAS_PARA_CARGAS", fromBrand: "BRAS_DIGITAL", toBrand: "NEXTLEVEL_CARGAS", entityType: "bd_member", entityId: m.id, who: m.company, reason: "Já compra caixa na Brás e ainda não usou o frete do grupo" });
  }
  // 3. Loja no plano grátis da porta de entrada vendendo acima de R$ 3.000 → plano pago (a conta já se paga).
  for (const s of selling) {
    const st = await db.query.stores.findFirst({ where: eq(stores.id, s.id), columns: { entryOffer: true, paidUntil: true, trialEndsAt: true } });
    if (!st?.entryOffer || (st.paidUntil && new Date(st.paidUntil) > now) || (st.trialEndsAt && new Date(st.trialEndsAt) > now)) continue;
    if (Number(s.v ?? 0) < 300_000) continue;
    const brand = s.brand === "NEXTLEVEL_COMMERCE" ? "NEXTLEVEL_COMMERCE" : "SUPERDROP";
    out.push({ key: `GRATIS_PARA_PAGO:${s.id}`, rule: "GRATIS_PARA_PAGO", fromBrand: brand, toBrand: brand, entityType: "store", entityId: s.id, who: s.name, reason: "Está no plano grátis e já vende o bastante para um plano pago sair mais barato" });
  }
  return out;
}

export const RULE_LABEL: Record<string, string> = { LOJA_PARA_BRAS: "Loja → Brás", BRAS_PARA_CARGAS: "Brás → frete do grupo", GRATIS_PARA_PAGO: "Grátis → plano pago" };
export const OPP_STATUS_LABEL: Record<(typeof CROSS_OPP_STATUSES)[number], string> = { NOVA: "Nova", EM_CONTATO: "Em contato", ATIVOU: "Ativou", DESCARTADA: "Descartada" };

/** Torre: índice, fluxo, fila (as regras geram as novas; as que já existem mantêm dono e situação) e placar do mês. */
export async function ecosystemTower(db: Database, actor: Actor, now = new Date()) {
  requireMasterFn(actor, ["COMERCIAL"]);
  const presence = await presenceByDocument(db);
  const index = ecosystemIndex(presence);
  const cands = await candidates(db, presence, now);
  if (cands.length) await db.insert(crossOpportunities).values(cands.map((c) => ({ id: newId("opp"), key: c.key, rule: c.rule, fromBrand: c.fromBrand, toBrand: c.toBrand, entityType: c.entityType, entityId: c.entityId }))).onConflictDoNothing();
  const who = new Map(cands.map((c) => [c.key, { who: c.who, reason: c.reason }]));
  const rows = await db.select({ o: crossOpportunities, owner: users.name }).from(crossOpportunities).leftJoin(users, eq(users.id, crossOpportunities.ownerUserId)).orderBy(desc(crossOpportunities.updatedAt)).limit(200);
  const queue = rows.map(({ o, owner }) => ({ ...o, ownerName: owner, who: who.get(o.key)?.who ?? null, reason: who.get(o.key)?.reason ?? "Regra não se aplica mais (o cliente mudou)" }));
  // Fluxo entre marcas: cadastros da Brás vindos de outra marca (origem grupo-*) e lojas com origem registrada.
  const flow = await db.select({ source: bdMembers.source, n: count() }).from(bdMembers).where(and(gte(bdMembers.createdAt, new Date(now.getTime() - 90 * DAY).toISOString()))).groupBy(bdMembers.source);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const board = new Map<string, number>();
  for (const q of queue) if (q.status === "ATIVOU" && q.activatedAt && q.activatedAt >= monthStart) board.set(q.ownerName ?? "Sem dono", (board.get(q.ownerName ?? "Sem dono") ?? 0) + 1);
  return {
    index, queue,
    flow: flow.filter((f) => f.source?.startsWith("grupo-")).map((f) => ({ from: f.source!.replace("grupo-", "").toUpperCase(), to: "BRAS_DIGITAL", n: f.n })),
    board: [...board].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n),
    counts: Object.fromEntries(CROSS_OPP_STATUSES.map((s) => [s, queue.filter((q) => q.status === s).length])) as Record<(typeof CROSS_OPP_STATUSES)[number], number>,
  };
}

export const oppUpdateSchema = z.object({ status: z.enum(CROSS_OPP_STATUSES), note: z.string().trim().max(500).optional(), takeOwnership: z.boolean().optional() });

/** A equipe assume, anota e muda a situação. "Ativou" conta no placar do mês de quem é o dono. */
export async function updateOpportunity(db: Database, actor: Actor, id: string, raw: z.input<typeof oppUpdateSchema>, now = new Date()) {
  requireMasterFn(actor, ["COMERCIAL"]);
  const v = oppUpdateSchema.parse(raw);
  const o = await db.query.crossOpportunities.findFirst({ where: eq(crossOpportunities.id, id) });
  if (!o) throw new NotFoundError("Oportunidade não encontrada.");
  const ownerUserId = v.takeOwnership || !o.ownerUserId ? actor.userId : o.ownerUserId;
  await db.update(crossOpportunities).set({ status: v.status, note: v.note ?? o.note, ownerUserId, activatedAt: v.status === "ATIVOU" ? (o.activatedAt ?? now.toISOString()) : null, updatedAt: now.toISOString() }).where(eq(crossOpportunities.id, id));
  await recordAudit(db, actor, { action: "CROSS_OPPORTUNITY", entityType: "cross_opportunity", entityId: id, before: { status: o.status, owner: o.ownerUserId }, after: { status: v.status, owner: ownerUserId } }, { force: true });
  return { ok: true };
}
