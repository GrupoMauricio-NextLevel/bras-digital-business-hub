"use client";
import * as React from "react";
import { toast } from "sonner";
import { salvarSumulaAction } from "@/app/actions/placar";
import { DEGRAUS_PLACAR, NOME_DEGRAU, type Sumula } from "@/lib/marcas/placar-seed";

/**
 * Editor da súmula: um time por vez (NextLevel ou um concorrente), uma linha por lance, um campo por plano.
 * Vale escrever número ("0,99", "300"), "sem limite", "sim", "não" ou deixar vazio (não divulga = não vale gol).
 */
export function EditorSumula({ inicial }: { inicial: Sumula }) {
  const [s, setS] = React.useState(inicial);
  const [time, setTime] = React.useState("nextlevel");
  const [busy, setBusy] = React.useState(false);
  const rival = s.rivais.find((r) => r.key === time);
  const mudar = (item: number, d: (typeof DEGRAUS_PLACAR)[number], v: string) => setS((x) => {
    const n = structuredClone(x);
    const it = n.itens[item]!;
    if (time === "nextlevel") it.nextlevel[d] = v; else (it.rivais[time] ??= { entrada: "", intermediario: "", avancado: "" })[d] = v;
    return n;
  });
  const mudarRival = (campo: "nome" | "fonte", v: string) => setS((x) => ({ ...x, rivais: x.rivais.map((r) => (r.key === time ? { ...r, [campo]: v } : r)) }));
  const mudarPlano = (d: (typeof DEGRAUS_PLACAR)[number], v: string) => setS((x) => ({ ...x, rivais: x.rivais.map((r) => (r.key === time ? { ...r, planos: { ...r.planos, [d]: v } } : r)) }));
  const salvar = async () => {
    setBusy(true);
    const r = await salvarSumulaAction(s);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    if (r.data.sairamDoAr.length) toast.warning(`Atenção: deixaram de ser vitória e saíram do ar: ${r.data.sairamDoAr.join("; ")}`);
    else toast.success("Súmula salva. O placar do site já foi recalculado.");
  };
  return (
    <div className="ds-card space-y-5 p-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Time">
        {[{ key: "nextlevel", nome: "NextLevel" }, ...s.rivais].map((t) => <button key={t.key} type="button" aria-pressed={time === t.key} onClick={() => setTime(t.key)} className={`ds-btn ds-btn--sm ${time === t.key ? "" : "ds-btn--ghost"}`}>{t.nome}</button>)}
      </div>
      {rival ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold">Nome<input value={rival.nome} onChange={(e) => mudarRival("nome", e.target.value)} className="ds-input mt-1 w-full" /></label>
          <label className="block text-sm font-semibold">Fonte (link oficial)<input value={rival.fonte} onChange={(e) => mudarRival("fonte", e.target.value)} className="ds-input mt-1 w-full" /></label>
          {DEGRAUS_PLACAR.map((d) => <label key={d} className="block text-sm font-semibold">{NOME_DEGRAU[d]}: nome do plano<input value={rival.planos[d]} onChange={(e) => mudarPlano(d, e.target.value)} className="ds-input mt-1 w-full" /></label>)}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">Valores de {rival?.nome ?? "NextLevel"} por plano</caption>
          <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-3">Lance</th>{DEGRAUS_PLACAR.map((d) => <th key={d} className="py-2 pr-3">{NOME_DEGRAU[d]}</th>)}</tr></thead>
          <tbody>{s.itens.map((it, i) => (
            <tr key={it.key} className="border-t border-border">
              <th scope="row" className="py-2 pr-3 text-left font-medium">{it.minuto}&apos; {it.lance}<span className="block text-xs font-normal text-muted-foreground">{it.regra === "maior" ? "maior vence" : "menor vence"}{it.unidade ? ` · em ${it.unidade}` : ""}</span></th>
              {DEGRAUS_PLACAR.map((d) => <td key={d} className="py-2 pr-3"><input aria-label={`${it.lance}, ${NOME_DEGRAU[d]}`} value={time === "nextlevel" ? it.nextlevel[d] : it.rivais[time]?.[d] ?? ""} onChange={(e) => mudar(i, d, e.target.value)} placeholder="não divulga" className="ds-input w-full" /></td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <button type="button" disabled={busy} onClick={salvar} className="ds-btn">{busy ? "Salvando…" : "Salvar a súmula e recalcular o placar"}</button>
    </div>
  );
}
