"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marcarEstrelaAction, mudarSituacaoNaLinhaAction } from "@/app/actions/orders";
import type { OrderStatus } from "@/db/schema";

/** Estrela do pedido (W1, D184): marca para achar depois, sem abrir o pedido. */
export function EstrelaPedido({ orderId, number, ativa }: { orderId: string; number: number; ativa: boolean }) {
  const router = useRouter();
  const [on, setOn] = React.useState(ativa);
  const [pending, start] = React.useTransition();
  return (
    <button type="button" disabled={pending} aria-pressed={on} aria-label={on ? `Tirar a estrela do pedido ${number}` : `Marcar o pedido ${number} com estrela`}
      className="relative z-10 -m-1 inline-flex size-8 items-center justify-center rounded-full hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-1"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); const v = !on; setOn(v); start(async () => { const r = await marcarEstrelaAction(orderId, v); if (!r.ok) { setOn(!v); toast.error(r.error); } else router.refresh(); }); }}>
      <Star className={`size-4 ${on ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} aria-hidden />
    </button>
  );
}

/** Próximo passo na própria linha (só loja independente; o envio pede o rastreio e fica na janela do pedido). */
export function ProximoPasso({ orderId, number, para, rotulo }: { orderId: string; number: number; para: OrderStatus; rotulo: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button size="sm" variant="secondary" className="relative z-10" loading={pending} aria-label={`${rotulo} no pedido ${number}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); start(async () => { const r = await mudarSituacaoNaLinhaAction(orderId, para); if (r.ok) { toast.success(`Pedido #${number}: feito`); router.refresh(); } else toast.error(r.error); }); }}>
      {rotulo}
    </Button>
  );
}
