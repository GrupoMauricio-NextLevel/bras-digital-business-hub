"use client";
import * as React from "react";
import { toast } from "sonner";
import { salvarCampanhaBlackAction } from "@/app/actions/black";

/** Formulário da Black: ligar/desligar, prorrogar (nunca encurtar) e a chamada da faixa. */
/** A data é sempre de Brasília (UTC−3), seja qual for o fuso do computador de quem edita. */
const local = (iso: string) => new Date(Date.parse(iso) - 3 * 3_600_000).toISOString().slice(0, 16);
const paraIso = (v: string) => new Date(`${v}:59-03:00`).toISOString();

export function FormBlack({ ativa, fim, chamada }: { ativa: boolean; fim: string; chamada: string }) {
  const [on, setOn] = React.useState(ativa);
  const [quando, setQuando] = React.useState(local(fim));
  const [texto, setTexto] = React.useState(chamada);
  const [busy, setBusy] = React.useState(false);
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const r = await salvarCampanhaBlackAction({ ativa: on, fim: paraIso(quando), chamada: texto });
    setBusy(false);
    if (r.ok) toast.success(r.data.ativa ? "Black salva. A contagem de todo o site já usa o novo fim." : "Black desligada. As faixas somem do site e dos painéis."); else toast.error(r.error);
  };
  return (
    <form onSubmit={salvar} className="ds-card space-y-5 p-6">
      <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-5" />Black ligada (faixa e contagem em todo o site e nos painéis)</label>
      <label className="block"><span className="text-sm font-semibold">Termina em (horário de Brasília)</span>
        <input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} className="ds-input mt-1 w-full max-w-xs" required />
        <span className="mt-1 block text-xs text-muted-foreground">Só dá para prorrogar: uma data antes do fim anunciado é ignorada. Prorrogar move junto a virada para o preço depois da Black.</span>
      </label>
      <label className="block"><span className="text-sm font-semibold">Chamada da faixa</span>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={140} className="ds-input mt-1 w-full" required />
      </label>
      <button type="submit" disabled={busy} className="ds-btn">{busy ? "Salvando…" : "Salvar a Black"}</button>
    </form>
  );
}
