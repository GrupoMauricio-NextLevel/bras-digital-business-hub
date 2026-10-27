import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { financeInvoices } from "@/db/schema";
import { ForbiddenError } from "./errors";
import { assertStoreAdmin, isMaster, type Actor } from "./access";
import { periodBounds, periodOf, storeOrderFeeFor } from "./finance";

/**
 * "Sua taxa" (W0, D183): a conta da taxa sobre vendas do mês, mostrada ao lojista com a MESMA função que fecha o mês
 * (`storeOrderFeeFor`, chamada por `closeStoreFees` no dia 1). Nada é recalculado aqui; se a regra do fechamento mudar,
 * as listas abaixo mudam junto (teste em `tests/w0-confianca.test.ts`).
 */
export const TAXA_ENTRA = [
  "Pedidos pagos pelo cliente no mês (pela data do pedido)",
  "O valor dos produtos do pedido",
] as const;
export const TAXA_NAO_ENTRA = [
  "Frete",
  "Pedidos cancelados ou devolvidos",
  "Pedidos não pagos",
  "Pedidos de demonstração",
] as const;

export type TaxaDoMes = {
  competencia: string; fechaEm: string; bps: number; baseCents: number; taxaCents: number; pedidos: number;
  historico: { competencia: string; taxaCents: number; situacao: string }[];
};

const SITUACAO: Record<string, string> = { OPEN: "Em aberto", PAID: "Paga", OVERDUE: "Vencida", WAIVED: "Dispensada", CANCELED: "Cancelada" };

export async function taxaDoMes(db: Database, actor: Actor, storeId: string, agora = new Date()): Promise<TaxaDoMes> {
  if (!isMaster(actor)) {
    if (actor.role !== "STORE_OWNER" || actor.storeId !== storeId) throw new ForbiddenError("Só a própria loja vê a conta da taxa.");
    assertStoreAdmin(actor);
  }
  const competencia = periodOf(agora);
  const f = await storeOrderFeeFor(db, storeId, competencia);
  const faturas = await db.select({ period: financeInvoices.period, amountCents: financeInvoices.amountCents, status: financeInvoices.status })
    .from(financeInvoices)
    .where(and(eq(financeInvoices.storeId, storeId), eq(financeInvoices.kind, "STORE_ORDER_FEES"), inArray(financeInvoices.status, ["OPEN", "PAID", "OVERDUE", "WAIVED"])))
    .orderBy(desc(financeInvoices.period)).limit(6);
  return {
    competencia,
    fechaEm: periodBounds(competencia).end.toISOString(),
    bps: f.bps, baseCents: f.baseCents, taxaCents: f.feeCents, pedidos: f.orders,
    historico: faturas.map((x) => ({ competencia: x.period ?? "", taxaCents: x.amountCents, situacao: SITUACAO[x.status] ?? x.status })),
  };
}

/** "Outubro de 2026" a partir de "2026-10". */
export function nomeDaCompetencia(p: string): string {
  const [y, m] = p.split("-").map(Number) as [number, number];
  const nome = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${y}`;
}
