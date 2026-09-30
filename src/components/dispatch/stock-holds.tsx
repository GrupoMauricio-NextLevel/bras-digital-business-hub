"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { remindStoreAction } from "@/app/actions/dispatch";
import type { StockHold } from "@/lib/domain/operations";
import { cn } from "@/lib/utils";

/** Pedidos já pagos que esperam etiqueta ou saldo e por isso seguram peças que poderiam ser vendidas em outro canal. */
export function StockHolds({ holds }: { holds: StockHold[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  if (holds.length === 0) return null;
  const pieces = holds.reduce((s, h) => s + h.pieces, 0);
  const remind = (ids: string[]) => start(async () => { const r = await remindStoreAction(ids); if (r.ok) { toast.success(r.data.sent ? `${r.data.sent} lojista(s) avisado(s)` : "Já avisamos há pouco"); router.refresh(); } else toast.error(r.error); });
  return (
    <Card className="mb-5 border-warning/40">
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold"><PackageX className="size-4 text-warning" aria-hidden /> {holds.length} {holds.length === 1 ? "pedido segura" : "pedidos seguram"} {pieces} peça(s) do estoque</h2>
          <Button size="sm" variant="secondary" loading={pending} onClick={() => remind(holds.map((h) => h.orderId))}><BellRing /> Cobrar todos</Button>
        </div>
        <p className="text-xs text-muted-foreground">O cliente já pagou, mas falta etiqueta ou saldo. Enquanto isso o estoque fica reservado e não pode ser vendido em outro canal. Cobre o lojista para o pedido sair hoje.</p>
        <ul className="divide-y divide-border text-sm">
          {holds.slice(0, 8).map((h) => (
            <li key={h.orderId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span><b>#{h.number}</b> · {h.storeName} · {h.reason === "LABEL" ? "aguardando etiqueta" : "aguardando recarga"} · {h.pieces} peça(s)</span>
              <span className="flex items-center gap-2"><span className={cn("text-xs tabular-nums", h.late ? "font-semibold text-danger" : "text-muted-foreground")}>{h.hours} h</span><Button size="sm" variant="ghost" disabled={pending} onClick={() => remind([h.orderId])}>Cobrar</Button></span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
