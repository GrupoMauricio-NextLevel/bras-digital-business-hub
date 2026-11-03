"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/app/form-field";
import { Input, Select } from "@/components/ui/input";
import { signupAction } from "@/app/actions/signup";
import { formatBRL } from "@/lib/money";

type Offer = { key: "DROP_MANUAL" | "STORE_SUBDOMAIN" | "STORE_OWN"; name: string; monthlyCents: number; setupCents: number };
type Plan = { key: "COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE"; name: string; monthlyCents: number; annualCents: number; feeBps: number };
type EntryOffer = { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number } | null;

export function SignupForm({ initialCode, initialRef, initialOffer, initialSupplier, independent = false, offers, suppliers, plans, entry, initialPlan, initialCycle = "MONTHLY" }: { initialCode: string; initialRef?: string; initialOffer: Offer["key"]; initialSupplier: string; independent?: boolean; offers: Offer[]; suppliers: { slug: string; name: string }[]; plans?: Plan[]; entry?: EntryOffer; initialPlan?: Plan["key"]; initialCycle?: "MONTHLY" | "ANNUAL" }) {
  const [f, setF] = React.useState({ storeName: "", ownerName: "", email: "", password: "", taxId: "", code: initialCode, offer: initialOffer, supplierSlug: initialSupplier, plan: initialPlan ?? "COMMERCE_START" as Plan["key"], cycle: initialCycle as "MONTHLY" | "ANNUAL" });
  const usePlans = !!plans?.length;
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const offer = offers.find((o) => o.key === f.offer)!;
  const trial = f.code.trim().length > 0;
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => { const r = await signupAction({ ...f, code: usePlans ? undefined : f.code.trim() || undefined, ref: initialRef, plan: usePlans ? f.plan : undefined, cycle: f.cycle }); if (r && !r.ok) { setError(r.error); toast.error(r.error); } });
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-label="Cadastro">
      {usePlans ? (
        <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">Plano NextLevel E-commerce</legend>
          <div className="ds-seg" role="group" aria-label="Ciclo"><button type="button" aria-pressed={f.cycle === "MONTHLY"} onClick={() => set({ cycle: "MONTHLY" })}>Mensal</button><button type="button" aria-pressed={f.cycle === "ANNUAL"} onClick={() => set({ cycle: "ANNUAL" })}>Anual</button></div>
          {plans!.map((p) => (
            <label key={p.key} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm ${f.plan === p.key ? "border-accent bg-accent-soft/40" : "border-border"}`}>
              <span className="flex items-center gap-2"><input type="radio" name="plan" value={p.key} checked={f.plan === p.key} onChange={() => set({ plan: p.key })} /> <span className="font-semibold">{p.name}</span></span>
              <span className="text-right tabular-nums"><b>{f.cycle === "ANNUAL" ? formatBRL(p.annualCents) : formatBRL(p.monthlyCents)}</b>{f.cycle === "ANNUAL" ? "/ano" : "/mês"}<span className="block text-xs text-muted-foreground">{p.feeBps ? `taxa de ${(p.feeBps / 100).toString().replace(".", ",")}% sobre vendas` : "taxa zero da plataforma"}</span></span>
            </label>
          ))}
          {entry ? <p className="text-xs text-muted-foreground">Clientes novos: {entry.trialDays} dias grátis. Vale uma vez por CPF/CNPJ.</p> : null}
        </fieldset>
      ) : (
      <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">Plano</legend>
        {offers.map((o) => (
          <label key={o.key} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm ${f.offer === o.key ? "border-accent bg-accent-soft/40" : "border-border"}`}>
            <span className="flex items-center gap-2"><input type="radio" name="offer" value={o.key} checked={f.offer === o.key} onChange={() => set({ offer: o.key })} /> <span className="font-semibold">{o.name}</span></span>
            <span className="text-right tabular-nums"><b>{formatBRL(o.monthlyCents)}</b>/mês{o.setupCents > 0 ? <span className="block text-xs text-muted-foreground">+ setup {formatBRL(o.setupCents)}</span> : null}</span>
          </label>
        ))}
      </fieldset>
      )}
      {!initialSupplier && !independent ? (
        <FormField label="Seu fornecedor" htmlFor="supplier" hint={trial ? "Se o cupom for de um parceiro, escolha o fornecedor que vai abastecer a sua loja." : undefined}><Select id="supplier" required={!trial} value={f.supplierSlug} onChange={(e) => set({ supplierSlug: e.target.value })}><option value="">Escolha…</option>{suppliers.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</Select></FormField>
      ) : null}
      <FormField label="Nome da loja" htmlFor="store"><Input id="store" required value={f.storeName} onChange={(e) => set({ storeName: e.target.value })} /></FormField>
      <FormField label="Seu nome" htmlFor="owner"><Input id="owner" required value={f.ownerName} onChange={(e) => set({ ownerName: e.target.value })} autoComplete="name" /></FormField>
      <FormField label="E-mail" htmlFor="email"><Input id="email" type="email" required value={f.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" /></FormField>
      <FormField label="Senha" htmlFor="pass" hint="Mínimo de 8 caracteres"><Input id="pass" type="password" required minLength={8} value={f.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" /></FormField>
      <FormField label="CPF ou CNPJ" htmlFor="tax"><Input id="tax" required inputMode="numeric" value={f.taxId} onChange={(e) => set({ taxId: e.target.value })} /></FormField>
      {usePlans ? null : <FormField label="Cupom de teste (opcional)" htmlFor="code" hint="Com cupom: dias grátis, sem cartão. Sem cupom: você paga por Pix e o acesso é liberado na hora."><Input id="code" value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="Ex.: LANCAMENTO7" autoComplete="off" /></FormField>}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" loading={pending}>{usePlans ? (entry ? `Criar loja e começar ${entry.trialDays} dias grátis` : "Criar loja") : trial ? "Começar meu teste de 7 dias" : `Criar loja e pagar ${formatBRL(offer.monthlyCents + offer.setupCents)} por Pix`}</Button>
      <p className="text-center text-xs text-muted-foreground">Ao criar a conta você aceita os termos de uso e a política de privacidade.</p>
    </form>
  );
}
