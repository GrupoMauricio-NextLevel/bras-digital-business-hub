"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { brasSupplierSignupAction } from "@/app/actions/bras";
import { POLOS, SUPPLIER_CATEGORIES, SUPPLIER_PAYMENT_METHODS, SUPPLIER_TYPES, SUPPLIER_TYPE_LABEL, type Polo, type SupplierType } from "@/lib/bras/fornecedores-opcoes";
import { comportamentoDeRolagem } from "@/lib/ui/movimento";
import { maskCnpj, maskPhone } from "./bras-signup-form";

const chip = "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold has-[:checked]:border-[var(--bd-acao)] has-[:checked]:bg-[color-mix(in_srgb,var(--bd-acao)_10%,transparent)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";

/** Cadastro do fornecedor (D160) em dois passos: empresa e o que vende; depois o responsável e o acesso. */
export function FornecedorForm() {
  const [f, setF] = React.useState({ tradeName: "", legalName: "", cnpj: "", description: "", address: "", minBoxes: "", name: "", email: "", whatsapp: "", password: "" });
  const [tipo, setTipo] = React.useState<SupplierType | "">("");
  const [polo, setPolo] = React.useState<Polo>("CANINDE");
  const [cats, setCats] = React.useState<string[]>([]);
  const [pag, setPag] = React.useState<string[]>([]);
  const [aceite, setAceite] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const topo = React.useRef<HTMLHeadingElement>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const toggle = (list: string[], v: string, max: number) => (list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);
  const irPara = (n: 1 | 2) => { setStep(n); setError(null); requestAnimationFrame(() => { topo.current?.focus(); topo.current?.scrollIntoView({ block: "start", behavior: comportamentoDeRolagem() }); }); };
  const passo = <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" aria-live="polite">Passo {step} de 2</p>;

  const avancar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) { setError("Escolha o tipo de fornecedor."); return; }
    if (!cats.length) { setError("Marque ao menos uma categoria."); return; }
    irPara(2);
  };
  const enviar = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => {
      const r = await brasSupplierSignupAction({
        ...f, supplierType: tipo as SupplierType, polo, categories: cats as never, paymentMethods: pag as never, acceptTerms: aceite as true,
        minBoxes: f.minBoxes ? Number(f.minBoxes) : null,
      });
      if (r && !r.ok) { setError(r.error); toast.error(r.error); }
    });
  };

  if (step === 2) return (
    <form onSubmit={enviar} className="space-y-3" aria-label="Cadastro de fornecedor, passo 2">
      {passo}
      <h2 ref={topo} tabIndex={-1} className="text-lg font-bold outline-none">Quem responde pela empresa</h2>
      <FormField label="Seu nome" htmlFor="f-name"><Input id="f-name" required autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></FormField>
      <FormField label="WhatsApp" htmlFor="f-whats" hint="Com DDD. A equipe usa para a aprovação e para as solicitações de compradores."><Input id="f-whats" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={f.whatsapp} onChange={(e) => set({ whatsapp: maskPhone(e.target.value) })} /></FormField>
      <FormField label="E-mail" htmlFor="f-email"><Input id="f-email" required type="email" autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></FormField>
      <FormField label="Senha" htmlFor="f-pass" hint="Mínimo de 8 caracteres. Você já entra no painel enquanto o cadastro é analisado."><Input id="f-pass" required type="password" minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => set({ password: e.target.value })} /></FormField>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input type="checkbox" required checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--bd-acao)]" />
        <span>Li e aceito os <Link href="/termos" target="_blank" className="font-semibold underline">termos de uso</Link> e a <Link href="/privacidade" target="_blank" className="font-semibold underline">política de privacidade</Link> do Brás Digital Club.</span>
      </label>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="secondary" size="lg" onClick={() => irPara(1)}>Voltar</Button>
        <Button type="submit" size="lg" className="flex-1" loading={pending}>Enviar cadastro para análise</Button>
      </div>
    </form>
  );

  return (
    <form onSubmit={avancar} className="space-y-4" aria-label="Cadastro de fornecedor, passo 1">
      {passo}
      <h2 ref={topo} tabIndex={-1} className="sr-only">Empresa e o que vende</h2>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Tipo de fornecedor</legend>
        <div className="flex flex-wrap gap-2">
          {SUPPLIER_TYPES.map((t) => <label key={t} className={chip}><input type="radio" name="tipo" className="sr-only" checked={tipo === t} onChange={() => { setTipo(t); setError(null); }} />{SUPPLIER_TYPE_LABEL[t]}</label>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Polo</legend>
        <div className="flex flex-wrap gap-2">
          {POLOS.map((p) => <label key={p.key} className={chip}><input type="radio" name="polo" className="sr-only" checked={polo === p.key} onChange={() => setPolo(p.key)} />{p.nome}{p.primeiro ? <span className="rounded-full bg-[var(--bd-acao)] px-2 py-0.5 text-[11px] text-white">primeiro polo</span> : null}</label>)}
        </div>
      </fieldset>
      <FormField label="CNPJ" htmlFor="f-cnpj"><Input id="f-cnpj" required inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" value={f.cnpj} onChange={(e) => set({ cnpj: maskCnpj(e.target.value) })} /></FormField>
      <FormField label="Nome da empresa" htmlFor="f-trade" hint="Como os compradores conhecem você (nome fantasia)"><Input id="f-trade" required autoComplete="organization" value={f.tradeName} onChange={(e) => set({ tradeName: e.target.value })} /></FormField>
      <FormField label="Razão social" htmlFor="f-legal"><Input id="f-legal" required value={f.legalName} onChange={(e) => set({ legalName: e.target.value })} /></FormField>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Categorias que você vende</legend>
        <p className="mb-2 text-xs text-muted-foreground">Até 8. É por elas que os compradores encontram você.</p>
        <div className="flex flex-wrap gap-2">
          {SUPPLIER_CATEGORIES.map((c) => <label key={c} className={chip}><input type="checkbox" className="sr-only" checked={cats.includes(c)} onChange={() => { setCats((x) => toggle(x, c, 8)); setError(null); }} />{c}</label>)}
        </div>
      </fieldset>
      <FormField label="O que você vende (opcional)" htmlFor="f-desc" hint="Em poucas linhas: linhas de produto, marcas, diferenciais. Até 400 caracteres.">
        <textarea id="f-desc" maxLength={400} rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} className="w-full rounded-[var(--ds-r-control,0.75rem)] border border-border bg-surface px-3 py-2 text-base" />
      </FormField>
      <FormField label="Pedido mínimo em caixas (opcional)" htmlFor="f-min"><Input id="f-min" type="number" inputMode="numeric" min={1} max={10000} value={f.minBoxes} onChange={(e) => set({ minBoxes: e.target.value })} /></FormField>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Formas de pagamento que aceita (opcional)</legend>
        <div className="flex flex-wrap gap-2">
          {SUPPLIER_PAYMENT_METHODS.map((m) => <label key={m} className={chip}><input type="checkbox" className="sr-only" checked={pag.includes(m)} onChange={() => setPag((x) => toggle(x, m, 10))} />{m}</label>)}
        </div>
      </fieldset>
      <FormField label="Endereço do galpão ou loja (opcional)" htmlFor="f-addr" hint="Aparece para o comprador só no pedido confirmado."><Input id="f-addr" autoComplete="street-address" value={f.address} onChange={(e) => set({ address: e.target.value })} /></FormField>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full">Continuar</Button>
      <p className="text-center text-xs text-muted-foreground">Cadastro grátis. A equipe confere os dados antes de mostrar a sua empresa aos compradores.</p>
    </form>
  );
}
