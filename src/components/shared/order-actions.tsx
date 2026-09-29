"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, Tag, ArrowRight } from "lucide-react";
import type { Order } from "@/db/schema";
import type { Role } from "@/lib/domain/access";
import { CANCELABLE, NEXT_ACTION, ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/app/form-field";
import { Input, Select } from "@/components/ui/input";
import { advanceOrderAction, cancelOrderAction, confirmCustomerPaymentAction, registerLabelAction } from "@/app/actions/orders";
import type { ActionResult } from "@/lib/action-result";

export function OrderActions({ role, order }: { role: Role; order: Order }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [labelOpen, setLabelOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [carrier, setCarrier] = React.useState("Melhor Envio");

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
  const isSupplier = role === "SUPPLIER_ADMIN";
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
      {isMerchant && order.shippingLabelStatus !== "READY" ? (
        <>
          <Button variant={order.centralPaymentStatus === "PAID" ? "primary" : "secondary"} onClick={() => setLabelOpen(true)}>
            <Tag /> Registrar etiqueta
          </Button>
          <Dialog open={labelOpen} onOpenChange={setLabelOpen}>
            <DialogContent title="Registrar etiqueta de envio" description="Informe o código da etiqueta gerada no SuperFrete ou Melhor Envio. A Central usará esta etiqueta na expedição.">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handle(() => registerLabelAction(order.id, { code, carrier }), "Etiqueta registrada");
                  setLabelOpen(false);
                }}
              >
                <FormField label="Transportadora / plataforma" htmlFor="carrier">
                  <Select id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                    <option>Melhor Envio</option>
                    <option>SuperFrete</option>
                    <option>Correios</option>
                    <option>Jadlog</option>
                  </Select>
                </FormField>
                <FormField label="Código da etiqueta" htmlFor="code" hint="Ex.: ME123456789BR">
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ME123456789BR" required minLength={4} autoFocus />
                </FormField>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setLabelOpen(false)}>Cancelar</Button>
                  <Button type="submit" loading={pending}>Salvar etiqueta</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
      {isSupplier && next ? (
        <Button loading={pending} onClick={() => handle(() => advanceOrderAction(order.id, next.next), ORDER_STATUS_LABEL[next.next])}>
          {next.label} <ArrowRight />
        </Button>
      ) : null}
      {(isMerchant || isSupplier) && CANCELABLE.includes(order.status) ? (
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
