"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { FormField } from "@/components/app/form-field";
import { adjustCommissionAction, decidePayoutAction, reviewAttributionAction, savePartnerSettingsAction, setPartnerStatusAction } from "@/app/actions/partners";
import type { PartnerSettings } from "@/lib/finance/partner-rules";

function useRun() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); return true; } toast.error(r.error ?? "Falha"); return false; };
  return { busy, run };
}

export function PayoutActions({ id, status }: { id: string; status: string }) {
  const { busy, run } = useRun();
  const [note, setNote] = React.useState("");
  if (status === "PAID" || status === "REJECTED") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comprovante ou motivo" aria-label="Comprovante ou motivo" className="w-56" />
      {status === "REQUESTED" ? <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => decidePayoutAction(id, "APPROVE"), "Saque aprovado")}>Aprovar</Button> : null}
      <Button size="sm" loading={busy} onClick={() => run(() => decidePayoutAction(id, "PAY", note), "Marcado como pago")}>Marcar pago</Button>
      <Button size="sm" variant="ghost" className="text-danger" loading={busy} onClick={() => run(() => decidePayoutAction(id, "REJECT", note), "Saque recusado")}>Recusar</Button>
    </div>
  );
}

export function PartnerAdmin({ id, status }: { id: string; status: string }) {
  const { busy, run } = useRun();
  const [reason, setReason] = React.useState("");
  const [cents, setCents] = React.useState(0);
  const [sign, setSign] = React.useState<"+" | "-">("+");
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <FormField label="Motivo (obrigatório para qualquer ação abaixo)" htmlFor="pa-reason"><Input id="pa-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: suspeita de fraude, acordo comercial…" /></FormField>
        <div className="flex flex-wrap gap-2">
          {status !== "ACTIVE" ? <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => setPartnerStatusAction(id, "ACTIVE", reason), "Parceiro ativado")}>Ativar</Button> : null}
          {status !== "INACTIVE" ? <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => setPartnerStatusAction(id, "INACTIVE", reason), "Parceiro inativado")}>Inativar</Button> : null}
          {status !== "SUSPENDED" ? <Button size="sm" variant="ghost" className="text-danger" loading={busy} onClick={() => run(() => setPartnerStatusAction(id, "SUSPENDED", reason), "Parceiro suspenso")}>Suspender</Button> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Select aria-label="Sinal do ajuste" value={sign} onChange={(e) => setSign(e.target.value as "+" | "-")} className="w-24"><option value="+">Crédito</option><option value="-">Débito</option></Select>
        <MoneyInput label="Valor do ajuste" valueCents={cents} onChange={setCents} className="w-40" id="pa-adj" />
        <Button size="sm" loading={busy} disabled={!cents} onClick={() => run(() => adjustCommissionAction(id, sign === "+" ? cents : -cents, reason), "Ajuste lançado")}>Lançar ajuste</Button>
      </div>
    </div>
  );
}

export function FraudActions({ storeId }: { storeId: string }) {
  const { busy, run } = useRun();
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => reviewAttributionAction(storeId, true), "Liberado: passa a comissionar")}>Liberar comissão</Button>
      <Button size="sm" variant="ghost" className="text-danger" loading={busy} onClick={() => run(() => reviewAttributionAction(storeId, false), "Atribuição removida")}>Remover atribuição</Button>
    </div>
  );
}

export function SettingsForm({ settings }: { settings: PartnerSettings }) {
  const { busy, run } = useRun();
  const [s, setS] = React.useState(settings);
  const num = (k: keyof PartnerSettings, label: string, hint?: string) => (
    <FormField label={label} htmlFor={`ps-${k}`} hint={hint}><Input id={`ps-${k}`} type="number" value={s[k] as number} onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })} /></FormField>
  );
  return (
    <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); await run(() => savePartnerSettingsAction(s), "Regras salvas"); }}>
      <fieldset className="space-y-2"><legend className="text-sm font-semibold">Faixas de comissão sobre o setup (pontos-base: 1500 = 15%)</legend>
        {s.tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <FormField label={`Faixa ${i + 1}: de`} htmlFor={`t-min-${i}`}><Input id={`t-min-${i}`} type="number" min={1} value={t.min} onChange={(e) => setS({ ...s, tiers: s.tiers.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) } : x)) })} /></FormField>
            <FormField label="até (vazio = sem teto)" htmlFor={`t-max-${i}`}><Input id={`t-max-${i}`} type="number" min={1} value={t.max ?? ""} onChange={(e) => setS({ ...s, tiers: s.tiers.map((x, j) => (j === i ? { ...x, max: e.target.value ? Number(e.target.value) : undefined } : x)) })} /></FormField>
            <FormField label="comissão (bps)" htmlFor={`t-bps-${i}`}><Input id={`t-bps-${i}`} type="number" min={0} max={10000} value={t.bps} onChange={(e) => setS({ ...s, tiers: s.tiers.map((x, j) => (j === i ? { ...x, bps: Number(e.target.value) } : x)) })} /></FormField>
          </div>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        {num("maintenanceBps", "Manutenção (bps)", "500 = 5% sobre cada mensalidade")}
        {num("guaranteeDays", "Garantia (dias)", "Antes de liberar o saque")}
        {num("attributionDays", "Janela do link (dias)")}
        {num("minPayoutCents", "Saque mínimo (centavos)")}
        {num("payoutsPerWeek", "Saques por semana")}
        {num("inactiveFeeCents", "Taxa de reativação (centavos)")}
        {num("monthlyGoal", "Meta de ativações por mês")}
      </div>
      <Button type="submit" loading={busy}>Salvar regras</Button>
    </form>
  );
}
