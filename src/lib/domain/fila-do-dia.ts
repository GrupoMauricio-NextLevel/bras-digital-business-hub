import { formatBRL } from "@/lib/money";
import { attentionFor, stageOf } from "./after-sales";

/**
 * Fila do dia do lojista (D166): a primeira tela responde "o que eu preciso fazer agora?".
 * Pura: a página junta os dados e esta função decide o que entra, em que ordem e com que texto.
 * Loja da NextLevel E-commerce (sem fornecedor) nunca vê saldo, Central ou etiqueta da Central.
 */
export type FilaTom = "danger" | "warning" | "info";
export type FilaItem = { key: string; title: string; detail: string; count: number; href: string; action: string; tone: FilaTom };

type PedidoFila = { status: string; customerPaymentStatus: string; createdAt: string; costTotalCents: number };

export type EntradaFila = {
  commerce: boolean;
  independent: boolean;
  published: boolean;
  readinessMissing: { label: string; detail: string; fixHref: string }[] | null;
  onboarding: { percent: number; missing: number };
  pendingCustomer: PedidoFila[];
  pendingCentral: PedidoFila[];
  pendingLabel: PedidoFila[];
  inProgress: PedidoFila[];
  inTransit: PedidoFila[];
  balanceCents: number;
  /** Tamanhos que voltaram ao estoque com clientes esperando aviso. */
  stockBack: number;
  now: Date;
};

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

/** Pedidos parados além do ritmo normal (mesma régua do pós-venda). */
export function pedidosParados(e: Pick<EntradaFila, "pendingCustomer" | "pendingCentral" | "pendingLabel" | "inProgress" | "inTransit" | "independent" | "now">): number {
  const seen = new Set<PedidoFila>();
  let n = 0;
  for (const o of [...e.pendingCustomer, ...e.pendingCentral, ...e.pendingLabel, ...e.inProgress, ...e.inTransit]) {
    if (seen.has(o)) continue;
    seen.add(o);
    const stage = stageOf(o);
    if (!stage) continue;
    if (stage === "AWAITING_FUNDS") continue; // já tem item próprio (saldo)
    const age = Math.max(0, Math.floor((e.now.getTime() - new Date(o.createdAt).getTime()) / 3_600_000));
    if (attentionFor(stage, age, e.independent)) n++;
  }
  return n;
}

export function filaDoLojista(e: EntradaFila): FilaItem[] {
  const parados = pedidosParados(e);
  const lateItem: FilaItem | null = parados ? { key: "late", title: plural(parados, "Pedido parado além do normal", "Pedidos parados além do normal"), detail: "Fale com o cliente ou confira o andamento no pós-venda.", count: parados, href: "/merchant/after-sales", action: "Ver no pós-venda", tone: "danger" } : null;
  const stockItem: FilaItem | null = e.stockBack ? { key: "stock", title: plural(e.stockBack, "Tamanho voltou ao estoque", "Tamanhos voltaram ao estoque"), detail: "Há clientes esperando o aviso. Avise e transforme a espera em venda.", count: e.stockBack, href: "/merchant/avise-me", action: "Avisar clientes", tone: "info" } : null;

  if (e.commerce) {
    const first = e.readinessMissing?.[0];
    return [
      first ? { key: "readiness", title: "Sua loja ainda não está pronta para vender", detail: `Falta: ${first.label.toLowerCase()}. ${first.detail}`, count: e.readinessMissing!.length, href: first.fixHref, action: "Resolver", tone: "warning" as const } : null,
      !e.published ? { key: "publish", title: "Sua loja ainda não está publicada", detail: "Revise a vitrine e publique quando estiver pronta para receber clientes.", count: 1, href: "/merchant/storefront", action: "Revisar loja", tone: "warning" as const } : null,
      e.onboarding.percent < 100 ? { key: "onboarding", title: "Configuração da loja incompleta", detail: `Seu checklist está em ${e.onboarding.percent}%. Complete os itens para deixar a operação pronta.`, count: e.onboarding.missing, href: "/merchant/storefront", action: "Continuar", tone: "info" as const } : null,
      lateItem,
      e.pendingCustomer.length ? { key: "customer", title: "Vendas aguardando pagamento", detail: "Pedidos iniciados por clientes que ainda não tiveram o pagamento confirmado.", count: e.pendingCustomer.length, href: "/merchant/orders?status=PENDING", action: "Ver vendas", tone: "info" as const } : null,
      e.inProgress.length ? { key: "progress", title: "Pedidos em preparação", detail: "Separe, embale e envie. Cada pedido mostra o próximo passo.", count: e.inProgress.length, href: "/merchant/orders", action: "Acompanhar", tone: "info" as const } : null,
      stockItem,
    ].filter((x): x is FilaItem => Boolean(x));
  }

  const waitingCents = e.pendingCentral.reduce((s, o) => s + o.costTotalCents, 0);
  const needsTopUp = waitingCents > e.balanceCents;
  return [
    e.pendingCentral.length ? { key: "funds", title: needsTopUp ? "Saldo insuficiente para liberar pedidos" : "Pedidos aguardando liberação", detail: needsTopUp ? `Faltam ${formatBRL(waitingCents - e.balanceCents)} para a operação seguir.` : "Seu saldo cobre os pedidos em espera.", count: e.pendingCentral.length, href: "/merchant/wallet", action: needsTopUp ? "Recarregar" : "Ver saldo", tone: needsTopUp ? "danger" as const : "warning" as const } : null,
    e.pendingLabel.length ? { key: "labels", title: "Etiquetas pendentes", detail: "A Central só inicia a separação depois do PDF da etiqueta.", count: e.pendingLabel.length, href: "/merchant/labels", action: "Enviar", tone: "warning" as const } : null,
    lateItem,
    e.pendingCustomer.length ? { key: "customer", title: "Clientes não concluíram o pagamento", detail: "Pedidos iniciados que ainda não avançaram para a operação.", count: e.pendingCustomer.length, href: "/merchant/orders?status=PENDING", action: "Ver pedidos", tone: "info" as const } : null,
    stockItem,
  ].filter((x): x is FilaItem => Boolean(x));
}
