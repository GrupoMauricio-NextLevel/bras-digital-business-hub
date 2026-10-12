"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IntField } from "@/components/finance/fields";
import { saveReputationRulesAction } from "@/app/actions/torre";

type Tier = { minDeliveries: number; minRating: number; maxRefusalPct: number };
/** Regras dos níveis e a vantagem do Ouro (D139). A nota mínima vai em décimos (45 = 4,5). */
export function ReputacaoForm({ value }: { value: { PRATA: Tier; OURO: Tier; ouroCommissionDiscountBps: number } }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState(value);
  const set = (t: "PRATA" | "OURO", k: keyof Tier, v: number) => setF({ ...f, [t]: { ...f[t], [k]: k === "minRating" ? v / 10 : v } });
  return (
    <form aria-label="Regras da reputação" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveReputationRulesAction(f); if (r.ok) { toast.success("Regras da reputação gravadas"); router.refresh(); } else toast.error(r.error); }); }}>
      {(["PRATA", "OURO"] as const).map((t) => (
        <fieldset key={t} className="min-w-0 space-y-2 rounded-lg border border-border p-3 sm:col-span-1 lg:col-span-1">
          <legend className="px-1 text-sm font-semibold">{t === "OURO" ? "Ouro" : "Prata"}</legend>
          <IntField id={`rp-${t}-d`} label="Entregas mínimas" value={f[t].minDeliveries} onChange={(v) => set(t, "minDeliveries", v)} />
          <IntField id={`rp-${t}-r`} label="Nota mínima (em décimos)" value={Math.round(f[t].minRating * 10)} onChange={(v) => set(t, "minRating", Math.min(50, v))} />
          <IntField id={`rp-${t}-x`} label="Recusas no máximo" suffix="%" value={f[t].maxRefusalPct} onChange={(v) => set(t, "maxRefusalPct", Math.min(100, v))} />
        </fieldset>
      ))}
      <IntField id="rp-ouro-desc" label="Ouro: comissão a menos" suffix="pb" value={f.ouroCommissionDiscountBps} onChange={(v) => setF({ ...f, ouroCommissionDiscountBps: Math.min(1000, v) })} hint="100 pb = 1 ponto percentual a menos sobre o frete" />
      <div className="flex items-end"><Button type="submit" loading={pending}>Gravar</Button></div>
    </form>
  );
}
