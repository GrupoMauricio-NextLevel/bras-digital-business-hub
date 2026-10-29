"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { salvarAcompanhamentoLojaAction } from "@/app/actions/crm-loja";

/** Próxima ação, prazo e notas do cliente da loja (D207). */
export function FormAcompanhamentoLoja(p: { chave: string; proximaAcao: string; prazo: string; notas: string }) {
  const router = useRouter();
  const [proximaAcao, setProx] = React.useState(p.proximaAcao);
  const [prazo, setPrazo] = React.useState(p.prazo);
  const [notas, setNotas] = React.useState(p.notas);
  const [pending, start] = React.useTransition();
  const salvar = () => start(async () => {
    const r = await salvarAcompanhamentoLojaAction(p.chave, { proximaAcao, prazo: prazo || null, notas });
    if (!r.ok) toast.error(r.error); else { toast.success("Salvo"); router.refresh(); }
  });
  return (
    <section className="ds-card text-sm" aria-labelledby="acomp-t">
      <h2 id="acomp-t" className="mb-3 text-lg font-bold">Acompanhamento</h2>
      <label className="block font-semibold" htmlFor="prox">Próxima ação</label>
      <input id="prox" value={proximaAcao} onChange={(e) => setProx(e.target.value)} placeholder="Ex.: mandar o cupom de volta" className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      <label className="mt-3 block font-semibold" htmlFor="prazo">Até quando</label>
      <input id="prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      <label className="mt-3 block font-semibold" htmlFor="notas">Notas</label>
      <textarea id="notas" rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Tamanho que usa, preferências, o que combinaram…" className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      <button type="button" disabled={pending} onClick={salvar} className="ds-btn ds-btn--sm mt-3">Salvar</button>
    </section>
  );
}
