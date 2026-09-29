"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { MoneyInput } from "@/components/ui/money-input";
import { manualCreditAction } from "@/app/actions/wallet";

/** Crédito manual auditado (ex.: recarga recebida fora do Pix). Exige motivo e fica no extrato do lojista. */
export function CreditButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [cents, setCents] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Crédito manual</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`Crédito manual · ${storeName}`} description="Fica registrado no extrato com o seu nome e o motivo. Pedidos aguardando recarga são liberados na ordem.">
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await manualCreditAction({ storeId, amountCents: cents, note }); setBusy(false); if (r.ok) { toast.success(r.data.released ? `Crédito lançado e ${r.data.released} pedido(s) liberado(s)` : "Crédito lançado"); setOpen(false); setCents(0); setNote(""); router.refresh(); } else toast.error(r.error); }}>
            <MoneyInput label="Valor" valueCents={cents} onChange={setCents} id={`credit-${storeId}`} />
            <FormField label="Motivo" htmlFor={`note-${storeId}`}><Input id={`note-${storeId}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: Pix recebido fora da plataforma" required minLength={5} /></FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" loading={busy} disabled={cents <= 0}>Lançar crédito</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
