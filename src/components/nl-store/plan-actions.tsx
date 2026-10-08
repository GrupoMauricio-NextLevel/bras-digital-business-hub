"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { cancelSubscriptionAction, choosePlanAction, requestQuoteAction, acceptDeliveryAction } from "@/app/actions/financeiro";

/** Assinar ou trocar o plano Commerce: mensal ou anual. O pagamento é a fatura da loja (Financeiro). */
export function ChoosePlan({ productKey, label = "Assinar este plano", current }: { productKey: "COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE"; label?: string; current?: { productKey: string; cycle: string } | null }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const go = async (cycle: "MONTHLY" | "ANNUAL") => {
    setBusy(cycle);
    const r = await choosePlanAction(productKey, cycle);
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    toast.success(r.data.trial ? "Plano escolhido. Seu teste está ativo." : "Plano escolhido. Pague a fatura em Financeiro para liberar.");
    router.push("/merchant/finance#evolucao");
  };
  const isCurrent = (c: string) => current?.productKey === productKey && current.cycle === c;
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" loading={busy === "MONTHLY"} disabled={isCurrent("MONTHLY")} onClick={() => go("MONTHLY")}>{isCurrent("MONTHLY") ? "Plano atual (mensal)" : `${label} · mensal`}</Button>
      <Button size="sm" variant="secondary" loading={busy === "ANNUAL"} disabled={isCurrent("ANNUAL")} onClick={() => go("ANNUAL")}>{isCurrent("ANNUAL") ? "Plano atual (anual)" : "Anual com 25%"}</Button>
    </div>
  );
}

export function CancelSubscription() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false); const [reason, setReason] = React.useState(""); const [busy, setBusy] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Cancelar assinatura</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Cancelar assinatura" description="O acesso continua até o fim do período já pago. Nada mais é cobrado depois.">
          <FormField label="Quer contar o motivo? (opcional)" htmlFor="cx-reason"><Textarea id="cx-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
          <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Voltar</Button><Button variant="danger" loading={busy} onClick={async () => { setBusy(true); const r = await cancelSubscriptionAction(reason); setBusy(false); if (r.ok) { toast.success("Cancelamento registrado."); setOpen(false); router.refresh(); } else toast.error(r.error); }}>Confirmar cancelamento</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Pedido de proposta (produto sob consulta). Nunca gera cobrança. */
export function RequestQuote({ productKey, productName, needsContact = false, label = "Solicitar proposta" }: { productKey: string; productName: string; needsContact?: boolean; label?: string }) {
  const [open, setOpen] = React.useState(false); const [busy, setBusy] = React.useState(false); const [done, setDone] = React.useState(false);
  const [f, setF] = React.useState({ briefing: "", name: "", email: "", phone: "" });
  const send = async () => {
    setBusy(true);
    const r = await requestQuoteAction({ productKey, briefing: f.briefing, contact: needsContact ? { name: f.name, email: f.email, phone: f.phone || undefined } : undefined });
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setDone(true);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDone(false); }}>
        <DialogContent title={done ? "Pedido recebido" : `Proposta: ${productName}`} description={done ? "A equipe NextLevel responde com escopo, prazo e valores. Nenhuma cobrança foi criada." : "Conte o contexto. A proposta chega com escopo, prazo e valores claros."}>
          {done ? <div className="flex justify-end"><Button onClick={() => setOpen(false)}>Fechar</Button></div> : (
            <div className="space-y-3">
              {needsContact ? <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Nome" htmlFor={`q-n-${productKey}`}><Input id={`q-n-${productKey}`} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
                <FormField label="E-mail" htmlFor={`q-e-${productKey}`}><Input id={`q-e-${productKey}`} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></FormField>
                <FormField label="WhatsApp" htmlFor={`q-p-${productKey}`}><Input id={`q-p-${productKey}`} type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></FormField>
              </div> : null}
              <FormField label="O que você precisa?" htmlFor={`q-b-${productKey}`} hint="Mínimo de 10 caracteres."><Textarea id={`q-b-${productKey}`} rows={4} value={f.briefing} onChange={(e) => setF({ ...f, briefing: e.target.value })} /></FormField>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={busy} disabled={f.briefing.trim().length < 10 || (needsContact && (!f.name || !f.email))} onClick={send}>Enviar pedido</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AcceptDelivery({ id }: { id: string }) {
  const router = useRouter(); const [busy, setBusy] = React.useState(false);
  return <Button size="sm" loading={busy} onClick={async () => { setBusy(true); const r = await acceptDeliveryAction(id); setBusy(false); if (r.ok) { toast.success("Aceite registrado. Obrigado!"); router.refresh(); } else toast.error(r.error); }}>Dar aceite da entrega</Button>;
}
