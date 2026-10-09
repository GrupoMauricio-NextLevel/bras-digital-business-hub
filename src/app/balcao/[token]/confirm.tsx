"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmBalcaoPickupAction } from "@/app/actions/bras";

/** Confirmar a retirada com o código que o motorista apresenta (BD-XXXX). */
export function ConfirmPickup({ token, requestId, number }: { token: string; requestId: string; number: number }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [pending, start] = React.useTransition();
  const id = `cod-${requestId}`;
  return (
    <form className="mt-3 flex flex-wrap items-end gap-2" aria-label={`Confirmar retirada do pedido ${number}`} onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await confirmBalcaoPickupAction(token, requestId, code); if (r.ok) { toast.success(`Retirada do pedido ${number} confirmada`); router.refresh(); } else toast.error(r.error); }); }}>
      <div className="space-y-1"><label htmlFor={id} className="text-sm font-medium">Código do motorista</label><Input id={id} required autoComplete="off" autoCapitalize="characters" placeholder="BD-XXXX" value={code} onChange={(e) => setCode(e.target.value)} className="w-40 font-mono uppercase" /></div>
      <Button type="submit" loading={pending}>Confirmar retirada</Button>
    </form>
  );
}
