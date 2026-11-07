/**
 * Caixa do Master (CX0, D269). Puro: rótulos, data no fuso de São Paulo, semana, resumo do dia por meio e o dinheiro
 * esperado na gaveta. O banco e as permissões ficam em `src/lib/domain/caixa.ts`.
 */
export const MEIOS = ["DINHEIRO", "PIX", "CARTAO", "TRANSFERENCIA", "MERCADO_PAGO", "BOLETO", "OUTRO"] as const;
export type Meio = (typeof MEIOS)[number];
export const ORIGENS = ["ASSINATURA", "SERVICO", "PRESTACAO_EXECUTIVO", "SANGRIA", "REFORCO", "COMISSAO_PAGA", "AJUSTE", "OUTRO"] as const;
export type Origem = (typeof ORIGENS)[number];
export type Tipo = "ENTRADA" | "SAIDA";

export const NOME_DO_MEIO: Record<Meio, string> = { DINHEIRO: "Dinheiro", PIX: "Pix", CARTAO: "Cartão na maquininha", TRANSFERENCIA: "Transferência", MERCADO_PAGO: "Mercado Pago", BOLETO: "Boleto", OUTRO: "Outro" };
export const NOME_DA_ORIGEM: Record<Origem, string> = { ASSINATURA: "Assinatura", SERVICO: "Serviço", PRESTACAO_EXECUTIVO: "Prestação de contas de executivo", SANGRIA: "Sangria (retirada)", REFORCO: "Reforço de troco", COMISSAO_PAGA: "Pagamento de comissão", AJUSTE: "Ajuste", OUTRO: "Outro" };
/** Origens que só existem num sentido: sangria e comissão paga saem; reforço e prestação de contas entram. */
export const TIPO_FIXO: Partial<Record<Origem, Tipo>> = { SANGRIA: "SAIDA", COMISSAO_PAGA: "SAIDA", REFORCO: "ENTRADA", PRESTACAO_EXECUTIVO: "ENTRADA", ASSINATURA: "ENTRADA", SERVICO: "ENTRADA" };
/** Sangria e reforço mexem na gaveta: são sempre em dinheiro. */
export const MEIO_FIXO: Partial<Record<Origem, Meio>> = { SANGRIA: "DINHEIRO", REFORCO: "DINHEIRO" };

/** Data (AAAA-MM-DD) no fuso de São Paulo. */
export function dataSP(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export const ehData = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));

/** Soma dias a uma data AAAA-MM-DD (sem fuso: conta só o calendário). */
export function somarDias(data: string, n: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Semana de segunda a domingo que contém a data. */
export function semanaDe(data: string): string[] {
  const dow = new Date(`${data}T12:00:00Z`).getUTCDay(); // 0 = domingo
  const segunda = somarDias(data, dow === 0 ? -6 : 1 - dow);
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
}

/** Início e fim (instantes) de um dia de São Paulo, para buscar pagamentos automáticos pelo horário. */
export function limitesDoDia(data: string): { inicio: Date; fim: Date } {
  // São Paulo sem horário de verão desde 2019: UTC-3.
  const inicio = new Date(`${data}T03:00:00.000Z`);
  return { inicio, fim: new Date(inicio.getTime() + 86_400_000) };
}

export type LancamentoResumo = { tipo: Tipo; meio: Meio; valorCents: number; estornado?: boolean };
export type ResumoDoDia = {
  entradasCents: number;
  saidasCents: number;
  saldoCents: number;
  porMeio: { meio: Meio; entradasCents: number; saidasCents: number }[];
  /** Dinheiro que deve estar na gaveta: saldo inicial + entradas em dinheiro − saídas em dinheiro. */
  esperadoGavetaCents: number;
  quantidade: number;
};

/** Resumo do dia. Lançamentos estornados não contam. */
export function resumoDoDia(lancamentos: LancamentoResumo[], saldoInicialCents = 0): ResumoDoDia {
  const validos = lancamentos.filter((l) => !l.estornado);
  const porMeio = MEIOS.map((meio) => ({
    meio,
    entradasCents: validos.filter((l) => l.meio === meio && l.tipo === "ENTRADA").reduce((t, l) => t + l.valorCents, 0),
    saidasCents: validos.filter((l) => l.meio === meio && l.tipo === "SAIDA").reduce((t, l) => t + l.valorCents, 0),
  })).filter((m) => m.entradasCents || m.saidasCents);
  const entradasCents = validos.filter((l) => l.tipo === "ENTRADA").reduce((t, l) => t + l.valorCents, 0);
  const saidasCents = validos.filter((l) => l.tipo === "SAIDA").reduce((t, l) => t + l.valorCents, 0);
  const dinheiro = porMeio.find((m) => m.meio === "DINHEIRO");
  return { entradasCents, saidasCents, saldoCents: entradasCents - saidasCents, porMeio, esperadoGavetaCents: saldoInicialCents + (dinheiro?.entradasCents ?? 0) - (dinheiro?.saidasCents ?? 0), quantidade: validos.length };
}

/** Diferença do fechamento: positiva = sobrou dinheiro; negativa = faltou. */
export const diferencaDoFechamento = (esperadoCents: number, contadoCents: number) => contadoCents - esperadoCents;
