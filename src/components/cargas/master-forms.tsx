"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch } from "@/components/ui/input";
import { IntField, MoneyField, PercentField } from "@/components/finance/fields";
import { saveExcursionRulesAction, saveGroupCompaniesAction } from "@/app/actions/cargas-painel";
import { GROUP_ROLES, GROUP_ROLE_LABEL } from "@/lib/domain/grupo-rotulos";

/** Formulários do Master para a Excursão e as empresas do grupo (D112). */
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); router.refresh(); } else toast.error(r.error ?? "Não foi possível gravar."); }) };
}
const lab = "flex flex-col text-sm font-medium";

type Size = { maxCm: string; maxKg: number; units: number };
type ExRules = { sizes: { P: Size; M: Size; G: Size }; fee: { mode: "VOLUME" | "PERCENT"; perParcelCents: number; bps: number; charging: boolean }; defaultCapacityUnits: number; cancelHours: number; requireInvoice: boolean };
const SIZE_LABEL = { P: "Fardinho P", M: "Fardo M", G: "Fardo G" } as const;

export function ExcursionRulesEditor({ rules }: { rules: ExRules }) {
  const { pending, run } = useRun();
  const [r, setR] = React.useState(rules);
  const setSize = (k: "P" | "M" | "G", patch: Partial<Size>) => setR({ ...r, sizes: { ...r.sizes, [k]: { ...r.sizes[k], ...patch } } });
  return (
    <form className="space-y-6" aria-label="Regras da Excursão" onSubmit={(e) => { e.preventDefault(); run(() => saveExcursionRulesAction(r), "Regras da Excursão gravadas"); }}>
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Tamanhos dos fardos</legend>
        <p className="text-sm text-muted-foreground">O espaço no bagageiro é medido em fardinhos equivalentes. Acima do G, o pedido vai para a carga fechada.</p>
        {(["P", "M", "G"] as const).map((k) => (
          <div key={k} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
            <label className={lab}>{SIZE_LABEL[k]}: medida máxima<Input value={r.sizes[k].maxCm} onChange={(e) => setSize(k, { maxCm: e.target.value })} placeholder="Ex.: 40 × 30 × 30" className="mt-1" /></label>
            <IntField id={`sz-kg-${k}`} label="Peso máximo" suffix="kg" min={1} value={r.sizes[k].maxKg} onChange={(v) => setSize(k, { maxKg: v })} />
            <IntField id={`sz-u-${k}`} label="Ocupa no bagageiro" suffix="un." min={1} value={r.sizes[k].units} onChange={(v) => setSize(k, { units: v })} />
          </div>
        ))}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Taxa da plataforma</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={lab}>Como cobrar<Select value={r.fee.mode} onChange={(e) => setR({ ...r, fee: { ...r.fee, mode: e.target.value as "VOLUME" | "PERCENT" } })} className="mt-1"><option value="VOLUME">Valor por fardo</option><option value="PERCENT">Percentual do frete</option></Select></label>
          {r.fee.mode === "VOLUME" ? <MoneyField id="fee-vol" label="Por fardo" valueCents={r.fee.perParcelCents} onChange={(v) => setR({ ...r, fee: { ...r.fee, perParcelCents: v } })} /> : <PercentField id="fee-pct" label="Do frete" bps={r.fee.bps} onChange={(v) => setR({ ...r, fee: { ...r.fee, bps: v } })} />}
        </div>
        <Switch checked={r.fee.charging} onCheckedChange={(v) => setR({ ...r, fee: { ...r.fee, charging: v } })} label="Cobrança ligada (só depois da revisão jurídica e contábil)" />
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <IntField id="ex-cap" label="Capacidade padrão do bagageiro" suffix="un." min={10} value={r.defaultCapacityUnits} onChange={(v) => setR({ ...r, defaultCapacityUnits: v })} />
        <IntField id="ex-cancel" label="Cancelamento com devolução até" suffix="h antes" value={r.cancelHours} onChange={(v) => setR({ ...r, cancelHours: v })} />
      </div>
      <Switch checked={r.requireInvoice} onCheckedChange={(v) => setR({ ...r, requireInvoice: v })} label="Fardo só embarca com nota" />
      <Button type="submit" loading={pending}>Gravar regras</Button>
    </form>
  );
}

type Company = { key: string; legalName: string; tradeName: string; cnpj: string; role: (typeof GROUP_ROLES)[number]; notes: string };
export function GroupCompaniesEditor({ companies }: { companies: Company[] }) {
  const { pending, run } = useRun();
  const [list, setList] = React.useState(companies);
  const set = (i: number, patch: Partial<Company>) => setList(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <form className="space-y-3" aria-label="Empresas do grupo" onSubmit={(e) => { e.preventDefault(); run(() => saveGroupCompaniesAction(list), "Empresas do grupo gravadas"); }}>
      {list.map((c, i) => (
        <fieldset key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">{c.tradeName || c.legalName || "Nova empresa"}</legend>
          <label className={lab}>Razão social<Input required minLength={3} value={c.legalName} onChange={(e) => set(i, { legalName: e.target.value })} className="mt-1" /></label>
          <label className={lab}>Nome fantasia<Input value={c.tradeName} onChange={(e) => set(i, { tradeName: e.target.value })} className="mt-1" /></label>
          <label className={lab}>CNPJ<Input inputMode="numeric" value={c.cnpj} onChange={(e) => set(i, { cnpj: e.target.value })} placeholder="Ex.: 00.000.000/0001-00" className="mt-1" /></label>
          <label className={lab}>Atividade<Select value={c.role} onChange={(e) => set(i, { role: e.target.value as Company["role"] })} className="mt-1">{GROUP_ROLES.map((r) => <option key={r} value={r}>{GROUP_ROLE_LABEL[r]}</option>)}</Select></label>
          <label className={lab}>Chave interna<Input required value={c.key} onChange={(e) => set(i, { key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} className="mt-1 font-mono" /></label>
          <label className={lab}>Observação<Input value={c.notes} onChange={(e) => set(i, { notes: e.target.value })} className="mt-1" /></label>
          <Button type="button" variant="ghost" size="sm" className="sm:justify-self-start" onClick={() => setList(list.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden />Remover</Button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setList([...list, { key: "", legalName: "", tradeName: "", cnpj: "", role: "OUTRO", notes: "" }])}><Plus className="size-4" aria-hidden />Empresa</Button>
        <Button type="submit" loading={pending}>Gravar empresas</Button>
      </div>
    </form>
  );
}
