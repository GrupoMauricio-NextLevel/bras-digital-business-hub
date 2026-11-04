"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { entrarClienteAction, pedirCodigoClienteAction, sairClienteAction } from "@/app/actions/conta-cliente";

const campo = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900";
const botao = "h-11 w-full rounded-lg px-6 text-sm font-medium disabled:opacity-60";
const cor = { background: "var(--sf-primary)", color: "var(--sf-on-primary)" };

/** Entrada sem senha (D240): e-mail → código de 6 dígitos → conta. */
export function EntrarConta({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [codigo, setCodigo] = React.useState("");
  const [enviado, setEnviado] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const pedir = (e: React.FormEvent) => { e.preventDefault(); setErro(null); start(async () => { const r = await pedirCodigoClienteAction(slug, email); if (r.ok) setEnviado(true); else setErro(r.error); }); };
  const entrar = (e: React.FormEvent) => { e.preventDefault(); setErro(null); start(async () => { const r = await entrarClienteAction(slug, email, codigo); if (r.ok) router.refresh(); else setErro(r.error); }); };
  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
      {!enviado ? (
        <form onSubmit={pedir} className="grid gap-3" aria-label="Receber código">
          <label className="text-sm font-medium">Seu e-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className={`${campo} mt-1`} /></label>
          <button className={botao} style={cor} disabled={pending}>{pending ? "Enviando…" : "Receber código"}</button>
        </form>
      ) : (
        <form onSubmit={entrar} className="grid gap-3" aria-label="Entrar com o código">
          <p className="text-sm text-neutral-600">Mandamos um código de 6 dígitos para <b>{email}</b>. Ele vale por 10 minutos.</p>
          <label className="text-sm font-medium">Código<input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={`${campo} mt-1 text-center font-mono text-lg tracking-[0.4em]`} /></label>
          <button className={botao} style={cor} disabled={pending || codigo.length !== 6}>{pending ? "Entrando…" : "Entrar"}</button>
          <button type="button" className="text-sm underline" onClick={() => { setEnviado(false); setCodigo(""); }}>Usar outro e-mail</button>
        </form>
      )}
      {erro ? <p role="alert" className="mt-3 text-sm text-red-700">{erro}</p> : null}
    </div>
  );
}

export function SairConta({ slug }: { slug: string }) {
  const router = useRouter();
  return <button type="button" className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium" onClick={async () => { await sairClienteAction(slug); router.refresh(); }}>Sair</button>;
}
