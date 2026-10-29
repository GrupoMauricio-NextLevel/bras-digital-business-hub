import { inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { nlSubscriptions, type stores } from "@/db/schema";
import { storeAccess } from "./store-access";

/**
 * Situação comercial da loja (D200): UMA resposta para "essa loja paga?". O contrato (`nl_subscriptions`) manda; o acesso
 * dado à mão (`paidUntil`/teste da loja) só vale quando não há contrato, e aparece como "cortesia" ou "teste".
 * Todas as telas do Master (Agora, Lojistas, Receita, funil) usam esta função, para os números baterem.
 */
export type Pagamento = "pagante" | "teste" | "aguardando" | "vencido" | "cancelado" | "cortesia" | "sem_plano";
export type SituacaoComercial = { pagamento: Pagamento; rotulo: string; plano: string | null; ciclo: "MONTHLY" | "ANNUAL" | null; valorCents: number; venceEm: string | null; diasParaVencer: number | null };

export const ROTULO_PAGAMENTO: Record<Pagamento, string> = {
  pagante: "Pagante", teste: "Em teste", aguardando: "Aguardando pagamento", vencido: "Pagamento vencido",
  cancelado: "Cancelada", cortesia: "Cortesia", sem_plano: "Sem plano",
};

type Contrato = typeof nlSubscriptions.$inferSelect;
type Loja = Pick<typeof stores.$inferSelect, "paidUntil" | "trialEndsAt" | "entryOffer">;

const DIA = 86_400_000;
const nomePlano = (key: string) => { const k = key.replace(/^COMMERCE_/, ""); return k.charAt(0) + k.slice(1).toLowerCase(); };

/** Regra pura. `agora` sempre injetado (nada de relógio escondido). */
export function situacaoComercial(loja: Loja, contrato: Contrato | null | undefined, agora: Date): SituacaoComercial {
  const fim = (iso: string | null | undefined) => (iso ? { venceEm: iso, diasParaVencer: Math.ceil((new Date(iso).getTime() - agora.getTime()) / DIA) } : { venceEm: null, diasParaVencer: null });
  if (contrato) {
    const p: Pagamento = contrato.status === "active" ? "pagante"
      : contrato.status === "trial" ? "teste"
      : contrato.status === "pending_payment" ? "aguardando"
      : contrato.status === "past_due" || contrato.status === "suspended" ? "vencido"
      : "cancelado";
    const prazo = p === "teste" ? fim(contrato.trialEndsAt) : fim(contrato.currentPeriodEnd);
    const mensal = contrato.cycle === "ANNUAL" ? Math.round(contrato.amountCents / 12) : contrato.amountCents;
    return { pagamento: p, rotulo: ROTULO_PAGAMENTO[p], plano: nomePlano(contrato.productKey), ciclo: contrato.cycle, valorCents: p === "pagante" ? mensal : 0, ...prazo };
  }
  const a = storeAccess(loja, agora);
  const p: Pagamento = a.state === "PAID" ? "cortesia" : a.state === "TRIAL" ? "teste" : "sem_plano";
  return { pagamento: p, rotulo: ROTULO_PAGAMENTO[p], plano: null, ciclo: null, valorCents: 0, venceEm: a.endsAt?.toISOString() ?? null, diasParaVencer: a.daysLeft };
}

/** Em lote: uma consulta para todas as lojas. */
export async function situacoesComerciais<L extends Loja & { id: string }>(db: Database, lojas: L[], agora: Date): Promise<Map<string, SituacaoComercial>> {
  const ids = lojas.map((l) => l.id);
  const contratos = ids.length ? await db.select().from(nlSubscriptions).where(inArray(nlSubscriptions.storeId, ids)) : [];
  const porLoja = new Map(contratos.map((c) => [c.storeId, c]));
  return new Map(lojas.map((l) => [l.id, situacaoComercial(l, porLoja.get(l.id), agora)]));
}

/** Resumo para os contadores (mesma conta em todas as telas). */
export function resumoComercial(s: Iterable<SituacaoComercial>) {
  const r = { pagantes: 0, teste: 0, aguardando: 0, vencidos: 0, cancelados: 0, cortesia: 0, semPlano: 0, mrrCents: 0 };
  for (const x of s) {
    if (x.pagamento === "pagante") { r.pagantes++; r.mrrCents += x.valorCents; }
    else if (x.pagamento === "teste") r.teste++;
    else if (x.pagamento === "aguardando") r.aguardando++;
    else if (x.pagamento === "vencido") r.vencidos++;
    else if (x.pagamento === "cancelado") r.cancelados++;
    else if (x.pagamento === "cortesia") r.cortesia++;
    else r.semPlano++;
  }
  return r;
}
