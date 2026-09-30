"use client";
import * as React from "react";
import Link from "next/link";
import { registerPartnerAction } from "@/app/actions/partners";

const field = "mt-1 h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b45309]";

export function PartnerSignupForm({ termsVersion }: { termsVersion: string }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form className="mt-8 space-y-4" onSubmit={(e) => {
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
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#b45309] px-5 text-base font-semibold text-white hover:bg-[#92400e] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309]">{pending ? "Criando sua conta…" : "Criar minha conta de parceiro"}</button>
    </form>
  );
}
