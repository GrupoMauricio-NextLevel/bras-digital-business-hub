"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { IntField, PercentField } from "@/components/finance/fields";
import { addDoorVersionAction } from "@/app/actions/proposta";

export type DoorValue = { status: "ACTIVE" | "PAUSED"; mode: "REVERSE_TRIAL" | "FREE_TIER"; trialDays: number; freeTierFeeBps: number; publishDays: number; firstSaleDays: number; milestoneCapDays: number; annualPaidMonths: number; cashbackBps: number; useProposalPrices: boolean };

/** Nova versão da porta de entrada de uma marca (D126). Ligar = situação "Ativa"; quem já entrou mantém a condição dele. */
export function PortaForm({ brand, label, value }: { brand: "NEXTLEVEL_COMMERCE" | "SUPERDROP"; label: string; value: DoorValue }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ ...value, reason: "", password: "" });
  const id = (k: string) => `pt-${brand}-${k}`;
  const save = () => start(async () => {
    const { password, ...rest } = f;
    const r = await addDoorVersionAction(brand, rest, password);
    if (r.ok) { toast.success("Nova versão da porta de entrada criada"); setF({ ...f, reason: "", password: "" }); router.refresh(); } else toast.error(r.error);
  });
  return (
    <form aria-label={`Porta de entrada: ${label}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <label className="flex flex-col text-sm font-medium" htmlFor={id("st")}>Situação<Select id={id("st")} className="mt-1" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as DoorValue["status"] })}><option value="PAUSED">Desligada (como hoje)</option><option value="ACTIVE">Ligada para novos clientes</option></Select></label>
      <label className="flex flex-col text-sm font-medium" htmlFor={id("mode")}>Como entra<Select id={id("mode")} className="mt-1" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as DoorValue["mode"] })}><option value="REVERSE_TRIAL">Teste do plano pago, depois cai no grátis</option><option value="FREE_TIER">Direto no grátis</option></Select></label>
      <IntField id={id("trial")} label="Dias de teste" suffix="dias" value={f.trialDays} onChange={(v) => setF({ ...f, trialDays: v })} />
      <PercentField id={id("fee")} label="Taxa do plano grátis" bps={f.freeTierFeeBps} onChange={(v) => setF({ ...f, freeTierFeeBps: v })} />
      <IntField id={id("pub")} label="Dias ganhos ao publicar" suffix="dias" value={f.publishDays} onChange={(v) => setF({ ...f, publishDays: v })} />
      <IntField id={id("sale")} label="Dias ganhos na 1ª venda" suffix="dias" value={f.firstSaleDays} onChange={(v) => setF({ ...f, firstSaleDays: v })} />
      <IntField id={id("cap")} label="Teto do teste" suffix="dias" value={f.milestoneCapDays} onChange={(v) => setF({ ...f, milestoneCapDays: v })} />
      <IntField id={id("annual")} label="Anual no Pix: meses pagos (0 = sem)" suffix="de 12" value={f.annualPaidMonths} onChange={(v) => setF({ ...f, annualPaidMonths: v })} />
      <PercentField id={id("cash")} label="Cashback em pontos" bps={f.cashbackBps} onChange={(v) => setF({ ...f, cashbackBps: v })} />
      <label className="flex items-start gap-2 text-sm sm:col-span-2 lg:col-span-4" htmlFor={id("prop")}>
        <input id={id("prop")} type="checkbox" className="mt-1 size-4" checked={f.useProposalPrices} onChange={(e) => setF({ ...f, useProposalPrices: e.target.checked })} />
        <span><span className="font-medium">Usar os preços da Proposta de preço</span><span className="block text-xs text-muted-foreground">Quem entrar recebe a escada da Proposta (mensalidade e taxa de cada plano; a taxa do grátis vem do plano grátis dela), congelada na loja. Desmarcado: valem os preços de hoje. Para testar com parte dos clientes, crie um experimento desta porta.</span></span>
      </label>
      <label className="flex flex-col text-sm font-medium sm:col-span-2" htmlFor={id("reason")}>Motivo<Input id={id("reason")} className="mt-1" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></label>
      <label className="flex flex-col text-sm font-medium" htmlFor={id("pass")}>Sua senha<Input id={id("pass")} type="password" autoComplete="current-password" className="mt-1" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      <div className="flex items-end"><Button type="submit" loading={pending} disabled={f.reason.trim().length < 5 || !f.password}>Criar versão</Button></div>
    </form>
  );
}
