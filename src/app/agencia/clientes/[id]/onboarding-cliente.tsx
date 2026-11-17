"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { marcarOnboardingAction } from "@/app/actions/agencias";

/** Lista de onboarding (D317): itens manuais marcam com um toque; os automáticos seguem os dados da ficha. */
export function Onboarding({ clienteId, itens, pode }: { clienteId: string; itens: { chave: string; rotulo: string; automatico: boolean; feito: boolean }[]; pode: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <ul className="space-y-1">
      {itens.map((i) => (
        <li key={i.chave}>
          <label className={`flex min-h-11 items-center gap-2 text-sm ${i.feito ? "text-muted-foreground" : ""}`}>
            <input type="checkbox" className="size-4" checked={i.feito} disabled={i.automatico || !pode || pending}
              onChange={(e) => start(async () => { const r = await marcarOnboardingAction(clienteId, i.chave, e.target.checked); if (r.ok) router.refresh(); else toast.error(r.error); })} />
            <span className={i.feito ? "line-through" : ""}>{i.rotulo}</span>
            {i.automatico ? <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px]">automático</span> : null}
          </label>
        </li>
      ))}
    </ul>
  );
}
