"use client";
import { comportamentoDeRolagem } from "@/lib/ui/movimento";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { brasSignupAction } from "@/app/actions/bras";
import { EMPTY_PROFILE, ProfileQuestions, profileComplete, type ProfileDraft } from "./profile-questions";

/** Máscara visual do CNPJ (00.000.000/0000-00); o servidor guarda só os dígitos e confere os verificadores. */
const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.length <= 10 ? d.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].join("")) : d.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
};

export function BrasSignupForm({ videoId, source }: { videoId?: string; source?: string }) {
  const [f, setF] = React.useState({ name: "", companyName: "", cnpj: "", whatsapp: "", email: "", password: "" });
  const [aceite, setAceite] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [perfil, setPerfil] = React.useState<ProfileDraft>(EMPTY_PROFILE);
  const topo = React.useRef<HTMLHeadingElement>(null);
  const irPara = (n: 1 | 2) => { setStep(n); setError(null); requestAnimationFrame(() => { topo.current?.focus(); topo.current?.scrollIntoView({ block: "start", behavior: comportamentoDeRolagem() }); }); };
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!profileComplete(perfil)) { const m = "Responda as 7 perguntas: elas deixam o seu painel do tamanho do seu negócio."; setError(m); toast.error(m); return; }
    start(async () => { const r = await brasSignupAction({ ...f, acceptTerms: aceite as true, videoId, source, profile: perfil as never }); if (r && !r.ok) { setError(r.error); toast.error(r.error); } });
  };
  const passo = <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" aria-live="polite">Passo {step} de 2</p>;
  if (step === 2) return (
    <form onSubmit={submit} className="space-y-4" aria-label="Cadastro de membro do Brás Digital Club, passo 2">
      {passo}
      <h2 ref={topo} tabIndex={-1} className="text-lg font-bold outline-none">Conte sobre o seu negócio</h2>
      <p className="text-sm text-muted-foreground">Leva 1 minuto. Com isso o seu painel mostra primeiro o que faz sentido para quem está começando ou para quem compra contêiner. Ninguém fora da equipe da Brás vê as respostas.</p>
      <ProfileQuestions value={perfil} onChange={(v) => { setPerfil(v); setError(null); }} idPrefix="cad" />
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input type="checkbox" required checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--bd-acao)]" />
        <span>Li e aceito os <Link href="/termos" target="_blank" className="font-semibold underline">termos de uso</Link> e a <Link href="/privacidade" target="_blank" className="font-semibold underline">política de privacidade</Link> do Brás Digital Club.</span>
      </label>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="secondary" size="lg" onClick={() => irPara(1)}>Voltar</Button>
        <Button type="submit" size="lg" className="flex-1" loading={pending}>Criar meu cadastro grátis</Button>
      </div>
    </form>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); irPara(2); }} className="space-y-3" aria-label="Cadastro de membro do Brás Digital Club, passo 1">
      {passo}
      <h2 ref={topo} tabIndex={-1} className="sr-only">Dados da empresa</h2>
      <FormField label="CNPJ da empresa" htmlFor="cnpj"><Input id="cnpj" required inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" value={f.cnpj} onChange={(e) => set({ cnpj: maskCnpj(e.target.value) })} /></FormField>
      <FormField label="Nome da empresa" htmlFor="company" hint="Razão social ou nome fantasia"><Input id="company" required autoComplete="organization" value={f.companyName} onChange={(e) => set({ companyName: e.target.value })} /></FormField>
      <FormField label="Seu nome" htmlFor="name"><Input id="name" required autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></FormField>
      <FormField label="WhatsApp" htmlFor="whats" hint="Com DDD. A equipe usa para confirmar pedidos."><Input id="whats" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={f.whatsapp} onChange={(e) => set({ whatsapp: maskPhone(e.target.value) })} /></FormField>
      <FormField label="E-mail" htmlFor="email"><Input id="email" required type="email" autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></FormField>
      <FormField label="Senha" htmlFor="pass" hint="Mínimo de 8 caracteres"><Input id="pass" required type="password" minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => set({ password: e.target.value })} /></FormField>
      <Button type="submit" size="lg" className="w-full">Continuar</Button>
      <p className="text-center text-xs text-muted-foreground">Sem taxa. Seus dados ficam com o Brás Digital Club: a importadora recebe só o endereço de envio de cada pedido.</p>
    </form>
  );
}
