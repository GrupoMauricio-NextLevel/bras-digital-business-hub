"use client";
import * as React from "react";
import { estimateSale, MEMBER_FEE_BPS, STORE_TYPE_LABEL, SUPPLIER_FEE_BPS, SUPPLIER_PLAN_LABEL, type StoreType, type SupplierPlan } from "@/lib/portal/calculator";
import { cn } from "@/lib/utils";

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR")}%`;
const toCents = (s: string) => Math.round((Number(s.replace(",", ".")) || 0) * 100);

/** Simula uma venda: quanto o cliente paga, o custo, as taxas e o que sobra para cada lado. */
export function SaleCalculator() {
  const [sale, setSale] = React.useState("120");
  const [cost, setCost] = React.useState("80");
  const [store, setStore] = React.useState<StoreType>("STORE_SUBDOMAIN");
  const [plan, setPlan] = React.useState<SupplierPlan>("SUPERDROP");
  const e = estimateSale({ customerPaysCents: toCents(sale), memberPaysSupplierCents: toCents(cost), storeType: store, supplierPlan: plan });
  const field = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d803e]";
  const seg = (on: boolean) => cn("flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors", on ? "bg-[#0f1c16] text-white" : "text-neutral-700 hover:bg-neutral-100");
  const row = (label: string, value: string, strong = false, tone?: "good" | "bad") => (
    <div className={cn("flex items-baseline justify-between gap-3 py-2.5", strong && "border-t border-neutral-300 pt-3")}>
      <dt className={cn("text-sm", strong ? "font-semibold" : "text-neutral-600")}>{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-xl font-extrabold" : "font-semibold", tone === "good" && "text-[#0b6b34]", tone === "bad" && "text-[#b42318]")}>{value}</dd>
    </div>
  );
  return (
    <div className="grid gap-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="calc-sale" className="mb-1.5 block text-sm font-medium">Cliente paga (produto)</label><input id="calc-sale" inputMode="decimal" value={sale} onChange={(x) => setSale(x.target.value)} className={field} /></div>
          <div><label htmlFor="calc-cost" className="mb-1.5 block text-sm font-medium">Membro paga ao fornecedor</label><input id="calc-cost" inputMode="decimal" value={cost} onChange={(x) => setCost(x.target.value)} className={field} /></div>
        </div>
        <fieldset><legend className="mb-1.5 text-sm font-medium">Tipo de loja do membro</legend>
          <div className="flex gap-1 rounded-lg bg-neutral-100 p-1" role="radiogroup">{(Object.keys(STORE_TYPE_LABEL) as StoreType[]).map((k) => <button key={k} type="button" role="radio" aria-checked={store === k} onClick={() => setStore(k)} className={seg(store === k)}>{STORE_TYPE_LABEL[k]}<span className="ml-1 text-xs">{pct(MEMBER_FEE_BPS[k])}</span></button>)}</div>
        </fieldset>
        <fieldset><legend className="mb-1.5 text-sm font-medium">Plano do fornecedor</legend>
          <div className="flex gap-1 rounded-lg bg-neutral-100 p-1" role="radiogroup">{(Object.keys(SUPPLIER_PLAN_LABEL) as SupplierPlan[]).map((k) => <button key={k} type="button" role="radio" aria-checked={plan === k} onClick={() => setPlan(k)} className={seg(plan === k)}>{SUPPLIER_PLAN_LABEL[k]}<span className="ml-1 text-xs">{pct(SUPPLIER_FEE_BPS[k])}</span></button>)}</div>
        </fieldset>
        <p className="text-xs text-neutral-600">Estimativa de uma venda. As taxas incidem sobre o valor dos produtos, sem o frete (pago pelo cliente). Estorno devolve a taxa e pedidos de teste não pagam. Fornecedores não pagam taxa nos primeiros 15 dias.</p>
      </div>
      <div aria-live="polite" className="rounded-xl bg-neutral-50 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">Para o membro</p>
        <dl>
          {row("Cliente paga pelo produto", brl(e.customerPaysCents))}
          {row("Custo pago ao fornecedor", `− ${brl(e.memberPaysSupplierCents)}`)}
          {row(`Taxa da plataforma (${pct(MEMBER_FEE_BPS[store])})`, `− ${brl(e.memberFeeCents)}`)}
          {row(`Sobra do membro (${e.memberMarginPercent.toLocaleString("pt-BR")}%)`, brl(e.memberNetCents), true, e.memberNetCents >= 0 ? "good" : "bad")}
        </dl>
        <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-600">Para o fornecedor</p>
        <dl>
          {row("Recebe do membro", brl(e.memberPaysSupplierCents))}
          {row(`Taxa da plataforma (${pct(SUPPLIER_FEE_BPS[plan])})`, `− ${brl(e.supplierFeeCents)}`)}
          {row("Fica com o fornecedor", brl(e.supplierReceivesCents), true)}
        </dl>
      </div>
    </div>
  );
}
