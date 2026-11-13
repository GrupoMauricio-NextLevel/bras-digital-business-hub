"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginAction, loginSegundaEtapaAction, reenviarCodigoAction } from "@/app/actions/auth";

export function LoginForm({ voltar }: { voltar?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  // Duas etapas (D183): depois da senha certa, o servidor devolve um bilhete e pede o código do aplicativo.
  const [bilhete, setBilhete] = React.useState<string | null>(null);
  const [codigo, setCodigo] = React.useState("");
  // D286: sem o aplicativo, o código chega por e-mail a cada entrada.
  const [via, setVia] = React.useState<{ tipo: "app" | "email"; email?: string }>({ tipo: "app" });
  const entrar = (redirectTo: string) => { toast.success("Bem-vindo!"); router.push(voltar && redirectTo.startsWith("/merchant") ? voltar : redirectTo); router.refresh(); };
  const field = "mt-1 h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]";
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          if (bilhete) {
            const r = await loginSegundaEtapaAction({ bilhete, codigo });
            if (r.ok) entrar(r.data.redirectTo); else setError(r.error);
            return;
          }
          const r = await loginAction({ email, password });
          if (!r.ok) setError(r.error);
          else if ("segundaEtapa" in r.data && r.data.segundaEtapa) { setBilhete(r.data.segundaEtapa); setVia({ tipo: r.data.via ?? "app", email: "emailMascarado" in r.data ? r.data.emailMascarado : undefined }); }
          else entrar(r.data.redirectTo);
        });
      }}
    >
      {bilhete ? (
        <>
          {via.tipo === "email"
            ? <p className="text-sm text-body">Para a sua segurança, enviamos um código de 6 números para <b>{via.email}</b>. Ele vale por 10 minutos. Não chegou? Olhe também o spam.</p>
            : <p className="text-sm text-body">Abra o aplicativo autenticador no celular e digite o código de 6 números da NextLevel. Sem o celular, use um dos códigos de recuperação.</p>}
          <label htmlFor="codigo" className="block text-sm font-medium text-foreground">Código de verificação<input id="codigo" inputMode="numeric" autoComplete="one-time-code" autoFocus required value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-describedby={error ? "login-error" : undefined} className={field} /></label>
          {error ? <p id="login-error" role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
          <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--brand-signal)] px-6 text-base font-semibold text-[var(--brand-on-signal)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] disabled:opacity-60">{pending ? "Conferindo…" : "Confirmar"}</button>
          {via.tipo === "email" ? <p className="text-center text-sm"><button type="button" disabled={pending} onClick={() => start(async () => { setError(null); const r = await reenviarCodigoAction(bilhete); if (r.ok) { setBilhete(r.data.bilhete); setCodigo(""); toast.success("Enviamos um código novo."); } else setError(r.error); })} className="font-medium text-body underline underline-offset-2">Enviar outro código</button></p> : null}
          <p className="text-center text-sm"><button type="button" onClick={() => { setBilhete(null); setCodigo(""); setError(null); }} className="font-medium text-body underline underline-offset-2">Voltar e entrar com outra conta</button></p>
        </>
      ) : <>
      <label htmlFor="email" className="block text-sm font-medium text-foreground">E-mail<input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></label>
      <label htmlFor="password" className="block text-sm font-medium text-foreground">Senha<input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={error ? "login-error" : undefined} className={field} /></label>
      {error ? <p id="login-error" role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--brand-signal)] px-6 text-base font-semibold text-[var(--brand-on-signal)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] disabled:opacity-60">{pending ? "Entrando…" : "Entrar"}</button>
      <p className="text-center text-sm"><Link href="/esqueci-senha" className="font-medium text-body underline underline-offset-2">Esqueci a minha senha</Link></p>
      </>}
    </form>
  );
}
