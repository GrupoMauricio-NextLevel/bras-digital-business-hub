import type { CatalogFamily, CatalogKind, CatalogStatus, JourneyPhase, PriceCycle } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { priceDisplay, type PriceRule } from "./catalog-pricing";

export const FAMILY_LABEL: Record<CatalogFamily, string> = { COMMERCE_PLAN: "Planos Commerce", LOJA_PRONTA: "Loja Pronta", MIGRACAO: "Migração", TEMA: "Temas", MARKETING: "Marketing", CONSULTORIA: "Consultoria", WHITE_LABEL: "White Label", SUPERDROP: "SuperDrop", ADDON: "Add-ons", BRAS_MEMBER_PLAN: "Brás: planos do membro", BRAS_IMPORTER_PLAN: "Brás: planos da importadora", CARRIER_PLAN: "Cargas: planos da transportadora", BRAS_SERVICE: "Brás: serviços", ADS: "Publicidade", CLUB_PLAN: "Club: assinatura do ecossistema" };
export const KIND_LABEL: Record<CatalogKind, string> = { subscription: "Assinatura", one_time: "Compra única", quote_required: "Sob consulta", usage_fee: "Taxa por uso" };
export const STATUS_LABEL: Record<CatalogStatus, string> = { DRAFT: "Rascunho", PUBLISHED: "Publicado", PAUSED: "Pausado", ARCHIVED: "Arquivado" };
export const PHASE_LABEL: Record<JourneyPhase, string> = { FUNDACAO: "Fundação", LANCAMENTO: "Lançamento", AQUISICAO: "Aquisição", OTIMIZACAO: "Otimização", ESCALA: "Escala" };
export const CYCLE_LABEL: Record<PriceCycle, string> = { MONTHLY: "mensal", ANNUAL: "anual", ONE_TIME: "compra única", QUOTE: "sob consulta" };

/** Texto de preço completo (sem "a partir de"): explica ciclo, Pix e cartão. */
export function priceLines(p: { kind: CatalogKind; prices: Partial<Record<PriceCycle, (PriceRule & { platformFeeBps?: number | null }) | undefined>>; meta?: Record<string, unknown> }): { main: string; details: string[] } {
  if (p.kind === "quote_required") {
    const setup = typeof p.meta?.setupCents === "number" ? `Setup de ${formatBRL(p.meta.setupCents)} · ` : "";
    return { main: "Sob consulta", details: [`${setup}valores definidos em proposta, sem compromisso.`] };
  }
  const m = p.prices.MONTHLY, a = p.prices.ANNUAL, o = p.prices.ONE_TIME;
  if (m && m.amountCents !== null) {
    const details = [`${formatBRL(m.amountCents)} por mês, renovação mensal`];
    if (a?.amountCents) { const off = m.amountCents ? Math.round((1 - a.amountCents / (m.amountCents * 12)) * 100) : 0; details.push(`ou ${formatBRL(a.amountCents)} no anual à vista (${off > 0 ? `${off}% de desconto, ` : ""}pagamento único)`); }
    if (m.platformFeeBps) details.push(`taxa de plataforma de ${(m.platformFeeBps / 100).toString().replace(".", ",")}% sobre vendas pagas`);
    return { main: `${formatBRL(m.amountCents)}/mês`, details };
  }
  if (o && o.amountCents !== null) {
    const d = priceDisplay(o);
    const details: string[] = ["Compra única, sem mensalidade"];
    if (d?.pix) details.push(`Pix: ${formatBRL(d.pix.totalCents)}${d.pix.pixDiscountCents ? ` (${o.pixDiscountBps / 100}% de desconto)` : ""}`);
    if (d?.card) details.push(o.cardMarkupBps ? `Cartão: ${formatBRL(d.card.totalCents)} em até ${o.cardMaxInstallments}x de ${formatBRL(d.card.installmentCents)} (preço-base × ${(1 + o.cardMarkupBps / 10_000).toFixed(2).replace(".", ",")})` : `Cartão: ${formatBRL(d.card.totalCents)} em até ${o.cardMaxInstallments}x de ${formatBRL(d.card.installmentCents)} sem acréscimo`);
    return { main: formatBRL(o.amountCents), details };
  }
  return { main: "Preço em definição", details: [] };
}
