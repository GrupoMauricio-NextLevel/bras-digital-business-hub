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
import { Input } from "@/components/ui/input";
import { advanceOrderAction, cancelOrderAction, confirmCustomerPaymentAction } from "@/app/actions/orders";
import type { ActionResult } from "@/lib/action-result";

export function OrderActions({ role, order }: { role: Role; order: Order; labels?: { id: string; filename: string }[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [labelOpen, setLabelOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);

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
      {isMerchant && order.status !== "SHIPPED" ? (
        <>
          <Button variant={order.shippingLabelStatus === "READY" ? "secondary" : order.centralPaymentStatus === "PAID" ? "primary" : "secondary"} onClick={() => setLabelOpen(true)}>
            <Tag /> {order.shippingLabelStatus === "READY" ? "Anexar outra etiqueta" : "Anexar etiqueta (PDF)"}
          </Button>
          <Dialog open={labelOpen} onOpenChange={setLabelOpen}>
            <DialogContent title="Anexar etiqueta de envio" description="Envie o PDF gerado no SuperFrete (máx. 3 MB, até 5 arquivos por pedido). A Central imprime a etiqueta na expedição.">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!file) return;
                  setUploading(true);
                  const fd = new FormData(); fd.append("file", file);
                  const res = await fetch(`/api/labels/${order.id}`, { method: "POST", body: fd });
                  const body = (await res.json().catch(() => ({ ok: false, error: "Falha ao enviar." }))) as { ok: boolean; error?: string };
                  setUploading(false);
                  if (body.ok) { toast.success("Etiqueta anexada"); setLabelOpen(false); setFile(null); router.refresh(); } else toast.error(body.error ?? "Falha ao enviar.");
                }}
              >
                <FormField label="Arquivo da etiqueta (PDF)" htmlFor="labelfile" hint="Exemplo: etiqueta-superfrete.pdf">
                  <Input id="labelfile" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
                </FormField>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setLabelOpen(false)}>Cancelar</Button>
                  <Button type="submit" loading={uploading} disabled={!file}>Enviar etiqueta</Button>
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
      {(isMerchant || role === "SUPPLIER_ADMIN") && CANCELABLE.includes(order.status) ? (
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
