import { attentionFor, stageOf, type AfterSalesStage } from "./after-sales";
import { linkWhatsapp } from "./agora-ecommerce";

/**
 * Pedidos que precisam do lojista agora (D208): a mesma régua do pós-venda, em ordem de urgência, cada um com a
 * mensagem pronta de WhatsApp para o cliente. Pura: a página passa os pedidos e o relógio.
 */
export type PedidoAgora = {
  id: string; numero: number; cliente: string; totalCents: number; horas: number; motivo: string;
  tom: "danger" | "warning" | "info"; etapa: AfterSalesStage; mensagem: string; whatsappHref: string | null; acao: string;
};

type Pedido = { id: string; number: number; status: string; customerPaymentStatus: string; customerName: string; customerPhone: string | null; totalCents: number; createdAt: string };

const TOM: Partial<Record<AfterSalesStage, PedidoAgora["tom"]>> = { IN_DISPATCH: "danger", AWAITING_LABEL: "danger", AWAITING_CUSTOMER: "warning", IN_TRANSIT: "info" };
const ACAO: Partial<Record<AfterSalesStage, string>> = { IN_DISPATCH: "Separar e enviar", AWAITING_LABEL: "Gerar etiqueta", AWAITING_CUSTOMER: "Lembrar do pagamento", IN_TRANSIT: "Confirmar entrega" };
const ORDEM: AfterSalesStage[] = ["IN_DISPATCH", "AWAITING_LABEL", "AWAITING_CUSTOMER", "IN_TRANSIT"];

export function mensagemDoPedido(etapa: AfterSalesStage, nome: string, numero: number, loja: string): string {
  const n = nome.split(" ")[0] || nome;
  if (etapa === "AWAITING_CUSTOMER") return `Oi ${n}! Aqui é da ${loja}. Vi que o pedido #${numero} ainda está aguardando o pagamento. Quer que eu te mande o link de novo ou ajude com alguma dúvida?`;
  if (etapa === "IN_TRANSIT") return `Oi ${n}! Aqui é da ${loja}. O seu pedido #${numero} já chegou? Se precisar de algo, é só me chamar.`;
  return `Oi ${n}! Aqui é da ${loja}. Estamos preparando o seu pedido #${numero} e logo te enviamos o código de rastreio. Obrigado pela paciência!`;
}

export function pedidosQuePrecisamDeVoce(pedidos: Pedido[], agora: Date, loja: string, independente = true): PedidoAgora[] {
  const lista: PedidoAgora[] = [];
  for (const o of pedidos) {
    const etapa = stageOf(o);
    if (!etapa || etapa === "AWAITING_FUNDS" || etapa === "DELIVERED") continue;
    const horas = Math.max(0, Math.floor((agora.getTime() - new Date(o.createdAt).getTime()) / 3_600_000));
    const motivo = attentionFor(etapa, horas, independente);
    if (!motivo) continue;
    const mensagem = mensagemDoPedido(etapa, o.customerName, o.number, loja);
    lista.push({
      id: o.id, mensagem, numero: o.number, cliente: o.customerName, totalCents: o.totalCents, horas, motivo, etapa,
      tom: TOM[etapa] ?? "info", acao: ACAO[etapa] ?? "Abrir", whatsappHref: linkWhatsapp(o.customerPhone, mensagem),
    });
  }
  return lista.sort((a, b) => ORDEM.indexOf(a.etapa) - ORDEM.indexOf(b.etapa) || b.horas - a.horas);
}
