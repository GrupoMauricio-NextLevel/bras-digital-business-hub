"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { requestDiagnosticAction } from "@/app/actions/financeiro";
import { EVENTO_DIAGNOSTICO } from "@/components/portal/solucoes/selecao";

/** Diagnóstico gratuito: formulário curto, roteamento por necessidade e atribuição de parceiro (pelo cookie do proxy). */
export function DiagnosticoForm({ needs, inicial = [], mensagemInicial = "" }: { needs: [string, string][]; inicial?: string[]; mensagemInicial?: string }) {
  const [f, setF] = React.useState({ name: "", email: "", phone: "", company: "", stage: "COMECANDO", message: mensagemInicial, consent: false });
  const [picked, setPicked] = React.useState<string[]>(inicial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [routes, setRoutes] = React.useState<{ label: string; href: string }[] | null>(null);
  // Vitrine de Soluções (D162): "Enviar para o diagnóstico" preenche as necessidades e a mensagem com a seleção.
  React.useEffect(() => {
    const ok = new Set(needs.map(([k]) => k));
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ needs: string[]; mensagem: string }>).detail;
      setPicked((p) => [...new Set([...p, ...d.needs.filter((k) => ok.has(k))])].slice(0, 6));
      if (d.mensagem) setF((x) => ({ ...x, message: x.message ? `${x.message}\n${d.mensagem}` : d.mensagem }));
    };
    window.addEventListener(EVENTO_DIAGNOSTICO, on);
    return () => window.removeEventListener(EVENTO_DIAGNOSTICO, on);
  }, [needs]);
  if (routes) return (
    <div role="status" className="rounded-xl border border-border bg-surface p-6">
      <p className="text-lg font-semibold">Recebemos seu pedido de diagnóstico.</p>
      <p className="mt-1 text-sm text-muted-foreground">A equipe NextLevel responde pelo WhatsApp ou e-mail informado. Enquanto isso, veja por onde começar:</p>
      <ul className="mt-3 flex flex-wrap gap-2">{routes.map((r) => <li key={r.href}><Link href={r.href} className="ds-pill ds-pill--outline">{r.label}</Link></li>)}</ul>
    </div>
  );
  return (
    <form className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:p-6" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError(null);
      const r = await requestDiagnosticAction({ name: f.name, email: f.email, phone: f.phone, company: f.company || undefined, stage: f.stage as never, needs: picked as never, message: f.message || undefined, consent: f.consent as true });
      setBusy(false);
      if (r.ok) setRoutes(r.data.routes); else setError(r.error);
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Nome" htmlFor="dg-n"><Input id="dg-n" autoComplete="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
        <FormField label="E-mail" htmlFor="dg-e"><Input id="dg-e" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></FormField>
        <FormField label="WhatsApp com DDD" htmlFor="dg-p"><Input id="dg-p" type="tel" autoComplete="tel" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></FormField>
        <FormField label="Empresa ou marca (opcional)" htmlFor="dg-c"><Input id="dg-c" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></FormField>
        <FormField label="Momento do negócio" htmlFor="dg-s"><Select id="dg-s" value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}><option value="IDEIA">Ainda é uma ideia</option><option value="COMECANDO">Começando a vender</option><option value="VENDENDO">Já vendo todo mês</option><option value="ESCALANDO">Quero escalar</option></Select></FormField>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Do que você precisa? (marque até 6)</legend>
        <div className="grid gap-2 sm:grid-cols-2">{needs.map(([k, l]) => <label key={k} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={picked.includes(k)} onChange={(e) => setPicked(e.target.checked ? [...picked, k].slice(0, 6) : picked.filter((x) => x !== k))} /> {l}</label>)}</div>
      </fieldset>
      <FormField label="Quer contar mais? (opcional)" htmlFor="dg-m"><Textarea id="dg-m" rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></FormField>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /> Concordo em receber o contato da NextLevel sobre este diagnóstico. Meus dados não são vendidos nem compartilhados.</label>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div><Button type="submit" size="lg" loading={busy} disabled={!picked.length || !f.consent}>Pedir diagnóstico gratuito</Button></div>
    </form>
  );
}
