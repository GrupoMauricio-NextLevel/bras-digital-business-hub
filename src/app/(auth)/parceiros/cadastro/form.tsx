"use client";
import * as React from "react";
import Link from "next/link";
import { registerPartnerAction } from "@/app/actions/partners";
import { submitLeadAction } from "@/app/actions/leads";

type Kind = "AFFILIATE" | "AGENCY" | "DEV";
const KINDS: { key: Kind; label: string; hint: string }[] = [
  { key: "AFFILIATE", label: "Afiliado", hint: "Indique lojas e ganhe comissão. Disponível agora." },
  { key: "AGENCY", label: "Agência", hint: "Em breve: ainda estamos definindo as regras. Deixe o contato." },
  { key: "DEV", label: "Desenvolvedor freelancer", hint: "Em breve: ainda estamos definindo as regras. Deixe o contato." },
];

const field = "mt-1 h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]";
const primary = "inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--brand-signal)] px-6 text-base font-semibold text-[var(--brand-on-signal)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] disabled:opacity-60";

function AffiliateForm({ termsVersion }: { termsVersion: string }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); setError(null);
      start(async () => {
        const r = await registerPartnerAction({ name: String(f.get("name")), email: String(f.get("email")), password: String(f.get("password")), taxId: String(f.get("taxId")), phone: String(f.get("phone")), pixKey: String(f.get("pixKey") ?? "") || undefined, acceptTerms: (f.get("terms") === "on") as true });
        if (r && !r.ok) setError(r.error);
      });
    }}>
      <label className="block text-sm font-medium">Nome completo<input name="name" required minLength={3} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-medium">E-mail<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="block text-sm font-medium">Senha (mínimo 8 caracteres)<input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} /></label>
      <label className="block text-sm font-medium">CPF ou CNPJ<input name="taxId" required inputMode="numeric" autoComplete="off" className={field} /></label>
      <label className="block text-sm font-medium">WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
      <label className="block text-sm font-medium">Chave Pix para saque (pode preencher depois)<input name="pixKey" autoComplete="off" className={field} /><span className="mt-1 block text-xs text-neutral-600">Precisa ser do mesmo CPF/CNPJ do cadastro.</span></label>
      <label className="flex items-start gap-2 text-sm"><input name="terms" type="checkbox" required className="mt-1 size-4" /> <span>Li e aceito os <Link href="/parceiros/termos" target="_blank" className="font-semibold underline">termos do programa</Link> (versão {termsVersion}).</span></label>
      {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      <button type="submit" disabled={pending} className={primary}>{pending ? "Criando sua conta…" : "Criar minha conta de parceiro"}</button>
    </form>
  );
}

function InterestForm({ kind }: { kind: Exclude<Kind, "AFFILIATE"> }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  if (done) return <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-900">Recebemos o seu contato! Quando o programa para {kind === "AGENCY" ? "agências" : "desenvolvedores"} abrir, avisamos você primeiro.</p>;
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); setError(null);
      start(async () => {
        const r = await submitLeadAction({ name: String(f.get("name")), email: String(f.get("email")), phone: String(f.get("phone")), storeName: String(f.get("company") ?? "") || undefined, segment: kind === "AGENCY" ? "PARCEIRO_AGENCIA" : "PARCEIRO_DEV", message: String(f.get("message") ?? "") || undefined });
        if (r.ok) setDone(true); else setError(r.error);
      });
    }}>
      <p className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">O programa para {kind === "AGENCY" ? "agências" : "desenvolvedores freelancers"} <b>ainda não abriu</b>. Deixe o seu contato e a NextLevel fala com você quando as regras estiverem prontas.</p>
      <label className="block text-sm font-medium">Nome completo<input name="name" required minLength={3} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-medium">E-mail<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="block text-sm font-medium">WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
      <label className="block text-sm font-medium">{kind === "AGENCY" ? "Nome da agência" : "Portfólio ou site (opcional)"}<input name="company" className={field} /></label>
      <label className="block text-sm font-medium">Conte um pouco sobre você (opcional)<textarea name="message" rows={3} maxLength={600} className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]" /></label>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      <button type="submit" disabled={pending} className={primary}>{pending ? "Enviando…" : "Quero ser avisado"}</button>
    </form>
  );
}

export function PartnerSignupForm({ termsVersion }: { termsVersion: string }) {
  const [kind, setKind] = React.useState<Kind>("AFFILIATE");
  const current = KINDS.find((k) => k.key === kind)!;
  return (
    <div>
      <fieldset>
        <legend className="text-sm font-medium text-neutral-800">Como você quer participar?</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de parceiro">
          {KINDS.map((k) => (
            <button key={k.key} type="button" role="radio" aria-checked={kind === k.key} onClick={() => setKind(k.key)}
              className={`h-11 rounded-xl px-4 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] ${kind === k.key ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"}`}>{k.label}</button>
          ))}
        </div>
        <p className="mt-2 text-sm text-neutral-600">{current.hint}</p>
      </fieldset>
      <div className="mt-6">{kind === "AFFILIATE" ? <AffiliateForm termsVersion={termsVersion} /> : <InterestForm key={kind} kind={kind} />}</div>
    </div>
  );
}
