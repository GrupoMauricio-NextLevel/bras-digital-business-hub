"use client";

import * as React from "react";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enterSupportAction, enterStoreOwnerSupportAction } from "@/app/actions/support";

const MOTIVOS = ["Dúvida do cliente", "Conferir pedido", "Configuração da loja", "Investigar erro", "Treinamento"];

/** Abre o painel de um cliente em modo suporte (somente leitura), pedindo o motivo que fica registrado. */
export function SupportEnterButton({ userId, storeId, name, back, label = "Ver como cliente", compact = false }: { userId?: string; storeId?: string; name: string; back?: string; label?: string; compact?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, start] = React.useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = userId ? await enterSupportAction({ targetUserId: userId, reason, back }) : await enterStoreOwnerSupportAction({ storeId: storeId!, reason, back });
      if (!r.ok) { toast.error(r.error); return; }
      window.location.assign(r.data.redirectTo);
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm" aria-label={compact ? `${label}: ${name}` : undefined}><LifeBuoy aria-hidden />{compact ? null : label}</Button>
      </DialogTrigger>
      <DialogContent title={`Ver como ${name}`} description="Você verá o painel exatamente como o cliente vê, em somente leitura, por até 1 hora. O motivo fica registrado e o cliente pode ver o histórico.">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="sup-reason" className="text-sm font-semibold">Motivo do acesso</label>
            <Input id="sup-reason" required minLength={5} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente pediu ajuda com o pedido 1042" autoFocus />
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS.map((m) => <button key={m} type="button" onClick={() => setReason(m)} className="ds-chip">{m}</button>)}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={pending} disabled={reason.trim().length < 5}>Entrar em modo suporte</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
