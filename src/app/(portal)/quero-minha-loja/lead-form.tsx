"use client";
import * as React from "react";
import { submitLeadAction } from "@/app/actions/leads";

const field = "mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

export function LeadForm({ brandName, accent }: { brandName: string; accent: string }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  if (done) return <div role="status" className="mt-8 rounded-xl border border-border bg-surface-muted p-6"><h2 className="text-lg font-bold">Recebemos o seu contato!</h2><p className="mt-2 text-sm text-body">A equipe da {brandName} fala com você pelo WhatsApp em até 1 dia útil. Enviamos também uma confirmação por e-mail.</p></div>;
  return (
    <form className="mt-8 space-y-4" onSubmit={(e) => {
      e.preventDefault(); setError(null); const f = new FormData(e.currentTarget);
      start(async () => { const r = await submitLeadAction({ name: String(f.get("name")), email: String(f.get("email")), phone: String(f.get("phone")), storeName: String(f.get("storeName") ?? "") || undefined, segment: String(f.get("segment") ?? "") || undefined, message: String(f.get("message") ?? "") || undefined }); if (r.ok) setDone(true); else setError(r.error); });
    }}>
      <label className="block text-sm font-medium">Seu nome<input name="name" required minLength={3} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-medium">E-mail<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="block text-sm font-medium">WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
      <label className="block text-sm font-medium">Nome da loja ou marca (opcional)<input name="storeName" className={field} /></label>
      <label className="block text-sm font-medium">O que você vende? (opcional)<input name="segment" placeholder="Ex.: moda feminina, atacado de camisas…" className={field} /></label>
      <label className="block text-sm font-medium">Quer contar mais alguma coisa? (opcional)<textarea name="message" rows={3} maxLength={600} className={`${field} h-auto py-2`} /></label>
      {error ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-lg px-5 text-base font-semibold text-band-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" style={{ background: accent }}>{pending ? "Enviando…" : "Enviar"}</button>
      <p className="text-xs text-muted-foreground">Usamos seus dados só para falar sobre a sua loja. Você pode pedir a exclusão a qualquer momento.</p>
    </form>
  );
}
