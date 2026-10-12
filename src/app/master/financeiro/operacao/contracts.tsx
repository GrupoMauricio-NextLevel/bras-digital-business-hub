"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { MoneyField, PercentField } from "@/components/finance/fields";
import { EmptyState } from "@/components/app/empty-state";
import { grantWaiverAction, updateContractAction } from "@/app/actions/finance";
import { TIER_KEYS, TIER_LABEL, type TierKey } from "@/lib/finance/price-book";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export type ContractView = {
  supplierId: string; name: string; model: "SUPERDROP" | "WHITE_LABEL"; access: string;
  tier: TierKey; monthlyFeeCents: number; setupFeeCents: number; volumeFeeBps: number; minMonthlyFeeCents: number; perOrderFeeCents: number; storeSetupCommissionBps: number;
  monthlyWaivedUntil: string | null; setupWaivedUntil: string | null; priceLockUntil: string | null; creditBalanceCents: number; notes: string | null;
  baseCents: number; feeCents: number; waiverDays: number;
};

const toDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const fromDate = (d: string) => (d ? new Date(`${d}T23:59:59Z`).toISOString() : null);

export function Contracts({ contracts }: { contracts: ContractView[] }) {
  if (contracts.length === 0) return <EmptyState title="Nenhum fornecedor" description="Cadastre um fornecedor para ver e negociar o contrato." />;
  return <div className="grid gap-4 xl:grid-cols-2">{contracts.map((c) => <ContractCard key={c.supplierId} c={c} />)}</div>;
}

function ContractCard({ c }: { c: ContractView }) {
  const router = useRouter();
  const [f, setF] = React.useState(c);
  const [pending, start] = React.useTransition();
  const dirty = JSON.stringify(f) !== JSON.stringify(c);
  const save = () => start(async () => {
    const r = await updateContractAction(c.supplierId, { tier: f.tier, monthlyFeeCents: f.monthlyFeeCents, setupFeeCents: f.setupFeeCents, volumeFeeBps: f.volumeFeeBps, minMonthlyFeeCents: f.minMonthlyFeeCents, perOrderFeeCents: f.perOrderFeeCents, storeSetupCommissionBps: f.storeSetupCommissionBps, monthlyWaivedUntil: f.monthlyWaivedUntil, setupWaivedUntil: f.setupWaivedUntil, priceLockUntil: f.priceLockUntil, notes: f.notes });
    if (r.ok) { toast.success("Contrato salvo"); router.refresh(); } else toast.error(r.error);
  });
  const waived = f.monthlyWaivedUntil && new Date(f.monthlyWaivedUntil) > new Date();
  return (
    <Card>
      <CardHeader>
        <div><CardTitle className="text-base">{c.name}</CardTitle><CardDescription>{c.model === "WHITE_LABEL" ? "White Label" : "SuperDrop"} · pago à Central no mês {formatBRL(c.baseCents)} · taxa estimada {formatBRL(c.feeCents)}</CardDescription></div>
        <div className="flex items-center gap-2">{waived ? <Badge tone="brand">Isento</Badge> : null}<StatusBadge value={c.access} dot /></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {c.model === "SUPERDROP" ? (
            <div className="space-y-1"><label htmlFor={`tier-${c.supplierId}`} className="text-xs font-medium text-muted-foreground">Faixa</label><Select id={`tier-${c.supplierId}`} value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value as TierKey })}>{TIER_KEYS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}</Select></div>
          ) : null}
          <MoneyField id={`m-${c.supplierId}`} label="Mensalidade" valueCents={f.monthlyFeeCents} onChange={(v) => setF({ ...f, monthlyFeeCents: v })} />
          <MoneyField id={`s-${c.supplierId}`} label="Setup" valueCents={f.setupFeeCents} onChange={(v) => setF({ ...f, setupFeeCents: v })} />
          <PercentField id={`v-${c.supplierId}`} label="Taxa de volume" hint="Sobre o custo pago à Central" bps={f.volumeFeeBps} onChange={(v) => setF({ ...f, volumeFeeBps: v })} />
          <MoneyField id={`n-${c.supplierId}`} label="Taxa mínima mensal" valueCents={f.minMonthlyFeeCents} onChange={(v) => setF({ ...f, minMonthlyFeeCents: v })} />
          <MoneyField id={`o-${c.supplierId}`} label="Taxa por pedido expedido" hint="Zero = desligada" valueCents={f.perOrderFeeCents} onChange={(v) => setF({ ...f, perOrderFeeCents: v })} />
          <PercentField id={`c-${c.supplierId}`} label="Comissão sobre setup de loja" bps={f.storeSetupCommissionBps} onChange={(v) => setF({ ...f, storeSetupCommissionBps: v })} />
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">Concessões</span><Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { const r = await grantWaiverAction(c.supplierId); if (r.ok) { toast.success(`Isenção de ${c.waiverDays} dias concedida`); router.refresh(); } else toast.error(r.error); })}><Gift /> Conceder isenção padrão</Button></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {([["Mensalidade isenta até", "monthlyWaivedUntil"], ["Setup isento até", "setupWaivedUntil"], ["Preço travado até", "priceLockUntil"]] as const).map(([label, key]) => (
              <div key={key} className="space-y-1"><label htmlFor={`${key}-${c.supplierId}`} className="text-xs font-medium text-muted-foreground">{label}</label><Input id={`${key}-${c.supplierId}`} type="date" value={toDate(f[key])} onChange={(e) => setF({ ...f, [key]: fromDate(e.target.value) })} /></div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">A isenção vale para mensalidade e setup. A taxa de volume e a taxa mínima continuam sendo cobradas. {f.creditBalanceCents !== 0 ? <b className="text-foreground">Saldo {f.creditBalanceCents > 0 ? "a favor" : "em débito"}: {formatBRL(Math.abs(f.creditBalanceCents))}.</b> : null}{c.monthlyWaivedUntil ? ` Isenção de mensalidade vigente até ${formatDate(c.monthlyWaivedUntil, { day: "2-digit", month: "long", year: "numeric" })}` : ""}</p>
        </div>
        <div className="space-y-1"><label htmlFor={`notes-${c.supplierId}`} className="text-xs font-medium text-muted-foreground">Observações do contrato</label><Textarea id={`notes-${c.supplierId}`} value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <Button className="w-full" disabled={!dirty} loading={pending} onClick={save}><Save /> Salvar contrato</Button>
      </CardContent>
    </Card>
  );
}
