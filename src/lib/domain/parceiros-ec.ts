import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { partnerCommissions, partners, stores } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { requireMasterFn, type Actor } from "./access";
import { DomainError } from "./errors";
import { emitEvent } from "./events";
import { findRule } from "./corporate-commissions";
import { periodOf } from "./finance";
import { balances, partnerOfActor } from "./partners";
import { situacoesComerciais, type SituacaoComercial } from "./situacao-comercial";
import { ordenar, type ItemAgora } from "./loja-agora";

/**
 * Programa de Parceiros da NextLevel Commerce (D220), módulo próprio (depois estendido à Soluções). Indicador:
 * 20% da 1ª mensalidade + 10% recorrente por 12 meses. Agência parceira (aprovada pelo Master): 30% + 15% enquanto o
 * cliente ficar. As porcentagens vêm das regras de comissão do catálogo (editáveis no Master), nunca fixas aqui.
 */
export const ROTULO_TIPO: Record<string, string> = { AFFILIATE: "Indicador", REPRESENTATIVE: "Representante", AGENCY: "Agência parceira", AGENCY_ELITE: "Agência elite", WHITE_LABEL: "White label" };
const AGENCIA = new Set(["AGENCY", "AGENCY_ELITE"]);
const DIA = 86_400_000;

export type IndicadoEc = { id: string; nome: string; slug: string; criadaEm: string; publicada: boolean; s: SituacaoComercial; ganhoCents: number };

/** Quanto cada regra paga (para o painel mostrar as porcentagens reais). */
export async function regrasDoParceiro(db: Database, kind: string) {
  const [m, a] = await Promise.all([
    findRule(db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_START", cycle: "MONTHLY", partnerKind: kind }),
    findRule(db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_START", cycle: "ANNUAL", partnerKind: kind }),
  ]);
  return { primeiraBps: m?.firstBps ?? 0, recorrenteBps: m?.recurringBps ?? 0, meses: m?.recurringMonths ?? 0, anualBps: a?.firstBps ?? 0 };
}

/** O que o parceiro precisa fazer agora: indicados com teste acabando, pagamento pendente ou parados. Puro. */
export function agoraDoParceiro(ind: IndicadoEc[], agora = new Date()): ItemAgora[] {
  const l: ItemAgora[] = [];
  for (const x of ind) {
    const d = x.s.diasParaVencer;
    if (x.s.pagamento === "teste" && d !== null && d <= 3) l.push({ id: x.id, titulo: `${x.nome}: teste termina em ${Math.max(0, d)} dia(s)`, detalhe: "Ajude a escolher o plano: a sua comissão começa no primeiro pagamento.", tom: "danger" });
    else if (x.s.pagamento === "aguardando") l.push({ id: x.id, titulo: `${x.nome}: escolheu o plano e não pagou`, detalhe: "Um lembrete seu costuma resolver.", tom: "warning" });
    else if (x.s.pagamento === "vencido") l.push({ id: x.id, titulo: `${x.nome}: plano vencido`, detalhe: "Cliente que sai para de gerar a sua comissão recorrente.", tom: "warning" });
    else if (!x.publicada && agora.getTime() - new Date(x.criadaEm).getTime() >= 3 * DIA) l.push({ id: x.id, titulo: `${x.nome}: loja ainda não publicada`, detalhe: "Ofereça ajuda para montar; loja no ar vende e paga o plano.", tom: "info" });
  }
  return ordenar(l);
}

export async function painelParceiroEc(db: Database, actor: Actor, agora = new Date()) {
  const p = await partnerOfActor(db, actor);
  const lojas = await db.select({ id: stores.id, nome: stores.name, slug: stores.slug, paidUntil: stores.paidUntil, trialEndsAt: stores.trialEndsAt, entryOffer: stores.entryOffer, publishedAt: stores.publishedAt, createdAt: stores.createdAt }).from(stores).where(eq(stores.partnerId, p.id)).orderBy(desc(stores.createdAt));
  const [sit, ganhos, saldo, regras, porLoja, regrasAgencia] = await Promise.all([
    situacoesComerciais(db, lojas, agora),
    db.select({ s: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.period, periodOf(agora)), ne(partnerCommissions.status, "VOID"))),
    balances(db, p.id),
    regrasDoParceiro(db, p.kind),
    lojas.length ? db.select({ storeId: partnerCommissions.storeId, s: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), inArray(partnerCommissions.storeId, lojas.map((l) => l.id)), ne(partnerCommissions.status, "VOID"))).groupBy(partnerCommissions.storeId) : Promise.resolve([]),
    regrasDoParceiro(db, "AGENCY"),
  ]);
  const ganhoPorLoja = new Map(porLoja.map((r) => [r.storeId, Number(r.s)]));
  const indicados: IndicadoEc[] = lojas.map((l) => ({ id: l.id, nome: l.nome, slug: l.slug, criadaEm: l.createdAt, publicada: !!l.publishedAt, s: sit.get(l.id)!, ganhoCents: ganhoPorLoja.get(l.id) ?? 0 }));
  const pagantes = indicados.filter((x) => x.s.pagamento === "pagante");
  const recorrenteMesCents = Math.round(pagantes.reduce((t, x) => t + x.s.valorCents, 0) * regras.recorrenteBps / 10_000);
  return {
    parceiro: { id: p.id, code: p.code, nome: p.displayName, kind: p.kind, tipo: ROTULO_TIPO[p.kind] ?? p.kind, agencia: AGENCIA.has(p.kind), agenciaPedida: !!p.agencyRequestedAt, status: p.status, pessoaFisica: (p.taxId ?? "").replace(/\D/g, "").length === 11 },
    regras, regrasAgencia, mesCents: Number(ganhos[0]?.s ?? 0), saldo, recorrenteMesCents,
    indicados, pagantes: pagantes.length, emTeste: indicados.filter((x) => x.s.pagamento === "teste").length,
    agora: agoraDoParceiro(indicados, agora),
  };
}

const pedido = z.object({ info: z.string().trim().min(5, "Conte o site ou Instagram da agência e quantos clientes atende").max(400) });

/** O parceiro pede para ser agência parceira; o Master aprova em Parceiros (muda o tipo para AGENCY). */
export async function pedirAgencia(db: Database, actor: Actor, raw: z.input<typeof pedido>) {
  const p = await partnerOfActor(db, actor);
  if (AGENCIA.has(p.kind)) throw new DomainError("JA_AGENCIA", "Você já é agência parceira.");
  const { info } = pedido.parse(raw);
  await db.update(partners).set({ agencyRequestedAt: new Date().toISOString(), agencyInfo: info }).where(eq(partners.id, p.id));
  await emitEvent(db, { type: "PARTNER_AGENCY_REQUESTED", actorRole: "AFFILIATE", payload: { partnerId: p.id, code: p.code } });
}

/** Master: agências esperando aprovação, para o "Precisa de você agora" de Parceiros. */
export async function agenciasPedindo(db: Database, actor: Actor): Promise<ItemAgora[]> {
  requireMasterFn(actor, ["COMERCIAL"]);
  const rows = await db.select({ id: partners.id, nome: partners.displayName, info: partners.agencyInfo, kind: partners.kind, em: partners.agencyRequestedAt }).from(partners).where(isNotNull(partners.agencyRequestedAt)).orderBy(desc(partners.agencyRequestedAt));
  return rows.filter((r) => !AGENCIA.has(r.kind)).map((r) => ({ id: r.id, titulo: `${r.nome} quer ser agência parceira`, detalhe: r.info ?? "Sem detalhes.", tom: "warning" as const, href: `/master/partners/${r.id}`, acao: "Avaliar" }));
}

export const ganhoTexto = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
export const exemploGanho = (mensalCents: number, primeiraBps: number, recorrenteBps: number) => `${formatBRL(Math.round(mensalCents * primeiraBps / 10_000))} na 1ª mensalidade e ${formatBRL(Math.round(mensalCents * recorrenteBps / 10_000))} por mês depois`;
