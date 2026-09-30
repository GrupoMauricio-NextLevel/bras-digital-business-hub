import type { PriceBook } from "./price-book";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: c % 100 === 0 ? 0 : 2 });
const pctText = (bps: number) => `${(bps / 100).toLocaleString("pt-BR")}%`;

export type Status = "Implementado" | "Parcial" | "Planejado" | "Futuro";
export type MapEntry = {
  id: string;
  group: "Fornecedor" | "Lojista" | "Canal" | "Extras";
  name: string;
  payer: string;
  receiver: string;
  pricing: string;
  when: string;
  billing: "Antecipado" | "Fechamento mensal" | "Na compra" | "Recorrente" | "Sob demanda";
  status: Status;
  where: string;
  note?: string;
};

/** Mapa completo de receitas com os valores atuais da tabela de preços. */
export function revenueMap(b: PriceBook): MapEntry[] {
  const o = b.offers;
  return [
    { id: "sup-sub", group: "Fornecedor", name: "Mensalidade de conexão do estoque (SuperDrop)", payer: "Fornecedor", receiver: "NextLevel", pricing: `${brl(b.supplierTiers.START.monthlyCents)}, ${brl(b.supplierTiers.GROWTH.monthlyCents)} ou ${brl(b.supplierTiers.SCALE.monthlyCents)} por faixa de SKUs e pedidos`, when: "Todo mês, no início da competência", billing: "Antecipado", status: "Implementado", where: "Contratos e Faturas", note: "Isenção concedida vira prazo no contrato, com preço de lista travado depois." },
    { id: "sup-vol", group: "Fornecedor", name: "Taxa de volume (SuperDrop)", payer: "Fornecedor", receiver: "NextLevel", pricing: `${pctText(b.superdrop.volumeFeeBps)} do custo dos pedidos com pagamento à Central confirmado, mínimo de ${brl(b.superdrop.minMonthlyFeeCents)} por mês`, when: "Fechamento do mês, vencimento no dia " + b.billing.dueDay, billing: "Fechamento mensal", status: "Implementado", where: "Faturas, painel do fornecedor", note: "Base calculada pelos eventos do sistema, sem depender de declaração do fornecedor." },
    { id: "wl-setup", group: "Fornecedor", name: "Setup White Label", payer: "Fornecedor", receiver: "NextLevel", pricing: `${brl(b.whiteLabel.setupCents)} uma vez`, when: "Na contratação", billing: "Antecipado", status: "Implementado", where: "Novo fornecedor, Faturas", note: "Libera domínio próprio, gestão de expedição e recargas dos membros." },
    { id: "wl-sub", group: "Fornecedor", name: "Manutenção White Label", payer: "Fornecedor", receiver: "NextLevel", pricing: `${brl(b.whiteLabel.monthlyCents)} por mês`, when: "Todo mês, no início da competência", billing: "Antecipado", status: "Implementado", where: "Contratos e Faturas" },
    { id: "wl-vol", group: "Fornecedor", name: "Taxa de volume (White Label)", payer: "Fornecedor", receiver: "NextLevel", pricing: `${pctText(b.whiteLabel.volumeFeeBps)} do custo pago à Central, mínimo de ${brl(b.whiteLabel.minMonthlyFeeCents)} por mês`, when: "Fechamento do mês", billing: "Fechamento mensal", status: "Implementado", where: "Faturas" },
    { id: "sup-order", group: "Fornecedor", name: "Taxa por pedido expedido", payer: "Fornecedor", receiver: "NextLevel", pricing: b.whiteLabel.perOrderFeeCents > 0 ? `${brl(b.whiteLabel.perOrderFeeCents)} por pedido` : "Desligada por padrão. Ative por contrato para fornecedores grandes", when: "Fechamento do mês", billing: "Fechamento mensal", status: "Implementado", where: "Contratos" },
    { id: "store-setup", group: "Lojista", name: "Setup da loja", payer: "Lojista", receiver: "NextLevel", pricing: `${o.DROP_MANUAL.name} ${brl(o.DROP_MANUAL.setupCents)}, ${o.STORE_SUBDOMAIN.name} ${brl(o.STORE_SUBDOMAIN.setupCents)}, ${o.STORE_OWN.name} ${brl(o.STORE_OWN.setupCents)}`, when: "Na criação da loja, junto com a primeira mensalidade", billing: "Antecipado", status: "Implementado", where: "Nova loja, Faturas", note: "A loja só é liberada depois do pagamento. O lojista paga diretamente à NextLevel." },
    { id: "store-sub", group: "Lojista", name: "Mensalidade do lojista", payer: "Lojista", receiver: "NextLevel", pricing: `${o.DROP_MANUAL.name} ${brl(o.DROP_MANUAL.monthlyCents)}, ${o.STORE_SUBDOMAIN.name} ${brl(o.STORE_SUBDOMAIN.monthlyCents)}, ${o.STORE_OWN.name} ${brl(o.STORE_OWN.monthlyCents)} por mês`, when: "Todo mês", billing: "Recorrente", status: "Parcial", where: "Planos, Financeiro do lojista", note: "Primeira mensalidade cobrada no setup. Cobrança recorrente automática é a próxima etapa." },
    { id: "chan-commission", group: "Canal", name: "Comissão do fornecedor sobre o setup de loja nova", payer: "NextLevel (custo)", receiver: "Fornecedor", pricing: `${pctText(b.channel.setupCommissionBps)} do setup, liberada após ${b.channel.guaranteeDays} dias de garantia`, when: "Abatida da fatura de fechamento do mês seguinte à garantia", billing: "Fechamento mensal", status: "Implementado", where: "Faturas, Financeiro do fornecedor", note: "Vale só para lojas trazidas pelo fornecedor. Estorno do setup cancela ou debita a comissão." },
    { id: "tpl", group: "Extras", name: "Templates Premium", payer: "Lojista", receiver: "NextLevel", pricing: `Pro ${brl(b.templates.PRO.oneTimeCents)} avulso ou ${brl(b.templates.PRO.monthlyCents)} por mês. Elite ${brl(b.templates.ELITE.oneTimeCents)} avulso ou ${brl(b.templates.ELITE.monthlyCents)} por mês`, when: "Na compra ou todo mês", billing: "Na compra", status: "Planejado", where: "Templates do lojista", note: "Falta o checkout na conta Mercado Pago da NextLevel." },
    { id: "svc", group: "Extras", name: "Serviços NextLevel", payer: "Lojista", receiver: "NextLevel", pricing: `Tabela do marketplace de serviços, margem alvo de ${pctText(b.services.targetMarginBps)}`, when: "Sob contratação", billing: "Sob demanda", status: "Parcial", where: "Serviços NextLevel", note: "Hoje gera lead. Prefira serviços recorrentes, como tráfego e automação." },
    { id: "domain", group: "Extras", name: "Domínio próprio adicional", payer: "Lojista", receiver: "NextLevel", pricing: "Valor a definir por domínio", when: "Na contratação", billing: "Sob demanda", status: "Planejado", where: "Configurações da loja" },
    { id: "overage", group: "Extras", name: "Excedente de limites", payer: "Fornecedor", receiver: "NextLevel", pricing: "Cobrança por SKUs e pedidos acima da faixa contratada", when: "Fechamento do mês", billing: "Fechamento mensal", status: "Planejado", where: "Contratos" },
    { id: "shipping", group: "Extras", name: "Comissão de frete", payer: "Transportadoras", receiver: "NextLevel", pricing: "Desconto ou comissão negociada com Melhor Envio e SuperFrete", when: "Por etiqueta", billing: "Sob demanda", status: "Futuro", where: "Etiquetas" },
    { id: "gateway", group: "Extras", name: "Taxa sobre venda online do lojista", payer: "Lojista", receiver: "NextLevel", pricing: "Cerca de 1% via conta conectada do Mercado Pago", when: "Por venda", billing: "Na compra", status: "Futuro", where: "Checkout da loja" },
    { id: "ads", group: "Extras", name: "Destaque patrocinado no Brás Digital", payer: "Fornecedor", receiver: "NextLevel", pricing: "A definir", when: "Por campanha", billing: "Sob demanda", status: "Futuro", where: "Marketplace atacadista" },
  ];
}

export type MoneyFlow = { from: string; to: string; what: string; status: "Automático" | "Manual" | "Planejado"; note?: string };

/** Fluxo do dinheiro entre as partes. A NextLevel nunca guarda saldo de terceiros. */
export const MONEY_FLOWS: MoneyFlow[] = [
  { from: "Consumidor final", to: "Lojista", what: "Venda na loja virtual pelo Mercado Pago da loja", status: "Automático" },
  { from: "Lojista", to: "Fornecedor", what: "Custo dos produtos (recarga) na conta Mercado Pago do fornecedor", status: "Manual", note: "Hoje o lojista confirma o pagamento à Central. A recarga automática é a próxima etapa." },
  { from: "Lojista", to: "NextLevel", what: "Setup e mensalidade da loja, antes da liberação", status: "Manual", note: "Recebimento confirmado pelo Master. Checkout na conta da NextLevel vem depois." },
  { from: "Fornecedor", to: "NextLevel", what: "Setup e mensalidade antecipados. Taxa de volume no fechamento mensal, líquida de comissões", status: "Manual" },
  { from: "NextLevel", to: "Fornecedor", what: "Comissão de 25% do setup de cada loja nova, abatida da fatura de fechamento", status: "Automático" },
];
