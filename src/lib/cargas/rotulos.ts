/** Rótulos da NextLevel Cargas (D108). Puro: serve o formulário (cliente) e o domínio (servidor). */
export const CARGAS_KINDS = ["TRANSPORTADORA", "AUTONOMO", "IMPORTADORA"] as const;
export const CARGAS_KIND_LABEL: Record<(typeof CARGAS_KINDS)[number], string> = { TRANSPORTADORA: "Transportadora (CNPJ)", AUTONOMO: "Autônomo (CPF)", IMPORTADORA: "Importadora" };
export const CARGAS_VEHICLES = ["UTILITARIO", "VAN", "TOCO", "TRUCK", "CARRETA", "ONIBUS_EXCURSAO"] as const;
export const CARGAS_VEHICLE_LABEL: Record<(typeof CARGAS_VEHICLES)[number], string> = { UTILITARIO: "Utilitário", VAN: "Van", TOCO: "Caminhão toco", TRUCK: "Truck", CARRETA: "Carreta", ONIBUS_EXCURSAO: "Ônibus de excursão" };
export const CARGAS_LOAD_STATUS_LABEL = { CHAMADA: "Aguardando a transportadora", ACEITA: "Aceita: coletar", RECUSADA: "Recusada", COLETADA: "Coletada: em trânsito", ENTREGUE: "Entregue", CANCELADA: "Cancelada" } as const;
export const CARGAS_LOAD_STATUS_TONE = { CHAMADA: "warning", ACEITA: "info", RECUSADA: "danger", COLETADA: "info", ENTREGUE: "success", CANCELADA: "neutral" } as const;
export const CARGAS_PERIOD_LABEL = { MANHA: "manhã", TARDE: "tarde" } as const;
export const CARGAS_PLAN_LABEL = { GRATIS: "Grátis", PRO: "Pro", PREMIUM: "Premium" } as const;
/** "12/10 (manhã)" a partir de "2026-10-12". */
export function cargasDay(date: string, period: "MANHA" | "TARDE") {
  const [, m, d] = date.split("-");
  return `${d}/${m} (${CARGAS_PERIOD_LABEL[period]})`;
}
/** Hoje no horário de Brasília, "AAAA-MM-DD". */
export function cargasToday(now = new Date()) {
  return new Date(now.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
}
export const CARGAS_OPERATION_LABEL = { CARGA: "Transportadora de carga", EXCURSAO: "Ônibus de excursão" } as const;
export const CARGAS_DOC_KINDS = ["FRETAMENTO", "RNTRC", "ESTADUAL", "SEGURO", "OUTRO"] as const;
export const CARGAS_DOC_LABEL: Record<(typeof CARGAS_DOC_KINDS)[number], string> = { FRETAMENTO: "Autorização de fretamento (ANTT)", RNTRC: "RNTRC (ANTT)", ESTADUAL: "Autorização estadual", SEGURO: "Seguro de carga", OUTRO: "Outra autorização" };
/** Selo "documentação em dia": ao menos uma autorização conferida e nenhuma conferida vencida. Puro (servidor e tela). */
export function cargasDocsSeal(docs: { status: string; validUntil: string | null }[], today: string): { ok: boolean; expiringSoon: boolean } {
  const verified = docs.filter((d) => d.status === "VERIFICADA");
  const valid = verified.filter((d) => !d.validUntil || d.validUntil >= today);
  const soon = new Date(`${today}T12:00:00Z`); soon.setUTCDate(soon.getUTCDate() + 30);
  const limit = soon.toISOString().slice(0, 10);
  return { ok: valid.length > 0 && valid.length === verified.length, expiringSoon: valid.some((d) => !!d.validUntil && d.validUntil <= limit) };
}
