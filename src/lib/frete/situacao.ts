/**
 * Situação unificada do frete (D113): as mesmas palavras para ônibus e transportadora, calculadas do que já existe
 * (pedido, coleta, fardo). Puro: serve o servidor e a tela. Nenhuma tabela guarda essa situação (uma fonte de verdade).
 */
export const FREIGHT_STEPS = ["RESERVADO", "PRONTO", "COLETADO", "EM_VIAGEM", "ENTREGUE"] as const;
export type FreightStep = (typeof FREIGHT_STEPS)[number];
export type FreightStatus = FreightStep | "CANCELADO";
export const FREIGHT_STEP_LABEL: Record<FreightStatus, string> = { RESERVADO: "Reservado", PRONTO: "Pronto na loja", COLETADO: "Coletado no Brás", EM_VIAGEM: "Em viagem", ENTREGUE: "Entregue", CANCELADO: "Cancelado" };
export const FREIGHT_STEP_HINT: Record<FreightStatus, string> = {
  RESERVADO: "Pedido feito. A loja confere e separa as caixas.",
  PRONTO: "Separado na loja, esperando a coleta.",
  COLETADO: "Saiu do balcão com o código do pedido.",
  EM_VIAGEM: "A caminho do destino.",
  ENTREGUE: "Entregue no destino.",
  CANCELADO: "Pedido cancelado.",
};
export const FREIGHT_STATUS_TONE: Record<FreightStatus, "neutral" | "info" | "warning" | "success" | "danger"> = { RESERVADO: "warning", PRONTO: "info", COLETADO: "info", EM_VIAGEM: "info", ENTREGUE: "success", CANCELADO: "neutral" };

/** Pedido da Brás + coleta da transportadora (quando houver) → situação e linha do tempo. */
export function requestFreightStatus(r: { status: string; createdAt: string; separatedAt: string | null; pickedUpAt: string | null }, load: { status: string; collectedAt: string | null; deliveredAt: string | null } | null): { status: FreightStatus; steps: { key: FreightStep; label: string; at: string | null; done: boolean }[] } {
  const delivered = load?.status === "ENTREGUE";
  const traveling = delivered || load?.status === "COLETADA";
  const collected = traveling || r.status === "PICKED_UP";
  const ready = collected || !!r.separatedAt;
  const status: FreightStatus = r.status === "CANCELED" ? "CANCELADO" : delivered ? "ENTREGUE" : traveling ? "EM_VIAGEM" : collected ? "COLETADO" : ready ? "PRONTO" : "RESERVADO";
  const at: Record<FreightStep, string | null> = { RESERVADO: r.createdAt, PRONTO: r.separatedAt, COLETADO: r.pickedUpAt ?? load?.collectedAt ?? null, EM_VIAGEM: load?.collectedAt ?? null, ENTREGUE: load?.deliveredAt ?? null };
  const reached = { RESERVADO: true, PRONTO: ready, COLETADO: collected, EM_VIAGEM: traveling, ENTREGUE: delivered };
  return { status, steps: FREIGHT_STEPS.map((k) => ({ key: k, label: FREIGHT_STEP_LABEL[k], at: reached[k] ? at[k] : null, done: reached[k] })) };
}
