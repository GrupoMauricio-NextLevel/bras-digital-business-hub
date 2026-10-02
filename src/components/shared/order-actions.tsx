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
import { advanceOrderAction, cancelOrderAction, confirmCustomerPaymentAction } from "@/app/actions/orders";
import type { ActionResult } from "@/lib/action-result";

export function OrderActions({ role, order }: { role: Role; order: Order; labels?: { id: string; filename: string }[] }) {
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
  const next = NEXT_ACTION[order.status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isMerchant && order.customerPaymentStatus !== "PAID" ? (
        <Button variant="secondary" loading={pending} onClick={() => handle(() => confirmCustomerPaymentAction(order.id), "Pagamento do cliente confirmado")}>
          <CheckCircle2 /> Confirmar pagamento do cliente
        </Button>
      ) : null}
      {isMerchant && order.customerPaymentStatus === "PAID" && order.centralPaymentStatus !== "PAID" ? (
        <a href="/merchant/wallet" className="inline-flex h-9 items-center gap-2 rounded-md bg-warning-soft px-3 text-sm font-medium text-warning">Aguardando recarga · recarregar saldo</a>
      ) : null}
      {isMerchant && order.customerPaymentStatus === "PAID" && order.status !== "SHIPPED" ? <LabelUploader orderId={order.id} hasLabel={order.shippingLabelStatus === "READY"} primary={order.centralPaymentStatus === "PAID"} /> : null}
      {isSupplier && next ? (
        <Button loading={pending} onClick={() => handle(() => advanceOrderAction(order.id, next.next), ORDER_STATUS_LABEL[next.next])}>
          {next.label} <ArrowRight />
        </Button>
      ) : null}
      {(isMerchant || role === "SUPPLIER_ADMIN") && order.customerPaymentStatus !== "PAID" && CANCELABLE.includes(order.status) ? (
        <ConfirmDialog
          trigger={<Button variant="ghost" className="text-danger hover:bg-danger-soft"><Ban /> Cancelar</Button>}
          title="Cancelar pedido"
          description="O estoque reservado será liberado para outras vendas. Esta ação não pode ser desfeita."
          confirmLabel="Cancelar pedido"
          destructive
          onConfirm={async () => {
            const r = await cancelOrderAction(order.id);
            if (r.ok) { toast.success("Pedido cancelado"); router.refresh(); } else toast.error(r.error);
          }}
        />
      ) : null}
    </div>
  );
}
