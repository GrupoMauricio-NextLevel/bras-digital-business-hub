"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmAvailabilityAction, importerPickupAction, markSeparatedAction } from "@/app/actions/importadora";

/** Botões grandes do balcão: conferir caixas, marcar separado e entregar com o código do motorista. */
export function PedidoAcoes({ id, status, available, separated, can }: { id: string; status: string; available: boolean; separated: boolean; can: { disponibilidade: boolean; balcao: boolean } }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [code, setCode] = React.useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); setCode(""); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      {can.disponibilidade && (status === "NEW" || status === "CONFIRMED") && !available ? <Button size="lg" disabled={pending} onClick={() => run(() => confirmAvailabilityAction(id), "Caixas conferidas: a equipe da Brás vê na hora")}><CheckCircle2 className="size-5" aria-hidden />Tenho as caixas</Button> : null}
      {can.balcao && (status === "CONFIRMED" || status === "PAID") && !separated ? <Button size="lg" variant="secondary" disabled={pending} onClick={() => run(() => markSeparatedAction(id), "Marcado como separado")}><PackageCheck className="size-5" aria-hidden />Separei as caixas</Button> : null}
      {can.balcao && status === "PAID" ? (
        <form className="flex w-full flex-wrap items-end gap-2 sm:w-auto" onSubmit={(e) => { e.preventDefault(); run(() => importerPickupAction(id, code), "Entregue à transportadora. O comprador é avisado."); }}>
          <label className="flex flex-col text-sm font-semibold">Código do motorista<Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BD-XXXX" autoComplete="off" className="mt-1 w-40 font-mono uppercase" /></label>
          <Button type="submit" size="lg" disabled={pending}><Truck className="size-5" aria-hidden />Entregar</Button>
        </form>
      ) : null}
    </div>
  );
}
