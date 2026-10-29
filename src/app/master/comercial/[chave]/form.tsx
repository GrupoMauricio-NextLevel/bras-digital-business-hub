"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { salvarAcompanhamentoAction } from "@/app/actions/comercial";

/** Próxima ação, prazo, notas, "assumir" e "perdido" (D202). */
export function FormAcompanhamento(p: { chave: string; proximaAcao: string; prazo: string; notas: string; perdido: boolean; temResponsavel: boolean }) {
  const router = useRouter();
  const [proximaAcao, setProx] = React.useState(p.proximaAcao);
  const [prazo, setPrazo] = React.useState(p.prazo);
  const [notas, setNotas] = React.useState(p.notas);
  const [pending, start] = React.useTransition();
  const salvar = (extra: { assumir?: boolean; perdido?: boolean } = {}, ok = "Salvo") => start(async () => {
    const r = await salvarAcompanhamentoAction(p.chave, { proximaAcao, prazo: prazo || null, notas, ...extra });
    if (!r.ok) toast.error(r.error); else { toast.success(ok); router.refresh(); }
  });
  return (
    <section className="ds-card text-sm" aria-labelledby="acomp-t">
      <h2 id="acomp-t" className="mb-3 text-lg font-bold">Acompanhamento</h2>
      <label className="block font-semibold" htmlFor="prox">Próxima ação</label>
      <input id="prox" value={proximaAcao} onChange={(e) => setProx(e.target.value)} placeholder="Ex.: ligar para ajudar no Mercado Pago" className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      <label className="mt-3 block font-semibold" htmlFor="prazo">Até quando</label>
      <input id="prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      <label className="mt-3 block font-semibold" htmlFor="notas">Notas da equipe</label>
      <textarea id="notas" rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="O que combinaram, objeções, detalhes do negócio…" className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => salvar()} className="ds-btn ds-btn--sm">Salvar</button>
        {!p.temResponsavel ? <button type="button" disabled={pending} onClick={() => salvar({ assumir: true }, "Agora este cliente é seu")} className="ds-btn ds-btn--sm ds-btn--secondary">Assumir este cliente</button> : null}
        <button type="button" disabled={pending} onClick={() => salvar({ perdido: !p.perdido }, p.perdido ? "Voltou ao funil" : "Marcado como perdido")} className="ds-btn ds-btn--sm ds-btn--quiet">{p.perdido ? "Voltar ao funil" : "Marcar como perdido"}</button>
      </div>
    </section>
  );
}
