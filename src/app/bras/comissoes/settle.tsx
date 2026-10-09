"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settleBrasCommissionAction, undoBrasSettlementAction } from "@/app/actions/bras";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

/** Marcar o mês como recebido (com observação) ou desfazer (com motivo). */
export function SettleButton({ importerId, importerName, month, amountCents, settlement }: { importerId: string; importerName: string; month: string; amountCents: number; settlement: { id: string; amountCents: number; receivedAt: string; note: string | null } | null }) {
  const router = useRouter();
  const [txt, setTxt] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); setOpen(false); setTxt(""); router.refresh(); } else toast.error(r.error ?? "Não deu certo."); });
  if (settlement) return (
    <div className="text-right text-sm">
      <p className="inline-flex items-center gap-1 font-semibold text-success"><CheckCircle2 className="size-4" aria-hidden />Recebida em {formatDate(settlement.receivedAt)}: {formatBRL(settlement.amountCents)}</p>
      {settlement.amountCents !== amountCents ? <p className="text-xs text-warning">O cálculo de hoje é {formatBRL(amountCents)} (pedido mudou depois do fechamento).</p> : null}
      {settlement.note ? <p className="text-xs text-muted-foreground">{settlement.note}</p> : null}
      {open ? (
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => undoBrasSettlementAction(settlement.id, txt), "Fechamento desfeito"); }}>
          <Input aria-label="Motivo para desfazer" required placeholder="Motivo" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <Button size="sm" variant="secondary" type="submit" loading={pending}>Desfazer</Button>
        </form>
      ) : <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Desfazer</Button>}
    </div>
  );
  return open ? (
    <form className="flex w-full max-w-md gap-2 sm:w-auto" aria-label={`Marcar comissão de ${importerName} como recebida`} onSubmit={(e) => { e.preventDefault(); run(() => settleBrasCommissionAction({ importerId, month, note: txt }), "Comissão marcada como recebida"); }}>
      <Input aria-label="Observação (opcional)" placeholder="Observação (opcional): Pix de 05/11" value={txt} onChange={(e) => setTxt(e.target.value)} />
      <Button size="sm" type="submit" loading={pending}>Confirmar</Button>
    </form>
  ) : <Button size="sm" disabled={amountCents === 0} onClick={() => setOpen(true)}>Marcar como recebida</Button>;
}
