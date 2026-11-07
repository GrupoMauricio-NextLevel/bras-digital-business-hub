/**
 * Executivos de venda (CX3, D273). Puro: prazo de prestação de contas em dias úteis, código e texto do recibo.
 */
import { dataSP, limitesDoDia, somarDias } from "./caixa-regras";

/** Prazo para entregar o dinheiro (decisão do dono: 2 dias úteis). Feriados não entram na conta. */
export const DIAS_UTEIS_PARA_ENTREGAR = 2;

/** Fim do N-ésimo dia útil depois do recebimento (sábado e domingo não contam), no fuso de São Paulo. */
export function prazoDeEntrega(recebidoEm: Date, diasUteis = DIAS_UTEIS_PARA_ENTREGAR): Date {
  let d = dataSP(recebidoEm), n = 0;
  while (n < diasUteis) {
    d = somarDias(d, 1);
    const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (dow !== 0 && dow !== 6) n++;
  }
  return limitesDoDia(d).fim;
}

export const atrasado = (prazoAte: string | Date, agora: Date) => new Date(prazoAte).getTime() < agora.getTime();

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function codigoDeRecibo(aleatorio: () => number = Math.random): string {
  return `REC-${Array.from({ length: 6 }, () => ALFABETO[Math.floor(aleatorio() * ALFABETO.length)]).join("")}`;
}

const dataHora = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);
const data = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(d);

/** Texto do recibo enviado ao lojista pelo WhatsApp. */
export function textoDoRecibo(r: { codigo: string; loja: string; plano: string; valor: string; meio: "DINHEIRO" | "MAQUININHA_VENDEDOR"; executivo: string; quando: Date; pagoAte: Date | null }) {
  return [
    `Recibo NextLevel ${r.codigo}`,
    `Loja: ${r.loja}`,
    `Plano: ${r.plano}`,
    `Valor: ${r.valor} (${r.meio === "DINHEIRO" ? "dinheiro" : "maquininha"})`,
    `Recebido por: ${r.executivo}, executivo NextLevel, em ${dataHora(r.quando)}`,
    r.pagoAte ? `Sua loja está liberada até ${data(r.pagoAte)}.` : "Sua loja está liberada.",
    "Dúvidas: fale com a NextLevel pelo WhatsApp.",
  ].join("\n");
}

/** Link do WhatsApp com o recibo pronto (para o número da loja, se houver). */
export function linkDoRecibo(texto: string, whatsapp: string | null | undefined) {
  const d = (whatsapp ?? "").replace(/\D/g, "");
  const numero = d ? (d.length <= 11 ? `55${d}` : d) : "";
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/** Prazo legível: o último dia para entregar ("ter., 15/12"), já que o prazo vence à meia-noite do dia seguinte. */
export function diaDoPrazo(prazoAte: string | Date) {
  const ultimo = new Date(new Date(prazoAte).getTime() - 60_000);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(ultimo);
}
