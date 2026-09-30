"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/app/form-field";
import { Input, Select } from "@/components/ui/input";
import { signupAction } from "@/app/actions/signup";

const OFFERS = [{ key: "DROP_MANUAL", label: "Drop manual · R$ 49/mês" }, { key: "STORE_SUBDOMAIN", label: "Loja SuperDrop · R$ 97/mês" }, { key: "STORE_OWN", label: "Loja própria · R$ 197/mês" }] as const;

export function SignupForm({ initialCode }: { initialCode: string }) {
  const [f, setF] = React.useState({ storeName: "", ownerName: "", email: "", password: "", taxId: "", code: initialCode, offer: "STORE_SUBDOMAIN" as (typeof OFFERS)[number]["key"] });
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => { const r = await signupAction(f); if (r && !r.ok) { setError(r.error); toast.error(r.error); } });
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-label="Cadastro">
      <FormField label="Cupom do seu fornecedor" htmlFor="code"><Input id="code" required value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="MANTOSSHOP7" autoComplete="off" /></FormField>
      <FormField label="Nome da loja" htmlFor="store"><Input id="store" required value={f.storeName} onChange={(e) => set({ storeName: e.target.value })} /></FormField>
      <FormField label="Seu nome" htmlFor="owner"><Input id="owner" required value={f.ownerName} onChange={(e) => set({ ownerName: e.target.value })} autoComplete="name" /></FormField>
      <FormField label="E-mail" htmlFor="email"><Input id="email" type="email" required value={f.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" /></FormField>
      <FormField label="Senha" htmlFor="pass" hint="Mínimo de 8 caracteres"><Input id="pass" type="password" required minLength={8} value={f.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" /></FormField>
      <FormField label="CPF ou CNPJ" htmlFor="tax" hint="Um teste gratuito por documento"><Input id="tax" required inputMode="numeric" value={f.taxId} onChange={(e) => set({ taxId: e.target.value })} /></FormField>
      <FormField label="Plano depois do teste" htmlFor="offer"><Select id="offer" value={f.offer} onChange={(e) => set({ offer: e.target.value as typeof f.offer })}>{OFFERS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</Select></FormField>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" loading={pending}>Começar meu teste de 7 dias</Button>
      <p className="text-center text-xs text-muted-foreground">Ao criar a conta você aceita os termos de uso e a política de privacidade.</p>
    </form>
  );
}
