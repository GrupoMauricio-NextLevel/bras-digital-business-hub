"use client";
import * as React from "react";
import { simulateEarnings, type PartnerSettings } from "@/lib/finance/partner-rules";
import { formatBRL } from "@/lib/money";

type Plan = { key: string; name: string; setupCents: number; monthlyCents: number };

/** Simulador de ganhos do parceiro. É uma simulação: os ganhos reais dependem das vendas de cada um. */
export function PartnerCalculator({ settings, plans }: { settings: PartnerSettings; plans: Plan[] }) {
  const [perMonth, setPerMonth] = React.useState(5);
  const [planKey, setPlanKey] = React.useState(plans.find((p) => p.key === "STORE_SUBDOMAIN")?.key ?? plans[0]!.key);
  const plan = plans.find((p) => p.key === planKey)!;
  const r = simulateEarnings({ perMonth, setupCents: plan.setupCents, monthlyCents: plan.monthlyCents }, settings);
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">Plano que você vende
          <select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-base">{plans.map((p) => <option key={p.key} value={p.key}>{p.name} · setup {formatBRL(p.setupCents)} + {formatBRL(p.monthlyCents)}/mês</option>)}</select>
        </label>
        <label className="block text-sm font-medium">Ativações por mês: <b className="tabular-nums">{perMonth}</b>
          <input type="range" min={1} max={20} value={perMonth} onChange={(e) => setPerMonth(Number(e.target.value))} className="mt-3 w-full accent-[#b45309]" aria-label="Ativações por mês" />
        </label>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-highlight-soft p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-highlight-foreground">Sua faixa no mês</dt><dd className="mt-1 text-3xl font-extrabold tabular-nums text-highlight-foreground" data-testid="calc-tier">{r.tier.bps / 100}%</dd><dd className="text-xs text-highlight-foreground">sobre o setup de cada ativação</dd></div>
        <div className="rounded-xl bg-surface-muted p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-body">Setup por mês</dt><dd className="mt-1 text-2xl font-extrabold tabular-nums" data-testid="calc-setup">{formatBRL(r.setupPerMonth)}</dd><dd className="text-xs text-body">{perMonth} ativação(ões) por mês</dd></div>
        <div className="rounded-xl bg-surface-muted p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-body">Manutenção no 12º mês</dt><dd className="mt-1 text-2xl font-extrabold tabular-nums" data-testid="calc-maint">{formatBRL(r.maintenanceMonth12)}</dd><dd className="text-xs text-body">{settings.maintenanceBps / 100}% das mensalidades dos seus clientes</dd></div>
      </dl>
      <p className="mt-5 text-lg">Em 12 meses, nesta simulação: <b className="tabular-nums" data-testid="calc-total">{formatBRL(r.total12)}</b> <span className="text-sm text-muted-foreground">({formatBRL(r.setup12)} de setup + {formatBRL(r.maintenance12)} de manutenção)</span></p>
      <p className="mt-2 text-xs text-muted-foreground">Simulação para ilustrar as regras do programa. Não é garantia de ganhos: os resultados dependem das suas vendas, das ativações de cada mês, do pagamento dos clientes e da garantia de {settings.guaranteeDays} dias.</p>
    </div>
  );
}
