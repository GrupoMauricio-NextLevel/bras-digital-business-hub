"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { decidirDesligadoAction } from "@/app/actions/qualidade";
import { DECISOES, ROTULO_DECISAO, mesDe, type RegistroDecisao, type Sugestao } from "@/lib/revisao-desligados-base";

/** Sugestão + decisão do mês de um item desligado (R4). Registrar não liga nada. */
export function DecisaoDesligado({ itemKey, titulo, sugestao, decisao }: { itemKey: string; titulo: string; sugestao?: Sugestao; decisao?: RegistroDecisao }) {
  const router = useRouter();
  const [escolha, setEscolha] = React.useState<string>(decisao?.decisao ?? sugestao?.decisao ?? "MANTER");
  const [nota, setNota] = React.useState(decisao?.nota ?? "");
  const [pending, start] = React.useTransition();
  const doMes = decisao?.mes === mesDe(new Date());
  const salvar = () => start(async () => {
    const r = await decidirDesligadoAction(itemKey, escolha, nota);
    if (!r.ok) toast.error(r.error ?? "Não foi possível registrar."); else { toast.success("Decisão registrada."); router.refresh(); }
  });
  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-border p-2 text-sm sm:col-span-2">
      {sugestao ? <p><span className="font-semibold">Sugestão: {ROTULO_DECISAO[sugestao.decisao]}.</span> <span className="text-muted-foreground">{sugestao.porque}</span></p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`dec-${itemKey}`}>Decisão do mês para {titulo}</label>
        <select id={`dec-${itemKey}`} className="ds-input h-9 w-auto" value={escolha} onChange={(e) => setEscolha(e.target.value)} disabled={pending}>
          {DECISOES.map((d) => <option key={d} value={d}>{ROTULO_DECISAO[d]}</option>)}
        </select>
        <label className="sr-only" htmlFor={`nota-${itemKey}`}>Anotação</label>
        <input id={`nota-${itemKey}`} className="ds-input h-9 min-w-0 flex-1" placeholder="Anotação (opcional)" maxLength={400} value={nota} onChange={(e) => setNota(e.target.value)} disabled={pending} />
        <button type="button" className="ds-btn ds-btn--secondary ds-btn--sm" onClick={salvar} disabled={pending}>{pending ? "Salvando…" : "Registrar decisão"}</button>
        {doMes ? <span className="text-xs text-success">Decidido este mês: {ROTULO_DECISAO[decisao!.decisao]}</span> : <span className="text-xs text-warning">Sem decisão este mês</span>}
      </div>
    </div>
  );
}
