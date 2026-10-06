"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({ voltar }: { voltar?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const field = "mt-1 h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]";
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await loginAction({ email, password });
          if (r.ok) { toast.success("Bem-vindo!"); router.push(voltar && r.data.redirectTo.startsWith("/merchant") ? voltar : r.data.redirectTo); router.refresh(); } else setError(r.error);
        });
      }}
    >
      <label htmlFor="email" className="block text-sm font-medium text-foreground">E-mail<input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></label>
      <label htmlFor="password" className="block text-sm font-medium text-foreground">Senha<input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={error ? "login-error" : undefined} className={field} /></label>
      {error ? <p id="login-error" role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--brand-signal)] px-6 text-base font-semibold text-[var(--brand-on-signal)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] disabled:opacity-60">{pending ? "Entrando…" : "Entrar"}</button>
      <p className="text-center text-sm"><Link href="/esqueci-senha" className="font-medium text-body underline underline-offset-2">Esqueci a minha senha</Link></p>
    </form>
  );
}
