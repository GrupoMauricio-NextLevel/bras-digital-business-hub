"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { createLinkAction, createPartnerCouponAction, reactivateFromBalanceAction, reactivationInvoiceAction, requestPayoutAction, savePartnerProfileAction, togglePartnerCouponAction } from "@/app/actions/partners";

export function CopyButton({ text, label = "Copiar", size = "sm" }: { text: string; label?: string; size?: "sm" | "md" }) {
  return <Button type="button" size={size} variant="secondary" onClick={() => { void navigator.clipboard?.writeText(text); toast.success("Copiado"); }}><Copy /> {label}</Button>;
}

export function WhatsAppShare({ text }: { text: string }) {
  return <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-semibold text-white hover:opacity-90"><MessageCircle className="size-4" aria-hidden /> Enviar no WhatsApp</a>;
}

const PLANS = [["", "Todos os planos"], ["DROP_MANUAL", "Drop manual"], ["STORE_SUBDOMAIN", "Loja SuperDrop"], ["STORE_OWN", "Loja própria"]] as const;

export function CreateLinkForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <form className="grid gap-3 sm:grid-cols-4" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget;
      setBusy(true);
      const r = await createLinkAction({ label: String(f.get("label") ?? ""), campaign: String(f.get("campaign") ?? "") || undefined, planKey: (String(f.get("plan") ?? "") || undefined) as "DROP_MANUAL" | undefined });
      setBusy(false);
      if (r.ok) { toast.success("Link criado"); form.reset(); router.refresh(); } else toast.error(r.error);
    }}>
      <FormField label="Nome do link" htmlFor="lk-label"><Input id="lk-label" name="label" required minLength={2} placeholder="Ex.: Instagram bio" disabled={disabled} /></FormField>
      <FormField label="Campanha (opcional)" htmlFor="lk-camp"><Input id="lk-camp" name="campaign" placeholder="Ex.: black-friday" disabled={disabled} /></FormField>
      <FormField label="Plano em destaque" htmlFor="lk-plan"><Select id="lk-plan" name="plan" disabled={disabled}>{PLANS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></FormField>
      <div className="flex items-end"><Button type="submit" loading={busy} disabled={disabled}>Criar link</Button></div>
    </form>
  );
}

export function CreateCouponForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <form className="grid gap-3 sm:grid-cols-3" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget;
      const max = String(f.get("max") ?? "").trim();
      setBusy(true);
      const r = await createPartnerCouponAction({ code: String(f.get("code") ?? ""), maxRedemptions: max ? Number(max) : null });
      setBusy(false);
      if (r.ok) { toast.success(`Cupom ${r.data.code} criado`); form.reset(); router.refresh(); } else toast.error(r.error);
    }}>
      <FormField label="Código do cupom" htmlFor="cp-code" hint="3 a 24 letras ou números"><Input id="cp-code" name="code" required minLength={3} maxLength={24} placeholder="Ex.: JOAO7" disabled={disabled} /></FormField>
      <FormField label="Limite de usos (opcional)" htmlFor="cp-max"><Input id="cp-max" name="max" type="number" min={1} placeholder="Sem limite" disabled={disabled} /></FormField>
      <div className="flex items-end"><Button type="submit" loading={busy} disabled={disabled}>Criar cupom de 7 dias</Button></div>
    </form>
  );
}

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  return <Button size="sm" variant="ghost" onClick={async () => { const r = await togglePartnerCouponAction(id, !active); if (r.ok) router.refresh(); else toast.error(r.error); }}>{active ? "Pausar" : "Ativar"}</Button>;
}

export function PayoutPanel({ availableCents, availableLabel, minLabel, hasPix, disabled }: { availableCents: number; availableLabel: string; minLabel: string; hasPix: boolean; disabled: boolean }) {
  const router = useRouter();
  const [ok, setOk] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm">Saldo disponível: <b className="tabular-nums">{availableLabel}</b> · saque mínimo {minLabel} · 1 pedido por semana.</p>
      {!hasPix ? <p className="text-sm text-warning">Cadastre a sua chave Pix em <a className="font-semibold underline" href="/partner/profile">Meu perfil</a> para sacar.</p> : null}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={ok} onChange={(e) => setOk(e.target.checked)} /> Confirmo que a chave Pix é do mesmo CPF/CNPJ do meu cadastro.</label>
      <Button loading={busy} disabled={disabled || !hasPix || availableCents <= 0} onClick={async () => { setBusy(true); const r = await requestPayoutAction(ok); setBusy(false); if (r.ok) { toast.success("Saque solicitado. A NextLevel confere e paga por Pix."); router.refresh(); } else toast.error(r.error); }}>Solicitar saque de {availableLabel}</Button>
    </div>
  );
}

export function ReactivatePanel({ feeLabel, canPayFromBalance, demo }: { feeLabel: string; canPayFromBalance: boolean; demo: boolean }) {
  const router = useRouter();
  const [inv, setInv] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm">Para voltar a captar neste mês, pague a taxa de manutenção do cadastro de <b>{feeLabel}</b>. Você também volta a ser gratuito ao fazer 1 ativação. As mensalidades dos seus indicados continuam chegando normalmente.</p>
      <div className="flex flex-wrap gap-2">
        {inv ? <InvoicePay invoiceId={inv} label={`Pagar ${feeLabel} por Pix`} demo={demo} autoOpen large /> : <Button loading={busy} onClick={async () => { setBusy(true); const r = await reactivationInvoiceAction(); setBusy(false); if (r.ok) setInv(r.data.invoiceId); else toast.error(r.error); }}>Pagar {feeLabel} por Pix</Button>}
        {canPayFromBalance ? <Button variant="secondary" onClick={async () => { const r = await reactivateFromBalanceAction(); if (r.ok) { toast.success("Cadastro reativado"); router.refresh(); } else toast.error(r.error); }}>Abater do meu saldo</Button> : null}
      </div>
    </div>
  );
}

export function ProfileForm({ phone, displayName, hasPix }: { phone: string; displayName: string; hasPix: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <form className="grid max-w-xl gap-4" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      setBusy(true);
      const pix = String(f.get("pix") ?? "");
      const r = await savePartnerProfileAction({ displayName: String(f.get("name") ?? ""), phone: String(f.get("phone") ?? ""), ...(pix ? { pixKey: pix } : {}) });
      setBusy(false);
      if (r.ok) { toast.success("Perfil salvo"); router.refresh(); } else toast.error(r.error);
    }}>
      <FormField label="Nome" htmlFor="pf-name"><Input id="pf-name" name="name" defaultValue={displayName} required minLength={3} /></FormField>
      <FormField label="WhatsApp" htmlFor="pf-phone"><Input id="pf-phone" name="phone" defaultValue={phone} required inputMode="tel" /></FormField>
      <FormField label="Chave Pix para saque" htmlFor="pf-pix" hint={hasPix ? "Já cadastrada e protegida. Preencha só para trocar." : "Precisa ser do mesmo CPF/CNPJ do cadastro."}><Input id="pf-pix" name="pix" placeholder={hasPix ? "•••••••• (guardada)" : "CPF, e-mail, telefone ou chave aleatória"} autoComplete="off" /></FormField>
      <div><Button type="submit" loading={busy}>Salvar</Button></div>
    </form>
  );
}
