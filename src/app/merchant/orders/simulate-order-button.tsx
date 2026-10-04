"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateCustomerOrderAction } from "@/app/actions/demo";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import type { OrderStatus } from "@/db/schema";

/** Só na demonstração: simula uma venda de cliente final para mostrar o fluxo ao vivo. */
export function SimulateOrderButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button variant="ghost" loading={busy} onClick={async () => { setBusy(true); const r = await simulateCustomerOrderAction(); setBusy(false); if (r.ok) { toast.success(`Venda simulada #${r.data.number} de ${r.data.customer}: ${ORDER_STATUS_LABEL[r.data.status as OrderStatus]}`); router.refresh(); } else toast.error(r.error); }}>
      <Sparkles /> Simular venda (demo)
    </Button>
  );
}
