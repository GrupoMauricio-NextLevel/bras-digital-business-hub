"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntField, MoneyField, PercentField } from "@/components/finance/fields";
import { saveProposalAction } from "@/app/actions/proposta";
import type { Proposal, ProposalBrand } from "@/lib/domain/precos/proposta";

const SC_LABEL = { PESSIMISTA: "Pessimista", BASE: "Base", OTIMISTA: "Otimista" } as const;
const num = "w-20 rounded-md border border-border bg-background px-2 py-1 text-right tabular-nums";

/** Edita o rascunho da proposta (D125). Gravar não muda preço nenhum: só refaz a simulação. */
export function PropostaForm({ value, brands }: { value: Proposal; brands: { brand: ProposalBrand; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState(value);
  const setBrand = (b: ProposalBrand, fn: (d: Proposal["brands"][ProposalBrand]) => Proposal["brands"][ProposalBrand]) => setF({ ...f, brands: { ...f.brands, [b]: fn(f.brands[b]) } });
  const save = () => start(async () => { const r = await saveProposalAction(f); if (r.ok) { toast.success("Rascunho gravado e simulação refeita"); router.refresh(); } else toast.error(r.error); });
  return (
    <form aria-label="Rascunho da proposta de preço" className="space-y-6" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <fieldset className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <legend className="mb-2 text-sm font-semibold">Peças da porta de entrada</legend>
        <IntField id="pp-trial" label="Teste reverso" suffix="dias" value={f.reverseTrialDays} onChange={(v) => setF({ ...f, reverseTrialDays: v })} />
        <IntField id="pp-pub" label="Dias ao publicar" suffix="dias" value={f.milestoneDays.publish} onChange={(v) => setF({ ...f, milestoneDays: { ...f.milestoneDays, publish: v } })} />
        <IntField id="pp-sale" label="Dias na 1ª venda" suffix="dias" value={f.milestoneDays.firstSale} onChange={(v) => setF({ ...f, milestoneDays: { ...f.milestoneDays, firstSale: v } })} />
        <IntField id="pp-cap" label="Teto do teste" suffix="dias" value={f.milestoneDays.cap} onChange={(v) => setF({ ...f, milestoneDays: { ...f.milestoneDays, cap: v } })} />
        <IntField id="pp-paid" label="Anual: meses pagos" min={1} value={f.annual.paidMonths} onChange={(v) => setF({ ...f, annual: { ...f.annual, paidMonths: v } })} />
        <PercentField id="pp-cash" label="Cashback em pontos" bps={f.cashbackBps} onChange={(v) => setF({ ...f, cashbackBps: v })} />
      </fieldset>
      {brands.map(({ brand, label }) => {
        const d = f.brands[brand];
        return (
          <fieldset key={brand} className="space-y-3">
            <legend className="text-sm font-semibold">{label}: escada de planos</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {d.ladder.map((p, i) => (
                <div key={p.key} className="space-y-2 rounded-lg border border-border p-3">
                  <label className="flex flex-col text-sm font-medium">Nome do plano<Input value={p.name} onChange={(e) => setBrand(brand, (x) => ({ ...x, ladder: x.ladder.map((q, j) => (j === i ? { ...q, name: e.target.value } : q)) }))} className="mt-1" /></label>
                  <MoneyField id={`pp-${brand}-${p.key}-m`} label="Mensalidade" valueCents={p.monthlyCents} onChange={(v) => setBrand(brand, (x) => ({ ...x, ladder: x.ladder.map((q, j) => (j === i ? { ...q, monthlyCents: v } : q)) }))} />
                  <PercentField id={`pp-${brand}-${p.key}-f`} label="Taxa sobre a venda" bps={p.feeBps} onChange={(v) => setBrand(brand, (x) => ({ ...x, ladder: x.ladder.map((q, j) => (j === i ? { ...q, feeBps: v } : q)) }))} />
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="mb-1 text-left text-xs text-muted-foreground">Cenários (hipóteses até a P1 e a P2 trazerem os números reais)</caption>
                <thead><tr className="border-b border-border text-left">
                  <th scope="col" className="p-1">Cenário</th><th scope="col" className="p-1">Cadastros/mês</th><th scope="col" className="p-1">% que vende</th><th scope="col" className="p-1">Venda/mês (R$)</th><th scope="col" className="p-1">% assina (proposta)</th><th scope="col" className="p-1">% assina (hoje)</th><th scope="col" className="p-1">% anual</th><th scope="col" className="p-1">Saída/mês (%)</th>
                </tr></thead>
                <tbody>{d.scenarios.map((s, i) => {
                  const set = (k: keyof typeof s, v: number) => setBrand(brand, (x) => ({ ...x, scenarios: x.scenarios.map((q, j) => (j === i ? { ...q, [k]: v } : q)) }));
                  const cell = (k: "signupsPerMonth" | "activationPct" | "paidConversionPct" | "currentConversionPct" | "annualSharePct", lab: string) => <td className="p-1"><input aria-label={`${lab} (${SC_LABEL[s.key]}, ${label})`} type="number" min={0} className={num} value={s[k]} onChange={(e) => set(k, Number(e.target.value) || 0)} /></td>;
                  return (
                    <tr key={s.key} className="border-b border-border last:border-0">
                      <th scope="row" className="p-1 text-left font-medium">{SC_LABEL[s.key]}</th>
                      {cell("signupsPerMonth", "Cadastros por mês")}{cell("activationPct", "% que vende")}
                      <td className="p-1"><input aria-label={`Venda por mês em reais (${SC_LABEL[s.key]}, ${label})`} type="number" min={0} className={num} value={Math.round(s.gmvPerActiveCents / 100)} onChange={(e) => set("gmvPerActiveCents", Math.round((Number(e.target.value) || 0) * 100))} /></td>
                      {cell("paidConversionPct", "% que assina na proposta")}{cell("currentConversionPct", "% que assina hoje")}{cell("annualSharePct", "% no anual")}
                      <td className="p-1"><input aria-label={`Saída por mês em % (${SC_LABEL[s.key]}, ${label})`} type="number" min={0} step="0.5" className={num} value={s.monthlyChurnBps / 100} onChange={(e) => set("monthlyChurnBps", Math.round((Number(e.target.value) || 0) * 100))} /></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </fieldset>
        );
      })}
      <Button type="submit" loading={pending}>Gravar rascunho e refazer a simulação</Button>
    </form>
  );
}
