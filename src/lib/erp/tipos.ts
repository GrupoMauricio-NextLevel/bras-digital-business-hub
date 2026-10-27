import type { FetchLike } from "@/lib/payments/mercadopago";

/** ERPs da Rodada C (D191). Interface única: conferir a conta, mandar o pedido pago e ler o estoque por SKU. */
export type ErpKey = "TINY" | "OMIE";
export type PedidoParaErp = {
  id: string; numero: number; dataIso: string;
  cliente: { nome: string; email: string; telefone: string | null; endereco: string | null; cidade: string | null; uf: string | null; cep: string | null };
  itens: { sku: string; nome: string; quantidade: number; valorCents: number }[];
  freteCents: number; descontoCents: number; totalCents: number; servicoFrete: string | null;
};
export type SaldoErp = { sku: string; saldo: number };
export interface ErpCliente {
  verificar(): Promise<{ conta: string }>;
  enviarPedido(p: PedidoParaErp): Promise<{ externoId: string }>;
  /** Saldos mudados desde a data (ou todos, sem data). */
  estoque(desde: Date | null): Promise<SaldoErp[]>;
}
export type ErpFabrica = (credencial: string, fetchImpl?: FetchLike) => ErpCliente;

export class ErpError extends Error {
  /** true quando a credencial foi recusada (não adianta tentar de novo). */
  constructor(message: string, readonly credencialRecusada = false) { super(message); }
}

export const reais = (c: number) => Math.round(c) / 100;
const dois = (n: number) => String(n).padStart(2, "0");
/** Data no formato dos ERPs brasileiros (dd/mm/aaaa), no fuso de Brasília. */
export function dataBR(d: Date, comHora = false) {
  const b = new Date(d.getTime() - 3 * 3600_000);
  const dia = `${dois(b.getUTCDate())}/${dois(b.getUTCMonth() + 1)}/${b.getUTCFullYear()}`;
  return comHora ? `${dia} ${dois(b.getUTCHours())}:${dois(b.getUTCMinutes())}:${dois(b.getUTCSeconds())}` : dia;
}
