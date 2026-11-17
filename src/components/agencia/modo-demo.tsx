"use client";
import * as React from "react";
import { toast } from "sonner";
import { PlayCircle } from "lucide-react";
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
  return (
    <button type="button" role="switch" aria-checked={ligado} disabled={pending} onClick={alternar}
      className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${ligado ? "border-warning/50 bg-warning-soft" : "border-border bg-surface hover:border-[var(--ds-link)]"}`}>
      <PlayCircle className="size-4" aria-hidden />
      Modo demonstração
      <span aria-hidden className={`relative h-6 w-11 rounded-full transition-colors ${ligado ? "bg-[var(--ds-link)]" : "bg-surface-muted ring-1 ring-border"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`} /></span>
      <span className="sr-only">{ligado ? "ligado" : "desligado"}</span>
      {pending ? <span className="text-xs font-normal text-muted-foreground">{ligado ? "voltando…" : "abrindo…"}</span> : null}
    </button>
  );
}
