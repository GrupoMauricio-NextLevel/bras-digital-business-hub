"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { requestPasswordResetAction } from "@/app/actions/auth";

export function ForgotForm() {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ demoLink: string | null } | null>(null);
  if (done) return (
    <div role="status" className="mt-6 space-y-3 rounded-lg border border-border bg-surface p-4 text-sm">
      <p>Se existir uma conta com este e-mail, você receberá o link em instantes. Confira também o spam.</p>
      {done.demoLink ? <p className="rounded bg-warning-soft px-2 py-1 text-xs text-warning">Demonstração: o e-mail não é enviado. <Link className="font-semibold underline" href={done.demoLink}>Abrir o link de redefinição</Link></p> : null}
    </div>
  );
  return (
    <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); const email = String(new FormData(e.currentTarget).get("email") ?? ""); setError(null); start(async () => { const r = await requestPasswordResetAction(email); if (r.ok) setDone(r.data); else setError(r.error); }); }}>
      <FormField label="E-mail" htmlFor="fg-email" error={error ?? undefined}><Input id="fg-email" name="email" type="email" required autoComplete="email" /></FormField>
      <Button type="submit" className="w-full" loading={pending}>Enviar link de redefinição</Button>
    </form>
  );
}
