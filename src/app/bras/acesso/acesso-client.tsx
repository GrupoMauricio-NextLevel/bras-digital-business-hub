"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/app/form-field";
import { EmptyState } from "@/components/app/empty-state";
import { MoneyField } from "@/components/finance/fields";
import { grantBrasAccessAction, revokeBrasAccessAction, saveBrasAnalysisSettingsAction } from "@/app/actions/bras";
import { formatDate } from "@/lib/utils";

type Settings = { mode: "OPEN" | "PAID"; monthlyPriceCents: number | null; volumeThresholdCents: number | null; volumeWindowDays: number };

export function AccessSettings({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [f, setF] = React.useState({ mode: settings.mode, price: settings.monthlyPriceCents ?? 0, usePrice: settings.monthlyPriceCents !== null, volume: settings.volumeThresholdCents ?? 0, useVolume: settings.volumeThresholdCents !== null, days: settings.volumeWindowDays });
  const [pending, start] = React.useTransition();
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveBrasAnalysisSettingsAction({ mode: f.mode, monthlyPriceCents: f.usePrice ? f.price : null, volumeThresholdCents: f.useVolume ? f.volume : null, volumeWindowDays: f.days });
      if (r.ok) { toast.success(f.mode === "OPEN" ? "Análise aberta a todos os membros" : "Análise passa a ser paga"); router.refresh(); } else toast.error(r.error);
    });
  };
  return (
    <form onSubmit={save} className="ds-card h-fit space-y-4 p-4" aria-labelledby="ac-regra">
      <h2 id="ac-regra" className="text-base font-semibold">Regra de acesso</h2>
      <fieldset className="space-y-2">
        <legend className="sr-only">Modo</legend>
        {([["OPEN", "Aberta a todos os membros", "Fase de lançamento: forma a biblioteca e mostra quais análises mais interessam."], ["PAID", "Paga", "Assinatura e/ou volume de compra no período. O veredito e o trecho continuam grátis."]] as const).map(([v, t, d]) => (
          <label key={v} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${f.mode === v ? "border-accent bg-accent-soft/40" : "border-border"}`}>
            <input type="radio" name="mode" value={v} checked={f.mode === v} onChange={() => setF({ ...f, mode: v })} className="mt-1" />
            <span><b>{t}</b><span className="block text-muted-foreground">{d}</span></span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-3 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.usePrice} onChange={(e) => setF({ ...f, usePrice: e.target.checked })} />Assinatura mensal</label>
        {f.usePrice ? <MoneyField id="ac-price" label="Preço por mês" hint="Nesta etapa a equipe combina o pagamento e libera o acesso ao lado." valueCents={f.price} onChange={(v) => setF({ ...f, price: v })} /> : null}
      </div>
      <div className="space-y-3 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.useVolume} onChange={(e) => setF({ ...f, useVolume: e.target.checked })} />Liberar por volume de compra</label>
        {f.useVolume ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <MoneyField id="ac-vol" label="Pedidos pagos de pelo menos" valueCents={f.volume} onChange={(v) => setF({ ...f, volume: v })} />
            <FormField label="Em quantos dias" htmlFor="ac-days"><Input id="ac-days" type="number" min={7} max={90} value={f.days} onChange={(e) => setF({ ...f, days: Number(e.target.value) })} /></FormField>
          </div>
        ) : null}
      </div>
      <Button type="submit" loading={pending} className="w-full">Salvar regra</Button>
    </form>
  );
}

type Grant = { id: string; companyName: string; email: string; kind: "SUBSCRIPTION" | "COURTESY"; validUntil: string; note: string | null; active: boolean; revoked: boolean };

export function GrantsManager({ members, grants }: { members: { id: string; label: string }[]; grants: Grant[] }) {
  const router = useRouter();
  const [f, setF] = React.useState({ memberId: members[0]?.id ?? "", kind: "SUBSCRIPTION" as Grant["kind"], days: 30, note: "" });
  const [pending, start] = React.useTransition();
  const grant = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => { const r = await grantBrasAccessAction(f); if (r.ok) { toast.success(`Acesso liberado até ${formatDate(r.data.validUntil, { day: "2-digit", month: "short", year: "numeric" })}`); setF({ ...f, note: "" }); router.refresh(); } else toast.error(r.error); });
  };
  const revoke = (g: Grant) => start(async () => { if (!window.confirm(`Revogar o acesso de ${g.companyName}?`)) return; const r = await revokeBrasAccessAction(g.id); if (r.ok) { toast.success("Acesso revogado"); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="space-y-4">
      <form onSubmit={grant} className="ds-card space-y-3 p-4" aria-labelledby="ac-lib">
        <h2 id="ac-lib" className="text-base font-semibold">Liberar acesso a um membro</h2>
        <p className="text-sm text-muted-foreground">Recebeu a assinatura (Pix combinado com a equipe) ou quer dar cortesia: libere aqui. Renovar soma os dias ao que ainda falta.</p>
        {members.length ? (
          <div className="grid gap-3 md:grid-cols-[1fr_10rem_7rem]">
            <FormField label="Membro" htmlFor="ac-m"><Select id="ac-m" value={f.memberId} onChange={(e) => setF({ ...f, memberId: e.target.value })}>{members.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</Select></FormField>
            <FormField label="Tipo" htmlFor="ac-k"><Select id="ac-k" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Grant["kind"] })}><option value="SUBSCRIPTION">Assinatura</option><option value="COURTESY">Cortesia</option></Select></FormField>
            <FormField label="Dias" htmlFor="ac-d"><Input id="ac-d" type="number" min={1} max={366} value={f.days} onChange={(e) => setF({ ...f, days: Number(e.target.value) })} /></FormField>
            <FormField label="Anotação (opcional)" htmlFor="ac-n" className="md:col-span-3"><Input id="ac-n" maxLength={200} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ex.: Pix de outubro recebido" /></FormField>
          </div>
        ) : <p className="text-sm text-muted-foreground">Nenhum membro ativo ainda.</p>}
        <Button type="submit" loading={pending} disabled={!members.length}>Liberar acesso</Button>
      </form>
      {grants.length === 0 ? <EmptyState icon={KeyRound} title="Nenhuma liberação" description="Quem receber assinatura ou cortesia aparece aqui, com a data de validade." /> : (
        <ul className="space-y-2" aria-label="Liberações de acesso">
          {grants.map((g) => (
            <li key={g.id} className="ds-card flex flex-wrap items-center gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">{g.companyName}{g.revoked ? <Badge tone="danger">Revogado</Badge> : g.active ? <Badge tone="success">Ativo</Badge> : <Badge>Vencido</Badge>}<Badge tone="outline">{g.kind === "SUBSCRIPTION" ? "Assinatura" : "Cortesia"}</Badge></p>
                <p className="text-muted-foreground">{g.email} · até {formatDate(g.validUntil, { day: "2-digit", month: "short", year: "numeric" })}{g.note ? ` · ${g.note}` : ""}</p>
              </div>
              {g.active ? <Button size="sm" variant="ghost" disabled={pending} onClick={() => revoke(g)}>Revogar</Button> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
