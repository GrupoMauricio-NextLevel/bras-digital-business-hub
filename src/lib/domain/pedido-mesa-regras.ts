import type { OrderStatus } from "@/db/schema";

/** Regras puras do pedido na mesa (W1, D184), sem banco: servem à lista (servidor e navegador) e aos testes. */
export const PASSOS_NA_LINHA: Partial<Record<OrderStatus, OrderStatus>> = {
  READY_TO_PICK: "PICKING",
  PICKING: "READY_TO_SHIP",
  SHIPPED: "DELIVERED",
};

export function proximaNaLinha(status: OrderStatus, independente: boolean): OrderStatus | null {
  return independente ? PASSOS_NA_LINHA[status] ?? null : null;
}

// ---------------------------------------------------------------------------
// Previsão de entrega
// ---------------------------------------------------------------------------
/** Feriados nacionais de data fixa (MM-DD). Os móveis (Carnaval, Sexta-feira Santa, Corpus Christi) não entram. */
const FERIADOS = new Set(["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"]);
const diaUtil = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6 && !FERIADOS.has(d.toISOString().slice(5, 10));

/** Data do pagamento + prazo do frete + dias de produção, em dias úteis (fuso de Brasília). Nulo sem prazo. */
export function previsaoDeEntrega(pagoEm: Date, diasDoFrete: number | null | undefined, diasDeProducao = 0): Date | null {
  if (diasDoFrete == null) return null;
  const d = new Date(pagoEm.getTime() - 3 * 3_600_000); // Brasília
  d.setUTCHours(12, 0, 0, 0);
  let falta = diasDoFrete + diasDeProducao;
  while (falta > 0) { d.setUTCDate(d.getUTCDate() + 1); if (diaUtil(d)) falta--; }
  return d;
}

