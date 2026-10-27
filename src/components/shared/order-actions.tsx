"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, ArrowRight } from "lucide-react";
import type { Order } from "@/db/schema";
import type { Role } from "@/lib/domain/access";
import { CANCELABLE, NEXT_ACTION, ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LabelUploader } from "./label-uploader";
import { EnvioDialog } from "./envio-dialog";
import { formatBRL } from "@/lib/money";
import { advanceOrderAction, cancelOrderAction, confirmCustomerPaymentAction, syncOrderPaymentAction } from "@/app/actions/orders";
import type { ActionResult } from "@/lib/action-result";

export function OrderActions({ role, order, canFulfil = false, independent = false }: { role: Role; order: Order; labels?: { id: string; filename: string }[]; canFulfil?: boolean; independent?: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const handle = (fn: () => Promise<ActionResult<unknown>>, success: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(r.error);
    });

  if (order.status === "CANCELED" || order.status === "DELIVERED") return null;

  const isMerchant = role === "STORE_OWNER";
  const isSupplier = role === "SUPPLIER_ADMIN" || role === "SUPPLIER_DISPATCH";
  // Loja independente (D180): pedido antigo parado em "aguardando etiqueta" pode ser liberado para separação; o envio
  // pede forma e rastreio. No SuperDrop nada muda.
  const next = independent && order.status === "AWAITING_LABEL" ? { label: "Liberar para separação", next: "READY_TO_PICK" as const } : NEXT_ACTION[order.status];
  const envioComRastreio = independent && isMerchant && canFulfil && order.status === "READY_TO_SHIP";
  const pago = order.customerPaymentStatus === "PAID";
  const avisoCancelar = !independent || !pago ? "O estoque reservado será liberado para outras vendas. Esta ação não pode ser desfeita."
    : order.paymentProvider === "MERCADO_PAGO" ? `O valor de ${formatBRL(order.totalCents)} volta para o cliente pelo Mercado Pago (no Pix, para a conta dele; no cartão, como estorno na fatura). O estoque volta para a loja e o cliente recebe um e-mail. Esta ação não pode ser desfeita.`
    : order.paymentProvider === "DEMO" ? "Pedido de demonstração: a devolução é simulada. O estoque volta para a loja e o cliente recebe um e-mail."
    : `Este pagamento foi confirmado à mão: devolva ${formatBRL(order.totalCents)} ao cliente pelo mesmo meio. O estoque volta para a loja e o cliente recebe um e-mail.`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isMerchant && order.customerPaymentStatus !== "PAID" && order.paymentProvider === "MANUAL" ? (
        <Button variant="secondary" loading={pending} onClick={() => handle(() => confirmCustomerPaymentAction(order.id), "Pagamento do cliente confirmado")}>
          <CheckCircle2 /> Confirmar pagamento do cliente
        </Button>
      ) : null}
      {isMerchant && order.customerPaymentStatus !== "PAID" && order.paymentProvider === "MERCADO_PAGO" ? (
        <Button variant="secondary" loading={pending} onClick={() => handle(async () => { const r = await syncOrderPaymentAction(order.id); if (r.ok && !r.data.paid) toast.info("O Mercado Pago ainda não confirmou este pagamento."); return r; }, "Consulta ao Mercado Pago concluída")}>
          <CheckCircle2 /> Verificar pagamento
        </Button>
      ) : null}
      {isMerchant && !independent && order.customerPaymentStatus === "PAID" && order.centralPaymentStatus !== "PAID" ? (
        <a href="/merchant/wallet" className="inline-flex h-9 items-center gap-2 rounded-md bg-warning-soft px-3 text-sm font-medium text-warning">Aguardando recarga · recarregar saldo</a>
      ) : null}
      {isMerchant && !independent && order.status !== "SHIPPED" ? <LabelUploader orderId={order.id} hasLabel={order.shippingLabelStatus === "READY"} primary={order.centralPaymentStatus === "PAID"} /> : null}
      {envioComRastreio ? <EnvioDialog orderId={order.id} transportadoraDoPedido={order.shippingCarrier} /> : null}
      {(isSupplier || (isMerchant && canFulfil)) && next && !envioComRastreio ? (
        <Button loading={pending} onClick={() => handle(() => advanceOrderAction(order.id, next.next), ORDER_STATUS_LABEL[next.next])}>
          {next.label} <ArrowRight />
        </Button>
      ) : null}
      {(isMerchant || role === "SUPPLIER_ADMIN") && CANCELABLE.includes(order.status) ? (
        <ConfirmDialog
          trigger={<Button variant="ghost" className="text-danger hover:bg-danger-soft"><Ban /> Cancelar</Button>}
          title="Cancelar pedido"
          description={avisoCancelar}
          confirmLabel={independent && pago && order.paymentProvider === "MERCADO_PAGO" ? "Cancelar e devolver" : "Cancelar pedido"}
          destructive
          onConfirm={async () => {
            const r = await cancelOrderAction(order.id);
            if (r.ok) { toast.success(independent && pago && order.paymentProvider === "MERCADO_PAGO" ? "Pedido cancelado e valor devolvido ao cliente" : "Pedido cancelado"); router.refresh(); } else toast.error(r.error);
          }}
        />
      ) : null}
    </div>
  );
}
