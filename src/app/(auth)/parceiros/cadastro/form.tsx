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

const field = "mt-1 h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]";
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
      <label className="block text-sm font-medium">Chave Pix para saque (pode preencher depois)<input name="pixKey" autoComplete="off" className={field} /><span className="mt-1 block text-xs text-muted-foreground">Precisa ser do mesmo CPF/CNPJ do cadastro.</span></label>
      <label className="flex items-start gap-2 text-sm"><input name="terms" type="checkbox" required className="mt-1 size-4" /> <span>Li e aceito os <Link href="/parceiros/termos" target="_blank" className="font-semibold underline">termos do programa</Link> (versão {termsVersion}).</span></label>
      {error ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className={primary}>{pending ? "Criando sua conta…" : "Criar minha conta de parceiro"}</button>
    </form>
  );
}

function InterestForm({ kind }: { kind: Exclude<Kind, "AFFILIATE"> }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  if (done) return <p role="status" className="rounded-xl bg-success-soft p-4 text-sm text-success">Recebemos o seu contato! Quando o programa para {kind === "AGENCY" ? "agências" : "desenvolvedores"} abrir, avisamos você primeiro.</p>;
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); setError(null);
      start(async () => {
        const r = await submitLeadAction({ name: String(f.get("name")), email: String(f.get("email")), phone: String(f.get("phone")), storeName: String(f.get("company") ?? "") || undefined, segment: kind === "AGENCY" ? "PARCEIRO_AGENCIA" : "PARCEIRO_DEV", message: String(f.get("message") ?? "") || undefined });
        if (r.ok) setDone(true); else setError(r.error);
      });
    }}>
      <p className="rounded-xl bg-surface-muted p-3 text-sm text-body">O programa para {kind === "AGENCY" ? "agências" : "desenvolvedores freelancers"} <b>ainda não abriu</b>. Deixe o seu contato e a NextLevel fala com você quando as regras estiverem prontas.</p>
      <label className="block text-sm font-medium">Nome completo<input name="name" required minLength={3} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-medium">E-mail<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="block text-sm font-medium">WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
      <label className="block text-sm font-medium">{kind === "AGENCY" ? "Nome da agência" : "Portfólio ou site (opcional)"}<input name="company" className={field} /></label>
      <label className="block text-sm font-medium">Conte um pouco sobre você (opcional)<textarea name="message" rows={3} maxLength={600} className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]" /></label>
      {error ? <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className={primary}>{pending ? "Enviando…" : "Quero ser avisado"}</button>
    </form>
  );
}

export function PartnerSignupForm({ termsVersion }: { termsVersion: string }) {
  // Só o programa de afiliados está aberto: agência e desenvolvedor ficam num link de lista de espera, fora da escolha principal (v4).
  const [kind, setKind] = React.useState<Kind>("AFFILIATE");
  const other = KINDS.filter((k) => k.key !== "AFFILIATE");
  const link = "font-semibold text-foreground underline underline-offset-2 hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)]";
  if (kind !== "AFFILIATE") {
    return (
      <div>
        <p className="text-sm text-muted-foreground"><button type="button" onClick={() => setKind("AFFILIATE")} className={link}>← Voltar para o cadastro de afiliado</button></p>
        <div className="mt-4"><InterestForm key={kind} kind={kind} /></div>
      </div>
    );
  }
  return (
    <div>
      <p className="rounded-xl bg-surface-muted p-3 text-sm text-body"><b className="text-foreground">Programa de afiliados.</b> {KINDS[0]!.hint}</p>
      <div className="mt-6"><AffiliateForm termsVersion={termsVersion} /></div>
      <p className="mt-6 text-sm text-muted-foreground">Agência ou desenvolvedor? Esses programas ainda não abriram:{" "}
        {other.map((k, n) => <React.Fragment key={k.key}>{n ? " ou " : ""}<button type="button" onClick={() => setKind(k.key)} className={link}>entre na lista como {k.key === "AGENCY" ? "agência" : "desenvolvedor"}</button></React.Fragment>)}.
      </p>
    </div>
  );
}
