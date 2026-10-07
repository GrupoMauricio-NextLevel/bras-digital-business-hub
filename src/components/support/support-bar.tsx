"use client";

import { LifeBuoy, LogOut, ShieldAlert } from "lucide-react";
import { enableSupportActingAfterConfirm, exitSupportAction } from "@/app/actions/support";

/** Faixa fixa do modo suporte: quem está vendo, como, por quê, até quando, e as saídas. */
export function SupportBar({ clientName, roleLabel, operatorName, reason, act, until }: { clientName: string; roleLabel: string; operatorName: string; reason: string; act: boolean; until: string }) {
  return (
    <div role="status" className={`ds-support-bar ${act ? "ds-support-bar--act" : ""}`}>
      <span className="inline-flex items-center gap-2 font-bold">{act ? <ShieldAlert className="size-4" aria-hidden /> : <LifeBuoy className="size-4" aria-hidden />}{act ? "Agindo em nome de" : "Modo suporte · vendo como"} {clientName}</span>
      <span className="ds-support-meta">{roleLabel} · por {operatorName} · motivo: “{reason}” · até {until}{act ? "" : " · somente leitura"}</span>
      <span className="ml-auto flex flex-wrap gap-2">
        {act ? null : (
          <form action={enableSupportActingAfterConfirm} onSubmit={(e) => { if (!confirm(`Liberar ações em nome de ${clientName}? Tudo o que você fizer fica registrado.`)) e.preventDefault(); }}>
            <button className="ds-btn ds-btn--sm ds-btn--secondary">Agir em nome do cliente</button>
          </form>
        )}
        <form action={exitSupportAction}><button className="ds-btn ds-btn--sm"><LogOut className="size-4" aria-hidden />Sair do modo suporte</button></form>
      </span>
    </div>
  );
}
