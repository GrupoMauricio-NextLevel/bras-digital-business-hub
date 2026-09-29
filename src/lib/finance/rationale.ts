import type { AddonKey, OfferKey, PriceBook, TierKey } from "./price-book";
import { OFFER_KEYS, TIER_KEYS } from "./price-book";
import { pct } from "./engine";

/** Premissas usadas nos cálculos de margem. Editáveis no futuro; hoje ficam explícitas e marcadas "a validar". */
export const ASSUMPTIONS = {
  storesPerSupplier: 20,
  typicalOrderCostCents: 15_000,
  supplierCostBaseCents: { START: 6_000_000, GROWTH: 12_000_000, SCALE: 30_000_000 } as Record<TierKey, number>,
  supplierStores: { START: 8, GROWTH: 25, SCALE: 60 } as Record<TierKey, number>,
  supportMinutesPerStoreMonth: 15,
  supportCostPerHourCents: 3_500,
};

export type UnitEconomics = { revenueCents: number; costCents: number; marginCents: number; marginBps: number; lines: { label: string; cents: number }[] };

const economics = (revenue: number, costs: { label: string; cents: number }[]): UnitEconomics => {
  const cost = costs.reduce((s, c) => s + c.cents, 0);
  return { revenueCents: revenue, costCents: cost, marginCents: revenue - cost, marginBps: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 10_000) : 0, lines: costs };
};

/** Margem mensal de um lojista na oferta (mensalidade menos custo de servir). */
export function storeEconomics(b: PriceBook, offer: OfferKey): UnitEconomics {
  const revenue = b.offers[offer].monthlyCents;
  const supportShare = Math.round((ASSUMPTIONS.supportMinutesPerStoreMonth / 60) * ASSUMPTIONS.supportCostPerHourCents);
  return economics(revenue, [
    { label: "Infraestrutura da loja", cents: b.costs.infraPerStoreCents },
    { label: "Cobrança (Mercado Pago)", cents: pct(revenue, b.costs.collectionFeeBps) },
    { label: "Suporte (rateio)", cents: offer === "DROP_MANUAL" ? Math.round(supportShare / 2) : supportShare },
  ]);
}

/** Margem mensal de um fornecedor no degrau (mensalidade + taxa de volume, menos custo de servir). */
export function supplierEconomics(b: PriceBook, tier: TierKey): UnitEconomics {
  const t = b.supplierTiers[tier];
  const base = ASSUMPTIONS.supplierCostBaseCents[tier];
  const fee = Math.max(pct(base, b.superdrop.volumeFeeBps), b.superdrop.minMonthlyFeeCents);
  const revenue = t.monthlyCents + fee;
  return economics(revenue, [
    { label: "Suporte dedicado", cents: b.costs.supportPerSupplierCents },
    { label: "Infraestrutura das lojas", cents: b.costs.infraPerStoreCents * ASSUMPTIONS.supplierStores[tier] },
    { label: "Cobrança (Mercado Pago)", cents: pct(revenue, b.costs.collectionFeeBps) },
  ]);
}

export type Rationale = { key: string; label: string; price: string; covers: string; delivers: string; anchor: string; perOrder?: string; margin?: UnitEconomics; audience: "STORE" | "SUPPLIER" | "BOTH"; toValidate: boolean };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ");
const pctText = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;

/** Racional de cada preço e taxa, gerado a partir da tabela vigente (nunca fica desatualizado). */
export function buildRationale(b: PriceBook): Rationale[] {
  const out: Rationale[] = [];
  for (const o of OFFER_KEYS) {
    const e = storeEconomics(b, o);
    out.push({
      key: `offer:${o}`, label: b.offers[o].name, audience: "STORE", toValidate: true, margin: e,
      price: `${brl(b.offers[o].monthlyCents)}/mês${b.offers[o].setupCents ? ` + setup ${brl(b.offers[o].setupCents)}` : ""}`,
      covers: `Infraestrutura, cobrança e suporte (${brl(e.costCents)}/mês por loja). O setup paga a ativação e ${pctText(b.channel.setupCommissionBps)} dele fica com o fornecedor que trouxe a loja.`,
      delivers: b.offers[o].description,
      anchor: o === "DROP_MANUAL" ? "Menos que um plano básico de ERP ou planilha com estoque compartilhado." : o === "STORE_SUBDOMAIN" ? "Abaixo de plataformas de loja virtual com mensalidade e taxa por venda." : "Marca e domínio próprios pelo preço de um plano intermediário de plataforma.",
    });
  }
  for (const t of TIER_KEYS) {
    const e = supplierEconomics(b, t);
    out.push({ key: `tier:${t}`, label: `Fornecedor ${b.supplierTiers[t].name}`, audience: "SUPPLIER", toValidate: true, margin: e, price: `${brl(b.supplierTiers[t].monthlyCents)}/mês + taxa de volume`, covers: `Suporte dedicado, infraestrutura das lojas da rede e cobrança (${brl(e.costCents)}/mês).`, delivers: `Painel gerencial, esteira de expedição, carteira dos lojistas${b.supplierTiers[t].maxSkus ? `, até ${b.supplierTiers[t].maxSkus} SKUs` : ", SKUs ilimitados"}.`, anchor: "Custo menor que um funcionário de expedição a mais, para operar dezenas de lojistas." });
  }
  const typical = ASSUMPTIONS.typicalOrderCostCents;
  out.push({
    key: "fee:volume", label: "Taxa de volume (SuperDrop)", audience: "SUPPLIER", toValidate: true,
    price: `${pctText(b.superdrop.volumeFeeBps)} do custo dos pedidos (mín. ${brl(b.superdrop.minMonthlyFeeCents)}/mês)`,
    covers: "Custo variável de operar a plataforma conforme o volume cresce e a receita da NextLevel quando o fornecedor vende.",
    delivers: "Só cobra quando há pedido com custo debitado do saldo; sem venda paga só o piso.",
    anchor: `Marketplaces cobram de 12% a 20% sobre a venda; aqui é ${pctText(b.superdrop.volumeFeeBps)} sobre o custo.`,
    perOrder: `Pedido típico de ${brl(typical)} de custo: ${brl(pct(typical, b.superdrop.volumeFeeBps))} de taxa.`,
  });
  out.push({
    key: "fee:channel", label: "Comissão de canal (25% do setup)", audience: "SUPPLIER", toValidate: false,
    price: `${pctText(b.channel.setupCommissionBps)} do setup de cada loja nova`,
    covers: "Custo de captação: quem traz o lojista é remunerado, e a NextLevel não paga mídia.",
    delivers: `Paga ao fornecedor após ${b.channel.guaranteeDays} dias de garantia, abatida no fechamento mensal.`,
    anchor: "Comissões de afiliados variam de 20% a 40% do primeiro pagamento.",
    perOrder: `Loja própria a ${brl(b.offers.STORE_OWN.setupCents)}: ${brl(pct(b.offers.STORE_OWN.setupCents, b.channel.setupCommissionBps))} para o fornecedor.`,
  });
  (Object.keys(b.addons) as AddonKey[]).forEach((k) => {
    const a = b.addons[k];
    const annualSaving = a.monthlyCents * 12 - a.annualCents;
    out.push({ key: `addon:${k}`, label: a.name, audience: a.audience, toValidate: true, price: `${brl(a.monthlyCents)}/mês ou ${brl(a.annualCents)}/ano`, covers: k === "ACADEMY_STORE" ? "Produção e atualização do conteúdo, plataforma de vídeo e suporte pedagógico." : k === "PREMIUM_SUPPORT" ? "Atendente com fila prioritária e SLA menor." : k === "EXTRA_DISPATCH_SEAT" ? "Licença e suporte de mais um usuário de expedição." : "Processamento e manutenção dos relatórios.", delivers: a.description, anchor: k === "ACADEMY_STORE" ? "Um curso avulso de e-commerce custa de R$ 500 a R$ 2.000; aqui o lojista paga aos poucos e aprende com a própria loja." : "Add-on opcional: só paga quem usa.", perOrder: annualSaving > 0 ? `No plano anual o cliente economiza ${brl(annualSaving)}.` : undefined });
  });
  return out;
}

export type MarginAlert = { key: string; label: string; marginBps: number; targetBps: number };

/** Perfis cuja margem está abaixo da meta (`services.targetMarginBps`). */
export function marginAlerts(b: PriceBook): MarginAlert[] {
  const target = b.services.targetMarginBps;
  const rows = buildRationale(b).filter((r) => r.margin);
  return rows.filter((r) => r.margin!.marginBps < target).map((r) => ({ key: r.key, label: r.label, marginBps: r.margin!.marginBps, targetBps: target }));
}
