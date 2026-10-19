/** Partes puras da revisão mensal do "Pronto e desligado" (R4), seguras para telas no navegador. */
export const DECISOES = ["LIGAR", "MANTER", "APOSENTAR"] as const;
export type Decisao = (typeof DECISOES)[number];
export const ROTULO_DECISAO: Record<Decisao, string> = { LIGAR: "Ligar", MANTER: "Manter desligado", APOSENTAR: "Aposentar" };
export type Sugestao = { decisao: Decisao; porque: string };
export type RegistroDecisao = { decisao: Decisao; nota: string; mes: string; quem: string; quando: string };
export const mesDe = (d: Date) => d.toISOString().slice(0, 7);
