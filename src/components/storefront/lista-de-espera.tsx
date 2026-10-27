"use client";
import * as React from "react";
import { entrarNaListaDeEsperaAction } from "@/app/actions/storefront";

/** Loja em lançamento (D187): "abrimos em breve" com a lista de espera (só com o consentimento de quem deixa o e-mail). */
export function ListaDeEspera({ slug, loja }: { slug: string; loja: string }) {
  const [email, setEmail] = React.useState("");
  const [sim, setSim] = React.useState(false);
  const [estado, setEstado] = React.useState<"" | "ok" | string>("");
  const [pending, start] = React.useTransition();
  return (
    <section aria-labelledby="espera-t" className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 id="espera-t" className="text-3xl font-semibold tracking-tight">{loja} abre em breve</h1>
      <p className="mt-3 text-neutral-600">Deixe o seu e-mail e avisamos assim que a loja abrir.</p>
      {estado === "ok" ? <p role="status" className="mt-8 rounded-xl bg-neutral-100 p-4 text-sm">Pronto! Você vai receber o aviso da abertura.</p> : (
        <form className="mt-8 space-y-3 text-left" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await entrarNaListaDeEsperaAction(slug, { email, consent: sim }); setEstado(r.ok ? "ok" : r.error); }); }}>
          <label className="block text-sm font-medium">E-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" /></label>
          <label className="flex items-start gap-2 text-xs text-neutral-600"><input type="checkbox" className="mt-0.5" checked={sim} onChange={(e) => setSim(e.target.checked)} /> Aceito receber o aviso de abertura da {loja} por e-mail.</label>
          {estado && estado !== "ok" ? <p role="alert" className="text-sm text-red-700">{estado}</p> : null}
          <button type="submit" disabled={pending} className="h-11 w-full rounded-full px-6 text-sm font-semibold disabled:opacity-60" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{pending ? "Enviando…" : "Quero ser avisado"}</button>
        </form>
      )}
    </section>
  );
}
