/**
 * Caixa do Master (CX0, D269). Puro: rótulos, data no fuso de São Paulo, semana, resumo do dia por meio e o dinheiro
 * esperado na gaveta. O banco e as permissões ficam em `src/lib/domain/caixa.ts`.
 */
/**
 * Formas de pagamento da NextLevel (dono, 07/11/2026, D270): checkout online (Mercado Pago, entra sozinho), maquininha do
 * Mercado Pago com o Mauricio, maquininha com os vendedores, Pix na chave do CNPJ da NextLevel Marketing Ltda e dinheiro
 * (com o Mauricio vai para a gaveta; com o vendedor fica com ele até a prestação de contas, CX3).
 * CARTAO, TRANSFERENCIA, BOLETO e OUTRO ficam só para ler lançamentos antigos; não aparecem para escolher.
 */
export const MEIOS = ["DINHEIRO", "PIX", "MAQUININHA", "MAQUININHA_VENDEDOR", "MERCADO_PAGO", "CARTAO", "TRANSFERENCIA", "BOLETO", "OUTRO"] as const;
export type Meio = (typeof MEIOS)[number];
/** O que a equipe escolhe ao lançar à mão (o checkout online entra sozinho). */
export const MEIOS_MANUAIS = ["DINHEIRO", "PIX", "MAQUININHA", "MAQUININHA_VENDEDOR"] as const satisfies readonly Meio[];
export const ORIGENS = ["ASSINATURA", "TEMPLATE", "SERVICO", "PRESTACAO_EXECUTIVO", "SANGRIA", "REFORCO", "COMISSAO_PAGA", "AJUSTE", "OUTRO"] as const;
export type Origem = (typeof ORIGENS)[number];
export type Tipo = "ENTRADA" | "SAIDA";

export const NOME_DO_MEIO: Record<Meio, string> = { DINHEIRO: "Dinheiro", PIX: "Pix", MAQUININHA: "Maquininha do Mercado Pago (Mauricio)", MAQUININHA_VENDEDOR: "Maquininha com vendedor", MERCADO_PAGO: "Checkout online", CARTAO: "Cartão (antigo)", TRANSFERENCIA: "Transferência (antigo)", BOLETO: "Boleto (antigo)", OUTRO: "Outro (antigo)" };
export const NOME_DA_ORIGEM: Record<Origem, string> = { ASSINATURA: "Assinatura", TEMPLATE: "Template", SERVICO: "Serviço adicional", PRESTACAO_EXECUTIVO: "Prestação de contas de executivo", SANGRIA: "Sangria (retirada)", REFORCO: "Reforço de troco", COMISSAO_PAGA: "Pagamento de comissão", AJUSTE: "Ajuste", OUTRO: "Outros" };
/** Origens que só existem num sentido: sangria e comissão paga saem; reforço e prestação de contas entram. */
export const TIPO_FIXO: Partial<Record<Origem, Tipo>> = { SANGRIA: "SAIDA", COMISSAO_PAGA: "SAIDA", REFORCO: "ENTRADA", PRESTACAO_EXECUTIVO: "ENTRADA", ASSINATURA: "ENTRADA", TEMPLATE: "ENTRADA", SERVICO: "ENTRADA" };
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

/** Contas de destino do dinheiro (dono, 07/11/2026, D270). */
export const DESTINOS = ["DINHEIRO_MAURICIO", "MP_MEGATRON", "PIX_ITAU_NEXTLEVEL", "PIX_NUBANK_MAURICIO"] as const;
export type Destino = (typeof DESTINOS)[number];
export const NOME_DO_DESTINO: Record<Destino, string> = {
  DINHEIRO_MAURICIO: "Dinheiro em espécie com o Mauricio",
  MP_MEGATRON: "Conta Mercado Pago do checkout online (CNPJ Mega Tron)",
  PIX_ITAU_NEXTLEVEL: "Pix · conta CNPJ NextLevel (Itaú)",
  PIX_NUBANK_MAURICIO: "Pix · conta CPF Mauricio Ramos (Nubank)",
};
/** Contas que cada forma de pagamento pode usar; a primeira é a sugerida. Dinheiro só vai para a gaveta do Mauricio. */
export const DESTINOS_DO_MEIO: Record<Meio, Destino[]> = {
  DINHEIRO: ["DINHEIRO_MAURICIO"],
  PIX: ["PIX_ITAU_NEXTLEVEL", "PIX_NUBANK_MAURICIO", "MP_MEGATRON"],
  MAQUININHA: ["MP_MEGATRON"],
  MAQUININHA_VENDEDOR: ["MP_MEGATRON"],
  MERCADO_PAGO: ["MP_MEGATRON"],
  CARTAO: [...DESTINOS], TRANSFERENCIA: [...DESTINOS], BOLETO: [...DESTINOS], OUTRO: [...DESTINOS],
};
export const destinoPadrao = (m: Meio): Destino => DESTINOS_DO_MEIO[m][0]!;

/** Famílias do catálogo que contam como "Template" e como "Serviço adicional" no caixa. */
export const FAMILIAS_TEMPLATE = ["TEMA"] as const;
export const FAMILIAS_SERVICO = ["LOJA_PRONTA", "MIGRACAO", "MARKETING", "CONSULTORIA", "ADDON", "ADS"] as const;

/** Soma por conta de destino (estornados fora). */
export function resumoPorDestino(l: { tipo: Tipo; valorCents: number; destino?: Destino | null; estornado?: boolean }[]) {
  return DESTINOS.map((destino) => {
    const d = l.filter((x) => !x.estornado && x.destino === destino);
    return { destino, entradasCents: d.filter((x) => x.tipo === "ENTRADA").reduce((t, x) => t + x.valorCents, 0), saidasCents: d.filter((x) => x.tipo === "SAIDA").reduce((t, x) => t + x.valorCents, 0) };
  }).filter((x) => x.entradasCents || x.saidasCents);
}
