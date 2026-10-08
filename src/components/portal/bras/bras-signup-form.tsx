"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { brasSignupAction } from "@/app/actions/bras";

/** Máscara visual do CNPJ (00.000.000/0000-00); o servidor guarda só os dígitos e confere os verificadores. */
const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.length <= 10 ? d.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].join("")) : d.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
};

export function BrasSignupForm() {
  const [f, setF] = React.useState({ name: "", companyName: "", cnpj: "", whatsapp: "", email: "", password: "" });
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => { const r = await brasSignupAction(f); if (r && !r.ok) { setError(r.error); toast.error(r.error); } });
  };
  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Cadastro de membro da Brás Digital">
      <FormField label="CNPJ da empresa" htmlFor="cnpj"><Input id="cnpj" required inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" value={f.cnpj} onChange={(e) => set({ cnpj: maskCnpj(e.target.value) })} /></FormField>
      <FormField label="Nome da empresa" htmlFor="company" hint="Razão social ou nome fantasia"><Input id="company" required autoComplete="organization" value={f.companyName} onChange={(e) => set({ companyName: e.target.value })} /></FormField>
      <FormField label="Seu nome" htmlFor="name"><Input id="name" required autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></FormField>
      <FormField label="WhatsApp" htmlFor="whats" hint="Com DDD. A equipe usa para confirmar pedidos."><Input id="whats" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={f.whatsapp} onChange={(e) => set({ whatsapp: maskPhone(e.target.value) })} /></FormField>
      <FormField label="E-mail" htmlFor="email"><Input id="email" required type="email" autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></FormField>
      <FormField label="Senha" htmlFor="pass" hint="Mínimo de 8 caracteres"><Input id="pass" required type="password" minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => set({ password: e.target.value })} /></FormField>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" loading={pending}>Criar meu cadastro grátis</Button>
      <p className="text-center text-xs text-muted-foreground">Sem taxa. Seus dados ficam com a Brás Digital: a importadora recebe só o endereço de envio de cada pedido.</p>
    </form>
  );
}
