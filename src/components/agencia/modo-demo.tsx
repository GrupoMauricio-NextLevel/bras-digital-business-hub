"use client";
import * as React from "react";
import { toast } from "sonner";
import { desligarModoDemoAction, ligarModoDemoAction } from "@/app/actions/solucoes-agencia";

/**
 * Chave do Modo demonstração (D326): ligada, abre a agência de demonstração com tudo em andamento; desligada, volta para a
 * agência real. A primeira vez leva alguns segundos (a demonstração é montada).
 */
export function ChaveModoDemo({ ligado }: { ligado: boolean }) {
  const [pending, start] = React.useTransition();
  const alternar = () => start(async () => {
    if (!ligado) toast.message("Montando a demonstração… leva alguns segundos na primeira vez.");
    const r = ligado ? await desligarModoDemoAction() : await ligarModoDemoAction();
    if (r.ok) window.location.assign(r.data.redirectTo); else toast.error(r.error);
  });
  // Discreta (pedido do dono): no fundo roxo do início é uma pílula transparente e pequena; ligada, na faixa amarela, usa o texto escuro da faixa.
  return (
    <button type="button" role="switch" aria-checked={ligado} disabled={pending} onClick={alternar}
      title={ligado ? "Voltar para a agência real" : "Ver o painel em pleno andamento, com equipe e clientes de demonstração. Desligue quando quiser."}
      className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-60 ${ligado ? "border-warning/50 bg-transparent" : "border-white/25 bg-white/10 text-current hover:bg-white/20"}`}>
      Modo demonstração
      <span aria-hidden className={`relative h-4 w-7 rounded-full transition-colors ${ligado ? "bg-[var(--ds-link)]" : "bg-white/25"}`}><span className={`absolute top-0.5 size-3 rounded-full bg-white shadow transition-all ${ligado ? "left-[14px]" : "left-0.5"}`} /></span>
      <span className="sr-only">{ligado ? "ligado" : "desligado"}</span>
      {pending ? <span className="opacity-80">{ligado ? "voltando…" : "abrindo…"}</span> : null}
    </button>
  );
}
