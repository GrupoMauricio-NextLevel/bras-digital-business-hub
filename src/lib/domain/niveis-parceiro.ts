import { and, eq, gte, inArray, isNotNull, isNull, like, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { nlSubscriptions, orders, partnerCommissions, partnerTierHistory, partners, stores, type PartnerTier } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BONUS_ATIVACAO_CENTS, BONUS_META_ATIVACOES, BONUS_META_CENTS, TETO_RECORRENTE_BPS } from "@/lib/finance/revisao-d226";
import { requireMasterFn, type Actor } from "./access";
import { DomainError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { periodOf } from "./finance";

/**
 * Níveis por desempenho dos parceiros (D249, fase PV2). Conta clientes pagantes ativos (lojas atribuídas ao parceiro
 * com assinatura E-commerce ativa). Sobe na hora; desce só depois de 2 meses seguidos abaixo do limite.
 * O Master pode fixar o nível à mão, com motivo (o cálculo deixa de mexer até ele soltar).
 */
export const NIVEIS: readonly { tier: PartnerTier; nome: string; minimo: number; efeito: string }[] = [
  { tier: "INICIAL", nome: "Inicial", minimo: 0, efeito: "Regra base da sua trilha, já com recorrência" },
  { tier: "PRATA", nome: "Prata", minimo: 3, efeito: "+2 pontos na recorrência" },
  { tier: "OURO", nome: "Ouro", minimo: 10, efeito: "+4 pontos na recorrência e gerente de sucesso" },
  { tier: "DIAMANTE", nome: "Diamante", minimo: 20, efeito: "Elite: 32% na agência, 26% no criador e no representante" },
];
const ORDEM: PartnerTier[] = ["INICIAL", "PRATA", "OURO", "DIAMANTE"];
const rank = (t: PartnerTier) => ORDEM.indexOf(t);
export const MESES_PARA_DESCER = 2;

export function nivelPorClientes(ativos: number): PartnerTier {
  return [...NIVEIS].reverse().find((n) => ativos >= n.minimo)!.tier;
}

/** Recorrência com o bônus do nível, sem passar do teto (32%). Agência no Diamante = Elite. */
export function recorrenteDoNivel(baseBps: number, tier: PartnerTier, kind: string): number {
  if (baseBps <= 0) return baseBps;
  const agencia = kind === "AGENCY" || kind === "AGENCY_ELITE";
  const alvo = tier === "PRATA" ? baseBps + 200 : tier === "OURO" ? baseBps + 400 : tier === "DIAMANTE" ? Math.max(baseBps, agencia ? 3200 : 2600) : baseBps;
  return Math.min(Math.max(alvo, baseBps), Math.max(TETO_RECORRENTE_BPS, baseBps));
}

/** Meses entre duas competências YYYY-MM. */
const mesesEntre = (de: string, ate: string) => { const [a, b] = de.split("-").map(Number); const [c, d] = ate.split("-").map(Number); return (c! - a!) * 12 + (d! - b!); };

export async function clientesAtivos(db: Database, partnerId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(stores)
    .innerJoin(nlSubscriptions, eq(nlSubscriptions.storeId, stores.id))
    .where(and(eq(stores.partnerId, partnerId), isNull(stores.attributionFlag), eq(nlSubscriptions.status, "active")));
  return Number(r?.n ?? 0);
}

async function mudar(db: Database, p: { id: string; tier: PartnerTier }, para: PartnerTier, ativos: number, now: Date, extra: { source: "AUTO" | "MASTER"; reason?: string | null; actorUserId?: string | null; lockedReason?: string | null }) {
  await db.update(partners).set({ tier: para, tierBelowSince: null, tierUpdatedAt: now.toISOString(), ...(extra.source === "MASTER" ? { tierLockedReason: extra.lockedReason ?? null } : {}) }).where(eq(partners.id, p.id));
  await db.insert(partnerTierHistory).values({ id: newId("pth"), partnerId: p.id, fromTier: p.tier, toTier: para, activeClients: ativos, source: extra.source, reason: extra.reason ?? null, actorUserId: extra.actorUserId ?? null, at: now.toISOString() });
}

/** Recalcula um parceiro. `soSobe` é usado na hora da venda (sobe na hora, nunca desce ali). */
export async function recalcularNivel(db: Database, partnerId: string, now = new Date(), opts: { soSobe?: boolean } = {}): Promise<PartnerTier> {
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId), columns: { id: true, tier: true, tierBelowSince: true, tierLockedReason: true } });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  if (p.tierLockedReason) return p.tier;
  const ativos = await clientesAtivos(db, p.id);
  const alvo = nivelPorClientes(ativos);
  if (rank(alvo) > rank(p.tier)) { await mudar(db, p, alvo, ativos, now, { source: "AUTO", reason: `${ativos} clientes ativos` }); return alvo; }
  if (rank(alvo) === rank(p.tier)) { if (p.tierBelowSince && !opts.soSobe) await db.update(partners).set({ tierBelowSince: null }).where(eq(partners.id, p.id)); return p.tier; }
  if (opts.soSobe) return p.tier;
  const mes = periodOf(now);
  if (!p.tierBelowSince) { await db.update(partners).set({ tierBelowSince: mes }).where(eq(partners.id, p.id)); return p.tier; }
  if (mesesEntre(p.tierBelowSince, mes) >= MESES_PARA_DESCER) { await mudar(db, p, alvo, ativos, now, { source: "AUTO", reason: `${MESES_PARA_DESCER} meses abaixo do limite (${ativos} clientes ativos)` }); return alvo; }
  return p.tier;
}

/** Rotina diária: recalcula todos os parceiros e paga os bônus do representante. */
export async function rodarNiveis(db: Database, now = new Date()) {
  const lista = await db.select({ id: partners.id }).from(partners).where(eq(partners.status, "ACTIVE"));
  let mudaram = 0;
  for (const p of lista) {
    const antes = (await db.query.partners.findFirst({ where: eq(partners.id, p.id), columns: { tier: true } }))!.tier;
    if ((await recalcularNivel(db, p.id, now)) !== antes) mudaram++;
  }
  const bonus = await bonusDosRepresentantes(db, now);
  const inativados = await inativarSemClientes(db, now);
  return { mudaram, bonus, inativados };
}

export const MESES_SEM_CLIENTE = 6;
/**
 * Requalificação (D249, ligada pelo dono): parceiro sem nenhum cliente ativo e sem nenhuma comissão de venda nos
 * últimos 6 meses (e com cadastro de 6 meses ou mais) fica Inativo. Volta a captar pela reativação que já existe.
 */
export async function inativarSemClientes(db: Database, now = new Date()) {
  const corte = new Date(now); corte.setUTCMonth(corte.getUTCMonth() - MESES_SEM_CLIENTE);
  const lista = await db.select({ id: partners.id, createdAt: partners.createdAt }).from(partners).where(eq(partners.status, "ACTIVE"));
  let n = 0;
  for (const p of lista) {
    if (new Date(p.createdAt) > corte) continue;
    if ((await clientesAtivos(db, p.id)) > 0) continue;
    const [v] = await db.select({ n: sql<number>`count(*)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), inArray(partnerCommissions.kind, ["SALE", "RECURRING", "SETUP", "MAINTENANCE", "BONUS"]), gte(partnerCommissions.createdAt, corte.toISOString())));
    if (Number(v?.n ?? 0) > 0) continue;
    await db.update(partners).set({ status: "INACTIVE" }).where(and(eq(partners.id, p.id), eq(partners.status, "ACTIVE")));
    await recordFinancialAudit(db, null, { domain: CORPORATE, action: "PARTNER_INACTIVATED", entityType: "partner", entityId: p.id, partnerId: p.id, reason: `${MESES_SEM_CLIENTE} meses sem cliente ativo` });
    n++;
  }
  return n;
}

/** O Master fixa o nível (com motivo) ou solta (tier = null, volta ao cálculo). */
export async function fixarNivel(db: Database, actor: Actor, partnerId: string, tier: PartnerTier | null, motivo: string, now = new Date()) {
  requireMasterFn(actor, ["COMERCIAL", "FINANCEIRO"]);
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId), columns: { id: true, tier: true } });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  const ativos = await clientesAtivos(db, p.id);
  if (tier === null) {
    await db.update(partners).set({ tierLockedReason: null }).where(eq(partners.id, p.id));
    await db.insert(partnerTierHistory).values({ id: newId("pth"), partnerId: p.id, fromTier: p.tier, toTier: p.tier, activeClients: ativos, source: "MASTER", reason: "Nível solto: volta ao cálculo mensal", actorUserId: actor.userId, at: now.toISOString() });
    return recalcularNivel(db, p.id, now);
  }
  const m = motivo.trim();
  if (m.length < 5) throw new DomainError("MOTIVO", "Escreva o motivo para fixar o nível.");
  await mudar(db, p, tier, ativos, now, { source: "MASTER", reason: m, actorUserId: actor.userId, lockedReason: m });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "PARTNER_TIER_LOCKED", entityType: "partner", entityId: p.id, partnerId: p.id, before: { tier: p.tier }, after: { tier }, reason: m });
  return tier;
}

/**
 * Bônus do representante (D226): R$ 30 por loja ativada (publicada, com 1ª venda paga e 30 dias de assinatura ativa)
 * e +R$ 100 quando chega a 10 ativações no mês. Cada loja paga uma vez só.
 */
export async function bonusDosRepresentantes(db: Database, now = new Date()) {
  const limite = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const lojas = await db.select({ storeId: stores.id, partnerId: stores.partnerId, desde: sql<string>`coalesce(${nlSubscriptions.trialEndsAt}, ${nlSubscriptions.createdAt})` })
    .from(stores).innerJoin(partners, eq(partners.id, stores.partnerId)).innerJoin(nlSubscriptions, eq(nlSubscriptions.storeId, stores.id))
    .where(and(eq(partners.kind, "REPRESENTATIVE"), eq(partners.status, "ACTIVE"), isNull(stores.attributionFlag), isNotNull(stores.publishedAt), eq(stores.status, "ACTIVE"), eq(nlSubscriptions.status, "active")));
  const periodo = periodOf(now);
  let pagos = 0;
  const tocados = new Set<string>();
  for (const l of lojas) {
    if (!l.partnerId || new Date(l.desde).toISOString() > limite) continue;
    const venda = await db.query.orders.findFirst({ where: and(eq(orders.storeId, l.storeId), eq(orders.customerPaymentStatus, "PAID")), columns: { id: true } });
    if (!venda) continue;
    const r = await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId: l.partnerId, storeId: l.storeId, kind: "BONUS", amountCents: BONUS_ATIVACAO_CENTS, period: periodo, status: "PENDING", availableAt: now.toISOString(), note: "Bônus por loja ativada (D226)", dedupeKey: `BONUS-ATIVACAO:${l.storeId}` }).onConflictDoNothing().returning({ id: partnerCommissions.id });
    if (r.length) { pagos++; tocados.add(l.partnerId); }
  }
  for (const partnerId of tocados) {
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partnerId), eq(partnerCommissions.period, periodo), like(partnerCommissions.dedupeKey, "BONUS-ATIVACAO:%")));
    if (Number(c?.n ?? 0) >= BONUS_META_ATIVACOES) {
      const r = await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId, kind: "BONUS", amountCents: BONUS_META_CENTS, period: periodo, status: "PENDING", availableAt: now.toISOString(), note: `Meta de ${BONUS_META_ATIVACOES} lojas ativadas no mês (D226)`, dedupeKey: `BONUS-META:${partnerId}:${periodo}` }).onConflictDoNothing().returning({ id: partnerCommissions.id });
      if (r.length) pagos++;
    }
  }
  return pagos;
}
